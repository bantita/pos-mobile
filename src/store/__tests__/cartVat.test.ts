/**
 * Tests — cartStore VAT ราย "บรรทัดสินค้า" (per-line VAT)
 *
 * ครอบคลุม: บรรทัด VAT ใน 7% + VAT นอก 7% + VAT 0% ในตะกร้าเดียวกัน
 * - getVatAmount = ผลรวม VAT รายบรรทัด (ไม่ใช่ flat 7% บน subtotal)
 * - getGrandTotal: VAT ใน ไม่บวกซ้ำ; VAT นอก บวกเพิ่มในยอดชำระ
 * - รวมเคสที่มีส่วนลดระดับบิล
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// cartStore → persistStorage นำเข้า react-native (Platform) + AsyncStorage
// ซึ่ง resolve ไม่ได้ภายใต้ happy-dom — mock ให้เบาที่สุดเพื่อให้ store โหลดได้
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { useCartStore } from '../cartStore';
import { Product } from '../../types/sale';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const makeProduct = (over: Partial<Product> & { id: string; price: number }): Product => ({
  code: over.code ?? over.id.toUpperCase(),
  barcode: `BC-${over.id}`,
  name: over.name ?? over.id,
  category: over.category ?? 'ทั่วไป',
  cost: 0,
  vatIncluded: true,
  vatRate: 7,
  unit: 'ชิ้น',
  stockQty: 100,
  ...over,
});

// VAT ใน 7% ราคา 107 → VAT ฝัง = 107 - 107/1.07 = 7
const PRODUCT_INCLUSIVE = makeProduct({ id: 'inc', price: 107, vatIncluded: true, vatRate: 7 });
// VAT นอก 7% ราคา 100 → VAT = 100 * 7% = 7 (บวกเพิ่ม)
const PRODUCT_EXCLUSIVE = makeProduct({ id: 'exc', price: 100, vatIncluded: false, vatRate: 7 });
// VAT 0% ราคา 50 → ไม่มี VAT
const PRODUCT_ZERO = makeProduct({ id: 'zero', price: 50, vatIncluded: false, vatRate: 0 });

const seedCart = () => {
  const store = useCartStore.getState();
  store.clearCart();
  store.addItem(PRODUCT_INCLUSIVE, 1);
  store.addItem(PRODUCT_EXCLUSIVE, 1);
  store.addItem(PRODUCT_ZERO, 1);
};

beforeEach(() => {
  useCartStore.getState().clearCart();
});

describe('cartStore — per-line VAT (ผสม ใน/นอก/0%)', () => {
  test('ตะกร้าว่าง → VAT = 0, grand total = 0', () => {
    const s = useCartStore.getState();
    expect(s.getVatAmount()).toBeCloseTo(0, 2);
    expect(s.getGrandTotal()).toBeCloseTo(0, 2);
  });

  test('getVatAmount = ผลรวม VAT รายบรรทัด (7 + 7 + 0)', () => {
    seedCart();
    const s = useCartStore.getState();
    expect(s.getSubtotal()).toBeCloseTo(257, 2); // 107 + 100 + 50
    expect(s.getVatAmount()).toBeCloseTo(14, 2); // 7 (ใน) + 7 (นอก) + 0
  });

  test('grand total: VAT ใน ไม่บวกซ้ำ, VAT นอก บวกเพิ่ม', () => {
    seedCart();
    const s = useCartStore.getState();
    // afterDiscount = 257 (ไม่มีส่วนลด) + 7 (VAT นอก) = 264
    expect(s.getGrandTotal()).toBeCloseTo(264, 2);
  });

  test('มีส่วนลดระดับบิล 10% → VAT เฉลี่ยตามสัดส่วน', () => {
    seedCart();
    const s = useCartStore.getState();
    s.setDiscount({ type: 'percent', value: 10 });

    // ratio = (257 - 25.7) / 257 = 0.9
    // VAT ใน:  96.3 - 96.3/1.07 = 6.3 ; VAT นอก: 90 * 7% = 6.3 ; 0% = 0
    expect(s.getDiscountTotal()).toBeCloseTo(25.7, 2);
    expect(s.getVatAmount()).toBeCloseTo(12.6, 2);
    // grand total = afterDiscount(231.3) + VAT นอก(6.3) = 237.6
    expect(s.getGrandTotal()).toBeCloseTo(237.6, 2);
  });

  test('ตะกร้า VAT ในล้วน อัตราเดียว → grand total = subtotal (ไม่บวกซ้ำ)', () => {
    const s = useCartStore.getState();
    s.clearCart();
    s.addItem(PRODUCT_INCLUSIVE, 2); // 214
    expect(s.getSubtotal()).toBeCloseTo(214, 2);
    expect(s.getVatAmount()).toBeCloseTo(14, 2); // 214 - 214/1.07
    expect(s.getGrandTotal()).toBeCloseTo(214, 2);
  });
});
