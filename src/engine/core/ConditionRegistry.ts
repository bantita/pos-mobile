import type { ConditionEvaluator } from '../types';

/**
 * Registry for condition evaluators.
 * Allows registering and retrieving evaluators by their condition type.
 */
export class ConditionRegistry {
  private evaluators: Map<string, ConditionEvaluator> = new Map();

  register(evaluator: ConditionEvaluator): void {
    this.evaluators.set(evaluator.type, evaluator);
  }

  get(type: string): ConditionEvaluator | undefined {
    return this.evaluators.get(type);
  }

  has(type: string): boolean {
    return this.evaluators.has(type);
  }

  getAll(): ConditionEvaluator[] {
    return Array.from(this.evaluators.values());
  }
}
