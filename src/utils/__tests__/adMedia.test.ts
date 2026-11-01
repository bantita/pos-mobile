/**
 * Tests — adMedia (ไฟล์โฆษณาเก็บใน IndexedDB, localStorage เก็บแค่ตัวอ้างอิง)
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MediaBackend, setMediaBackend, isMediaStorageAvailable, isMediaRef, makeMediaRef, mediaIdFromRef,
  saveAdMedia, resolveAdMediaUri, deleteAdMedia, dataUrlToBlob, MEDIA_REF_PREFIX,
} from '../adMedia';

const memoryBackend = () => {
  const map = new Map<string, Blob>();
  const b: MediaBackend = {
    put: async (id, blob) => { map.set(id, blob); },
    get: async (id) => map.get(id) ?? null,
    delete: async (id) => { map.delete(id); },
  };
  return { b, map };
};

let created = 0;
beforeEach(() => {
  created = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${++created}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => {
  setMediaBackend(null);
  vi.restoreAllMocks();
});

describe('media refs', () => {
  test('make / detect / parse', () => {
    const ref = makeMediaRef('m_1');
    expect(ref).toBe(`${MEDIA_REF_PREFIX}m_1`);
    expect(isMediaRef(ref)).toBe(true);
    expect(mediaIdFromRef(ref)).toBe('m_1');
    expect(isMediaRef('https://x.test/a.jpg')).toBe(false);
    expect(isMediaRef('data:image/png;base64,AAAA')).toBe(false);
    expect(isMediaRef(undefined)).toBe(false);
  });
});

describe('save / resolve / delete', () => {
  test('saveAdMedia stores the blob and returns a short ref (not the data)', async () => {
    const { b, map } = memoryBackend();
    setMediaBackend(b);
    const blob = new Blob(['x'.repeat(5000)], { type: 'image/png' });
    const ref = await saveAdMedia(blob, 123);
    expect(isMediaRef(ref)).toBe(true);
    expect(ref.length).toBeLessThan(40);
    expect(map.get(mediaIdFromRef(ref))).toBe(blob);
  });

  test('resolve returns a cached object URL; plain URLs pass through', async () => {
    const { b } = memoryBackend();
    setMediaBackend(b);
    const ref = await saveAdMedia(new Blob(['a'], { type: 'video/mp4' }));
    const u1 = await resolveAdMediaUri(ref);
    const u2 = await resolveAdMediaUri(ref);
    expect(u1).toBe('blob:test/1');
    expect(u2).toBe(u1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(await resolveAdMediaUri('https://x.test/a.jpg')).toBe('https://x.test/a.jpg');
  });

  test('missing file resolves to null', async () => {
    setMediaBackend(memoryBackend().b);
    expect(await resolveAdMediaUri(makeMediaRef('nope'))).toBeNull();
  });

  test('delete removes the blob and revokes the URL', async () => {
    const { b, map } = memoryBackend();
    setMediaBackend(b);
    const ref = await saveAdMedia(new Blob(['a'], { type: 'image/png' }));
    await resolveAdMediaUri(ref);
    await deleteAdMedia(ref);
    expect(map.size).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test/1');
    // ลิงก์ปกติ → ไม่ทำอะไร
    await expect(deleteAdMedia('https://x.test/a.jpg')).resolves.toBeUndefined();
  });

  test('no backend → unavailable, save throws', async () => {
    setMediaBackend(null);
    expect(isMediaStorageAvailable()).toBe(false);
    await expect(saveAdMedia(new Blob(['a']))).rejects.toThrow();
    expect(await resolveAdMediaUri(makeMediaRef('x'))).toBeNull();
  });
});

describe('dataUrlToBlob', () => {
  test('decodes base64 with mime type', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,aGVsbG8=');
    expect(blob?.type).toBe('image/png');
    expect(blob?.size).toBe(5);
  });
  test('invalid input → null', () => {
    expect(dataUrlToBlob('https://x.test/a.png')).toBeNull();
    expect(dataUrlToBlob('data:image/png;base64,@@@')).toBeNull();
  });
});
