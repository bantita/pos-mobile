import { ConditionEvaluator } from '../../types/registry';
import { ConditionConfig } from '../../types/inputs';
import { ConditionResult, EvaluationContext } from '../../types/internal';

export class MemberConditionEvaluator implements ConditionEvaluator {
  readonly type = 'member';

  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult {
    const { levels, memberIds, memberTypeIds } = condition.params;

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

    // ประเภทสมาชิก (AND กับ levels เมื่อกำหนดทั้งคู่)
    if (memberTypeIds && memberTypeIds.length > 0) {
      if (!context.memberTypeId || !memberTypeIds.includes(context.memberTypeId)) {
        return { passed: false, reason: `Member type ${context.memberTypeId} not in ${memberTypeIds.join(',')}` };
      }
    }

    return { passed: true };
  }
}
