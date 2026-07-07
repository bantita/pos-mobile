/**
 * Promotion + Point Calculation Engine
 * Pure function, deterministic, no side effects
 */
export { calculate } from '@/core/pos-engine/core/engine';
export * from '@/core/pos-engine/types/index';
export { createConditionRegistry } from '@/core/pos-engine/conditions/index';
export { createBenefitRegistry } from '@/core/pos-engine/benefits/index';
export { resolveConflicts } from '@/core/pos-engine/conflict/index';
export { calculateEarnPoints, processRedemption, processPointPayment } from '@/core/pos-engine/points/index';
export { AuditTrailBuilder } from '@/core/pos-engine/audit/index';
export { validateInput } from '@/core/pos-engine/validators/index';
