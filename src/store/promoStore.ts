/**
 * Promotion Store — Zustand
 * M07 Promotion Engine
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Promotion, CouponUsage, AppliedDiscount, PromoType } from '../types/promotion';
import { MOCK_PROMOTIONS, MOCK_COUPON_USAGES } from '../data/mockPromotions';
import { isFreshStore } from './freshStore';
import { logAction } from './auditLogStore';
import { persistStorage } from './persistStorage';

// ─── Helper ───────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Store ────────────────────────────────────────────────────────────────────
interface PromoStore {
  promotions: Promotion[];
  couponUsages: CouponUsage[];

  // Actions
  getActivePromotions: () => Promotion[];
  createPromotion: (data: Omit<Promotion, 'id' | 'usageCount' | 'totalDiscountGiven' | 'createdAt'>) => Promotion;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  disablePromotion: (id: string) => void;
  validateCoupon: (code: string, cartTotal: number, memberLevel?: string) => { valid: boolean; promotion?: Promotion; error?: string };
  applyCoupon: (code: string, saleNo: string, discountAmount: number, memberId?: string) => CouponUsage;
}

export const usePromoStore = create<PromoStore>()(
  persist(
    (set, get) => ({
  promotions: isFreshStore() ? [] : MOCK_PROMOTIONS,
  couponUsages: isFreshStore() ? [] : MOCK_COUPON_USAGES,

  getActivePromotions: () => {
    const today = new Date().toISOString().slice(0, 10);
    return get().promotions.filter(p =>
      p.status === 'active' && p.startDate <= today && p.endDate >= today
    );
  },

  createPromotion: (data) => {
    const newPromo: Promotion = {
      ...data,
      id: genId(),
      usageCount: 0,
      totalDiscountGiven: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set(s => ({ promotions: [...s.promotions, newPromo] }));
    logAction('โปรโมชั่น', 'สร้างโปร', `สร้าง "${newPromo.name}" (${newPromo.promoCode})`, { promoId: newPromo.id, type: newPromo.type });
    return newPromo;
  },

  updatePromotion: (id, data) => {
    set(s => ({
      promotions: s.promotions.map(p => p.id === id ? { ...p, ...data } : p),
    }));
  },

  disablePromotion: (id) => {
    set(s => ({
      promotions: s.promotions.map(p =>
        p.id === id ? { ...p, status: 'disabled' as const } : p
      ),
    }));
  },

  validateCoupon: (code, cartTotal, memberLevel?) => {
    const today = new Date().toISOString().slice(0, 10);
    const promo = get().promotions.find(
      p => (p.couponCode?.toLowerCase() === code.toLowerCase() || p.promoCode?.toLowerCase() === code.toLowerCase())
    );

    if (!promo) {
      return { valid: false, error: 'ไม่พบรหัสคูปอง' };
    }

    if (promo.status !== 'active') {
      return { valid: false, error: 'คูปองนี้ไม่ได้เปิดใช้งาน' };
    }

    if (promo.endDate < today) {
      return { valid: false, error: 'คูปองหมดอายุแล้ว' };
    }

    if (promo.startDate > today) {
      return { valid: false, error: 'คูปองยังไม่เริ่มใช้งาน' };
    }

    if (promo.couponLimit && promo.couponUsed !== undefined && promo.couponUsed >= promo.couponLimit) {
      return { valid: false, error: 'คูปองถูกใช้ครบจำนวนสิทธิ์แล้ว' };
    }

    if (promo.minPurchase && cartTotal < promo.minPurchase) {
      return { valid: false, error: `ยอดซื้อขั้นต่ำ ${promo.minPurchase.toLocaleString()} บาท` };
    }

    if (promo.applicableLevels && promo.applicableLevels.length > 0) {
      if (!memberLevel || !promo.applicableLevels.includes(memberLevel)) {
        return { valid: false, error: 'คูปองนี้สำหรับสมาชิกระดับที่กำหนดเท่านั้น' };
      }
    }

    return { valid: true, promotion: promo };
  },

  applyCoupon: (code, saleNo, discountAmount, memberId?) => {
    const promo = get().promotions.find(
      p => (p.couponCode?.toLowerCase() === code.toLowerCase() || p.promoCode?.toLowerCase() === code.toLowerCase())
    );

    if (!promo) {
      throw new Error('ไม่พบรหัสคูปอง');
    }

    // Update promotion usage stats
    set(s => ({
      promotions: s.promotions.map(p =>
        p.id === promo.id
          ? {
              ...p,
              usageCount: p.usageCount + 1,
              totalDiscountGiven: p.totalDiscountGiven + discountAmount,
              couponUsed: (p.couponUsed ?? 0) + 1,
            }
          : p
      ),
    }));

    const usage: CouponUsage = {
      id: genId(),
      promotionId: promo.id,
      couponCode: code,
      memberId,
      saleNo,
      discountAmount,
      usedAt: new Date().toISOString(),
    };

    set(s => ({ couponUsages: [...s.couponUsages, usage] }));
    logAction('โปรโมชั่น', 'ใช้คูปอง', `ใช้คูปอง ${code} ลด ฿${discountAmount} (${saleNo})`, { code, saleNo, discountAmount });
    return usage;
  },
    }),
    { name: 'pos-promos', storage: createJSONStorage(() => persistStorage) }
  )
);
