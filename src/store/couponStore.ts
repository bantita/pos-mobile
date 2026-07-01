/**
 * Coupon Store — Zustand with persist
 * Coupon campaigns and codes management
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CouponCampaign,
  CouponCode,
  CouponStatus,
  CampaignStats,
  UsageCounts,
  StatusTransition,
} from '../types/coupon';
import { persistStorage } from './persistStorage';

interface CouponState {
  campaigns: CouponCampaign[];
  codes: Record<string, CouponCode>;
}

interface CouponStore extends CouponState {
  // Campaign CRUD
  addCampaign: (campaign: CouponCampaign) => void;
  updateCampaign: (id: string, updates: Partial<CouponCampaign>) => void;
  deleteCampaign: (id: string) => { success: boolean; reason?: string };
  getCampaigns: () => CouponCampaign[];
  getCampaign: (id: string) => CouponCampaign | undefined;

  // Code Operations
  addCodes: (codes: CouponCode[]) => void;
  lookupCode: (code: string) => CouponCode | undefined;
  updateCodeStatus: (
    code: string,
    status: CouponStatus,
    metadata: { actor: string; billNumber?: string; customerId?: string },
  ) => void;
  getCodesByCampaign: (campaignId: string) => CouponCode[];
  getAllCodes: () => CouponCode[];
  getAllExistingCodeSet: () => Set<string>;

  // Queries
  getCampaignStats: (campaignId: string) => CampaignStats;
  getUsageCounts: (campaignId: string, memberId?: string, billCoupons?: string[]) => UsageCounts;

  // Reset
  resetStore: () => void;
}

const useCouponStoreInternal = create<CouponStore>()(
  persist(
    (set, get) => ({
      campaigns: [
        { id: 'cp-001', name: 'Welcome 50 บาท', promotionId: 'promo-1', prefix: 'WELCOME', totalQuantity: 500, expiryDate: '2026-12-31', limits: { limitType: 'per_bill', perBillLimit: 1 }, sharingPercent: 0, contactPerson: 'Admin', remark: 'สมาชิกใหม่', createdAt: '2026-01-01', createdBy: 'admin', updatedAt: '2026-01-01' },
        { id: 'cp-002', name: 'Birthday 15%', promotionId: 'promo-2', prefix: 'BDAY', totalQuantity: 200, expiryDate: '2026-12-31', limits: { limitType: 'per_bill', perBillLimit: 1 }, sharingPercent: 0, contactPerson: 'Admin', remark: 'วันเกิด', createdAt: '2026-01-15', createdBy: 'admin', updatedAt: '2026-01-15' },
        { id: 'cp-003', name: 'Flash Friday 20%', promotionId: 'promo-3', prefix: 'FLASH', totalQuantity: 1000, expiryDate: '2026-06-30', limits: { limitType: 'per_bill', perBillLimit: 1 }, sharingPercent: 0, contactPerson: 'Admin', remark: 'ทุกวันศุกร์', createdAt: '2026-02-01', createdBy: 'admin', updatedAt: '2026-02-01' },
      ],
      codes: {},

      // ─── Campaign CRUD ────────────────────────────────────────────────────────────

      addCampaign: (campaign) => {
        set(s => ({ campaigns: [...s.campaigns, campaign] }));
      },

      updateCampaign: (id, updates) => {
        set(s => ({
          campaigns: s.campaigns.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCampaign: (id) => {
        const codes = get().getCodesByCampaign(id);
        const hasUsed = codes.some(c => c.status === CouponStatus.USED);
        if (hasUsed) {
          return { success: false, reason: 'มีคูปองที่ใช้แล้ว ไม่สามารถลบได้' };
        }
        set(s => {
          const newCodes = { ...s.codes };
          for (const code of codes) {
            delete newCodes[code.code];
          }
          return {
            campaigns: s.campaigns.filter(c => c.id !== id),
            codes: newCodes,
          };
        });
        return { success: true };
      },

      getCampaigns: () => {
        return [...get().campaigns];
      },

      getCampaign: (id) => {
        return get().campaigns.find(c => c.id === id);
      },

      // ─── Code Operations ──────────────────────────────────────────────────────────

      addCodes: (codes) => {
        set(s => {
          const newCodes = { ...s.codes };
          for (const code of codes) {
            newCodes[code.code] = code;
          }
          return { codes: newCodes };
        });
      },

      lookupCode: (code) => {
        return get().codes[code];
      },

      updateCodeStatus: (code, status, metadata) => {
        const existing = get().codes[code];
        if (!existing) return;

        const transition: StatusTransition = {
          fromStatus: existing.status,
          toStatus: status,
          timestamp: new Date().toISOString(),
          actor: metadata.actor,
        };

        const updated: CouponCode = {
          ...existing,
          status,
          statusHistory: [...existing.statusHistory, transition],
          ...(status === CouponStatus.USED ? {
            usageDate: new Date().toISOString(),
            billNumber: metadata.billNumber,
            customerId: metadata.customerId,
          } : {}),
        };

        set(s => ({ codes: { ...s.codes, [code]: updated } }));
      },

      getCodesByCampaign: (campaignId) => {
        const result: CouponCode[] = [];
        const codes = get().codes;
        for (const key of Object.keys(codes)) {
          if (codes[key].campaignId === campaignId) result.push(codes[key]);
        }
        return result;
      },

      getAllCodes: () => {
        return Object.values(get().codes);
      },

      getAllExistingCodeSet: () => {
        return new Set(Object.keys(get().codes));
      },

      // ─── Queries ──────────────────────────────────────────────────────────────────

      getCampaignStats: (campaignId) => {
        const codes = get().getCodesByCampaign(campaignId);
        return {
          total: codes.length,
          active: codes.filter(c => c.status === CouponStatus.ACTIVE).length,
          used: codes.filter(c => c.status === CouponStatus.USED).length,
          expired: codes.filter(c => c.status === CouponStatus.EXPIRED).length,
          cancelled: codes.filter(c => c.status === CouponStatus.CANCELLED).length,
        };
      },

      getUsageCounts: (campaignId, memberId?, billCoupons?) => {
        const codes = get().getCodesByCampaign(campaignId);
        const totalUsed = codes.filter(c => c.status === CouponStatus.USED).length;
        const perCustomerUsed = memberId
          ? codes.filter(c => c.status === CouponStatus.USED && c.customerId === memberId).length
          : 0;
        const perBillUsed = billCoupons
          ? billCoupons.filter(bc => codes.some(c => c.code === bc)).length
          : 0;

        return { totalUsed, perBillUsed, perCustomerUsed };
      },

      // ─── Reset (for testing) ──────────────────────────────────────────────────────

      resetStore: () => {
        set({ campaigns: [], codes: {} });
      },
    }),
    { name: 'pos-coupons', storage: createJSONStorage(() => persistStorage) }
  )
);

// ─── Backwards-compatible exports (module pattern) ────────────────────────────
// Consumers use `import * as couponStore from '...'` and call e.g. couponStore.getCampaigns()

export function addCampaign(campaign: CouponCampaign): void {
  useCouponStoreInternal.getState().addCampaign(campaign);
}

export function updateCampaign(id: string, updates: Partial<CouponCampaign>): void {
  useCouponStoreInternal.getState().updateCampaign(id, updates);
}

export function deleteCampaign(id: string): { success: boolean; reason?: string } {
  return useCouponStoreInternal.getState().deleteCampaign(id);
}

export function getCampaigns(): CouponCampaign[] {
  return useCouponStoreInternal.getState().getCampaigns();
}

export function getCampaign(id: string): CouponCampaign | undefined {
  return useCouponStoreInternal.getState().getCampaign(id);
}

export function addCodes(codes: CouponCode[]): void {
  useCouponStoreInternal.getState().addCodes(codes);
}

export function lookupCode(code: string): CouponCode | undefined {
  return useCouponStoreInternal.getState().lookupCode(code);
}

export function updateCodeStatus(
  code: string,
  status: CouponStatus,
  metadata: { actor: string; billNumber?: string; customerId?: string },
): void {
  useCouponStoreInternal.getState().updateCodeStatus(code, status, metadata);
}

export function getCodesByCampaign(campaignId: string): CouponCode[] {
  return useCouponStoreInternal.getState().getCodesByCampaign(campaignId);
}

export function getAllCodes(): CouponCode[] {
  return useCouponStoreInternal.getState().getAllCodes();
}

export function getAllExistingCodeSet(): Set<string> {
  return useCouponStoreInternal.getState().getAllExistingCodeSet();
}

export function getCampaignStats(campaignId: string): CampaignStats {
  return useCouponStoreInternal.getState().getCampaignStats(campaignId);
}

export function getUsageCounts(campaignId: string, memberId?: string, billCoupons?: string[]): UsageCounts {
  return useCouponStoreInternal.getState().getUsageCounts(campaignId, memberId, billCoupons);
}

export function resetStore(): void {
  useCouponStoreInternal.getState().resetStore();
}

// Export Zustand hook for components that prefer hooks
export const useCouponStore = useCouponStoreInternal;
