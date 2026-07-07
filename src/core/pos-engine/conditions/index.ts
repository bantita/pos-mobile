import { ConditionRegistry } from '@/core/pos-engine/core/ConditionRegistry';
import { MemberConditionEvaluator } from '@/core/pos-engine/conditions/evaluators/member';
import { StoreConditionEvaluator } from '@/core/pos-engine/conditions/evaluators/store';
import { DayConditionEvaluator } from '@/core/pos-engine/conditions/evaluators/day';
import { TimeConditionEvaluator } from '@/core/pos-engine/conditions/evaluators/time';
import { ProductConditionEvaluator } from '@/core/pos-engine/conditions/evaluators/product';
import { PurchaseAmountConditionEvaluator } from '@/core/pos-engine/conditions/evaluators/purchaseAmount';
import { ExcludedProductConditionEvaluator } from '@/core/pos-engine/conditions/evaluators/excludedProduct';

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

export { evaluateAllConditions } from '@/core/pos-engine/conditions/evaluateAll';
