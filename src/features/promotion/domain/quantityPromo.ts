// Types สำหรับโปรโมชั่นตามจำนวนสินค้า (Quantity Promotion)

/** สถานะโปรโมชั่นตามจำนวน */
export type QuantityPromoStatus = 'draft' | 'active' | 'expired' | 'disabled';

/** ขอบเขตสาขาของโปรโมชั่นตามจำนวน */
export type QuantityBranchScope = 'all' | 'selected';

/** ข้อมูลโปรโมชั่นตามจำนวนสินค้า */
export interface QuantityPromotion {
  id: string;
  /** ชื่อโปรโมชั่น */
  name: string;
  /** วันที่เริ่มต้น (ISO date) */
  startDate: string;
  /** วันที่สิ้นสุด (ISO date), undefined = ไม่กำหนดวันสิ้นสุด */
  endDate?: string;
  /** ไม่กำหนดวันสิ้นสุด */
  noEndDate: boolean;
  /** ขอบเขตสาขา: 'all' = ทุกสาขา, 'selected' = เลือกสาขา */
  branchScope: QuantityBranchScope;
  /** รหัสสาขาที่เลือก (เมื่อ branchScope = 'selected') */
  branchIds?: string[];
  /** รายละเอียดโปรโมชั่น */
  description?: string;
  /** รายการสินค้าที่ใช้เงื่อนไข (min 1) */
  products: QuantityProductItem[];
  /** ช่วงจำนวน (1–10 tiers) */
  tiers: QuantityTier[];
  /** สถานะโปรโมชั่น */
  status: QuantityPromoStatus;
  /** วันที่สร้าง (ISO date) */
  createdAt: string;
  /** ผู้สร้าง */
  createdBy: string;
  /** รหัสร้านค้า */
  shopId: string;
}

/** สินค้าในโปรโมชั่นตามจำนวน */
export interface QuantityProductItem {
  /** รหัสสินค้า */
  productId: string;
  /** รหัสสินค้า (barcode/SKU) */
  productCode: string;
  /** ชื่อสินค้า */
  productName: string;
  /** ราคาขายปกติ */
  sellingPrice: number;
}

/** ช่วงจำนวน (tier) สำหรับส่วนลดตามจำนวน */
export interface QuantityTier {
  /** รหัส tier */
  id: string;
  /** จำนวนเริ่มต้น (min 1) */
  minQty: number;
  /** จำนวนสิ้นสุด (max 9,999) */
  maxQty: number;
  /** อัตราส่วนลดเปอร์เซ็นต์ต่อชิ้น (0.01–99.99) */
  discountPerUnit: number;
}
