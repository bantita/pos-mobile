import { ConditionEvaluator } from '../../types/registry';
import { ConditionConfig } from '../../types/inputs';
import { ConditionResult, EvaluationContext } from '../../types/internal';
import { QuantityOperator } from '../../types/enums';

export class PurchaseAmountConditionEvaluator implements ConditionEvaluator {
  readonly type = 'purchaseAmount';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { operator, threshold, min, max } = condition.params;
    const amount = context.subtotal;
    const op = operator as QuantityOperator;

    if (op === QuantityOperator.EVERY && threshold) {
      if (amount < threshold) {
        return { passed: false, reason: `Subtotal ${amount} < threshold ${threshold}` };
      }
      return { passed: true };
    }

    if (op === QuantityOperator.RANGE && min !== undefined && max !== undefined) {
      if (amount >= min && amount <= max) return { passed: true };
      return { passed: false, reason: `Subtotal ${amount} not in range [${min}, ${max}]` };
    }

    if (op === QuantityOperator.MORE_THAN && threshold) {
      if (amount > threshold) return { passed: true };
      return { passed: false, reason: `Subtotal ${amount} not > ${threshold}` };
    }

    // Default: just check threshold
    if (threshold && amount < threshold) {
      return { passed: false, reason: `Subtotal ${amount} < ${threshold}` };
    }

    return { passed: true };
  }
}
