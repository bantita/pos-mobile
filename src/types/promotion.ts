// Types สำหรับ M07 Promotion Engine

/** ประเภทโปรโมชั่น */
export type PromoType =
  | 'percent'
  | 'fixed'
  | 'coupon'
  | 'member_price'
  | 'buy_x_get_y'
  | 'mix_match'
  | 'happy_hour';

/** สถานะโปรโมชั่น */
export type PromoStatus = 'draft' | 'active' | 'expired' | 'disabled';

/** ข้อมูลโปรโมชั่น */
export interface Promotion {
  id: string;
  /** รหัสโปรโมชั่น */
  promoCode: string;
  /** ชื่อโปรโมชั่น */
  name: string;
  /** รายละเอียด */
  description: string;
  /** ประเภทโปรโมชั่น */
  type: PromoType;
  /** สถานะ */
  status: PromoStatus;

  // --- กลุ่มลูกค้าที่ใช้ได้ ---

  /** ใครใช้โปรนี้ได้: 'all' = ทุกคน, 'member_only' = เฉพาะสมาชิก, 'non_member' = ไม่ใช่สมาชิก */
  targetCustomer?: 'all' | 'member_only' | 'non_member';
  /** ประเภทสมาชิก: 'all' = ทุกคน, 'new' = สมาชิกใหม่ (ภายใน 30 วัน), 'existing' = สมาชิกเก่า */
  memberType?: 'all' | 'new' | 'existing';
  /** จำนวนวันที่ถือว่า "สมาชิกใหม่" (default 30) */
  newMemberDays?: number;

  // --- เงื่อนไข ---

  /** วันเริ่มต้น (ISO date) */
  startDate: string;
  /** วันสิ้นสุด (ISO date) */
  endDate: string;
  /** เวลาเริ่มต้น HH:mm (สำหรับ Happy Hour) */
  startTime?: string;
  /** เวลาสิ้นสุด HH:mm (สำหรับ Happy Hour) */
  endTime?: string;
  /** ยอดซื้อขั้นต่ำ (บาท) */
  minPurchase?: number;
  /** รหัสสินค้าที่ใช้ได้ (ว่าง = ทุกสินค้า) */
  applicableProducts?: string[];
  /** หมวดหมู่ที่ใช้ได้ */
  applicableCategories?: string[];
  /** ระดับสมาชิกที่ใช้ได้ */
  applicableLevels?: string[];

  // --- ส่วนลด ---

  /** ส่วนลดเปอร์เซ็นต์ */
  discountPercent?: number;
  /** ส่วนลดจำนวนเงิน (บาท) */
  discountAmount?: number;
  /** ส่วนลดสูงสุด (cap สำหรับ percent) */
  maxDiscount?: number;

  // --- คูปอง ---

  /** รหัสคูปอง */
  couponCode?: string;
  /** จำนวนสิทธิ์ทั้งหมด */
  couponLimit?: number;
  /** จำนวนสิทธิ์ที่ใช้ไปแล้ว */
  couponUsed?: number;

  // --- ซื้อ X แถม Y ---

  /** จำนวนที่ต้องซื้อ */
  buyQty?: number;
  /** จำนวนที่แถม */
  getQty?: number;
  /** รหัสสินค้าที่แถม */
  getProductId?: string;

  // --- การซ้อนโปร ---

  /** อนุญาตให้ใช้ร่วมกับโปรอื่นได้ */
  stackable: boolean;
  /** ลำดับความสำคัญ (ต่ำ = คำนวณก่อน) */
  priority: number;

  // --- ข้อมูลสถิติ ---

  /** จำนวนครั้งที่ถูกใช้ */
  usageCount: number;
  /** ยอดส่วนลดรวมที่ให้ไป (บาท) */
  totalDiscountGiven: number;
  /** วันที่สร้าง (ISO date) */
  createdAt: string;
  /** ผู้สร้าง */
  createdBy: string;
  /** รหัสร้านค้า */
  shopId: string;
}

/** ประวัติการใช้คูปอง */
export interface CouponUsage {
  id: string;
  /** รหัสโปรโมชั่น */
  promotionId: string;
  /** รหัสคูปอง */
  couponCode: string;
  /** รหัสสมาชิก (ถ้ามี) */
  memberId?: string;
  /** เลขที่บิลขาย */
  saleNo: string;
  /** ยอดส่วนลดที่ได้ (บาท) */
  discountAmount: number;
  /** วันที่ใช้ (ISO date) */
  usedAt: string;
}

/** ส่วนลดที่คำนวณได้จากโปรโมชั่น (ผลลัพธ์จาก engine) */
export interface AppliedDiscount {
  /** รหัสโปรโมชั่นที่ใช้ */
  promotionId: string;
  /** ชื่อโปรโมชั่น */
  promoName: string;
  /** ประเภทโปรโมชั่น */
  type: PromoType;
  /** ยอดส่วนลด (บาท) */
  discountAmount: number;
  /** ลดที่บิลรวม หรือ รายสินค้า */
  appliedTo: 'bill' | 'item';
  /** รหัสสินค้า (กรณี appliedTo = 'item') */
  itemId?: string;
}
