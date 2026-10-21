/**
 * cartProduct — ตัวช่วยกลาง แปลง ProductMaster + UOM (+ variant) → Product สำหรับตะกร้า
 *
 * รวม logic เดิมที่ถูก copy ไว้ในหลายหน้าจอ (POSSaleScreen / WebPOSScreen) ให้เป็นที่เดียว
 * - ไม่มี variant → ผลลัพธ์ byte-identical กับ inline copy เดิม (id/price/name/stock)
 * - มี variant   → id ต่อท้ายด้วย `__${variant.id}`, ชื่อแนบค่าตัวเลือก, ราคาใช้ราคา variant
 *
 * เป็นฟังก์ชัน pure ไม่มี React import — เรียกใช้ได้ทั้งใน screen และใน unit test
 */
import { ProductMaster, ProductUOM, ProductVariant } from '../types/product';
import { Product } from '../types/sale';
import { resolveCartPrice } from './priceResolver';

/**
 * แปลง ProductMaster → Product ตาม UOM ที่เลือก (และ variant ถ้ามี)
 * @param master  สินค้าต้นแบบ
 * @param uom     หน่วยนับที่เลือก
 * @param branchId สาขาที่ใช้งานอยู่ (สำหรับ resolve ราคา)
 * @param variant variant ที่เลือก (optional) — ถ้าไม่ระบุ ผลลัพธ์เท่าเดิมทุกประการ
 */
export const toCartProduct = (
  master: ProductMaster,
  uom: ProductUOM,
  branchId?: string,
  variant?: ProductVariant,
): Product => {
  const baseName = uom.ratio > 1 ? `${master.name} (${uom.unit})` : master.name;
  const variantSuffix = variant
    ? ` (${Object.values(variant.optionValues).join('/')})`
    : '';
  return {
    id: variant
      ? `${master.id}_${uom.id}__${variant.id}`
      : `${master.id}_${uom.id}`,
    code: master.code,
    barcode: variant?.barcode ?? uom.barcodes[0] ?? master.barcode,
    name: variant ? `${baseName}${variantSuffix}` : baseName,
    category: master.categoryName,
    price: resolveCartPrice(master, uom, branchId, variant).price,
    cost: uom.costPrice,
    vatIncluded: master.vatIncluded,
    vatRate: master.vatRate,
    unit: uom.unit,
    stockQty: Math.floor(master.stockQty / uom.ratio),
  };
};

/**
 * stock ที่ควรแสดงบนการ์ดสินค้า:
 * - มี variant → ผลรวม stockQty ของทุก variant
 * - ไม่มี variant → master.stockQty ตามเดิม
 */
export const masterDisplayStock = (master: ProductMaster): number =>
  master.variants?.length
    ? master.variants.reduce((sum, v) => sum + v.stockQty, 0)
    : master.stockQty;
