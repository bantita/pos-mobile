/**
 * Tests — adSettings pure helpers (โฆษณาจอ 2)
 */
import { describe, test, expect } from 'vitest';
import {
  inferAdType,
  validateAdFile,
  validateAdUrl,
  validateDuration,
  createAd,
  moveItem,
  getPlayableAds,
  estimateAdsChars,
  migrateCustomerDisplay,
  DURATION_PRESETS,
  DEFAULT_AD_DURATION,
  DEFAULT_THANK_YOU,
  DEFAULT_SUCCESS_DURATION,
  AD_LIMITS,
} from '../adSettings';
import type { AdMedia } from '../../types/customerDisplay';

const ad = (id: string, over: Partial<AdMedia> = {}): AdMedia => ({
  id, type: 'image', uri: `https://x.test/${id}.jpg`, duration: 5, ...over,
});

describe('presets', () => {
  test('duration presets are 5/10/15/30 and default is 10', () => {
    expect([...DURATION_PRESETS]).toEqual([5, 10, 15, 30]);
    expect(DEFAULT_AD_DURATION).toBe(10);
  });
});

describe('inferAdType', () => {
  test('MIME types', () => {
    expect(inferAdType('image/png')).toBe('image');
    expect(inferAdType('video/mp4')).toBe('video');
  });
  test('URL extensions', () => {
    expect(inferAdType('https://a.b/c.MP4')).toBe('video');
    expect(inferAdType('https://a.b/c.webm?x=1')).toBe('video');
    expect(inferAdType('https://a.b/c.jpeg')).toBe('image');
    expect(inferAdType('https://a.b/c.webp#frag')).toBe('image');
  });
  test('data URLs', () => {
    expect(inferAdType('data:image/png;base64,AAA')).toBe('image');
    expect(inferAdType('data:video/mp4;base64,AAA')).toBe('video');
  });
  test('unknown http(s) defaults to image, other input is null', () => {
    expect(inferAdType('https://images.unsplash.com/photo-1?w=800')).toBe('image');
    expect(inferAdType('application/pdf')).toBeNull();
    expect(inferAdType('')).toBeNull();
    expect(inferAdType('ftp://x/y')).toBeNull();
  });
});

describe('validateAdFile', () => {
  test('ok image / video', () => {
    expect(validateAdFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateAdFile({ type: 'video/mp4', size: AD_LIMITS.videoBytes })).toBeNull();
  });
  test('unsupported type', () => {
    expect(validateAdFile({ type: 'application/pdf', size: 10 })).toBe('รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ');
    expect(validateAdFile({ type: '', size: 10 })).toBe('รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ');
  });
  test('too large image / video', () => {
    expect(validateAdFile({ type: 'image/png', size: AD_LIMITS.imageBytes + 1 })).toContain('ไฟล์รูปใหญ่เกินไป');
    expect(validateAdFile({ type: 'video/mp4', size: AD_LIMITS.videoBytes + 1 })).toContain('ไฟล์วิดีโอใหญ่เกินไป');
  });
});

describe('validateAdUrl', () => {
  test('accepts http(s) and data URLs', () => {
    expect(validateAdUrl('https://a.b/c.jpg')).toBeNull();
    expect(validateAdUrl('http://a.b/c')).toBeNull();
    expect(validateAdUrl('data:image/png;base64,AA')).toBeNull();
  });
  test('rejects garbage', () => {
    expect(validateAdUrl('hello')).toBe('ลิงก์ไม่ถูกต้อง');
    expect(validateAdUrl('')).toBe('กรุณาวางลิงก์รูปหรือวิดีโอ');
  });
});

describe('validateDuration', () => {
  test('rejects 0, negative, too long, non-number', () => {
    expect(validateDuration(0)).toBe('ระยะเวลาต้องมากกว่า 0 วินาที');
    expect(validateDuration(-1)).toBe('ระยะเวลาต้องมากกว่า 0 วินาที');
    expect(validateDuration(301)).toBe('ระยะเวลาต้องไม่เกิน 300 วินาที');
    expect(validateDuration('abc')).toBe('กรุณากรอกตัวเลข');
    expect(validateDuration('')).toBe('กรุณากรอกตัวเลข');
    expect(validateDuration('2.5')).toBe('กรุณากรอกตัวเลข');
  });
  test('accepts valid values', () => {
    expect(validateDuration(10)).toBeNull();
    expect(validateDuration('45')).toBeNull();
    expect(validateDuration(300)).toBeNull();
  });
});

describe('createAd', () => {
  test('applies defaults: 10 วินาที, enabled', () => {
    const a = createAd({ uri: ' https://a.b/c.jpg ', type: 'image', title: 'โปร' }, 123);
    expect(a.duration).toBe(10);
    expect(a.enabled).toBe(true);
    expect(a.uri).toBe('https://a.b/c.jpg');
    expect(a.title).toBe('โปร');
    expect(a.id.startsWith('ad_123_')).toBe(true);
  });
  test('omits empty title and gives unique ids', () => {
    const a = createAd({ uri: 'https://a.b/c.jpg', type: 'image', title: '  ' }, 1);
    const b = createAd({ uri: 'https://a.b/c.jpg', type: 'image' }, 1);
    expect('title' in a).toBe(false);
    expect(a.id).not.toBe(b.id);
  });
});

describe('moveItem', () => {
  const arr = ['a', 'b', 'c', 'd'];
  test('move down / up', () => {
    expect(moveItem(arr, 0, 1)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveItem(arr, 3, 2)).toEqual(['a', 'b', 'd', 'c']);
    expect(moveItem(arr, 0, 3)).toEqual(['b', 'c', 'd', 'a']);
  });
  test('immutable and out-of-range returns unchanged copy', () => {
    const r = moveItem(arr, -1, 2);
    expect(r).toEqual(arr);
    expect(r).not.toBe(arr);
    expect(moveItem(arr, 0, 4)).toEqual(arr);
    expect(moveItem(arr, 2, 2)).toEqual(arr);
    expect(arr).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('getPlayableAds', () => {
  const ads = [ad('1'), ad('2', { enabled: false }), ad('3', { enabled: true })];
  test('master off → none', () => {
    expect(getPlayableAds(ads, false)).toEqual([]);
  });
  test('per-ad off is skipped, undefined counts as on', () => {
    expect(getPlayableAds(ads, true).map((a) => a.id)).toEqual(['1', '3']);
  });
});

describe('estimateAdsChars', () => {
  test('grows with uri length', () => {
    expect(estimateAdsChars([ad('1', { uri: 'x'.repeat(1000) })])).toBeGreaterThan(1000);
    expect(estimateAdsChars([])).toBe(0);
  });
});

describe('migrateCustomerDisplay', () => {
  const fallback = [ad('mock')];
  test('undefined / garbage → defaults with fallback ads', () => {
    for (const input of [undefined, null, 42, 'x', []]) {
      const r = migrateCustomerDisplay(input, 0, fallback);
      expect(r.ads).toBe(fallback);
      expect(r.adsEnabled).toBe(true);
      expect(r.successDurationSec).toBe(DEFAULT_SUCCESS_DURATION);
      expect(r.thankYouMessage).toBe(DEFAULT_THANK_YOU);
      expect(r.shopName.length).toBeGreaterThan(0);
    }
  });
  test('{} fills defaults', () => {
    const r = migrateCustomerDisplay({}, 0, fallback);
    expect(r.ads).toBe(fallback);
    expect(r.adsEnabled).toBe(true);
  });
  test('old ads without enabled stay valid (enabled stays undefined = on)', () => {
    const r = migrateCustomerDisplay({ ads: [{ id: 'a', type: 'image', uri: 'https://a/b.jpg', duration: 5 }] });
    expect(r.ads).toHaveLength(1);
    expect(r.ads[0].enabled).toBeUndefined();
    expect(getPlayableAds(r.ads, r.adsEnabled)).toHaveLength(1);
  });
  test('bad durations are coerced, ads without uri dropped', () => {
    const r = migrateCustomerDisplay({
      ads: [
        { id: 'a', type: 'image', uri: 'https://a/1.jpg', duration: 0 },
        { id: 'b', type: 'image', uri: 'https://a/2.jpg', duration: 'abc' },
        { id: 'c', type: 'video', uri: 'https://a/3.mp4', duration: 9999 },
        { id: 'd', type: 'image', duration: 5 },
        { id: 'e', uri: '' },
        null,
      ],
      successDurationSec: -3,
      thankYouMessage: '  ',
      adsEnabled: false,
      shopName: 'ร้านฉัน',
    });
    expect(r.ads.map((a) => a.id)).toEqual(['a', 'b', 'c']);
    expect(r.ads[0].duration).toBe(DEFAULT_AD_DURATION);
    expect(r.ads[1].duration).toBe(DEFAULT_AD_DURATION);
    expect(r.ads[2].duration).toBe(300);
    expect(r.successDurationSec).toBe(DEFAULT_SUCCESS_DURATION);
    expect(r.thankYouMessage).toBe(DEFAULT_THANK_YOU);
    expect(r.adsEnabled).toBe(false);
    expect(r.shopName).toBe('ร้านฉัน');
  });
  test('missing type is inferred from uri', () => {
    const r = migrateCustomerDisplay({ ads: [{ id: 'v', uri: 'https://a/clip.mp4', duration: 5 }] });
    expect(r.ads[0].type).toBe('video');
  });
});
