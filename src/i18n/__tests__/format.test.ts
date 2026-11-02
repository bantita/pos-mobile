/**
 * Tests — deterministic date/number/money formatters
 */
import { describe, test, expect } from 'vitest';
import { formatDate, formatTime, formatDateTime, formatNumber, formatMoney } from '../format';

describe('formatDate', () => {
  test('th uses Buddhist year, en Gregorian', () => {
    expect(formatDate(new Date(2026, 5, 8), 'th')).toBe('08/06/2569');
    expect(formatDate(new Date(2026, 5, 8), 'en')).toBe('08/06/2026');
  });

  test('accepts number and ISO string', () => {
    const d = new Date(2024, 0, 1, 10, 30);
    expect(formatDate(d.getTime(), 'en')).toBe('01/01/2024');
    expect(formatDate(d.toISOString(), 'th')).toBe('01/01/2567');
  });

  test('invalid date -> "-"', () => {
    expect(formatDate('not-a-date', 'th')).toBe('-');
    expect(formatTime(NaN, 'en')).toBe('-');
    expect(formatDateTime('x', 'en')).toBe('-');
  });
});

describe('formatTime / formatDateTime', () => {
  test('zero-padded HH:mm', () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5), 'th')).toBe('09:05');
    expect(formatTime(new Date(2026, 0, 1, 23, 59), 'en')).toBe('23:59');
  });

  test('date + time', () => {
    expect(formatDateTime(new Date(2026, 5, 8, 10, 25), 'th')).toBe('08/06/2569 10:25');
    expect(formatDateTime(new Date(2026, 5, 8, 10, 25), 'en')).toBe('08/06/2026 10:25');
  });
});

describe('formatNumber / formatMoney', () => {
  test('grouping', () => {
    expect(formatNumber(1234, 'th')).toBe('1,234');
    expect(formatNumber(1234567.891, 'en', 2)).toBe('1,234,567.89');
    expect(formatNumber(999, 'en')).toBe('999');
    expect(formatNumber(-1234, 'en')).toBe('-1,234');
  });

  test('money with ฿ in both languages', () => {
    expect(formatMoney(1234.5, 'th')).toBe('฿1,234.50');
    expect(formatMoney(1234.5, 'en')).toBe('฿1,234.50');
    expect(formatMoney(0, 'en')).toBe('฿0.00');
  });

  test('negative money', () => {
    expect(formatMoney(-10, 'th')).toBe('-฿10.00');
  });

  test('NaN / Infinity -> ฿0.00', () => {
    expect(formatMoney(NaN, 'th')).toBe('฿0.00');
    expect(formatMoney(Infinity, 'en')).toBe('฿0.00');
    expect(formatMoney(-Infinity, 'en')).toBe('฿0.00');
  });
});
