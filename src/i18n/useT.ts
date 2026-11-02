/**
 * useT / t / useUiLanguage / useFormat — ผูกการแปลเข้ากับภาษา UI (languageStore)
 * t() แบบ non-hook อ่าน store ตอนเรียก (ไม่ reactive) — ห้ามเรียกที่ module scope
 */
import { useCallback, useMemo } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { translate } from './translate';
import { formatDate, formatTime, formatDateTime, formatNumber, formatMoney, type DateInput } from './format';
import type { Language, TParams, UiKey } from './types';

export type TFunction = (key: UiKey, params?: TParams) => string;

export interface BoundFormat {
  date: (d: DateInput) => string;
  time: (d: DateInput) => string;
  dateTime: (d: DateInput) => string;
  number: (n: number, decimals?: number) => string;
  money: (n: number) => string;
}

export function useUiLanguage(): Language {
  return useLanguageStore((s) => s.uiLanguage);
}

export function useT(): TFunction {
  const lang = useUiLanguage();
  return useCallback<TFunction>((key, params) => translate(lang, key, params), [lang]);
}

/** non-hook — สำหรับ handler, alert/confirm, error ที่ throw */
export function t(key: UiKey, params?: TParams): string {
  return translate(useLanguageStore.getState().uiLanguage, key, params);
}

export function bindFormat(lang: Language): BoundFormat {
  return {
    date: (d) => formatDate(d, lang),
    time: (d) => formatTime(d, lang),
    dateTime: (d) => formatDateTime(d, lang),
    number: (n, decimals) => formatNumber(n, lang, decimals),
    money: (n) => formatMoney(n, lang),
  };
}

export function useFormat(): BoundFormat {
  const lang = useUiLanguage();
  return useMemo(() => bindFormat(lang), [lang]);
}
