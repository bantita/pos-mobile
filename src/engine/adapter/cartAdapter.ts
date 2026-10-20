/**
 * Cart Adapter — เชื่อม cart/payment ของแอป เข้ากับ Promotion Engine (calculate())
 *
 * แปลง CartItem (src/types/sale.ts) + Promotion (src/types/promotion.ts)
 * ให้เป็น CalculationRequest ของ engine แล้วเรียก calculate() เพื่อให้โปรทั้ง 7 ประเภท
 * (percent / fixed / coupon / member_price / buy_x_get_y / happy_hour / mix_match)
 * ทำงานจริงตอนขาย ไม่ใช่แค่คูปองใบเดียว
 *
 * ค่า param keys ของ benefit/condition อ้างอิงจาก src/engine/__tests__/engine.test.ts
 * (bill_discount{amount}, percent_discount{percent,maxDiscount},
 *  free_gift{productCode,productName,quantity,value}, purchaseAmount{operator,threshold},
 *  product{itemCodes/groupCodes,operator,threshold}, member{levels}, time{startTime,endTime})
 */
import { calculate } from '../index';
import {
  CalculationRequest,
  PromotionConfig,
  CartItem as EngineCartItem,
  ConditionConfig,
  BenefitConfig,
} from '../types';
import {
  PromotionType,
  PromotionStatus,
  StackMode,
  QuantityOperator,
} from '../types/enums';
import { AppliedBenefit, FreeGift, ExplainEntry } from '../types/outputs';
import { CartItem as SaleCartItem } from '../../types/sale';
import { Promotion } from '../../types/promotion';
import { Member } from '../../types/member';

/** สมาชิกแบบย่อ (รับได้ทั้ง Member เต็มหรือ null สำหรับลูกค้าทั่วไป) */
export type AdapterMember = Pick<Member, 'id' | 'level'> | null | undefined;

/** อาร์กิวเมนต์สำหรับสร้าง CalculationRequest */
export interface BuildCalculationArgs {
  cartItems: SaleCartItem[];
  subtotal: number;
  member?: AdapterMember;
  promotions: Promotion[];
  businessDateTime: string;
  storeCode: string;
  /** รหัสคูปองที่ลูกค้ากรอก — โปรประเภท coupon จะถูกรวมเป็น candidate เฉพาะเมื่อ match */
  couponCode?: string;
}

/** ผลลัพธ์แบบย่อที่หน้าจอ cart/payment นำไปใช้ได้ทันที */
export interface CartPromotionResult {
  /** โปรที่ถูกนำมาใช้จริง (ชื่อ + มูลค่าส่วนลด) */
  appliedBenefits: AppliedBenefit[];
  /** ส่วนลดรวมจากโปรทั้งหมด (บาท) */
  totalDiscount: number;
  /** ยอดที่ต้องชำระหลังหักโปร (ยังไม่รวม service charge / แลกคะแนน) */
  finalPayable: number;
  /** ของแถมที่ได้รับ */
  freeGifts: FreeGift[];
  /** audit trace สำหรับ debug/แสดงผล */
  trace: ExplainEntry[];
}

/** แปลง CartItem ของแอป -> CartItem ของ engine */
function mapCartItems(items: SaleCartItem[]): EngineCartItem[] {
  return items.map((item, idx) => ({
    lineId: item.product.id || `line-${idx + 1}`,
    itemCode: item.product.code,
    groupCodes: item.product.category ? [item.product.category] : [],
    quantity: item.qty,
    unitPrice: item.unitPrice,
    lineAmount: item.subtotal,
  }));
}

/** แปลงสถานะ stackable ของโปร -> StackMode ของ engine */
function toStackMode(stackable: boolean): StackMode {
  return stackable ? StackMode.STACK_ALLOWED : StackMode.NO_STACK;
}

/** ช่วงวันของโปร (เติมเวลาให้เป็น ISO ที่ engine filter เข้าใจ) */
function toIsoStart(date: string): string {
  return date.length <= 10 ? `${date}T00:00:00` : date;
}
function toIsoEnd(date: string): string {
  return date.length <= 10 ? `${date}T23:59:59` : date;
}

/**
 * แปลง Promotion (แอป) -> PromotionConfig (engine)
 * คืน null เมื่อแปลงไม่ได้ (ชนิดไม่รองรับ / ข้อมูลไม่ครบ)
 */
function mapPromotion(promo: Promotion): PromotionConfig | null {
  const base = {
    promotionId: promo.id,
    name: promo.name,
    type: PromotionType.PROMOTION,
    status: PromotionStatus.ACTIVE,
    priority: promo.priority,
    startDate: toIsoStart(promo.startDate),
    endDate: toIsoEnd(promo.endDate),
    stackMode: toStackMode(promo.stackable),
  };

  const conditions: ConditionConfig[] = [];
  const benefits: BenefitConfig[] = [];

  switch (promo.type) {
    case 'percent': {
      if (!promo.discountPercent) return null;
      benefits.push({
        type: 'percent_discount',
        params: { percent: promo.discountPercent, maxDiscount: promo.maxDiscount },
      });
      break;
    }

    case 'fixed': {
      if (!promo.discountAmount) return null;
      if (promo.minPurchase) {
        conditions.push({
          type: 'purchaseAmount',
          params: { operator: QuantityOperator.MORE_THAN, threshold: promo.minPurchase - 0.01 },
        });
      }
      benefits.push({ type: 'bill_discount', params: { amount: promo.discountAmount } });
      break;
    }

    case 'coupon': {
      // คูปองใช้ bill_discount; เงื่อนไขขั้นต่ำ (ถ้ามี) ตรวจผ่าน purchaseAmount
      if (promo.minPurchase) {
        conditions.push({
          type: 'purchaseAmount',
          params: { operator: QuantityOperator.MORE_THAN, threshold: promo.minPurchase - 0.01 },
        });
      }
      if (promo.discountPercent) {
        benefits.push({
          type: 'percent_discount',
          params: { percent: promo.discountPercent, maxDiscount: promo.maxDiscount },
        });
      } else if (promo.discountAmount) {
        benefits.push({ type: 'bill_discount', params: { amount: promo.discountAmount } });
      } else {
        return null;
      }
      break;
    }

    case 'member_price': {
      if (!promo.discountPercent) return null;
      conditions.push({
        type: 'member',
        params: { levels: promo.applicableLevels ?? [] },
      });
      benefits.push({
        type: 'percent_discount',
        params: { percent: promo.discountPercent, maxDiscount: promo.maxDiscount },
      });
      break;
    }

    case 'buy_x_get_y': {
      if (!promo.buyQty || !promo.getQty || !promo.getProductId) return null;
      conditions.push({
        type: 'product',
        params: {
          itemCodes: promo.applicableProducts ?? [],
          operator: QuantityOperator.EVERY,
          threshold: promo.buyQty,
        },
      });
      benefits.push({
        type: 'free_gift',
        params: {
          productCode: promo.getProductId,
          productName: promo.name,
          quantity: promo.getQty,
          value: 0,
        },
      });
      break;
    }

    case 'happy_hour': {
      if (!promo.discountPercent) return null;
      if (promo.startTime && promo.endTime) {
        conditions.push({
          type: 'time',
          params: { startTime: promo.startTime, endTime: promo.endTime },
        });
      }
      // จำกัดส่วนลดเฉพาะหมวดที่กำหนด (ถ้ามี) ผ่าน product group condition
      if (promo.applicableCategories && promo.applicableCategories.length > 0) {
        conditions.push({
          type: 'product',
          params: { groupCodes: promo.applicableCategories },
        });
      }
      benefits.push({
        type: 'percent_discount',
        params: { percent: promo.discountPercent, maxDiscount: promo.maxDiscount },
      });
      break;
    }

    case 'mix_match': {
      if (!promo.discountAmount) return null;
      const itemCodes = promo.applicableProducts ?? [];
      const groupCodes = promo.applicableCategories ?? [];
      conditions.push({
        type: 'product',
        params: {
          ...(itemCodes.length > 0 ? { itemCodes } : {}),
          ...(groupCodes.length > 0 ? { groupCodes } : {}),
          ...(promo.buyQty
            ? { operator: QuantityOperator.EVERY, threshold: promo.buyQty }
            : {}),
        },
      });
      benefits.push({ type: 'amount_discount', params: { amount: promo.discountAmount } });
      break;
    }

    default:
      return null;
  }

  return { ...base, conditions, benefits };
}

/** โปรประเภท coupon ตรงกับรหัสที่กรอกหรือไม่ */
function couponMatches(promo: Promotion, couponCode?: string): boolean {
  if (!couponCode) return false;
  const code = couponCode.trim().toLowerCase();
  if (!code) return false;
  return (
    promo.couponCode?.toLowerCase() === code ||
    promo.promoCode?.toLowerCase() === code
  );
}

/**
 * สร้าง CalculationRequest จากตะกร้า + โปรที่ active
 * - โปรทั่วไปเข้าทุกใบ ยกเว้นโปรประเภท coupon ที่เข้าเฉพาะเมื่อรหัสตรงกับ couponCode
 */
export function buildCalculationRequest(args: BuildCalculationArgs): CalculationRequest {
  const { cartItems, subtotal, member, promotions, businessDateTime, storeCode, couponCode } = args;

  const candidates: PromotionConfig[] = [];
  for (const promo of promotions) {
    if (promo.type === 'coupon' && !couponMatches(promo, couponCode)) continue;
    const config = mapPromotion(promo);
    if (config) candidates.push(config);
  }

  return {
    storeCode,
    memberId: member?.id,
    memberLevel: member?.level,
    businessDateTime,
    cartItems: mapCartItems(cartItems),
    subtotal,
    promotionCandidates: candidates,
  };
}

/**
 * รันโปรทั้งหมดบนตะกร้าแล้วคืนผลลัพธ์แบบย่อให้หน้าจอใช้งาน
 */
export function runCartPromotions(args: BuildCalculationArgs): CartPromotionResult {
  const request = buildCalculationRequest(args);
  const result = calculate(request);

  return {
    appliedBenefits: result.appliedBenefits,
    totalDiscount:
      result.finalTotals.totalItemDiscount + result.finalTotals.totalBillDiscount,
    finalPayable: result.finalTotals.finalPayable,
    freeGifts: result.appliedBenefits.flatMap((b) => b.freeGifts ?? []),
    trace: result.explainTrace,
  };
}
