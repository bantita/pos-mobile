// Types สำหรับฟอร์มสร้างโปรโมชั่นร้านค้า (Store Promotion Form)

/** ข้อมูลฟอร์มสร้างโปรโมชั่นร้านค้า */
export interface StorePromoFormData {
  /** ชื่อโปรโมชั่น (required) */
  name: string;
  /** วันที่เริ่มต้น (ISO date, required) */
  startDate: string;
  /** วันที่สิ้นสุด (ISO date, required unless noEndDate) */
  endDate?: string;
  /** ไม่กำหนดวันสิ้นสุด */
  noEndDate: boolean;
  /** ส่วนลดเปอร์เซ็นต์ */
  discountPercent: number;
  /** ราคาซื้อขั้นต่ำ (บาท) */
  minPurchase: number;
  /** รายละเอียดโปรโมชั่น */
  description?: string;
  /** รหัสสาขา/คลังสินค้า */
  branchId: string;
}
