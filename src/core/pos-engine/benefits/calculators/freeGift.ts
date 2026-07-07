import { BenefitCalculator } from '@/core/pos-engine/types/registry';
import { BenefitConfig } from '@/core/pos-engine/types/inputs';
import { BenefitContext, BenefitResult } from '@/core/pos-engine/types/internal';
import { FreeGift } from '@/core/pos-engine/types/outputs';

/**
 * Awards free gifts when conditions are met.
 * params.productCode: gift product code
 * params.productName: gift product display name
 * params.quantity: number of gift items
 * params.value: monetary value of the gift
 */
export class FreeGiftCalculator implements BenefitCalculator {
  readonly type = 'free_gift';

  calculate(benefit: BenefitConfig, context: BenefitContext): BenefitResult {
    const gift: FreeGift = {
      productCode: benefit.params.productCode || '',
      productName: benefit.params.productName || '',
      quantity: benefit.params.quantity || 1,
      value: benefit.params.value || 0,
    };

    return {
      appliedDiscounts: [],
      billDiscount: 0,
      freeGifts: [gift],
      totalBenefitValue: gift.value,
    };
  }
}
