/**
 * Tests — customerDisplayStore (โฆษณาจอ 2): actions ใหม่ + persist
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// customerDisplayStore -> persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { useCustomerDisplayStore, MOCK_ADS, PERSIST_KEY } from '../customerDisplayStore';
import type { AdMedia } from '../../types/customerDisplay';
import { setMediaBackend, makeMediaRef } from '../../utils/adMedia';

const ad = (id: string, over: Partial<AdMedia> = {}): AdMedia => ({
  id, type: 'image', uri: `https://x.test/${id}.jpg`, duration: 5, ...over,
});

const st = () => useCustomerDisplayStore.getState();
const ids = () => st().ads.map((a) => a.id);

beforeEach(() => {
  useCustomerDisplayStore.setState({
    ads: [ad('a'), ad('b'), ad('c')],
    currentAdIndex: 0,
    adsEnabled: true,
    successDurationSec: 5,
    thankYouMessage: 'ชำระเงินสำเร็จ!',
    storageError: null,
    mode: 'idle',
    syncedItems: [],
  });
});

describe('defaults', () => {
  test('fresh store starts with sample ads', () => {
    expect(MOCK_ADS.length).toBeGreaterThan(0);
  });
});

describe('addAdWithDefaults', () => {
  test('appends with duration 10 and enabled true', () => {
    const created = st().addAdWithDefaults({ uri: 'https://x.test/new.png', type: 'image', title: 'ใหม่' });
    expect(created.duration).toBe(10);
    expect(created.enabled).toBe(true);
    expect(ids()).toEqual(['a', 'b', 'c', created.id]);
    expect(st().ads[3].title).toBe('ใหม่');
  });
});

describe('moveAd / moveAdTo', () => {
  test('moves up and down', () => {
    st().moveAd('b', -1);
    expect(ids()).toEqual(['b', 'a', 'c']);
    st().moveAd('b', 1);
    expect(ids()).toEqual(['a', 'b', 'c']);
  });
  test('edges are no-ops', () => {
    const before = st().ads;
    st().moveAd('a', -1);
    st().moveAd('c', 1);
    st().moveAd('zzz', 1);
    expect(st().ads).toBe(before);
  });
  test('moveAdTo (drag) moves across positions', () => {
    st().moveAdTo(0, 2);
    expect(ids()).toEqual(['b', 'c', 'a']);
    const before = st().ads;
    st().moveAdTo(5, 0);
    expect(st().ads).toBe(before);
  });
});

describe('toggleAd / updateAd', () => {
  test('toggleAd flips enabled (undefined → false → true)', () => {
    st().toggleAd('a');
    expect(st().ads[0].enabled).toBe(false);
    st().toggleAd('a');
    expect(st().ads[0].enabled).toBe(true);
  });
  test('updateAd applies duration preset and ignores duration <= 0', () => {
    st().updateAd('b', { duration: 30 });
    expect(st().ads[1].duration).toBe(30);
    st().updateAd('b', { duration: 0 });
    st().updateAd('b', { duration: -5 });
    st().updateAd('b', { duration: Number.NaN });
    expect(st().ads[1].duration).toBe(30);
    st().updateAd('b', { title: 'หัวข้อ', duration: 0 });
    expect(st().ads[1]).toMatchObject({ title: 'หัวข้อ', duration: 30 });
  });
});

describe('nextAd / removeAd index safety', () => {
  test('nextAd with 0 ads gives 0 (no NaN)', () => {
    useCustomerDisplayStore.setState({ ads: [], currentAdIndex: 0 });
    st().nextAd();
    expect(st().currentAdIndex).toBe(0);
  });
  test('nextAd with all ads disabled gives 0', () => {
    useCustomerDisplayStore.setState({ ads: [ad('a', { enabled: false }), ad('b', { enabled: false })] });
    st().nextAd();
    expect(st().currentAdIndex).toBe(0);
  });
  test('nextAd cycles over playable ads only', () => {
    useCustomerDisplayStore.setState({ ads: [ad('a'), ad('b', { enabled: false }), ad('c')], currentAdIndex: 0 });
    st().nextAd();
    expect(st().currentAdIndex).toBe(1);
    st().nextAd();
    expect(st().currentAdIndex).toBe(0);
  });
  test('removeAd clamps currentAdIndex', () => {
    useCustomerDisplayStore.setState({ currentAdIndex: 2 });
    st().removeAd('c');
    expect(st().currentAdIndex).toBeLessThan(st().ads.length);
    st().removeAd('a');
    st().removeAd('b');
    expect(st().currentAdIndex).toBe(0);
  });
  test('removeAd deletes the uploaded file from media storage (idb: ref only)', async () => {
    const map = new Map<string, Blob>([['m1', new Blob(['x'])]]);
    setMediaBackend({
      put: async (id, b) => { map.set(id, b); },
      get: async (id) => map.get(id) ?? null,
      delete: async (id) => { map.delete(id); },
    });
    useCustomerDisplayStore.setState({ ads: [ad('up', { uri: makeMediaRef('m1') }), ad('link')] });
    st().removeAd('link');
    st().removeAd('up');
    await new Promise((r) => setTimeout(r, 0));
    expect(map.size).toBe(0);
    expect(ids()).toEqual([]);
    setMediaBackend(null);
  });
});

describe('storage footprint', () => {
  test('uploaded ads persist only a short reference, not the file data', () => {
    useCustomerDisplayStore.setState({ ads: [ad('up', { uri: makeMediaRef('m_1700000000000_abc123') })] });
    const raw = localStorage.getItem(PERSIST_KEY) ?? '';
    expect(raw).toContain('idb:m_1700000000000_abc123');
    expect(raw.length).toBeLessThan(2000);
  });
});

describe('common settings', () => {
  test('setAdsEnabled', () => {
    st().setAdsEnabled(false);
    expect(st().adsEnabled).toBe(false);
    st().setAdsEnabled(true);
    expect(st().adsEnabled).toBe(true);
  });
  test('setSuccessDuration ignores invalid', () => {
    st().setSuccessDuration(10);
    expect(st().successDurationSec).toBe(10);
    st().setSuccessDuration(0);
    st().setSuccessDuration(-1);
    expect(st().successDurationSec).toBe(10);
  });
  test('setThankYouMessage falls back to default when empty', () => {
    st().setThankYouMessage('ขอบคุณค่ะ');
    expect(st().thankYouMessage).toBe('ขอบคุณค่ะ');
    st().setThankYouMessage('   ');
    expect(st().thankYouMessage).toBe('ชำระเงินสำเร็จ!');
  });
});

describe('persist', () => {
  test('writes settings only (no live sale state)', () => {
    st().broadcastDisplay({ displayItems: [{ id: 'p', name: 'สินค้า', unitPrice: 1, qty: 1, discAmt: 0, subtotal: 1 }] });
    st().addAdWithDefaults({ uri: 'https://x.test/persist.png', type: 'image' });
    const raw = localStorage.getItem(PERSIST_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as { state: Record<string, unknown>; version: number };
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.state.ads)).toBe(true);
    expect(parsed.state).toHaveProperty('adsEnabled');
    expect(parsed.state).toHaveProperty('successDurationSec');
    expect(parsed.state).toHaveProperty('thankYouMessage');
    expect(parsed.state).not.toHaveProperty('syncedItems');
    expect(parsed.state).not.toHaveProperty('mode');
    expect(parsed.state).not.toHaveProperty('storageError');
  });

  test('migrate normalizes an old/unknown blob', () => {
    const migrate = useCustomerDisplayStore.persist.getOptions().migrate!;
    const out = migrate({ ads: [{ id: 'x', type: 'image', uri: 'https://a/b.jpg', duration: 0 }] }, 0) as {
      ads: AdMedia[]; adsEnabled: boolean;
    };
    expect(out.ads[0].duration).toBe(10);
    expect(out.adsEnabled).toBe(true);
  });

  test('merge keeps persisted ads and fills new fields', () => {
    const merge = useCustomerDisplayStore.persist.getOptions().merge!;
    const merged = merge({ ads: [ad('p1')], shopName: 'ร้านเก่า' }, st());
    expect(merged.ads.map((a) => a.id)).toEqual(['p1']);
    expect(merged.shopName).toBe('ร้านเก่า');
    expect(merged.adsEnabled).toBe(true);
    expect(merged.successDurationSec).toBe(5);
  });

  test('storage failure sets storageError, success clears it', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    st().addAdWithDefaults({ uri: 'https://x.test/big.png', type: 'image' });
    expect(st().storageError).toContain('พื้นที่จัดเก็บเต็ม');
    spy.mockRestore();
    st().addAdWithDefaults({ uri: 'https://x.test/ok.png', type: 'image' });
    expect(st().storageError).toBeNull();
  });
});
