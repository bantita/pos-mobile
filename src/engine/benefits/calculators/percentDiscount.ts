import { BenefitCalculator } from '../../types/registry';
import { BenefitConfig } from '../../types/inputs';
import { BenefitContext, BenefitResult, LineDiscount } from '../../types/internal';

/**
 * Calculates a percentage discount on eligible items.
 * params.percent: discount percentage (e.g., 10 for 10%)
 * params.maxDiscount: optional max cap on total discount
 */
export class PercentDiscountCalculator implements BenefitCalculator {
  readonly type = 'percent_discount';

  calculate(benefit: BenefitConfig, context: BenefitContext): BenefitResult {
    const percent = benefit.params.percent || 0;
    const maxDiscount = benefit.params.maxDiscount as number | undefined;
    const appliedDiscounts: LineDiscount[] = [];
    let totalBenefitValue = 0;

    for (const item of context.eligibleItems) {
      const remaining = context.remainingAmounts.get(item.lineId) || item.lineAmount;
      let discountAmount = Math.round((remaining * percent) / 100 * 100) / 100;

      // Cap at maxDiscount
      if (maxDiscount !== undefined && totalBenefitValue + discountAmount > maxDiscount) {
        discountAmount = Math.max(0, maxDiscount - totalBenefitValue);
      }

      const actualDiscount = Math.min(discountAmount, remaining);

      if (actualDiscount > 0) {
        appliedDiscounts.push({
          lineId: item.lineId,
          discountAmount: actualDiscount,
          originalAmount: item.lineAmount,
          remainingAmount: remaining - actualDiscount,
        });
        context.remainingAmounts.set(item.lineId, remaining - actualDiscount);
        totalBenefitValue += actualDiscount;
      }
    }

    return { appliedDiscounts, billDiscount: 0, freeGifts: [], totalBenefitValue };
  }
}
