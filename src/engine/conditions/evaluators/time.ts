import { ConditionEvaluator } from '../../types/registry';
import { ConditionConfig } from '../../types/inputs';
import { ConditionResult, EvaluationContext } from '../../types/internal';

export class TimeConditionEvaluator implements ConditionEvaluator {
  readonly type = 'time';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { startTime, endTime } = condition.params; // "HH:mm" format
    if (!startTime || !endTime) return { passed: true };

    const dt = new Date(context.businessDateTime);
    const currentMinutes = dt.getHours() * 60 + dt.getMinutes();

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    const inRange = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    if (inRange) return { passed: true };
    return { passed: false, reason: `Time ${dt.getHours()}:${dt.getMinutes()} not in range ${startTime}-${endTime}` };
  }
}
