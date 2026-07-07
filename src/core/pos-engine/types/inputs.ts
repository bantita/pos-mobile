/**
 * Input interfaces for the Promotion + Point Calculation Engine.
 * These define the data structures expected by the engine's entry point.
 */

import {
  ConflictResolution,
  PointPolicyMode,
  PointType,
  PointUsageMode,
  PromotionStatus,
  PromotionType,
  StackMode,
} from '@/core/pos-engine/types/enums';
import { FreeGift } from '@/core/pos-engine/types/outputs';

/**
 * Top-level request to the calculation engine.
 * Contains all data needed to evaluate promotions and point operations for a transaction.
 */
export interface CalculationRequest {
  /** Store identifier for store-specific promotion filtering */
  storeCode: string;
  /** Member ID for member-specific promotions (optional for guest checkout) */
  memberId?: string;
  /** Member's loyalty tier/level for tiered promotions */
  memberLevel?: string;
  /** Member segment identifiers for segment-based promotions */
  memberSegments?: string[];
  /** Current business date-time for time-based condition evaluation */
  businessDateTime: string;
  /** Items currently in the cart */
  cartItems: CartItem[];
  /** Cart subtotal before any promotions */
  subtotal: number;
  /** Discount already applied before engine evaluation (e.g., manual discount) */
  existingDiscount?: number;
  /** Current point balances for the member across all point types */
  pointBalances?: PointBalance[];
  /** List of promotion configurations to evaluate */
  promotionCandidates: PromotionConfig[];
  /** Store's point policy configuration */
  pointPolicy?: PointPolicy;
  /** Request to use points as payment */
  pointUsageRequest?: PointUsageRequest;
  /** Request to redeem points for a specific reward */
  redeemRequest?: RedeemRequest;
}

/**
 * Represents a single line item in the shopping cart.
 */
export interface CartItem {
  /** Unique identifier for this cart line */
  lineId: string;
  /** Product/SKU code */
  itemCode: string;
  /** Product group/category codes for group-based conditions */
  groupCodes: string[];
  /** Quantity of items on this line */
  quantity: number;
  /** Unit price per item */
  unitPrice: number;
  /** Total line amount (quantity × unitPrice) */
  lineAmount: number;
  /** Optional flags for special item attributes (e.g., isWeighted, isService) */
  flags?: Record<string, boolean>;
}

/**
 * Full configuration of a promotion campaign.
 * Defines conditions, benefits, stacking rules, and point-earning config.
 */
export interface PromotionConfig {
  /** Unique promotion identifier */
  promotionId: string;
  /** Display name of the promotion */
  name: string;
  /** Classification of the promotion */
  type: PromotionType;
  /** Current lifecycle status */
  status: PromotionStatus;
  /** Evaluation priority (higher = evaluated first) */
  priority: number;
  /** Start date/time of the promotion (ISO 8601) */
  startDate: string;
  /** End date/time of the promotion (ISO 8601) */
  endDate: string;
  /** How this promotion interacts with others */
  stackMode: StackMode;
  /** List of promotion IDs this can stack with (when stackMode is SELECTIVE_STACK) */
  compatiblePromotions?: string[];
  /** Conditions that must be met for the promotion to apply */
  conditions: ConditionConfig[];
  /** Benefits granted when conditions are satisfied */
  benefits: BenefitConfig[];
  /** Strategy for resolving conflicts with competing promotions */
  conflictResolution?: ConflictResolution;
  /** Point earning configuration (for EARN_POINT_GIFT type) */
  pointConfig?: PointEarningConfig;
}

/**
 * Generic condition definition.
 * The `type` field determines which condition evaluator is used,
 * and `params` provides the evaluator-specific configuration.
 */
export interface ConditionConfig {
  /** Condition type identifier (e.g., 'minPurchase', 'itemGroup', 'memberLevel', 'timeRange') */
  type: string;
  /** Condition-specific parameters */
  params: Record<string, any>;
}

/**
 * Generic benefit definition.
 * The `type` field determines which benefit calculator is used,
 * and `params` provides the calculator-specific configuration.
 */
export interface BenefitConfig {
  /** Benefit type identifier (e.g., 'percentDiscount', 'fixedDiscount', 'freeGift', 'buyXGetY') */
  type: string;
  /** Benefit-specific parameters */
  params: Record<string, any>;
}

/**
 * Configuration for point earning behavior on a promotion.
 */
export interface PointEarningConfig {
  /** Type of points to earn */
  pointType: PointType;
  /** Base earning rate (e.g., 1 point per 25 baht) */
  baseRate: number;
  /** Multiplier for bonus earning (e.g., 2x during campaign) */
  multiplier?: number;
  /** Days until earned points expire */
  expiryDays?: number;
  /** Free gift awarded alongside points */
  gift?: FreeGift;
}

/**
 * Current point balance for a specific point type.
 */
export interface PointBalance {
  /** Type of points */
  pointType: PointType;
  /** Available balance */
  balance: number;
  /** Earliest expiry date for these points */
  expiryDate?: string;
}

/**
 * Store-level policy governing point usage and management.
 */
export interface PointPolicy {
  /** Whether store uses single or multiple point types */
  mode: PointPolicyMode;
  /** How points are applied (auto or manual) */
  usageMode: PointUsageMode;
  /** Whether different point types can be merged for redemption */
  allowMerge: boolean;
  /** Priority order for consuming points (highest priority consumed first) */
  priorityOrder: PointType[];
  /** Conversion rate: points to monetary value (e.g., 100 points = 1 baht) */
  conversionRate: number;
  /** Minimum points required before redemption is allowed */
  minPointsForRedemption?: number;
  /** Maximum points that can be used in a single transaction */
  maxPointsPerTransaction?: number;
}

/**
 * Customer request to use points as payment.
 */
export interface PointUsageRequest {
  /** Number of points to use */
  points: number;
  /** Specific point type to use (if not set, follows policy priority) */
  pointType?: PointType;
  /** Allow mixing multiple point types to fulfill the request */
  allowMixed?: boolean;
}

/**
 * Customer request to redeem points for a specific reward/benefit.
 */
export interface RedeemRequest {
  /** The redemption promotion to use */
  promotionId: string;
  /** Type of benefit to receive */
  benefitType: string;
  /** Number of points required */
  pointCost: number;
  /** Specific point type to deduct from */
  pointType?: PointType;
  /** Product code (for product redemption) */
  productCode?: string;
  /** Discount value (for discount redemption) */
  discountValue?: number;
}
