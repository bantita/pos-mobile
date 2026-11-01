// Types สำหรับประเภทสมาชิก (Member Type) — แยกจากระดับสมาชิก (MemberLevel)
// ระดับ = tier ตามยอดซื้อ (auto-upgrade), ประเภท = กลุ่มลูกค้าที่ร้านกำหนดเอง เช่น ลูกค้าทั่วไป / พนักงาน

/** คีย์สีของประเภทสมาชิก — map เป็น token จริงใน constants/memberTypeColors.ts (ไม่เก็บ hex) */
export type MemberTypeColorKey = 'gray' | 'blue' | 'green' | 'orange' | 'red' | 'purple';

/** สถานะประเภทสมาชิก */
export type MemberTypeStatus = 'active' | 'inactive';

/** ประเภทสมาชิก */
export interface MemberType {
  id: string;
  /** ชื่อประเภท เช่น "ลูกค้าทั่วไป", "พนักงาน" */
  name: string;
  /** รายละเอียด */
  description?: string;
  /** สี (token key) */
  color: MemberTypeColorKey;
  /** ส่วนลดอัตโนมัติ (%) ทั้งบิล — 0 = ไม่มีส่วนลด */
  discountPercent: number;
  /** ได้รับคะแนนสะสมหรือไม่ */
  earnPoints: boolean;
  /** ตัวคูณคะแนน (1 = ปกติ) */
  pointMultiplier: number;
  /** ประเภทเริ่มต้น (มีได้ 1 ประเภทเท่านั้น) */
  isDefault: boolean;
  /** สถานะ */
  status: MemberTypeStatus;
  createdAt: string;
  updatedAt: string;
}

/** ข้อมูลสิทธิประโยชน์ที่ใช้คำนวณตอนขาย (pure helpers / engine adapter) */
export type MemberTypeBenefit = Pick<MemberType, 'id' | 'name' | 'discountPercent' | 'earnPoints' | 'pointMultiplier'>;
