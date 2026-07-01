// Types สำหรับโปรโมชั่นสินค้าร่วม (Bundle Promotion)

import { FreeProductItem } from './productGroupPromo';

/** สถานะโปรโมชั่นสินค้าร่วม */
export type BundlePromoStatus = 'draft' | 'active' | 'expired' | 'disabled';

/** ประเภทส่วนลดของโปรโมชั่นสินค้าร่วม */
export type BundleDiscountType = 'set_price' | 'fixed_amount' | 'percent' | 'free_product';

/** ขอบเขตสาขาของโปรโมชั่นสินค้าร่วม */
export type BundleBranchScope = 'all' | 'selected';

/** ข้อมูลโปรโมชั่นสินค้าร่วม */
export interface BundlePromotion {
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
  branchScope: BundleBranchScope;
  /** รหัสสาขาที่เลือก (เมื่อ branchScope = 'selected') */
  branchIds?: string[];
  /** รายละเอียดโปรโมชั่น */
  description?: string;
  /** รายการสินค้าร่วม (min 2, max 50) */
  products: BundleProductItem[];
  /** ยอดซื้อขั้นต่ำทั้งบิล */
  minBillTotal: number;
  /** ประเภทส่วนลด */
  discountType: BundleDiscountType;
  /** ค่าส่วนลดตามประเภท */
  discountValue: number;
  /** รายการสินค้าแถม (1–10 items, เมื่อ discountType = 'free_product') */
  freeProducts: FreeProductItem[];
  /** สถานะโปรโมชั่น */
  status: BundlePromoStatus;
  /** วันที่สร้าง (ISO date) */
  createdAt: string;
  /** ผู้สร้าง */
  createdBy: string;
  /** รหัสร้านค้า */
  shopId: string;
}

/** สินค้าในกลุ่มสินค้าร่วม */
export interface BundleProductItem {
  /** รหัสสินค้า */
  productId: string;
  /** รหัสสินค้า (barcode/SKU) */
  productCode: string;
  /** ชื่อสินค้า */
  productName: string;
  /** จำนวน */
  quantity: number;
  /** ราคาต่อหน่วย */
  unitPrice: number;
}
