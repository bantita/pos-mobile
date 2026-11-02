/**
 * taxInvoiceHtml — HTML พิมพ์ใบกำกับภาษีเต็มรูป (ย้ายมาจาก buildHTML ใน TaxInvoiceScreen)
 * PURE: ไม่ import store / react-native — ข้อความเอกสารตาม lang (ภาษาใบเสร็จ)
 */
import { translate } from '../i18n/translate';
import { formatDate, formatMoney, formatTime, type DateInput } from '../i18n/format';
import type { Language, ReceiptKey, TParams } from '../i18n/types';

export interface TaxInvoiceHtmlArgs {
  invoiceNo: string;
  /** วันเวลาออกเอกสาร (เช่น sale.createdAt) */
  issuedAt: DateInput;
  seller: { name: string; address: string; taxId: string };
  /** ค่าว่าง → แสดง '-' */
  buyer: { name: string; taxId: string; address: string };
  items: { name: string; qty: number; unitPrice: number; amount: number }[];
  totals: { base: number; vat: number; grand: number };
  /** อัตรา VAT (%) — ค่าเริ่มต้น 7 */
  vatRate?: number;
}

function esc(v: string | number): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildTaxInvoiceHtml(args: TaxInvoiceHtmlArgs, lang: Language): string {
  const r = (key: ReceiptKey, params?: TParams) => translate(lang, key, params);
  const money = (n: number) => formatMoney(n, lang);
  const title = r('receipt.taxInvoice.title');
  // เหมือน receiptDateTime ใน receiptTemplate (ไม่ import เพื่อให้โมดูลนี้ pure)
  const dateTime = r('receipt.dateTimeValue', {
    date: formatDate(args.issuedAt, lang),
    time: formatTime(args.issuedAt, lang),
  });

  const rows = args.items
    .map((item) => `<tr>
        <td>${esc(item.name)}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${money(item.unitPrice)}</td>
        <td style="text-align:right">${money(item.amount)}</td>
      </tr>`)
    .join('');

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  * { font-family: 'Sarabun', -apple-system, sans-serif; }
  body { width: 560px; margin: 0 auto; padding: 24px; color: #111; }
  h2 { text-align: center; margin: 4px 0; font-size: 20px; }
  .sub { text-align: center; font-size: 13px; color: #555; }
  .block { margin: 10px 0; font-size: 13px; }
  .block b { display: inline-block; min-width: 120px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; }
  th { background: #f5f5f5; text-align: left; }
  .totals { width: 260px; margin-left: auto; margin-top: 12px; font-size: 13px; }
  .totals td { border: none; padding: 3px 0; }
  .total { font-weight: 800; font-size: 15px; }
  .line { border-top: 1px dashed #999; margin: 10px 0; }
</style></head><body>
  <h2>${esc(title)}</h2>
  <div class="sub">${esc(r('receipt.caption.billNo'))} ${esc(args.invoiceNo)} · ${esc(r('receipt.caption.date'))} ${esc(dateTime)}</div>
  <div class="line"></div>
  <div class="block"><b>${esc(r('receipt.taxInvoice.seller'))}</b> ${esc(args.seller.name)}</div>
  <div class="block"><b>${esc(r('receipt.taxInvoice.address'))}</b> ${esc(args.seller.address)}</div>
  <div class="block"><b>${esc(r('receipt.taxInvoice.taxId'))}</b> ${esc(args.seller.taxId)}</div>
  <div class="line"></div>
  <div class="block"><b>${esc(r('receipt.taxInvoice.buyer'))}</b> ${esc(args.buyer.name || '-')}</div>
  <div class="block"><b>${esc(r('receipt.taxInvoice.taxId'))}</b> ${esc(args.buyer.taxId || '-')}</div>
  <div class="block"><b>${esc(r('receipt.taxInvoice.address'))}</b> ${esc(args.buyer.address || '-')}</div>
  <table>
    <thead><tr><th>${esc(r('receipt.column.item'))}</th><th style="text-align:center">${esc(r('receipt.column.qty'))}</th><th style="text-align:right">${esc(r('receipt.column.unitPriceUnit'))}</th><th style="text-align:right">${esc(r('receipt.column.amount'))}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>${esc(r('receipt.taxInvoice.beforeVat'))}</td><td style="text-align:right">${money(args.totals.base)}</td></tr>
    <tr><td>${esc(r('receipt.vat', { rate: args.vatRate ?? 7 }))}</td><td style="text-align:right">${money(args.totals.vat)}</td></tr>
    <tr class="total"><td>${esc(r('receipt.taxInvoice.grandTotal'))}</td><td style="text-align:right">${money(args.totals.grand)}</td></tr>
  </table>
</body></html>`;
}
