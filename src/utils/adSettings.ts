/**
 * adSettings — pure helpers สำหรับโฆษณาจอ 2
 * (ไม่ import react-native เพื่อให้ทดสอบได้ง่าย)
 */
import type { AdMedia, AdMediaType } from '../types/customerDisplay';

export const DURATION_PRESETS = [5, 10, 15, 30] as const;
export const DEFAULT_AD_DURATION = 10;
export const MAX_AD_DURATION = 300;
export const SUCCESS_DURATION_PRESETS = [3, 5, 10] as const;
export const DEFAULT_SUCCESS_DURATION = 5;
export const MAX_SUCCESS_DURATION = 60;
export const DEFAULT_THANK_YOU = 'ชำระเงินสำเร็จ!';
export const DEFAULT_SHOP_NAME = 'ร้านสะดวกซื้อ ABC';

const MB = 1024 * 1024;
export const AD_LIMITS = {
  imageBytes: 1.5 * MB,
  videoBytes: 3 * MB,
  /**
   * งบรวมของข้อมูลโฆษณาที่เก็บใน localStorage (ตัวอักษร)
   * ไฟล์ที่อัปโหลดเก็บใน IndexedDB (ad.uri = `idb:<id>` สั้นๆ) จึงแทบไม่กินงบนี้ —
   * งบนี้กันไม่ให้ข้อมูลแบบ inline (เช่น data URL เดิม) กิน localStorage ที่ store อื่นใช้ร่วมกัน
   */
  totalChars: 1_000_000,
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg)(\?|#|$)/i;

/** เดาประเภทสื่อจาก MIME type หรือ URL — null = ไม่รองรับ */
export function inferAdType(mimeOrUrl: string): AdMediaType | null {
  const v = (mimeOrUrl || '').trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith('image/') || v.startsWith('data:image/')) return 'image';
  if (v.startsWith('video/') || v.startsWith('data:video/')) return 'video';
  if (VIDEO_EXT.test(v)) return 'video';
  if (IMAGE_EXT.test(v)) return 'image';
  if (/^https?:\/\//.test(v)) return 'image';
  return null;
}

/** ตรวจไฟล์ที่เลือกจากเครื่อง — คืนข้อความ error ภาษาไทย หรือ null ถ้าผ่าน */
export function validateAdFile(file: { type: string; size: number }): string | null {
  const t = (file.type || '').toLowerCase();
  const kind = t.startsWith('image/') ? 'image' : t.startsWith('video/') ? 'video' : null;
  if (!kind) return 'รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ';
  if (kind === 'image' && file.size > AD_LIMITS.imageBytes) return 'ไฟล์รูปใหญ่เกินไป (สูงสุด 1.5 MB)';
  if (kind === 'video' && file.size > AD_LIMITS.videoBytes) {
    return 'ไฟล์วิดีโอใหญ่เกินไป (สูงสุด 3 MB) — แนะนำให้วางลิงก์วิดีโอแทน';
  }
  return null;
}

/** ตรวจลิงก์รูป/วิดีโอ */
export function validateAdUrl(url: string): string | null {
  const v = (url || '').trim();
  if (!v) return 'กรุณาวางลิงก์รูปหรือวิดีโอ';
  if (!/^(https?:\/\/\S+|data:(image|video)\/)/i.test(v)) return 'ลิงก์ไม่ถูกต้อง';
  return null;
}

/** ตรวจระยะเวลา (วินาที) — รับได้ทั้ง number และข้อความจากช่องกรอก */
export function validateDuration(value: number | string, max = MAX_AD_DURATION): string | null {
  const raw = typeof value === 'string' ? value.trim() : value;
  if (raw === '') return 'กรุณากรอกตัวเลข';
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return 'กรุณากรอกตัวเลข';
  if (n <= 0) return 'ระยะเวลาต้องมากกว่า 0 วินาที';
  if (n > max) return `ระยะเวลาต้องไม่เกิน ${max} วินาที`;
  return null;
}

/** สร้างโฆษณาใหม่พร้อมค่าเริ่มต้น (10 วินาที, เปิดแสดง) */
export function createAd(
  input: { uri: string; type: AdMediaType; title?: string; subtitle?: string },
  now: number = Date.now(),
): AdMedia {
  const suffix = Math.random().toString(36).slice(2, 7);
  const title = input.title?.trim();
  const subtitle = input.subtitle?.trim();
  return {
    id: `ad_${now}_${suffix}`,
    type: input.type,
    uri: input.uri.trim(),
    duration: DEFAULT_AD_DURATION,
    enabled: true,
    ...(title ? { title } : {}),
    ...(subtitle ? { subtitle } : {}),
  };
}

/** ย้ายตำแหน่งสมาชิกใน array (immutable) — index ผิดช่วงคืนสำเนาเดิม */
export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  const copy = arr.slice();
  if (
    !Number.isInteger(from) || !Number.isInteger(to) ||
    from < 0 || from >= copy.length || to < 0 || to >= copy.length || from === to
  ) {
    return copy;
  }
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** โฆษณาที่จะเล่นจริงบนจอ 2 (enabled === undefined ถือว่าเปิด) */
export function getPlayableAds(ads: readonly AdMedia[], adsEnabled: boolean): AdMedia[] {
  if (!adsEnabled) return [];
  return ads.filter((a) => a.enabled !== false);
}

/** ประมาณขนาดที่ใช้เก็บ (ตัวอักษร) */
export function estimateAdsChars(ads: readonly AdMedia[]): number {
  return ads.reduce(
    (sum, a) => sum + (a.uri?.length ?? 0) + (a.title?.length ?? 0) + (a.subtitle?.length ?? 0) + 120,
    0,
  );
}

// ─── Persist migration ────────────────────────────────────────────────────────
export interface PersistedCustomerDisplay {
  ads: AdMedia[];
  shopName: string;
  adsEnabled: boolean;
  successDurationSec: number;
  thankYouMessage: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function normalizeAd(raw: unknown, idx: number): AdMedia | null {
  if (!isRecord(raw)) return null;
  const uri = typeof raw.uri === 'string' ? raw.uri.trim() : '';
  if (!uri) return null;
  const type: AdMediaType =
    raw.type === 'video' || raw.type === 'image' ? raw.type : inferAdType(uri) ?? 'image';
  const d = Number(raw.duration);
  const duration = Number.isFinite(d) && d > 0 ? Math.min(Math.round(d), MAX_AD_DURATION) || 1 : DEFAULT_AD_DURATION;
  const ad: AdMedia = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `ad_migrated_${idx}`,
    type,
    uri,
    duration,
  };
  if (typeof raw.title === 'string' && raw.title) ad.title = raw.title;
  if (typeof raw.subtitle === 'string' && raw.subtitle) ad.subtitle = raw.subtitle;
  if (typeof raw.enabled === 'boolean') ad.enabled = raw.enabled;
  return ad;
}

/**
 * แปลงข้อมูลที่เก็บไว้ (เวอร์ชันใดก็ได้ / ข้อมูลเสีย) ให้เป็นรูปแบบปัจจุบัน
 * ฟิลด์ที่หาย/ผิดรูปจะถูกเติมค่าเริ่มต้น — `fallbackAds` ใช้เมื่อไม่มี ads เลย
 */
export function migrateCustomerDisplay(
  persisted: unknown,
  _version: number = 0,
  fallbackAds: AdMedia[] = [],
): PersistedCustomerDisplay {
  const p = isRecord(persisted) ? persisted : {};
  const ads = Array.isArray(p.ads)
    ? p.ads.map(normalizeAd).filter((a): a is AdMedia => a !== null)
    : fallbackAds;
  const sd = Number(p.successDurationSec);
  return {
    ads,
    shopName: typeof p.shopName === 'string' && p.shopName.trim() ? p.shopName : DEFAULT_SHOP_NAME,
    adsEnabled: typeof p.adsEnabled === 'boolean' ? p.adsEnabled : true,
    successDurationSec:
      Number.isFinite(sd) && sd > 0 ? Math.min(Math.round(sd), MAX_SUCCESS_DURATION) || 1 : DEFAULT_SUCCESS_DURATION,
    thankYouMessage:
      typeof p.thankYouMessage === 'string' && p.thankYouMessage.trim() ? p.thankYouMessage : DEFAULT_THANK_YOU,
  };
}
