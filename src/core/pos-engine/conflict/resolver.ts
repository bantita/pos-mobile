import { EvaluatedPromotion } from '@/core/pos-engine/types/internal';
import { PromotionConfig } from '@/core/pos-engine/types/inputs';
import { StackMode } from '@/core/pos-engine/types/enums';

export interface ConflictResult {
  applied: PromotionConfig[];
  rejected: { config: PromotionConfig; reason: string }[];
}

/**
 * Resolves conflicts between evaluated promotions based on stacking rules and priority.
 * 
 * Algorithm:
 * 1. Sort by priority (descending)
 * 2. Walk through sorted list, applying stacking rules
 * 3. NO_STACK promotions cannot combine with others (only the highest-priority NO_STACK wins)
 * 4. STACK_ALLOWED promotions can always combine
 * 5. SELECTIVE_STACK promotions can only combine with explicitly listed compatible promotions
 */
export function resolveConflicts(evaluated: EvaluatedPromotion[]): ConflictResult {
  if (evaluated.length === 0) {
    return { applied: [], rejected: [] };
  }

  // Sort by priority ascending (lower number = higher priority)
  const sorted = [...evaluated].sort((a, b) => a.config.priority - b.config.priority);

  const applied: PromotionConfig[] = [];
  const rejected: { config: PromotionConfig; reason: string }[] = [];
  let hasNoStack = false;

  for (const item of sorted) {
    const promo = item.config;

    if (promo.stackMode === StackMode.NO_STACK) {
      if (applied.length === 0) {
        // First NO_STACK promotion wins
        applied.push(promo);
        hasNoStack = true;
      } else {
        rejected.push({ config: promo, reason: `NO_STACK conflict: higher priority promotion already applied` });
      }
    } else if (promo.stackMode === StackMode.STACK_ALLOWED) {
      if (hasNoStack) {
        rejected.push({ config: promo, reason: `Cannot stack with NO_STACK promotion` });
      } else {
        applied.push(promo);
      }
    } else if (promo.stackMode === StackMode.SELECTIVE_STACK) {
      if (hasNoStack) {
        rejected.push({ config: promo, reason: `Cannot stack with NO_STACK promotion` });
      } else {
        // Check compatibility with already applied promotions
        const compatible = applied.every(a =>
          promo.compatiblePromotions?.includes(a.promotionId) ?? false
        );
        if (compatible || applied.length === 0) {
          applied.push(promo);
        } else {
          rejected.push({ config: promo, reason: `SELECTIVE_STACK: not compatible with applied promotions` });
        }
      }
    }
  }

  return { applied, rejected };
}
