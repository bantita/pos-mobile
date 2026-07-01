/**
 * Promo Management Store — Zustand + Persist
 * จัดการ CRUD สำหรับโปรโมชั่นกลุ่มสินค้า, สินค้าร่วม, จำนวนสินค้า
 * พร้อม getActiveCountByCategory() สำหรับ PromoCategoriesScreen
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProductGroupPromotion } from '../types/productGroupPromo';
import { BundlePromotion } from '../types/bundlePromo';
import { QuantityPromotion } from '../types/quantityPromo';
import { usePromoStore } from './promoStore';
import { persistStorage } from './persistStorage';

// ─── Helper ───────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Store Interface ──────────────────────────────────────────────────────────
interface PromoManagementStore {
  productGroupPromos: ProductGroupPromotion[];
  bundlePromos: BundlePromotion[];
  quantityPromos: QuantityPromotion[];

  // Product Group CRUD
  createProductGroupPromo: (data: Omit<ProductGroupPromotion, 'id' | 'createdAt' | 'status'>) => ProductGroupPromotion;
  updateProductGroupPromo: (id: string, data: Partial<ProductGroupPromotion>) => void;
  disableProductGroupPromo: (id: string) => void;

  // Bundle CRUD
  createBundlePromo: (data: Omit<BundlePromotion, 'id' | 'createdAt' | 'status'>) => BundlePromotion;
  updateBundlePromo: (id: string, data: Partial<BundlePromotion>) => void;
  disableBundlePromo: (id: string) => void;

  // Quantity CRUD
  createQuantityPromo: (data: Omit<QuantityPromotion, 'id' | 'createdAt' | 'status'>) => QuantityPromotion;
  updateQuantityPromo: (id: string, data: Partial<QuantityPromotion>) => void;
  disableQuantityPromo: (id: string) => void;

  // Counts for category screen
  getActiveCountByCategory: () => {
    store: number;
    member: number;
    group: number;
    bundle: number;
    quantity: number;
  };
}

// ─── Store Implementation ─────────────────────────────────────────────────────
export const usePromoManagementStore = create<PromoManagementStore>()(
  persist(
    (set, get) => ({
  productGroupPromos: [],
  bundlePromos: [],
  quantityPromos: [],

  // ─── Product Group CRUD ───────────────────────────────────────────────────────
  createProductGroupPromo: (data) => {
    const newPromo: ProductGroupPromotion = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    set(s => ({ productGroupPromos: [...s.productGroupPromos, newPromo] }));
    return newPromo;
  },

  updateProductGroupPromo: (id, data) => {
    set(s => ({
      productGroupPromos: s.productGroupPromos.map(p =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },

  disableProductGroupPromo: (id) => {
    set(s => ({
      productGroupPromos: s.productGroupPromos.map(p =>
        p.id === id ? { ...p, status: 'disabled' as const } : p
      ),
    }));
  },

  // ─── Bundle CRUD ──────────────────────────────────────────────────────────────
  createBundlePromo: (data) => {
    const newPromo: BundlePromotion = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    set(s => ({ bundlePromos: [...s.bundlePromos, newPromo] }));
    return newPromo;
  },

  updateBundlePromo: (id, data) => {
    set(s => ({
      bundlePromos: s.bundlePromos.map(p =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },

  disableBundlePromo: (id) => {
    set(s => ({
      bundlePromos: s.bundlePromos.map(p =>
        p.id === id ? { ...p, status: 'disabled' as const } : p
      ),
    }));
  },

  // ─── Quantity CRUD ────────────────────────────────────────────────────────────
  createQuantityPromo: (data) => {
    const newPromo: QuantityPromotion = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    set(s => ({ quantityPromos: [...s.quantityPromos, newPromo] }));
    return newPromo;
  },

  updateQuantityPromo: (id, data) => {
    set(s => ({
      quantityPromos: s.quantityPromos.map(p =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },

  disableQuantityPromo: (id) => {
    set(s => ({
      quantityPromos: s.quantityPromos.map(p =>
        p.id === id ? { ...p, status: 'disabled' as const } : p
      ),
    }));
  },

  // ─── Active Count By Category ─────────────────────────────────────────────────
  getActiveCountByCategory: () => {
    const state = get();

    // Store count: from promoStore (promotions with status 'active')
    const storePromos = usePromoStore.getState().promotions;
    const storeCount = storePromos.filter(p => p.status === 'active').length;

    // Member count: member promotions with status 'active'
    // memberPromoStore ยังไม่มี — ใช้ mock data เพื่อนับ active member promos
    // เมื่อมี memberPromoStore จะเปลี่ยนมาใช้ store จริง
    let memberCount = 0;
    try {
      const { MOCK_MEMBER_PROMOTIONS } = require('../data/mockMemberPromotions');
      memberCount = MOCK_MEMBER_PROMOTIONS.filter(
        (p: { status: string }) => p.status === 'active'
      ).length;
    } catch {
      memberCount = 0;
    }

    // Group/Bundle/Quantity counts from this store
    const groupCount = state.productGroupPromos.filter(p => p.status === 'active').length;
    const bundleCount = state.bundlePromos.filter(p => p.status === 'active').length;
    const quantityCount = state.quantityPromos.filter(p => p.status === 'active').length;

    return {
      store: storeCount,
      member: memberCount,
      group: groupCount,
      bundle: bundleCount,
      quantity: quantityCount,
    };
  },
    }),
    { name: 'pos-promo-management', storage: createJSONStorage(() => persistStorage) }
  )
);
