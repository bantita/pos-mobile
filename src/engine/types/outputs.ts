/**
 * Output interfaces for the Promotion + Point Calculation Engine.
 * These define the data structures returned by the engine after evaluation.
 */

import { PointType, PromotionType } from './enums';

/**
 * Complete result of the promotion + point calculation engine.
 * Contains all applied benefits, point transactions, and a full audit trace.
 */
export interface CalculationResult {
  /** High-level summary of the evaluation process */
  evaluationSummary: EvaluationSummary;
  /** List of benefits that were successfully applied */
  appliedBenefits: AppliedBenefit[];
  /** Point earn/redeem/payment transactions generated */
  pointTransactions: PointTransaction[];
  /** Final monetary totals after all promotions and point operations */
  finalTotals: FinalTotals;
  /** Step-by-step trace of the engine's decision process */
  explainTrace: ExplainEntry[];
}

/**
 * High-level statistics of the evaluation run.
 */
export interface EvaluationSummary {
  /** Total number of promotions evaluated */
  totalEvaluated: number;
  /** Number of promotions successfully applied */
  totalApplied: number;
  /** Number of promotions rejected (conditions not met) */
  totalRejected: number;
  /** Number of promotions filtered before evaluation (expired, wrong store, etc.) */
  totalFiltered: number;
}

/**
 * A single benefit that was applied to the transaction.
 */
export interface AppliedBenefit {
  /** Source promotion ID */
  promotionId: string;
  /** Display name of the source promotion */
  promotionName: string;
  /** Type of the source promotion */
  type: PromotionType;
  /** Specific benefit type applied (e.g., 'percentDiscount', 'freeGift') */
  benefitType: string;
  /** Monetary value of the benefit */
  value: number;
  /** Cart line IDs affected by this benefit */
  affectedLineIds: string[];
  /** Free gifts included with this benefit */
  freeGifts?: FreeGift[];
}

/**
 * A free gift awarded as part of a promotion benefit.
 */
export interface FreeGift {
  /** Product code of the gift item */
  productCode: string;
  /** Display name of the gift item */
  productName: string;
  /** Quantity of gift items */
  quantity: number;
  /** Monetary value of the gift (for accounting purposes) */
  value: number;
}

/**
 * A single point transaction (earn, redeem, or payment).
 */
export interface PointTransaction {
  /** Type of point operation */
  transactionType: 'EARN' | 'REDEEM' | 'PAYMENT';
  /** Point type involved */
  pointType: PointType;
  /** Number of points in this transaction */
  points: number;
  /** Conversion rate used (points to monetary value) */
  conversionRate?: number;
  /** Monetary equivalent of the points */
  monetaryValue?: number;
  /** Expiry date for earned points */
  expiryDate?: string;
  /** Promotion that triggered this transaction */
  promotionId?: string;
}

/**
 * Final monetary breakdown after all promotions and point operations.
 */
export interface FinalTotals {
  /** Original subtotal before any promotions */
  subtotalBeforePromotion: number;
  /** Total item-level discounts applied */
  totalItemDiscount: number;
  /** Total bill-level discounts applied */
  totalBillDiscount: number;
  /** Subtotal after promotions but before point operations */
  subtotalAfterPromotion: number;
  /** Monetary value deducted via point redemption */
  pointRedemptionValue: number;
  /** Monetary value deducted via point payment */
  pointPaymentValue: number;
  /** Final amount the customer must pay */
  finalPayable: number;
}

/**
 * A single entry in the engine's explain/audit trace.
 * Provides full transparency into the engine's decision-making.
 */
export interface ExplainEntry {
  /** Sequential step number */
  step: number;
  /** Promotion being evaluated (if applicable) */
  promotionId?: string;
  /** Action taken at this step */
  action: 'FILTERED' | 'EVALUATED' | 'MATCHED' | 'REJECTED' | 'APPLIED';
  /** Human-readable reason for the action */
  reason: string;
  /** Additional contextual details */
  details?: Record<string, any>;
}
