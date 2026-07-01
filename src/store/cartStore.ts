/**
 * Cart Store — Zustand + Persist
 * จัดการ state ของตะกร้าสินค้าและการขาย
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Discount, HoldBill, Product } from '../types/sale';
import { persistStorage } from './persistStorage';

interface CartState {
  items: CartItem[];
  discount: Discount | null;
  holdBills: HoldBill[];

  // Actions
  addItem: (product: Product, qty?: number) => void;
  addServiceItem: (product: Product, technicianId: string, technicianName: string) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  updateItemDiscount: (productId: string, discount: number, type: 'amount' | 'percent') => void;
  setDiscount: (discount: Discount | null) => void;
  clearCart: () => void;
  holdBill: (customerRef?: string, remark?: string) => void;
  recallBill: (holdId: string) => void;
  deleteHoldBill: (holdId: string) => void;

  // Computed
  getSubtotal: () => number;
  getDiscountTotal: () => number;
  getVatAmount: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

const recalcItem = (item: CartItem): CartItem => {
  const discAmt = item.discountPercent > 0
    ? item.unitPrice * (item.discountPercent / 100)
    : item.discountAmount;
  const netPrice = Math.max(0, item.unitPrice - discAmt);
  return { ...item, discountAmount: discAmt, subtotal: netPrice * item.qty };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
  items: [],
  discount: null,
  holdBills: [],

  addItem: (product, qty = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        const updated = state.items.map((i) =>
          i.product.id === product.id
            ? recalcItem({ ...i, qty: i.qty + qty })
            : i
        );
        return { items: updated };
      }
      const newItem: CartItem = {
        product,
        qty,
        unitPrice: product.price,
        discountAmount: 0,
        discountPercent: 0,
        subtotal: product.price * qty,
      };
      return { items: [...state.items, newItem] };
    });
  },

  addServiceItem: (product, technicianId, technicianName) => {
    set((state) => {
      const newItem: CartItem = {
        product,
        qty: 1,
        unitPrice: product.price,
        discountAmount: 0,
        discountPercent: 0,
        subtotal: product.price,
        technicianId,
        technicianName,
      };
      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

  updateQty: (productId, qty) =>
    set((state) => ({
      items: qty <= 0
        ? state.items.filter((i) => i.product.id !== productId)
        : state.items.map((i) =>
            i.product.id === productId ? recalcItem({ ...i, qty }) : i
          ),
    })),

  updateItemDiscount: (productId, discount, type) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId
          ? recalcItem({
              ...i,
              discountPercent: type === 'percent' ? discount : 0,
              discountAmount: type === 'amount' ? discount : 0,
            })
          : i
      ),
    })),

  setDiscount: (discount) => set({ discount }),

  clearCart: () => set({ items: [], discount: null }),

  holdBill: (customerRef, remark) =>
    set((state) => {
      if (state.items.length === 0) return state;
      const bill: HoldBill = {
        id: `hold_${Date.now()}`,
        items: state.items,
        discount: state.discount,
        customerRef,
        remark,
        heldAt: new Date(),
        heldBy: 'current_user',
      };
      return { items: [], discount: null, holdBills: [...state.holdBills, bill] };
    }),

  recallBill: (holdId) =>
    set((state) => {
      const bill = state.holdBills.find((b) => b.id === holdId);
      if (!bill) return state;
      return {
        items: bill.items,
        discount: bill.discount,
        holdBills: state.holdBills.filter((b) => b.id !== holdId),
      };
    }),

  deleteHoldBill: (holdId) =>
    set((state) => ({ holdBills: state.holdBills.filter((b) => b.id !== holdId) })),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),

  getDiscountTotal: () => {
    const subtotal = get().getSubtotal();
    const d = get().discount;
    if (!d) return 0;
    return d.type === 'percent' ? subtotal * (d.value / 100) : d.value;
  },

  getVatAmount: () => {
    const afterDiscount = get().getSubtotal() - get().getDiscountTotal();
    return afterDiscount * 0.07;
  },

  getGrandTotal: () => {
    const afterDiscount = get().getSubtotal() - get().getDiscountTotal();
    return afterDiscount;
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'pos-cart',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({ items: state.items, discount: state.discount, holdBills: state.holdBills }),
    }
  )
);
