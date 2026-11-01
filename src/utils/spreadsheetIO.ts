/**
 * spreadsheetIO — อ่าน/เขียนไฟล์ .xlsx (SheetJS) และ .csv สำหรับ Import/Export มาสเตอร์ (เว็บ)
 *
 * SheetJS ติดตั้งจาก CDN ทางการ: https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
 * โหลดแบบ lazy (dynamic import) เฉพาะตอนใช้ .xlsx เพื่อไม่ให้ bundle หลักใหญ่ขึ้น
 */
import type * as XLSXTypes from 'xlsx';
import {
  MasterEntity, Workbook, MAX_FILE_BYTES,
  csvToWorkbook, workbookToCsv, parseNumber,
} from './masterImportExport';

export type FileFormat = 'xlsx' | 'csv';
export type XLSXModule = typeof XLSXTypes;

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const CSV_MIME = 'text/csv;charset=utf-8';
export const ACCEPT_FILES = '.xlsx,.xls,.csv';

/** ข้อผิดพลาดที่แสดงให้ผู้ใช้ได้ตรง ๆ (ข้อความภาษาไทย) */
export class ImportFileError extends Error {}

let xlsxPromise: Promise<XLSXModule> | null = null;
/**
 * โหลด SheetJS แบบ lazy — ใช้ build สำเร็จรูป dist/xlsx.full.min.js (ไม่มี require ของ fs/stream)
 * เพราะ entry หลักของแพ็กเกจคือ xlsx.mjs ซึ่ง metro.config.js (sourceExts) ไม่ได้รองรับ .mjs
 */
export function loadXlsx(): Promise<XLSXModule> {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx/dist/xlsx.full.min.js').then((m) => {
      const mod = m as XLSXModule & { default?: XLSXModule };
      return mod.utils ? mod : (mod.default as XLSXModule);
    });
    xlsxPromise.catch(() => { xlsxPromise = null; });
  }
  return xlsxPromise;
}

// ─── xlsx ─────────────────────────────────────────────────────────────────────
/** Workbook → bytes .xlsx — รหัส/บาร์โค้ดเขียนเป็นข้อความเสมอ (ไม่กลายเป็น 8.85E+12 / ไม่เสีย 0 นำหน้า) */
export function workbookToXlsxBytes(wb: Workbook, XLSX: XLSXModule): ArrayBuffer {
  const book = XLSX.utils.book_new();
  wb.sheets.forEach((sh) => {
    const numeric = new Set(sh.numericCols ?? []);
    const aoa: (string | number)[][] = sh.rows.map((r, ri) => r.map((c, ci) => {
      if (ri > 0 && numeric.has(ci) && c !== '') {
        const n = parseNumber(c);
        if (!Number.isNaN(n)) return n;
      }
      return c;
    }));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = (sh.rows[0] ?? []).map((h, ci) => ({
      wch: Math.min(60, Math.max(10, h.length + 4, ...sh.rows.slice(1, 50).map(r => (r[ci] ?? '').length + 2))),
    }));
    XLSX.utils.book_append_sheet(book, ws, sh.name.slice(0, 31));
  });
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

const cellToString = (c: unknown): string => {
  if (c === null || c === undefined) return '';
  if (typeof c === 'number') return Number.isInteger(c) ? String(c) : String(Number(c.toPrecision(15)));
  return String(c);
};

/** bytes .xlsx/.xls → Workbook (ทุกชีต, ทุกค่าเป็นข้อความ) */
export function xlsxBytesToWorkbook(buf: ArrayBuffer, XLSX: XLSXModule): Workbook {
  const book = XLSX.read(buf, { type: 'array' });
  return {
    sheets: book.SheetNames.map((name) => ({
      name,
      rows: XLSX.utils
        .sheet_to_json<unknown[]>(book.Sheets[name], { header: 1, raw: true, defval: '', blankrows: false })
        .map(r => r.map(cellToString)),
    })),
  };
}

// ─── Blob / file ─────────────────────────────────────────────────────────────
export async function workbookToBlob(entity: MasterEntity, wb: Workbook, fmt: FileFormat): Promise<Blob> {
  if (fmt === 'csv') {
    // BOM ให้ Excel อ่านภาษาไทย (UTF-8) ได้ถูกต้อง
    return new Blob(['\ufeff' + workbookToCsv(entity, wb)], { type: CSV_MIME });
  }
  const XLSX = await loadXlsx();
  return new Blob([workbookToXlsxBytes(wb, XLSX)], { type: XLSX_MIME });
}

/** ถอดรหัสข้อความ CSV: UTF-8 ก่อน ถ้าไม่ใช่ลอง Windows-874 (CSV ภาษาไทยจาก Excel รุ่นเก่า) */
export function decodeCsvBytes(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    try { return new TextDecoder('windows-874').decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
  }
}

export async function readFileToWorkbook(entity: MasterEntity, file: File): Promise<Workbook> {
  if (file.size > MAX_FILE_BYTES) throw new ImportFileError('ไฟล์มีขนาดเกิน 10MB');
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (ext === 'csv') return csvToWorkbook(entity, decodeCsvBytes(await file.arrayBuffer()));
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await loadXlsx();
    try {
      return xlsxBytesToWorkbook(await file.arrayBuffer(), XLSX);
    } catch {
      throw new ImportFileError('อ่านไฟล์ Excel ไม่สำเร็จ กรุณาตรวจสอบว่าไฟล์ไม่เสียหาย');
    }
  }
  throw new ImportFileError('รองรับเฉพาะไฟล์ .xlsx และ .csv');
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** เปิดหน้าต่างเลือกไฟล์ (DOM) — คืน null ถ้าผู้ใช้ยกเลิก */
export function pickFile(accept: string = ACCEPT_FILES): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

const FILE_BASE: Record<MasterEntity, string> = {
  product: 'products',
  category: 'categories',
  brand: 'brands',
  supplier: 'suppliers',
};

export function exportFileName(entity: MasterEntity, kind: 'export' | 'template', fmt: FileFormat, date: Date = new Date()): string {
  if (kind === 'template') return `${FILE_BASE[entity]}_import_template.${fmt}`;
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `${FILE_BASE[entity]}_export_${ymd}.${fmt}`;
}
