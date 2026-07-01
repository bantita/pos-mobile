/**
 * Enums for the Promotion + Point Calculation Engine.
 * Defines all classification, mode, and status types used across the engine.
 */

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
