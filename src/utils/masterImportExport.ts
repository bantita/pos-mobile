/**
 * masterImportExport — โมดูลกลาง (pure) สำหรับ Import / Export ข้อมูลมาสเตอร์
 *   สินค้า (หลายหน่วย หลายบาร์โค้ด + ตัวเลือกสินค้า/variants), หมวดหมู่/กลุ่ม, แบรนด์, ผู้จำหน่าย
 *
 * - ไม่มี React / React Native import → ทดสอบด้วย vitest ได้ตรง ๆ
 * - ใช้ร่วมกันทั้งหน้าเว็บ (WebProductScreen / WebBrandScreen / WebSupplierScreen)
 *   และหน้า mobile ImportExportScreen
 * - รูปแบบกลาง (format-neutral) คือ Workbook = รายการ sheet แต่ละ sheet เป็นตาราง string[][]
 *   แปลงเป็น/จาก CSV ได้ที่นี่ ส่วน .xlsx แปลงใน spreadsheetIO.ts (SheetJS)
 *
 * ขั้นตอน: buildTemplate / export*  →  ไฟล์  →  plan*Import (parse + validate, ไม่แก้ข้อมูล)
 *          →  แสดงตัวอย่าง (เพิ่มใหม่ / อัปเดต / ข้อผิดพลาด)  →  applyImport(plan, ports)
 */
import type { ProductMaster, ProductUOM, ProductOption, ProductVariant, Category, Brand } from '../types/product';
import type { Supplier } from '../types/inventory';

// ─── Types ────────────────────────────────────────────────────────────────────
export type MasterEntity = 'product' | 'category' | 'brand' | 'supplier';
export type Cell = string | number | boolean | null | undefined;
/** ตารางดิบ แถว 0 = หัวคอลัมน์ */
export type Grid = string[][];
export interface Sheet {
  name: string;
  rows: Grid;
  /** index คอลัมน์ที่เป็นตัวเลข (ใช้ตอนเขียน .xlsx ให้ Excel เห็นเป็นตัวเลข) */
  numericCols?: number[];
}
export interface Workbook { sheets: Sheet[] }

export interface ColumnDef {
  /** machine key (ภาษาอังกฤษ คงที่) — ใช้เป็นหัวคอลัมน์แทนภาษาไทยได้ */
  key: string;
  /** หัวคอลัมน์ภาษาไทยในไฟล์ */
  header: string;
  /** ชื่อสั้นสำหรับข้อความแจ้งเตือน */
  label: string;
  aliases?: string[];
  required?: boolean;
  numeric?: boolean;
  /** มีเฉพาะตอน export (ไม่ใช้ตอน import) */
  exportOnly?: boolean;
  description: string;
}

export interface RowError {
  /** เลขแถวในไฟล์ (หัวคอลัมน์ = แถว 1) */
  row: number;
  sheet?: string;
  /** ข้อความภาษาไทยเต็ม เช่น "แถว 5: ราคาขายต้องเป็นตัวเลข" */
  message: string;
}

export interface ImportContext {
  products: ProductMaster[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
}

interface PlanBase {
  /** มาสเตอร์ที่ต้องสร้างใหม่อัตโนมัติ (ชื่อ) — ใช้กับการนำเข้าสินค้า */
  newMasters: { categories: string[]; brands: string[]; suppliers: string[] };
  errors: RowError[];
  /** ข้อผิดพลาดระดับไฟล์ (ถ้ามี จะไม่นำเข้าอะไรเลย) */
  fileErrors: string[];
  /** จำนวนแถวข้อมูลที่ถูกข้าม */
  skippedRows: number;
  /** จำนวนรายการ (สินค้า/หมวดหมู่/...) ที่ถูกข้ามเพราะมีข้อผิดพลาด */
  skippedRecords: number;
  /** รายการที่มีอยู่แล้วและข้อมูลในไฟล์เหมือนเดิมทุกอย่าง */
  unchanged: number;
}

export interface CategoryDraft {
  name: string;
  status: 'active' | 'inactive';
  parentId?: string;
  /** หมวดหมู่หลักที่ถูกสร้างใหม่ในไฟล์เดียวกัน (ผูก id ตอน apply) */
  parentName?: string;
}
export interface BrandDraft { name: string; status: 'active' | 'inactive' }
export type SupplierDraft = Omit<Supplier, 'id'>;

export interface ProductImportPlan extends PlanBase {
  entity: 'product';
  creates: ProductMaster[];
  updates: { id: string; code: string; data: Partial<ProductMaster> }[];
}
export interface CategoryImportPlan extends PlanBase {
  entity: 'category';
  creates: CategoryDraft[];
  updates: { id: string; data: Partial<Omit<Category, 'id'>> & { parentName?: string } }[];
}
export interface BrandImportPlan extends PlanBase {
  entity: 'brand';
  creates: BrandDraft[];
  updates: { id: string; data: Partial<Omit<Brand, 'id'>> }[];
}
export interface SupplierImportPlan extends PlanBase {
  entity: 'supplier';
  creates: SupplierDraft[];
  updates: { id: string; data: Partial<Omit<Supplier, 'id'>> }[];
}
export type ImportPlan = ProductImportPlan | CategoryImportPlan | BrandImportPlan | SupplierImportPlan;

export interface MasterPorts {
  addProduct(p: ProductMaster): void;
  updateProduct(id: string, d: Partial<ProductMaster>): void;
  addCategory(d: { name: string; status: 'active' | 'inactive'; parentId?: string }): Category;
  updateCategory(id: string, d: Partial<Omit<Category, 'id'>>): void;
  addBrand(d: { name: string; status: 'active' | 'inactive' }): Brand;
  updateBrand(id: string, d: Partial<Omit<Brand, 'id'>>): void;
  addSupplier(d: Omit<Supplier, 'id'>): Supplier;
  updateSupplier(id: string, d: Partial<Omit<Supplier, 'id'>>): void;
  logAction(module: string, action: string, description: string, metadata?: Record<string, unknown>): void;
}

export interface ImportResult {
  created: number;
  updated: number;
  unchanged: number;
  mastersCreated: number;
  skipped: number;
  errors: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const SHEET_NAMES = {
  product: 'สินค้า',
  variant: 'ตัวเลือกสินค้า',
  category: 'หมวดหมู่',
  brand: 'แบรนด์',
  supplier: 'ผู้จำหน่าย',
  help: 'คำอธิบาย',
} as const;

/** แถวคั่นใน CSV สินค้า: แถวหลังจากนี้คือตาราง ตัวเลือกสินค้า */
export const VARIANT_CSV_MARKER = '[ตัวเลือกสินค้า]';
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const BARCODE_SEPARATOR = '|';

export const ENTITY_LABELS: Record<MasterEntity, string> = {
  product: 'สินค้า',
  category: 'หมวดหมู่',
  brand: 'แบรนด์',
  supplier: 'ผู้จำหน่าย',
};

const STATUS_DESC = 'ใช้งาน / ไม่ใช้งาน (ว่าง = ใช้งาน)';

export const PRODUCT_COLUMNS: ColumnDef[] = [
  { key: 'code', header: 'รหัสสินค้า', label: 'รหัสสินค้า', aliases: ['รหัส', 'sku'], required: true, description: 'รหัสสินค้า (ใช้จับคู่เพื่ออัปเดต) — 1 แถวต่อ 1 หน่วยนับ ใส่รหัสซ้ำได้ในแต่ละหน่วย' },
  { key: 'name', header: 'ชื่อสินค้า', label: 'ชื่อสินค้า', aliases: ['ชื่อ'], required: true, description: 'ชื่อสินค้า' },
  { key: 'productType', header: 'ประเภทสินค้า', label: 'ประเภทสินค้า', aliases: ['ประเภท', 'type'], description: 'ทั่วไป / บริการ (ว่าง = ทั่วไป)' },
  { key: 'category', header: 'หมวดหมู่/กลุ่ม', label: 'หมวดหมู่', aliases: ['หมวดหมู่', 'กลุ่ม', 'กลุ่มสินค้า', 'หมวด'], description: 'ชื่อหมวดหมู่/กลุ่ม — ถ้ายังไม่มีในระบบจะสร้างใหม่ให้อัตโนมัติ' },
  { key: 'brand', header: 'แบรนด์', label: 'แบรนด์', aliases: ['ยี่ห้อ'], description: 'ชื่อแบรนด์ — ถ้ายังไม่มีในระบบจะสร้างใหม่ให้อัตโนมัติ' },
  { key: 'supplier', header: 'ผู้จำหน่าย', label: 'ผู้จำหน่าย', aliases: ['ผู้จัดจำหน่าย'], description: 'ชื่อผู้จำหน่าย — ถ้ายังไม่มีในระบบจะสร้างใหม่ให้อัตโนมัติ' },
  { key: 'unit', header: 'หน่วย', label: 'หน่วย', aliases: ['หน่วยนับ'], required: true, description: 'ชื่อหน่วยนับของแถวนี้ เช่น ขวด แพ็ค ลัง' },
  { key: 'ratio', header: 'อัตราส่วน (ต่อหน่วยฐาน)', label: 'อัตราส่วน', aliases: ['อัตราส่วน'], numeric: true, description: 'จำนวนหน่วยฐานต่อ 1 หน่วยนี้ (หน่วยหลัก = 1, ว่าง = 1 หรือค่าเดิมของหน่วยที่มีอยู่แล้ว)' },
  { key: 'isBase', header: 'หน่วยหลัก (Y/N)', label: 'หน่วยหลัก', aliases: ['หน่วยหลัก', 'หน่วยฐาน'], description: 'Y = หน่วยฐาน (ต้องมี 1 หน่วยต่อสินค้า และอัตราส่วน = 1)' },
  { key: 'isDefault', header: 'หน่วยเริ่มต้น POS (Y/N)', label: 'หน่วยเริ่มต้น POS', aliases: ['หน่วยเริ่มต้น'], description: 'Y = หน่วยที่แสดงใน POS เป็นค่าเริ่มต้น (ว่าง = หน่วยหลัก)' },
  { key: 'barcodes', header: 'บาร์โค้ด', label: 'บาร์โค้ด', aliases: ['barcode'], description: 'บาร์โค้ดของหน่วยนี้ ใส่ได้หลายค่าคั่นด้วย | เช่น 885001|885002 (ห้ามซ้ำทั้งระบบ, ว่าง = คงบาร์โค้ดเดิมของหน่วยที่มีอยู่แล้ว)' },
  { key: 'costPrice', header: 'ราคาทุน', label: 'ราคาทุน', aliases: ['ต้นทุน', 'cost'], numeric: true, description: 'ราคาทุนต่อหน่วยนี้ (ว่าง = 0 สำหรับหน่วยใหม่ / คงค่าเดิมสำหรับหน่วยที่มีอยู่แล้ว)' },
  { key: 'salePrice', header: 'ราคาขาย', label: 'ราคาขาย', aliases: ['ราคา', 'ราคาใหม่', 'price'], required: true, numeric: true, description: 'ราคาขายต่อหน่วยนี้' },
  { key: 'vatIncluded', header: 'VAT รวมในราคา (Y/N)', label: 'VAT รวมในราคา', aliases: ['vat รวมในราคา'], description: 'Y = ราคารวม VAT แล้ว (ว่าง = Y)' },
  { key: 'vatRate', header: 'อัตรา VAT', label: 'อัตรา VAT', aliases: ['vat'], numeric: true, description: '0 หรือ 7 (ว่าง = 7)' },
  { key: 'stockQty', header: 'สต๊อก (หน่วยฐาน)', label: 'สต๊อก', aliases: ['สต๊อก', 'สต็อก', 'stock', 'คงเหลือ'], numeric: true, description: 'จำนวนคงเหลือ นับเป็นหน่วยฐาน (ว่าง = 0 สำหรับสินค้าใหม่ / ไม่เปลี่ยนสำหรับสินค้าเดิม)' },
  { key: 'minStock', header: 'สต๊อกขั้นต่ำ', label: 'สต๊อกขั้นต่ำ', aliases: ['สต็อกขั้นต่ำ'], numeric: true, description: 'จุดสั่งซื้อ (หน่วยฐาน)' },
  { key: 'status', header: 'สถานะ', label: 'สถานะ', description: STATUS_DESC },
  { key: 'color', header: 'สี', label: 'สี', description: 'สีสินค้า (ไม่บังคับ)' },
  { key: 'size', header: 'ไซส์', label: 'ไซส์', aliases: ['ขนาด'], description: 'ขนาด/ไซส์ (ไม่บังคับ)' },
  { key: 'lotNumber', header: 'Lot', label: 'Lot', aliases: ['ล็อต'], description: 'Lot / Batch (ไม่บังคับ)' },
  { key: 'modelYear', header: 'ปีรุ่น', label: 'ปีรุ่น', aliases: ['ปี/รุ่น'], description: 'ปี/รุ่น (ไม่บังคับ)' },
  { key: 'image', header: 'รูปภาพ (URL)', label: 'รูปภาพ', aliases: ['รูปภาพ'], description: 'ลิงก์รูปภาพ http(s) (ไม่บังคับ — รูปที่อัปโหลดจากเครื่องจะไม่ถูกส่งออก)' },
  { key: 'options', header: 'ตัวเลือกสินค้า', label: 'ตัวเลือกสินค้า', description: 'ตัวเลือกของสินค้า รูปแบบ สี=แดง|น้ำเงิน; ไซส์=M|L (ว่าง = ไม่เปลี่ยน)' },
];

export const VARIANT_COLUMNS: ColumnDef[] = [
  { key: 'code', header: 'รหัสสินค้า', label: 'รหัสสินค้า', aliases: ['รหัส'], required: true, description: 'รหัสสินค้าแม่ (ต้องมีในตารางสินค้าหรือในระบบ)' },
  { key: 'optionValues', header: 'ค่าตัวเลือก', label: 'ค่าตัวเลือก', aliases: ['ตัวเลือก'], required: true, description: 'ค่าตัวเลือกของ variant รูปแบบ สี=แดง; ไซส์=M' },
  { key: 'sku', header: 'SKU ตัวเลือก', label: 'SKU ตัวเลือก', aliases: ['sku'], description: 'SKU ของ variant (ไม่บังคับ)' },
  { key: 'barcode', header: 'บาร์โค้ดตัวเลือก', label: 'บาร์โค้ดตัวเลือก', aliases: ['บาร์โค้ด'], description: 'บาร์โค้ดของ variant (ห้ามซ้ำทั้งระบบ)' },
  { key: 'price', header: 'ราคาตัวเลือก', label: 'ราคาตัวเลือก', aliases: ['ราคา'], numeric: true, description: 'ราคาขายเฉพาะ variant (ว่าง = ใช้ราคาสินค้า)' },
  { key: 'stockQty', header: 'สต๊อกตัวเลือก', label: 'สต๊อกตัวเลือก', aliases: ['สต็อกตัวเลือก', 'สต๊อก'], numeric: true, description: 'จำนวนคงเหลือของ variant (ว่าง = 0)' },
];

export const CATEGORY_COLUMNS: ColumnDef[] = [
  { key: 'name', header: 'ชื่อหมวดหมู่', label: 'ชื่อหมวดหมู่', aliases: ['หมวดหมู่', 'กลุ่ม', 'ชื่อกลุ่ม', 'หมวดหมู่/กลุ่ม'], required: true, description: 'ชื่อหมวดหมู่/กลุ่ม (ใช้จับคู่เพื่ออัปเดต)' },
  { key: 'parent', header: 'หมวดหมู่หลัก', label: 'หมวดหมู่หลัก', aliases: ['กลุ่มหลัก', 'parent'], description: 'ชื่อหมวดหมู่แม่ (ไม่บังคับ ต้องมีในระบบหรือในไฟล์)' },
  { key: 'status', header: 'สถานะ', label: 'สถานะ', description: STATUS_DESC },
  { key: 'productCount', header: 'จำนวนสินค้า', label: 'จำนวนสินค้า', numeric: true, exportOnly: true, description: 'ข้อมูลอ้างอิง (ไม่ใช้ตอนนำเข้า)' },
];

export const BRAND_COLUMNS: ColumnDef[] = [
  { key: 'name', header: 'ชื่อแบรนด์', label: 'ชื่อแบรนด์', aliases: ['แบรนด์', 'ยี่ห้อ', 'ชื่อยี่ห้อ'], required: true, description: 'ชื่อแบรนด์ (ใช้จับคู่เพื่ออัปเดต)' },
  { key: 'status', header: 'สถานะ', label: 'สถานะ', description: STATUS_DESC },
  { key: 'productCount', header: 'จำนวนสินค้า', label: 'จำนวนสินค้า', numeric: true, exportOnly: true, description: 'ข้อมูลอ้างอิง (ไม่ใช้ตอนนำเข้า)' },
];

export const SUPPLIER_COLUMNS: ColumnDef[] = [
  { key: 'name', header: 'ชื่อผู้จำหน่าย', label: 'ชื่อผู้จำหน่าย', aliases: ['ผู้จำหน่าย', 'ชื่อ'], required: true, description: 'ชื่อผู้จำหน่าย' },
  { key: 'taxId', header: 'เลขผู้เสียภาษี', label: 'เลขผู้เสียภาษี', aliases: ['เลขประจำตัวผู้เสียภาษี'], description: 'เลข 13 หลัก (ใช้จับคู่เพื่ออัปเดตก่อนชื่อ)' },
  { key: 'phone', header: 'เบอร์โทร', label: 'เบอร์โทร', aliases: ['โทรศัพท์', 'phone'], description: 'เบอร์โทรศัพท์' },
  { key: 'contactName', header: 'ผู้ติดต่อ', label: 'ผู้ติดต่อ', aliases: ['ชื่อผู้ติดต่อ', 'contact'], description: 'ชื่อผู้ติดต่อ' },
];

export const ENTITY_COLUMNS: Record<MasterEntity, ColumnDef[]> = {
  product: PRODUCT_COLUMNS,
  category: CATEGORY_COLUMNS,
  brand: BRAND_COLUMNS,
  supplier: SUPPLIER_COLUMNS,
};

const ENTITY_SHEET: Record<MasterEntity, string> = {
  product: SHEET_NAMES.product,
  category: SHEET_NAMES.category,
  brand: SHEET_NAMES.brand,
  supplier: SHEET_NAMES.supplier,
};

// ─── Small helpers ────────────────────────────────────────────────────────────
/** normalize ชื่อสำหรับจับคู่: NFC, ตัดช่องว่างหัวท้าย, ยุบช่องว่าง, ไม่สนตัวพิมพ์ */
export function normName(s: string | undefined | null): string {
  return String(s ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

const cellStr = (c: Cell): string => (c === null || c === undefined ? '' : String(c));
const yn = (b: boolean): string => (b ? 'Y' : 'N');
const statusLabel = (s: 'active' | 'inactive'): string => (s === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน');
const productTypeLabel = (t: ProductMaster['productType'] | undefined): string => (t === 'service' ? 'บริการ' : 'ทั่วไป');

/** ตัวเลข: รองรับ 1,234.50 / ฿ / ช่องว่าง — คืน NaN ถ้าไม่ใช่ตัวเลข */
export function parseNumber(s: string): number {
  const t = s.replace(/[,\s฿]/g, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return Number(t);
}

/** Y/N → boolean, ไม่ถูกต้อง → null */
export function parseYN(s: string): boolean | null {
  const t = normName(s);
  if (['y', 'yes', 'true', '1', 'ใช่'].includes(t)) return true;
  if (['n', 'no', 'false', '0', 'ไม่', 'ไม่ใช่'].includes(t)) return false;
  return null;
}

function parseStatus(s: string): 'active' | 'inactive' | null {
  const t = normName(s);
  if (['ใช้งาน', 'active', 'เปิด', 'เปิดใช้', 'เปิดใช้งาน'].includes(t)) return 'active';
  if (['ไม่ใช้งาน', 'inactive', 'ปิด', 'ปิดใช้', 'ปิดใช้งาน', 'ยกเลิก'].includes(t)) return 'inactive';
  return null;
}

function parseProductType(s: string): 'general' | 'service' | null {
  const t = normName(s);
  if (['ทั่วไป', 'สินค้าทั่วไป', 'general'].includes(t)) return 'general';
  if (['บริการ', 'สินค้าบริการ', 'service'].includes(t)) return 'service';
  return null;
}

export function splitBarcodes(s: string): string[] {
  return s.split(BARCODE_SEPARATOR).map(b => b.trim()).filter(b => b !== '');
}

export function formatOptions(options: ProductOption[] | undefined): string {
  return (options ?? []).map(o => `${o.name}=${o.values.join('|')}`).join('; ');
}

/** "สี=แดง|น้ำเงิน; ไซส์=M|L" → ProductOption[] หรือ null ถ้ารูปแบบผิด */
export function parseOptions(s: string): ProductOption[] | null {
  const out: ProductOption[] = [];
  const segments = s.split(';').map(x => x.trim()).filter(x => x !== '');
  for (const seg of segments) {
    const eq = seg.indexOf('=');
    if (eq <= 0) return null;
    const name = seg.slice(0, eq).trim();
    const values: string[] = [];
    seg.slice(eq + 1).split('|').map(v => v.trim()).filter(v => v !== '').forEach(v => {
      if (!values.some(x => normName(x) === normName(v))) values.push(v);
    });
    if (!name || values.length === 0) return null;
    if (out.some(o => normName(o.name) === normName(name))) return null;
    out.push({ name, values });
  }
  return out.length > 0 ? out : null;
}

export function formatOptionValues(ov: Record<string, string>, options?: ProductOption[]): string {
  const keys = Object.keys(ov);
  const ordered = [
    ...(options ?? []).map(o => o.name).filter(n => keys.includes(n)),
    ...keys.filter(k => !(options ?? []).some(o => o.name === k)),
  ];
  return ordered.map(k => `${k}=${ov[k]}`).join('; ');
}

function parseOptionValuePairs(s: string): [string, string][] | null {
  const pairs: [string, string][] = [];
  const segments = s.split(';').map(x => x.trim()).filter(x => x !== '');
  for (const seg of segments) {
    const eq = seg.indexOf('=');
    if (eq <= 0) return null;
    const k = seg.slice(0, eq).trim();
    const v = seg.slice(eq + 1).trim();
    if (!k || !v) return null;
    pairs.push([k, v]);
  }
  return pairs.length > 0 ? pairs : null;
}

const comboKey = (ov: Record<string, string>): string =>
  Object.keys(ov).map(k => `${normName(k)}=${normName(ov[k])}`).sort().join(';');

/** เทียบค่าแบบไม่สนลำดับ key ของ object (ใช้ตรวจ "ไม่เปลี่ยนแปลง") */
function stableStringify(v: unknown): string {
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter(k => o[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

function isUnchanged<T extends object>(existing: T, data: Partial<T>): boolean {
  const ex = existing as Record<string, unknown>;
  const d = data as Record<string, unknown>;
  return Object.keys(d).every(k => d[k] === undefined || stableStringify(d[k]) === stableStringify(ex[k]));
}

const emptyBase = (): PlanBase => ({
  newMasters: { categories: [], brands: [], suppliers: [] },
  errors: [], fileErrors: [], skippedRows: 0, skippedRecords: 0, unchanged: 0,
});

// ─── CSV ──────────────────────────────────────────────────────────────────────
/**
 * แยกข้อความ CSV เป็นตาราง — รองรับ BOM, CRLF / LF / CR, field ใน "...",
 * "" (escape), comma และขึ้นบรรทัดใหม่ภายใน quote; ตัดแถวที่ว่างทั้งแถวทิ้ง
 */
export function parseCsv(text: string): Grid {
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: Grid = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(cell); cell = ''; i++; continue; }
    if (ch === '\r' || ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = '';
      i += ch === '\r' && s[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    cell += ch; i++;
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function escapeCsvCell(c: Cell): string {
  const s = cellStr(c);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** ตาราง → ข้อความ CSV (CRLF, ครอบ quote เมื่อจำเป็น) — ไม่ใส่ BOM (ผู้เรียกใส่เอง) */
export function toCsv(rows: Cell[][]): string {
  return rows.map(r => r.map(escapeCsvCell).join(',')).join('\r\n') + '\r\n';
}

/** กันสูตร Excel (CSV injection): ค่าที่ขึ้นต้นด้วย = + @ หรือ - (ที่ไม่ใช่ตัวเลข) เติม ' นำหน้า */
const guardFormula = (s: string): string => (/^[=+@]|^-(?![\d.])/.test(s) ? `'${s}` : s);
const unguardFormula = (s: string): string => (/^'[=+@-]/.test(s) ? s.slice(1) : s);

/** Workbook → CSV ไฟล์เดียว (สินค้า: ตารางสินค้า + แถวคั่น [ตัวเลือกสินค้า] + ตาราง variant) */
export function workbookToCsv(entity: MasterEntity, wb: Workbook): string {
  const guard = (g: Grid): Grid => g.map(r => r.map(guardFormula));
  const main = findSheet(wb, ENTITY_SHEET[entity]) ?? wb.sheets.find(sh => sh.name !== SHEET_NAMES.help);
  const rows: Grid = main ? guard(main.rows) : [];
  if (entity === 'product') {
    const variants = findSheet(wb, SHEET_NAMES.variant);
    if (variants && variants.rows.length > 0) {
      rows.push([VARIANT_CSV_MARKER]);
      rows.push(...guard(variants.rows));
    }
  }
  return toCsv(rows);
}

/** CSV → Workbook (สินค้า: แยกตาราง variant ที่แถวคั่น [ตัวเลือกสินค้า]) */
export function csvToWorkbook(entity: MasterEntity, text: string): Workbook {
  const grid = parseCsv(text).map(r => r.map(unguardFormula));
  if (entity !== 'product') return { sheets: [{ name: ENTITY_SHEET[entity], rows: grid }] };
  const markerIdx = grid.findIndex(r => (r[0] ?? '').trim() === VARIANT_CSV_MARKER);
  if (markerIdx < 0) return { sheets: [{ name: SHEET_NAMES.product, rows: grid }] };
  return {
    sheets: [
      { name: SHEET_NAMES.product, rows: grid.slice(0, markerIdx) },
      { name: SHEET_NAMES.variant, rows: grid.slice(markerIdx + 1) },
    ],
  };
}

// ─── Sheet / header helpers ──────────────────────────────────────────────────
function findSheet(wb: Workbook, name: string): Sheet | undefined {
  return wb.sheets.find(s => normName(s.name) === normName(name));
}

function mainSheet(entity: MasterEntity, wb: Workbook): Sheet | undefined {
  return findSheet(wb, ENTITY_SHEET[entity])
    ?? wb.sheets.find(s => ![SHEET_NAMES.variant, SHEET_NAMES.help].some(n => normName(n) === normName(s.name)));
}

/** จับคู่หัวคอลัมน์ → key (ตรงตัวหลัง normalize กับ header / key / aliases) */
export function resolveHeaders(headerRow: string[], columns: ColumnDef[]): { index: Record<string, number>; missing: string[] } {
  const index: Record<string, number> = {};
  headerRow.forEach((raw, i) => {
    const h = normName(raw);
    if (!h) return;
    const col = columns.find(c => !c.exportOnly && [c.header, c.key, ...(c.aliases ?? [])].some(n => normName(n) === h));
    if (col && index[col.key] === undefined) index[col.key] = i;
  });
  const missing = columns.filter(c => c.required && index[c.key] === undefined).map(c => c.header);
  return { index, missing };
}

const sheetFrom = (name: string, columns: ColumnDef[], data: Cell[][]): Sheet => ({
  name,
  rows: [columns.map(c => c.header), ...data.map(r => r.map(cellStr))],
  numericCols: columns.map((c, i) => (c.numeric ? i : -1)).filter(i => i >= 0),
});

const helpSheet = (sections: { title: string; columns: ColumnDef[] }[], notes: string[]): Sheet => {
  const rows: Grid = [['คอลัมน์', 'คีย์ (ใช้แทนหัวคอลัมน์ได้)', 'จำเป็น', 'คำอธิบาย']];
  sections.forEach(sec => {
    rows.push([`[${sec.title}]`, '', '', '']);
    sec.columns.forEach(c => rows.push([c.header, c.key, c.required ? 'Y' : '', c.description]));
  });
  if (notes.length > 0) {
    rows.push(['', '', '', '']);
    notes.forEach(n => rows.push(['หมายเหตุ', '', '', n]));
  }
  return { name: SHEET_NAMES.help, rows };
};

// ─── Export ───────────────────────────────────────────────────────────────────
/** หน่วยฐานของสินค้า + หน่วยอื่นตามลำดับเดิม (สินค้าเก่าที่ไม่มี uoms จะสร้างหน่วยฐานจาก field หลัก) */
function orderedUoms(p: ProductMaster): { base: ProductUOM; others: ProductUOM[] } {
  const uoms = p.uoms ?? [];
  if (uoms.length === 0) {
    return {
      base: { id: '', unit: p.unit, ratio: 1, costPrice: p.costPrice, salePrice: p.salePrice, barcodes: p.barcode ? [p.barcode] : [], isDefault: true },
      others: [],
    };
  }
  const ratioOne = uoms.filter(u => u.ratio === 1);
  const base = ratioOne.find(u => u.unit === p.unit) ?? ratioOne[0] ?? uoms[0];
  return { base, others: uoms.filter(u => u !== base) };
}

export function exportProducts(products: ProductMaster[]): Workbook {
  const productRows: Cell[][] = [];
  const variantRows: Cell[][] = [];
  products.forEach(p => {
    const { base, others } = orderedUoms(p);
    // บาร์โค้ดหลัก (p.barcode) ต้องอยู่ลำดับแรกของหน่วยฐาน
    const baseBarcodes = [...base.barcodes];
    const allUomBarcodes = [base, ...others].flatMap(u => u.barcodes);
    if (p.barcode && !allUomBarcodes.includes(p.barcode)) baseBarcodes.unshift(p.barcode);
    else if (p.barcode && baseBarcodes.includes(p.barcode)) {
      baseBarcodes.splice(baseBarcodes.indexOf(p.barcode), 1);
      baseBarcodes.unshift(p.barcode);
    }
    const image = p.image && /^https?:\/\//i.test(p.image) ? p.image : '';
    const productLevel = (): Cell[] => [
      p.code, p.name, productTypeLabel(p.productType), p.categoryName, p.brandName, p.supplierName,
    ];
    const tail = (): Cell[] => [
      yn(p.vatIncluded), p.vatRate, p.stockQty, p.minStock, statusLabel(p.status),
      p.color, p.size, p.lotNumber, p.modelYear, image, formatOptions(p.options),
    ];
    [base, ...others].forEach(u => {
      const barcodes = u === base ? baseBarcodes : u.barcodes;
      productRows.push([
        ...productLevel(),
        u.unit, u.ratio, yn(u === base), yn(u.isDefault),
        barcodes.join(BARCODE_SEPARATOR), u.costPrice, u.salePrice,
        ...tail(),
      ]);
    });
    (p.variants ?? []).forEach(v => {
      variantRows.push([p.code, formatOptionValues(v.optionValues, p.options), v.sku, v.barcode, v.price, v.stockQty]);
    });
  });
  return {
    sheets: [
      sheetFrom(SHEET_NAMES.product, PRODUCT_COLUMNS, productRows),
      sheetFrom(SHEET_NAMES.variant, VARIANT_COLUMNS, variantRows),
    ],
  };
}

export function exportCategories(categories: Category[], productCounts?: Record<string, number>): Workbook {
  const byId = new Map(categories.map(c => [c.id, c]));
  const rows = categories.map(c => [
    c.name, c.parentId ? byId.get(c.parentId)?.name ?? '' : '', statusLabel(c.status), productCounts?.[c.id] ?? c.productCount,
  ]);
  return { sheets: [sheetFrom(SHEET_NAMES.category, CATEGORY_COLUMNS, rows)] };
}

export function exportBrands(brands: Brand[], productCounts?: Record<string, number>): Workbook {
  const rows = brands.map(b => [b.name, statusLabel(b.status), productCounts?.[b.id] ?? b.productCount]);
  return { sheets: [sheetFrom(SHEET_NAMES.brand, BRAND_COLUMNS, rows)] };
}

export function exportSuppliers(suppliers: Supplier[]): Workbook {
  const rows = suppliers.map(s => [s.name, s.taxId, s.phone, s.contactName]);
  return { sheets: [sheetFrom(SHEET_NAMES.supplier, SUPPLIER_COLUMNS, rows)] };
}

// ─── Template ─────────────────────────────────────────────────────────────────
const PRODUCT_NOTES = [
  '1 แถว = 1 หน่วยนับของสินค้า: สินค้าที่มีหลายหน่วยให้ใส่รหัสสินค้าซ้ำหลายแถว (ข้อมูลระดับสินค้าใส่แถวแรกพอ)',
  'ต้องมีหน่วยหลัก (Y) 1 หน่วยต่อสินค้า และอัตราส่วนของหน่วยหลักต้องเป็น 1',
  'บาร์โค้ดหลายค่าในหน่วยเดียวกันคั่นด้วย |  — บาร์โค้ดห้ามซ้ำกันทั้งระบบ',
  'หมวดหมู่/แบรนด์/ผู้จำหน่ายใส่เป็นชื่อ ถ้ายังไม่มีจะสร้างใหม่ให้อัตโนมัติ',
  'ตัวเลือกสินค้า (variants) อยู่ในชีต ตัวเลือกสินค้า (ไฟล์ .csv อยู่ใต้แถว [ตัวเลือกสินค้า]) — ถ้าไม่มีแถวของสินค้านั้น variants เดิมจะไม่ถูกแก้',
  'สินค้าเดิม (รหัสตรงกัน) จะถูกอัปเดต ช่องที่ไม่บังคับและเว้นว่างจะคงค่าเดิมไว้ (รวมถึง อัตราส่วน/ราคาทุน/บาร์โค้ด ของหน่วยเดิม)',
  'หน่วยเดิมที่ไม่มีแถวในไฟล์จะคงไว้ ไม่ถูกลบ — การลบหน่วยหรือบาร์โค้ดให้ทำที่หน้าแก้ไขสินค้า',
];

export function buildTemplate(entity: MasterEntity): Workbook {
  if (entity === 'product') {
    const common = (code: string, name: string, type: string, cat: string, brand: string, sup: string): string[] =>
      [code, name, type, cat, brand, sup];
    const productRows: Cell[][] = [
      [...common('P9001', 'น้ำดื่มตัวอย่าง 600ml', 'ทั่วไป', 'เครื่องดื่ม', 'สิงห์', 'บริษัท สิงห์ คอร์เปอเรชั่น'),
        'ขวด', 1, 'Y', 'Y', '8850000090011|8850000090012', 5, 10, 'Y', 7, 240, 24, 'ใช้งาน', '', '600ml', '', '', '', ''],
      [...common('P9001', 'น้ำดื่มตัวอย่าง 600ml', 'ทั่วไป', 'เครื่องดื่ม', 'สิงห์', 'บริษัท สิงห์ คอร์เปอเรชั่น'),
        'แพ็ค', 6, 'N', 'N', '8850000090013', 30, 55, 'Y', 7, 240, 24, 'ใช้งาน', '', '600ml', '', '', '', ''],
      [...common('P9001', 'น้ำดื่มตัวอย่าง 600ml', 'ทั่วไป', 'เครื่องดื่ม', 'สิงห์', 'บริษัท สิงห์ คอร์เปอเรชั่น'),
        'ลัง', 24, 'N', 'N', '8850000090014', 115, 200, 'Y', 7, 240, 24, 'ใช้งาน', '', '600ml', '', '', '', ''],
      [...common('P9002', 'บริการล้างแอร์ตัวอย่าง', 'บริการ', 'ของใช้', '', ''),
        'ครั้ง', 1, 'Y', 'Y', '', 300, 500, 'Y', 7, 0, 0, 'ใช้งาน', '', '', '', '', '', ''],
      [...common('P9003', 'เสื้อยืดตัวอย่าง', 'ทั่วไป', 'ของใช้', '', ''),
        'ตัว', 1, 'Y', 'Y', '8850000090030', 80, 199, 'N', 0, 20, 5, 'ใช้งาน', '', '', 'LOT-2025-01', '2025', '', 'สี=แดง|น้ำเงิน; ไซส์=M|L'],
    ];
    const variantRows: Cell[][] = [
      ['P9003', 'สี=แดง; ไซส์=M', 'P9003-RD-M', '8850000090031', 199, 10],
      ['P9003', 'สี=น้ำเงิน; ไซส์=L', 'P9003-BL-L', '8850000090032', 219, 10],
    ];
    return {
      sheets: [
        sheetFrom(SHEET_NAMES.product, PRODUCT_COLUMNS, productRows),
        sheetFrom(SHEET_NAMES.variant, VARIANT_COLUMNS, variantRows),
        helpSheet([
          { title: SHEET_NAMES.product, columns: PRODUCT_COLUMNS },
          { title: SHEET_NAMES.variant, columns: VARIANT_COLUMNS },
        ], PRODUCT_NOTES),
      ],
    };
  }
  if (entity === 'category') {
    return {
      sheets: [
        sheetFrom(SHEET_NAMES.category, CATEGORY_COLUMNS.filter(c => !c.exportOnly), [
          ['เครื่องดื่ม', '', 'ใช้งาน'],
          ['น้ำดื่ม', 'เครื่องดื่ม', 'ใช้งาน'],
          ['ขนมขบเคี้ยว', '', 'ใช้งาน'],
        ]),
        helpSheet([{ title: SHEET_NAMES.category, columns: CATEGORY_COLUMNS.filter(c => !c.exportOnly) }], ['ชื่อตรงกับของเดิม (ไม่สนตัวพิมพ์/ช่องว่าง) = อัปเดต']),
      ],
    };
  }
  if (entity === 'brand') {
    return {
      sheets: [
        sheetFrom(SHEET_NAMES.brand, BRAND_COLUMNS.filter(c => !c.exportOnly), [
          ['แบรนด์ตัวอย่าง A', 'ใช้งาน'],
          ['แบรนด์ตัวอย่าง B', 'ไม่ใช้งาน'],
        ]),
        helpSheet([{ title: SHEET_NAMES.brand, columns: BRAND_COLUMNS.filter(c => !c.exportOnly) }], ['ชื่อตรงกับของเดิม (ไม่สนตัวพิมพ์/ช่องว่าง) = อัปเดต']),
      ],
    };
  }
  return {
    sheets: [
      sheetFrom(SHEET_NAMES.supplier, SUPPLIER_COLUMNS, [
        ['บริษัท ตัวอย่าง จำกัด', '0105599000011', '021234500', 'คุณตัวอย่าง'],
        ['ร้านตัวอย่างการค้า', '', '0812345678', ''],
      ]),
      helpSheet([{ title: SHEET_NAMES.supplier, columns: SUPPLIER_COLUMNS }], ['จับคู่ด้วยเลขผู้เสียภาษีก่อน ถ้าไม่มีจับคู่ด้วยชื่อ']),
    ],
  };
}

// ─── Plan helpers ─────────────────────────────────────────────────────────────
interface TableRow { rowNo: number; get(key: string): string }

interface ReadTable {
  rows: TableRow[];
  fileErrors: string[];
  hasColumn(key: string): boolean;
}

function readTable(sheet: Sheet | undefined, columns: ColumnDef[], allowEmpty = false): ReadTable {
  if (!sheet || sheet.rows.length < (allowEmpty ? 1 : 2)) {
    return { rows: [], fileErrors: allowEmpty ? [] : ['ไฟล์ว่างหรือไม่มีข้อมูล'], hasColumn: () => false };
  }
  const { index, missing } = resolveHeaders(sheet.rows[0], columns);
  if (missing.length > 0) {
    const prefix = sheet.name ? `ชีต ${sheet.name}: ` : '';
    return { rows: [], fileErrors: [`${prefix}ไม่พบคอลัมน์ที่จำเป็น: ${missing.join(', ')}`], hasColumn: () => false };
  }
  const rows = sheet.rows.slice(1).map((cells, i) => ({
    rowNo: i + 2,
    get: (key: string) => (index[key] === undefined ? '' : String(cells[index[key]] ?? '').trim()),
  })).filter(r => columns.some(c => r.get(c.key) !== ''));
  if (rows.length === 0 && !allowEmpty) return { rows: [], fileErrors: ['ไฟล์ว่างหรือไม่มีข้อมูล'], hasColumn: () => false };
  return { rows, fileErrors: [], hasColumn: (key: string) => index[key] !== undefined };
}

class ErrorBag {
  list: RowError[] = [];
  constructor(private sheet?: string) {}
  row(rowNo: number, msg: string): void {
    const prefix = this.sheet === SHEET_NAMES.variant ? `${SHEET_NAMES.variant} แถว` : 'แถว';
    this.list.push({ row: rowNo, sheet: this.sheet, message: `${prefix} ${rowNo}: ${msg}` });
  }
  raw(rowNo: number, message: string): void {
    this.list.push({ row: rowNo, sheet: this.sheet, message });
  }
  get size(): number { return this.list.length; }
}

/** ตัวเลข ≥ 0 จากช่อง (ว่าง → undefined) — บันทึก error ถ้าไม่ถูกต้อง */
function readNonNegative(r: TableRow, key: string, label: string, bag: ErrorBag): number | undefined {
  const raw = r.get(key);
  if (raw === '') return undefined;
  const n = parseNumber(raw);
  if (Number.isNaN(n)) { bag.row(r.rowNo, `${label}ต้องเป็นตัวเลข`); return undefined; }
  if (n < 0) { bag.row(r.rowNo, `${label}ต้องไม่ติดลบ`); return undefined; }
  return n;
}

function readYN(r: TableRow, key: string, label: string, bag: ErrorBag): boolean | undefined {
  const raw = r.get(key);
  if (raw === '') return undefined;
  const b = parseYN(raw);
  if (b === null) { bag.row(r.rowNo, `${label}ต้องเป็น Y หรือ N`); return undefined; }
  return b;
}

function readStatus(r: TableRow, bag: ErrorBag): 'active' | 'inactive' | undefined {
  const raw = r.get('status');
  if (raw === '') return undefined;
  const st = parseStatus(raw);
  if (!st) { bag.row(r.rowNo, 'สถานะต้องเป็น ใช้งาน หรือ ไม่ใช้งาน'); return undefined; }
  return st;
}

class NameIndex<T extends { id: string; name: string }> {
  private map = new Map<string, T>();
  constructor(items: T[]) { items.forEach(i => { const k = normName(i.name); if (!this.map.has(k)) this.map.set(k, i); }); }
  get(name: string): T | undefined { return this.map.get(normName(name)); }
}

function pushUnique(list: string[], name: string): void {
  if (!list.some(n => normName(n) === normName(name))) list.push(name);
}

// ─── Product plan ─────────────────────────────────────────────────────────────
const PRODUCT_LEVEL_KEYS = [
  'name', 'productType', 'category', 'brand', 'supplier', 'vatIncluded', 'vatRate',
  'stockQty', 'minStock', 'status', 'color', 'size', 'lotNumber', 'modelYear', 'image', 'options',
];

export function planProductImport(wb: Workbook, ctx: ImportContext): ProductImportPlan {
  const plan: ProductImportPlan = { entity: 'product', creates: [], updates: [], ...emptyBase() };
  const prodTable = readTable(mainSheet('product', wb), PRODUCT_COLUMNS);
  const variantSheet = findSheet(wb, SHEET_NAMES.variant);
  const varTable = readTable(variantSheet, VARIANT_COLUMNS, true);
  plan.fileErrors.push(...prodTable.fileErrors, ...varTable.fileErrors);
  if (plan.fileErrors.length > 0) return plan;

  const pBag = new ErrorBag(SHEET_NAMES.product);
  const vBag = new ErrorBag(SHEET_NAMES.variant);
  const stamp = Date.now();
  const now = new Date();
  const label = (key: string) => PRODUCT_COLUMNS.find(c => c.key === key)?.label ?? key;

  // ── 1) จัดกลุ่มแถวสินค้าตามรหัส ──
  const groups = new Map<string, { code: string; rows: TableRow[] }>();
  prodTable.rows.forEach(r => {
    const code = r.get('code');
    if (!code) { pBag.row(r.rowNo, 'กรุณากรอกรหัสสินค้า'); plan.skippedRows++; return; }
    const k = normName(code);
    const g = groups.get(k);
    if (g) g.rows.push(r); else groups.set(k, { code, rows: [r] });
  });
  const variantGroups = new Map<string, { code: string; rows: TableRow[] }>();
  varTable.rows.forEach(r => {
    const code = r.get('code');
    if (!code) { vBag.row(r.rowNo, 'กรุณากรอกรหัสสินค้า'); return; }
    const k = normName(code);
    const g = variantGroups.get(k);
    if (g) g.rows.push(r); else variantGroups.set(k, { code, rows: [r] });
  });

  // ── 2) บาร์โค้ดที่มีอยู่แล้วในระบบ (ไม่นับสินค้าที่ถูกนำเข้าทับในไฟล์นี้) ──
  const existingByCode = new Map(ctx.products.map(p => [normName(p.code), p]));
  const existingOwner = new Map<string, string>();
  ctx.products.forEach(p => {
    const k = normName(p.code);
    if (!groups.has(k)) {
      if (p.barcode) existingOwner.set(p.barcode, p.code);
      (p.uoms ?? []).forEach(u => u.barcodes.forEach(b => existingOwner.set(b, p.code)));
    }
    if (!variantGroups.has(k)) (p.variants ?? []).forEach(v => { if (v.barcode) existingOwner.set(v.barcode, p.code); });
  });
  const fileBarcodes = new Map<string, { rowNo: number; sheet: string }>();
  /** ตรวจบาร์โค้ดซ้ำ — คืน true ถ้าผ่าน */
  const claimBarcode = (bc: string, rowNo: number, bag: ErrorBag, sheet: string): boolean => {
    const prev = fileBarcodes.get(bc);
    if (prev) {
      const where = prev.sheet === sheet ? `แถว ${prev.rowNo}` : `${prev.sheet} แถว ${prev.rowNo}`;
      bag.row(rowNo, `บาร์โค้ด ${bc} ซ้ำในไฟล์ (${where})`);
      return false;
    }
    fileBarcodes.set(bc, { rowNo, sheet });
    const owner = existingOwner.get(bc);
    if (owner) { bag.row(rowNo, `บาร์โค้ด ${bc} ซ้ำกับสินค้า ${owner}`); return false; }
    return true;
  };

  const catIdx = new NameIndex(ctx.categories);
  const brandIdx = new NameIndex(ctx.brands);
  const supIdx = new NameIndex(ctx.suppliers);

  /** ตรวจ + สร้าง variants ของสินค้าจากแถวในชีต ตัวเลือกสินค้า */
  const buildVariants = (code: string, rows: TableRow[], options: ProductOption[], existing: ProductVariant[], seq: number): ProductVariant[] | null => {
    const before = vBag.size;
    const seen = new Map<string, number>();
    const out: ProductVariant[] = [];
    rows.forEach((r, k) => {
      const errCount = vBag.size;
      const pairs = parseOptionValuePairs(r.get('optionValues'));
      const ov: Record<string, string> = {};
      if (!pairs) {
        vBag.row(r.rowNo, 'รูปแบบค่าตัวเลือกไม่ถูกต้อง (ตัวอย่าง สี=แดง; ไซส์=M)');
      } else {
        pairs.forEach(([name, value]) => {
          const opt = options.find(o => normName(o.name) === normName(name));
          const val = opt?.values.find(x => normName(x) === normName(value));
          if (!opt || val === undefined) vBag.row(r.rowNo, `ตัวเลือก ${name}=${value} ไม่มีในตัวเลือกของสินค้า ${code}`);
          else ov[opt.name] = val;
        });
        options.forEach(o => { if (ov[o.name] === undefined && vBag.size === errCount) vBag.row(r.rowNo, `กรุณาระบุค่าตัวเลือก ${o.name}`); });
      }
      const sku = r.get('sku');
      const barcode = r.get('barcode');
      if (barcode) claimBarcode(barcode, r.rowNo, vBag, SHEET_NAMES.variant);
      const price = readNonNegative(r, 'price', 'ราคาตัวเลือก', vBag);
      const stockQty = readNonNegative(r, 'stockQty', 'สต๊อกตัวเลือก', vBag) ?? 0;
      if (vBag.size !== errCount) return;
      const key = comboKey(ov);
      const dup = seen.get(key);
      if (dup !== undefined) { vBag.row(r.rowNo, `ค่าตัวเลือกซ้ำกับแถว ${dup}`); return; }
      seen.set(key, r.rowNo);
      const prev = existing.find(v => comboKey(v.optionValues) === key);
      const variant: ProductVariant = { id: prev?.id ?? `v${stamp}${seq}x${k}`, stockQty, optionValues: ov };
      if (sku) variant.sku = sku;
      if (barcode) variant.barcode = barcode;
      if (price !== undefined) variant.price = price;
      out.push(variant);
    });
    return vBag.size === before ? out : null;
  };

  const variantsFitOptions = (variants: ProductVariant[], options: ProductOption[]): boolean =>
    variants.every(v => Object.entries(v.optionValues).every(([k, val]) =>
      options.some(o => o.name === k && o.values.includes(val))));

  let seq = 0;
  /** สินค้าที่ผ่านการตรวจรายแถวแล้ว — รอตรวจบาร์โค้ดซ้ำรอบสุดท้าย (ข้อ 5) */
  const pending: PendingProduct[] = [];
  // ── 3) ตรวจ/สร้างสินค้าแต่ละรหัส ──
  groups.forEach((g, codeKey) => {
    seq++;
    const pBefore = pBag.size;
    const vBefore = vBag.size;
    const { code, rows } = g;
    const first = rows[0];
    const existing = existingByCode.get(codeKey);

    // ค่าระดับสินค้า: ค่าแรกที่ไม่ว่าง ต้องตรงกันทุกแถว
    const pv: Record<string, { value: string; row: TableRow }> = {};
    PRODUCT_LEVEL_KEYS.forEach(key => {
      let found: { value: string; row: TableRow } | undefined;
      rows.forEach(r => {
        const val = r.get(key);
        if (!val) return;
        if (!found) found = { value: val, row: r };
        else if (normName(found.value) !== normName(val)) {
          pBag.raw(r.rowNo, `สินค้า ${code}: ข้อมูล${label(key)}ไม่ตรงกันระหว่างแถว ${found.row.rowNo} และแถว ${r.rowNo}`);
        }
      });
      pv[key] = found ?? { value: '', row: first };
    });
    const pr = (key: string) => pv[key].row;

    const name = pv.name.value;
    if (!name) pBag.row(first.rowNo, 'กรุณากรอกชื่อสินค้า');
    let productType: 'general' | 'service' | undefined;
    if (pv.productType.value) {
      productType = parseProductType(pv.productType.value) ?? undefined;
      if (!productType) pBag.row(pr('productType').rowNo, 'ประเภทสินค้าต้องเป็น ทั่วไป หรือ บริการ');
    }
    const vatIncluded = readYN(pr('vatIncluded'), 'vatIncluded', label('vatIncluded'), pBag);
    let vatRate: number | undefined;
    if (pv.vatRate.value) {
      const n = parseNumber(pv.vatRate.value);
      if (n !== 0 && n !== 7) pBag.row(pr('vatRate').rowNo, 'อัตรา VAT ต้องเป็น 0 หรือ 7');
      else vatRate = n;
    }
    const stockQty = readNonNegative(pr('stockQty'), 'stockQty', label('stockQty'), pBag);
    const minStock = readNonNegative(pr('minStock'), 'minStock', label('minStock'), pBag);
    const status = readStatus(pr('status'), pBag);
    let options: ProductOption[] | undefined;
    if (pv.options.value) {
      options = parseOptions(pv.options.value) ?? undefined;
      if (!options) pBag.row(pr('options').rowNo, 'รูปแบบตัวเลือกสินค้าไม่ถูกต้อง (ตัวอย่าง สี=แดง|น้ำเงิน; ไซส์=M|L)');
    }

    // หน่วยนับ — สินค้าเดิม: รวม (merge) กับหน่วยเดิม
    //   • หน่วยเดิมที่ไม่มีแถวในไฟล์ → คงไว้ทั้งหมด
    //   • ช่อง อัตราส่วน / ราคาทุน / บาร์โค้ด ที่ว่าง (หรือไม่มีคอลัมน์) → คงค่าเดิมของหน่วยนั้น
    const exUoms: ProductUOM[] = existing ? (() => { const o = orderedUoms(existing); return [o.base, ...o.others]; })() : [];
    const exBase = exUoms[0];
    interface ParsedUom {
      row?: TableRow; unit: string; ratio: number; isBase?: boolean; isDefault?: boolean;
      barcodes: string[]; barcodesFromPrev: boolean; cost: number; sale: number; prev?: ProductUOM;
    }
    const parsed: ParsedUom[] = [];
    rows.forEach(r => {
      const errCount = pBag.size;
      const unit = r.get('unit');
      if (!unit) pBag.row(r.rowNo, 'กรุณากรอกหน่วย');
      const prev = unit ? exUoms.find(x => normName(x.unit) === normName(unit)) : undefined;
      let ratio = prev?.ratio ?? 1;
      if (r.get('ratio')) {
        ratio = parseNumber(r.get('ratio'));
        if (Number.isNaN(ratio)) pBag.row(r.rowNo, 'อัตราส่วนต้องเป็นตัวเลข');
        else if (ratio <= 0) pBag.row(r.rowNo, 'อัตราส่วนต้องมากกว่า 0');
      }
      const isBase = readYN(r, 'isBase', label('isBase'), pBag);
      const isDefault = readYN(r, 'isDefault', label('isDefault'), pBag);
      const barcodesFromPrev = r.get('barcodes') === '' && !!prev;
      const barcodes = barcodesFromPrev ? [...(prev?.barcodes ?? [])] : splitBarcodes(r.get('barcodes'));
      if (!barcodesFromPrev) barcodes.forEach(bc => claimBarcode(bc, r.rowNo, pBag, SHEET_NAMES.product));
      const cost = readNonNegative(r, 'costPrice', label('costPrice'), pBag) ?? prev?.costPrice ?? 0;
      let sale = 0;
      if (!r.get('salePrice')) pBag.row(r.rowNo, 'กรุณากรอกราคาขาย');
      else sale = readNonNegative(r, 'salePrice', label('salePrice'), pBag) ?? 0;
      if (pBag.size === errCount) parsed.push({ row: r, unit, ratio, isBase, isDefault, barcodes, barcodesFromPrev, cost, sale, prev });
    });

    let uoms: ProductUOM[] = [];
    let baseBarcodesFromPrev = false;
    if (parsed.length === rows.length) {
      const seenUnits = new Set<string>();
      parsed.forEach(u => {
        const k = normName(u.unit);
        if (seenUnits.has(k) && u.row) pBag.raw(u.row.rowNo, `สินค้า ${code}: หน่วย ${u.unit} ซ้ำ`);
        seenUnits.add(k);
      });
      // หน่วยเดิมที่ไม่มีในไฟล์ → คงไว้
      const kept: ParsedUom[] = exUoms
        .filter(x => !seenUnits.has(normName(x.unit)))
        .map(x => ({ unit: x.unit, ratio: x.ratio, barcodes: [...x.barcodes], barcodesFromPrev: true, cost: x.costPrice, sale: x.salePrice, prev: x }));
      const entries = [...parsed, ...kept];

      const explicitBase = entries.some(u => u.isBase === true);
      let bases: ParsedUom[];
      if (explicitBase) {
        bases = entries.filter(u => u.isBase === true);
      } else {
        const candidates = entries.filter(u => u.isBase !== false);
        const prevBase = exBase ? candidates.find(u => u.prev === exBase) : undefined;
        bases = prevBase ? [prevBase] : candidates.filter(u => u.ratio === 1);
      }
      const baseRow = (u: ParsedUom) => u.row?.rowNo ?? first.rowNo;
      if (bases.length === 0) pBag.raw(first.rowNo, `สินค้า ${code} ไม่มีหน่วยหลัก`);
      else if (bases.length > 1) pBag.raw(first.rowNo, `สินค้า ${code} มีหน่วยหลักมากกว่า 1 หน่วย`);
      else if (bases[0].ratio !== 1) pBag.raw(baseRow(bases[0]), `สินค้า ${code}: หน่วยหลักต้องมีอัตราส่วน 1`);
      const explicitDefault = parsed.filter(u => u.isDefault === true);
      if (explicitDefault.length > 1) pBag.raw(first.rowNo, `สินค้า ${code} มีหน่วยเริ่มต้น POS มากกว่า 1 หน่วย`);
      if (bases.length === 1) {
        const base = bases[0];
        const ordered = [base, ...entries.filter(u => u !== base)];
        const flags = ordered.map(u => (explicitDefault.length > 0 ? u.isDefault === true : (u.isDefault ?? u.prev?.isDefault ?? false)));
        if (!flags.some(Boolean) && base.isDefault !== false) flags[0] = true;
        uoms = ordered.map((u, j) => ({
          id: u.prev?.id || `u${stamp}${seq}x${j}`,
          unit: u.unit,
          ratio: u.ratio,
          costPrice: u.cost,
          salePrice: u.sale,
          barcodes: u.barcodes,
          isDefault: flags[j],
        }));
        baseBarcodesFromPrev = base.barcodesFromPrev;
      }
    }

    // ตัวเลือกสินค้า / variants
    const vGroup = variantGroups.get(codeKey);
    const effectiveOptions = options ?? existing?.options;
    let variants: ProductVariant[] | undefined;
    if (vGroup) {
      if (!effectiveOptions || effectiveOptions.length === 0) {
        vBag.raw(vGroup.rows[0].rowNo, `${SHEET_NAMES.variant} แถว ${vGroup.rows[0].rowNo}: สินค้า ${code} ยังไม่มีตัวเลือกสินค้า (กรอกคอลัมน์ ตัวเลือกสินค้า ในตารางสินค้า)`);
      } else {
        variants = buildVariants(code, vGroup.rows, effectiveOptions, existing?.variants ?? [], seq) ?? undefined;
      }
    } else if (options) {
      if (existing?.variants?.length) {
        if (!variantsFitOptions(existing.variants, options)) {
          pBag.raw(pr('options').rowNo, `สินค้า ${code}: ตัวเลือกสินค้าใหม่ไม่ตรงกับตัวเลือกที่มีอยู่ กรุณาระบุแถวในชีต ${SHEET_NAMES.variant}`);
        }
      } else {
        variants = [];
      }
    }

    if (pBag.size !== pBefore || vBag.size !== vBefore) {
      plan.skippedRecords++;
      plan.skippedRows += rows.length;
      return;
    }

    // หมวดหมู่ / แบรนด์ / ผู้จำหน่าย (by name) — มาสเตอร์ใหม่จะถูกนับเมื่อสินค้าผ่านการตรวจทั้งหมด
    const masters = { categories: [] as string[], brands: [] as string[], suppliers: [] as string[] };
    const masterFields: Partial<ProductMaster> = {};
    if (pv.category.value) {
      const c = catIdx.get(pv.category.value);
      masterFields.categoryId = c?.id ?? '';
      masterFields.categoryName = c?.name ?? pv.category.value;
      if (!c) masters.categories.push(pv.category.value);
    }
    if (pv.brand.value) {
      const b = brandIdx.get(pv.brand.value);
      if (b) masterFields.brandId = b.id;
      masterFields.brandName = b?.name ?? pv.brand.value;
      if (!b) masters.brands.push(pv.brand.value);
    }
    if (pv.supplier.value) {
      const s = supIdx.get(pv.supplier.value);
      if (s) masterFields.supplierId = s.id;
      masterFields.supplierName = s?.name ?? pv.supplier.value;
      if (!s) masters.suppliers.push(pv.supplier.value);
    }

    const base = uoms[0];
    // บาร์โค้ดหลักเดิมคงไว้ถ้าบาร์โค้ดของหน่วยฐานไม่ได้ถูกแก้ในไฟล์
    const keepPrimary = baseBarcodesFromPrev && !!existing?.barcode && base.barcodes.includes(existing.barcode);
    const core: Partial<ProductMaster> = {
      name,
      unit: base.unit,
      barcode: keepPrimary && existing ? existing.barcode : (base.barcodes[0] ?? ''),
      costPrice: base.costPrice,
      salePrice: base.salePrice,
      uoms,
      ...masterFields,
    };
    const optional: Partial<ProductMaster> = {};
    if (productType) optional.productType = productType;
    if (vatIncluded !== undefined) optional.vatIncluded = vatIncluded;
    if (vatRate !== undefined) optional.vatRate = vatRate;
    if (stockQty !== undefined) optional.stockQty = stockQty;
    if (minStock !== undefined) optional.minStock = minStock;
    if (status) optional.status = status;
    if (pv.color.value) optional.color = pv.color.value;
    if (pv.size.value) optional.size = pv.size.value;
    if (pv.lotNumber.value) optional.lotNumber = pv.lotNumber.value;
    if (pv.modelYear.value) optional.modelYear = pv.modelYear.value;
    if (pv.image.value) optional.image = pv.image.value;
    if (options) optional.options = options;
    if (variants) optional.variants = variants;

    const pendingBase = { codeKey, code, firstRow: first.rowNo, rowCount: rows.length, masters };
    if (existing) {
      pending.push({ ...pendingBase, existing, update: { ...core, ...optional } });
    } else {
      pending.push({ ...pendingBase, create: {
        id: `p${stamp}${seq}`,
        code,
        categoryId: '',
        categoryName: '',
        vatIncluded: true,
        vatRate: 7,
        status: 'active',
        stockQty: 0,
        minStock: 0,
        productType: 'general',
        ...core,
        ...optional,
        createdAt: now,
        updatedAt: now,
      } as ProductMaster });
    }
  });

  // ── 4) แถว variant ของสินค้าที่ไม่อยู่ในตารางสินค้า (อัปเดต variants อย่างเดียว) ──
  variantGroups.forEach((vg, codeKey) => {
    if (groups.has(codeKey)) return;
    seq++;
    const existing = existingByCode.get(codeKey);
    if (!existing) {
      vg.rows.forEach(r => vBag.row(r.rowNo, `ไม่พบสินค้า ${vg.code}`));
      plan.skippedRecords++;
      return;
    }
    if (!existing.options?.length) {
      vBag.row(vg.rows[0].rowNo, `สินค้า ${existing.code} ยังไม่มีตัวเลือกสินค้า`);
      plan.skippedRecords++;
      return;
    }
    const variants = buildVariants(existing.code, vg.rows, existing.options, existing.variants ?? [], seq);
    if (!variants) { plan.skippedRecords++; return; }
    pending.push({
      codeKey, code: existing.code, firstRow: vg.rows[0].rowNo, rowCount: 0,
      masters: { categories: [], brands: [], suppliers: [] }, existing, update: { variants },
    });
  });

  // ── 5) ตรวจบาร์โค้ดซ้ำทั้งระบบอีกรอบ หลังรู้ว่าสินค้าใดถูกข้าม ──
  //   สินค้าในไฟล์ที่ถูกข้ามจะคงบาร์โค้ดเดิม จึงต้องไม่ให้สินค้าอื่นในไฟล์มาใช้บาร์โค้ดนั้น
  //   (ทำซ้ำจนไม่มีการข้ามเพิ่ม เพราะการข้ามแต่ละครั้งทำให้บาร์โค้ดเดิมกลับมามีเจ้าของ)
  const rejected = new Set<PendingProduct>();
  for (;;) {
    const active = pending.filter(p => !rejected.has(p));
    const activeKeys = new Set(active.map(p => p.codeKey));
    const owners = new Map<string, { code: string; pending?: PendingProduct }[]>();
    const own = (bc: string, entry: { code: string; pending?: PendingProduct }) => {
      const list = owners.get(bc) ?? [];
      if (!list.some(o => o.code === entry.code)) list.push(entry);
      owners.set(bc, list);
    };
    ctx.products.forEach(p => { if (!activeKeys.has(normName(p.code))) productBarcodes(p).forEach(bc => own(bc, { code: p.code })); });
    active.forEach(p => productBarcodes(p.create ?? { ...p.existing, ...p.update }).forEach(bc => own(bc, { code: p.code, pending: p })));
    let rejectedNow = 0;
    owners.forEach((list, bc) => {
      if (list.length < 2) return;
      list.forEach(o => {
        const pp = o.pending;
        // เฉพาะสินค้าที่ "ขอใช้บาร์โค้ดใหม่" จากไฟล์ — บาร์โค้ดที่เป็นของตัวเองอยู่แล้วไม่นับ
        if (!pp || rejected.has(pp) || (pp.existing && productBarcodes(pp.existing).includes(bc))) return;
        const other = list.find(x => x.code !== o.code);
        const at = fileBarcodes.get(bc);
        const bag = at?.sheet === SHEET_NAMES.variant ? vBag : pBag;
        bag.row(at?.rowNo ?? pp.firstRow, `บาร์โค้ด ${bc} ซ้ำกับสินค้า ${other?.code ?? ''}`);
        rejected.add(pp);
        rejectedNow++;
      });
    });
    if (rejectedNow === 0) break;
  }

  pending.forEach(p => {
    if (rejected.has(p)) {
      plan.skippedRecords++;
      plan.skippedRows += p.rowCount;
      return;
    }
    p.masters.categories.forEach(n => pushUnique(plan.newMasters.categories, n));
    p.masters.brands.forEach(n => pushUnique(plan.newMasters.brands, n));
    p.masters.suppliers.forEach(n => pushUnique(plan.newMasters.suppliers, n));
    if (p.create) plan.creates.push(p.create);
    else if (p.existing && p.update) {
      if (isUnchanged(p.existing, p.update)) plan.unchanged++;
      else plan.updates.push({ id: p.existing.id, code: p.existing.code, data: p.update });
    }
  });

  plan.errors = [...pBag.list, ...vBag.list];
  return plan;
}

interface PendingProduct {
  codeKey: string;
  code: string;
  firstRow: number;
  /** จำนวนแถวในตารางสินค้า (0 = มีเฉพาะแถวตัวเลือกสินค้า) */
  rowCount: number;
  masters: { categories: string[]; brands: string[]; suppliers: string[] };
  existing?: ProductMaster;
  create?: ProductMaster;
  update?: Partial<ProductMaster>;
}

/** บาร์โค้ดทั้งหมดของสินค้า (บาร์โค้ดหลัก + ทุกหน่วย + ทุกตัวเลือก) */
function productBarcodes(p: Partial<ProductMaster>): string[] {
  const out = new Set<string>();
  if (p.barcode) out.add(p.barcode);
  (p.uoms ?? []).forEach(u => u.barcodes.forEach(b => { if (b) out.add(b); }));
  (p.variants ?? []).forEach(v => { if (v.barcode) out.add(v.barcode); });
  return [...out];
}

// ─── Category / Brand / Supplier plans ───────────────────────────────────────
export function planCategoryImport(wb: Workbook, ctx: ImportContext): CategoryImportPlan {
  const plan: CategoryImportPlan = { entity: 'category', creates: [], updates: [], ...emptyBase() };
  const table = readTable(mainSheet('category', wb), CATEGORY_COLUMNS);
  plan.fileErrors.push(...table.fileErrors);
  if (plan.fileErrors.length > 0) return plan;
  const bag = new ErrorBag();
  const idx = new NameIndex(ctx.categories);

  interface Parsed { row: TableRow; name: string; parent: string; status?: 'active' | 'inactive' }
  let ok: Parsed[] = [];
  let rejected = 0;
  const seen = new Map<string, number>();
  table.rows.forEach(r => {
    const before = bag.size;
    const name = r.get('name');
    if (!name) bag.row(r.rowNo, 'กรุณากรอกชื่อหมวดหมู่');
    const status = readStatus(r, bag);
    const parent = r.get('parent');
    if (name) {
      const dup = seen.get(normName(name));
      if (dup !== undefined) bag.row(r.rowNo, `ชื่อหมวดหมู่ ${name} ซ้ำในไฟล์ (แถว ${dup})`);
      else seen.set(normName(name), r.rowNo);
      if (parent && normName(parent) === normName(name)) bag.row(r.rowNo, 'หมวดหมู่หลักต้องไม่ใช่หมวดหมู่เดียวกัน');
    }
    if (bag.size === before) ok.push({ row: r, name, parent, status });
    else rejected++;
  });

  /** หมวดหมู่หลักต้องมีในระบบ หรือเป็นแถวที่ถูกต้องในไฟล์ (ตัดต่อเนื่องจนคงที่) */
  const dropMissingParents = (): void => {
    let changed = true;
    while (changed) {
      changed = false;
      const names = new Set(ok.map(p => normName(p.name)));
      ok = ok.filter(p => {
        if (!p.parent || idx.get(p.parent) || names.has(normName(p.parent))) return true;
        bag.row(p.row.rowNo, `ไม่พบหมวดหมู่หลัก ${p.parent}`);
        rejected++; changed = true;
        return false;
      });
    }
  };
  dropMissingParents();

  // สร้างใหม่: เรียงให้หมวดหมู่หลักถูกสร้างก่อน (ตรวจวนซ้ำ)
  const isNewParent = (p: Parsed) => !!p.parent && !idx.get(p.parent);
  const placed = new Set<string>();
  const ordered: Parsed[] = [];
  let progress = true;
  while (progress) {
    progress = false;
    ok.filter(p => !idx.get(p.name) && !placed.has(normName(p.name))).forEach(p => {
      if (!isNewParent(p) || placed.has(normName(p.parent))) {
        placed.add(normName(p.name)); ordered.push(p); progress = true;
      }
    });
  }
  ok = ok.filter(p => {
    if (idx.get(p.name) || placed.has(normName(p.name))) return true;
    bag.row(p.row.rowNo, 'หมวดหมู่หลักวนซ้ำกัน');
    rejected++;
    return false;
  });
  dropMissingParents();

  ok.forEach(p => {
    const existing = idx.get(p.name);
    if (!existing) return;
    const parentExisting = p.parent ? idx.get(p.parent) : undefined;
    const data: CategoryImportPlan['updates'][number]['data'] = {};
    if (p.status) data.status = p.status;
    if (parentExisting) data.parentId = parentExisting.id;
    else if (p.parent) data.parentName = p.parent;
    if (!data.parentName && isUnchanged(existing, data)) plan.unchanged++;
    else plan.updates.push({ id: existing.id, data });
  });
  const okNames = new Set(ok.map(p => normName(p.name)));
  ordered.filter(p => okNames.has(normName(p.name))).forEach(p => {
    const parentExisting = p.parent ? idx.get(p.parent) : undefined;
    const draft: CategoryDraft = { name: p.name, status: p.status ?? 'active' };
    if (parentExisting) draft.parentId = parentExisting.id;
    else if (p.parent) draft.parentName = p.parent;
    plan.creates.push(draft);
  });
  plan.skippedRows = rejected;
  plan.skippedRecords = rejected;
  plan.errors = bag.list;
  return plan;
}

export function planBrandImport(wb: Workbook, ctx: ImportContext): BrandImportPlan {
  const plan: BrandImportPlan = { entity: 'brand', creates: [], updates: [], ...emptyBase() };
  const table = readTable(mainSheet('brand', wb), BRAND_COLUMNS);
  plan.fileErrors.push(...table.fileErrors);
  if (plan.fileErrors.length > 0) return plan;
  const bag = new ErrorBag();
  const idx = new NameIndex(ctx.brands);
  const seen = new Map<string, number>();
  table.rows.forEach(r => {
    const before = bag.size;
    const name = r.get('name');
    if (!name) bag.row(r.rowNo, 'กรุณากรอกชื่อแบรนด์');
    const status = readStatus(r, bag);
    if (name) {
      const dup = seen.get(normName(name));
      if (dup !== undefined) bag.row(r.rowNo, `ชื่อแบรนด์ ${name} ซ้ำในไฟล์ (แถว ${dup})`);
      else seen.set(normName(name), r.rowNo);
    }
    if (bag.size !== before) { plan.skippedRows++; plan.skippedRecords++; return; }
    const existing = idx.get(name);
    if (existing) {
      const data: Partial<Omit<Brand, 'id'>> = status ? { status } : {};
      if (isUnchanged(existing, data)) plan.unchanged++;
      else plan.updates.push({ id: existing.id, data });
    } else {
      plan.creates.push({ name, status: status ?? 'active' });
    }
  });
  plan.errors = bag.list;
  return plan;
}

export function planSupplierImport(wb: Workbook, ctx: ImportContext): SupplierImportPlan {
  const plan: SupplierImportPlan = { entity: 'supplier', creates: [], updates: [], ...emptyBase() };
  const table = readTable(mainSheet('supplier', wb), SUPPLIER_COLUMNS);
  plan.fileErrors.push(...table.fileErrors);
  if (plan.fileErrors.length > 0) return plan;
  const bag = new ErrorBag();
  const nameIdx = new NameIndex(ctx.suppliers);
  const taxIdx = new Map<string, Supplier>();
  ctx.suppliers.forEach(s => { if (s.taxId) taxIdx.set(s.taxId.replace(/[\s-]/g, ''), s); });
  const seenName = new Map<string, number>();
  const seenTax = new Map<string, number>();
  const usedIds = new Set<string>();
  table.rows.forEach(r => {
    const before = bag.size;
    const name = r.get('name');
    if (!name) bag.row(r.rowNo, 'กรุณากรอกชื่อผู้จำหน่าย');
    const taxId = r.get('taxId').replace(/[\s-]/g, '');
    if (taxId && !/^\d{13}$/.test(taxId)) bag.row(r.rowNo, 'เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
    if (name) {
      const dup = seenName.get(normName(name));
      if (dup !== undefined) bag.row(r.rowNo, `ชื่อผู้จำหน่าย ${name} ซ้ำในไฟล์ (แถว ${dup})`);
      else seenName.set(normName(name), r.rowNo);
    }
    if (taxId) {
      const dup = seenTax.get(taxId);
      if (dup !== undefined) bag.row(r.rowNo, `เลขผู้เสียภาษี ${taxId} ซ้ำในไฟล์ (แถว ${dup})`);
      else seenTax.set(taxId, r.rowNo);
    }
    const existing = (taxId ? taxIdx.get(taxId) : undefined) ?? nameIdx.get(name);
    if (existing && usedIds.has(existing.id)) bag.row(r.rowNo, `ผู้จำหน่าย ${existing.name} ถูกอ้างถึงซ้ำในไฟล์`);
    if (bag.size !== before) { plan.skippedRows++; plan.skippedRecords++; return; }
    const phone = r.get('phone');
    const contactName = r.get('contactName');
    if (existing) {
      usedIds.add(existing.id);
      const data: Partial<Omit<Supplier, 'id'>> = { name };
      if (taxId) data.taxId = taxId;
      if (phone) data.phone = phone;
      if (contactName) data.contactName = contactName;
      if (isUnchanged(existing, data)) plan.unchanged++;
      else plan.updates.push({ id: existing.id, data });
    } else {
      const draft: SupplierDraft = { name };
      if (taxId) draft.taxId = taxId;
      if (phone) draft.phone = phone;
      if (contactName) draft.contactName = contactName;
      plan.creates.push(draft);
    }
  });
  plan.errors = bag.list;
  return plan;
}

export function planImport(entity: MasterEntity, wb: Workbook, ctx: ImportContext): ImportPlan {
  switch (entity) {
    case 'product': return planProductImport(wb, ctx);
    case 'category': return planCategoryImport(wb, ctx);
    case 'brand': return planBrandImport(wb, ctx);
    case 'supplier': return planSupplierImport(wb, ctx);
  }
}

/** จำนวนรายการที่จะถูกบันทึก (เพิ่ม + อัปเดต) */
export function plannedWrites(plan: ImportPlan): number {
  return plan.creates.length + plan.updates.length;
}

// ─── Apply ────────────────────────────────────────────────────────────────────
export function applyImport(plan: ImportPlan, ports: MasterPorts): ImportResult {
  const result: ImportResult = {
    created: 0, updated: 0, unchanged: plan.unchanged, mastersCreated: 0,
    skipped: plan.skippedRecords, errors: plan.errors.length,
  };
  if (plan.fileErrors.length > 0) return result;

  if (plan.entity === 'product') {
    const catIds = new Map<string, string>();
    const brandIds = new Map<string, string>();
    const supIds = new Map<string, string>();
    plan.newMasters.categories.forEach(n => { catIds.set(normName(n), ports.addCategory({ name: n, status: 'active' }).id); result.mastersCreated++; });
    plan.newMasters.brands.forEach(n => { brandIds.set(normName(n), ports.addBrand({ name: n, status: 'active' }).id); result.mastersCreated++; });
    plan.newMasters.suppliers.forEach(n => { supIds.set(normName(n), ports.addSupplier({ name: n }).id); result.mastersCreated++; });
    const resolve = <T extends Partial<ProductMaster>>(d: T): T => {
      const out = { ...d };
      if (out.categoryName && !out.categoryId) out.categoryId = catIds.get(normName(out.categoryName)) ?? '';
      if (out.brandName && !out.brandId) out.brandId = brandIds.get(normName(out.brandName));
      if (out.supplierName && !out.supplierId) out.supplierId = supIds.get(normName(out.supplierName));
      return out;
    };
    plan.creates.forEach(p => { ports.addProduct(resolve(p)); result.created++; });
    plan.updates.forEach(u => { ports.updateProduct(u.id, resolve(u.data)); result.updated++; });
  } else if (plan.entity === 'category') {
    const ids = new Map<string, string>();
    plan.creates.forEach(d => {
      const parentId = d.parentId ?? (d.parentName ? ids.get(normName(d.parentName)) : undefined);
      const c = ports.addCategory({ name: d.name, status: d.status, ...(parentId ? { parentId } : {}) });
      ids.set(normName(d.name), c.id);
      result.created++;
    });
    plan.updates.forEach(u => {
      const { parentName, ...rest } = u.data;
      const data: Partial<Omit<Category, 'id'>> = { ...rest };
      if (parentName) { const pid = ids.get(normName(parentName)); if (pid) data.parentId = pid; }
      ports.updateCategory(u.id, data);
      result.updated++;
    });
  } else if (plan.entity === 'brand') {
    plan.creates.forEach(d => { ports.addBrand(d); result.created++; });
    plan.updates.forEach(u => { ports.updateBrand(u.id, u.data); result.updated++; });
  } else {
    plan.creates.forEach(d => { ports.addSupplier(d); result.created++; });
    plan.updates.forEach(u => { ports.updateSupplier(u.id, u.data); result.updated++; });
  }

  const moduleName = ENTITY_LABELS[plan.entity];
  const parts = [`เพิ่ม ${result.created}`, `อัปเดต ${result.updated}`, `ไม่เปลี่ยนแปลง ${result.unchanged}`];
  if (plan.entity === 'product') parts.push(`สร้างมาสเตอร์ใหม่ ${result.mastersCreated}`);
  parts.push(`ข้าม ${result.skipped}`);
  ports.logAction(moduleName, 'นำเข้าข้อมูล', `นำเข้า${moduleName}: ${parts.join(' ')} รายการ`, { ...result });
  return result;
}
