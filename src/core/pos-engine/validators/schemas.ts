import { CalculationRequest } from '@/core/pos-engine/types/inputs';
import { ValidationResult, ValidationError } from '@/core/pos-engine/types/internal';

export function validateInput(request: CalculationRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // storeCode required
  if (!request.storeCode || request.storeCode.trim() === '') {
    errors.push({ field: 'storeCode', message: 'storeCode is required', code: 'REQUIRED' });
  }

  // businessDateTime required and valid ISO
  if (!request.businessDateTime || request.businessDateTime.trim() === '') {
    errors.push({ field: 'businessDateTime', message: 'businessDateTime is required', code: 'REQUIRED' });
  } else if (isNaN(Date.parse(request.businessDateTime))) {
    errors.push({ field: 'businessDateTime', message: 'businessDateTime must be valid ISO 8601', code: 'INVALID_FORMAT' });
  }

  // cartItems min 1
  if (!request.cartItems || request.cartItems.length === 0) {
    errors.push({ field: 'cartItems', message: 'cartItems must have at least 1 item', code: 'MIN_LENGTH' });
  } else {
    request.cartItems.forEach((item, i) => {
      if (!item.lineId) errors.push({ field: `cartItems[${i}].lineId`, message: 'lineId is required', code: 'REQUIRED' });
      if (!item.itemCode) errors.push({ field: `cartItems[${i}].itemCode`, message: 'itemCode is required', code: 'REQUIRED' });
      if (item.quantity <= 0) errors.push({ field: `cartItems[${i}].quantity`, message: 'quantity must be > 0', code: 'INVALID_VALUE' });
      if (item.unitPrice < 0) errors.push({ field: `cartItems[${i}].unitPrice`, message: 'unitPrice must be >= 0', code: 'INVALID_VALUE' });
    });
  }

  // subtotal >= 0
  if (request.subtotal < 0) {
    errors.push({ field: 'subtotal', message: 'subtotal must be >= 0', code: 'INVALID_VALUE' });
  }

  // pointUsageRequest.points > 0 if provided
  if (request.pointUsageRequest) {
    if (request.pointUsageRequest.points <= 0) {
      errors.push({ field: 'pointUsageRequest.points', message: 'points must be > 0', code: 'INVALID_VALUE' });
    }
  }

  // redeemRequest.pointCost > 0 if provided
  if (request.redeemRequest) {
    if (request.redeemRequest.pointCost <= 0) {
      errors.push({ field: 'redeemRequest.pointCost', message: 'pointCost must be > 0', code: 'INVALID_VALUE' });
    }
  }

  // promotionCandidates validation
  if (request.promotionCandidates) {
    request.promotionCandidates.forEach((promo, i) => {
      if (!promo.promotionId) errors.push({ field: `promotionCandidates[${i}].promotionId`, message: 'promotionId is required', code: 'REQUIRED' });
      if (promo.priority < 0) errors.push({ field: `promotionCandidates[${i}].priority`, message: 'priority must be >= 0', code: 'INVALID_VALUE' });
      if (promo.startDate && promo.endDate && new Date(promo.startDate) > new Date(promo.endDate)) {
        errors.push({ field: `promotionCandidates[${i}].endDate`, message: 'endDate must be >= startDate', code: 'INVALID_DATE_RANGE' });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
