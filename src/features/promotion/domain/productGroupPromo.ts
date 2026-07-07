// Types สำหรับโปรโมชั่นกลุ่มสินค้า (Product Group Promotion)

/** สถานะโปรโมชั่นกลุ่มสินค้า */
export type ProductGroupPromoStatus = 'draft' | 'active' | 'expired' | 'disabled';

/** ประเภทส่วนลดของโปรโมชั่นกลุ่มสินค้า */
export type ProductGroupDiscountType = 'set_price' | 'fixed_amount' | 'percent' | 'free_product';

/** ข้อมูลโปรโมชั่นกลุ่มสินค้า */
export interface ProductGroupPromotion {
  id: string;
  /** ชื่อโปรโมชั่น */
  name: string;
  /** วันที่เริ่มต้น (ISO date) */
  startDate: string;
  /** วันที่สิ้นสุด (ISO date), undefined = ไม่กำหนดวันสิ้นสุด */
  endDate?: string;
  /** ไม่กำหนดวันสิ้นสุด */
  noEndDate: boolean;
  /** รหัสสาขา/คลังสินค้า */
  branchId: string;
  /** รายละเอียดโปรโมชั่น */
  description?: string;
  /** รายการสินค้าในกลุ่ม (min 2, max 200) */
  products: ProductGroupItem[];
  /** ยอดซื้อขั้นต่ำทั้งบิล (0 = ไม่มีขั้นต่ำ, max 999,999.99) */
  minBillTotal: number;
  /** ประเภทส่วนลด */
  discountType: ProductGroupDiscountType;
  /** ค่าส่วนลดตามประเภท */
  discountValue: number;
  /** รายการสินค้าแถม (1–10 items, เมื่อ discountType = 'free_product') */
  freeProducts: FreeProductItem[];
  /** สถานะโปรโมชั่น */
  status: ProductGroupPromoStatus;
  /** วันที่สร้าง (ISO date) */
  createdAt: string;
  /** ผู้สร้าง */
  createdBy: string;
  /** รหัสร้านค้า */
  shopId: string;
}

/** สินค้าในกลุ่มโปรโมชั่น */
export interface ProductGroupItem {
  /** รหัสสินค้า */
  productId: string;
  /** รหัสสินค้า (barcode/SKU) */
  productCode: string;
  /** ชื่อสินค้า */
  productName: string;
  /** จำนวน (1–999) */
  quantity: number;
  /** ราคาต่อหน่วย */
  unitPrice: number;
}

/** สินค้าที่แถม */
export interface FreeProductItem {
  /** รหัสสินค้า */
  productId: string;
  /** รหัสสินค้า (barcode/SKU) */
  productCode: string;
  /** ชื่อสินค้า */
  productName: string;
  /** จำนวนที่แถม (1–999) */
  quantity: number;
  /** ราคาต่อหน่วย */
  unitPrice: number;
}
