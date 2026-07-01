/**
 * Engine Integration Tests
 * Run: npx tsx src/engine/__tests__/engine.test.ts
 */
import { calculate } from '../index';
import {
  CalculationRequest, PromotionConfig, CartItem,
  PromotionType, PromotionStatus, StackMode, ConflictResolution,
  QuantityOperator, PointType, PointPolicyMode, PointUsageMode,
} from '../types';

// ─── Test Utilities ───────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.log(`  ❌ FAILED: ${testName}`);
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, testName: string): void {
  assert(Math.abs(actual - expected) <= tolerance, `${testName} (got ${actual}, expected ${expected})`);
}

// ─── Test Data Helpers ────────────────────────────────────────────────────────
function makeCart(items: Array<{ code: string; qty: number; price: number; group?: string }>): CartItem[] {
  return items.map((item, i) => ({
    lineId: `line-${i + 1}`,
    itemCode: item.code,
    groupCodes: item.group ? [item.group] : [],
    quantity: item.qty,
    unitPrice: item.price,
    lineAmount: item.qty * item.price,
  }));
}

function makePromo(overrides: Partial<PromotionConfig> & { promotionId: string; name: string }): PromotionConfig {
  return {
    type: PromotionType.PROMOTION,
    status: PromotionStatus.ACTIVE,
    priority: 1,
    startDate: '2020-01-01T00:00:00Z',
    endDate: '2030-12-31T23:59:59Z',
    stackMode: StackMode.STACK_ALLOWED,
    conditions: [],
    benefits: [],
    ...overrides,
  };
}

const BASE_REQUEST: Partial<CalculationRequest> = {
  storeCode: 'STORE-001',
  memberId: 'MEM-001',
  memberLevel: 'gold',
  businessDateTime: '2026-06-17T14:30:00+07:00',
};

// ─── Test 1: Empty cart returns empty result ──────────────────────────────────
console.log('\n📋 Test: Empty promotions');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 2, price: 100 }]);
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 200,
    promotionCandidates: [],
  });
  assert(result.finalTotals.finalPayable === 200, 'No promotions → finalPayable = subtotal');
  assert(result.appliedBenefits.length === 0, 'No benefits applied');
  assert(result.finalTotals.totalItemDiscount === 0, 'Zero item discount');
})();

// ─── Test 2: Amount discount (ซื้อครบ 2500 ลด 250) ───────────────────────────
console.log('\n📋 Test: Amount discount (MORE_THAN threshold)');
(() => {
  const cart = makeCart([
    { code: 'P001', qty: 5, price: 500 },
    { code: 'P002', qty: 1, price: 100 },
  ]);
  const promo = makePromo({
    promotionId: 'PROMO-DISC-250',
    name: 'ซื้อครบ 2500 ลด 250',
    conditions: [{ type: 'purchaseAmount', params: { operator: QuantityOperator.MORE_THAN, threshold: 2499.99 } }],
    benefits: [{ type: 'bill_discount', params: { amount: 250 } }],
  });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 2600,
    promotionCandidates: [promo],
  });
  assert(result.appliedBenefits.length === 1, 'One promotion applied');
  assertApprox(result.finalTotals.totalBillDiscount, 250, 0.01, 'Bill discount = 250');
  assertApprox(result.finalTotals.finalPayable, 2350, 0.01, 'Final payable = 2350');
})();

// ─── Test 3: Percent discount ─────────────────────────────────────────────────
console.log('\n📋 Test: Percent discount (10% max 100)');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 1500 }]);
  const promo = makePromo({
    promotionId: 'PROMO-10PCT',
    name: 'ลด 10% สูงสุด 100',
    conditions: [],
    benefits: [{ type: 'percent_discount', params: { percent: 10, maxDiscount: 100 } }],
  });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 1500,
    promotionCandidates: [promo],
  });
  assertApprox(result.finalTotals.totalItemDiscount, 100, 0.01, 'Discount capped at 100');
  assertApprox(result.finalTotals.finalPayable, 1400, 0.01, 'Final = 1500 - 100');
})();

// ─── Test 4: Free gift ────────────────────────────────────────────────────────
console.log('\n📋 Test: Free gift (ซื้อ 2 แถม 1)');
(() => {
  const cart = makeCart([{ code: 'SOAP', qty: 3, price: 50, group: 'personal' }]);
  const promo = makePromo({
    promotionId: 'PROMO-BOGO',
    name: 'ซื้อ 2 แถม 1',
    conditions: [{ type: 'product', params: { itemCodes: ['SOAP'], operator: QuantityOperator.EVERY, threshold: 2 } }],
    benefits: [{ type: 'free_gift', params: { productCode: 'SOAP', productName: 'สบู่แถม', quantity: 1, value: 50 } }],
  });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 150,
    promotionCandidates: [promo],
  });
  assert(result.appliedBenefits.length === 1, 'Promo applied');
  assert(result.appliedBenefits[0].freeGifts?.length === 1, 'One gift awarded');
  assert(result.appliedBenefits[0].freeGifts?.[0].productCode === 'SOAP', 'Gift is SOAP');
})();

// ─── Test 5: Conflict — NO_STACK highest priority wins ────────────────────────
console.log('\n📋 Test: Conflict resolution (NO_STACK + HIGHEST_PRIORITY)');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 1000 }]);
  const promo1 = makePromo({
    promotionId: 'PROMO-A',
    name: 'โปร A (priority 1)',
    priority: 1,
    stackMode: StackMode.NO_STACK,
    conflictResolution: ConflictResolution.HIGHEST_PRIORITY,
    benefits: [{ type: 'bill_discount', params: { amount: 100 } }],
  });
  const promo2 = makePromo({
    promotionId: 'PROMO-B',
    name: 'โปร B (priority 5)',
    priority: 5,
    stackMode: StackMode.NO_STACK,
    benefits: [{ type: 'bill_discount', params: { amount: 200 } }],
  });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 1000,
    promotionCandidates: [promo1, promo2],
  });
  assert(result.appliedBenefits.length === 1, 'Only 1 promo applied');
  assert(result.appliedBenefits[0].promotionId === 'PROMO-A', 'Higher priority (1) wins');
  assertApprox(result.finalTotals.totalBillDiscount, 100, 0.01, 'Discount = 100 from winner');
})();

// ─── Test 6: Expired promotion filtered ───────────────────────────────────────
console.log('\n📋 Test: Expired promotion filtered out');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 500 }]);
  const promo = makePromo({
    promotionId: 'PROMO-EXPIRED',
    name: 'โปรหมดอายุ',
    endDate: '2020-01-01T00:00:00Z',
    benefits: [{ type: 'bill_discount', params: { amount: 100 } }],
  });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 500,
    promotionCandidates: [promo],
  });
  assert(result.appliedBenefits.length === 0, 'Expired promo not applied');
  assert(result.evaluationSummary.totalFiltered === 1, 'One promo filtered');
  assert(result.finalTotals.finalPayable === 500, 'Subtotal unchanged');
})();

// ─── Test 7: Point earning ────────────────────────────────────────────────────
console.log('\n📋 Test: Point earning (1 point per 100 baht)');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 2500 }]);
  const earnPromo = makePromo({
    promotionId: 'EARN-001',
    name: 'สะสมคะแนน 1 ต่อ 100',
    type: PromotionType.EARN_POINT_GIFT,
    pointConfig: { pointType: PointType.MEMBER_POINT, baseRate: 100, expiryDays: 365 },
  });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 2500,
    promotionCandidates: [earnPromo],
    pointPolicy: { mode: PointPolicyMode.MULTI_TYPE, usageMode: PointUsageMode.MANUAL, allowMerge: false, priorityOrder: [PointType.MEMBER_POINT], conversionRate: 100 },
  });
  const earnTx = result.pointTransactions.find(t => t.transactionType === 'EARN');
  assert(!!earnTx, 'Earn transaction exists');
  assert(earnTx?.points === 25, 'Earned 25 points (2500/100)');
  assert(earnTx?.pointType === PointType.MEMBER_POINT, 'Earned as MEMBER_POINT');
})();

// ─── Test 8: Point payment ────────────────────────────────────────────────────
console.log('\n📋 Test: Point payment (100 points = 1 baht, use 500 points)');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 1000 }]);
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 1000,
    promotionCandidates: [],
    pointBalances: [{ pointType: PointType.MEMBER_POINT, balance: 10000 }],
    pointPolicy: { mode: PointPolicyMode.SINGLE_TYPE, usageMode: PointUsageMode.MANUAL, allowMerge: false, priorityOrder: [PointType.MEMBER_POINT], conversionRate: 100 },
    pointUsageRequest: { points: 500 },
  });
  const payTx = result.pointTransactions.find(t => t.transactionType === 'PAYMENT');
  assert(!!payTx, 'Payment transaction exists');
  assertApprox(payTx?.monetaryValue || 0, 5, 0.01, 'Monetary value = 5 baht (500/100)');
  assertApprox(result.finalTotals.pointPaymentValue, 5, 0.01, 'Point payment value = 5');
  assertApprox(result.finalTotals.finalPayable, 995, 0.01, 'Final payable = 1000 - 5');
})();

// ─── Test 9: Point redemption ─────────────────────────────────────────────────
console.log('\n📋 Test: Point redemption (100 points → 50 baht discount)');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 1000 }]);
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 1000,
    promotionCandidates: [],
    pointBalances: [{ pointType: PointType.MEMBER_POINT, balance: 500 }],
    pointPolicy: { mode: PointPolicyMode.SINGLE_TYPE, usageMode: PointUsageMode.MANUAL, allowMerge: false, priorityOrder: [PointType.MEMBER_POINT], conversionRate: 100 },
    redeemRequest: { promotionId: 'REDEEM-50', benefitType: 'discount', pointCost: 100, pointType: PointType.MEMBER_POINT, discountValue: 50 },
  });
  const redeemTx = result.pointTransactions.find(t => t.transactionType === 'REDEEM');
  assert(!!redeemTx, 'Redeem transaction exists');
  assert(redeemTx?.points === 100, 'Used 100 points');
  assertApprox(result.finalTotals.pointRedemptionValue, 50, 0.01, 'Redemption value = 50');
  assertApprox(result.finalTotals.finalPayable, 950, 0.01, 'Final payable = 1000 - 50');
})();

// ─── Test 10: Insufficient points rejected ────────────────────────────────────
console.log('\n📋 Test: Insufficient points rejected');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 500 }]);
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 500,
    promotionCandidates: [],
    pointBalances: [{ pointType: PointType.MEMBER_POINT, balance: 50 }],
    pointPolicy: { mode: PointPolicyMode.SINGLE_TYPE, usageMode: PointUsageMode.MANUAL, allowMerge: false, priorityOrder: [PointType.MEMBER_POINT], conversionRate: 100 },
    redeemRequest: { promotionId: 'REDEEM-X', benefitType: 'discount', pointCost: 100, pointType: PointType.MEMBER_POINT, discountValue: 50 },
  });
  const redeemTx = result.pointTransactions.find(t => t.transactionType === 'REDEEM');
  assert(!redeemTx, 'No redeem transaction (rejected)');
  assertApprox(result.finalTotals.finalPayable, 500, 0.01, 'Final payable unchanged');
  assert(result.explainTrace.some(e => e.reason.includes('Insufficient')), 'Audit shows insufficient reason');
})();

// ─── Test 11: Audit trail completeness ────────────────────────────────────────
console.log('\n📋 Test: Audit trail completeness');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 500 }]);
  const promo1 = makePromo({ promotionId: 'P1', name: 'Promo 1', benefits: [{ type: 'bill_discount', params: { amount: 10 } }] });
  const promo2 = makePromo({ promotionId: 'P2', name: 'Promo 2', status: PromotionStatus.DISABLED, benefits: [] });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 500,
    promotionCandidates: [promo1, promo2],
  });
  assert(result.explainTrace.length >= 2, 'At least 2 trace entries (one per candidate)');
  assert(result.explainTrace.some(e => e.promotionId === 'P2' && e.action === 'FILTERED'), 'Disabled promo filtered in trace');
  assert(result.explainTrace.some(e => e.promotionId === 'P1' && e.action === 'APPLIED'), 'Applied promo in trace');
  // Check step numbers are monotonically increasing
  for (let i = 1; i < result.explainTrace.length; i++) {
    assert(result.explainTrace[i].step > result.explainTrace[i - 1].step, `Step ${i} > step ${i - 1}`);
  }
})();

// ─── Test 12: Store condition ─────────────────────────────────────────────────
console.log('\n📋 Test: Store condition (wrong store → rejected)');
(() => {
  const cart = makeCart([{ code: 'P001', qty: 1, price: 500 }]);
  const promo = makePromo({
    promotionId: 'PROMO-STORE',
    name: 'โปรเฉพาะสาขา 2',
    conditions: [{ type: 'store', params: { storeCodes: ['STORE-002'] } }],
    benefits: [{ type: 'bill_discount', params: { amount: 50 } }],
  });
  const result = calculate({
    ...BASE_REQUEST as CalculationRequest,
    storeCode: 'STORE-001',
    businessDateTime: '2026-06-17T14:30:00+07:00',
    cartItems: cart,
    subtotal: 500,
    promotionCandidates: [promo],
  });
  assert(result.appliedBenefits.length === 0, 'Wrong store → no benefit');
  assertApprox(result.finalTotals.finalPayable, 500, 0.01, 'Subtotal unchanged');
})();

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${passed + failed}`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) process.exit(1);
