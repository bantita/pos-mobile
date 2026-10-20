/**
 * Cart Store — Zustand + Persist
 * จัดการ state ของตะกร้าสินค้าและการขาย
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Discount, HoldBill, Product, OrderType, OrderDetails } from '../types/sale';
import { persistStorage } from './persistStorage';

interface CartState {
  items: CartItem[];
  discount: Discount | null;
  holdBills: HoldBill[];
  orderType: OrderType;
  orderDetails: OrderDetails;

  // Actions
  setOrderType: (orderType: OrderType) => void;
  setOrderDetails: (details: OrderDetails) => void;
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

/**
 * คำนวณ VAT ราย "บรรทัดสินค้า" โดยอิง vatIncluded/vatRate ของสินค้าแต่ละตัว
 * - lineNet = ยอดบรรทัดหลังส่วนลดรายสินค้า แล้วเฉลี่ยส่วนลดระดับบิลตามสัดส่วน
 *   (จึงได้ sum(lineNet) = subtotal - discountTotal พอดี)
 * - สินค้า VAT นอก (exclusive): VAT = lineNet * rate/100  → ต้องบวกเพิ่มในยอดชำระ
 * - สินค้า VAT ใน (inclusive): VAT = lineNet - lineNet/(1+rate/100) → ฝังในราคาแล้ว
 * - rate 0 → ไม่มี VAT
 */
interface LineVat {
  /** VAT ของบรรทัดนี้ (บาท) */
  vat: number;
  /** true เมื่อเป็น VAT นอก (ต้องบวกเพิ่มในยอดชำระ) */
  exclusive: boolean;
}

const computeLineVats = (items: CartItem[], billDiscountRatio: number): LineVat[] =>
  items.map((item) => {
    const rate = item.product.vatRate || 0;
    // เฉลี่ยส่วนลดระดับบิลตามสัดส่วนของยอดบรรทัด
    const lineNet = item.subtotal * billDiscountRatio;
    if (rate <= 0) return { vat: 0, exclusive: false };
    if (item.product.vatIncluded) {
      return { vat: lineNet - lineNet / (1 + rate / 100), exclusive: false };
    }
    return { vat: lineNet * (rate / 100), exclusive: true };
  });

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
  items: [],
  discount: null,
  holdBills: [],
  orderType: 'normal',
  orderDetails: {},

  setOrderType: (orderType) => set({ orderType }),
  setOrderDetails: (details) => set({ orderDetails: details }),

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

  clearCart: () => set({ items: [], discount: null, orderType: 'normal', orderDetails: {} }),

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
    const subtotal = get().getSubtotal();
    if (subtotal <= 0) return 0;
    // สัดส่วนที่เหลือหลังหักส่วนลดระดับบิล (เฉลี่ยลงแต่ละบรรทัด)
    const ratio = (subtotal - get().getDiscountTotal()) / subtotal;
    return computeLineVats(get().items, ratio).reduce((sum, l) => sum + l.vat, 0);
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const afterDiscount = subtotal - get().getDiscountTotal();
    if (subtotal <= 0) return afterDiscount;
    const ratio = afterDiscount / subtotal;
    // VAT ใน = ฝังในราคาอยู่แล้ว (ไม่บวกซ้ำ); VAT นอก = ต้องบวกเพิ่มในยอดชำระ
    const exclusiveVat = computeLineVats(get().items, ratio)
      .reduce((sum, l) => sum + (l.exclusive ? l.vat : 0), 0);
    return afterDiscount + exclusiveVat;
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'pos-cart',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({ items: state.items, discount: state.discount, holdBills: state.holdBills, orderType: state.orderType, orderDetails: state.orderDetails }),
    }
  )
);
