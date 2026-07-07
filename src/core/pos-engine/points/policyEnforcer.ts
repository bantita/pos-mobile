import { PointPolicy, PointUsageRequest, RedeemRequest } from '@/core/pos-engine/types/inputs';
import { PointUsageMode } from '@/core/pos-engine/types/enums';

export function shouldProcessPoints(
  policy: PointPolicy | undefined,
  pointUsageRequest: PointUsageRequest | undefined,
  redeemRequest: RedeemRequest | undefined
): { processRedeem: boolean; processPayment: boolean } {
  if (!policy) return { processRedeem: false, processPayment: false };

  if (policy.usageMode === PointUsageMode.MANUAL) {
    return { processRedeem: !!redeemRequest, processPayment: !!pointUsageRequest };
  }

  // AUTO mode: process if request exists OR auto-select
  return { processRedeem: !!redeemRequest, processPayment: !!pointUsageRequest || policy.usageMode === PointUsageMode.AUTO };
}
