import { CalculationRequest } from '../types/inputs';
import { CalculationResult, AppliedBenefit, PointTransaction } from '../types/outputs';
import { EvaluatedPromotion, EvaluationContext, BenefitResult, RedeemResult, PaymentResult } from '../types/internal';
import { PromotionType } from '../types/enums';
import { validateInput } from '../validators';
import { filterActivePromotions } from './filter';
import { buildFinalTotals } from './subtotal';
import { createConditionRegistry, evaluateAllConditions } from '../conditions';
import { createBenefitRegistry, applyAllBenefits } from '../benefits';
import { resolveConflicts } from '../conflict';
import { calculateEarnPoints } from '../points/earning';
import { processRedemption } from '../points/redemption';
import { processPointPayment } from '../points/payment';
import { shouldProcessPoints } from '../points/policyEnforcer';
import { AuditTrailBuilder } from '../audit/trailBuilder';

export function calculate(request: CalculationRequest): CalculationResult {
  const audit = new AuditTrailBuilder();

  // Step 1: Validate
  const validation = validateInput(request);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Build context
  const context: EvaluationContext = {
    cart: request.cartItems,
    memberId: request.memberId,
    memberLevel: request.memberLevel,
    storeCode: request.storeCode,
    businessDateTime: request.businessDateTime,
    subtotal: request.subtotal,
  };

  // Step 2: Filter active promotions
  const filtered = filterActivePromotions(request.promotionCandidates, request.businessDateTime, audit);
  const totalFiltered = request.promotionCandidates.length - filtered.length;

  // Separate by type
  const promoType = filtered.filter(p => p.type === PromotionType.PROMOTION);
  const earnType = filtered.filter(p => p.type === PromotionType.EARN_POINT_GIFT);

  // Step 3: Evaluate conditions for PROMOTION type
  const conditionRegistry = createConditionRegistry();
  const evaluated: EvaluatedPromotion[] = [];

  for (const promo of promoType) {
    const result = evaluateAllConditions(promo.conditions, context, conditionRegistry);
    audit.add(promo.promotionId, 'EVALUATED', result.passed ? 'All conditions passed' : (result.reason || 'Condition failed'));
    
    if (result.passed) {
      audit.add(promo.promotionId, 'MATCHED', 'Promotion matched all conditions');
      evaluated.push({ config: promo, conditionResult: result });
    } else {
      audit.add(promo.promotionId, 'REJECTED', result.reason || 'Conditions not met');
    }
  }

  // Step 4: Resolve conflicts
  const { applied: resolvedPromos, rejected } = resolveConflicts(evaluated);
  for (const r of rejected) {
    audit.add(r.config.promotionId, 'REJECTED', r.reason);
  }

  // Step 5: Apply benefits
  const benefitRegistry = createBenefitRegistry();
  let combinedBenefit: BenefitResult = { appliedDiscounts: [], billDiscount: 0, freeGifts: [], totalBenefitValue: 0 };
  const appliedBenefits: AppliedBenefit[] = [];

  for (const promo of resolvedPromos) {
    const matchedEval = evaluated.find(e => e.config.promotionId === promo.promotionId);
    const eligibleItems = matchedEval?.conditionResult.matchedItems || request.cartItems;
    
    const result = applyAllBenefits(promo.benefits, eligibleItems, request.subtotal, benefitRegistry);
    
    combinedBenefit.appliedDiscounts.push(...result.appliedDiscounts);
    combinedBenefit.billDiscount += result.billDiscount;
    combinedBenefit.freeGifts.push(...result.freeGifts);
    combinedBenefit.totalBenefitValue += result.totalBenefitValue;

    appliedBenefits.push({
      promotionId: promo.promotionId,
      promotionName: promo.name,
      type: promo.type,
      benefitType: promo.benefits[0]?.type || 'unknown',
      value: result.totalBenefitValue,
      affectedLineIds: result.appliedDiscounts.map(d => d.lineId),
      freeGifts: result.freeGifts.length > 0 ? result.freeGifts : undefined,
    });

    audit.add(promo.promotionId, 'APPLIED', `Benefit applied: value ${result.totalBenefitValue}`);
  }

  // Step 6: Calculate eligible subtotal
  const subtotalAfterPromo = Math.max(0, request.subtotal - combinedBenefit.totalBenefitValue);

  // Step 7: Redeem points
  const { processRedeem, processPayment } = shouldProcessPoints(request.pointPolicy, request.pointUsageRequest, request.redeemRequest);
  
  let redeemResult: RedeemResult = { success: false, discountValue: 0 };
  if (processRedeem) {
    redeemResult = processRedemption(request.redeemRequest, request.pointBalances, request.pointPolicy, request.businessDateTime);
    if (redeemResult.success && redeemResult.transaction) {
      audit.addSystem('APPLIED', `Point redemption: ${redeemResult.transaction.points} points = ${redeemResult.discountValue} discount`);
    } else if (redeemResult.rejectionReason) {
      audit.addSystem('REJECTED', `Point redemption rejected: ${redeemResult.rejectionReason}`);
    }
  }

  // Step 8: Point payment
  let paymentResult: PaymentResult = { success: false, monetaryValue: 0, remainingPayable: subtotalAfterPromo - redeemResult.discountValue, unusedPoints: 0 };
  if (processPayment) {
    const remaining = subtotalAfterPromo - redeemResult.discountValue;
    paymentResult = processPointPayment(request.pointUsageRequest, request.pointBalances, request.pointPolicy, remaining, request.businessDateTime);
    if (paymentResult.success && paymentResult.transaction) {
      audit.addSystem('APPLIED', `Point payment: ${paymentResult.transaction.points} points = ${paymentResult.monetaryValue} paid`);
    } else if (paymentResult.rejectionReason) {
      audit.addSystem('REJECTED', `Point payment rejected: ${paymentResult.rejectionReason}`);
    }
  }

  // Step 9: Calculate earn points
  const earnResult = calculateEarnPoints(earnType, subtotalAfterPromo, request.pointPolicy);
  for (const t of earnResult.transactions) {
    audit.addSystem('APPLIED', `Points earned: ${t.points} ${t.pointType}`);
  }

  // Step 10: Build result
  const pointTransactions: PointTransaction[] = [
    ...earnResult.transactions,
    ...(redeemResult.transaction ? [redeemResult.transaction] : []),
    ...(paymentResult.transaction ? [paymentResult.transaction] : []),
  ];

  const finalTotals = buildFinalTotals(request.subtotal, combinedBenefit, redeemResult, paymentResult);

  return {
    evaluationSummary: {
      totalEvaluated: promoType.length,
      totalApplied: resolvedPromos.length,
      totalRejected: evaluated.length - resolvedPromos.length + (promoType.length - evaluated.length),
      totalFiltered,
    },
    appliedBenefits,
    pointTransactions,
    finalTotals,
    explainTrace: audit.build(),
  };
}
