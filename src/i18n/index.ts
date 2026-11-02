/**
 * i18n barrel — ไม่ re-export format.ts (กันชื่อชนกับ src/utils/format.ts)
 * pure modules ให้ import จาก ./translate | ./format | ./labels | ./types โดยตรง
 */
export * from './types';
export { useT, t, useUiLanguage, useFormat, bindFormat } from './useT';
export type { TFunction, BoundFormat } from './useT';
export { useReceiptT } from './useReceiptT';
export type { RtFunction, ReceiptT } from './useReceiptT';
export * from './labels';
