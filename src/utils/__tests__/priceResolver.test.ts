/**
 * Tests — priceResolver (ราคาต่อหน่วยในตะกร้า ตามสาขา/ราคากลาง × UOM ratio)
 *
 * seed เอกสารราคาแบบ deterministic ลงใน usePricingStore โดยตรง
 * (effectiveDate อดีต + expiryDate อนาคตไกล) เพื่อไม่ให้ผลลัพธ์แกว่งตามวันที่จริง
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// pricingStore → persistStorage นำเข้า react-native (Platform) + AsyncStorage
// ซึ่ง resolve ไม่ได้ภายใต้ happy-dom — mock ให้เบาที่สุดเพื่อให้ store โหลดได้
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { resolveCartPrice } from '../priceResolver';
import { usePricingStore } from '../../store/pricingStore';
import { PricingDocument, PricingItem } from '../../types/pricing';
import { ProductMaster, ProductUOM } from '../../types/product';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseUom = (over: Partial<ProductUOM>): ProductUOM => ({
  id: 'u1_1', unit: 'ขวด', ratio: 1, costPrice: 6, salePrice: 10,
  barcodes: ['8850999000001'], isDefault: true, ...over,
});

const PACK_UOM: ProductUOM = {
  id: 'u1_2', unit: 'แพ็ค', ratio: 6, costPrice: 33, salePrice: 55,
  barcodes: ['8850999000101'], isDefault: false,
};

const MASTER: ProductMaster = {
  id: 'p1', code: 'P001', barcode: '8850999000001', name: 'น้ำดื่มสิงห์ 600ml',
  categoryId: 'c1', categoryName: 'เครื่องดื่ม', brandId: 'b1', brandName: 'สิงห์',
  unit: 'ขวด', costPrice: 6, salePrice: 10, vatIncluded: true, vatRate: 7,
  productType: 'general', status: 'active', stockQty: 100, minStock: 20,
  uoms: [baseUom({}), PACK_UOM],
  createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-06-01'),
};

const item = (newPrice: number): PricingItem => ({
  productId: 'P001', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml',
  unit: 'ขวด', costPrice: 6, originalPrice: 12, newPrice,
});

// effective ในอดีต + expiry ในอนาคตไกล → resolve ได้เสมอไม่ขึ้นกับวันนี้
const CENTRAL_DOC: PricingDocument = {
  id: 't-central', docNo: 'PRC-TEST-CEN', name: 'ราคากลางทดสอบ',
  scope: 'central', duration: 'permanent', effectiveDate: '2000-01-01',
  status: 'active', items: [item(12)], createdBy: 'test', createdAt: '2000-01-01T00:00:00Z',
};

// ราคาสาขา b1 (branch newPrice = 9 ต่อหน่วยฐาน)
const BRANCH_B1_DOC: PricingDocument = {
  id: 't-b1', docNo: 'PRC-TEST-B1', name: 'ราคาสาขา b1 ทดสอบ',
  scope: 'branch', branchId: 'b1', branchName: 'สาขาหลัก',
  duration: 'temporary', effectiveDate: '2000-01-01', expiryDate: '2999-12-31',
  status: 'active', items: [item(9)], createdBy: 'test', createdAt: '2000-01-01T00:00:00Z',
};

beforeEach(() => {
  // เริ่มด้วยเฉพาะเอกสารราคากลาง — แต่ละ test จะเพิ่ม branch doc เองตามต้องการ
  usePricingStore.setState({ documents: [CENTRAL_DOC] });
});

describe('priceResolver — resolveCartPrice', () => {
  test('สาขา b1 มีราคาสาขา → หน่วยฐานใช้ newPrice ของสาขา', () => {
    usePricingStore.setState({ documents: [CENTRAL_DOC, BRANCH_B1_DOC] });
    const res = resolveCartPrice(MASTER, baseUom({}), 'b1');
    expect(res.source).toBe('branch');
    expect(res.price).toBeCloseTo(9, 2);
  });

  test('สาขา b1 + หน่วยไม่ใช่หน่วยฐาน → ราคาสาขา × ratio', () => {
    usePricingStore.setState({ documents: [CENTRAL_DOC, BRANCH_B1_DOC] });
    const res = resolveCartPrice(MASTER, PACK_UOM, 'b1'); // 9 × 6
    expect(res.source).toBe('branch');
    expect(res.price).toBeCloseTo(54, 2);
  });

  test('สาขา b3 (ไม่มีเอกสารสาขา) → ใช้ราคากลางเมื่อยังมีเอกสารกลาง', () => {
    usePricingStore.setState({ documents: [CENTRAL_DOC, BRANCH_B1_DOC] });
    const res = resolveCartPrice(MASTER, baseUom({}), 'b3');
    expect(res.source).toBe('central');
    expect(res.price).toBeCloseTo(12, 2);
  });

  test('ไม่มีเอกสารราคาใดเลย → fallback เป็น uom.salePrice', () => {
    usePricingStore.setState({ documents: [] });
    const base = resolveCartPrice(MASTER, baseUom({}), 'b3');
    expect(base.source).toBe('base');
    expect(base.price).toBeCloseTo(10, 2); // salePrice หน่วยฐาน

    const pack = resolveCartPrice(MASTER, PACK_UOM, 'b3');
    expect(pack.source).toBe('base');
    expect(pack.price).toBeCloseTo(55, 2); // salePrice ของแพ็ค (ไม่สเกล ratio)
  });

  test('ราคากลาง apply เมื่อไม่มีเอกสารสาขา (central × ratio)', () => {
    // มีเฉพาะเอกสารกลาง (ตั้งใน beforeEach)
    const res = resolveCartPrice(MASTER, PACK_UOM, 'b1'); // 12 × 6
    expect(res.source).toBe('central');
    expect(res.price).toBeCloseTo(72, 2);
  });
});
