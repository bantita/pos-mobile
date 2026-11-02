/**
 * labels — map ข้อมูล (id) → translation key แบบมี type + helper ป้ายวิธีชำระ
 * PURE: import เฉพาะ locales / translate / types
 */
import { th } from './locales/th';
import { translate } from './translate';
import type { Language, UiKey } from './types';
import type { OrderType } from '../types/sale';
import type { UserRole } from '../store/authStore';

export type KnownPayMethod = 'cash' | 'transfer' | 'qr' | 'credit' | 'wallet' | 'ewallet' | 'coupon';

export const PAY_METHOD_KEYS: Record<KnownPayMethod, UiKey> = {
  cash: 'payment.method.cash',
  transfer: 'payment.method.transfer',
  qr: 'payment.method.qr',
  credit: 'payment.method.credit',
  wallet: 'payment.method.wallet',
  ewallet: 'payment.method.ewallet',
  coupon: 'payment.method.coupon',
};

export const PAY_ICON: Record<string, string> = {
  cash: 'cash-outline',
  qr: 'qr-code-outline',
  transfer: 'phone-portrait-outline',
  credit: 'card-outline',
  wallet: 'wallet-outline',
  ewallet: 'wallet-outline',
};

export function isKnownPayMethod(id: string): id is KnownPayMethod {
  return Object.prototype.hasOwnProperty.call(PAY_METHOD_KEYS, id);
}

/** ป้ายวิธีชำระ: id ที่รู้จัก → แปลตาม lang; อื่น ๆ (pay_* ของผู้ใช้) → customLabel ?? id */
export function payMethodLabel(id: string, lang: Language, customLabel?: string): string {
  return isKnownPayMethod(id) ? translate(lang, PAY_METHOD_KEYS[id]) : customLabel ?? id;
}

export const ORDER_TYPE_KEYS: Record<OrderType, UiKey> = {
  normal: 'pos.orderType.normal',
  preorder: 'pos.orderType.preorder',
  delivery: 'pos.orderType.delivery',
  dinein: 'pos.orderType.dinein',
};

export const ROLE_KEYS: Record<UserRole, UiKey> = {
  owner: 'nav.role.owner',
  manager: 'nav.role.manager',
  cashier: 'nav.role.cashier',
  admin: 'nav.role.admin',
  stock_staff: 'nav.role.stock_staff',
  report_viewer: 'nav.role.report_viewer',
};

export type DocTypeId = 'receipt' | 'tax_short' | 'tax_full';

export const DOC_TYPE_KEYS: Record<DocTypeId, UiKey> = {
  receipt: 'common.docType.receipt',
  tax_short: 'common.docType.taxShort',
  tax_full: 'common.docType.taxFull',
};

/** ค่า seed ภาษาไทยของ receiptStore — ถ้าค่าที่บันทึกเท่ากับนี้ถือว่า "ยังไม่ตั้ง" */
export const DEFAULT_FOOTER_TH: string = th.receipt.thankYou;
export const DEFAULT_BRANCH_TH: string = th.receipt.headOffice;
