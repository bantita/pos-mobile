import { ConditionEvaluator } from '@/core/pos-engine/types/registry';
import { ConditionConfig } from '@/core/pos-engine/types/inputs';
import { ConditionResult, EvaluationContext } from '@/core/pos-engine/types/internal';

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

    if (segments && segments.length > 0) {
      const memberSegments = context.memberSegments ?? [];
      const hasSegment = segments.some((segment: string) => memberSegments.includes(segment));
      if (!hasSegment) {
        return { passed: false, reason: `Member segments ${memberSegments.join(',') || 'none'} not in ${segments.join(',')}` };
      }
    }

    return { passed: true };
  }
}
