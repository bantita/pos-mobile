import { ExplainEntry } from '../types/outputs';

type ExplainAction = 'FILTERED' | 'EVALUATED' | 'MATCHED' | 'REJECTED' | 'APPLIED';

export class AuditTrailBuilder {
  private entries: ExplainEntry[] = [];
  private stepCounter = 0;

  add(promotionId: string, action: ExplainAction, reason: string, details?: Record<string, any>): void {
    this.stepCounter++;
    this.entries.push({ step: this.stepCounter, promotionId, action, reason, details });
  }

  addSystem(action: ExplainAction, reason: string, details?: Record<string, any>): void {
    this.stepCounter++;
    this.entries.push({ step: this.stepCounter, action, reason, details });
  }

  build(): ExplainEntry[] {
    return [...this.entries];
  }

  getStepCount(): number {
    return this.stepCounter;
  }
}
