/**
 * Coupon Management Types
 * Data models for coupon campaigns, codes, and service interfaces.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum CouponStatus {
  ACTIVE = 'ACTIVE',       // ขาย/แจก
  USED = 'USED',           // ใช้แล้ว
  EXPIRED = 'EXPIRED',     // หมดอายุ
  CANCELLED = 'CANCELLED', // ยกเลิก
}

export type LimitType = 'per_bill' | 'per_customer' | 'per_group';

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface LimitControl {
  totalUsageLimit?: number;         // จำนวนครั้งทั้งหมด
  perBillLimit?: number;            // จำกัดต่อบิล
  perCustomerLimit?: number;        // จำกัดต่อลูกค้า
  allowedCustomerGroups?: string[]; // กลุ่มลูกค้า Limit
  limitType: LimitType;             // ประเภท Limit
}

export interface CouponCampaign {
  id: string;
  name: string;
  promotionId: string;       // Linked PromotionConfig ID
  prefix: string;            // Code prefix (e.g. "NVSC")
  totalQuantity: number;
  expiryDate: string;        // ISO 8601
  limits: LimitControl;
  sharingPercent: number;    // %ส่วนแบ่ง
  contactPerson: string;     // ผู้ติดต่อ
  remark: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface StatusTransition {
  fromStatus: CouponStatus | 'NEW';
  toStatus: CouponStatus;
  timestamp: string;
  actor: string;             // User ID or 'SYSTEM'
  reason?: string;
}

export interface CouponCode {
  code: string;              // Unique PK (e.g. "NVSC000FFC")
  campaignId: string;
  status: CouponStatus;
  expiryDate: string;
  usageDate?: string;
  billNumber?: string;
  customerId?: string;
  createdAt: string;
  statusHistory: StatusTransition[];
}

// ─── Service Interfaces ───────────────────────────────────────────────────────

export interface ValidationContext {
  memberId?: string;
  memberLevel?: string;
  storeCode: string;
  businessDateTime: string;
  currentBillCoupons?: string[];   // coupons already applied in this bill
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  errorCode?: string;
  campaign?: CouponCampaign;
  couponCode?: CouponCode;
}

export interface RedemptionResult {
  success: boolean;
  reason?: string;
}

export interface ImportRow {
  code: string;
  status: string;
  expiryDate: string;
  usageDate?: string;
  billNumber?: string;
  customerRef?: string;
}

export interface ImportError {
  row: number;
  code?: string;
  reason: string;
}

export interface ImportResult {
  imported: CouponCode[];
  skipped: ImportError[];
  summary: { total: number; imported: number; skipped: number; errors: number };
}

export interface ExportFilter {
  campaignId?: string;
  status?: CouponStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface ExportRow {
  couponCode: string;
  campaignName: string;
  status: string;
  expiryDate: string;
  usageDate: string;
  billNumber: string;
  customerRef: string;
}

export interface GenerateOptions {
  prefix: string;
  quantity: number;
  existingCodes: Set<string>;
}

export interface GenerateResult {
  codes: string[];
  collisionRetries: number;
}

export interface CampaignStats {
  total: number;
  active: number;
  used: number;
  expired: number;
  cancelled: number;
}

export interface UsageCounts {
  totalUsed: number;
  perBillUsed: number;
  perCustomerUsed: number;
}

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const COUPON_ERRORS = {
  COUPON_NOT_FOUND: 'คูปองไม่ถูกต้อง',
  COUPON_ALREADY_USED: 'คูปองนี้ถูกใช้แล้ว',
  COUPON_EXPIRED: 'คูปองหมดอายุ',
  COUPON_CANCELLED: 'คูปองถูกยกเลิก',
  LIMIT_TOTAL_EXCEEDED: 'คูปองหมดสิทธิ์ (ใช้ครบจำนวนแล้ว)',
  LIMIT_PER_BILL_EXCEEDED: 'ใช้คูปองเกินจำนวนต่อบิล',
  LIMIT_PER_CUSTOMER_EXCEEDED: 'ใช้คูปองเกินจำนวนต่อลูกค้า',
  LIMIT_GROUP_NOT_ALLOWED: 'กลุ่มลูกค้าไม่อยู่ในเงื่อนไข',
} as const;

export type CouponErrorCode = keyof typeof COUPON_ERRORS;
