/**
 * translate — แปลข้อความแบบ pure (ไม่ผูก store)
 * - en ที่ขาด/ว่าง → fallback เป็น th (+ เตือนเฉพาะ dev)
 * - key ที่ไม่รู้จัก → คืน key
 * - {param} แทนค่าด้วย params; ไม่มี param → คงข้อความเดิม (+ เตือนเฉพาะ dev)
 */
import { th } from './locales/th';
import { en } from './locales/en';
import type { Language, TranslationKey, TParams } from './types';

const DICTS: Record<Language, unknown> = { th, en };

/** dev guard — อ่านตอนเรียกทุกครั้ง เพื่อให้ test สลับ NODE_ENV ได้ */
export function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
}

/** หา value ตาม dot path; คืน undefined ถ้าไม่ใช่ string */
export function lookup(dict: unknown, path: string): string | undefined {
  let node: unknown = dict;
  for (const part of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** แทน {name} ด้วย params[name]; placeholder ที่ไม่มี param คงไว้ตามเดิม */
export function interpolate(str: string, params?: TParams): string {
  return str.replace(/\{(\w+)\}/g, (match, name: string) => {
    if (params && Object.prototype.hasOwnProperty.call(params, name)) {
      return String(params[name]);
    }
    if (isDev()) console.warn('[i18n] missing param', name, 'in', str);
    return match;
  });
}

export function translate(lang: Language, key: TranslationKey, params?: TParams): string {
  const value = lookup(DICTS[lang], key);
  if (value) return interpolate(value, params);

  const fallback = lang === 'th' ? undefined : lookup(DICTS.th, key);
  if (fallback) {
    if (isDev()) console.warn(`[i18n] missing ${lang} key`, key);
    return interpolate(fallback, params);
  }

  if (isDev()) console.warn('[i18n] unknown key', key);
  return key;
}
