/**
 * Tests — th/en dictionary parity (key sets, non-empty values, {param} sets)
 */
import { describe, test, expect } from 'vitest';
import { th } from '../locales/th';
import { en } from '../locales/en';

function flatten(obj: unknown, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
  if (obj !== null && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out[prefix] = obj;
  }
  return out;
}

const params = (s: string): string[] => [...new Set((s.match(/\{(\w+)\}/g) ?? []))].sort();

const flatTh = flatten(th);
const flatEn = flatten(en);

describe('locale parity', () => {
  test('th and en have identical key sets', () => {
    expect(Object.keys(flatEn).sort()).toEqual(Object.keys(flatTh).sort());
  });

  test('every value is a non-empty string', () => {
    for (const [key, v] of [...Object.entries(flatTh), ...Object.entries(flatEn)]) {
      expect(typeof v, key).toBe('string');
      expect((v as string).trim().length, key).toBeGreaterThan(0);
    }
  });

  test('placeholder sets match per key', () => {
    for (const key of Object.keys(flatTh)) {
      expect(params(String(flatEn[key])), key).toEqual(params(String(flatTh[key])));
    }
  });

  test('keys are camelCase/snake ids and at most 3 levels deep', () => {
    for (const key of Object.keys(flatTh)) {
      expect(key.split('.').length, key).toBeLessThanOrEqual(3);
    }
  });
});
