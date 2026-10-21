/**
 * priceResolver — ตัวช่วยคำนวณราคาขายต่อหน่วย (UOM) ตามสาขาที่ใช้งานอยู่
 *
 * ใช้ที่จุด add-to-cart (toCartProduct) ทั้งฝั่ง Web และ Mobile POS เพื่อให้
 * ราคาในตะกร้าสะท้อนเอกสารกำหนดราคา (ราคากลาง/ราคาสาขา, ถาวร/ชั่วคราว) ที่กำลัง active
 *
 * หลักการ (plan Decision B + C):
 * - resolvePrice ถูก key ด้วย "รหัสสินค้า" (master.code เช่น 'P001') ไม่ใช่ master.id ('p1')
 * - ราคาที่ resolve ได้ถือเป็น "ราคาต่อ 1 หน่วยฐาน" (base unit) ของสินค้า
 *   ราคาต่อหน่วย UOM ที่เลือก = ราคาฐาน × uom.ratio (หน่วยฐาน ratio=1 → เท่ากับราคาฐาน)
 * - ถ้าไม่มีเอกสารราคาใด resolve ได้ → fallback เป็น uom.salePrice (พฤติกรรมเดิม)
 *
 * เป็นฟังก์ชัน pure ไม่มี React import — เรียกใช้ได้ทั้งใน screen และใน unit test
 */
import { ProductMaster, ProductUOM, ProductVariant } from '../types/product';
import { usePricingStore } from '../store/pricingStore';
import { PricingScope } from '../types/pricing';

/** ที่มาของราคาที่ใช้จริงในตะกร้า */
export type CartPriceSource = PricingScope | 'base';

export interface ResolvedCartPrice {
  /** ราคาต่อหน่วย UOM ที่เลือก (ปัดเศษ 2 ตำแหน่ง) */
  price: number;
  /** ที่มา: 'branch' = ราคาสาขา, 'central' = ราคากลาง, 'base' = ราคาจาก master UOM */
  source: CartPriceSource;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * คำนวณราคาต่อหน่วยของสินค้าสำหรับใส่ตะกร้า ตามสาขาที่ active
 * @param master สินค้าต้นแบบ (ใช้ master.code เป็น key ในการ resolve)
 * @param uom    หน่วยนับที่เลือก (ใช้ uom.ratio สเกลราคา และ uom.salePrice เป็น fallback)
 * @param branchId สาขาที่ใช้งานอยู่ (ถ้าไม่ระบุ จะ resolve ได้เฉพาะราคากลาง)
 */
export function resolveCartPrice(
  master: ProductMaster,
  uom: ProductUOM,
  branchId?: string,
  variant?: ProductVariant,
): ResolvedCartPrice {
  // variant มีราคาระบุเอง → ใช้ราคา variant สเกลด้วย ratio (ก่อนลอจิกราคาสาขา/กลาง)
  if (variant?.price != null) {
    return { price: round2(variant.price * uom.ratio), source: 'base' };
  }
  const resolved = usePricingStore.getState().resolvePrice(master.code, branchId);
  if (resolved) {
    // ราคาฐาน (ต่อ 1 หน่วยฐาน) สเกลด้วย ratio ของหน่วยที่เลือก
    return { price: round2(resolved.price * uom.ratio), source: resolved.sourceType };
  }
  // ไม่มีเอกสารราคา → ใช้ราคาขายจาก UOM เดิม
  return { price: uom.salePrice, source: 'base' };
}
