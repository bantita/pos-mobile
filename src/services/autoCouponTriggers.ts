/**
 * Auto Coupon Triggers (2H) — ตัวกระตุ้นคูปอง/แคมเปญอัตโนมัติ (in-app mock)
 *
 * สร้างคูปองใน promoStore + บันทึกแคมเปญลง communicationStore (เห็นใน Outbox หน้า 2A)
 * ทุก trigger ทำงานเฉพาะเมื่อ FEATURE_FLAGS.MOCK_LINE = true และ "idempotent"
 * (ยิงซ้ำสมาชิกคนเดิม/ระดับเดิม/ปีเดิม จะไม่สร้างซ้ำ)
 *
 * เมื่อปิด mock: จะเปลี่ยนไปเรียก lineApi.sendCoupon/broadcast ผ่าน backend แทน (ดู else ด้านล่าง)
 */
import { FEATURE_FLAGS } from '../config/featureFlags';
import { usePromoStore } from '../store/promoStore';
import { useCommunicationStore } from '../store/communicationStore';
import type { Member, MemberLevel } from '../types/member';
import type { Promotion } from '../types/promotion';

/** ชนิดของ trigger */
export type AutoCouponTriggerType = 'welcome' | 'levelup' | 'winback' | 'birthday';

/** คำนำหน้า promoCode ที่ระบบ auto-trigger สร้าง ใช้ตรวจ idempotent */
const AUTO_PREFIX = 'AUTO';

/** สร้าง key ที่ไม่ซ้ำสำหรับแต่ละ trigger + สมาชิก (+ มิติเพิ่ม เช่น ระดับ/ปี) */
const triggerKey = (type: AutoCouponTriggerType, memberId: string, extra?: string) =>
  `${AUTO_PREFIX}-${type.toUpperCase()}-${memberId}${extra ? `-${extra}` : ''}`;

/** ตรวจว่า trigger นี้เคยยิงแล้วหรือยัง (ดูจาก promoCode ที่เคยสร้าง) */
const alreadyFired = (code: string): boolean =>
  usePromoStore.getState().promotions.some(p => p.promoCode === code);

interface TriggerMeta {
  name: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  minPurchase?: number;
  message: string;
}

const META: Record<AutoCouponTriggerType, TriggerMeta> = {
  welcome: {
    name: 'คูปองต้อนรับสมาชิกใหม่',
    description: 'ส่วนลดต้อนรับสำหรับสมาชิกใหม่',
    discountAmount: 50,
    minPurchase: 200,
    message: 'ยินดีต้อนรับสู่สมาชิก! รับคูปองส่วนลด 50 บาท',
  },
  levelup: {
    name: 'ของรางวัลเลื่อนระดับ',
    description: 'รางวัลพิเศษเมื่อเลื่อนระดับสมาชิก',
    discountPercent: 10,
    minPurchase: 300,
    message: 'ยินดีด้วย! คุณเลื่อนระดับสมาชิก รับส่วนลด 10%',
  },
  winback: {
    name: 'คูปองดึงลูกค้ากลับ',
    description: 'สำหรับสมาชิกที่ไม่ได้ซื้อเกิน 30 วัน',
    discountPercent: 15,
    minPurchase: 150,
    message: 'คิดถึงคุณ! กลับมาช้อปรับส่วนลด 15%',
  },
  birthday: {
    name: 'คูปองวันเกิด',
    description: 'ของขวัญวันเกิดสำหรับสมาชิก',
    discountAmount: 100,
    minPurchase: 300,
    message: 'สุขสันต์วันเกิด! รับคูปองของขวัญ 100 บาท',
  },
};

/** สร้างคูปอง (promoStore) + แคมเปญ (communicationStore outbox) สำหรับ trigger หนึ่งครั้ง */
function fireTrigger(type: AutoCouponTriggerType, member: Member, extra?: string): void {
  const code = triggerKey(type, member.id, extra);
  if (alreadyFired(code)) return; // idempotent: ยิงไปแล้ว ไม่ทำซ้ำ

  const meta = META[type];
  const today = new Date();
  const end = new Date(today.getTime() + 30 * 86400000);

  if (FEATURE_FLAGS.MOCK_LINE) {
    // MOCK: สร้างคูปอง + แคมเปญในสโตร์ภายในแอปเท่านั้น
    const promoData: Omit<Promotion, 'id' | 'usageCount' | 'totalDiscountGiven' | 'createdAt'> = {
      promoCode: code,
      name: meta.name,
      description: meta.description,
      type: 'coupon',
      status: 'active',
      targetCustomer: 'member_only',
      startDate: today.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      minPurchase: meta.minPurchase,
      discountPercent: meta.discountPercent,
      discountAmount: meta.discountAmount,
      couponCode: code,
      couponLimit: 1,
      couponUsed: 0,
      applicableLevels: [member.level],
      stackable: false,
      priority: 100,
      createdBy: 'auto-trigger',
      shopId: member.shopId,
    };
    const promo = usePromoStore.getState().createPromotion(promoData);

    useCommunicationStore.getState().sendCouponCampaign({
      name: `${meta.name} · ${member.name}`,
      channel: 'line',
      couponId: promo.id,
      couponName: meta.name,
      couponCode: code,
      message: meta.message,
      target: { type: 'manual', contactIds: [] },
    });
  } else {
    // เมื่อปิด mock: ยิงคูปองจริงผ่าน backend / LINE OA
    // import { lineApi } from './api/lineApi';
    // lineApi.sendCoupon({ memberId: member.id, couponCode: code, couponName: meta.name, discount: ..., expiryDate: end.toISOString() });
  }
}

/** Welcome: เรียกตอน addMember */
export function triggerWelcomeCoupon(member: Member): void {
  fireTrigger('welcome', member);
}

/** Level-up: เรียกเมื่อตรวจพบระดับสมาชิกเปลี่ยนเป็นสูงขึ้น (ผูก key ด้วยระดับใหม่) */
export function triggerLevelUpReward(member: Member, newLevel: MemberLevel): void {
  fireTrigger('levelup', member, newLevel);
}

/** Win-back: เรียกสำหรับสมาชิกที่ไม่ซื้อเกิน 30 วัน */
export function triggerWinBackCoupon(member: Member): void {
  if (!member.lastPurchaseDate) return;
  const days = (Date.now() - new Date(member.lastPurchaseDate).getTime()) / 86400000;
  if (days < 30) return;
  // ผูก key ด้วยเดือน/ปี เพื่อให้ยิงได้เดือนละครั้ง
  const period = new Date().toISOString().slice(0, 7);
  fireTrigger('winback', member, period);
}

/** Birthday: เรียกสำหรับสมาชิกที่วันนี้เป็นวันเกิด (ผูก key ด้วยปี) */
export function triggerBirthdayCoupon(member: Member): void {
  if (!member.birthday) return;
  const bd = new Date(member.birthday);
  const now = new Date();
  if (bd.getMonth() !== now.getMonth() || bd.getDate() !== now.getDate()) return;
  fireTrigger('birthday', member, String(now.getFullYear()));
}
