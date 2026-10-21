/**
 * receiptLayout — ตัวช่วยกลางสำหรับจัดลำดับ/กรองบล็อกของบิล
 *
 * ใช้ร่วมกันทั้ง Preview (Section 4) และ Print HTML (openPrintPopup / Section 5 capture)
 * เพื่อให้ "ลำดับ + การมองเห็น + การจัดตำแหน่ง" ตรงกันเสมอ ไม่มีทางหลุดจากกัน
 *
 * ไฟล์นี้ไม่พึ่ง React/DOM จึง unit-test ได้ตรง ๆ
 */
import {
  ReceiptConfig,
  ReceiptBlock,
  ReceiptBlockAlign,
  mergeLayout,
} from '../store/receiptStore';

/** คืนบล็อกตามลำดับใน config.layout โดยตัดบล็อกที่ visible === false ออก */
export function getOrderedBlocks(config: ReceiptConfig): ReceiptBlock[] {
  const layout = Array.isArray(config.layout) ? config.layout : mergeLayout(config.layout);
  return layout.filter(b => b.visible !== false);
}

/** ข้อมูลตัวอย่างสำหรับ render บิล (items/ยอดเงิน) — ส่วนข้อมูลร้านอ่านจาก config */
export interface ReceiptSampleData {
  billNo: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  received: number;
  change: number;
}

const BLOCKS_WITH_DASH_BEFORE = new Set<ReceiptBlock['id']>([
  'billInfo',
  'items',
  'totals',
  'footerText',
]);

function esc(v: string): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n: number): string {
  return `฿${n.toFixed(2)}`;
}

/** สร้าง HTML ของบล็อกเดียว (คืน '' ถ้าบล็อกนั้นไม่มีเนื้อหาที่จะแสดง) */
function blockHtml(
  id: ReceiptBlock['id'],
  align: ReceiptBlockAlign,
  config: ReceiptConfig,
  data: ReceiptSampleData,
  logoHtml: string,
): string {
  const a = `text-align:${align};`;
  switch (id) {
    case 'logo':
      return logoHtml; // logoHtml จัดกลางด้วย margin อยู่แล้ว
    case 'shopName':
      return config.shopName ? `<p class="bold" style="${a}">${esc(config.shopName)}</p>` : '';
    case 'shopAddr':
      return config.shopAddr ? `<p style="${a}font-size:11px">${esc(config.shopAddr)}</p>` : '';
    case 'shopTel':
      return config.shopTel ? `<p style="${a}font-size:11px">โทร: ${esc(config.shopTel)}</p>` : '';
    case 'taxId':
      return config.shopTaxId ? `<p style="${a}font-size:11px">เลขผู้เสียภาษี: ${esc(config.shopTaxId)}</p>` : '';
    case 'headerText':
      return config.headerText ? `<p class="italic" style="${a}font-size:11px">${esc(config.headerText)}</p>` : '';
    case 'billInfo':
      return (
        `<div class="row" style="${a}"><span>ใบเสร็จรับเงิน</span><span>#${esc(data.billNo)}</span></div>` +
        `<div class="row" style="${a}font-size:11px"><span>วันที่: ${esc(data.date)}</span></div>`
      );
    case 'items':
      return data.items
        .map(it => `<div class="row" style="${a}"><span>${esc(it.name)} x${it.qty}</span><span>${money(it.price)}</span></div>`)
        .join('');
    case 'totals':
      return `<div class="row bold" style="${a}"><span>รวมทั้งสิ้น</span><span>${money(data.total)}</span></div>`;
    case 'payment':
      return (
        `<div class="row" style="${a}font-size:11px"><span>รับเงิน</span><span>${money(data.received)}</span></div>` +
        `<div class="row" style="${a}font-size:11px"><span>เงินทอน</span><span>${money(data.change)}</span></div>`
      );
    case 'footerText':
      return config.footerText ? `<p style="${a}font-size:12px">${esc(config.footerText)}</p>` : '';
    case 'branchInfo': {
      const parts = [config.shopBranch, config.posRegNo].filter(Boolean);
      return parts.length
        ? `<p style="${a}font-size:10px">สาขา: ${esc(config.shopBranch)} | เครื่อง: ${esc(config.posRegNo)}</p>`
        : '';
    }
    default:
      return '';
  }
}

/**
 * buildReceiptHtml — สร้าง HTML ป๊อปอัปพิมพ์บิลทั้งหน้า โดยไล่ตาม config.layout
 * เส้นประ (dash) ถูกแทรกก่อนกลุ่ม billInfo/items/totals/footerText เมื่อมีบล็อกก่อนหน้าแสดงอยู่
 */
export function buildReceiptHtml(config: ReceiptConfig, data: ReceiptSampleData): string {
  const W = '72mm';
  const logoHtml =
    config.showLogo && config.headerLogo
      ? `<img src="${config.headerLogo}" style="max-width:180px;max-height:72px;display:block;margin:0 auto 4px;" />`
      : '';

  const ordered = getOrderedBlocks(config);
  const parts: string[] = [];
  let renderedAny = false;

  for (const block of ordered) {
    const align: ReceiptBlockAlign = block.align ?? 'left';
    const html = blockHtml(block.id, align, config, data, logoHtml);
    if (!html) continue;
    if (renderedAny && BLOCKS_WITH_DASH_BEFORE.has(block.id)) {
      parts.push('<div class="dash"></div>');
    }
    parts.push(html);
    renderedAny = true;
  }

  return `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family:'TH SarabunPSK','Sarabun',monospace; font-size:13px; width:${W}; margin:0 auto; }
        .c { text-align:center; } .bold { font-weight:700; } .italic { font-style:italic; }
        .dash { border-top:1px dashed #000; margin:5px 0; }
        .row { display:flex; justify-content:space-between; }
        @media print { body { width:${W}; } }
      </style></head><body>
      ${parts.join('\n      ')}
    </body></html>`;
}
