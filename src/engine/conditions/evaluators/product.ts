import { ConditionEvaluator } from '../../types/registry';
import { ConditionConfig } from '../../types/inputs';
import { ConditionResult, EvaluationContext } from '../../types/internal';
import { QuantityOperator } from '../../types/enums';

export class ProductConditionEvaluator implements ConditionEvaluator {
  readonly type = 'product';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { itemCodes, groupCodes, operator, threshold, minQty, maxQty } = condition.params;

    // Find matching items
    const matched = context.cart.filter(item => {
      if (itemCodes && itemCodes.length > 0 && itemCodes.includes(item.itemCode)) return true;
      if (groupCodes && groupCodes.length > 0 && item.groupCodes.some((g: string) => groupCodes.includes(g))) return true;
      return false;
    });

    if (matched.length === 0) {
      return { passed: false, reason: 'No matching products found in cart' };
    }

    // Check quantity operator if specified
    const totalQty = matched.reduce((sum, item) => sum + item.quantity, 0);
    const op = operator as QuantityOperator;

    if (op === QuantityOperator.EVERY && threshold) {
      if (totalQty < threshold) {
        return { passed: false, reason: `Quantity ${totalQty} < threshold ${threshold}` };
      }
    } else if (op === QuantityOperator.RANGE && minQty !== undefined && maxQty !== undefined) {
      if (totalQty < minQty || totalQty > maxQty) {
        return { passed: false, reason: `Quantity ${totalQty} not in range [${minQty}, ${maxQty}]` };
      }
    } else if (op === QuantityOperator.MORE_THAN && threshold) {
      if (totalQty <= threshold) {
        return { passed: false, reason: `Quantity ${totalQty} not > ${threshold}` };
      }
    }

    return { passed: true, matchedItems: matched };
  }
}
