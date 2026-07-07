// Types สำหรับ M06 CRM & Loyalty

/** สถานะสมาชิก */
export type MemberStatus = 'active' | 'suspended' | 'cancelled';

/** เพศ */
export type Gender = 'male' | 'female' | 'other' | 'not_specified';

/** สถานะแต้ม */
export type PointStatus = 'earned' | 'used' | 'expired' | 'adjusted' | 'cancelled';

/** ระดับสมาชิก */
export type MemberLevel = 'member' | 'silver' | 'gold' | 'platinum' | 'vip';

/** ประเภทรายการคะแนน */
export type PointTransactionType = 'earn' | 'redeem' | 'expire' | 'adjust';

/** ประเภทอ้างอิงรายการคะแนน */
export type PointRefType = 'sale' | 'manual' | 'system';

/** ข้อมูลสมาชิก */
export interface Member {
  id: string;
  /** เลขสมาชิก (auto-gen: MEM-XXXXXX) */
  memberNo: string;
  /** เบอร์โทรศัพท์ (ไม่ซ้ำกัน) */
  phone: string;
  /** ชื่อสมาชิก */
  name: string;
  /** วันเกิด (ISO date) */
  birthday?: string;
  /** เพศ */
  gender?: Gender;
  /** อีเมล */
  email?: string;
  /** ที่อยู่ */
  address?: string;
  /** เลขประจำตัวผู้เสียภาษี */
  taxId?: string;
  /** ระดับสมาชิก */
  level: MemberLevel;
  /** ยอดคะแนนคงเหลือ */
  pointBalance: number;
  /** ยอดซื้อสะสมทั้งหมด (บาท) */
  totalSpent: number;
  /** จำนวนบิลทั้งหมด */
  totalBills?: number;
  /** วันที่ซื้อล่าสุด */
  lastPurchaseDate?: string;
  /** วันที่สมัครสมาชิก (ISO date) */
  joinDate: string;
  /** สถานะสมาชิก */
  status?: MemberStatus;
  /** สถานะใช้งาน (backward compat) */
  isActive: boolean;
  /** หมายเหตุ */
  note?: string;
  /** รหัสร้านค้า */
  shopId: string;
  /** รหัสสาขา */
  branchId: string;
}

/** รายการคะแนน (ได้รับ/ใช้/หมดอายุ/ปรับ) */
export interface PointTransaction {
  id: string;
  /** รหัสสมาชิก */
  memberId: string;
  /** ประเภทรายการ */
  type: PointTransactionType;
  /** จำนวนคะแนน (+ ได้รับ, - ใช้/หมดอายุ) */
  points: number;
  /** ยอดคะแนนหลังทำรายการ */
  balanceAfter: number;
  /** ประเภทอ้างอิง */
  refType: PointRefType;
  /** เลขอ้างอิง (เลขบิลขาย หรือ เลขปรับ) */
  refNo: string;
  /** รายละเอียด */
  description: string;
  /** วันหมดอายุคะแนน (ISO date) */
  expireDate?: string;
  /** วันที่สร้างรายการ (ISO date) */
  createdAt: string;
  /** ผู้สร้างรายการ */
  createdBy: string;
}

/** การตั้งค่าระบบคะแนน */
export interface PointConfig {
  /** อัตราสะสมคะแนน: กี่บาทได้ 1 คะแนน */
  earnRate: number;
  /** อัตราแลกคะแนน: 1 คะแนน = กี่บาท */
  redeemRate: number;
  /** จำนวนคะแนนขั้นต่ำที่ใช้แลกได้ */
  minRedeemPoints: number;
  /** คะแนนหมดอายุหลังกี่วัน (0 = ไม่หมดอายุ) */
  pointExpireDays: number;
}

/** ตั้งค่าระดับสมาชิก */
export interface MemberLevelConfig {
  level: MemberLevel;
  label: string;
  minSpent: number;
  minBills: number;
  discountPercent: number;
  earnMultiplier: number;
  expireDays: number;
  color: string;
}

/** Segment ลูกค้า */
export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  conditions: SegmentCondition[];
  memberCount: number;
  createdAt: string;
}

export interface SegmentCondition {
  field: 'lastPurchaseDate' | 'totalSpent' | 'totalBills' | 'level' | 'birthday' | 'joinDate';
  operator: 'gt' | 'lt' | 'eq' | 'between' | 'in' | 'daysAgo';
  value: string | number | string[];
}

/** Campaign */
export interface Campaign {
  id: string;
  name: string;
  description: string;
  channel: 'sms' | 'line' | 'email' | 'push';
  segmentId?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  scheduledAt?: string;
  sentAt?: string;
  targetCount: number;
  sentCount: number;
  openCount: number;
  message: string;
  createdAt: string;
  createdBy: string;
}

/** Wallet ลูกค้า */
export interface MemberWallet {
  memberId: string;
  balance: number;
  lastTopUpDate?: string;
}

export interface WalletTransaction {
  id: string;
  memberId: string;
  type: 'topup' | 'payment' | 'refund' | 'withdraw';
  amount: number;
  balanceAfter: number;
  refNo?: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

/** ประวัติการซื้อสมาชิก */
export interface MemberPurchaseHistory {
  id: string;
  memberId: string;
  saleNo: string;
  date: string;
  branchName: string;
  posName: string;
  cashierName: string;
  items: { productName: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  pointsEarned: number;
  pointsUsed: number;
  paymentMethod: string;
}
