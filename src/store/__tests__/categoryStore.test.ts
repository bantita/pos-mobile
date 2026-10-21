/**
 * Tests — categoryStore (mirror ของ brandStore)
 *
 * ยืนยัน: add/update/delete, getCategoryProductCount สะท้อน productStore, persist key 'pos-categories'
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// categoryStore → persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import {
  useCategoryStore,
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategoryProductCount,
} from '../categoryStore';
import { useProductStore } from '../productStore';
import { ProductMaster } from '../../types/product';

const mkProduct = (id: string, categoryId: string): ProductMaster => ({
  id, code: id.toUpperCase(), barcode: `bc-${id}`, name: `สินค้า ${id}`,
  categoryId, categoryName: '', unit: 'ชิ้น',
  costPrice: 1, salePrice: 2, vatIncluded: true, vatRate: 7,
  productType: 'general', status: 'active', stockQty: 10, minStock: 1,
  uoms: [{ id: `${id}_u1`, unit: 'ชิ้น', ratio: 1, costPrice: 1, salePrice: 2, barcodes: [`bc-${id}`], isDefault: true }],
  createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
});

beforeEach(() => {
  useCategoryStore.setState({ categories: [{ id: 'c1', name: 'เครื่องดื่ม', productCount: 0, status: 'active' }] });
  useProductStore.setState({ products: [] });
});

describe('categoryStore — CRUD', () => {
  test('addCategory เพิ่มหมวดหมู่ใหม่', () => {
    const before = getCategories().length;
    const created = addCategory({ name: 'หมวดใหม่', status: 'active' });
    expect(getCategories().length).toBe(before + 1);
    expect(getCategory(created.id)?.name).toBe('หมวดใหม่');
    expect(created.productCount).toBe(0);
  });

  test('updateCategory แก้ไขชื่อ', () => {
    updateCategory('c1', { name: 'เครื่องดื่มใหม่' });
    expect(getCategory('c1')?.name).toBe('เครื่องดื่มใหม่');
  });

  test('deleteCategory ลบหมวดหมู่', () => {
    deleteCategory('c1');
    expect(getCategory('c1')).toBeUndefined();
  });
});

describe('categoryStore — getCategoryProductCount', () => {
  test('นับสดจาก productStore', () => {
    expect(getCategoryProductCount('c1')).toBe(0);
    useProductStore.setState({ products: [mkProduct('p1', 'c1'), mkProduct('p2', 'c1'), mkProduct('p3', 'c2')] });
    expect(getCategoryProductCount('c1')).toBe(2);
    expect(getCategoryProductCount('c2')).toBe(1);
  });
});

describe('categoryStore — persist', () => {
  test('ใช้ persist key "pos-categories"', () => {
    expect(useCategoryStore.persist.getOptions().name).toBe('pos-categories');
  });
});
