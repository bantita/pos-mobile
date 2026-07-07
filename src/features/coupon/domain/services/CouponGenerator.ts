/**
 * CouponGenerator — Batch generate unique coupon codes with collision avoidance
 */
import { GenerateOptions, GenerateResult } from '@/features/coupon/domain/coupon';

/**
 * Generate a random alphanumeric suffix of a given length
 */
function randomSuffix(length: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate unique coupon codes with the given prefix, avoiding collisions with existing codes.
 */
export function generateCouponCodes(options: GenerateOptions): GenerateResult {
  const { prefix, quantity, existingCodes } = options;
  const codes: string[] = [];
  let collisionRetries = 0;
  const maxRetries = quantity * 10; // safety limit
  const suffixLength = 6;

  let attempts = 0;
  while (codes.length < quantity && attempts < maxRetries) {
    const candidate = `${prefix}${randomSuffix(suffixLength)}`;
    attempts++;
    if (existingCodes.has(candidate) || codes.includes(candidate)) {
      collisionRetries++;
      continue;
    }
    codes.push(candidate);
  }

  return { codes, collisionRetries };
}
