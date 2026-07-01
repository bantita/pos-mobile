// Types สำหรับ Member Promotion Engine (โปรโมชั่นสมาชิก)

/** ประเภทโปรโมชั่นสมาชิก (18 แบบ) */
export type MemberPromoType =
  | 'member_price'        // 1. ราคาสมาชิก
  | 'level_discount'      // 2. ส่วนลดตามระดับ
  | 'birthday'            // 3. วันเกิด
  | 'welcome'             // 4. สมัครใหม่
  | 'level_upgrade'       // 5. เลื่อนระดับ
  | 'bonus_points'        // 6. แต้มสะสมพิเศษ
  | 'points_to_discount'  // 7. แต้มแลกส่วนลด
  | 'points_to_product'   // 8. แต้มแลกสินค้า
  | 'spend_milestone'     // 9. ยอดซื้อสะสม
  | 'visit_milestone'     // 10. จำนวนครั้งซื้อ
  | 'segment'             // 11. เฉพาะกลุ่ม
  | 'win_back'            // 12. ลูกค้ากลับมา
  | 'favorite_product'    // 13. ตามสินค้าโปรด
  | 'avg_spend'           // 14. ตามยอดซื้อเฉลี่ย
  | 'vip_exclusive'       // 15. VIP เท่านั้น
  | 'stamp'              // 16. Stamp Campaign
  | 'referral'           // 17. แนะนำเพื่อน
  | 'anniversary';       // 18. ครบรอบสมาชิก

export type MemberPromoStatus = 'draft' | 'active' | 'paused' | 'expired';

/** Reward ที่ได้จากโปรโมชั่น */
export interface PromoReward {
  type: 'discount_percent' | 'discount_amount' | 'coupon' | 'points' | 'free_product' | 'point_multiplier';
  value: number;           // % / บาท / จำนวนแต้ม / x multiplier
  productId?: string;      // สำหรับ free_product
  couponCode?: string;     // สำหรับ coupon
  maxDiscount?: number;    // cap
}

/** ข้อมูลโปรโมชั่นสมาชิก */
export interface MemberPromotion {
  id: string;
  code: string;
  name: string;
  description: string;
  type: MemberPromoType;
  status: MemberPromoStatus;

  // เงื่อนไข
  startDate: string;
  endDate: string;
  /** ใครใช้โปรนี้ได้: 'all' = ทุกคน, 'member_only' = เฉพาะสมาชิก, 'non_member' = ไม่ใช่สมาชิก */
  targetCustomer?: 'all' | 'member_only' | 'non_member';
  /** ประเภทสมาชิก: 'all' = ทุกคน, 'new' = สมาชิกใหม่, 'existing' = สมาชิกเก่า */
  memberType?: 'all' | 'new' | 'existing';
  /** จำนวนวันที่ถือว่า "สมาชิกใหม่" (default 30) */
  newMemberDays?: number;
  applicableLevels?: string[];     // ระดับสมาชิกที่ใช้ได้
  applicableProducts?: string[];
  applicableCategories?: string[];
  applicableBranches?: string[];   // สาขาที่ใช้ได้
  segmentId?: string;

  // เงื่อนไขเฉพาะประเภท
  minSpend?: number;               // ยอดซื้อขั้นต่ำ
  minVisits?: number;              // จำนวนครั้งขั้นต่ำ
  inactiveDays?: number;           // วันไม่ซื้อ (win_back)
  stampTarget?: number;            // เป้าหมายแสตมป์
  stampPerAmount?: number;         // ทุกกี่บาทได้ 1 แสตมป์

  // Reward
  rewards: PromoReward[];

  // สถิติ
  usageCount: number;
  totalRewardGiven: number;

  // Meta
  createdAt: string;
  createdBy: string;
  shopId: string;
  priority: number;
}

/** Stamp Card ของสมาชิก */
export interface MemberStampCard {
  id: string;
  memberId: string;
  promotionId: string;
  currentStamps: number;
  targetStamps: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

/** ประวัติการใช้โปรโมชั่นสมาชิก */
export interface MemberPromoUsage {
  id: string;
  memberId: string;
  promotionId: string;
  saleNo?: string;
  rewardType: string;
  rewardValue: number;
  usedAt: string;
}
