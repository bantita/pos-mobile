/**
 * posReceiptData — สร้าง ReceiptRenderData จากบิล POS จริง (ย้ายมาจาก printReceipt80mm ใน WebPOSScreen)
 * ข้อความบนเอกสารตาม "ภาษาใบเสร็จ" (cfg.receiptLanguage) — ไม่ขึ้นกับภาษา UI
 * ไม่ import react-native / หน้าจอ; ใช้ type ReceiptConfig จาก receiptStore เท่านั้น
 */
import type { ReceiptConfig } from '../store/receiptStore';
import { translate } from '../i18n/translate';
import {
  ReceiptRenderData,
  ReceiptDocType,
  receiptDocTitle,
  receiptDateTime,
  receiptPayMethod,
  receiptCashier,
  receiptFooter,
  receiptBranch,
} from './receiptTemplate';

/** บิลที่ส่งเข้าเครื่องพิมพ์ POS (ตรงกับ Invoice ของ WebPOSScreen) */
export interface PosPrintInvoice {
  billNo: string; date: string; time: string; cashier: string; payMethod: string;
  items: { name: string; qty: number; unitPrice: number; disc: number; total: number }[];
  subtotal: number; discount: number; vat: number; grand: number;
  status: string; cancelReason?: string;
  buyerInfo?: { name: string; addr: string; taxId: string; branch: string };
  memberInfo?: { name: string; memberNo: string; pointBalance: number; walletBalance: number; pointsEarned?: number };
  /** เวลาออกเอกสาร (epoch ms) — มีค่า → วันเวลาจัดรูปตามภาษาใบเสร็จ */
  issuedAt?: number;
  /** วิธีชำระแบบ id — มีค่า → ป้ายแปลตามภาษาใบเสร็จ (ไม่มี → ใช้ payMethod เดิม) */
  payMethods?: { id: string; label?: string }[];
}

/** ค่าข้อมูลร้านสำรองเมื่อ config ว่าง (ค่าคงที่ SHOP_* ของหน้าจอ) */
export interface ShopFallbacks {
  shopName: string;
  shopAddr: string;
  shopTel: string;
  shopTaxId: string;
  shopBranch: string;
  posRegNo: string;
}

export function buildPosReceiptData(
  invoice: PosPrintInvoice,
  billType: ReceiptDocType,
  cfg: ReceiptConfig,
  fallbacks: ShopFallbacks,
): ReceiptRenderData {
  const rl = cfg.receiptLanguage ?? 'th';

  // ── ยอดเงินคำนวณในชั้น caller (renderer ไม่คำนวณเอง) ─────────────────────────
  const preVatAmount = invoice.grand / 1.07;
  const vat          = invoice.grand - preVatAmount;

  return {
    shopName:   cfg.shopName  || fallbacks.shopName,
    shopAddr:   cfg.shopAddr  || fallbacks.shopAddr,
    shopTel:    cfg.shopTel   || fallbacks.shopTel,
    shopTaxId:  cfg.shopTaxId || fallbacks.shopTaxId,
    shopBranch: receiptBranch(cfg.shopBranch || fallbacks.shopBranch, rl),
    posRegNo:   cfg.posRegNo  || fallbacks.posRegNo,
    footerText: receiptFooter(cfg.footerText ?? '', rl),
    headerText: cfg.headerText || '',
    logoUri:    cfg.headerLogo || '',
    showLogo:   cfg.showLogo ?? true,
    docTitle:   receiptDocTitle(billType, rl),
    billNo:     invoice.billNo,
    dateTime:   invoice.issuedAt != null
      ? receiptDateTime(invoice.issuedAt, rl)
      : translate(rl, 'receipt.dateTimeValue', { date: invoice.date, time: invoice.time }),
    cashier:    receiptCashier(invoice.cashier, rl),
    payMethod:  invoice.payMethods ? receiptPayMethod(invoice.payMethods, rl) : invoice.payMethod,
    cancelReason: invoice.cancelReason || '',
    buyerName:   invoice.buyerInfo?.name   || '',
    buyerAddr:   invoice.buyerInfo?.addr   || '',
    buyerTaxId:  invoice.buyerInfo?.taxId  || '',
    buyerBranch: invoice.buyerInfo?.branch || '',
    items: invoice.items.map(i => ({
      name: i.name, qty: i.qty, unitPrice: i.unitPrice, disc: i.disc, lineTotal: i.total,
    })),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    preVatAmount,
    vat,
    total: invoice.grand,
  };
}
