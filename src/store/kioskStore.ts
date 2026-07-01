/**
 * Kiosk Store — Zustand
 * จัดการ Kiosk Mode สำหรับ M03 POS Sale
 *
 * Kiosk Mode คือ:
 * - Fullscreen ไม่มี tab bar / header
 * - ล็อก navigation ออกไม่ได้ (ต้องกด PIN)
 * - แสดง Customer Display อัตโนมัติ
 * - Auto-reset หลัง idle timeout
 * - รองรับ Web Fullscreen API (macOS/Windows)
 */
import { create } from 'zustand';
import { requestFullscreen, exitFullscreen, IS_WEB } from '../utils/platform';

export type KioskLayout = 'compact' | 'split' | 'fullgrid';
// compact   = หน้าจอเล็ก (mobile) — สลับ grid / scan
// split     = tablet landscape — grid ซ้าย + scan ขวา
// fullgrid  = widescreen — grid ใหญ่เต็มจอ

interface KioskState {
  isKioskMode:    boolean;
  layout:         KioskLayout;
  exitPin:        string;         // PIN สำหรับออกจาก Kiosk
  idleTimeout:    number;         // วินาที ก่อน auto-reset (0 = ปิด)
  showCustomerDisplay: boolean;
  isLocked:       boolean;        // ล็อกหน้าจอ (ต้องกด PIN)
  isFullscreen:   boolean;
  lastActivity:   Date;

  // Actions
  enterKioskMode:  (pin?: string) => Promise<void>;
  exitKioskMode:   (pin: string)  => boolean;   // return true ถ้า PIN ถูก
  setLayout:       (layout: KioskLayout) => void;
  setIdleTimeout:  (seconds: number) => void;
  toggleCustomerDisplay: () => void;
  lockScreen:      () => void;
  unlockScreen:    (pin: string) => boolean;
  recordActivity:  () => void;
  toggleFullscreen:() => Promise<void>;
  setExitPin:      (pin: string) => void;
}

export const useKioskStore = create<KioskState>((set, get) => ({
  isKioskMode:         false,
  layout:              'compact',
  exitPin:             '1234',
  idleTimeout:         300,     // 5 นาที
  showCustomerDisplay: false,
  isLocked:            false,
  isFullscreen:        false,
  lastActivity:        new Date(),

  enterKioskMode: async (pin) => {
    if (pin) set({ exitPin: pin });
    set({ isKioskMode: true, isLocked: false, lastActivity: new Date() });
    if (IS_WEB) {
      await requestFullscreen().catch(() => {});
      set({ isFullscreen: true });
    }
  },

  exitKioskMode: (pin) => {
    const { exitPin } = get();
    if (pin !== exitPin) return false;
    set({ isKioskMode: false, isLocked: false, isFullscreen: false });
    if (IS_WEB) exitFullscreen().catch(() => {});
    return true;
  },

  setLayout:      (layout)  => set({ layout }),
  setIdleTimeout: (seconds) => set({ idleTimeout: seconds }),
  toggleCustomerDisplay: () => set(s => ({ showCustomerDisplay: !s.showCustomerDisplay })),

  lockScreen: () => set({ isLocked: true }),

  unlockScreen: (pin) => {
    if (pin !== get().exitPin) return false;
    set({ isLocked: false, lastActivity: new Date() });
    return true;
  },

  recordActivity: () => set({ lastActivity: new Date(), isLocked: false }),

  toggleFullscreen: async () => {
    const { isFullscreen } = get();
    if (IS_WEB) {
      if (isFullscreen) {
        await exitFullscreen().catch(() => {});
        set({ isFullscreen: false });
      } else {
        await requestFullscreen().catch(() => {});
        set({ isFullscreen: true });
      }
    }
  },

  setExitPin: (pin) => set({ exitPin: pin }),
}));
