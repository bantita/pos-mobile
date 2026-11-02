/**
 * memberTypeBenefits — pure helpers สำหรับสิทธิ์ของประเภทสมาชิก (ไม่ import store)
 * ใช้ร่วมกันทั้ง memberStore, PaymentScreen (mobile) และ WebPOSScreen
 */
import { MemberTypeBenefit } from '../types/memberType';
import { translate } from '../i18n/translate';
import type { Language } from '../i18n/types';

type EarnRule = Pick<MemberTypeBenefit, 'earnPoints' | 'pointMultiplier'>;

/**
 * คำนวณคะแนนที่ได้รับจากยอดซื้อ
 * - ไม่มีประเภท / ประเภทค่าเริ่มต้น (earn=true, ×1) => floor(amount / earnRate) เท่าเดิม
 * - earnPoints=false => 0
 * - pointMultiplier คูณก่อนปัดเศษลง
 */
export function calcEarnedPoints(amount: number, earnRate: number, type?: EarnRule | null): number {
  if (type?.earnPoints === false) return 0;
  const multiplier = type?.pointMultiplier ?? 1;
  const points = Math.floor((amount / (earnRate || 1)) * multiplier);
  return Math.max(0, points);
}

/** ส่วนลดของประเภทสมาชิก (บาท, ปัด 2 ตำแหน่ง) — 0 เมื่อไม่มีประเภทหรือ 0% */
export function computeMemberTypeDiscount(amount: number, type?: Pick<MemberTypeBenefit, 'discountPercent'> | null): number {
  if (!type || !(type.discountPercent > 0) || !(amount > 0)) return 0;
  const pct = Math.min(100, type.discountPercent);
  return Math.round(amount * pct) / 100;
}

/** ชื่อส่วนลดที่แสดงในบิล เช่น "ส่วนลดพนักงาน 10%" / en "พนักงาน discount 10%" (ชื่อประเภทไม่แปล) */
export function memberTypeDiscountLabel(
  type: Pick<MemberTypeBenefit, 'name' | 'discountPercent'>,
  lang: Language = 'th',
): string {
  return translate(lang, 'payment.memberTypeDiscount', { name: type.name, percent: type.discountPercent });
}
