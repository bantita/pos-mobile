/**
 * CouponService — Central service for coupon validation, redemption, and lifecycle
 */
import {
  CouponCode,
  CouponCampaign,
  CouponStatus,
  ValidationContext,
  ValidationResult,
  RedemptionResult,
  UsageCounts,
  COUPON_ERRORS,
} from '../../types/coupon';

export interface CouponStore {
  lookupCode(code: string): CouponCode | undefined;
  getCampaign(campaignId: string): CouponCampaign | undefined;
  updateCodeStatus(code: string, status: CouponStatus, metadata: {
    actor: string; billNumber?: string; customerId?: string;
  }): void;
  getUsageCounts(campaignId: string, memberId?: string, billCoupons?: string[]): UsageCounts;
  getAllCodes(): CouponCode[];
}

export class CouponService {
  constructor(private store: CouponStore) {}

  validateCoupon(code: string, ctx: ValidationContext): ValidationResult {
    const couponCode = this.store.lookupCode(code);
    if (!couponCode) {
      return { valid: false, reason: COUPON_ERRORS.COUPON_NOT_FOUND, errorCode: 'COUPON_NOT_FOUND' };
    }

    // Check status
    if (couponCode.status === CouponStatus.USED) {
      return { valid: false, reason: COUPON_ERRORS.COUPON_ALREADY_USED, errorCode: 'COUPON_ALREADY_USED', couponCode };
    }
    if (couponCode.status === CouponStatus.EXPIRED) {
      return { valid: false, reason: COUPON_ERRORS.COUPON_EXPIRED, errorCode: 'COUPON_EXPIRED', couponCode };
    }
    if (couponCode.status === CouponStatus.CANCELLED) {
      return { valid: false, reason: COUPON_ERRORS.COUPON_CANCELLED, errorCode: 'COUPON_CANCELLED', couponCode };
    }

    // Check expiry
    const now = new Date(ctx.businessDateTime);
    const expiry = new Date(couponCode.expiryDate);
    if (now > expiry) {
      return { valid: false, reason: COUPON_ERRORS.COUPON_EXPIRED, errorCode: 'COUPON_EXPIRED', couponCode };
    }

    // Get campaign for limit checks
    const campaign = this.store.getCampaign(couponCode.campaignId);
    if (!campaign) {
      return { valid: false, reason: COUPON_ERRORS.COUPON_NOT_FOUND, errorCode: 'COUPON_NOT_FOUND', couponCode };
    }

    // Limit checks
    const usage = this.store.getUsageCounts(
      campaign.id,
      ctx.memberId,
      ctx.currentBillCoupons,
    );

    if (campaign.limits.totalUsageLimit && usage.totalUsed >= campaign.limits.totalUsageLimit) {
      return { valid: false, reason: COUPON_ERRORS.LIMIT_TOTAL_EXCEEDED, errorCode: 'LIMIT_TOTAL_EXCEEDED', couponCode, campaign };
    }
    if (campaign.limits.perBillLimit && usage.perBillUsed >= campaign.limits.perBillLimit) {
      return { valid: false, reason: COUPON_ERRORS.LIMIT_PER_BILL_EXCEEDED, errorCode: 'LIMIT_PER_BILL_EXCEEDED', couponCode, campaign };
    }
    if (campaign.limits.perCustomerLimit && ctx.memberId && usage.perCustomerUsed >= campaign.limits.perCustomerLimit) {
      return { valid: false, reason: COUPON_ERRORS.LIMIT_PER_CUSTOMER_EXCEEDED, errorCode: 'LIMIT_PER_CUSTOMER_EXCEEDED', couponCode, campaign };
    }

    // Customer group check
    if (campaign.limits.allowedCustomerGroups && campaign.limits.allowedCustomerGroups.length > 0) {
      if (!ctx.memberLevel || !campaign.limits.allowedCustomerGroups.includes(ctx.memberLevel)) {
        return { valid: false, reason: COUPON_ERRORS.LIMIT_GROUP_NOT_ALLOWED, errorCode: 'LIMIT_GROUP_NOT_ALLOWED', couponCode, campaign };
      }
    }

    return { valid: true, couponCode, campaign };
  }

  redeemCoupon(code: string, billNumber: string, actor: string): RedemptionResult {
    const couponCode = this.store.lookupCode(code);
    if (!couponCode) return { success: false, reason: 'Coupon not found' };
    if (couponCode.status !== CouponStatus.ACTIVE) {
      return { success: false, reason: `Cannot redeem: status is ${couponCode.status}` };
    }

    this.store.updateCodeStatus(code, CouponStatus.USED, { actor, billNumber });
    return { success: true };
  }

  cancelCoupon(code: string, actor: string): RedemptionResult {
    const couponCode = this.store.lookupCode(code);
    if (!couponCode) return { success: false, reason: 'Coupon not found' };
    if (couponCode.status !== CouponStatus.ACTIVE) {
      return { success: false, reason: `Cannot cancel: status is ${couponCode.status}` };
    }

    this.store.updateCodeStatus(code, CouponStatus.CANCELLED, { actor });
    return { success: true };
  }

  expireOverdue(currentDate: string): number {
    const now = new Date(currentDate);
    let count = 0;

    for (const code of this.store.getAllCodes()) {
      if (code.status === CouponStatus.ACTIVE && new Date(code.expiryDate) < now) {
        this.store.updateCodeStatus(code.code, CouponStatus.EXPIRED, { actor: 'SYSTEM' });
        count++;
      }
    }

    return count;
  }
}
