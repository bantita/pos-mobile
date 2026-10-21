/**
 * Category Store — Category (หมวดหมู่สินค้า) master CRUD
 * Zustand + Persist — function-API house style (see brandStore.ts / supplierStore.ts)
 * เป็น single source of truth ของหมวดหมู่สำหรับทุก picker
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Category } from '../types/product';
import { persistStorage } from './persistStorage';
import { MOCK_CATEGORIES } from '../data/mockProducts';
import { useProductStore } from './productStore';
import { logAction } from './auditLogStore';

interface CategoryState {
  categories: Category[];
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    () => ({
      categories: [...MOCK_CATEGORIES] as Category[],
    }),
    { name: 'pos-categories', storage: createJSONStorage(() => persistStorage) }
  )
);

// ─── Category CRUD ──────────────────────────────────────────────────────────────
export function getCategories(): Category[] { return [...useCategoryStore.getState().categories]; }
export function getCategory(id: string): Category | undefined { return useCategoryStore.getState().categories.find(c => c.id === id); }

/** จำนวนสินค้าของหมวดหมู่ (นับสด จาก productStore) */
export function getCategoryProductCount(categoryId: string): number {
  return useProductStore.getState().products.filter(p => p.categoryId === categoryId).length;
}

export function addCategory(data: Omit<Category, 'id' | 'productCount'> & { productCount?: number }): Category {
  const category: Category = {
    name: data.name,
    parentId: data.parentId,
    status: data.status ?? 'active',
    productCount: data.productCount ?? 0,
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  useCategoryStore.setState(s => ({ categories: [...s.categories, category] }));
  logAction('หมวดหมู่', 'เพิ่ม', `เพิ่มหมวดหมู่ "${category.name}"`, { categoryId: category.id });
  return category;
}

export function updateCategory(id: string, updates: Partial<Omit<Category, 'id'>>): void {
  useCategoryStore.setState(s => ({
    categories: s.categories.map(c => c.id === id ? { ...c, ...updates } : c),
  }));
  const name = updates.name ?? getCategory(id)?.name ?? '';
  logAction('หมวดหมู่', 'แก้ไข', `แก้ไขหมวดหมู่ "${name}"`, { categoryId: id });
}

export function deleteCategory(id: string): void {
  const name = getCategory(id)?.name ?? '';
  useCategoryStore.setState(s => ({
    categories: s.categories.filter(c => c.id !== id),
  }));
  logAction('หมวดหมู่', 'ลบ', `ลบหมวดหมู่ "${name}"`, { categoryId: id });
}
