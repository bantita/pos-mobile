/**
 * Promotion + Point Calculation Engine
 * Pure function, deterministic, no side effects
 */
export { calculate } from './core/engine';
export * from './types';
export { createConditionRegistry } from './conditions';
export { createBenefitRegistry } from './benefits';
export { resolveConflicts } from './conflict';
export { calculateEarnPoints, processRedemption, processPointPayment } from './points';
export { AuditTrailBuilder } from './audit';
export { validateInput } from './validators';
