import { BenefitRegistry } from '@/core/pos-engine/core/BenefitRegistry';
import { PercentDiscountCalculator } from '@/core/pos-engine/benefits/calculators/percentDiscount';
import { AmountDiscountCalculator } from '@/core/pos-engine/benefits/calculators/amountDiscount';
import { BillDiscountCalculator } from '@/core/pos-engine/benefits/calculators/billDiscount';
import { FreeGiftCalculator } from '@/core/pos-engine/benefits/calculators/freeGift';
import { PerUnitDiscountCalculator } from '@/core/pos-engine/benefits/calculators/perUnitDiscount';

export function createBenefitRegistry(): BenefitRegistry {
  const registry = new BenefitRegistry();
  registry.register(new PercentDiscountCalculator());
  registry.register(new AmountDiscountCalculator());
  registry.register(new BillDiscountCalculator());
  registry.register(new FreeGiftCalculator());
  registry.register(new PerUnitDiscountCalculator());
  return registry;
}

export { applyAllBenefits } from '@/core/pos-engine/benefits/applyBenefits';
