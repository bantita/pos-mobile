/**
 * Tests — spreadsheetIO (SheetJS 0.20.3 จาก cdn.sheetjs.com)
 *   - xlsx round-trip: หลายชีต, ภาษาไทย, บาร์โค้ด/รหัส 0 นำหน้าคงเป็นข้อความ, ตัวเลขเป็นตัวเลข
 *   - product round-trip ผ่าน .xlsx
 *   - readFileToWorkbook: .csv (UTF-8 BOM), .xlsx, เกิน 10MB, นามสกุลไม่รองรับ
 */
import { describe, test, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  workbookToXlsxBytes, xlsxBytesToWorkbook, readFileToWorkbook, workbookToBlob, exportFileName, loadXlsx,
} from '../spreadsheetIO';
import {
  MAX_FILE_BYTES, SHEET_NAMES, buildTemplate, exportProducts, planProductImport, exportSuppliers, planSupplierImport,
} from '../masterImportExport';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS } from '../../data/mockProducts';
import { MOCK_SUPPLIERS } from '../../data/mockInventory';

const ctx = () => ({ products: MOCK_PRODUCTS, categories: MOCK_CATEGORIES, brands: MOCK_BRANDS, suppliers: MOCK_SUPPLIERS });

describe('xlsx', () => {
  test('ใช้ SheetJS 0.20.3', () => {
    expect(XLSX.version).toBe('0.20.3');
  });

  test('loadXlsx (lazy) คืนโมดูลที่ใช้งานได้', async () => {
    const mod = await loadXlsx();
    expect(typeof mod.utils.aoa_to_sheet).toBe('function');
  });

  test('round-trip หลายชีต ภาษาไทย บาร์โค้ดยาว และ 0 นำหน้า', () => {
    const wb = exportProducts(MOCK_PRODUCTS);
    const prod = wb.sheets[0];
    prod.rows[1][0] = '00123';
    const back = xlsxBytesToWorkbook(workbookToXlsxBytes(wb, XLSX), XLSX);
    expect(back.sheets.map(s => s.name)).toEqual([SHEET_NAMES.product, SHEET_NAMES.variant]);
    expect(back.sheets[0].rows[0]).toEqual(prod.rows[0]);
    expect(back.sheets[0].rows[1][0]).toBe('00123');
    const bcCol = prod.rows[0].indexOf('บาร์โค้ด');
    expect(back.sheets[0].rows[1][bcCol]).toBe(prod.rows[1][bcCol]);
    expect(back.sheets[0].rows[1][bcCol]).toMatch(/^\d{13}/);
    // ทุกเซลล์ตรงกัน (เซลล์ว่างท้ายแถว SheetJS อาจเติม '')
    prod.rows.forEach((r, i) => r.forEach((c, j) => expect(back.sheets[0].rows[i][j] ?? '').toBe(c)));
  });

  test('คอลัมน์ตัวเลขถูกเขียนเป็นตัวเลข, รหัส/บาร์โค้ดเป็นข้อความ', () => {
    const bytes = workbookToXlsxBytes(exportProducts(MOCK_PRODUCTS.slice(0, 1)), XLSX);
    const ws = XLSX.read(bytes, { type: 'array' }).Sheets[SHEET_NAMES.product];
    const header = (XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })[0]);
    const col = (h: string) => XLSX.utils.encode_col(header.indexOf(h));
    expect(ws[`${col('ราคาขาย')}2`].t).toBe('n');
    expect(ws[`${col('บาร์โค้ด')}2`].t).toBe('s');
    expect(ws[`${col('รหัสสินค้า')}2`].t).toBe('s');
  });

  test('สินค้า export → .xlsx → import ซ้ำ ไม่มีข้อผิดพลาด/ไม่มีสินค้าใหม่', () => {
    const back = xlsxBytesToWorkbook(workbookToXlsxBytes(exportProducts(MOCK_PRODUCTS), XLSX), XLSX);
    const plan = planProductImport(back, ctx());
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toHaveLength(0);
  });

  test('template .xlsx (มีชีต คำอธิบาย) นำเข้าได้', () => {
    const back = xlsxBytesToWorkbook(workbookToXlsxBytes(buildTemplate('product'), XLSX), XLSX);
    expect(back.sheets.map(s => s.name)).toContain(SHEET_NAMES.help);
    const plan = planProductImport(back, ctx());
    expect(plan.errors).toEqual([]);
    expect(plan.creates.map(p => p.code)).toEqual(['P9001', 'P9002', 'P9003']);
  });

  test('ผู้จำหน่าย: เลขผู้เสียภาษี 0 นำหน้าคงอยู่หลังผ่าน .xlsx', () => {
    const back = xlsxBytesToWorkbook(workbookToXlsxBytes(exportSuppliers(MOCK_SUPPLIERS), XLSX), XLSX);
    const plan = planSupplierImport(back, ctx());
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toHaveLength(0);
    expect(plan.unchanged).toBe(MOCK_SUPPLIERS.length);
  });
});

describe('readFileToWorkbook', () => {
  test('.csv UTF-8 + BOM', async () => {
    const blob = await workbookToBlob('brand', { sheets: [{ name: SHEET_NAMES.brand, rows: [['ชื่อแบรนด์', 'สถานะ'], ['สิงห์', 'ใช้งาน']] }] }, 'csv');
    const file = new File([blob], 'brands.csv', { type: 'text/csv' });
    const wb = await readFileToWorkbook('brand', file);
    expect(wb.sheets[0].rows).toEqual([['ชื่อแบรนด์', 'สถานะ'], ['สิงห์', 'ใช้งาน']]);
  });

  test('.xlsx', async () => {
    const blob = await workbookToBlob('product', buildTemplate('product'), 'xlsx');
    const file = new File([blob], 'products.xlsx');
    const wb = await readFileToWorkbook('product', file);
    expect(planProductImport(wb, ctx()).creates).toHaveLength(3);
  });

  test('ไฟล์เกิน 10MB ถูกปฏิเสธ', async () => {
    const file = new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.csv');
    await expect(readFileToWorkbook('product', file)).rejects.toThrow('ไฟล์มีขนาดเกิน 10MB');
  });

  test('นามสกุลไม่รองรับ', async () => {
    const file = new File(['x'], 'data.txt');
    await expect(readFileToWorkbook('product', file)).rejects.toThrow('รองรับเฉพาะไฟล์ .xlsx และ .csv');
  });

  test('ชื่อไฟล์ export / template', () => {
    expect(exportFileName('product', 'export', 'xlsx', new Date(2025, 0, 5))).toBe('products_export_20250105.xlsx');
    expect(exportFileName('supplier', 'template', 'csv')).toBe('suppliers_import_template.csv');
  });

  test('ชื่อไฟล์สำรองข้อมูล / รายการข้อผิดพลาด (มีเวลา HHmm)', () => {
    const d = new Date(2025, 0, 5, 9, 7);
    expect(exportFileName('brand', 'backup', 'xlsx', d)).toBe('brands_backup_20250105_0907.xlsx');
    expect(exportFileName('category', 'errors', 'xlsx', d)).toBe('categories_import_errors_20250105_0907.xlsx');
  });
});
