/**
 * receiptTemplate — ตัว render กลาง (shared renderer) ของรูปแบบบิลแบบ canvas
 *
 * ไฟล์นี้เป็น "แหล่งความจริงเดียว" (single source of truth) ที่ขับทั้ง
 *   1) live preview ในดีไซเนอร์ (ReceiptCanvas ฝั่ง React)
 *   2) HTML สำหรับพิมพ์บิลขาย/ใบกำกับภาษี (ฝั่ง print popup)
 * โดยทั้งสองฝั่งเรียก resolveField() + layoutElement() ตัวเดียวกัน จึงการันตี WYSIWYG parity
 *
 * ตัว renderer ไม่คำนวณยอดเงินใด ๆ — ยอดทั้งหมดถูกคำนวณสำเร็จแล้วจากชั้น POS
 * ไฟล์นี้ไม่พึ่ง React/DOM โดยตรง (buildTemplateHtml คืนเป็น string) จึง unit-test ได้ตรง ๆ
 */
import {
  ReceiptConfig,
  ReceiptElement,
  ReceiptTemplate,
  DEFAULT_TEMPLATE,
} from '../store/receiptStore';

/** CSS reference pixel ที่ 96dpi — พื้นฐานของหน่วย mm ใน @page/print ของ browser */
export const PX_PER_MM = 96 / 25.4; // ≈ 3.7795

// ─── Render data contract (ตรงกับ invoice จริงของ POS) ────────────────────────

export interface ReceiptRenderData {
  // ร้าน (จาก ReceiptConfig)
  shopName: string; shopAddr: string; shopTel: string; shopTaxId: string;
  shopBranch: string; posRegNo: string; footerText: string; headerText: string;
  logoUri: string; showLogo: boolean;
  // เอกสาร/บิล
  docTitle: string;                 // 'ใบเสร็จรับเงิน' | 'ใบกำกับภาษีอย่างย่อ' | 'ใบกำกับภาษี'
  billNo: string; dateTime: string; cashier: string; payMethod: string;
  cancelReason: string;             // '' = ไม่ยกเลิก
  // ผู้ซื้อ (ใบกำกับภาษีเต็มรูป; '' เมื่อไม่มี)
  buyerName: string; buyerAddr: string; buyerTaxId: string; buyerBranch: string;
  // รายการสินค้า — ตรงกับ invoice.items จริง (4 คอลัมน์ตัวเลข)
  items: { name: string; qty: number; unitPrice: number; disc: number; lineTotal: number }[];
  // ยอดเงิน — ส่งมาคำนวณสำเร็จแล้วจากชั้น POS (renderer ไม่คำนวณ)
  subtotal: number; discount: number; preVatAmount: number; vat: number; total: number;
  qrPayload?: string;               // ถ้าว่าง element qr แสดงกรอบว่าง
}

// ─── Resolved field union (ตัวเดียวที่ทั้ง preview และ print ใช้ร่วม) ────────────

export type ResolvedField =
  | { kind: 'text';  value: string | null }                     // text, field (ข้อความ/ตัวเลข); null/'' = ว่าง
  | { kind: 'items'; rows: ReceiptRenderData['items'] }         // บล็อกรายการสินค้า
  | { kind: 'image'; uri: string | null; show: boolean }        // logo
  | { kind: 'qr';    payload: string | null };                  // qr

/** จัดรูปจำนวนเงิน — ตัวเลขเสมอ (0.00 ก็แสดง) */
function money(n: number): string {
  const v = typeof n === 'number' && isFinite(n) ? n : 0;
  return `฿${v.toFixed(2)}`;
}

/**
 * resolveFieldValue — helper บาง ๆ สำหรับเคส text/field เท่านั้น (เรียกภายใน resolveField)
 * คืน null = ว่าง (ตาม "empty-when" §2.2.1); ไม่ใช้กับ items/logo/qr
 */
export function resolveFieldValue(el: ReceiptElement, d: ReceiptRenderData): string | null {
  // element ชนิด text: ใช้ข้อความอิสระ (ไม่สน field)
  if (el.type === 'text') {
    const t = el.text ?? '';
    return t === '' ? null : t;
  }

  const key = el.field;
  if (!key) return null;

  // ตัวเลขยอดเงิน — แสดงเสมอ (0.00 ก็แสดง) ผ่าน money()
  switch (key) {
    case 'subtotal':     return money(d.subtotal);
    case 'discount':     return money(d.discount);
    case 'preVatAmount': return money(d.preVatAmount);
    case 'vat':          return money(d.vat);
    case 'total':        return money(d.total);
  }

  // ข้อความ/ฟิลด์ตัวหนังสือ — '' => null (ว่าง)
  let raw = '';
  switch (key) {
    case 'shopName':     raw = d.shopName; break;
    case 'shopAddr':     raw = d.shopAddr; break;
    case 'shopTel':      raw = d.shopTel; break;
    case 'shopTaxId':    raw = d.shopTaxId; break;
    case 'shopBranch':   raw = d.shopBranch; break;
    case 'posRegNo':     raw = d.posRegNo; break;
    case 'headerText':   raw = d.headerText; break;
    case 'footerText':   raw = d.footerText; break;
    case 'docTitle':     raw = d.docTitle; break;
    case 'billNo':       raw = d.billNo; break;
    case 'dateTime':     raw = d.dateTime; break;
    case 'cashier':      raw = d.cashier; break;
    case 'payMethod':    raw = d.payMethod; break;
    case 'buyerName':    raw = d.buyerName; break;
    case 'buyerAddr':    raw = d.buyerAddr; break;
    case 'buyerTaxId':   raw = d.buyerTaxId; break;
    case 'buyerBranch':  raw = d.buyerBranch; break;
    case 'cancelReason': raw = d.cancelReason; break;
    default:             return null; // items/logo/qr ไม่ควรมาถึงที่นี่
  }
  return raw === '' ? null : raw;
}

/**
 * resolveField — resolver เดียวที่ใช้ร่วม เลือก kind ตาม element.type/field
 * ทั้ง buildTemplateHtml และ ReceiptCanvas switch(kind) ด้วยตรรกะ branch เดียวกัน
 */
export function resolveField(el: ReceiptElement, d: ReceiptRenderData): ResolvedField {
  // ชนิดสื่อ/ลิสต์ — ตัดสินจาก field ก่อน (element ชนิด image/qr/field+items)
  const key = el.field;

  if (key === 'items') {
    return { kind: 'items', rows: Array.isArray(d.items) ? d.items : [] };
  }
  if (key === 'logo') {
    const uri = d.logoUri ?? '';
    return { kind: 'image', uri: uri === '' ? null : uri, show: !!d.showLogo };
  }
  if (key === 'qr') {
    const payload = d.qrPayload ?? '';
    return { kind: 'qr', payload: payload === '' ? null : payload };
  }

  // ที่เหลือเป็น text/field ที่ให้ค่าเป็นสตริง
  return { kind: 'text', value: resolveFieldValue(el, d) };
}

// ─── Geometry (helper กลางที่ทั้งสองฝั่งอ้างตัวเดียว) ───────────────────────────

/** mm -> px (คูณ zoom) — ตัวช่วย geometry เดียวที่ preview และ print HTML ใช้ร่วม */
export function layoutElement(
  el: ReceiptElement,
  zoom: number,
): { leftPx: number; topPx: number; widthPx: number; heightPx: number } {
  const k = PX_PER_MM * zoom;
  return {
    leftPx: el.xMm * k,
    topPx: el.yMm * k,
    widthPx: el.wMm * k,
    heightPx: el.hMm * k,
  };
}

// ─── HTML renderer (print popup) ──────────────────────────────────────────────

function esc(v: string): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** สไตล์ข้อความร่วม (fontSize/bold/italic/align/color) */
function textStyleCss(el: ReceiptElement): string {
  const s = el.style;
  const parts = [
    `font-size:${s.fontSize}px`,
    `font-weight:${s.bold ? 700 : 400}`,
    `text-align:${s.align}`,
  ];
  if (s.italic) parts.push('font-style:italic');
  if (s.color) parts.push(`color:${s.color}`);
  return parts.join(';');
}

/** กรอบของ element (เมื่อ border=true หรือ type line/box) */
function borderCss(el: ReceiptElement): string {
  const s = el.style;
  const needsBorder = s.border || el.type === 'box' || el.type === 'line';
  if (!needsBorder) return '';
  const w = s.borderWidthMm > 0 ? s.borderWidthMm : 0.3;
  const color = s.color || '#000';
  const style = s.lineStyle || 'solid';
  // 'line' = เส้นคั่นแนวนอน → ใช้ border-top อย่างเดียว; อื่น ๆ = กรอบรอบ
  if (el.type === 'line') {
    return `border-top:${w}mm ${style} ${color};`;
  }
  return `border:${w}mm ${style} ${color};`;
}

/** HTML ของรายการสินค้า (5 คอลัมน์ ตรงกับ thermal เดิม) */
function itemsHtml(rows: ReceiptRenderData['items']): string {
  if (!rows || rows.length === 0) return '';
  const row = (r: ReceiptRenderData['items'][number]): string =>
    `<div style="display:flex;width:100%">` +
    `<span style="flex:1 1 auto;text-align:left">${esc(r.name)}</span>` +
    `<span style="flex:0 0 24px;text-align:center">${r.qty}</span>` +
    `<span style="flex:0 0 52px;text-align:right">${money(r.unitPrice)}</span>` +
    `<span style="flex:0 0 44px;text-align:right">${r.disc > 0 ? money(r.disc) : '-'}</span>` +
    `<span style="flex:0 0 56px;text-align:right;font-weight:700">${money(r.lineTotal)}</span>` +
    `</div>`;
  return rows.map(row).join('');
}

/** เนื้อหาภายใน element ตาม kind (ตรรกะ branch เดียวกับ preview §2.2) */
function elementInnerHtml(el: ReceiptElement, d: ReceiptRenderData): string {
  const resolved = resolveField(el, d);
  switch (resolved.kind) {
    case 'text':
      return resolved.value === null ? '' : esc(resolved.value);
    case 'items':
      return itemsHtml(resolved.rows);
    case 'image':
      return resolved.show && resolved.uri
        ? `<img src="${esc(resolved.uri)}" style="max-width:100%;max-height:100%;display:block;margin:0 auto" onerror="this.style.display='none'" />`
        : '';
    case 'qr':
      // QR ถูก render เป็น payload ข้อความใน print popup (ไม่มี JS runtime);
      // ฝั่ง preview ใช้ react-native-qrcode-svg — ทั้งคู่ผ่าน resolveField ตัวเดียวกัน
      return resolved.payload ? `<span data-qr="${esc(resolved.payload)}"></span>` : '';
    default:
      return '';
  }
}

/** HTML ของ element หนึ่ง — div absolute positioned หน่วย mm */
function elementHtml(el: ReceiptElement, d: ReceiptRenderData): string {
  const pos =
    `position:absolute;` +
    `left:${el.xMm}mm;top:${el.yMm}mm;` +
    `width:${el.wMm}mm;height:${el.hMm}mm;` +
    `overflow:hidden;box-sizing:border-box;`;
  const style = `${pos}${textStyleCss(el)};${borderCss(el)}`;
  return `<div style="${style}">${elementInnerHtml(el, d)}</div>`;
}

/**
 * buildTemplateHtml — สร้าง HTML พิมพ์บิลทั้งหน้า
 * - coerce tpl ?? DEFAULT_TEMPLATE ภายใน (กันเคสอ่านก่อน hydrate — ไม่ throw)
 * - iterate elements เรียงตาม z
 * - @page { size: widthMm x (heightMm|auto); margin:0 } — margin คุมด้วย marginMm ใน element inset
 */
export function buildTemplateHtml(
  tpl: ReceiptTemplate | undefined,
  d: ReceiptRenderData,
): string {
  const template = tpl ?? DEFAULT_TEMPLATE;
  const { paper } = template;
  const widthMm = paper.widthMm;
  const heightCss = paper.heightMm != null ? `${paper.heightMm}mm` : 'auto';
  const pageSize = `${widthMm}mm ${paper.heightMm != null ? `${paper.heightMm}mm` : 'auto'}`;

  const sorted = [...template.elements].sort((a, b) => a.z - b.z);
  const body = sorted.map(el => elementHtml(el, d)).join('\n      ');

  // ความสูง container: fixed เมื่อมี heightMm, มิฉะนั้น auto (thermal roll)
  const containerHeight = paper.heightMm != null ? `height:${heightCss};` : 'min-height:10mm;';

  return `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <style>
        @page { size: ${pageSize}; margin: 0 }
        * { box-sizing:border-box; }
        html,body { margin:0; padding:0; }
        body { font-family:'TH SarabunPSK','Sarabun',sans-serif; }
        .paper { position:relative; width:${widthMm}mm; ${containerHeight} margin:0 auto; }
      </style></head><body>
      <div class="paper">
      ${body}
      </div>
    </body></html>`;
}

// ─── Sample data (live preview ในดีไซเนอร์) ────────────────────────────────────

/** สร้างข้อมูลตัวอย่างจริงสำหรับ live preview (ชื่อร้านจาก config, items จำลอง 5 แถว) */
export function makeSampleData(config: ReceiptConfig): ReceiptRenderData {
  const items = [
    { name: 'น้ำดื่ม 600ml',   qty: 2, unitPrice: 10,  disc: 0,  lineTotal: 20 },
    { name: 'ขนมปัง',          qty: 1, unitPrice: 35,  disc: 5,  lineTotal: 30 },
    { name: 'กาแฟกระป๋อง',     qty: 3, unitPrice: 25,  disc: 0,  lineTotal: 75 },
    { name: 'บะหมี่กึ่งสำเร็จรูป', qty: 4, unitPrice: 6, disc: 0, lineTotal: 24 },
    { name: 'ไข่ไก่ (แผง)',     qty: 1, unitPrice: 120, disc: 10, lineTotal: 110 },
  ];
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const discount = items.reduce((s, it) => s + it.disc, 0);
  const total = items.reduce((s, it) => s + it.lineTotal, 0);
  const preVatAmount = total / 1.07;
  const vat = total - preVatAmount;

  return {
    shopName: config.shopName ?? '',
    shopAddr: config.shopAddr ?? '',
    shopTel: config.shopTel ?? '',
    shopTaxId: config.shopTaxId ?? '',
    shopBranch: config.shopBranch ?? '',
    posRegNo: config.posRegNo ?? '',
    footerText: config.footerText ?? '',
    headerText: config.headerText ?? '',
    logoUri: config.headerLogo ?? '',
    showLogo: !!config.showLogo,
    docTitle: 'ใบกำกับภาษีอย่างย่อ',
    billNo: '20240001',
    dateTime: '01/01/2567 10:30',
    cashier: 'พนักงาน A',
    payMethod: 'เงินสด',
    cancelReason: '',
    buyerName: '',
    buyerAddr: '',
    buyerTaxId: '',
    buyerBranch: '',
    items,
    subtotal,
    discount,
    preVatAmount,
    vat,
    total,
    qrPayload: 'https://example.com/receipt/20240001',
  };
}
