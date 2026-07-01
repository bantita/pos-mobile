import { PromotionConfig } from '../types/inputs';
import { PromotionStatus } from '../types/enums';
import { AuditTrailBuilder } from '../audit/trailBuilder';

export function filterActivePromotions(
  candidates: PromotionConfig[],
  businessDateTime: string,
  audit: AuditTrailBuilder
): PromotionConfig[] {
  const now = new Date(businessDateTime);
  const active: PromotionConfig[] = [];

  for (const promo of candidates) {
    if (promo.status !== PromotionStatus.ACTIVE) {
      audit.add(promo.promotionId, 'FILTERED', `Status is ${promo.status}, not ACTIVE`);
      continue;
    }
    if (new Date(promo.startDate) > now) {
      audit.add(promo.promotionId, 'FILTERED', `Start date ${promo.startDate} is in the future`);
      continue;
    }
    if (new Date(promo.endDate) < now) {
      audit.add(promo.promotionId, 'FILTERED', `End date ${promo.endDate} is in the past`);
      continue;
    }
    active.push(promo);
  }

  return active;
}
