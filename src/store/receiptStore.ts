/**
 * receiptStore — เก็บ config บิล (header logo, ข้อความ, paper size, การจัดวางบล็อก ฯลฯ)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';

/** รหัสบล็อกของบิล (ลำดับการแสดงผลควบคุมผ่าน layout) */
export type ReceiptBlockId =
  | 'logo'
  | 'shopName'
  | 'shopAddr'
  | 'shopTel'
  | 'taxId'
  | 'headerText'
  | 'billInfo'
  | 'items'
  | 'totals'
  | 'payment'
  | 'footerText'
  | 'branchInfo';

export type ReceiptBlockAlign = 'left' | 'center' | 'right';

export interface ReceiptBlock {
  id: ReceiptBlockId;
  visible: boolean;
  align?: ReceiptBlockAlign;
}

export interface ReceiptConfig {
  shopName:    string;
  shopAddr:    string;
  shopTel:     string;
  shopTaxId:   string;
  shopBranch:  string;
  posRegNo:    string;
  paperSize:   '58mm' | '80mm' | 'A4';
  headerLogo:  string;   // base64 / blob URI ของรูปหัวบิล
  headerText:  string;   // ข้อความเพิ่มเติมบนหัวบิล (เช่น สโลแกน)
  footerText:  string;   // ข้อความท้ายบิล
  showLogo:    boolean;
  copies:      number;
  /** เปิด/ปิดการออกใบกำกับภาษี (ค่าเริ่มต้น: เปิด) */
  taxInvoiceEnabled?: boolean;
  /** ลำดับ/การมองเห็น/การจัดวางของบล็อกบนบิล */
  layout:      ReceiptBlock[];
}

/** เลย์เอาต์เริ่มต้น — ลำดับเดิมของบิล, แสดงทุกบล็อก (backward compatible) */
export const DEFAULT_LAYOUT: ReceiptBlock[] = [
  { id: 'logo',       visible: true, align: 'center' },
  { id: 'shopName',   visible: true, align: 'center' },
  { id: 'shopAddr',   visible: true, align: 'center' },
  { id: 'shopTel',    visible: true, align: 'center' },
  { id: 'taxId',      visible: true, align: 'center' },
  { id: 'headerText', visible: true, align: 'center' },
  { id: 'billInfo',   visible: true, align: 'left'   },
  { id: 'items',      visible: true, align: 'left'   },
  { id: 'totals',     visible: true, align: 'left'   },
  { id: 'payment',    visible: true, align: 'left'   },
  { id: 'footerText', visible: true, align: 'center' },
  { id: 'branchInfo', visible: true, align: 'center' },
];

/**
 * mergeLayout — รวมเลย์เอาต์ที่ persist ไว้เข้ากับ DEFAULT_LAYOUT ให้ครบและถูกต้องเสมอ
 * - เริ่มจากลำดับของ saved (เฉพาะ id ที่รู้จัก) โดยเก็บ visible/align ของ saved ไว้
 * - ตัด id ที่ไม่รู้จักทิ้ง
 * - เติม id จาก DEFAULT ที่ saved ไม่มี (ต่อท้ายตามลำดับ DEFAULT)
 * ทำให้ config เดิมที่ persist ไว้ก่อนมี layout ได้ DEFAULT_LAYOUT อัตโนมัติ
 */
export function mergeLayout(saved?: ReceiptBlock[] | null): ReceiptBlock[] {
  const defaultById = new Map(DEFAULT_LAYOUT.map(b => [b.id, b]));
  const result: ReceiptBlock[] = [];
  const seen = new Set<ReceiptBlockId>();

  if (Array.isArray(saved)) {
    for (const block of saved) {
      if (!block || !defaultById.has(block.id) || seen.has(block.id)) continue;
      const def = defaultById.get(block.id)!;
      result.push({
        id: block.id,
        visible: typeof block.visible === 'boolean' ? block.visible : def.visible,
        align: block.align ?? def.align,
      });
      seen.add(block.id);
    }
  }

  for (const def of DEFAULT_LAYOUT) {
    if (!seen.has(def.id)) {
      result.push({ ...def });
      seen.add(def.id);
    }
  }

  return result;
}

interface ReceiptStoreState {
  config: ReceiptConfig;
  setConfig: (c: Partial<ReceiptConfig>) => void;
  setLayout: (layout: ReceiptBlock[]) => void;
  reorderLayout: (fromIndex: number, toIndex: number) => void;
  toggleBlock: (id: ReceiptBlockId) => void;
  setBlockAlign: (id: ReceiptBlockId, align: ReceiptBlockAlign) => void;
}

const DEFAULT: ReceiptConfig = {
  shopName:   'ร้านสะดวกซื้อ ABC',
  shopAddr:   '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  shopTel:    '02-123-4567',
  shopTaxId:  '0105560123456',
  shopBranch: 'สำนักงานใหญ่',
  posRegNo:   'POS-001',
  paperSize:  '80mm',
  headerLogo: '',
  headerText: '',
  footerText: 'ขอบคุณที่ใช้บริการ 🙏',
  showLogo:   true,
  copies:     1,
  taxInvoiceEnabled: true,
  layout:     DEFAULT_LAYOUT.map(b => ({ ...b })),
};

export const useReceiptStore = create<ReceiptStoreState>()(
  persist(
    (set) => ({
      config: DEFAULT,
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
      setLayout: (layout) =>
        set((s) => ({ config: { ...s.config, layout: mergeLayout(layout) } })),
      reorderLayout: (fromIndex, toIndex) =>
        set((s) => {
          const layout = s.config.layout.slice();
          if (
            fromIndex < 0 || fromIndex >= layout.length ||
            toIndex < 0 || toIndex >= layout.length ||
            fromIndex === toIndex
          ) {
            return s;
          }
          const [moved] = layout.splice(fromIndex, 1);
          layout.splice(toIndex, 0, moved);
          return { config: { ...s.config, layout } };
        }),
      toggleBlock: (id) =>
        set((s) => ({
          config: {
            ...s.config,
            layout: s.config.layout.map(b =>
              b.id === id ? { ...b, visible: !b.visible } : b
            ),
          },
        })),
      setBlockAlign: (id, align) =>
        set((s) => ({
          config: {
            ...s.config,
            layout: s.config.layout.map(b =>
              b.id === id ? { ...b, align } : b
            ),
          },
        })),
    }),
    {
      name: 'pos-receipt',
      version: 1,
      storage: createJSONStorage(() => persistStorage),
      // รวม state ที่ persist เข้ากับ default แล้วการันตีว่า layout ครบเสมอ
      merge: (persisted, current) => {
        const saved = (persisted as Partial<ReceiptStoreState> | undefined)?.config;
        return {
          ...current,
          config: {
            ...current.config,
            ...(saved ?? {}),
            layout: mergeLayout(saved?.layout),
          },
        };
      },
    }
  )
);
