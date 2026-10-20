/**
 * Rich Menu Store — Zustand + Persist (2G)
 * เมนู Rich Menu ของ LINE OA แบบ 6 ปุ่ม (จัดวาง 2 แถว × 3 คอลัมน์)
 * เก็บในแอป (mock) — การ "เผยแพร่" จริงต้องมี LINE OA + Messaging API
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';

/** ชนิด action ของปุ่ม Rich Menu (ตาม LINE Messaging API) */
export type RichMenuActionType = 'uri' | 'message' | 'liff';

/** ปุ่มหนึ่งช่องใน Rich Menu */
export interface RichMenuButton {
  /** ป้ายกำกับช่อง */
  label: string;
  /** ชนิด action */
  actionType: RichMenuActionType;
  /** ค่า: URL / ข้อความ / LIFF id ตามชนิด action */
  value: string;
}

/** จำนวนช่องมาตรฐานของ Rich Menu (2 แถว × 3 คอลัมน์) */
export const RICH_MENU_SLOTS = 6;

/** ค่าเริ่มต้น: Rich Menu 6 ปุ่ม */
const DEFAULT_BUTTONS: RichMenuButton[] = [
  { label: 'โปรโมชั่น', actionType: 'message', value: 'ดูโปรโมชั่น' },
  { label: 'สะสมแต้ม', actionType: 'message', value: 'เช็คแต้ม' },
  { label: 'คูปองของฉัน', actionType: 'liff', value: 'liff-coupons' },
  { label: 'สั่งออนไลน์', actionType: 'uri', value: 'https://example.com/order' },
  { label: 'สาขา', actionType: 'uri', value: 'https://example.com/branches' },
  { label: 'ติดต่อเรา', actionType: 'message', value: 'ติดต่อร้าน' },
];

interface RichMenuStore {
  /** ชื่อ Rich Menu */
  menuName: string;
  /** ปุ่มทั้ง 6 ช่อง */
  buttons: RichMenuButton[];
  /** เผยแพร่แล้วหรือยัง (mock) */
  isPublished: boolean;
  /** เวลาเผยแพร่ล่าสุด (ISO) */
  lastPublishedAt?: string;

  setMenuName: (name: string) => void;
  updateButton: (index: number, data: Partial<RichMenuButton>) => void;
  /** บันทึก/เผยแพร่ (mock — เก็บ local เท่านั้น) */
  publish: () => void;
  reset: () => void;
}

export const useRichMenuStore = create<RichMenuStore>()(
  persist(
    (set) => ({
      menuName: 'เมนูหลักร้านค้า',
      buttons: DEFAULT_BUTTONS,
      isPublished: false,
      lastPublishedAt: undefined,

      setMenuName: (name) => set({ menuName: name }),

      updateButton: (index, data) =>
        set((s) => ({
          buttons: s.buttons.map((b, i) => (i === index ? { ...b, ...data } : b)),
        })),

      publish: () =>
        set({ isPublished: true, lastPublishedAt: new Date().toISOString() }),

      reset: () =>
        set({ menuName: 'เมนูหลักร้านค้า', buttons: DEFAULT_BUTTONS, isPublished: false, lastPublishedAt: undefined }),
    }),
    { name: 'pos-rich-menu', storage: createJSONStorage(() => persistStorage) }
  )
);
