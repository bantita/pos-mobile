/**
 * Tests — cartAdapter (เชื่อม cart/payment เข้ากับ promotion engine)
 * ครอบคลุม: percent, fixed-with-min, member_price (match/no-match),
 *           buy_x_get_y gift, happy_hour time window, mix_match, coupon-only-when-entered
 */
import { describe, test, expect } from 'vitest';
import { runCartPromotions, BuildCalculationArgs } from '../cartAdapter';
import { CartItem as SaleCartItem, Product } from '../../../types/sale';
import { Promotion, PromoType } from '../../../types/promotion';
import { MemberTypeBenefit } from '../../../types/memberType';

// ─── Helpers ────────────────────────────────────────────────────────────────
function makeProduct(over: Partial<Product> & { id: string; code: string }): Product {
  return {
    barcode: `BC-${over.code}`,
    name: over.name ?? over.code,
    category: over.category ?? 'ทั่วไป',
    price: over.price ?? 100,
    cost: 0,
    vatIncluded: true,
    vatRate: 7,
    unit: 'ชิ้น',
    stockQty: 100,
    ...over,
  };
}

function makeCartItem(
  over: Partial<Product> & { id: string; code: string },
  qty: number,
  unitPrice: number
): SaleCartItem {
  return {
    product: makeProduct({ ...over, price: unitPrice }),
    qty,
    unitPrice,
    discountAmount: 0,
    discountPercent: 0,
    subtotal: qty * unitPrice,
  };
}

function makePromo(over: Partial<Promotion> & { id: string; type: PromoType }): Promotion {
  return {
    promoCode: over.promoCode ?? over.id.toUpperCase(),
    name: over.name ?? over.id,
    description: '',
    status: 'active',
    startDate: '2020-01-01',
    endDate: '2030-12-31',
    stackable: over.stackable ?? false,
    priority: over.priority ?? 1,
    usageCount: 0,
    totalDiscountGiven: 0,
    createdAt: '2020-01-01',
    createdBy: 'test',
    shopId: 'shop-01',
    ...over,
  };
}

const BASE: Omit<BuildCalculationArgs, 'cartItems' | 'subtotal' | 'promotions'> = {
  businessDateTime: '2026-06-17T18:00:00+07:00', // 18:00 — อยู่ในช่วง happy hour 17-19
  storeCode: 'STORE-001',
};

// ─── percent ────────────────────────────────────────────────────────────────
describe('cartAdapter — percent', () => {
  test('ลด 10% สูงสุด 100', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 1500)];
    const promo = makePromo({
      id: 'promo-pct',
      type: 'percent',
      discountPercent: 10,
      maxDiscount: 100,
    });
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 1500, promotions: [promo] });
    expect(res.appliedBenefits).toHaveLength(1);
    expect(res.totalDiscount).toBeCloseTo(100, 2);
    expect(res.finalPayable).toBeCloseTo(1400, 2);
  });
});

// ─── fixed with minPurchase ───────────────────────────────────────────────────
describe('cartAdapter — fixed with min', () => {
  test('ถึงยอดขั้นต่ำ → ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 600)];
    const promo = makePromo({
      id: 'promo-fixed',
      type: 'fixed',
      minPurchase: 500,
      discountAmount: 50,
    });
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 600, promotions: [promo] });
    expect(res.totalDiscount).toBeCloseTo(50, 2);
    expect(res.finalPayable).toBeCloseTo(550, 2);
  });

  test('ไม่ถึงยอดขั้นต่ำ → ไม่ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 400)];
    const promo = makePromo({
      id: 'promo-fixed',
      type: 'fixed',
      minPurchase: 500,
      discountAmount: 50,
    });
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 400, promotions: [promo] });
    expect(res.appliedBenefits).toHaveLength(0);
    expect(res.finalPayable).toBeCloseTo(400, 2);
  });
});

// ─── member_price ─────────────────────────────────────────────────────────────
describe('cartAdapter — member_price', () => {
  const promo = makePromo({
    id: 'promo-member',
    type: 'member_price',
    discountPercent: 5,
    maxDiscount: 200,
    applicableLevels: ['gold', 'platinum'],
  });

  test('ระดับสมาชิกตรง → ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 1000)];
    const res = runCartPromotions({
      ...BASE,
      cartItems: cart,
      subtotal: 1000,
      promotions: [promo],
      member: { id: 'MEM-001', level: 'gold' },
    });
    expect(res.appliedBenefits).toHaveLength(1);
    expect(res.totalDiscount).toBeCloseTo(50, 2);
    expect(res.finalPayable).toBeCloseTo(950, 2);
  });

  test('ระดับสมาชิกไม่ตรง → ไม่ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 1000)];
    const res = runCartPromotions({
      ...BASE,
      cartItems: cart,
      subtotal: 1000,
      promotions: [promo],
      member: { id: 'MEM-002', level: 'silver' },
    });
    expect(res.appliedBenefits).toHaveLength(0);
    expect(res.finalPayable).toBeCloseTo(1000, 2);
  });

  test('ลูกค้าทั่วไป (ไม่มีสมาชิก) → ไม่ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 1000)];
    const res = runCartPromotions({
      ...BASE,
      cartItems: cart,
      subtotal: 1000,
      promotions: [promo],
    });
    expect(res.appliedBenefits).toHaveLength(0);
  });
});

// ─── buy_x_get_y ──────────────────────────────────────────────────────────────
describe('cartAdapter — buy_x_get_y', () => {
  test('ซื้อ 3 แถม 1 → ได้ของแถม', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001', name: 'น้ำดื่ม' }, 3, 10)];
    const promo = makePromo({
      id: 'promo-bogo',
      type: 'buy_x_get_y',
      applicableProducts: ['P001'],
      buyQty: 3,
      getQty: 1,
      getProductId: 'P001',
    });
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 30, promotions: [promo] });
    expect(res.appliedBenefits).toHaveLength(1);
    expect(res.freeGifts).toHaveLength(1);
    expect(res.freeGifts[0].productCode).toBe('P001');
    expect(res.freeGifts[0].quantity).toBe(1);
  });

  test('ซื้อไม่ถึงจำนวน → ไม่ได้ของแถม', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 2, 10)];
    const promo = makePromo({
      id: 'promo-bogo',
      type: 'buy_x_get_y',
      applicableProducts: ['P001'],
      buyQty: 3,
      getQty: 1,
      getProductId: 'P001',
    });
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 20, promotions: [promo] });
    expect(res.freeGifts).toHaveLength(0);
  });
});

// ─── happy_hour ───────────────────────────────────────────────────────────────
describe('cartAdapter — happy_hour', () => {
  const promo = makePromo({
    id: 'promo-happy',
    type: 'happy_hour',
    discountPercent: 20,
    maxDiscount: 100,
    startTime: '17:00',
    endTime: '19:00',
    applicableCategories: ['เครื่องดื่ม'],
  });

  test('อยู่ในช่วงเวลา → ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001', category: 'เครื่องดื่ม' }, 1, 300)];
    const res = runCartPromotions({
      ...BASE,
      businessDateTime: '2026-06-17T18:00:00+07:00',
      cartItems: cart,
      subtotal: 300,
      promotions: [promo],
    });
    expect(res.appliedBenefits).toHaveLength(1);
    expect(res.totalDiscount).toBeCloseTo(60, 2);
  });

  test('นอกช่วงเวลา → ไม่ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001', category: 'เครื่องดื่ม' }, 1, 300)];
    const res = runCartPromotions({
      ...BASE,
      businessDateTime: '2026-06-17T10:00:00+07:00',
      cartItems: cart,
      subtotal: 300,
      promotions: [promo],
    });
    expect(res.appliedBenefits).toHaveLength(0);
    expect(res.finalPayable).toBeCloseTo(300, 2);
  });
});

// ─── mix_match ────────────────────────────────────────────────────────────────
describe('cartAdapter — mix_match', () => {
  const promo = makePromo({
    id: 'promo-mix',
    type: 'mix_match',
    applicableCategories: ['ขนม'],
    buyQty: 3,
    discountAmount: 60,
  });

  test('ครบเงื่อนไขหมวด+จำนวน → ลดจำนวนเงิน', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'SNK', category: 'ขนม' }, 3, 50)];
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 150, promotions: [promo] });
    expect(res.appliedBenefits).toHaveLength(1);
    expect(res.totalDiscount).toBeCloseTo(60, 2);
    expect(res.finalPayable).toBeCloseTo(90, 2);
  });

  test('จำนวนไม่ถึง → ไม่ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'SNK', category: 'ขนม' }, 2, 50)];
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 100, promotions: [promo] });
    expect(res.appliedBenefits).toHaveLength(0);
  });
});

// ─── coupon only when entered ─────────────────────────────────────────────────
describe('cartAdapter — coupon only when entered', () => {
  const promo = makePromo({
    id: 'promo-coupon',
    type: 'coupon',
    couponCode: 'SUMMER2024',
    minPurchase: 300,
    discountAmount: 100,
  });

  test('ไม่กรอกคูปอง → โปร coupon ไม่ถูกใช้', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 500)];
    const res = runCartPromotions({ ...BASE, cartItems: cart, subtotal: 500, promotions: [promo] });
    expect(res.appliedBenefits).toHaveLength(0);
    expect(res.finalPayable).toBeCloseTo(500, 2);
  });

  test('กรอกคูปองถูกต้อง → ลด', () => {
    const cart = [makeCartItem({ id: 'p1', code: 'P001' }, 1, 500)];
    const res = runCartPromotions({
      ...BASE,
      cartItems: cart,
      subtotal: 500,
      promotions: [promo],
      couponCode: 'SUMMER2024',
    });
    expect(res.appliedBenefits).toHaveLength(1);
    expect(res.totalDiscount).toBeCloseTo(100, 2);
    expect(res.finalPayable).toBeCloseTo(400, 2);
  });
});

// ─── member type (ประเภทสมาชิก) ───────────────────────────────────────────────
describe('cartAdapter — member type discount', () => {
  const STAFF_10: MemberTypeBenefit = { id: 'mt-staff', name: 'พนักงาน', discountPercent: 10, earnPoints: false, pointMultiplier: 1 };
  const GENERAL: MemberTypeBenefit = { id: 'mt-general', name: 'ลูกค้าทั่วไป', discountPercent: 0, earnPoints: true, pointMultiplier: 1 };
  const staffMember = { id: 'MEM-S', level: 'member' as const, memberTypeId: 'mt-staff' };
  const cart = () => [makeCartItem({ id: 'p1', code: 'P001' }, 2, 500)];

  test('พนักงาน 10% -> มีรายการ "ส่วนลดพนักงาน 10%" ใน appliedBenefits', () => {
    const res = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [], member: staffMember, memberType: STAFF_10 });
    expect(res.appliedBenefits).toHaveLength(1);
    expect(res.appliedBenefits[0].promotionName).toBe('ส่วนลดพนักงาน 10%');
    expect(res.appliedBenefits[0].value).toBeCloseTo(100, 2);
    expect(res.totalDiscount).toBeCloseTo(100, 2);
    expect(res.finalPayable).toBeCloseTo(900, 2);
  });

  test('ประเภท 0% / ไม่มีสมาชิก / ไม่ส่ง memberType -> ไม่มีส่วนลดเพิ่ม (เหมือนเดิม)', () => {
    const promo = makePromo({ id: 'promo-pct', type: 'percent', discountPercent: 5 });
    const baseline = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo] });
    const general = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: { id: 'MEM-G', level: 'member' }, memberType: GENERAL });
    const noType = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: staffMember });
    const noMember = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], memberType: STAFF_10 });
    for (const r of [general, noType, noMember]) {
      expect(r.appliedBenefits.map(b => b.promotionId)).toEqual(['promo-pct']);
      expect(r.finalPayable).toBeCloseTo(baseline.finalPayable, 2);
    }
  });

  test('โปร NO_STACK ถูกใช้แล้ว -> ส่วนลดประเภทถูกปฏิเสธ, โปรเดิมยังอยู่', () => {
    const promo = makePromo({ id: 'promo-nostack', type: 'percent', discountPercent: 5, stackable: false, priority: 1 });
    const res = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: staffMember, memberType: STAFF_10 });
    expect(res.appliedBenefits.map(b => b.promotionId)).toEqual(['promo-nostack']);
    expect(res.totalDiscount).toBeCloseTo(50, 2);
  });

  test('โปร STACK_ALLOWED -> ใช้ทั้งคู่', () => {
    const promo = makePromo({ id: 'promo-stack', type: 'percent', discountPercent: 5, stackable: true, priority: 1 });
    const res = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: staffMember, memberType: STAFF_10 });
    expect(res.appliedBenefits.map(b => b.promotionName)).toEqual(['promo-stack', 'ส่วนลดพนักงาน 10%']);
    expect(res.totalDiscount).toBeCloseTo(150, 2);
  });
});

describe('cartAdapter — applicableMemberTypeIds targeting', () => {
  const STAFF: MemberTypeBenefit = { id: 'mt-staff', name: 'พนักงาน', discountPercent: 0, earnPoints: true, pointMultiplier: 1 };
  const GENERAL: MemberTypeBenefit = { id: 'mt-general', name: 'ลูกค้าทั่วไป', discountPercent: 0, earnPoints: true, pointMultiplier: 1 };
  const cart = () => [makeCartItem({ id: 'p1', code: 'P001' }, 1, 1000)];

  test('percent promo จำกัดประเภทพนักงาน — ใช้ได้เฉพาะพนักงาน', () => {
    const promo = makePromo({ id: 'promo-staff', type: 'percent', discountPercent: 20, applicableMemberTypeIds: ['mt-staff'] });
    const staff = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: { id: 'S', level: 'member', memberTypeId: 'mt-staff' }, memberType: STAFF });
    const general = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: { id: 'G', level: 'member', memberTypeId: 'mt-general' }, memberType: GENERAL });
    const walkIn = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo] });
    expect(staff.totalDiscount).toBeCloseTo(200, 2);
    expect(general.appliedBenefits).toHaveLength(0);
    expect(walkIn.appliedBenefits).toHaveLength(0);
  });

  test('member_price levels + types (AND)', () => {
    const promo = makePromo({ id: 'promo-mp', type: 'member_price', discountPercent: 5, applicableLevels: ['gold'], applicableMemberTypeIds: ['mt-staff'] });
    const ok = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: { id: 'S', level: 'gold' }, memberType: STAFF });
    const wrongType = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: { id: 'G', level: 'gold' }, memberType: GENERAL });
    const wrongLevel = runCartPromotions({ ...BASE, cartItems: cart(), subtotal: 1000, promotions: [promo], member: { id: 'S', level: 'silver' }, memberType: STAFF });
    expect(ok.totalDiscount).toBeCloseTo(50, 2);
    expect(wrongType.appliedBenefits).toHaveLength(0);
    expect(wrongLevel.appliedBenefits).toHaveLength(0);
  });
});