import { BenefitCalculator } from '../../types/registry';
import { BenefitConfig } from '../../types/inputs';
import { BenefitContext, BenefitResult, LineDiscount } from '../../types/internal';

/**
 * Calculates a per-unit discount on eligible items.
 * params.amountPerUnit: discount amount per unit
 */
export class PerUnitDiscountCalculator implements BenefitCalculator {
  readonly type = 'per_unit_discount';

  calculate(benefit: BenefitConfig, context: BenefitContext): BenefitResult {
    const amountPerUnit = benefit.params.amountPerUnit || 0;
    const appliedDiscounts: LineDiscount[] = [];
    let totalBenefitValue = 0;

    for (const item of context.eligibleItems) {
      const remaining = context.remainingAmounts.get(item.lineId) || item.lineAmount;
      const discountAmount = amountPerUnit * item.quantity;
      const actualDiscount = Math.min(discountAmount, remaining);

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
