/**
 * Tests — memberTypeBenefits (pure helpers)
 */
import { describe, test, expect } from 'vitest';
import { calcEarnedPoints, computeMemberTypeDiscount, memberTypeDiscountLabel } from '../memberTypeBenefits';

describe('calcEarnedPoints', () => {
  test('ไม่มีประเภท / ค่าเริ่มต้น = floor(amount/earnRate)', () => {
    expect(calcEarnedPoints(1010, 25)).toBe(40);
    expect(calcEarnedPoints(1010, 25, { earnPoints: true, pointMultiplier: 1 })).toBe(40);
  });
  test('earnPoints=false -> 0', () => {
    expect(calcEarnedPoints(1000, 25, { earnPoints: false, pointMultiplier: 3 })).toBe(0);
  });
  test('multiplier คูณก่อนปัดลง', () => {
    expect(calcEarnedPoints(1000, 25, { earnPoints: true, pointMultiplier: 2 })).toBe(80);
    expect(calcEarnedPoints(30, 25, { earnPoints: true, pointMultiplier: 1.5 })).toBe(1);
  });
  test('earnRate 0 ไม่หารด้วยศูนย์', () => {
    expect(calcEarnedPoints(10, 0)).toBe(10);
  });
});

describe('computeMemberTypeDiscount / label', () => {
  test('10% ของ 1234.5 = 123.45', () => {
    expect(computeMemberTypeDiscount(1234.5, { discountPercent: 10 })).toBe(123.45);
  });
  test('0% / ไม่มีประเภท -> 0', () => {
    expect(computeMemberTypeDiscount(1000, { discountPercent: 0 })).toBe(0);
    expect(computeMemberTypeDiscount(1000, null)).toBe(0);
  });
  test('label ภาษาไทย', () => {
    expect(memberTypeDiscountLabel({ name: 'พนักงาน', discountPercent: 10 })).toBe('ส่วนลดพนักงาน 10%');
  });
  test('label en — ชื่อประเภทไม่ถูกแปล', () => {
    expect(memberTypeDiscountLabel({ name: 'Staff', discountPercent: 10 }, 'en')).toBe('Staff discount 10%');
    expect(memberTypeDiscountLabel({ name: 'พนักงาน', discountPercent: 5 }, 'en')).toBe('พนักงาน discount 5%');
  });
});
