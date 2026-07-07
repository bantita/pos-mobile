/**
 * Internal interfaces for the Promotion + Point Calculation Engine.
 * These are used internally by the engine and are not exposed to external consumers.
 */

import { CartItem, PromotionConfig } from '@/core/pos-engine/types/inputs';
import { FreeGift, PointTransaction } from '@/core/pos-engine/types/outputs';

/**
 * Internal context passed through the evaluation pipeline.
 * Built from the CalculationRequest for engine-internal use.
 */
export interface EvaluationContext {
  /** Normalized cart items */
  cart: CartItem[];
  /** Member identifier */
  memberId?: string;
  /** Member's loyalty tier */
  memberLevel?: string;
  /** Member segment identifiers */
  memberSegments?: string[];
  /** Store code for store-specific logic */
  storeCode: string;
  /** Business date-time for temporal conditions */
  businessDateTime: string;
  /** Current cart subtotal */
  subtotal: number;
}

/**
 * Result of evaluating a single condition against the cart/context.
 */
export interface ConditionResult {
  /** Whether the condition was satisfied */
  passed: boolean;
  /** Cart items that matched the condition */
  matchedItems?: CartItem[];
  /** Cart items explicitly excluded by the condition */
  excludedItems?: CartItem[];
  /** Human-readable reason if condition failed */
  reason?: string;
}

/**
 * Context provided to benefit calculators.
 * Contains items eligible for the benefit and remaining discount capacity.
 */
export interface BenefitContext {
  /** Items eligible to receive this benefit */
  eligibleItems: CartItem[];
  /** Map of lineId → remaining amount available for discount */
  remainingAmounts: Map<string, number>;
  /** Current cart subtotal (for bill-level calculations) */
  cartSubtotal: number;
}

/**
 * Result of calculating benefits for a single promotion.
 */
export interface BenefitResult {
  /** Item-level discounts applied */
  appliedDiscounts: LineDiscount[];
  /** Bill-level discount amount */
  billDiscount: number;
  /** Free gifts awarded */
  freeGifts: FreeGift[];
  /** Total monetary value of all benefits */
  totalBenefitValue: number;
}

/**
 * Discount applied to a specific cart line.
 */
export interface LineDiscount {
  /** Cart line identifier */
  lineId: string;
  /** Discount amount applied to this line */
  discountAmount: number;
  /** Original line amount before discount */
  originalAmount: number;
  /** Remaining amount after discount */
  remainingAmount: number;
}

/**
 * A promotion that has been evaluated with its condition result
 * and optional estimated benefit (used for conflict resolution).
 */
export interface EvaluatedPromotion {
  /** The promotion's full configuration */
  config: PromotionConfig;
  /** Result of condition evaluation */
  conditionResult: ConditionResult;
  /** Estimated benefit value (for BEST_BENEFIT conflict resolution) */
  estimatedBenefit?: number;
}

/**
 * Result of validating a CalculationRequest or PromotionConfig.
 */
export interface ValidationResult {
  /** Whether the input is valid */
  valid: boolean;
  /** List of validation errors found */
  errors: ValidationError[];
}

/**
 * A single validation error.
 */
export interface ValidationError {
  /** Field path that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code: string;
}

/**
 * Result of point earning calculation.
 */
export interface EarnResult {
  /** Point transactions generated from earning */
  transactions: PointTransaction[];
  /** Gifts awarded alongside points */
  gifts: FreeGift[];
}

/**
 * Result of a point redemption operation.
 */
export interface RedeemResult {
  /** Whether the redemption was successful */
  success: boolean;
  /** Point transaction for the redemption */
  transaction?: PointTransaction;
  /** Gift received from redemption */
  gift?: FreeGift;
  /** Discount value applied from redemption */
  discountValue: number;
  /** Reason if redemption was rejected */
  rejectionReason?: string;
}

/**
 * Result of a point-as-payment operation.
 */
export interface PaymentResult {
  /** Whether the payment was successful */
  success: boolean;
  /** Point transaction for the payment */
  transaction?: PointTransaction;
  /** Monetary value deducted from payable amount */
  monetaryValue: number;
  /** Remaining amount still to be paid */
  remainingPayable: number;
  /** Points not used (e.g., exceeded max or remaining was zero) */
  unusedPoints: number;
  /** Reason if payment was rejected */
  rejectionReason?: string;
}
