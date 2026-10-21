/**
 * Tests — findProductByBarcode (variant-aware)
 *
 * ลำดับการค้นหา: variant barcode → uom barcode → master barcode
 */
import { describe, test, expect } from 'vitest';
import { findProductByBarcode } from '../mockProducts';
import { ProductMaster } from '../../types/product';

const PLAIN: ProductMaster = {
  id: 'p1', code: 'P001', barcode: '8850999000001', name: 'น้ำดื่มสิงห์ 600ml',
  categoryId: 'c1', categoryName: 'เครื่องดื่ม', unit: 'ขวด',
  costPrice: 6, salePrice: 10, vatIncluded: true, vatRate: 7,
  productType: 'general', status: 'active', stockQty: 100, minStock: 20,
  uoms: [
    { id: 'u1_1', unit: 'ขวด', ratio: 1, costPrice: 6, salePrice: 10, barcodes: ['8850999000001'], isDefault: true },
    { id: 'u1_2', unit: 'แพ็ค', ratio: 6, costPrice: 33, salePrice: 55, barcodes: ['8850999000101'], isDefault: false },
  ],
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

const PRODUCTS = [PLAIN, VARIANT_PRODUCT];

describe('findProductByBarcode', () => {
  test('variant barcode → คืนสินค้า + หน่วยฐาน + variant ที่ตรง', () => {
    const res = findProductByBarcode('8850999030101', PRODUCTS);
    expect(res).not.toBeNull();
    expect(res!.product.id).toBe('p30');
    expect(res!.uom.id).toBe('u30_1'); // หน่วยฐาน/default
    expect(res!.variant?.id).toBe('v30_red');
  });

  test('uom barcode บนสินค้าที่มี variant → ไม่มี variant', () => {
    const res = findProductByBarcode('8850999030001', PRODUCTS);
    expect(res).not.toBeNull();
    expect(res!.product.id).toBe('p30');
    expect(res!.uom.id).toBe('u30_1');
    expect(res!.variant).toBeUndefined();
  });

  test('uom barcode บนสินค้าปกติ → คืนหน่วยที่ตรง ไม่มี variant', () => {
    const res = findProductByBarcode('8850999000101', PRODUCTS);
    expect(res).not.toBeNull();
    expect(res!.product.id).toBe('p1');
    expect(res!.uom.id).toBe('u1_2');
    expect(res!.variant).toBeUndefined();
  });

  test('master barcode บนสินค้าปกติ → พฤติกรรมเดิม', () => {
    const res = findProductByBarcode('8850999000001', PRODUCTS);
    expect(res).not.toBeNull();
    expect(res!.product.id).toBe('p1');
    expect(res!.uom.id).toBe('u1_1');
    expect(res!.variant).toBeUndefined();
  });

  test('barcode ไม่พบ → null', () => {
    expect(findProductByBarcode('0000000000000', PRODUCTS)).toBeNull();
  });
});
