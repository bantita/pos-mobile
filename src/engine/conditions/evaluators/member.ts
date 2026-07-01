import { ConditionEvaluator } from '../../types/registry';
import { ConditionConfig } from '../../types/inputs';
import { ConditionResult, EvaluationContext } from '../../types/internal';

export class MemberConditionEvaluator implements ConditionEvaluator {
  readonly type = 'member';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { levels, segments, memberIds } = condition.params;

    if (!context.memberId) {
      return { passed: false, reason: 'No member selected' };
    }

    if (memberIds && memberIds.length > 0) {
      if (!memberIds.includes(context.memberId)) {
        return { passed: false, reason: `Member ${context.memberId} not in allowed list` };
      }
    }

    if (levels && levels.length > 0) {
      if (!context.memberLevel || !levels.includes(context.memberLevel)) {
        return { passed: false, reason: `Member level ${context.memberLevel} not in ${levels.join(',')}` };
      }
    }

    return { passed: true };
  }
}
