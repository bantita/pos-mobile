import { BenefitCalculator } from '../../types/registry';
import { BenefitConfig } from '../../types/inputs';
import { BenefitContext, BenefitResult, LineDiscount } from '../../types/internal';

/**
 * Calculates a fixed amount discount on eligible items.
 * params.amount: fixed discount amount per item line
 */
export class AmountDiscountCalculator implements BenefitCalculator {
  readonly type = 'amount_discount';

  calculate(benefit: BenefitConfig, context: BenefitContext): BenefitResult {
    const amount = benefit.params.amount || 0;
    const appliedDiscounts: LineDiscount[] = [];
    let totalBenefitValue = 0;

    for (const item of context.eligibleItems) {
      const remaining = context.remainingAmounts.get(item.lineId) || item.lineAmount;
      const actualDiscount = Math.min(amount, remaining);

      if (actualDiscount > 0) {
        appliedDiscounts.push({
          lineId: item.lineId,
          discountAmount: actualDiscount,
          originalAmount: item.lineAmount,
          remainingAmount: remaining - actualDiscount,
        });
        totalBenefitValue += actualDiscount;
      }
    }

    return { appliedDiscounts, billDiscount: 0, freeGifts: [], totalBenefitValue };
  }
}
