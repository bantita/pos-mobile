import { BenefitCalculator } from '@/core/pos-engine/types/registry';
import { BenefitConfig } from '@/core/pos-engine/types/inputs';
import { BenefitContext, BenefitResult } from '@/core/pos-engine/types/internal';

/**
 * Calculates a bill-level discount (applied to the entire transaction).
 * params.amount: fixed discount amount on the bill
 * params.percent: percentage discount on the bill (alternative)
 */
export class BillDiscountCalculator implements BenefitCalculator {
  readonly type = 'bill_discount';

  calculate(benefit: BenefitConfig, context: BenefitContext): BenefitResult {
    let billDiscount = 0;

    if (benefit.params.amount) {
      billDiscount = Math.min(benefit.params.amount, context.cartSubtotal);
    } else if (benefit.params.percent) {
      billDiscount = Math.round((context.cartSubtotal * benefit.params.percent) / 100 * 100) / 100;
      billDiscount = Math.min(billDiscount, context.cartSubtotal);
    }

    return { appliedDiscounts: [], billDiscount, freeGifts: [], totalBenefitValue: billDiscount };
  }
}
