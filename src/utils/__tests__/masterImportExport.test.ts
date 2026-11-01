/**
 * Tests — masterImportExport plan / validate / apply
 *   - product round-trip (multi-UOM, multi-barcode, master names, productType, VAT, variants)
 *   - re-import ของไฟล์ที่ export เอง → ไม่มีการเปลี่ยนแปลง
 *   - validation errors (Thai messages) + ข้ามเฉพาะสินค้าที่ผิด
 *   - auto-create หมวดหมู่/แบรนด์/ผู้จำหน่าย
 *   - หมวดหมู่/แบรนด์/ผู้จำหน่าย round-trip + upsert
 *   - template ผ่านการตรวจ, audit log
 */
import { describe, test, expect } from 'vitest';
import {
  ColumnDef, ImportContext, MasterPorts, Workbook,
  PRODUCT_COLUMNS, VARIANT_COLUMNS, CATEGORY_COLUMNS, SUPPLIER_COLUMNS, SHEET_NAMES,
  applyImport, buildTemplate, csvToWorkbook, workbookToCsv,
  exportProducts, exportCategories, exportBrands, exportSuppliers,
  planProductImport, planCategoryImport, planBrandImport, planSupplierImport, planImport,
} from '../masterImportExport';
import { ProductMaster, Category, Brand } from '../../types/product';
import { Supplier } from '../../types/inventory';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS } from '../../data/mockProducts';
import { MOCK_SUPPLIERS } from '../../data/mockInventory';

// ─── Fixtures ────────────────────────────────────────────────────────────────
const D = new Date('2024-01-01');

const SAMPLE: ProductMaster[] = [
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

const emptyCtx = (): ImportContext => ({ products: [], categories: [], brands: [], suppliers: [] });

/** ระบบที่มี SAMPLE อยู่แล้ว พร้อมมาสเตอร์ที่ตรงกัน */
const sampleCtx = (): ImportContext => ({
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
function fakePorts(ctx: ImportContext) {
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

/** ตัด id / วันที่ / id มาสเตอร์ออก เพื่อเทียบข้อมูล */
function comparable(p: ProductMaster) {
  const { id: _id, createdAt: _c, updatedAt: _u, categoryId: _ci, brandId: _bi, supplierId: _si, uoms, variants, ...rest } = p;
  return {
    ...rest,
    uoms: uoms.map(({ id: _x, ...u }) => u),
    variants: variants?.map(({ id: _x, ...v }) => v),
  };
}

const viaCsv = (entity: Parameters<typeof workbookToCsv>[0], wb: Workbook): Workbook =>
  csvToWorkbook(entity, '\ufeff' + workbookToCsv(entity, wb));

/** สร้างชีตจากชื่อ key → ค่า */
function sheetOf(name: string, cols: ColumnDef[], rows: Record<string, string | number>[]) {
  const use = cols.filter(c => !c.exportOnly);
  return { name, rows: [use.map(c => c.header), ...rows.map(r => use.map(c => String(r[c.key] ?? '')))] };
}
const prodRow = (o: Record<string, string | number>): Record<string, string | number> =>
  ({ unit: 'ชิ้น', ratio: 1, isBase: 'Y', salePrice: 10, name: `สินค้า ${o.code}`, ...o });

// ─── Product round-trip ─────────────────────────────────────────────────────
describe('สินค้า — export → CSV → import', () => {
  test('ได้ข้อมูลเดิมครบ: หลายหน่วย หลายบาร์โค้ด หมวดหมู่/แบรนด์/ผู้จำหน่าย ประเภท VAT variants', () => {
    const wb = viaCsv('product', exportProducts(SAMPLE));
    const plan = planProductImport(wb, emptyCtx());
    expect(plan.fileErrors).toEqual([]);
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toHaveLength(3);
    expect(plan.newMasters.categories.sort()).toEqual(['ของใช้', 'บริการ', 'เครื่องดื่ม'].sort());

    const ctx = emptyCtx();
    const { ports } = fakePorts(ctx);
    const res = applyImport(plan, ports);
    expect(res).toMatchObject({ created: 3, updated: 0, mastersCreated: 5 });

    const byCode = (code: string) => ctx.products.find(p => p.code === code)!;
    SAMPLE.forEach(src => expect(comparable(byCode(src.code))).toEqual(comparable(src)));

    // id ใหม่ไม่มี '_' (productStore.deductStock แยก id ด้วย '_')
    ctx.products.forEach(p => {
      expect(p.id).not.toContain('_');
      p.uoms.forEach(u => expect(u.id).not.toContain('_'));
      (p.variants ?? []).forEach(v => expect(v.id).not.toContain('_'));
    });
    // id ของมาสเตอร์ที่สร้างใหม่ถูกผูกกับสินค้า
    const water = byCode('P100');
    expect(water.categoryId).toBe(ctx.categories.find(c => c.name === 'เครื่องดื่ม')!.id);
    expect(water.brandId).toBe(ctx.brands.find(b => b.name === 'สิงห์')!.id);
    expect(water.supplierId).toBe(ctx.suppliers.find(s => s.name === 'บริษัท ทดสอบ, จำกัด')!.id);
    // รหัสที่มี 0 นำหน้ายังคงอยู่
    expect(byCode('00300').variants).toHaveLength(2);
  });

  test('นำเข้าไฟล์ที่ export เองซ้ำ → ไม่มีการเปลี่ยนแปลง, id เดิมคงอยู่', () => {
    const ctx = sampleCtx();
    const plan = planProductImport(viaCsv('product', exportProducts(ctx.products)), ctx);
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates).toHaveLength(0);
    expect(plan.unchanged).toBe(3);
    expect(plan.newMasters).toEqual({ categories: [], brands: [], suppliers: [] });
  });

  test('แก้ราคาในไฟล์ → อัปเดตเฉพาะสินค้านั้น โดยคง id หน่วย/variant เดิม', () => {
    const ctx = sampleCtx();
    const wb = exportProducts(ctx.products);
    const prod = wb.sheets[0];
    const priceCol = prod.rows[0].indexOf('ราคาขาย');
    const row = prod.rows.findIndex(r => r[0] === '00300');
    prod.rows[row][priceCol] = '249';
    const plan = planProductImport(viaCsv('product', wb), ctx);
    expect(plan.errors).toEqual([]);
    expect(plan.updates.map(u => u.code)).toEqual(['00300']);
    const data = plan.updates[0].data;
    expect(data.salePrice).toBe(249);
    expect(data.uoms?.[0].id).toBe('u300a');
    expect(data.variants?.map(v => v.id)).toEqual(['v1', 'v2']);
  });

  test('ข้อมูลตัวอย่าง (MOCK_PRODUCTS) export → import ซ้ำ ไม่มีข้อผิดพลาด และ variants เดิมคงอยู่', () => {
    const ctx: ImportContext = { products: MOCK_PRODUCTS, categories: MOCK_CATEGORIES, brands: MOCK_BRANDS, suppliers: MOCK_SUPPLIERS };
    const plan = planProductImport(viaCsv('product', exportProducts(MOCK_PRODUCTS)), ctx);
    expect(plan.fileErrors).toEqual([]);
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates.length + plan.unchanged).toBe(MOCK_PRODUCTS.length);
    const p30 = plan.updates.find(u => u.code === 'P030');
    if (p30?.data.variants) expect(p30.data.variants.map(v => v.id)).toEqual(['v30_red', 'v30_blue']);
  });

  test('ไม่มีตาราง ตัวเลือกสินค้า → variants เดิมไม่ถูกแตะ', () => {
    const ctx = sampleCtx();
    const wb = exportProducts(ctx.products);
    const onlyProducts: Workbook = { sheets: [wb.sheets[0]] };
    const optCol = wb.sheets[0].rows[0].indexOf('ตัวเลือกสินค้า');
    onlyProducts.sheets[0].rows.forEach((r, i) => { if (i > 0) r[optCol] = ''; });
    const plan = planProductImport(onlyProducts, ctx);
    expect(plan.errors).toEqual([]);
    expect(plan.unchanged).toBe(3);
  });

  test('รองรับ template เดิม (คอลัมน์ หมวดหมู่ / หมายเหตุ, ไม่มีอัตราส่วน/หน่วยหลัก)', () => {
    const wb = csvToWorkbook('product', 'รหัสสินค้า,ชื่อสินค้า,หมวดหมู่,หน่วย,ราคาทุน,ราคาขาย,บาร์โค้ด,หมายเหตุ\nP101,น้ำดื่ม,เครื่องดื่ม,ขวด,6,10,8850999990001,ตัวอย่าง\n');
    const plan = planProductImport(wb, { ...emptyCtx(), categories: [{ id: 'c1', name: 'เครื่องดื่ม', productCount: 0, status: 'active' }] });
    expect(plan.errors).toEqual([]);
    expect(plan.creates[0]).toMatchObject({ code: 'P101', unit: 'ขวด', barcode: '8850999990001', categoryId: 'c1', salePrice: 10, costPrice: 6 });
    expect(plan.creates[0].uoms).toHaveLength(1);
    expect(plan.creates[0].uoms[0]).toMatchObject({ ratio: 1, isDefault: true });
  });
});

// ─── Validation ─────────────────────────────────────────────────────────────
describe('สินค้า — ตรวจสอบข้อมูล', () => {
  const existing: ProductMaster = { ...SAMPLE[0], id: 'p1', code: 'P001', barcode: '8850999000001', uoms: [{ ...SAMPLE[0].uoms[0], barcodes: ['8850999000001'] }] };
  const ctx = (): ImportContext => ({ ...emptyCtx(), products: [existing] });

  const rows = [
    prodRow({ code: 'P010', isBase: 'N', ratio: 6 }),                         // 2
    prodRow({ code: 'P011', unit: 'ขวด' }), prodRow({ code: 'P011', unit: 'ลัง' }), // 3,4
    prodRow({ code: 'P012', ratio: 2 }),                                      // 5
    prodRow({ code: 'P013' }), prodRow({ code: 'P013', unit: 'ลัง', isBase: 'N', ratio: 0 }), // 6,7
    prodRow({ code: 'P014', salePrice: 'abc' }),                              // 8
    prodRow({ code: 'P015', vatIncluded: 'X' }),                              // 9
    prodRow({ code: 'P016', productType: 'อื่นๆ' }),                           // 10
    prodRow({ code: 'P017', vatRate: 5 }),                                    // 11
    prodRow({ code: 'P018', barcodes: '8850999000001' }),                     // 12
    prodRow({ code: 'P019', barcodes: '8859999000001' }),                     // 13
    prodRow({ code: 'P020', barcodes: '8859999000002|8859999000001' }),       // 14
    prodRow({ code: 'P021', barcodes: '8859999000021', options: 'สี=แดง|ดำ' }),   // 15
    prodRow({ code: 'P022', options: 'สี=แดง' }),                              // 16
    prodRow({ code: 'P023', isBase: 'maybe' }),                               // 17
    prodRow({ code: 'P024', name: 'ชื่อ A' }), prodRow({ code: 'P024', unit: 'ลัง', isBase: 'N', ratio: 12, name: 'ชื่อ B' }), // 18,19
    prodRow({ code: 'P025', unit: 'ขวด' }), prodRow({ code: 'P025', unit: 'ขวด', isBase: 'N', ratio: 6 }), // 20,21
    prodRow({ code: 'P099', barcodes: '8859999000099' }),                     // 22 (ถูกต้อง)
  ];
  const variants: Record<string, string>[] = [
    { code: 'P021', optionValues: 'สี=แดง', barcode: '8859999000021' }, // 2: ชนกับบาร์โค้ดหน่วยของตัวเอง
    { code: 'P022', optionValues: 'สี=เขียว' },                         // 3
    { code: 'P999', optionValues: 'สี=แดง' },                           // 4
  ];
  const wb: Workbook = { sheets: [sheetOf(SHEET_NAMES.product, PRODUCT_COLUMNS, rows), sheetOf(SHEET_NAMES.variant, VARIANT_COLUMNS, variants)] };

  test('ข้อความภาษาไทยตามรูปแบบ และข้ามเฉพาะสินค้าที่ผิด', () => {
    const plan = planProductImport(viaCsv('product', wb), ctx());
    const msgs = plan.errors.map(e => e.message);
    expect(msgs).toContain('สินค้า P010 ไม่มีหน่วยหลัก');
    expect(msgs).toContain('สินค้า P011 มีหน่วยหลักมากกว่า 1 หน่วย');
    expect(msgs).toContain('สินค้า P012: หน่วยหลักต้องมีอัตราส่วน 1');
    expect(msgs).toContain('แถว 7: อัตราส่วนต้องมากกว่า 0');
    expect(msgs).toContain('แถว 8: ราคาขายต้องเป็นตัวเลข');
    expect(msgs).toContain('แถว 9: VAT รวมในราคาต้องเป็น Y หรือ N');
    expect(msgs).toContain('แถว 10: ประเภทสินค้าต้องเป็น ทั่วไป หรือ บริการ');
    expect(msgs).toContain('แถว 11: อัตรา VAT ต้องเป็น 0 หรือ 7');
    expect(msgs).toContain('แถว 12: บาร์โค้ด 8850999000001 ซ้ำกับสินค้า P001');
    expect(msgs).toContain('แถว 14: บาร์โค้ด 8859999000001 ซ้ำในไฟล์ (แถว 13)');
    expect(msgs).toContain('ตัวเลือกสินค้า แถว 2: บาร์โค้ด 8859999000021 ซ้ำในไฟล์ (สินค้า แถว 15)');
    expect(msgs).toContain('ตัวเลือกสินค้า แถว 3: ตัวเลือก สี=เขียว ไม่มีในตัวเลือกของสินค้า P022');
    expect(msgs).toContain('ตัวเลือกสินค้า แถว 4: ไม่พบสินค้า P999');
    expect(msgs).toContain('แถว 17: หน่วยหลักต้องเป็น Y หรือ N');
    expect(msgs.some(m => m.startsWith('สินค้า P024: ข้อมูลชื่อสินค้าไม่ตรงกัน'))).toBe(true);
    expect(msgs).toContain('สินค้า P025: หน่วย ขวด ซ้ำ');

    // P019 ถูกต้อง (บาร์โค้ดของมันถูกใช้ก่อน), P099 ถูกต้อง → สร้างได้ 2 รายการเท่านั้น
    expect(plan.creates.map(p => p.code).sort()).toEqual(['P019', 'P099']);
    // 15 รหัสในตารางสินค้าที่ผิด + P999 (มีแต่แถว variant)
    expect(plan.skippedRecords).toBe(16);
  });

  test('ไม่พบคอลัมน์ที่จำเป็น → ข้อผิดพลาดระดับไฟล์ และ applyImport ไม่เขียนอะไร', () => {
    const plan = planProductImport(csvToWorkbook('product', 'รหัสสินค้า,ชื่อสินค้า,หน่วย\nP1,น้ำ,ขวด\n'), emptyCtx());
    expect(plan.fileErrors).toEqual(['ชีต สินค้า: ไม่พบคอลัมน์ที่จำเป็น: ราคาขาย']);
    const c = emptyCtx();
    const { ports, logs } = fakePorts(c);
    expect(applyImport(plan, ports).created).toBe(0);
    expect(c.products).toHaveLength(0);
    expect(logs).toHaveLength(0);
  });

  test('ไฟล์ว่าง', () => {
    expect(planProductImport(csvToWorkbook('product', ''), emptyCtx()).fileErrors).toEqual(['ไฟล์ว่างหรือไม่มีข้อมูล']);
  });
});

// ─── Auto-create masters ────────────────────────────────────────────────────
describe('สินค้า — สร้างหมวดหมู่/แบรนด์/ผู้จำหน่ายอัตโนมัติ', () => {
  test('ชื่อที่ต่างแค่ตัวพิมพ์/ช่องว่าง = ของเดิม, ชื่อใหม่ถูกสร้างครั้งเดียว', () => {
    const ctx: ImportContext = {
      products: [],
      categories: [{ id: 'c1', name: 'เครื่องดื่ม', productCount: 0, status: 'active' }],
      brands: [{ id: 'b1', name: 'Singha', productCount: 0, status: 'active' }],
      suppliers: [{ id: 's1', name: 'บริษัท เอ' }],
    };
    const wb: Workbook = {
      sheets: [sheetOf(SHEET_NAMES.product, PRODUCT_COLUMNS, [
        prodRow({ code: 'A1', category: '  เครื่องดื่ม ', brand: 'SINGHA', supplier: 'บริษัท   เอ' }),
        prodRow({ code: 'A2', category: 'หมวดใหม่', brand: 'แบรนด์ใหม่', supplier: 'ผู้จำหน่ายใหม่' }),
        prodRow({ code: 'A3', category: 'หมวดใหม่ ', brand: 'แบรนด์ใหม่', supplier: 'ผู้จำหน่ายใหม่' }),
      ])],
    };
    const plan = planProductImport(wb, ctx);
    expect(plan.errors).toEqual([]);
    expect(plan.newMasters).toEqual({ categories: ['หมวดใหม่'], brands: ['แบรนด์ใหม่'], suppliers: ['ผู้จำหน่ายใหม่'] });
    const a1 = plan.creates.find(p => p.code === 'A1')!;
    expect(a1).toMatchObject({ categoryId: 'c1', categoryName: 'เครื่องดื่ม', brandId: 'b1', brandName: 'Singha', supplierId: 's1', supplierName: 'บริษัท เอ' });

    const { ports } = fakePorts(ctx);
    const res = applyImport(plan, ports);
    expect(res.mastersCreated).toBe(3);
    expect(ctx.categories).toHaveLength(2);
    const newCat = ctx.categories.find(c => c.name === 'หมวดใหม่')!;
    const newBrand = ctx.brands.find(b => b.name === 'แบรนด์ใหม่')!;
    const newSup = ctx.suppliers.find(s => s.name === 'ผู้จำหน่ายใหม่')!;
    ['A2', 'A3'].forEach(code => {
      const p = ctx.products.find(x => x.code === code)!;
      expect(p).toMatchObject({ categoryId: newCat.id, categoryName: 'หมวดใหม่', brandId: newBrand.id, supplierId: newSup.id });
    });
  });

  test('สินค้าที่ผิดไม่ทำให้สร้างมาสเตอร์ของมัน', () => {
    const wb: Workbook = { sheets: [sheetOf(SHEET_NAMES.product, PRODUCT_COLUMNS, [prodRow({ code: 'B1', category: 'หมวด X', salePrice: 'x' })])] };
    expect(planProductImport(wb, emptyCtx()).newMasters.categories).toEqual([]);
  });
});

// ─── Category / Brand / Supplier ────────────────────────────────────────────
describe('หมวดหมู่ / แบรนด์ / ผู้จำหน่าย', () => {
  test('หมวดหมู่ round-trip รวมหมวดหมู่หลัก (สร้างหมวดหลักก่อน)', () => {
    const cats: Category[] = [
      { id: 'x2', name: 'น้ำดื่ม', parentId: 'x1', productCount: 3, status: 'active' },
      { id: 'x1', name: 'เครื่องดื่ม', productCount: 5, status: 'active' },
      { id: 'x3', name: 'ยา', productCount: 0, status: 'inactive' },
    ];
    const plan = planCategoryImport(viaCsv('category', exportCategories(cats)), emptyCtx());
    expect(plan.errors).toEqual([]);
    expect(plan.creates.map(c => c.name)).toEqual(['เครื่องดื่ม', 'ยา', 'น้ำดื่ม']);
    const ctx = emptyCtx();
    const { ports } = fakePorts(ctx);
    applyImport(plan, ports);
    const parent = ctx.categories.find(c => c.name === 'เครื่องดื่ม')!;
    expect(ctx.categories.find(c => c.name === 'น้ำดื่ม')!.parentId).toBe(parent.id);
    expect(ctx.categories.find(c => c.name === 'ยา')!.status).toBe('inactive');

    // นำเข้าซ้ำ → ไม่เปลี่ยนแปลง
    const again = planCategoryImport(viaCsv('category', exportCategories(ctx.categories)), ctx);
    expect(again).toMatchObject({ creates: [], updates: [], unchanged: 3, errors: [] });
  });

  test('หมวดหมู่: ไม่พบหมวดหลัก / วนซ้ำ / ชื่อซ้ำในไฟล์ / สถานะผิด', () => {
    const wb: Workbook = {
      sheets: [sheetOf(SHEET_NAMES.category, CATEGORY_COLUMNS, [
        { name: 'A', parent: 'ไม่มีจริง' },  // 2
        { name: 'B', parent: 'C' },          // 3
        { name: 'C', parent: 'B' },          // 4
        { name: 'D' }, { name: ' d ' },      // 5,6
        { name: 'E', status: 'งง' },         // 7
        { name: 'F', parent: 'เครื่องดื่ม' }, // 8 ok
      ])],
    };
    const plan = planCategoryImport(wb, { ...emptyCtx(), categories: [{ id: 'c1', name: 'เครื่องดื่ม', productCount: 0, status: 'active' }] });
    const msgs = plan.errors.map(e => e.message);
    expect(msgs).toContain('แถว 2: ไม่พบหมวดหมู่หลัก ไม่มีจริง');
    expect(msgs).toContain('แถว 3: หมวดหมู่หลักวนซ้ำกัน');
    expect(msgs).toContain('แถว 4: หมวดหมู่หลักวนซ้ำกัน');
    expect(msgs).toContain('แถว 6: ชื่อหมวดหมู่ d ซ้ำในไฟล์ (แถว 5)');
    expect(msgs).toContain('แถว 7: สถานะต้องเป็น ใช้งาน หรือ ไม่ใช้งาน');
    expect(plan.creates).toEqual([{ name: 'D', status: 'active' }, { name: 'F', status: 'active', parentId: 'c1' }]);
    expect(plan.skippedRecords).toBe(5);
  });

  test('แบรนด์ round-trip + upsert ตามชื่อ', () => {
    const brands: Brand[] = [{ id: 'b1', name: 'สิงห์', productCount: 2, status: 'active' }, { id: 'b2', name: 'Lay’s', productCount: 0, status: 'inactive' }];
    const plan = planBrandImport(viaCsv('brand', exportBrands(brands)), emptyCtx());
    expect(plan.creates).toEqual([{ name: 'สิงห์', status: 'active' }, { name: 'Lay’s', status: 'inactive' }]);
    const wb = csvToWorkbook('brand', 'ยี่ห้อ,สถานะ\nสิงห์,ไม่ใช้งาน\nใหม่,\n');
    const up = planBrandImport(wb, { ...emptyCtx(), brands });
    expect(up.updates).toEqual([{ id: 'b1', data: { status: 'inactive' } }]);
    expect(up.creates).toEqual([{ name: 'ใหม่', status: 'active' }]);
  });

  test('ผู้จำหน่าย round-trip (เลขภาษี 0 นำหน้า) + upsert ด้วยเลขภาษีก่อนชื่อ + เลขภาษีผิด', () => {
    const sups: Supplier[] = [
      { id: 's1', name: 'บริษัท เอ จำกัด', taxId: '0105563000001', phone: '021234567', contactName: 'คุณเอ' },
      { id: 's2', name: 'ร้านบี' },
    ];
    const plan = planSupplierImport(viaCsv('supplier', exportSuppliers(sups)), emptyCtx());
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toEqual([
      { name: 'บริษัท เอ จำกัด', taxId: '0105563000001', phone: '021234567', contactName: 'คุณเอ' },
      { name: 'ร้านบี' },
    ]);
    const again = planSupplierImport(viaCsv('supplier', exportSuppliers(sups)), { ...emptyCtx(), suppliers: sups });
    expect(again).toMatchObject({ creates: [], updates: [], unchanged: 2 });

    const wb: Workbook = {
      sheets: [sheetOf(SHEET_NAMES.supplier, SUPPLIER_COLUMNS, [
        { name: 'บริษัท เอ (เปลี่ยนชื่อ)', taxId: '0-1055-63000-00-1' }, // match by taxId
        { name: 'ร้านบี', phone: '0899999999' },                         // match by name
        { name: 'ผิด', taxId: '12345' },
      ])],
    };
    const up = planSupplierImport(wb, { ...emptyCtx(), suppliers: sups });
    expect(up.updates).toEqual([
      { id: 's1', data: { name: 'บริษัท เอ (เปลี่ยนชื่อ)', taxId: '0105563000001' } },
      { id: 's2', data: { name: 'ร้านบี', phone: '0899999999' } },
    ]);
    expect(up.errors.map(e => e.message)).toEqual(['แถว 4: เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก']);
  });
});

// ─── Template + audit ───────────────────────────────────────────────────────
describe('Template / audit log', () => {
  const mockCtx = (): ImportContext => ({ products: MOCK_PRODUCTS, categories: MOCK_CATEGORIES, brands: MOCK_BRANDS, suppliers: MOCK_SUPPLIERS });

  test('template สินค้า: น้ำดื่ม 3 หน่วย (ขวดมี 2 บาร์โค้ด) + variants, ผ่านการตรวจทั้ง xlsx-sheet และ CSV', () => {
    const tpl = buildTemplate('product');
    expect(tpl.sheets.map(s => s.name)).toEqual([SHEET_NAMES.product, SHEET_NAMES.variant, SHEET_NAMES.help]);
    [tpl, viaCsv('product', tpl)].forEach(wb => {
      const plan = planProductImport(wb, mockCtx());
      expect(plan.fileErrors).toEqual([]);
      expect(plan.errors).toEqual([]);
      const water = plan.creates.find(p => p.code === 'P9001')!;
      expect(water.uoms.map(u => [u.unit, u.ratio])).toEqual([['ขวด', 1], ['แพ็ค', 6], ['ลัง', 24]]);
      expect(water.uoms[0].barcodes).toHaveLength(2);
      expect(plan.creates.find(p => p.code === 'P9002')!.productType).toBe('service');
      expect(plan.creates.find(p => p.code === 'P9003')!.variants).toHaveLength(2);
    });
  });

  test.each(['category', 'brand', 'supplier'] as const)('template %s ผ่านการตรวจ', entity => {
    const tpl = buildTemplate(entity);
    [tpl, viaCsv(entity, tpl)].forEach(wb => {
      const plan = planImport(entity, wb, mockCtx());
      expect(plan.fileErrors).toEqual([]);
      expect(plan.errors).toEqual([]);
      expect(plan.creates.length + plan.updates.length + plan.unchanged).toBeGreaterThan(0);
    });
  });

  test('applyImport บันทึก audit log ครั้งเดียว ด้วย action "นำเข้าข้อมูล" + จำนวน', () => {
    const ctx = emptyCtx();
    const { ports, logs } = fakePorts(ctx);
    const plan = planProductImport(buildTemplate('product'), ctx);
    const res = applyImport(plan, ports);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ module: 'สินค้า', action: 'นำเข้าข้อมูล' });
    expect(logs[0].metadata).toMatchObject({ created: 3, updated: 0, mastersCreated: res.mastersCreated });
    expect(logs[0].description).toContain('เพิ่ม 3');
  });
});
