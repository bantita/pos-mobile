/**
 * หน่วยนับย่อย 1 หน่วย ของสินค้า
 * เช่น สินค้า "น้ำดื่ม" มี:
 *   baseUnit = "ขวด"  (หน่วยฐาน ratio=1)
 *   unitOfMeasure[0] = { unit:"แพ็ค",  ratio:6,  salePrice:55,  barcodes:["8850001000010"] }
 *   unitOfMeasure[1] = { unit:"ลัง",   ratio:24, salePrice:200, barcodes:["8850001000011"] }
 */
export interface ProductUOM {
  id: string;
  unit: string;          // ชื่อหน่วย เช่น "แพ็ค", "ลัง", "โหล"
  ratio: number;         // 1 หน่วยนี้ = ratio × baseUnit  (baseUnit ratio = 1)
  costPrice: number;     // ราคาทุนของหน่วยนี้ (คำนวณ auto หรือกรอกเอง)
  salePrice: number;     // ราคาขายของหน่วยนี้
  barcodes: string[];    // บาร์โค้ดที่ map กับหน่วยนี้ (1 หน่วยมีได้หลาย barcode)
  isDefault: boolean;    // หน่วยที่ใช้แสดงใน POS by default
}

/** ตัวเลือกสินค้า (variant option) เช่น { name: 'สี', values: ['แดง','น้ำเงิน'] } */
export interface ProductOption {
  name: string;
  values: string[];
}

/** หนึ่ง variant ของสินค้า (ผสมค่าตัวเลือกต่าง ๆ เข้าด้วยกัน) */
export interface ProductVariant {
  id: string;
  sku?: string;
  barcode?: string;
  price?: number;
  stockQty: number;
  optionValues: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  productCount: number;
  status: 'active' | 'inactive';
}

export interface Brand {
  id: string;
  name: string;
  productCount: number;
  status: 'active' | 'inactive';
}

export interface ProductMaster {
  id: string;
  code: string;
  /** barcode หลัก (หน่วยฐาน) — ยังคงอยู่เพื่อ backward compat */
  barcode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  /** หน่วยฐาน (smallest unit) เช่น "ขวด", "ชิ้น" */
  unit: string;
  costPrice: number;
  salePrice: number;
  vatIncluded: boolean;
  vatRate: number; // 0 | 7
  image?: string;
  status: 'active' | 'inactive';
  /** stock นับเป็น baseUnit เสมอ */
  stockQty: number;
  minStock: number;
  /** รายการหน่วยนับทั้งหมด (รวมหน่วยฐาน ratio=1 เป็น index 0) */
  uoms: ProductUOM[];
  /** ตัวเลือกสินค้า (variant options) — optional/additive */
  options?: ProductOption[];
  /** รายการ variant ทั้งหมดของสินค้า — optional/additive */
  variants?: ProductVariant[];
  /** รหัสผู้จัดจำหน่าย (supplier) — optional/additive */
  supplierId?: string;
  /** ชื่อผู้จัดจำหน่าย (supplier) — optional/additive */
  supplierName?: string;
  /** ประเภทสินค้า: 'general' = สินค้าทั่วไป, 'service' = สินค้าบริการ (ต้องเลือกช่าง) */
  productType: 'general' | 'service';
  /** สี (variant) */
  color?: string;
  /** Lot / Batch number */
  lotNumber?: string;
  /** ขนาด/ไซส์ (เช่น S, M, L, XL หรือ 250ml, 500ml) */
  size?: string;
  /** ปี/รุ่น (Model Year) */
  modelYear?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportRow {
  rowNo: number;
  code: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  errors: string[];
}
