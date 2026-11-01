/**
 * adMedia — ที่เก็บไฟล์โฆษณาที่อัปโหลด (web: IndexedDB)
 *
 * ไฟล์รูป/วิดีโอจะไม่ถูกเก็บใน localStorage อีกต่อไป (localStorage ~5 MB ใช้ร่วมกับ
 * store อื่นทุกตัว เช่น ประวัติการขาย/สินค้า — ถ้าเต็มจะทำให้การบันทึกการขายล้มเหลว)
 * แต่เก็บ Blob ไว้ใน IndexedDB แล้วเก็บเพียง "ตัวอ้างอิง" `idb:<id>` ใน ad.uri
 *
 * หน้าต่าง ?display=1 อยู่ origin เดียวกัน จึงอ่าน IndexedDB เดียวกันได้
 * (ไม่ import react-native เพื่อให้ทดสอบได้ง่าย)
 */
import { useEffect, useState } from 'react';

export const MEDIA_REF_PREFIX = 'idb:';
const DB_NAME = 'pos-ad-media';
const STORE_NAME = 'media';

export const isMediaRef = (uri: string | undefined | null): uri is string =>
  typeof uri === 'string' && uri.startsWith(MEDIA_REF_PREFIX);
export const makeMediaRef = (id: string): string => `${MEDIA_REF_PREFIX}${id}`;
export const mediaIdFromRef = (ref: string): string => ref.slice(MEDIA_REF_PREFIX.length);

/** backend ที่เก็บ Blob — แยกออกมาเพื่อสลับเป็น in-memory ในเทสต์ได้ */
export interface MediaBackend {
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
}

// ─── IndexedDB backend ───────────────────────────────────────────────────────
let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('indexedDB unavailable')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
  // เปิดไม่สำเร็จ → ให้ลองใหม่ได้ครั้งหน้า
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
};

const run = <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const req = fn(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error ?? req.error ?? new Error('indexedDB tx failed'));
    tx.onabort = () => reject(tx.error ?? new Error('indexedDB tx aborted'));
  }));

const idbBackend: MediaBackend = {
  put: (id, blob) => run('readwrite', (s) => s.put(blob, id)).then(() => undefined),
  get: (id) => run<unknown>('readonly', (s) => s.get(id)).then((v) => (v instanceof Blob ? v : null)),
  delete: (id) => run('readwrite', (s) => s.delete(id)).then(() => undefined),
};

let backend: MediaBackend | null = typeof indexedDB !== 'undefined' ? idbBackend : null;

/** สำหรับเทสต์: เปลี่ยน backend (null = ไม่รองรับ) */
export function setMediaBackend(b: MediaBackend | null): void {
  backend = b;
  urlCache.forEach((u) => revoke(u));
  urlCache.clear();
}

export const isMediaStorageAvailable = (): boolean => backend !== null;

// ─── object URL cache (ต่อหน้าต่าง) ───────────────────────────────────────────
const urlCache = new Map<string, string>();
const revoke = (u: string) => {
  try { if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(u); } catch (_) {}
};

/** บันทึกไฟล์ → คืนตัวอ้างอิง `idb:<id>` */
export async function saveAdMedia(blob: Blob, now: number = Date.now()): Promise<string> {
  if (!backend) throw new Error('media storage unavailable');
  const id = `m_${now}_${Math.random().toString(36).slice(2, 8)}`;
  await backend.put(id, blob);
  return makeMediaRef(id);
}

/** แปลงตัวอ้างอิงเป็น URL ที่ใช้แสดงผลได้ — ไม่ใช่ตัวอ้างอิงคืนค่าเดิม, ไม่พบไฟล์คืน null */
export async function resolveAdMediaUri(uri: string): Promise<string | null> {
  if (!isMediaRef(uri)) return uri;
  const cached = urlCache.get(uri);
  if (cached) return cached;
  if (!backend) return null;
  const blob = await backend.get(mediaIdFromRef(uri));
  if (!blob) return null;
  const again = urlCache.get(uri);
  if (again) return again;
  const url = URL.createObjectURL(blob);
  urlCache.set(uri, url);
  return url;
}

/** ลบไฟล์ (ไม่ใช่ตัวอ้างอิง → ไม่ทำอะไร) */
export async function deleteAdMedia(uri: string): Promise<void> {
  if (!isMediaRef(uri)) return;
  const cached = urlCache.get(uri);
  if (cached) { revoke(cached); urlCache.delete(uri); }
  if (backend) await backend.delete(mediaIdFromRef(uri));
}

/** แปลง data URL (เช่น ที่วางมา) เป็น Blob */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!m) return null;
  const mime = m[1] || 'application/octet-stream';
  try {
    if (m[2]) {
      const bin = atob(m[3]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(m[3])], { type: mime });
  } catch (_) {
    return null;
  }
}

export interface ResolvedAdMedia {
  /** URL ที่ใช้แสดงผล (null ระหว่างโหลด หรือเมื่อไม่พบไฟล์) */
  uri: string | null;
  loading: boolean;
  /** true = ไม่พบไฟล์ในเครื่องนี้ (เช่น ล้างข้อมูลเบราว์เซอร์) */
  missing: boolean;
}

/** hook: แปลง ad.uri เป็น URL ที่แสดงได้ (รองรับทั้งลิงก์ปกติและ `idb:`) */
export function useAdMediaUri(uri: string | undefined): ResolvedAdMedia {
  const direct = !uri || !isMediaRef(uri);
  const [state, setState] = useState<ResolvedAdMedia>(() =>
    direct
      ? { uri: uri ?? null, loading: false, missing: false }
      : { uri: urlCache.get(uri) ?? null, loading: !urlCache.has(uri), missing: false });

  useEffect(() => {
    if (!uri || !isMediaRef(uri)) {
      setState({ uri: uri ?? null, loading: false, missing: false });
      return;
    }
    let alive = true;
    const cached = urlCache.get(uri);
    if (cached) { setState({ uri: cached, loading: false, missing: false }); return; }
    setState({ uri: null, loading: true, missing: false });
    resolveAdMediaUri(uri)
      .then((u) => { if (alive) setState({ uri: u, loading: false, missing: u === null }); })
      .catch(() => { if (alive) setState({ uri: null, loading: false, missing: true }); });
    return () => { alive = false; };
  }, [uri]);

  return state;
}
