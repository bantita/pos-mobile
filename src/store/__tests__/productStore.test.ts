/**
 * Tests — productStore.deductStock (variant-aware)
 *
 * ยืนยัน:
 * - id มี variant (`${master}_${uom}__${variant}`) → หัก stock ที่ variant นั้น เท่านั้น
 * - สินค้าอื่น / variant อื่น ไม่ถูกแตะ
 * - id ไม่มี variant → หัก master.stockQty ตามเดิม
 * - guard: qty > stock → 0 (ไม่ติดลบ)
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// productStore → persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { useProductStore } from '../productStore';
import { ProductMaster } from '../../types/product';

const PLAIN: ProductMaster = {
  id: 'p1', code: 'P001', barcode: '8850999000001', name: 'น้ำดื่มสิงห์ 600ml',
  categoryId: 'c1', categoryName: 'เครื่องดื่ม', unit: 'ขวด',
  costPrice: 6, salePrice: 10, vatIncluded: true, vatRate: 7,
  productType: 'general', status: 'active', stockQty: 100, minStock: 20,
  uoms: [{ id: 'u1_1', unit: 'ขวด', ratio: 1, costPrice: 6, salePrice: 10, barcodes: ['8850999000001'], isDefault: true }],
  createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-06-01'),
};

const VARIANT_PRODUCT: ProductMaster = {
  id: 'p30', code: 'P030', barcode: '8850999030001', name: 'เสื้อโปโล Signature',
  categoryId: 'c4', categoryName: 'ของใช้', unit: 'ตัว',
  costPrice: 150, salePrice: 290, vatIncluded: true, vatRate: 7,
  productType: 'general', status: 'active', stockQty: 40, minStock: 5,
  uoms: [{ id: 'u30_1', unit: 'ตัว', ratio: 1, costPrice: 150, salePrice: 290, barcodes: ['8850999030001'], isDefault: true }],
  options: [{ name: 'สี', values: ['แดง', 'น้ำเงิน'] }],
  variants: [
    { id: 'v30_red',  barcode: '8850999030101', stockQty: 22, optionValues: { 'สี': 'แดง' } },
    { id: 'v30_blue', barcode: '8850999030102', stockQty: 18, optionValues: { 'สี': 'น้ำเงิน' } },
  ],
  createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01'),
};

const findProduct = (id: string) => useProductStore.getState().products.find(p => p.id === id)!;

beforeEach(() => {
  useProductStore.setState({
    products: [
      { ...PLAIN },
      { ...VARIANT_PRODUCT, variants: VARIANT_PRODUCT.variants!.map(v => ({ ...v })) },
    ],
  });
});

describe('productStore — deductStock (variant)', () => {
  test('id มี variant → หัก stock variant ที่ตรง และไม่แตะ variant อื่น', () => {
    useProductStore.getState().deductStock('p30_u30_1__v30_red', 5);
    const p = findProduct('p30');
    expect(p.variants!.find(v => v.id === 'v30_red')!.stockQty).toBe(17);
    expect(p.variants!.find(v => v.id === 'v30_blue')!.stockQty).toBe(18);
    expect(p.stockQty).toBe(40); // master stock ไม่เปลี่ยน
  });

  test('สินค้าอื่นไม่ถูกแตะ', () => {
    useProductStore.getState().deductStock('p30_u30_1__v30_red', 5);
    expect(findProduct('p1').stockQty).toBe(100);
  });

  test('id ไม่มี variant → หัก master.stockQty ตามเดิม', () => {
    useProductStore.getState().deductStock('p1_u1_1', 10);
    expect(findProduct('p1').stockQty).toBe(90);
  });

  test('guard: qty > stock → 0 (variant)', () => {
    useProductStore.getState().deductStock('p30_u30_1__v30_blue', 999);
    expect(findProduct('p30').variants!.find(v => v.id === 'v30_blue')!.stockQty).toBe(0);
  });

  test('guard: qty > stock → 0 (master)', () => {
    useProductStore.getState().deductStock('p1_u1_1', 999);
    expect(findProduct('p1').stockQty).toBe(0);
  });
});
