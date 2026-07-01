/**
 * CouponConditionEvaluator — Validates coupon codes as a promotion condition.
 * Integrates with CouponService for status, expiry, and limit checks.
 */
import { ConditionEvaluator } from '../../types/registry';
import { ConditionConfig } from '../../types/inputs';
import { ConditionResult, EvaluationContext } from '../../types/internal';

/**
 * Minimal interface for coupon validation (avoids circular dependency).
 * The actual CouponService implements this.
 */
export interface CouponValidator {
  validateCoupon(code: string, ctx: {
    memberId?: string;
    memberLevel?: string;
    storeCode: string;
    businessDateTime: string;
    currentBillCoupons?: string[];
  }): { valid: boolean; reason?: string };
}

export class CouponConditionEvaluator implements ConditionEvaluator {
  readonly type = 'coupon';

  constructor(private validator: CouponValidator) {}

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { couponCode, productConditions } = condition.params;

    if (!couponCode) {
      return { passed: false, reason: 'No coupon code provided' };
    }

    // Validate coupon via service
    const validation = this.validator.validateCoupon(couponCode, {
      memberId: context.memberId,
      memberLevel: context.memberLevel,
      storeCode: context.storeCode,
      businessDateTime: context.businessDateTime,
    });

    if (!validation.valid) {
      return { passed: false, reason: validation.reason || 'Coupon validation failed' };
    }

    // Match cart items based on optional product conditions
    if (productConditions) {
      const { itemCodes, groupCodes } = productConditions;
      const matched = context.cart.filter(item => {
        if (itemCodes && itemCodes.length > 0 && itemCodes.includes(item.itemCode)) return true;
        if (groupCodes && groupCodes.length > 0 && item.groupCodes.some((g: string) => groupCodes.includes(g))) return true;
        // If both specified but item matches neither
        if ((itemCodes && itemCodes.length > 0) || (groupCodes && groupCodes.length > 0)) return false;
        return true;
      });

      if (matched.length === 0) {
        return { passed: false, reason: 'No eligible products in cart for this coupon' };
      }
      return { passed: true, matchedItems: matched };
    }

    // No product filter — all cart items eligible
    return { passed: true, matchedItems: context.cart };
  }
}
