import { CartItem, ConditionConfig } from '@/core/pos-engine/types/inputs';
import { ConditionResult, EvaluationContext } from '@/core/pos-engine/types/internal';
import { ConditionRegistry } from '@/core/pos-engine/core/ConditionRegistry';

export function evaluateAllConditions(
  conditions: ConditionConfig[],
  context: EvaluationContext,
  registry: ConditionRegistry,
): ConditionResult {
  let allMatchedItems: CartItem[] = [];
  let allExcludedItems: CartItem[] = [];

  for (const condition of conditions) {
    const evaluator = registry.get(condition.type);
    if (!evaluator) {
      return { passed: false, reason: `Unknown condition type: ${condition.type}` };
    }
    
    const result = evaluator.evaluate(condition, context);
    if (!result.passed) {
      return result; // AND logic: if any condition fails, whole evaluation fails
    }
    
    if (result.matchedItems) allMatchedItems = [...allMatchedItems, ...result.matchedItems];
    if (result.excludedItems) allExcludedItems = [...allExcludedItems, ...result.excludedItems];
  }

  return {
    passed: true,
    matchedItems: allMatchedItems.length > 0 ? allMatchedItems : undefined,
    excludedItems: allExcludedItems.length > 0 ? allExcludedItems : undefined,
  };
}
