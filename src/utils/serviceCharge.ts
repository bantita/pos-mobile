/**
 * Service Charge — Calculation and validation utilities
 */
import { ServiceChargeConfig } from '../types/store';

/**
 * Validate a percentage value is between 0 and 100 (inclusive)
 */
export function validatePercentage(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100;
}

/**
 * Calculate service charge based on config and subtotal
 * @param config - Service charge configuration
 * @param subtotal - Cart subtotal before tax (must be >= 0)
 * @returns Service charge amount in THB
 */
export function calcServiceCharge(config: ServiceChargeConfig, subtotal: number): number {
  if (!config.enabled || subtotal < 0) return 0;
  
  if (config.mode === 'percentage') {
    return subtotal * (config.value / 100);
  }
  
  // Fixed mode
  return config.value > 0 ? config.value : 0;
}
