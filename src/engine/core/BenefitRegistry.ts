import type { BenefitCalculator } from '../types';

/**
 * Registry for benefit calculators.
 * Allows registering and retrieving calculators by their benefit type.
 */
export class BenefitRegistry {
  private calculators: Map<string, BenefitCalculator> = new Map();

  register(calculator: BenefitCalculator): void {
    this.calculators.set(calculator.type, calculator);
  }

  get(type: string): BenefitCalculator | undefined {
    return this.calculators.get(type);
  }

  has(type: string): boolean {
    return this.calculators.has(type);
  }

  getAll(): BenefitCalculator[] {
    return Array.from(this.calculators.values());
  }
}
