import { PointUsageRequest, PointBalance, PointPolicy } from '../types/inputs';
import { PaymentResult } from '../types/internal';
import { PointType } from '../types/enums';

export function processPointPayment(
  request: PointUsageRequest | undefined,
  balances: PointBalance[] | undefined,
  policy: PointPolicy | undefined,
  remainingPayable: number,
  currentDateTime: string
): PaymentResult {
  if (!request) return { success: false, monetaryValue: 0, remainingPayable, unusedPoints: 0 };
  if (!policy) return { success: false, monetaryValue: 0, remainingPayable, unusedPoints: request.points, rejectionReason: 'No point policy configured' };
  if (!balances || balances.length === 0) return { success: false, monetaryValue: 0, remainingPayable, unusedPoints: request.points, rejectionReason: 'No point balances' };

  // Check minimum
  if (policy.minPointsForRedemption && request.points < policy.minPointsForRedemption) {
    return { success: false, monetaryValue: 0, remainingPayable, unusedPoints: request.points, rejectionReason: `Below minimum: need ${policy.minPointsForRedemption}, offered ${request.points}` };
  }

  // Cap at max
  let pointsToUse = request.points;
  if (policy.maxPointsPerTransaction) {
    pointsToUse = Math.min(pointsToUse, policy.maxPointsPerTransaction);
  }

  // Filter non-expired
  const now = new Date(currentDateTime);
  const validBalances = balances.filter(b => !b.expiryDate || new Date(b.expiryDate) > now);

  // Calculate available by priority
  let totalAvailable = 0;
  const priorityOrder = policy.priorityOrder.length > 0 ? policy.priorityOrder : validBalances.map(b => b.pointType);

  for (const type of priorityOrder) {
    const bal = validBalances.find(b => b.pointType === type);
    if (bal) totalAvailable += bal.balance;
  }

  pointsToUse = Math.min(pointsToUse, totalAvailable);
  if (pointsToUse <= 0) {
    return { success: false, monetaryValue: 0, remainingPayable, unusedPoints: request.points, rejectionReason: 'No valid points available' };
  }

  // Convert to monetary value
  let monetaryValue = pointsToUse / policy.conversionRate;
  // Cap at remaining payable
  if (monetaryValue > remainingPayable) {
    monetaryValue = remainingPayable;
    pointsToUse = Math.ceil(monetaryValue * policy.conversionRate);
  }

  const usedType = request.pointType || priorityOrder[0];

  return {
    success: true,
    transaction: {
      transactionType: 'PAYMENT',
      pointType: usedType,
      points: pointsToUse,
      conversionRate: policy.conversionRate,
      monetaryValue,
    },
    monetaryValue,
    remainingPayable: remainingPayable - monetaryValue,
    unusedPoints: request.points - pointsToUse,
  };
}
