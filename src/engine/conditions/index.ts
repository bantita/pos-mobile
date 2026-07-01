import { ConditionRegistry } from '../core/ConditionRegistry';
import { MemberConditionEvaluator } from './evaluators/member';
import { StoreConditionEvaluator } from './evaluators/store';
import { DayConditionEvaluator } from './evaluators/day';
import { TimeConditionEvaluator } from './evaluators/time';
import { ProductConditionEvaluator } from './evaluators/product';
import { PurchaseAmountConditionEvaluator } from './evaluators/purchaseAmount';
import { ExcludedProductConditionEvaluator } from './evaluators/excludedProduct';

export function createConditionRegistry(): ConditionRegistry {
  const registry = new ConditionRegistry();
  registry.register(new MemberConditionEvaluator());
  registry.register(new StoreConditionEvaluator());
  registry.register(new DayConditionEvaluator());
  registry.register(new TimeConditionEvaluator());
  registry.register(new ProductConditionEvaluator());
  registry.register(new PurchaseAmountConditionEvaluator());
  registry.register(new ExcludedProductConditionEvaluator());
  return registry;
}

export { evaluateAllConditions } from './evaluateAll';
