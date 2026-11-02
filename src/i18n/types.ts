/**
 * i18n types — ภาษา, รูปทรง locale และชุด key ที่ตรวจด้วย type system
 * PURE: ไม่ import store / react-native
 */
import type { th } from './locales/th';

export type Language = 'th' | 'en';

export const LANGUAGES: readonly Language[] = ['th', 'en'] as const;

export function isLanguage(x: unknown): x is Language {
  return x === 'th' || x === 'en';
}

/** รูปทรงเดียวกับ T แต่ทุก leaf เป็น string — ใช้ annotate ไฟล์ภาษาอังกฤษ */
export type LocaleShape<T> = { [K in keyof T]: T[K] extends string ? string : LocaleShape<T[K]> };

/** dot-path ของทุก leaf ใน T */
export type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<typeof th>;

/** key สำหรับ UI (ทุกอย่างที่ไม่ใช่ receipt.*) — ใช้กับ t()/useT() */
export type UiKey = Exclude<TranslationKey, `receipt.${string}`>;

/** key สำหรับเอกสารที่พิมพ์ — ใช้กับ useReceiptT().rt / translate(lang, ...) */
export type ReceiptKey = Extract<TranslationKey, `receipt.${string}`>;

export type TParams = Record<string, string | number>;
