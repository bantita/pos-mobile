/**
 * productStore — Global state สำหรับสินค้า + Persist
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { ProductMaster } from '../types/product';
import { persistStorage } from './persistStorage';

interface ProductState {
  products: ProductMaster[];
  updateProduct: (id: string, data: Partial<ProductMaster>) => void;
  addProduct:    (product: ProductMaster) => void;
  deleteProduct: (id: string) => void;
  deductStock:   (productId: string, qty: number) => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: [...MOCK_PRODUCTS],

      updateProduct: (id, data) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date() } : p
          ),
        })),

      addProduct: (product) =>
        set((s) => ({ products: [product, ...s.products] })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      deductStock: (productId, qty) =>
        set((s) => {
          // productId อาจเป็น "p1_u1_1" หรือ "p1_u1_1__v30_red"
          // แยก variant ด้วย '__' ก่อน แล้วค่อยหา master id จากส่วนซ้าย (split('_')[0])
          const [left, variantId] = productId.split('__');
          const masterId = left.split('_')[0];
          return {
            products: s.products.map((p) => {
              if (p.id !== masterId && p.id !== productId) return p;
              if (variantId && p.variants?.length) {
                return {
                  ...p,
                  variants: p.variants.map((v) =>
                    v.id === variantId
                      ? { ...v, stockQty: Math.max(0, v.stockQty - qty) }
                      : v
                  ),
                };
              }
              return { ...p, stockQty: Math.max(0, p.stockQty - qty) };
            }),
          };
        }),
    }),
    {
      name: 'pos-products',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({ products: state.products }),
    }
  )
);
