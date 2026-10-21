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

// ─── Template model (visual receipt designer) ─────────────────────────────────

/** รหัสขนาดกระดาษ */
export type PaperPresetId = '58mm' | '80mm' | 'A4' | 'A5' | 'custom';

/** ขนาดกระดาษเป็น "มิลลิเมตร" — ความกว้างคงที่, ความสูงอาจเป็น auto (ม้วนความร้อน) */
export interface PaperSpec {
  preset: PaperPresetId;
  widthMm: number;              // 58 | 80 | 210 | 148 | custom
  heightMm: number | null;      // null = auto (thermal roll); A4/A5/custom = fixed
  marginMm: number;             // ขอบกระดาษ (default 4 สำหรับ thermal)
}

export type ReceiptElementType = 'text' | 'field' | 'line' | 'box' | 'image' | 'qr';

/**
 * ฟิลด์ที่ผูกข้อมูลได้ — ค่าเหล่านี้มาจาก ReceiptConfig + ข้อมูลบิลจริง (ReceiptRenderData)
 * ไม่มี received/change (POS ไม่มีข้อมูลเงินรับ/เงินทอน)
 */
export type ReceiptFieldKey =
  // ข้อมูลร้าน (จาก ReceiptConfig)
  | 'shopName' | 'shopAddr' | 'shopTel' | 'shopTaxId' | 'shopBranch' | 'posRegNo'
  | 'headerText' | 'footerText'
  // ข้อมูลเอกสาร/บิล (จากบิลจริง)
  | 'docTitle'
  | 'billNo' | 'dateTime' | 'cashier' | 'payMethod'
  | 'items'
  // ข้อมูลผู้ซื้อ (ใบกำกับภาษีเต็มรูป — ว่างเมื่อไม่มี)
  | 'buyerName' | 'buyerAddr' | 'buyerTaxId' | 'buyerBranch'
  // ยอดเงิน (คำนวณมาแล้วจากชั้น POS)
  | 'subtotal' | 'discount' | 'preVatAmount' | 'vat' | 'total'
  // ข้อความ/สถานะ
  | 'cancelReason'
  // สื่อ
  | 'logo' | 'qr';

export type ElementAlign = 'left' | 'center' | 'right';

export interface ReceiptElementStyle {
  fontSize: number;             // px @96dpi ที่ zoom=1
  bold: boolean;
  italic?: boolean;
  align: ElementAlign;
  border: boolean;              // กรอบรอบ element (text/box/field)
  borderWidthMm: number;        // ใช้เมื่อ border=true หรือ type line/box
  color?: string;               // default token; UI เลือกจาก token เท่านั้น
}

export interface ReceiptElement {
  id: string;                   // สร้างด้วย genId()
  type: ReceiptElementType;
  xMm: number;                  // ตำแหน่งซ้าย (มม.) เทียบขอบในของกระดาษ
  yMm: number;                  // ตำแหน่งบน (มม.)
  wMm: number;                  // ความกว้าง (มม.)
  hMm: number;                  // ความสูง (มม.)
  z: number;                    // ลำดับชั้น (วาดจากน้อยไปมาก)
  style: ReceiptElementStyle;
  text?: string;                // type 'text': ข้อความอิสระ (ว่าง = กล่องกรอบเปล่า)
  field?: ReceiptFieldKey;      // type 'field'/'image'/'qr': คีย์ที่ผูก
}

export interface ReceiptTemplate {
  version: 1;                   // schema version ของตัว template เอง
  paper: PaperSpec;
  elements: ReceiptElement[];
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
  /** รูปแบบบิลแบบ canvas (มิลลิเมตร) — authoritative เมื่อมีค่า */
  template?:   ReceiptTemplate;
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

// ─── Template defaults ────────────────────────────────────────────────────────

/** marginMm default 4 สำหรับ thermal เพื่อให้ content ≈ 72mm บนกระดาษ 80mm */
export const DEFAULT_PAPER: PaperSpec = { preset: '80mm', widthMm: 80, heightMm: null, marginMm: 4 };

export const PAPER_PRESETS: Record<Exclude<PaperPresetId, 'custom'>, PaperSpec> = {
  '58mm': { preset: '58mm', widthMm: 58,  heightMm: null, marginMm: 4 },
  '80mm': { preset: '80mm', widthMm: 80,  heightMm: null, marginMm: 4 },
  'A4':   { preset: 'A4',   widthMm: 210, heightMm: 297,  marginMm: 10 },
  'A5':   { preset: 'A5',   widthMm: 148, heightMm: 210,  marginMm: 8 },
};

/** สร้าง id ไม่ซ้ำแบบ self-rolled (ไม่มี nanoid ใน deps) */
export function genId(): string {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** ความสูงแถว (มม.) ต่อแต่ละชนิดบล็อกตอน migrate */
function blockRowHeight(id: ReceiptBlockId): number {
  if (id === 'logo') return 22;
  if (id === 'items') return 30;
  if (id === 'totals') return 8;
  return 6; // single-line text
}

/** map ReceiptBlockId -> {type, field} ของ element (payment -> null = ไม่ emit) */
function blockToElement(id: ReceiptBlockId): { type: ReceiptElementType; field: ReceiptFieldKey } | null {
  switch (id) {
    case 'logo':       return { type: 'image', field: 'logo' };
    case 'shopName':   return { type: 'field', field: 'shopName' };
    case 'shopAddr':   return { type: 'field', field: 'shopAddr' };
    case 'shopTel':    return { type: 'field', field: 'shopTel' };
    case 'taxId':      return { type: 'field', field: 'shopTaxId' };
    case 'headerText': return { type: 'field', field: 'headerText' };
    case 'items':      return { type: 'field', field: 'items' };
    case 'totals':     return { type: 'field', field: 'total' };
    case 'footerText': return { type: 'field', field: 'footerText' };
    case 'branchInfo': return { type: 'field', field: 'shopBranch' };
    case 'payment':    return null; // DROPPED — POS ไม่มีข้อมูล received/change
    // billInfo handled specially (two elements)
    default:           return null;
  }
}

function baseStyle(align: ElementAlign, overrides?: Partial<ReceiptElementStyle>): ReceiptElementStyle {
  return {
    fontSize: 11,
    bold: false,
    align,
    border: false,
    borderWidthMm: 0.3,
    ...overrides,
  };
}

interface ReceiptStoreState {
  config: ReceiptConfig;
  setConfig: (c: Partial<ReceiptConfig>) => void;
  setTemplate: (t: ReceiptTemplate) => void;
  setPaper: (p: PaperSpec) => void;
  addElement: (el: Omit<ReceiptElement, 'id' | 'z'>) => string;
  updateElement: (id: string, patch: Partial<ReceiptElement>) => void;
  moveElement: (id: string, xMm: number, yMm: number) => void;
  resizeElement: (id: string, wMm: number, hMm: number) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => string;
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

/** seed paper จาก config.paperSize */
function paperFromConfig(paperSize: unknown): PaperSpec {
  if (paperSize === '58mm' || paperSize === '80mm' || paperSize === 'A4') {
    return { ...PAPER_PRESETS[paperSize] };
  }
  return { ...DEFAULT_PAPER };
}

/**
 * migrateLayoutToTemplate — แปลง block-list เดิมเป็น canvas template (pure)
 * - เก็บเฉพาะบล็อก visible !== false ตามลำดับ saved
 * - วางซ้อนกันจากบนลงล่าง (y เริ่มที่ marginMm, เพิ่มทีละ rowH)
 * - map แต่ละ ReceiptBlockId เป็น element (payment -> ไม่ emit)
 * - carry block.align -> style.align
 * - garbage/undefined -> DEFAULT_TEMPLATE
 */
export function migrateLayoutToTemplate(saved?: Partial<ReceiptConfig> | null): ReceiptTemplate {
  if (!saved || typeof saved !== 'object') return DEFAULT_TEMPLATE;

  const paper = paperFromConfig(saved.paperSize);
  const blocks = mergeLayout(saved.layout).filter(b => b.visible !== false);
  const contentW = paper.widthMm - 2 * paper.marginMm;

  const elements: ReceiptElement[] = [];
  let y = paper.marginMm;
  let z = 1;

  const pushElement = (
    type: ReceiptElementType,
    field: ReceiptFieldKey,
    align: ElementAlign,
    hMm: number,
    styleOverrides?: Partial<ReceiptElementStyle>,
  ) => {
    elements.push({
      id: genId(),
      type,
      xMm: paper.marginMm,
      yMm: y,
      wMm: contentW,
      hMm,
      z: z++,
      style: baseStyle(align, styleOverrides),
      field,
    });
    y += hMm;
  };

  for (const block of blocks) {
    const align: ElementAlign = (block.align ?? 'left') as ElementAlign;
    if (block.id === 'billInfo') {
      // สองฟิลด์ซ้อนกัน: billNo, dateTime
      pushElement('field', 'billNo', align, 6);
      pushElement('field', 'dateTime', align, 6);
      continue;
    }
    const mapped = blockToElement(block.id);
    if (!mapped) continue; // payment -> dropped
    const rowH = blockRowHeight(block.id);
    const overrides: Partial<ReceiptElementStyle> | undefined =
      block.id === 'shopName'   ? { fontSize: 14, bold: true }
      : block.id === 'headerText' ? { italic: true }
      : block.id === 'totals'     ? { bold: true }
      : block.id === 'branchInfo' ? { fontSize: 10 }
      : undefined;
    pushElement(mapped.type, mapped.field, align, rowH, overrides);
  }

  return { version: 1, paper, elements };
}

/** รูปแบบบิลเริ่มต้น — ใช้ตรรกะ migration เดียวกับ install ที่ migrate มา */
export const DEFAULT_TEMPLATE: ReceiptTemplate = migrateLayoutToTemplate(DEFAULT);

/** template มาจาก migration หรือไม่ (idempotency key) */
function isWellFormedTemplate(t: unknown): t is ReceiptTemplate {
  return (
    !!t &&
    typeof t === 'object' &&
    (t as ReceiptTemplate).version === 1 &&
    Array.isArray((t as ReceiptTemplate).elements)
  );
}

export const useReceiptStore = create<ReceiptStoreState>()(
  persist(
    (set, get) => {
      // อ่าน template ปัจจุบัน (coerce -> DEFAULT_TEMPLATE ถ้ายังไม่มี)
      const currentTemplate = (): ReceiptTemplate =>
        get().config.template ?? DEFAULT_TEMPLATE;

      const nextZ = (els: ReceiptElement[]): number =>
        els.reduce((m, e) => Math.max(m, e.z), 0) + 1;

      const setTemplate = (template: ReceiptTemplate) =>
        set((s) => ({ config: { ...s.config, template } }));

      const writeElements = (els: ReceiptElement[]) =>
        set((s) => {
          const tpl = s.config.template ?? DEFAULT_TEMPLATE;
          return { config: { ...s.config, template: { ...tpl, elements: els } } };
        });

      return {
        config: DEFAULT,
        setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
        setTemplate,
        setPaper: (p) =>
          set((s) => {
            const tpl = s.config.template ?? DEFAULT_TEMPLATE;
            return { config: { ...s.config, template: { ...tpl, paper: p } } };
          }),
        addElement: (el) => {
          const tpl = currentTemplate();
          const id = genId();
          const element: ReceiptElement = {
            ...el,
            id,
            z: nextZ(tpl.elements),
            xMm: Math.max(0, el.xMm),
            yMm: Math.max(0, el.yMm),
            wMm: Math.max(2, el.wMm),
            hMm: Math.max(2, el.hMm),
          };
          writeElements([...tpl.elements, element]);
          return id;
        },
        updateElement: (id, patch) => {
          const tpl = currentTemplate();
          writeElements(
            tpl.elements.map(e => (e.id === id ? { ...e, ...patch, id: e.id } : e))
          );
        },
        moveElement: (id, xMm, yMm) => {
          const tpl = currentTemplate();
          writeElements(
            tpl.elements.map(e =>
              e.id === id ? { ...e, xMm: Math.max(0, xMm), yMm: Math.max(0, yMm) } : e
            )
          );
        },
        resizeElement: (id, wMm, hMm) => {
          const tpl = currentTemplate();
          writeElements(
            tpl.elements.map(e =>
              e.id === id ? { ...e, wMm: Math.max(2, wMm), hMm: Math.max(2, hMm) } : e
            )
          );
        },
        removeElement: (id) => {
          const tpl = currentTemplate();
          writeElements(tpl.elements.filter(e => e.id !== id));
        },
        duplicateElement: (id) => {
          const tpl = currentTemplate();
          const src = tpl.elements.find(e => e.id === id);
          if (!src) return '';
          const newId = genId();
          const copy: ReceiptElement = {
            ...src,
            id: newId,
            xMm: src.xMm + 2,
            yMm: src.yMm + 2,
            z: nextZ(tpl.elements),
            style: { ...src.style },
          };
          writeElements([...tpl.elements, copy]);
          return newId;
        },
      };
    },
    {
      name: 'pos-receipt',
      version: 2,
      storage: createJSONStorage(() => persistStorage),
      // migrate เฉพาะตอน version ที่เก็บไว้ต่ำกว่า persisted version
      migrate: (persisted, fromVersion) => {
        const blob = persisted as { config?: Partial<ReceiptConfig> } | undefined;
        if (fromVersion < 2 && blob?.config) {
          return {
            ...blob,
            config: {
              ...blob.config,
              template: migrateLayoutToTemplate(blob.config),
            },
          };
        }
        return persisted;
      },
      // รวม state ที่ persist เข้ากับ default; layout ครบเสมอ; template idempotent
      merge: (persisted, current) => {
        const saved = (persisted as Partial<ReceiptStoreState> | undefined)?.config;
        const mergedConfig: ReceiptConfig = {
          ...current.config,
          ...(saved ?? {}),
          layout: mergeLayout(saved?.layout),
        };
        // ตัดสินใจจาก template well-formedness เท่านั้น (idempotent)
        if (!isWellFormedTemplate(mergedConfig.template)) {
          mergedConfig.template = migrateLayoutToTemplate(mergedConfig);
        }
        return { ...current, config: mergedConfig };
      },
    }
  )
);
