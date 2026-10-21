/**
 * Tests — cartProduct (toCartProduct + masterDisplayStock)
 *
 * no-variant → ต้อง byte-identical กับ inline copy เดิม (id/price/name/stock)
 * variant    → id ต่อท้าย __variantId, ใช้ราคา variant, ชื่อแนบค่าตัวเลือก
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// priceResolver → pricingStore → persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { toCartProduct, masterDisplayStock } from '../cartProduct';
import { usePricingStore } from '../../store/pricingStore';
import { ProductMaster, ProductUOM, ProductVariant } from '../../types/product';

const BASE_UOM: ProductUOM = {
  id: 'u1_1', unit: 'ขวด', ratio: 1, costPrice: 6, salePrice: 10,
  barcodes: ['8850999000001'], isDefault: true,
};

const PACK_UOM: ProductUOM = {
  id: 'u1_2', unit: 'แพ็ค', ratio: 6, costPrice: 33, salePrice: 55,
  barcodes: ['8850999000101'], isDefault: false,
};

const MASTER: ProductMaster = {
  id: 'p1', code: 'P001', barcode: '8850999000001', name: 'น้ำดื่มสิงห์ 600ml',
  categoryId: 'c1', categoryName: 'เครื่องดื่ม', brandId: 'b1', brandName: 'สิงห์',
  unit: 'ขวด', costPrice: 6, salePrice: 10, vatIncluded: true, vatRate: 7,
  productType: 'general', status: 'active', stockQty: 100, minStock: 20,
  uoms: [BASE_UOM, PACK_UOM],
  createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-06-01'),
};

const VARIANT_MASTER: ProductMaster = {
  ...MASTER,
  id: 'p30', code: 'P030', name: 'เสื้อโปโล Signature', stockQty: 40,
  options: [{ name: 'สี', values: ['แดง', 'น้ำเงิน'] }],
  variants: [
    { id: 'v30_red',  barcode: '8850999030101', price: 320, stockQty: 22, optionValues: { 'สี': 'แดง' } },
    { id: 'v30_blue', barcode: '8850999030102', stockQty: 18, optionValues: { 'สี': 'น้ำเงิน' } },
  ],
};

beforeEach(() => {
  // ไม่มีเอกสารราคา → resolveCartPrice fallback เป็น uom.salePrice (base)
  usePricingStore.setState({ documents: [] });
});

describe('cartProduct — toCartProduct (no variant, byte-identical)', () => {
  test('หน่วยฐาน → id/price/name/stock ตรงกับ inline copy เดิม', () => {
    const p = toCartProduct(MASTER, BASE_UOM);
    expect(p.id).toBe('p1_u1_1');
    expect(p.name).toBe('น้ำดื่มสิงห์ 600ml');
    expect(p.price).toBeCloseTo(10, 2);
    expect(p.barcode).toBe('8850999000001');
    expect(p.stockQty).toBe(100);
    expect(p.unit).toBe('ขวด');
    expect(p.cost).toBe(6);
  });

  test('หน่วยไม่ใช่หน่วยฐาน → ชื่อแนบหน่วย + stock หาร ratio', () => {
    const p = toCartProduct(MASTER, PACK_UOM);
    expect(p.id).toBe('p1_u1_2');
    expect(p.name).toBe('น้ำดื่มสิงห์ 600ml (แพ็ค)');
    expect(p.price).toBeCloseTo(55, 2);
    expect(p.stockQty).toBe(Math.floor(100 / 6));
  });
});

describe('cartProduct — toCartProduct (variant)', () => {
  test('variant → id ต่อท้าย __variantId และใช้ราคา variant', () => {
    const variant = VARIANT_MASTER.variants![0];
    const p = toCartProduct(VARIANT_MASTER, VARIANT_MASTER.uoms[0], undefined, variant);
    expect(p.id).toBe('p30_u1_1__v30_red');
    expect(p.price).toBeCloseTo(320, 2);
    expect(p.name).toBe('เสื้อโปโล Signature (แดง)');
    expect(p.barcode).toBe('8850999030101');
  });

  test('variant ไม่มี price → fallback เป็น uom.salePrice', () => {
    const variant = VARIANT_MASTER.variants![1];
    const p = toCartProduct(VARIANT_MASTER, VARIANT_MASTER.uoms[0], undefined, variant);
    expect(p.id).toBe('p30_u1_1__v30_blue');
    expect(p.price).toBeCloseTo(10, 2); // uom.salePrice ของ base uom
    expect(p.name).toBe('เสื้อโปโล Signature (น้ำเงิน)');
  });
});

describe('cartProduct — masterDisplayStock', () => {
  test('มี variant → ผลรวม stockQty ของทุก variant', () => {
    expect(masterDisplayStock(VARIANT_MASTER)).toBe(22 + 18);
  });

  test('ไม่มี variant → master.stockQty', () => {
    expect(masterDisplayStock(MASTER)).toBe(100);
  });
});
