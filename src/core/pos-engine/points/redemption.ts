import { RedeemRequest, PointBalance, PointPolicy } from '@/core/pos-engine/types/inputs';
import { RedeemResult } from '@/core/pos-engine/types/internal';
import { FreeGift } from '@/core/pos-engine/types/outputs';

export function processRedemption(
  request: RedeemRequest | undefined,
  balances: PointBalance[] | undefined,
  policy: PointPolicy | undefined,
  currentDateTime: string
): RedeemResult {
  if (!request) return { success: false, discountValue: 0 };

  if (!balances || balances.length === 0) {
    return { success: false, discountValue: 0, rejectionReason: 'No point balances available' };
  }

  // Filter non-expired balances
  const now = new Date(currentDateTime);
  const validBalances = balances.filter(b => {
    if (!b.expiryDate) return true;
    return new Date(b.expiryDate) > now;
  });

  // Find matching point type
  const targetType = request.pointType || (policy?.priorityOrder?.[0]);
  let available = 0;

  if (policy?.allowMerge && !request.pointType) {
    available = validBalances.reduce((sum, b) => sum + b.balance, 0);
  } else {
    available = validBalances.filter(b => b.pointType === targetType).reduce((sum, b) => sum + b.balance, 0);
  }

  if (available < request.pointCost) {
    return { success: false, discountValue: 0, rejectionReason: `Insufficient points: need ${request.pointCost}, have ${available}` };
  }

  const discountValue = request.discountValue || 0;
  const gift: FreeGift | undefined = request.productCode
    ? { productCode: request.productCode, productName: request.productCode, quantity: 1, value: 0 }
    : undefined;

  return {
    success: true,
    transaction: {
      transactionType: 'REDEEM',
      pointType: targetType || validBalances[0].pointType,
      points: request.pointCost,
      monetaryValue: discountValue,
      promotionId: request.promotionId,
    },
    gift,
    discountValue,
  };
}
