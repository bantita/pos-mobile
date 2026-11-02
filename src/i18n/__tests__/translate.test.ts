/**
 * Tests — translate(): interpolation, en→th fallback, dev warnings, unknown keys
 */
import { describe, test, expect, vi, afterEach } from 'vitest';
import { translate, interpolate, lookup } from '../translate';
import { en } from '../locales/en';
import type { TranslationKey } from '../types';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  vi.restoreAllMocks();
});

describe('interpolate', () => {
  test('string and number params', () => {
    expect(interpolate('{name} {percent}%', { name: 'พนักงาน', percent: 10 })).toBe('พนักงาน 10%');
  });

  test('repeated placeholder', () => {
    expect(interpolate('{a}-{a}', { a: 'x' })).toBe('x-x');
  });

  test('missing param stays literal and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(interpolate('hi {name}', {})).toBe('hi {name}');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('extra params are ignored', () => {
    expect(interpolate('plain', { x: 1 })).toBe('plain');
  });
});

describe('translate', () => {
  test('th and en lookups with params', () => {
    expect(translate('th', 'payment.memberTypeDiscount', { name: 'พนักงาน', percent: 10 })).toBe('ส่วนลดพนักงาน 10%');
    expect(translate('en', 'payment.memberTypeDiscount', { name: 'Staff', percent: 10 })).toBe('Staff discount 10%');
  });

  test('blank en value falls back to th with one warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const method = en.payment.method as { cash: string };
    const saved = method.cash;
    method.cash = '';
    try {
      expect(translate('en', 'payment.method.cash')).toBe('เงินสด');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]).toEqual(['[i18n] missing en key', 'payment.method.cash']);
    } finally {
      method.cash = saved;
    }
  });

  test('missing en key falls back to th', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pay = en.payment as { ewalletOther?: string };
    const saved = pay.ewalletOther;
    delete pay.ewalletOther;
    try {
      expect(translate('en', 'payment.ewalletOther')).toBe('E-Wallet / อื่นๆ');
    } finally {
      pay.ewalletOther = saved;
    }
  });

  test('no warning when the dev guard is off', () => {
    process.env.NODE_ENV = 'production';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(translate('en', 'no.such.key' as TranslationKey)).toBe('no.such.key');
    expect(interpolate('{x}', {})).toBe('{x}');
    expect(warn).not.toHaveBeenCalled();
  });

  test('unknown key returns the key', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(translate('th', 'nope.missing' as TranslationKey)).toBe('nope.missing');
  });

  test('lookup returns undefined for non-leaf paths', () => {
    expect(lookup({ a: { b: 'x' } }, 'a')).toBeUndefined();
    expect(lookup({ a: { b: 'x' } }, 'a.b')).toBe('x');
    expect(lookup({ a: 'x' }, 'a.b.c')).toBeUndefined();
  });
});
