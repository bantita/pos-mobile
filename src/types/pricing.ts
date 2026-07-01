/**
 * Pricing Types — ระบบกำหนดราคา
 * ราคากลาง / ราคาสาขา / ถาวร / ชั่วคราว
 */

/** ประเภทเอกสารราคา */
export type PricingScope = 'central' | 'branch';

/** ประเภทราคา */
export type PricingDuration = 'permanent' | 'temporary';

/** สถานะเอกสาร */
export type PricingDocStatus = 'draft' | 'active' | 'expired' | 'cancelled';

/** รายการสินค้าในเอกสารราคา */
export interface PricingItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  /** ราคาทุนอ้างอิง */
  costPrice: number;
  /** ราคาขายเดิม (จาก master) */
  originalPrice: number;
  /** ราคาขายใหม่ */
  newPrice: number;
  /** หมายเหตุ */
  remark?: string;
}

/** เอกสารกำหนดราคา */
export interface PricingDocument {
  id: string;
  /** เลขที่เอกสาร (auto: PRC-YYYYMMDD-XXX) */
  docNo: string;
  /** ชื่อเอกสาร */
  name: string;
  /** คำอธิบาย */
  description?: string;
  /** ขอบเขต: กลาง หรือ สาขา */
  scope: PricingScope;
  /** สาขาที่ใช้ (ถ้า scope=branch) */
  branchId?: string;
  branchName?: string;
  /** ประเภท: ถาวร หรือ ชั่วคราว */
  duration: PricingDuration;
  /** วันที่เริ่มมีผล (ทั้ง 2 ประเภทต้องมี) */
  effectiveDate: string;
  /** วันที่สิ้นสุด (เฉพาะ temporary) */
  expiryDate?: string;
  /** สถานะ */
  status: PricingDocStatus;
  /** รายการสินค้า */
  items: PricingItem[];
  /** ผู้สร้าง */
  createdBy: string;
  /** วันที่สร้าง */
  createdAt: string;
  /** แก้ไขล่าสุด */
  updatedAt?: string;
  /** copy มาจากเอกสารไหน */
  copiedFrom?: string;
}

/** ราคาที่ POS ใช้จริง (คำนวณจาก priority) */
export interface ResolvedPrice {
  productId: string;
  productName: string;
  /** ราคาที่ใช้จริง */
  price: number;
  /** มาจากเอกสารไหน */
  sourceDocNo: string;
  sourceType: PricingScope;
  sourceDuration: PricingDuration;
}
