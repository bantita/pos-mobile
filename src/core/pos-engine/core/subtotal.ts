import { FinalTotals } from '@/core/pos-engine/types/outputs';
import { BenefitResult, RedeemResult, PaymentResult } from '@/core/pos-engine/types/internal';

export function buildFinalTotals(
  originalSubtotal: number,
  benefitResult: BenefitResult,
  redeemResult: RedeemResult,
  paymentResult: PaymentResult
): FinalTotals {
  const totalItemDiscount = benefitResult.appliedDiscounts.reduce((sum, d) => sum + d.discountAmount, 0);
  const totalBillDiscount = benefitResult.billDiscount;
  const subtotalAfterPromotion = Math.max(0, originalSubtotal - totalItemDiscount - totalBillDiscount);
  const pointRedemptionValue = redeemResult.success ? redeemResult.discountValue : 0;
  const pointPaymentValue = paymentResult.success ? paymentResult.monetaryValue : 0;
  const finalPayable = Math.max(0, subtotalAfterPromotion - pointRedemptionValue - pointPaymentValue);

  return {
    subtotalBeforePromotion: originalSubtotal,
    totalItemDiscount,
    totalBillDiscount,
    subtotalAfterPromotion,
    pointRedemptionValue,
    pointPaymentValue,
    finalPayable,
  };
}
