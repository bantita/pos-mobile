/**
 * format — จัดรูปวันที่/ตัวเลข/เงินแบบกำหนดเอง (deterministic, ไม่ใช้ Intl/toLocale*)
 * PURE: ไม่ import store / react-native
 * th: dd/MM/(ปี พ.ศ.)   en: dd/MM/yyyy (ค.ศ.)
 */
import type { Language } from './types';

export type DateInput = Date | number | string;

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

function toDate(d: DateInput): Date | null {
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(d: DateInput, lang: Language): string {
  const date = toDate(d);
  if (!date) return '-';
  const year = date.getFullYear() + (lang === 'th' ? 543 : 0);
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${year}`;
}

export function formatTime(d: DateInput, _lang: Language): string {
  const date = toDate(d);
  if (!date) return '-';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatDateTime(d: DateInput, lang: Language): string {
  const date = toDate(d);
  if (!date) return '-';
  return `${formatDate(date, lang)} ${formatTime(date, lang)}`;
}

/** จัดกลุ่มหลักพันด้วย ',' เอง; NaN/±Infinity → 0 */
export function formatNumber(n: number, _lang: Language, decimals = 0): string {
  const value = Number.isFinite(n) ? n : 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const negative = value < 0 && Number(fixed) !== 0;
  return `${negative ? '-' : ''}${grouped}${fracPart !== undefined ? `.${fracPart}` : ''}`;
}

/** ฿1,234.50 / -฿10.00 / NaN → ฿0.00 (ใช้ ฿ ทั้งสองภาษา) */
export function formatMoney(n: number, lang: Language): string {
  const value = Number.isFinite(n) ? n : 0;
  const body = formatNumber(Math.abs(value), lang, 2);
  const negative = value < 0 && body !== '0.00';
  return `${negative ? '-' : ''}฿${body}`;
}
