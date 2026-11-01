/**
 * Fixtures ร่วมสำหรับ tests ของ masterImportExport (plan / apply / migration review)
 */
import {
  ColumnDef, ImportContext, MasterPorts, Workbook, csvToWorkbook, workbookToCsv,
} from '../masterImportExport';
import { ProductMaster, Category, Brand } from '../../types/product';
import { Supplier } from '../../types/inventory';

export const D = new Date('2024-01-01');

export const SAMPLE: ProductMaster[] = [
  {
    id: 'p100', code: 'P100', barcode: '8851000000011', name: 'น้ำดื่มทดสอบ 600ml',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม', brandId: 'b1', brandName: 'สิงห์',
    supplierId: 's1', supplierName: 'บริษัท ทดสอบ, จำกัด', unit: 'ขวด',
    costPrice: 5, salePrice: 10, vatIncluded: true, vatRate: 7, productType: 'general',
    status: 'active', stockQty: 240, minStock: 24,
    uoms: [
      { id: 'u100a', unit: 'ขวด', ratio: 1, costPrice: 5, salePrice: 10, barcodes: ['8851000000011', '8851000000012'], isDefault: false },
      { id: 'u100b', unit: 'แพ็ค', ratio: 6, costPrice: 30, salePrice: 55, barcodes: ['8851000000013'], isDefault: true },
      { id: 'u100c', unit: 'ลัง', ratio: 24, costPrice: 115.5, salePrice: 200, barcodes: ['8851000000014'], isDefault: false },
    ],
    createdAt: D, updatedAt: D,
  },
  {
    id: 'p200', code: 'P200', barcode: '', name: 'บริการล้างแอร์ "พิเศษ"',
    categoryId: 'c9', categoryName: 'บริการ', unit: 'ครั้ง',
    costPrice: 300, salePrice: 500, vatIncluded: false, vatRate: 0, productType: 'service',
    status: 'inactive', stockQty: 0, minStock: 0,
    color: 'ขาว', size: 'XL', lotNumber: 'LOT-01', modelYear: '2025', image: 'https://example.com/a.png',
    uoms: [{ id: 'u200a', unit: 'ครั้ง', ratio: 1, costPrice: 300, salePrice: 500, barcodes: [], isDefault: true }],
    createdAt: D, updatedAt: D,
  },
  {
    id: 'p300', code: '00300', barcode: '8851000000030', name: 'เสื้อยืดทดสอบ',
    categoryId: 'c4', categoryName: 'ของใช้', unit: 'ตัว',
    costPrice: 80, salePrice: 199, vatIncluded: true, vatRate: 7, productType: 'general',
    status: 'active', stockQty: 20, minStock: 5,
    uoms: [{ id: 'u300a', unit: 'ตัว', ratio: 1, costPrice: 80, salePrice: 199, barcodes: ['8851000000030'], isDefault: true }],
    options: [{ name: 'สี', values: ['แดง', 'น้ำเงิน'] }, { name: 'ไซส์', values: ['M', 'L'] }],
    variants: [
      { id: 'v1', sku: '00300-RD-M', barcode: '8851000000031', price: 199, stockQty: 10, optionValues: { 'สี': 'แดง', 'ไซส์': 'M' } },
      { id: 'v2', barcode: '8851000000032', stockQty: 3, optionValues: { 'ไซส์': 'L', 'สี': 'น้ำเงิน' } },
    ],
    createdAt: D, updatedAt: D,
  },
];

export const emptyCtx = (): ImportContext => ({ products: [], categories: [], brands: [], suppliers: [] });

/** ระบบที่มี SAMPLE อยู่แล้ว พร้อมมาสเตอร์ที่ตรงกัน */
export const sampleCtx = (): ImportContext => ({
  products: SAMPLE.map(p => ({ ...p })),
  categories: [
    { id: 'c1', name: 'เครื่องดื่ม', productCount: 0, status: 'active' },
    { id: 'c9', name: 'บริการ', productCount: 0, status: 'active' },
    { id: 'c4', name: 'ของใช้', productCount: 0, status: 'active' },
  ],
  brands: [{ id: 'b1', name: 'สิงห์', productCount: 0, status: 'active' }],
  suppliers: [{ id: 's1', name: 'บริษัท ทดสอบ, จำกัด' }],
});

/** ports ปลอมที่เขียนลง ImportContext ในหน่วยความจำ */
export function fakePorts(ctx: ImportContext) {
  const logs: { module: string; action: string; description: string; metadata?: Record<string, unknown> }[] = [];
  let n = 0;
  const ports: MasterPorts = {
    addProduct: p => { ctx.products = [p, ...ctx.products]; },
    updateProduct: (id, d) => { ctx.products = ctx.products.map(p => (p.id === id ? { ...p, ...d } : p)); },
    addCategory: d => { const c: Category = { id: `nc${++n}`, productCount: 0, ...d }; ctx.categories.push(c); return c; },
    updateCategory: (id, d) => { ctx.categories = ctx.categories.map(c => (c.id === id ? { ...c, ...d } : c)); },
    addBrand: d => { const b: Brand = { id: `nb${++n}`, productCount: 0, ...d }; ctx.brands.push(b); return b; },
    updateBrand: (id, d) => { ctx.brands = ctx.brands.map(b => (b.id === id ? { ...b, ...d } : b)); },
    addSupplier: d => { const s: Supplier = { id: `ns${++n}`, ...d }; ctx.suppliers.push(s); return s; },
    updateSupplier: (id, d) => { ctx.suppliers = ctx.suppliers.map(s => (s.id === id ? { ...s, ...d } : s)); },
    logAction: (module, action, description, metadata) => { logs.push({ module, action, description, metadata }); },
  };
  return { ports, logs };
}

export const viaCsv = (entity: Parameters<typeof workbookToCsv>[0], wb: Workbook): Workbook =>
  csvToWorkbook(entity, '\ufeff' + workbookToCsv(entity, wb));

/** สร้างชีตจากชื่อ key → ค่า */
export function sheetOf(name: string, cols: ColumnDef[], rows: Record<string, string | number>[]) {
  const use = cols.filter(c => !c.exportOnly);
  return { name, rows: [use.map(c => c.header), ...rows.map(r => use.map(c => String(r[c.key] ?? '')))] };
}

export const prodRow = (o: Record<string, string | number>): Record<string, string | number> =>
  ({ unit: 'ชิ้น', ratio: 1, isBase: 'Y', salePrice: 10, name: `สินค้า ${o.code}`, ...o });
