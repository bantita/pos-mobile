/**
 * Tests — pay-method labels/icons, order-type and doc-type key maps
 */
import { describe, test, expect } from 'vitest';
import {
  payMethodLabel,
  PAY_ICON,
  PAY_METHOD_KEYS,
  ORDER_TYPE_KEYS,
  DOC_TYPE_KEYS,
  ROLE_KEYS,
  DEFAULT_FOOTER_TH,
  DEFAULT_BRANCH_TH,
  type KnownPayMethod,
} from '../labels';
import { translate } from '../translate';
import type { OrderType } from '../../types/sale';

const PINNED: Record<KnownPayMethod, { th: string; en: string }> = {
  cash: { th: 'เงินสด', en: 'Cash' },
  transfer: { th: 'โอน', en: 'Transfer' },
  qr: { th: 'QR Code', en: 'QR Code' },
  credit: { th: 'บัตร', en: 'Card' },
  wallet: { th: 'Wallet', en: 'Wallet' },
  ewallet: { th: 'E-Wallet', en: 'E-Wallet' },
  coupon: { th: 'คูปอง', en: 'Coupon' },
};

describe('payMethodLabel', () => {
  test.each(Object.keys(PINNED) as KnownPayMethod[])('%s pinned th/en', (id) => {
    expect(payMethodLabel(id, 'th')).toBe(PINNED[id].th);
    expect(payMethodLabel(id, 'en')).toBe(PINNED[id].en);
  });

  test('known id ignores custom label', () => {
    expect(payMethodLabel('cash', 'en', 'เงินสด')).toBe('Cash');
  });

  test('unknown id with custom label -> label in both languages', () => {
    expect(payMethodLabel('pay_123', 'th', 'ไลน์เพย์')).toBe('ไลน์เพย์');
    expect(payMethodLabel('pay_123', 'en', 'ไลน์เพย์')).toBe('ไลน์เพย์');
  });

  test('unknown id without label -> id', () => {
    expect(payMethodLabel('pay_x', 'en')).toBe('pay_x');
  });

  test('PAY_METHOD_KEYS covers exactly the known ids', () => {
    expect(Object.keys(PAY_METHOD_KEYS).sort()).toEqual(Object.keys(PINNED).sort());
  });
});

describe('PAY_ICON', () => {
  test('covers every known id except coupon', () => {
    const expected = (Object.keys(PINNED) as KnownPayMethod[]).filter((k) => k !== 'coupon').sort();
    expect(Object.keys(PAY_ICON).sort()).toEqual(expected);
  });
});

describe('key maps', () => {
  test('ORDER_TYPE_KEYS covers every OrderType with Thai wording', () => {
    const all: Record<OrderType, string> = {
      normal: 'ปกติ',
      preorder: 'สั่งจอง',
      delivery: 'เดลิเวอรี',
      dinein: 'ทานที่ร้าน',
    };
    expect(Object.keys(ORDER_TYPE_KEYS).sort()).toEqual(Object.keys(all).sort());
    for (const [id, label] of Object.entries(all) as [OrderType, string][]) {
      expect(translate('th', ORDER_TYPE_KEYS[id])).toBe(label);
    }
  });

  test('DOC_TYPE_KEYS and ROLE_KEYS resolve in both languages', () => {
    for (const key of [...Object.values(DOC_TYPE_KEYS), ...Object.values(ROLE_KEYS)]) {
      expect(translate('th', key)).not.toBe(key);
      expect(translate('en', key)).not.toBe(key);
    }
  });

  test('seeded Thai defaults', () => {
    expect(DEFAULT_FOOTER_TH).toBe('ขอบคุณที่ใช้บริการ 🙏');
    expect(DEFAULT_BRANCH_TH).toBe('สำนักงานใหญ่');
  });
});
