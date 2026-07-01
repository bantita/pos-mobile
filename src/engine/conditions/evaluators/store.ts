import { ConditionEvaluator } from '../../types/registry';
import { ConditionConfig } from '../../types/inputs';
import { ConditionResult, EvaluationContext } from '../../types/internal';

export class StoreConditionEvaluator implements ConditionEvaluator {
  readonly type = 'store';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { storeCodes } = condition.params;
    if (!storeCodes || storeCodes.length === 0) return { passed: true };
    if (storeCodes.includes(context.storeCode)) return { passed: true };
    return { passed: false, reason: `Store ${context.storeCode} not in allowed stores` };
  }
}
