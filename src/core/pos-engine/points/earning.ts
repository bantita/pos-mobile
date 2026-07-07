import { PromotionConfig, PointPolicy } from '@/core/pos-engine/types/inputs';
import { EarnResult } from '@/core/pos-engine/types/internal';
import { PointTransaction, FreeGift } from '@/core/pos-engine/types/outputs';
import { PointPolicyMode, PromotionType } from '@/core/pos-engine/types/enums';

export function calculateEarnPoints(
  appliedPromotions: PromotionConfig[],
  eligibleSubtotal: number,
  policy?: PointPolicy
): EarnResult {
  const transactions: PointTransaction[] = [];
  const gifts: FreeGift[] = [];

  const earnPromos = appliedPromotions.filter(p => p.type === PromotionType.EARN_POINT_GIFT && p.pointConfig);

  for (const promo of earnPromos) {
    const cfg = promo.pointConfig!;
    const basePoints = Math.floor(eligibleSubtotal / cfg.baseRate);
    const earnedPoints = basePoints * (cfg.multiplier || 1);

    if (earnedPoints <= 0) continue;

    let targetType = cfg.pointType;
    if (policy?.mode === PointPolicyMode.SINGLE_TYPE && policy.priorityOrder.length > 0) {
      targetType = policy.priorityOrder[0];
    }

    const expiryDate = cfg.expiryDays
      ? new Date(Date.now() + cfg.expiryDays * 86400000).toISOString()
      : undefined;

    transactions.push({
      transactionType: 'EARN',
      pointType: targetType,
      points: earnedPoints,
      expiryDate,
      promotionId: promo.promotionId,
    });

    if (cfg.gift) {
      gifts.push(cfg.gift);
    }
  }

  return { transactions, gifts };
}
