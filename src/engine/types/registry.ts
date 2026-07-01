/**
 * Registry interfaces for the Promotion + Point Calculation Engine.
 * These define the contracts for pluggable condition evaluators and benefit calculators.
 */

import { ConditionConfig, BenefitConfig } from './inputs';
import { EvaluationContext, ConditionResult, BenefitContext, BenefitResult } from './internal';

/**
 * Interface for condition evaluators.
 * Each evaluator handles a specific condition type (e.g., 'minPurchase', 'memberLevel').
 * Registered in the ConditionRegistry and dispatched by type.
 */
export interface ConditionEvaluator {
  /** The condition type this evaluator handles */
  readonly type: string;
  /** Evaluate a condition against the current evaluation context */
  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult;
}

/**
 * Interface for benefit calculators.
 * Each calculator handles a specific benefit type (e.g., 'percentDiscount', 'freeGift').
 * Registered in the BenefitRegistry and dispatched by type.
 */
export interface BenefitCalculator {
  /** The benefit type this calculator handles */
  readonly type: string;
  /** Calculate the benefit given a benefit config and eligible items context */
  calculate(benefit: BenefitConfig, context: BenefitContext): BenefitResult;
}
