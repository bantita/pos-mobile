import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { DisplayMode, AdMedia } from '../types/customerDisplay';
import { persistStorage } from './persistStorage';
import {
  createAd,
  moveItem,
  getPlayableAds,
  migrateCustomerDisplay,
  PersistedCustomerDisplay,
  DEFAULT_SHOP_NAME,
  DEFAULT_SUCCESS_DURATION,
  DEFAULT_THANK_YOU,
  MAX_SUCCESS_DURATION,
} from '../utils/adSettings';
import type { AdMediaType } from '../types/customerDisplay';
import { isMediaRef, deleteAdMedia } from '../utils/adMedia';

// ─── Mock Ads ─────────────────────────────────────────────────────────────────
export const MOCK_ADS: AdMedia[] = [
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
export const PERSIST_KEY = 'pos-customer-display';
export const STORAGE_FULL_MESSAGE = 'พื้นที่จัดเก็บเต็ม ลบโฆษณาบางรายการหรือใช้ลิงก์แทน';

// ── BroadcastChannel helper (web only) ────────────────────────────────────────
let bc: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  bc = new BroadcastChannel(CHANNEL_KEY);
}

/** broadcast state ไปทุก window (จอ 2) */
function broadcast(data: Partial<DisplaySyncPayload>) {
  try { bc?.postMessage(data); } catch (_) {}
  // fallback: localStorage event สำหรับ browser ที่ไม่รองรับ BroadcastChannel
  // เขียนแล้วลบทันที — event ยังส่งถึง window อื่น แต่ไม่กินพื้นที่ localStorage
  // (โฆษณาที่อัปโหลดเป็น data URL อาจใหญ่หลาย MB)
  try {
    localStorage.setItem(CHANNEL_KEY, JSON.stringify({ ...data, _ts: Date.now() }));
    localStorage.removeItem(CHANNEL_KEY);
  } catch (_) {}
}

interface DisplaySyncPayload {
  mode?: DisplayMode;
  paidAmount?: number;
  changeAmount?: number;
  shopName?: string;
  ads?: AdMedia[];
  adsEnabled?: boolean;
  successDurationSec?: number;
  thankYouMessage?: string;
  displayItems?: DisplayItemSync[];
  discountOverride?: number;
  grandOverride?: number;
  payMethodLabel?: string;
  syncedGrand?: number;
  memberInfo?: MemberInfoSync | null;
  _ts?: number;
}

export interface MemberInfoSync { name: string; level: string; points: number; wallet: number }

export interface DisplayItemSync {
  id: string; name: string;
  unitPrice: number; qty: number;
  discAmt: number; subtotal: number;
}

export interface CustomerDisplayStoreState {
  mode: DisplayMode;
  paidAmount: number;
  changeAmount: number;
  shopName: string;
  ads: AdMedia[];
  /** index ภายในรายการโฆษณาที่เล่นได้ (getPlayableAds) */
  currentAdIndex: number;
  /** สวิตช์หลัก: แสดงโฆษณาบนจอ 2 */
  adsEnabled: boolean;
  /** จำนวนวินาทีที่แสดง "ชำระสำเร็จ" ก่อนกลับหน้าแรก */
  successDurationSec: number;
  /** ข้อความหลังชำระเงินสำเร็จ */
  thankYouMessage: string;
  /** error จากการบันทึกลงเครื่อง (ไม่ถูกบันทึก) */
  storageError: string | null;
  // ข้อมูลที่ broadcast มาจากจอ 1
  syncedItems: DisplayItemSync[];
  syncedDiscount: number;
  syncedGrand: number;
  payMethodLabel: string;
  memberInfo: MemberInfoSync | null;

  setMode: (mode: DisplayMode) => void;
  setPaidInfo: (paid: number, change: number) => void;
  setShopName: (name: string) => void;
  nextAd: () => void;
  setAdIndex: (index: number) => void;
  addAd: (ad: AdMedia) => void;
  /** เพิ่มโฆษณาด้วยค่าเริ่มต้น (10 วินาที, เปิดแสดง) แล้วคืนรายการที่สร้าง */
  addAdWithDefaults: (input: { uri: string; type: AdMediaType; title?: string; subtitle?: string }) => AdMedia;
  updateAd: (id: string, patch: Partial<Omit<AdMedia, 'id'>>) => void;
  toggleAd: (id: string) => void;
  moveAd: (id: string, direction: -1 | 1) => void;
  moveAdTo: (from: number, to: number) => void;
  removeAd: (id: string) => void;
  reorderAds: (ads: AdMedia[]) => void;
  setAdsEnabled: (v: boolean) => void;
  setSuccessDuration: (sec: number) => void;
  setThankYouMessage: (text: string) => void;
  clearStorageError: () => void;
  /** broadcast ข้อมูลเต็มไปจอ 2 */
  broadcastDisplay: (payload: DisplaySyncPayload) => void;
}

/** clamp index ให้อยู่ในช่วงของโฆษณาที่เล่นได้ */
const clampIndex = (index: number, ads: AdMedia[], adsEnabled: boolean): number => {
  const n = getPlayableAds(ads, adsEnabled).length;
  if (n === 0 || !Number.isFinite(index) || index < 0) return 0;
  return index >= n ? index % n : index;
};

// ── storage wrapper: จับ error (เช่น localStorage เต็ม) + ข้ามการเขียนซ้ำค่าเดิม ──
let lastWritten: string | null = null;
const setStorageError = (msg: string | null) => {
  // ป้องกันวนซ้ำ: set เฉพาะเมื่อค่าเปลี่ยน
  if (useCustomerDisplayStore.getState().storageError !== msg) {
    useCustomerDisplayStore.setState({ storageError: msg });
  }
};
const safeStorage: StateStorage = {
  getItem: (name) => persistStorage.getItem(name),
  removeItem: (name) => persistStorage.removeItem(name),
  setItem: (name, value) => {
    if (value === lastWritten) return;
    const onOk = () => { lastWritten = value; setStorageError(null); };
    const onFail = () => setStorageError(STORAGE_FULL_MESSAGE);
    try {
      const r = persistStorage.setItem(name, value);
      if (r && typeof (r as Promise<void>).then === 'function') {
        return (r as Promise<void>).then(onOk, onFail);
      }
      onOk();
    } catch (_) {
      onFail();
    }
  },
};

export const useCustomerDisplayStore = create<CustomerDisplayStoreState>()(
  persist(
    (set, get) => {
      // ── รับข้อมูลจาก BroadcastChannel (ฝั่งจอ 2) ─────────────────────────────
      const applySync = (data: DisplaySyncPayload) => {
        const patch: Partial<CustomerDisplayStoreState> = {};
        if (data.mode          !== undefined) patch.mode          = data.mode;
        if (data.paidAmount    !== undefined) patch.paidAmount    = data.paidAmount;
        if (data.changeAmount  !== undefined) patch.changeAmount  = data.changeAmount;
        if (data.shopName      !== undefined) patch.shopName      = data.shopName;
        if (data.ads           !== undefined) patch.ads           = data.ads;
        if (data.adsEnabled    !== undefined) patch.adsEnabled    = data.adsEnabled;
        if (data.successDurationSec !== undefined) patch.successDurationSec = data.successDurationSec;
        if (data.thankYouMessage !== undefined) patch.thankYouMessage = data.thankYouMessage;
        if (data.displayItems  !== undefined) patch.syncedItems   = data.displayItems;
        if (data.discountOverride !== undefined) patch.syncedDiscount = data.discountOverride;
        if (data.grandOverride !== undefined) patch.syncedGrand   = data.grandOverride;
        if (data.syncedGrand   !== undefined) patch.syncedGrand   = data.syncedGrand;
        if (data.payMethodLabel !== undefined) patch.payMethodLabel = data.payMethodLabel;
        if (data.memberInfo    !== undefined) patch.memberInfo    = data.memberInfo;
        if (patch.ads !== undefined || patch.adsEnabled !== undefined) {
          const s = get();
          patch.currentAdIndex = clampIndex(s.currentAdIndex, patch.ads ?? s.ads, patch.adsEnabled ?? s.adsEnabled);
        }
        set(patch);
      };

      if (bc) {
        bc.onmessage = (e) => applySync(e.data);
      }

      // localStorage fallback
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('storage', (e) => {
          if (e.key === CHANNEL_KEY && e.newValue) {
            try { applySync(JSON.parse(e.newValue)); } catch (_) {}
          }
        });
      }

      /** set ads + clamp index + broadcast */
      const commitAds = (ads: AdMedia[]) => {
        set((s) => ({ ads, currentAdIndex: clampIndex(s.currentAdIndex, ads, s.adsEnabled) }));
        broadcast({ ads });
      };

      return {
        mode: 'idle',
        paidAmount: 0,
        changeAmount: 0,
        shopName: DEFAULT_SHOP_NAME,
        ads: MOCK_ADS,
        currentAdIndex: 0,
        adsEnabled: true,
        successDurationSec: DEFAULT_SUCCESS_DURATION,
        thankYouMessage: DEFAULT_THANK_YOU,
        storageError: null,
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

        nextAd: () => set((s) => {
          const n = getPlayableAds(s.ads, s.adsEnabled).length;
          return { currentAdIndex: n === 0 ? 0 : (s.currentAdIndex + 1) % n };
        }),

        setAdIndex: (index) => set((s) => ({ currentAdIndex: clampIndex(index, s.ads, s.adsEnabled) })),

        addAd: (ad) => commitAds([...get().ads, ad]),

        addAdWithDefaults: (input) => {
          const ad = createAd(input);
          commitAds([...get().ads, ad]);
          return ad;
        },

        updateAd: (id, patch) => {
          const clean: Partial<Omit<AdMedia, 'id'>> = { ...patch };
          if (clean.duration !== undefined && !(Number.isFinite(clean.duration) && clean.duration > 0)) {
            delete clean.duration;
          }
          if (Object.keys(clean).length === 0) return;
          commitAds(get().ads.map((a) => (a.id === id ? { ...a, ...clean } : a)));
        },

        toggleAd: (id) => {
          commitAds(get().ads.map((a) => (a.id === id ? { ...a, enabled: a.enabled === false } : a)));
        },

        moveAd: (id, direction) => {
          const ads = get().ads;
          const from = ads.findIndex((a) => a.id === id);
          if (from < 0) return;
          const to = from + direction;
          if (to < 0 || to >= ads.length) return;
          commitAds(moveItem(ads, from, to));
        },

        moveAdTo: (from, to) => {
          const ads = get().ads;
          const next = moveItem(ads, from, to);
          if (next.every((a, i) => a === ads[i])) return;
          commitAds(next);
        },

        removeAd: (id) => {
          const target = get().ads.find((a) => a.id === id);
          commitAds(get().ads.filter((a) => a.id !== id));
          // ลบไฟล์ที่อัปโหลดออกจาก IndexedDB ด้วย (ลิงก์ปกติไม่ต้องทำอะไร)
          if (target && isMediaRef(target.uri)) void deleteAdMedia(target.uri).catch(() => {});
        },

        reorderAds: (ads) => commitAds(ads),

        setAdsEnabled: (adsEnabled) => {
          set((s) => ({ adsEnabled, currentAdIndex: clampIndex(s.currentAdIndex, s.ads, adsEnabled) }));
          broadcast({ adsEnabled });
        },

        setSuccessDuration: (sec) => {
          if (!Number.isFinite(sec) || sec <= 0) return;
          const successDurationSec = Math.min(Math.round(sec), MAX_SUCCESS_DURATION) || 1;
          set({ successDurationSec });
          broadcast({ successDurationSec });
        },

        setThankYouMessage: (text) => {
          const thankYouMessage = text.trim() || DEFAULT_THANK_YOU;
          set({ thankYouMessage });
          broadcast({ thankYouMessage });
        },

        clearStorageError: () => set({ storageError: null }),

        broadcastDisplay: (payload) => {
          // อัปเดต local state ด้วย
          const patch: Partial<CustomerDisplayStoreState> = {};
          if (payload.mode          !== undefined) patch.mode          = payload.mode;
          if (payload.displayItems  !== undefined) patch.syncedItems   = payload.displayItems;
          if (payload.discountOverride !== undefined) patch.syncedDiscount = payload.discountOverride;
          if (payload.grandOverride !== undefined) patch.syncedGrand   = payload.grandOverride;
          if (payload.shopName      !== undefined) patch.shopName      = payload.shopName;
          if (payload.memberInfo    !== undefined) patch.memberInfo    = payload.memberInfo;
          if (payload.syncedGrand   !== undefined) patch.syncedGrand   = payload.syncedGrand;
          if (payload.payMethodLabel !== undefined) patch.payMethodLabel = payload.payMethodLabel;
          set(patch);
          broadcast(payload);
        },
      };
    },
    {
      name: PERSIST_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // เก็บเฉพาะการตั้งค่า — ไม่เก็บสถานะการขายสด
      partialize: (s): PersistedCustomerDisplay => ({
        ads: s.ads,
        shopName: s.shopName,
        adsEnabled: s.adsEnabled,
        successDurationSec: s.successDurationSec,
        thankYouMessage: s.thankYouMessage,
      }),
      migrate: (persisted, version) => migrateCustomerDisplay(persisted, version, MOCK_ADS),
      merge: (persisted, current) => {
        if (persisted === undefined || persisted === null) return current;
        const clean = migrateCustomerDisplay(persisted, 1, current.ads);
        return { ...current, ...clean, currentAdIndex: clampIndex(current.currentAdIndex, clean.ads, clean.adsEnabled) };
      },
    },
  ),
);
