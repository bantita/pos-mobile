import { BenefitConfig, CartItem } from '@/core/pos-engine/types/inputs';
import { BenefitResult, BenefitContext } from '@/core/pos-engine/types/internal';
import { BenefitRegistry } from '@/core/pos-engine/core/BenefitRegistry';

/**
 * Apply all benefits from a promotion to eligible items.
 * Iterates through benefit configs, dispatches to the appropriate calculator,
 * and aggregates results.
 */
export function applyAllBenefits(
  benefits: BenefitConfig[],
  eligibleItems: CartItem[],
  cartSubtotal: number,
  registry: BenefitRegistry
): BenefitResult {
  const combined: BenefitResult = {
    appliedDiscounts: [],
    billDiscount: 0,
    freeGifts: [],
    totalBenefitValue: 0,
  };

  // Track remaining amounts per line to prevent over-discounting
  const remainingAmounts = new Map<string, number>();
  for (const item of eligibleItems) {
    remainingAmounts.set(item.lineId, item.lineAmount);
  }

  const context: BenefitContext = {
    eligibleItems,
    remainingAmounts,
    cartSubtotal,
  };

  for (const benefit of benefits) {
    const calculator = registry.get(benefit.type);
    if (!calculator) continue;

    const result = calculator.calculate(benefit, context);

    combined.appliedDiscounts.push(...result.appliedDiscounts);
    combined.billDiscount += result.billDiscount;
    combined.freeGifts.push(...result.freeGifts);
    combined.totalBenefitValue += result.totalBenefitValue;

    // Update remaining amounts after each benefit application
    for (const discount of result.appliedDiscounts) {
      const current = remainingAmounts.get(discount.lineId) || 0;
      remainingAmounts.set(discount.lineId, Math.max(0, current - discount.discountAmount));
    }
  }

  return combined;
}
