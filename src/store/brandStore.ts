/**
 * Brand Store — Brand (แบรนด์/ยี่ห้อ) master CRUD
 * Zustand + Persist — function-API house style (see branchStore.ts / supplierStore.ts)
 * เป็น single source of truth ของแบรนด์สำหรับทุก picker
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Brand } from '../types/product';
import { persistStorage } from './persistStorage';
import { MOCK_BRANDS } from '../data/mockProducts';
import { useProductStore } from './productStore';
import { logAction } from './auditLogStore';

interface BrandState {
  brands: Brand[];
}

const useBrandStore = create<BrandState>()(
  persist(
    () => ({
      brands: [...MOCK_BRANDS] as Brand[],
    }),
    { name: 'pos-brands', storage: createJSONStorage(() => persistStorage) }
  )
);

// ─── Brand CRUD ───────────────────────────────────────────────────────────────
export function getBrands(): Brand[] { return [...useBrandStore.getState().brands]; }
export function getBrand(id: string): Brand | undefined { return useBrandStore.getState().brands.find(b => b.id === id); }

/** จำนวนสินค้าของแบรนด์ (นับสด จาก productStore) */
export function getBrandProductCount(brandId: string): number {
  return useProductStore.getState().products.filter(p => p.brandId === brandId).length;
}

export function addBrand(data: Omit<Brand, 'id' | 'productCount'> & { productCount?: number }): Brand {
  const brand: Brand = {
    name: data.name,
    status: data.status ?? 'active',
    productCount: data.productCount ?? 0,
    id: `brand-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  useBrandStore.setState(s => ({ brands: [...s.brands, brand] }));
  logAction('แบรนด์', 'เพิ่ม', `เพิ่มแบรนด์ "${brand.name}"`, { brandId: brand.id });
  return brand;
}

export function updateBrand(id: string, updates: Partial<Omit<Brand, 'id'>>): void {
  useBrandStore.setState(s => ({
    brands: s.brands.map(b => b.id === id ? { ...b, ...updates } : b),
  }));
  const name = updates.name ?? getBrand(id)?.name ?? '';
  logAction('แบรนด์', 'แก้ไข', `แก้ไขแบรนด์ "${name}"`, { brandId: id });
}

export function deleteBrand(id: string): void {
  const name = getBrand(id)?.name ?? '';
  useBrandStore.setState(s => ({
    brands: s.brands.filter(b => b.id !== id),
  }));
  logAction('แบรนด์', 'ลบ', `ลบแบรนด์ "${name}"`, { brandId: id });
}
