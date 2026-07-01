// Utility functions สำหรับ validation โปรโมชั่นทุกประเภท

import { StorePromoFormData } from '../types/storePromo';
import { QuantityTier } from '../types/quantityPromo';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface OverlapResult {
  tierA: string; // tier id
  tierB: string; // tier id
}

export interface TierPreviewResult {
  tierId: string;
  sampleQty: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
}

// ─── Form Data Types (for validation input) ────────────────────────────────────

export interface ProductGroupFormData {
  name: string;
  startDate: string;
  endDate?: string;
  noEndDate: boolean;
  products: Array<{ productId: string; quantity: number; unitPrice: number }>;
  discountType: string; // 'set_price' | 'fixed_amount' | 'percent' | 'free_product' | ''
  discountValue: number;
  minBillTotal: number;
  freeProducts: Array<{ productId: string; quantity: number }>;
}

export interface BundleFormData {
  name: string;
  startDate: string;
  endDate?: string;
  noEndDate: boolean;
  products: Array<{ productId: string; quantity: number; unitPrice: number }>;
  discountType: string; // 'set_price' | 'fixed_amount' | 'percent' | 'free_product' | ''
  discountValue: number;
  minBillTotal: number;
  freeProducts: Array<{ productId: string; quantity: number }>;
}

export interface QuantityFormData {
  name: string;
  startDate: string;
  endDate?: string;
  noEndDate: boolean;
  products: Array<{ productId: string }>;
  tiers: QuantityTier[];
}

// ─── Validation Functions ──────────────────────────────────────────────────────

/**
 * Validate Store Promotion form
 * - name required (non-empty)
 * - startDate required
 * - endDate required if noEndDate is false
 * - discountPercent 1-99 (if provided)
 * - minPurchase >= 0
 */
export function validateStorePromoForm(form: StorePromoFormData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!form.name || form.name.trim() === '') {
    errors.push({ field: 'name', message: 'กรุณากรอกชื่อโปรโมชั่น' });
  }

  if (!form.startDate || form.startDate.trim() === '') {
    errors.push({ field: 'startDate', message: 'กรุณาระบุวันที่เริ่มต้น' });
  }

  if (!form.noEndDate && (!form.endDate || form.endDate.trim() === '')) {
    errors.push({ field: 'endDate', message: 'กรุณาระบุวันที่สิ้นสุด' });
  }

  if (form.discountPercent !== 0 && (form.discountPercent < 1 || form.discountPercent > 99)) {
    errors.push({ field: 'discountPercent', message: 'ส่วนลดต้องอยู่ระหว่าง 1-99%' });
  }

  if (form.minPurchase < 0) {
    errors.push({ field: 'minPurchase', message: 'ราคาขั้นต่ำต้องไม่น้อยกว่า 0' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Product Group Promotion form
 * - name, startDate required
 * - endDate required if noEndDate is false
 * - products: 2-200 items
 * - discountType must be selected
 * - discountValue based on type (set_price > 0, fixed_amount > 0, percent 1-99)
 * - minBillTotal: 0-999999.99
 * - freeProducts: 1-10 items with qty 1-999 each (when discountType = 'free_product')
 */
export function validateProductGroupForm(form: ProductGroupFormData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!form.name || form.name.trim() === '') {
    errors.push({ field: 'name', message: 'กรุณากรอกชื่อโปรโมชั่น' });
  }

  if (!form.startDate || form.startDate.trim() === '') {
    errors.push({ field: 'startDate', message: 'กรุณาระบุวันที่เริ่มต้น' });
  }

  if (!form.noEndDate && (!form.endDate || form.endDate.trim() === '')) {
    errors.push({ field: 'endDate', message: 'กรุณาระบุวันที่สิ้นสุด' });
  }

  if (form.products.length < 2) {
    errors.push({ field: 'products', message: 'กรุณาเลือกสินค้าอย่างน้อย 2 รายการ' });
  } else if (form.products.length > 200) {
    errors.push({ field: 'products', message: 'เลือกสินค้าได้สูงสุด 200 รายการ' });
  }

  if (!form.discountType || form.discountType === '') {
    errors.push({ field: 'discountType', message: 'กรุณาเลือกประเภทส่วนลด' });
  } else if (form.discountType !== 'free_product') {
    const discountValidation = validateDiscountValue(
      form.discountType as 'set_price' | 'fixed_amount' | 'percent',
      form.discountValue
    );
    if (!discountValidation.valid) {
      errors.push(...discountValidation.errors);
    }
  }

  if (form.minBillTotal < 0 || form.minBillTotal > 999999.99) {
    errors.push({ field: 'minBillTotal', message: 'ยอดซื้อขั้นต่ำต้องอยู่ระหว่าง 0-999,999.99 บาท' });
  }

  if (form.discountType === 'free_product') {
    if (form.freeProducts.length < 1) {
      errors.push({ field: 'freeProducts', message: 'กรุณาเลือกสินค้าแถมอย่างน้อย 1 รายการ' });
    } else if (form.freeProducts.length > 10) {
      errors.push({ field: 'freeProducts', message: 'เลือกสินค้าแถมได้สูงสุด 10 รายการ' });
    } else {
      for (let i = 0; i < form.freeProducts.length; i++) {
        const fp = form.freeProducts[i];
        if (fp.quantity < 1 || fp.quantity > 999) {
          errors.push({
            field: `freeProducts[${i}].quantity`,
            message: `จำนวนสินค้าแถมรายการที่ ${i + 1} ต้องอยู่ระหว่าง 1-999`,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Bundle Promotion form
 * - Same as product group but products: 2-50 items
 * - All required fields: name, startDate, endDate (unless noEndDate), discountType, products min 2
 */
export function validateBundleForm(form: BundleFormData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!form.name || form.name.trim() === '') {
    errors.push({ field: 'name', message: 'กรุณากรอกชื่อโปรโมชั่น' });
  }

  if (!form.startDate || form.startDate.trim() === '') {
    errors.push({ field: 'startDate', message: 'กรุณาระบุวันที่เริ่มต้น' });
  }

  if (!form.noEndDate && (!form.endDate || form.endDate.trim() === '')) {
    errors.push({ field: 'endDate', message: 'กรุณาระบุวันที่สิ้นสุด' });
  }

  if (form.products.length < 2) {
    errors.push({ field: 'products', message: 'กรุณาเลือกสินค้าอย่างน้อย 2 รายการ' });
  } else if (form.products.length > 50) {
    errors.push({ field: 'products', message: 'เลือกสินค้าได้สูงสุด 50 รายการ' });
  }

  if (!form.discountType || form.discountType === '') {
    errors.push({ field: 'discountType', message: 'กรุณาเลือกประเภทส่วนลด' });
  } else if (form.discountType !== 'free_product') {
    const discountValidation = validateDiscountValue(
      form.discountType as 'set_price' | 'fixed_amount' | 'percent',
      form.discountValue
    );
    if (!discountValidation.valid) {
      errors.push(...discountValidation.errors);
    }
  }

  if (form.minBillTotal < 0 || form.minBillTotal > 999999.99) {
    errors.push({ field: 'minBillTotal', message: 'ยอดซื้อขั้นต่ำต้องอยู่ระหว่าง 0-999,999.99 บาท' });
  }

  if (form.discountType === 'free_product') {
    if (form.freeProducts.length < 1) {
      errors.push({ field: 'freeProducts', message: 'กรุณาเลือกสินค้าแถมอย่างน้อย 1 รายการ' });
    } else if (form.freeProducts.length > 10) {
      errors.push({ field: 'freeProducts', message: 'เลือกสินค้าแถมได้สูงสุด 10 รายการ' });
    } else {
      for (let i = 0; i < form.freeProducts.length; i++) {
        const fp = form.freeProducts[i];
        if (fp.quantity < 1 || fp.quantity > 999) {
          errors.push({
            field: `freeProducts[${i}].quantity`,
            message: `จำนวนสินค้าแถมรายการที่ ${i + 1} ต้องอยู่ระหว่าง 1-999`,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Quantity Promotion form
 * - name, startDate required
 * - endDate required if noEndDate is false
 * - products: min 1 item
 * - tiers: 1-10, each with minQty >= 1, maxQty <= 9999, minQty <= maxQty, discountPerUnit 0.01-99.99
 */
export function validateQuantityForm(form: QuantityFormData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!form.name || form.name.trim() === '') {
    errors.push({ field: 'name', message: 'กรุณากรอกชื่อโปรโมชั่น' });
  }

  if (!form.startDate || form.startDate.trim() === '') {
    errors.push({ field: 'startDate', message: 'กรุณาระบุวันที่เริ่มต้น' });
  }

  if (!form.noEndDate && (!form.endDate || form.endDate.trim() === '')) {
    errors.push({ field: 'endDate', message: 'กรุณาระบุวันที่สิ้นสุด' });
  }

  if (form.products.length < 1) {
    errors.push({ field: 'products', message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' });
  }

  if (form.tiers.length < 1) {
    errors.push({ field: 'tiers', message: 'กรุณากำหนดช่วงจำนวนอย่างน้อย 1 ช่วง' });
  } else if (form.tiers.length > 10) {
    errors.push({ field: 'tiers', message: 'กำหนดช่วงจำนวนได้สูงสุด 10 ช่วง' });
  } else {
    for (let i = 0; i < form.tiers.length; i++) {
      const tier = form.tiers[i];

      if (tier.minQty < 1) {
        errors.push({
          field: `tiers[${i}].minQty`,
          message: `ช่วงที่ ${i + 1}: จำนวนเริ่มต้นต้องไม่น้อยกว่า 1`,
        });
      }

      if (tier.maxQty > 9999) {
        errors.push({
          field: `tiers[${i}].maxQty`,
          message: `ช่วงที่ ${i + 1}: จำนวนสิ้นสุดต้องไม่เกิน 9,999`,
        });
      }

      if (tier.minQty > tier.maxQty) {
        errors.push({
          field: `tiers[${i}].minQty`,
          message: `ช่วงที่ ${i + 1}: จำนวนเริ่มต้นต้องไม่เกินจำนวนสิ้นสุด`,
        });
      }

      if (tier.discountPerUnit < 0.01 || tier.discountPerUnit > 99.99) {
        errors.push({
          field: `tiers[${i}].discountPerUnit`,
          message: `ช่วงที่ ${i + 1}: อัตราส่วนลดต้องอยู่ระหว่าง 0.01-99.99%`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate discount value based on type
 * - percent: 1-99
 * - set_price: > 0
 * - fixed_amount: > 0
 */
export function validateDiscountValue(
  type: 'set_price' | 'fixed_amount' | 'percent',
  value: number
): ValidationResult {
  const errors: ValidationError[] = [];

  switch (type) {
    case 'percent':
      if (value < 1 || value > 99) {
        errors.push({ field: 'discountValue', message: 'ส่วนลด % ต้องอยู่ระหว่าง 1-99' });
      }
      break;
    case 'set_price':
      if (value <= 0) {
        errors.push({ field: 'discountValue', message: 'ราคาขายต้องมากกว่า 0' });
      }
      break;
    case 'fixed_amount':
      if (value <= 0) {
        errors.push({ field: 'discountValue', message: 'ส่วนลดเงินต้องมากกว่า 0' });
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Detect overlapping tiers
 * Return pairs of tier IDs that overlap
 * (tier A's minQty <= tier B's maxQty AND tier B's minQty <= tier A's maxQty)
 */
export function detectTierOverlaps(tiers: QuantityTier[]): OverlapResult[] {
  const overlaps: OverlapResult[] = [];

  for (let i = 0; i < tiers.length; i++) {
    for (let j = i + 1; j < tiers.length; j++) {
      const tierA = tiers[i];
      const tierB = tiers[j];

      if (tierA.minQty <= tierB.maxQty && tierB.minQty <= tierA.maxQty) {
        overlaps.push({ tierA: tierA.id, tierB: tierB.id });
      }
    }
  }

  return overlaps;
}

/**
 * Calculate tier preview for discount visualization
 * For each tier:
 * - sampleQty = middle of range (Math.floor((minQty + maxQty) / 2))
 * - originalPrice = basePrice
 * - discountedPrice = basePrice * (1 - discountPerUnit / 100)
 * - discountPercent = discountPerUnit
 */
export function calculateTierPreview(
  tiers: QuantityTier[],
  basePrice: number
): TierPreviewResult[] {
  return tiers.map((tier) => {
    const sampleQty = Math.floor((tier.minQty + tier.maxQty) / 2);
    const discountedPrice = basePrice * (1 - tier.discountPerUnit / 100);

    return {
      tierId: tier.id,
      sampleQty,
      originalPrice: basePrice,
      discountedPrice,
      discountPercent: tier.discountPerUnit,
    };
  });
}
