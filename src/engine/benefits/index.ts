import { BenefitRegistry } from '../core/BenefitRegistry';
import { PercentDiscountCalculator } from './calculators/percentDiscount';
import { AmountDiscountCalculator } from './calculators/amountDiscount';
import { BillDiscountCalculator } from './calculators/billDiscount';
import { FreeGiftCalculator } from './calculators/freeGift';
import { PerUnitDiscountCalculator } from './calculators/perUnitDiscount';

export function createBenefitRegistry(): BenefitRegistry {
  const registry = new BenefitRegistry();
  registry.register(new PercentDiscountCalculator());
  registry.register(new AmountDiscountCalculator());
  registry.register(new BillDiscountCalculator());
  registry.register(new FreeGiftCalculator());
  registry.register(new PerUnitDiscountCalculator());
  return registry;
}

export { applyAllBenefits } from './applyBenefits';
