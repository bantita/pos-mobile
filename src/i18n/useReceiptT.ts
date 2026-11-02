/**
 * useReceiptT — แปลข้อความบนเอกสารที่พิมพ์ตาม "ภาษาใบเสร็จ" (receiptStore.config.receiptLanguage)
 * แยกจากภาษา UI: rt() รับเฉพาะ ReceiptKey (receipt.*) — type บังคับ
 */
import { useCallback, useMemo } from 'react';
import { useReceiptStore } from '../store/receiptStore';
import { translate } from './translate';
import { bindFormat, type BoundFormat } from './useT';
import type { Language, ReceiptKey, TParams } from './types';

export type RtFunction = (key: ReceiptKey, params?: TParams) => string;

export interface ReceiptT {
  rt: RtFunction;
  receiptLang: Language;
  fmt: BoundFormat;
}

export function useReceiptT(): ReceiptT {
  const receiptLang = useReceiptStore((s) => s.config.receiptLanguage ?? 'th');
  const rt = useCallback<RtFunction>((key, params) => translate(receiptLang, key, params), [receiptLang]);
  const fmt = useMemo(() => bindFormat(receiptLang), [receiptLang]);
  return useMemo(() => ({ rt, receiptLang, fmt }), [rt, receiptLang, fmt]);
}
