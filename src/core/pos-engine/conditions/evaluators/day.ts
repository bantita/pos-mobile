import { ConditionEvaluator } from '@/core/pos-engine/types/registry';
import { ConditionConfig } from '@/core/pos-engine/types/inputs';
import { ConditionResult, EvaluationContext } from '@/core/pos-engine/types/internal';

export class DayConditionEvaluator implements ConditionEvaluator {
  readonly type = 'day';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { days } = condition.params; // 0=Sun, 1=Mon, ..., 6=Sat
    if (!days || days.length === 0) return { passed: true };
    const dayOfWeek = new Date(context.businessDateTime).getDay();
    if (days.includes(dayOfWeek)) return { passed: true };
    return { passed: false, reason: `Day ${dayOfWeek} not in allowed days ${days.join(',')}` };
  }
}
