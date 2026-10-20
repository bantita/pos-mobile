/**
 * Tests — cartAdapter (เชื่อม cart/payment เข้ากับ promotion engine)
 * ครอบคลุม: percent, fixed-with-min, member_price (match/no-match),
 *           buy_x_get_y gift, happy_hour time window, mix_match, coupon-only-when-entered
 */
import { describe, test, expect } from 'vitest';
import { runCartPromotions, BuildCalculationArgs } from '../cartAdapter';
import { CartItem as SaleCartItem, Product } from '../../../types/sale';
import { Promotion, PromoType } from '../../../types/promotion';

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
