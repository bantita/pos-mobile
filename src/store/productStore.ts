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
        set((s) => ({
          products: s.products.map((p) => {
            // productId อาจเป็น "p1_u1_1" → ต้อง match master id
            const masterId = productId.split('_')[0];
            if (p.id === masterId || p.id === productId) {
              return { ...p, stockQty: Math.max(0, p.stockQty - qty) };
            }
            return p;
          }),
        })),
    }),
    {
      name: 'pos-products',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({ products: state.products }),
    }
  )
);
