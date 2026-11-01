/**
 * Tests — buildMigrationPlan (ไมเกรต: ตรวจสอบข้อมูลก่อนยืนยันนำเข้า)
 *   - จัดประเภท เพิ่มใหม่ / อัปเดต / ไม่เปลี่ยน / ข้อผิดพลาด
 *   - ค่าเดิม → ค่าใหม่ (ราคา บาร์โค้ด หมวดหมู่ หน่วยนับ variants)
 *   - มาสเตอร์ที่จะสร้างใหม่, แบ่งหน้า, ข้อความยืนยัน, ไฟล์ข้อผิดพลาด
 *   - ไม่มีการเขียนข้อมูลก่อนยืนยัน และสิ่งที่บันทึก = สิ่งที่ตรวจสอบ
 */
import { describe, test, expect } from 'vitest';
import {
  ImportContext, MasterPorts, MigrationRecord, Workbook,
  PRODUCT_COLUMNS, SHEET_NAMES, ERROR_SHEET_NAME,
  applyMigration, buildErrorWorkbook, buildMigrationPlan, canProceed, confirmSummaryText,
  csvToWorkbook, exportProducts, filterRecords, migrationSignature, pageRecords,
} from '../masterImportExport';
import { Category } from '../../types/product';
import { SAMPLE, emptyCtx, sampleCtx, fakePorts, viaCsv, sheetOf, prodRow } from './masterFixtures';

const byKey = (records: MigrationRecord[], key: string): MigrationRecord => {
  const r = records.find(x => x.key === key);
  if (!r) throw new Error(`ไม่พบรายการ ${key}`);
  return r;
};
const field = (r: MigrationRecord, name: string) => r.changedFields.find(f => f.field === name);

/** ports ที่นับจำนวนครั้งที่ถูกเรียก (ทุกเมธอด) */
function countingPorts(inner: MasterPorts): { ports: MasterPorts; calls: Record<string, number> } {
  const calls: Record<string, number> = {};
  const ports = Object.fromEntries(Object.entries(inner).map(([name, fn]) => [
    name,
    (...args: unknown[]) => { calls[name] = (calls[name] ?? 0) + 1; return (fn as (...a: unknown[]) => unknown)(...args); },
  ])) as unknown as MasterPorts;
  return { ports, calls };
}
const totalCalls = (calls: Record<string, number>) => Object.values(calls).reduce((a, b) => a + b, 0);

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o as Record<string, unknown>).forEach(deepFreeze);
  }
  return o;
}

/** P100 ราคาขายใหม่, N1 ใหม่, BAD ราคาผิด, 00300 เหมือนเดิม */
const MIXED_CSV = [
  'รหัสสินค้า,ชื่อสินค้า,หน่วย,ราคาขาย',
  'P100,น้ำดื่มทดสอบ 600ml,ขวด,12',
  'N1,สินค้าใหม่,ชิ้น,5',
  'BAD,สินค้าผิด,ชิ้น,x',
  '00300,เสื้อยืดทดสอบ,ตัว,199',
].join('\n') + '\n';
const mixedWb = (): Workbook => csvToWorkbook('product', MIXED_CSV);

// ─── Classification ─────────────────────────────────────────────────────────
describe('ไมเกรตสินค้า — จัดประเภทรายการ', () => {
  test('เพิ่มใหม่ / อัปเดต / ไม่เปลี่ยน / ข้อผิดพลาด พร้อมเลขแถวและข้อความไทย', () => {
    const mp = buildMigrationPlan('product', mixedWb(), sampleCtx());
    expect(mp.fileErrors).toEqual([]);
    expect(mp.records.map(r => [r.key, r.action])).toEqual([
      ['P100', 'update'], ['N1', 'create'], ['BAD', 'error'], ['00300', 'unchanged'],
    ]);
    expect(mp.summary).toEqual({ total: 4, create: 1, update: 1, unchanged: 1, error: 1, mastersToCreate: 0 });
    const bad = byKey(mp.records, 'BAD');
    expect(bad.rows).toEqual([4]);
    expect(bad.errors.map(e => e.message)).toEqual(['แถว 4: ราคาขายต้องเป็นตัวเลข']);
    expect(byKey(mp.records, 'P100').rows).toEqual([2]);
    expect(byKey(mp.records, 'N1').fields.find(f => f.label === 'ราคาขาย')?.value).toBe('5');
  });

  test('ไฟล์ที่ export เองนำเข้าซ้ำ → ไม่เปลี่ยนแปลงทุกรายการ', () => {
    const ctx = sampleCtx();
    const mp = buildMigrationPlan('product', viaCsv('product', exportProducts(SAMPLE)), ctx);
    expect(mp.records.every(r => r.action === 'unchanged')).toBe(true);
    expect(mp.source.unchangedItems).toHaveLength(ctx.products.length);
    expect(mp.summary.unchanged).toBe(3);
    expect(canProceed(mp)).toBe(false);
  });
});

// ─── Field diffs ────────────────────────────────────────────────────────────
describe('ไมเกรตสินค้า — ค่าเดิม → ค่าใหม่', () => {
  test('ราคาขาย และหน่วยที่แก้ (หน่วยที่ไม่มีในไฟล์คงไว้ = เหมือนเดิม)', () => {
    const p100 = byKey(buildMigrationPlan('product', mixedWb(), sampleCtx()).records, 'P100');
    expect(field(p100, 'salePrice')).toEqual({ field: 'salePrice', label: 'ราคาขาย', before: '10', after: '12' });
    expect(field(p100, 'costPrice')).toBeUndefined();
    expect(p100.uomChanges.map(u => [u.unit, u.kind, u.changedFields])).toEqual([
      ['ขวด', 'changed', ['salePrice']], ['แพ็ค', 'same', []], ['ลัง', 'same', []],
    ]);
    expect(p100.variantChanges).toEqual([]);
  });

  test('ราคาทุน บาร์โค้ด a|b → a|c และหมวดหมู่', () => {
    const csv = 'รหัสสินค้า,ชื่อสินค้า,หมวดหมู่,หน่วย,ราคาทุน,ราคาขาย,บาร์โค้ด\n'
      + 'P100,น้ำดื่มทดสอบ 600ml,ของใช้,ขวด,6,10,8851000000011|8851000000099\n';
    const p100 = buildMigrationPlan('product', csvToWorkbook('product', csv), sampleCtx()).records[0];
    expect(p100.action).toBe('update');
    expect(field(p100, 'costPrice')).toMatchObject({ before: '5', after: '6' });
    expect(field(p100, 'categoryName')).toMatchObject({ label: 'หมวดหมู่', before: 'เครื่องดื่ม', after: 'ของใช้' });
    expect(field(p100, 'barcodes')).toMatchObject({
      before: '8851000000011|8851000000012|8851000000013|8851000000014',
      after: '8851000000011|8851000000099|8851000000013|8851000000014',
    });
    const bottle = p100.uomChanges.find(u => u.unit === 'ขวด')!;
    expect(bottle.changedFields).toEqual(['costPrice', 'barcodes']);
    expect(bottle.before?.barcodes).toBe('8851000000011|8851000000012');
    expect(bottle.after?.barcodes).toBe('8851000000011|8851000000099');
  });

  test('หน่วยใหม่ = added, อัตราส่วน/ราคาที่เปลี่ยน = changed', () => {
    const csv = 'รหัสสินค้า,ชื่อสินค้า,หน่วย,อัตราส่วน,ราคาขาย\n'
      + 'P100,น้ำดื่มทดสอบ 600ml,โหล,12,110\n'
      + 'P100,น้ำดื่มทดสอบ 600ml,แพ็ค,4,40\n';
    const p100 = buildMigrationPlan('product', csvToWorkbook('product', csv), sampleCtx()).records[0];
    const kinds = Object.fromEntries(p100.uomChanges.map(u => [u.unit, u.kind]));
    expect(kinds).toEqual({ 'ขวด': 'same', 'โหล': 'added', 'แพ็ค': 'changed', 'ลัง': 'same' });
    expect(p100.uomChanges.find(u => u.unit === 'แพ็ค')!.changedFields).toEqual(['ratio', 'salePrice']);
    expect(p100.uomChanges.find(u => u.unit === 'โหล')!.after).toMatchObject({ ratio: 12, salePrice: 110, isBase: false });
    expect(field(p100, 'uoms')).toMatchObject({ label: 'หน่วยนับ', before: 'ขวด, แพ็ค, ลัง' });
    expect(field(p100, 'uoms')!.after).toContain('เพิ่ม 1');
    expect(p100.uomChanges.some(u => u.kind === 'removed')).toBe(false);
  });

  test('variants: แก้ราคา = changed, ค่าตัวเลือกใหม่ = added, ไม่มีในชีต = removed', () => {
    const wb = exportProducts([SAMPLE[2]]);
    const vs = wb.sheets.find(s => s.name === SHEET_NAMES.variant)!;
    vs.rows[1][4] = '209';
    vs.rows[2] = ['00300', 'สี=แดง; ไซส์=L', '', '8851000000099', '', '5'];
    const rec = buildMigrationPlan('product', wb, sampleCtx()).records[0];
    expect(rec.action).toBe('update');
    expect(rec.variantChanges.map(v => [v.key, v.kind, v.changedFields])).toEqual([
      ['สี=แดง; ไซส์=M', 'changed', ['price']],
      ['สี=แดง; ไซส์=L', 'added', []],
      ['สี=น้ำเงิน; ไซส์=L', 'removed', []],
    ]);
    const changed = rec.variantChanges[0];
    expect(changed.before?.price).toBe(199);
    expect(changed.after?.price).toBe(209);
    expect(field(rec, 'variants')).toMatchObject({ before: '2 รายการ', after: '2 รายการ (เพิ่ม 1 · แก้ไข 1 · ลบ 1)' });
  });

  test('ไม่มีชีต ตัวเลือกสินค้า → variantChanges ว่าง', () => {
    const csv = 'รหัสสินค้า,ชื่อสินค้า,หน่วย,ราคาขาย\n00300,เสื้อยืดทดสอบ,ตัว,249\n';
    const rec = buildMigrationPlan('product', csvToWorkbook('product', csv), sampleCtx()).records[0];
    expect(rec.action).toBe('update');
    expect(rec.variantChanges).toEqual([]);
    expect(field(rec, 'variants')).toBeUndefined();
  });
});

// ─── Category / Brand / Supplier ────────────────────────────────────────────
describe('ไมเกรต หมวดหมู่ / แบรนด์ / ผู้จำหน่าย', () => {
  test('หมวดหมู่: เปลี่ยนหมวดหลัก + สถานะ, รายการที่เหมือนเดิม', () => {
    const categories: Category[] = [
      { id: 'c1', name: 'เครื่องดื่ม', productCount: 0, status: 'active' },
      { id: 'c2', name: 'น้ำ', parentId: 'c1', productCount: 0, status: 'active' },
      { id: 'c3', name: 'ขนม', productCount: 0, status: 'active' },
    ];
    const csv = 'ชื่อหมวดหมู่,หมวดหมู่หลัก,สถานะ\nน้ำ,ขนม,ไม่ใช้งาน\nขนม,,ใช้งาน\nใหม่,หมวดใหม่ไม่มี,\n';
    const mp = buildMigrationPlan('category', csvToWorkbook('category', csv), { ...emptyCtx(), categories });
    const water = byKey(mp.records, 'น้ำ');
    expect(water.action).toBe('update');
    expect(water.changedFields).toEqual([
      { field: 'parent', label: 'หมวดหมู่หลัก', before: 'เครื่องดื่ม', after: 'ขนม' },
      { field: 'status', label: 'สถานะ', before: 'ใช้งาน', after: 'ไม่ใช้งาน' },
    ]);
    expect(byKey(mp.records, 'ขนม').action).toBe('unchanged');
    const err = byKey(mp.records, 'ใหม่');
    expect(err.action).toBe('error');
    expect(err.errors[0].message).toBe('แถว 4: ไม่พบหมวดหมู่หลัก หมวดใหม่ไม่มี');
    expect(confirmSummaryText(mp)).toBe('เพิ่มใหม่ 0, อัปเดต 1, ข้าม 1');
  });

  test('แบรนด์: อัปเดตสถานะ + เพิ่มใหม่', () => {
    const ctx: ImportContext = { ...emptyCtx(), brands: [{ id: 'b1', name: 'สิงห์', productCount: 0, status: 'active' }] };
    const mp = buildMigrationPlan('brand', csvToWorkbook('brand', 'ชื่อแบรนด์,สถานะ\nสิงห์,ไม่ใช้งาน\nช้าง,\n'), ctx);
    expect(byKey(mp.records, 'สิงห์').changedFields).toEqual([{ field: 'status', label: 'สถานะ', before: 'ใช้งาน', after: 'ไม่ใช้งาน' }]);
    expect(byKey(mp.records, 'ช้าง').action).toBe('create');
    expect(confirmSummaryText(mp)).toBe('เพิ่มใหม่ 1, อัปเดต 1, ข้าม 0');
  });

  test('ผู้จำหน่าย: เปลี่ยนเบอร์โทร = อัปเดต, ข้อมูลเดิม = ไม่เปลี่ยน', () => {
    const ctx: ImportContext = { ...emptyCtx(), suppliers: [{ id: 's1', name: 'บริษัท เอ', phone: '02' }, { id: 's2', name: 'บริษัท ซี', phone: '03' }] };
    const csv = 'ชื่อผู้จำหน่าย,เบอร์โทร\nบริษัท เอ,0811111111\nบริษัท ซี,03\nบริษัท บี,\n';
    const mp = buildMigrationPlan('supplier', csvToWorkbook('supplier', csv), ctx);
    expect(byKey(mp.records, 'บริษัท เอ').changedFields).toEqual([{ field: 'phone', label: 'โทร', before: '02', after: '0811111111' }]);
    expect(byKey(mp.records, 'บริษัท ซี').action).toBe('unchanged');
    expect(byKey(mp.records, 'บริษัท บี').action).toBe('create');
  });
});

// ─── Masters to create ──────────────────────────────────────────────────────
describe('ไมเกรต — มาสเตอร์ที่จะสร้างใหม่', () => {
  test('ชื่อใหม่แสดงครั้งเดียว (ไม่สนตัวพิมพ์/ช่องว่าง), สินค้าที่ถูกข้ามไม่นับ', () => {
    const wb: Workbook = {
      sheets: [sheetOf(SHEET_NAMES.product, PRODUCT_COLUMNS, [
        prodRow({ code: 'A1', category: 'หมวดใหม่', brand: 'แบรนด์ใหม่', supplier: 'ผู้จำหน่ายใหม่' }),
        prodRow({ code: 'A2', category: 'หมวดใหม่ ', brand: 'แบรนด์ใหม่', supplier: 'ผู้จำหน่ายใหม่' }),
        prodRow({ code: 'B1', category: 'หมวดที่ถูกข้าม', brand: 'แบรนด์ที่ถูกข้าม', salePrice: 'x' }),
      ])],
    };
    const mp = buildMigrationPlan('product', wb, emptyCtx());
    expect(mp.mastersToCreate).toEqual({ categories: ['หมวดใหม่'], brands: ['แบรนด์ใหม่'], suppliers: ['ผู้จำหน่ายใหม่'] });
    expect(mp.summary.mastersToCreate).toBe(3);
    expect(byKey(mp.records, 'B1').action).toBe('error');
    expect(confirmSummaryText(mp)).toBe('เพิ่มใหม่ 2, อัปเดต 0, ข้าม 1, สร้างหมวดหมู่/แบรนด์/ผู้จำหน่ายใหม่ 3');
  });
});

// ─── Apply ──────────────────────────────────────────────────────────────────
describe('ไมเกรต — ยืนยันและบันทึก', () => {
  test('ก่อนยืนยันไม่มีการเขียนข้อมูล (ports ไม่ถูกเรียก, ctx ไม่ถูกแก้)', () => {
    const ctx = deepFreeze(sampleCtx());
    const snapshot = JSON.stringify(ctx);
    const { calls } = countingPorts(fakePorts(emptyCtx()).ports);
    const mp = buildMigrationPlan('product', mixedWb(), ctx);
    filterRecords(mp.records, 'update');
    pageRecords(mp.records, 1);
    buildErrorWorkbook(mp);
    canProceed(mp);
    confirmSummaryText(mp);
    migrationSignature(mp);
    expect(totalCalls(calls)).toBe(0);
    expect(JSON.stringify(ctx)).toBe(snapshot);
  });

  test('บันทึกเฉพาะเพิ่มใหม่/อัปเดต, ข้ามแถวผิด, audit log 1 รายการ', () => {
    const ctx = sampleCtx();
    const mp = buildMigrationPlan('product', mixedWb(), ctx);
    const fake = fakePorts(ctx);
    const { ports, calls } = countingPorts(fake.ports);
    const res = applyMigration(mp, ports);
    expect(calls).toEqual({ addProduct: 1, updateProduct: 1, logAction: 1 });
    expect(res).toMatchObject({ created: mp.summary.create, updated: mp.summary.update, unchanged: mp.summary.unchanged, skipped: mp.summary.error });
    expect(res.errorRecords.map(r => r.key)).toEqual(['BAD']);
    expect(ctx.products.some(p => p.code === 'BAD')).toBe(false);
    expect(ctx.products.find(p => p.code === 'P100')!.salePrice).toBe(12);
    expect(fake.logs).toHaveLength(1);
    expect(fake.logs[0]).toMatchObject({ module: 'สินค้า', action: 'นำเข้าข้อมูล' });
  });

  test('หลังบันทึก สร้างแผนจากไฟล์เดิมซ้ำ → ไม่มีอะไรต้องเปลี่ยน (บันทึก = สิ่งที่ตรวจสอบ)', () => {
    const ctx = sampleCtx();
    applyMigration(buildMigrationPlan('product', mixedWb(), ctx), fakePorts(ctx).ports);
    const again = buildMigrationPlan('product', mixedWb(), ctx);
    expect(again.summary).toMatchObject({ create: 0, update: 0, unchanged: 3, error: 1 });
  });

  test('มาสเตอร์ใหม่ถูกสร้างและผูกกับสินค้า', () => {
    const ctx = emptyCtx();
    const wb: Workbook = { sheets: [sheetOf(SHEET_NAMES.product, PRODUCT_COLUMNS, [prodRow({ code: 'A1', category: 'หมวดใหม่' })])] };
    const res = applyMigration(buildMigrationPlan('product', wb, ctx), fakePorts(ctx).ports);
    expect(res.mastersCreatedNames.categories).toEqual(['หมวดใหม่']);
    expect(ctx.products[0].categoryId).toBe(ctx.categories[0].id);
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────────
describe('ไมเกรต — ตัวช่วยแสดงผล', () => {
  const bigBrandPlan = () => {
    const rows = Array.from({ length: 1050 }, (_, i) => `แบรนด์ ${String(i + 1).padStart(4, '0')},`);
    return buildMigrationPlan('brand', csvToWorkbook('brand', `ชื่อแบรนด์,สถานะ\n${rows.join('\n')}\n`), emptyCtx());
  };

  test('แบ่งหน้า 50 รายการ: 1,050 รายการ = 21 หน้า และปรับหน้าที่เกินช่วง', () => {
    const mp = bigBrandPlan();
    expect(mp.summary.create).toBe(1050);
    const last = pageRecords(mp.records, 21);
    expect(last.pageCount).toBe(21);
    expect(last.items).toHaveLength(50);
    expect(last.items[49].key).toBe('แบรนด์ 1050');
    expect(pageRecords(mp.records, 99).page).toBe(21);
    expect(pageRecords(mp.records, 0).page).toBe(1);
    expect(pageRecords([], 1)).toEqual({ items: [], page: 1, pageCount: 1 });
  });

  test('ตัวกรอง', () => {
    const mp = buildMigrationPlan('product', mixedWb(), sampleCtx());
    expect(filterRecords(mp.records, 'all')).toHaveLength(4);
    expect(filterRecords(mp.records, 'error').map(r => r.key)).toEqual(['BAD']);
    expect(filterRecords(mp.records, 'unchanged').map(r => r.key)).toEqual(['00300']);
  });

  test('canProceed = false เมื่อไม่มีรายการที่จะบันทึก (มีแต่ข้อผิดพลาด)', () => {
    const mp = buildMigrationPlan('product', csvToWorkbook('product', 'รหัสสินค้า,ชื่อสินค้า,หน่วย,ราคาขาย\nX1,ผิด,ชิ้น,-1\n'), emptyCtx());
    expect(mp.summary).toMatchObject({ create: 0, update: 0, error: 1 });
    expect(canProceed(mp)).toBe(false);
    expect(canProceed(buildMigrationPlan('product', mixedWb(), sampleCtx()))).toBe(true);
  });

  test('ไฟล์ข้อผิดพลาด: หัวตาราง + 1 แถวต่อข้อผิดพลาด', () => {
    const wb = buildErrorWorkbook(buildMigrationPlan('product', mixedWb(), sampleCtx()));
    expect(wb.sheets).toHaveLength(1);
    expect(wb.sheets[0].name).toBe(ERROR_SHEET_NAME);
    expect(wb.sheets[0].rows).toEqual([
      ['ชีต', 'แถว', 'รหัส/ชื่อ', 'ข้อความ'],
      ['สินค้า', '4', 'BAD', 'แถว 4: ราคาขายต้องเป็นตัวเลข'],
    ]);
  });

  test('ลายเซ็นแผนเปลี่ยนเมื่อข้อมูลในระบบเปลี่ยน', () => {
    const ctx = sampleCtx();
    const a = migrationSignature(buildMigrationPlan('product', mixedWb(), ctx));
    expect(migrationSignature(buildMigrationPlan('product', mixedWb(), sampleCtx()))).toBe(a);
    ctx.products = ctx.products.map(p => (p.code === 'P100' ? { ...p, salePrice: 12, uoms: p.uoms.map((u, i) => (i === 0 ? { ...u, salePrice: 12 } : u)) } : p));
    expect(migrationSignature(buildMigrationPlan('product', mixedWb(), ctx))).not.toBe(a);
  });
});
