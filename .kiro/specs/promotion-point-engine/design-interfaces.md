# Design: Interfaces & Data Models — Promotion + Point Engine

This document defines all TypeScript enums and interfaces used by the Promotion + Point calculation engine. These types form the contract between the engine's internal modules and external consumers.

---

## Enums

```typescript
/** Classification of promotion campaigns */
export enum PromotionType {
  /** Standard discount promotion (item/bill discount, free gift) */
  PROMOTION = 'PROMOTION',
  /** Earn points or gifts based on purchase */
  EARN_POINT_GIFT = 'EARN_POINT_GIFT',
  /** Redeem accumulated points for rewards */
  REDEEM_POINT = 'REDEEM_POINT',
  /** Use points as partial/full payment */
  POINT_PAYMENT = 'POINT_PAYMENT',
}

/** Types of loyalty points a member can accumulate */
export enum PointType {
  /** Standard membership loyalty points */
  MEMBER_POINT = 'MEMBER_POINT',
  /** Points earned through specific promotions */
  PROMOTION_POINT = 'PROMOTION_POINT',
  /** Bonus points awarded during member's birthday period */
  BIRTHDAY_POINT = 'BIRTHDAY_POINT',
  /** Points from reward/referral programs */
  REWARD_POINT = 'REWARD_POINT',
  /** Cashback converted to points */
  CASHBACK_POINT = 'CASHBACK_POINT',
}

/** How quantity conditions are evaluated against cart items */
export enum QuantityOperator {
  /** Benefit applies for every N items (repeating) */
  EVERY = 'EVERY',
  /** Benefit applies when quantity is within min-max range */
  RANGE = 'RANGE',
  /** Benefit applies when quantity exceeds threshold */
  MORE_THAN = 'MORE_THAN',
}

/** Controls whether a promotion can stack with others */
export enum StackMode {
  /** Cannot combine with any other promotion */
  NO_STACK = 'NO_STACK',
  /** Can combine with all other stackable promotions */
  STACK_ALLOWED = 'STACK_ALLOWED',
  /** Can only combine with explicitly listed promotions */
  SELECTIVE_STACK = 'SELECTIVE_STACK',
}

/** Strategy for resolving conflicts between competing promotions */
export enum ConflictResolution {
  /** Apply the promotion with highest priority number */
  HIGHEST_PRIORITY = 'HIGHEST_PRIORITY',
  /** Apply the promotion that gives the customer the most benefit */
  BEST_BENEFIT = 'BEST_BENEFIT',
  /** Apply the first promotion that matches conditions */
  FIRST_MATCH = 'FIRST_MATCH',
}

/** How the store manages multiple point types */
export enum PointPolicyMode {
  /** Store uses only one type of point */
  SINGLE_TYPE = 'SINGLE_TYPE',
  /** Store allows multiple point types simultaneously */
  MULTI_TYPE = 'MULTI_TYPE',
}

/** How points are applied during checkout */
export enum PointUsageMode {
  /** System automatically selects best point usage */
  AUTO = 'AUTO',
  /** Customer/cashier manually chooses how to use points */
  MANUAL = 'MANUAL',
}

/** Lifecycle status of a promotion */
export enum PromotionStatus {
  /** Created but not yet active */
  DRAFT = 'DRAFT',
  /** Currently running and evaluatable */
  ACTIVE = 'ACTIVE',
  /** Past its end date */
  EXPIRED = 'EXPIRED',
  /** Manually deactivated by admin */
  DISABLED = 'DISABLED',
}
```

---

## Input Interfaces

```typescript
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
```

---

## Output Interfaces

```typescript
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
```

---

## Internal Interfaces

These interfaces are used internally by the engine and are not exposed to external consumers.

```typescript
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
```

---

## Type Summary

| Category | Count | Key Types |
|----------|-------|-----------|
| Enums | 8 | PromotionType, PointType, QuantityOperator, StackMode, ConflictResolution, PointPolicyMode, PointUsageMode, PromotionStatus |
| Input Interfaces | 10 | CalculationRequest, CartItem, PromotionConfig, ConditionConfig, BenefitConfig, PointEarningConfig, PointBalance, PointPolicy, PointUsageRequest, RedeemRequest |
| Output Interfaces | 7 | CalculationResult, EvaluationSummary, AppliedBenefit, FreeGift, PointTransaction, FinalTotals, ExplainEntry |
| Internal Interfaces | 11 | EvaluationContext, ConditionResult, BenefitContext, BenefitResult, LineDiscount, EvaluatedPromotion, ValidationResult, ValidationError, EarnResult, RedeemResult, PaymentResult |
