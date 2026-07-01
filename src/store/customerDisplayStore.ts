import { create } from 'zustand';
import { DisplayMode, AdMedia } from '../types/customerDisplay';

// ─── Mock Ads ─────────────────────────────────────────────────────────────────
const MOCK_ADS: AdMedia[] = [
  {
    id: 'ad1', type: 'image',
    uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    duration: 5, title: 'ยินดีต้อนรับ', subtitle: 'บริการด้วยใจ ราคาดีทุกวัน',
  },
  {
    id: 'ad2', type: 'image',
    uri: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=800',
    duration: 5, title: 'โปรโมชั่นประจำสัปดาห์', subtitle: 'ลด 10% เครื่องดื่มทุกชนิด',
  },
  {
    id: 'ad3', type: 'image',
    uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    duration: 5, title: 'สินค้าสด ใหม่ทุกวัน', subtitle: 'คัดสรรคุณภาพเพื่อคุณ',
  },
];

const CHANNEL_KEY = 'pos_display_state';

// ── BroadcastChannel helper (web only) ────────────────────────────────────────
let bc: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  bc = new BroadcastChannel(CHANNEL_KEY);
}

/** broadcast state ไปทุก window (จอ 2) */
function broadcast(data: Partial<DisplaySyncPayload>) {
  try { bc?.postMessage(data); } catch (_) {}
  // fallback: localStorage event สำหรับ browser ที่ไม่รองรับ BroadcastChannel
  try {
    localStorage.setItem(CHANNEL_KEY, JSON.stringify({ ...data, _ts: Date.now() }));
  } catch (_) {}
}

interface DisplaySyncPayload {
  mode?: DisplayMode;
  paidAmount?: number;
  changeAmount?: number;
  shopName?: string;
  ads?: AdMedia[];
  displayItems?: DisplayItemSync[];
  discountOverride?: number;
  grandOverride?: number;
  payMethodLabel?: string;
  syncedGrand?: number;
  memberInfo?: { name: string; level: string; points: number; wallet: number } | null;
  _ts?: number;
}

export interface DisplayItemSync {
  id: string; name: string;
  unitPrice: number; qty: number;
  discAmt: number; subtotal: number;
}

interface CustomerDisplayStoreState {
  mode: DisplayMode;
  paidAmount: number;
  changeAmount: number;
  shopName: string;
  ads: AdMedia[];
  currentAdIndex: number;
  // ข้อมูลที่ broadcast มาจากจอ 1
  syncedItems: DisplayItemSync[];
  syncedDiscount: number;
  syncedGrand: number;
  payMethodLabel: string;
  memberInfo: { name: string; level: string; points: number; wallet: number } | null;

  setMode: (mode: DisplayMode) => void;
  setPaidInfo: (paid: number, change: number) => void;
  setShopName: (name: string) => void;
  nextAd: () => void;
  addAd: (ad: AdMedia) => void;
  removeAd: (id: string) => void;
  reorderAds: (ads: AdMedia[]) => void;
  /** broadcast ข้อมูลเต็มไปจอ 2 */
  broadcastDisplay: (payload: DisplaySyncPayload) => void;
}

export const useCustomerDisplayStore = create<CustomerDisplayStoreState>((set, get) => {
  // ── รับข้อมูลจาก BroadcastChannel (ฝั่งจอ 2) ─────────────────────────────
  const applySync = (data: DisplaySyncPayload) => {
    const patch: Partial<CustomerDisplayStoreState> = {};
    if (data.mode          !== undefined) patch.mode          = data.mode;
    if (data.paidAmount    !== undefined) patch.paidAmount    = data.paidAmount;
    if (data.changeAmount  !== undefined) patch.changeAmount  = data.changeAmount;
    if (data.shopName      !== undefined) patch.shopName      = data.shopName;
    if (data.ads           !== undefined) patch.ads           = data.ads;
    if (data.displayItems  !== undefined) patch.syncedItems   = data.displayItems;
    if (data.discountOverride !== undefined) patch.syncedDiscount = data.discountOverride;
    if (data.grandOverride !== undefined) patch.syncedGrand   = data.grandOverride;
    if (data.syncedGrand   !== undefined) patch.syncedGrand   = data.syncedGrand;
    if (data.payMethodLabel !== undefined) (patch as any).payMethodLabel = data.payMethodLabel;
    if (data.memberInfo    !== undefined) (patch as any).memberInfo = data.memberInfo;
    set(patch);
  };

  if (bc) {
    bc.onmessage = (e) => applySync(e.data);
  }

  // localStorage fallback
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === CHANNEL_KEY && e.newValue) {
        try { applySync(JSON.parse(e.newValue)); } catch (_) {}
      }
    });
  }

  return {
    mode: 'idle',
    paidAmount: 0,
    changeAmount: 0,
    shopName: 'ร้านสะดวกซื้อ ABC',
    ads: MOCK_ADS,
    currentAdIndex: 0,
    syncedItems: [],
    syncedDiscount: 0,
    syncedGrand: 0,
    payMethodLabel: '',
    memberInfo: null,

    setMode: (mode) => {
      set({ mode });
      broadcast({ mode });
    },

    setPaidInfo: (paidAmount, changeAmount) => {
      set({ paidAmount, changeAmount });
      broadcast({ paidAmount, changeAmount });
    },

    setShopName: (shopName) => {
      set({ shopName });
      broadcast({ shopName });
    },

    nextAd: () => set((s) => ({
      currentAdIndex: (s.currentAdIndex + 1) % s.ads.length,
    })),

    addAd: (ad) => {
      set((s) => ({ ads: [...s.ads, ad] }));
      broadcast({ ads: get().ads });
    },

    removeAd: (id) => {
      set((s) => ({ ads: s.ads.filter((a) => a.id !== id) }));
      broadcast({ ads: get().ads });
    },

    reorderAds: (ads) => {
      set({ ads });
      broadcast({ ads });
    },

    broadcastDisplay: (payload) => {
      // อัปเดต local state ด้วย
      const patch: Partial<CustomerDisplayStoreState> = {};
      if (payload.mode          !== undefined) patch.mode          = payload.mode;
      if (payload.displayItems  !== undefined) patch.syncedItems   = payload.displayItems;
      if (payload.discountOverride !== undefined) patch.syncedDiscount = payload.discountOverride;
      if (payload.grandOverride !== undefined) patch.syncedGrand   = payload.grandOverride;
      if (payload.shopName      !== undefined) patch.shopName      = payload.shopName;
      if (payload.memberInfo    !== undefined) (patch as any).memberInfo = payload.memberInfo;
      if (payload.syncedGrand   !== undefined) patch.syncedGrand   = payload.syncedGrand;
      if (payload.payMethodLabel !== undefined) (patch as any).payMethodLabel = payload.payMethodLabel;
      set(patch);
      broadcast(payload);
    },
  };
});
