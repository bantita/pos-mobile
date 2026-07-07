import { ConditionEvaluator } from '@/core/pos-engine/types/registry';
import { ConditionConfig } from '@/core/pos-engine/types/inputs';
import { ConditionResult, EvaluationContext } from '@/core/pos-engine/types/internal';

export class ExcludedProductConditionEvaluator implements ConditionEvaluator {
  readonly type = 'excludedProduct';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { itemCodes, groupCodes } = condition.params;

    const excluded = context.cart.filter(item => {
      if (itemCodes && itemCodes.includes(item.itemCode)) return true;
      if (groupCodes && item.groupCodes.some((g: string) => groupCodes.includes(g))) return true;
      return false;
    });

    // This condition always passes — it just marks items to exclude from benefits
    return { passed: true, excludedItems: excluded };
  }
}
