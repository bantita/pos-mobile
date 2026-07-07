/**
 * mockProducts.ts — Single source of truth
 * ไม่มี duplicate export เด็ดขาด
 * มี Validation Guard ตรวจ id/code/barcode ซ้ำใน __DEV__
 */
import { ProductMaster, Category, Brand, ProductUOM } from '@/features/product/domain/product';

// ─── Categories ───────────────────────────────────────────────────────────────
export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'เครื่องดื่ม',   productCount: 12, status: 'active'   },
  { id: 'c2', name: 'อาหาร',         productCount: 8,  status: 'active'   },
  { id: 'c3', name: 'ขนม',           productCount: 15, status: 'active'   },
  { id: 'c4', name: 'ของใช้',        productCount: 10, status: 'active'   },
  { id: 'c5', name: 'ยาและสุขภาพ',  productCount: 5,  status: 'inactive' },
];

// ─── Brands ───────────────────────────────────────────────────────────────────
export const MOCK_BRANDS: Brand[] = [
  { id: 'b1', name: 'สิงห์',     productCount: 6, status: 'active' },
  { id: 'b2', name: 'เป๊ปซี่',   productCount: 4, status: 'active' },
  { id: 'b3', name: 'เลย์',      productCount: 8, status: 'active' },
  { id: 'b4', name: 'Unilever',  productCount: 9, status: 'active' },
];

// ─── Units ────────────────────────────────────────────────────────────────────
export const UNITS = [
  'ชิ้น', 'ขวด', 'กระป๋อง', 'ซอง', 'ถุง',
  'ก้อน', 'กล่อง', 'แพ็ค', 'โหล', 'กิโล',
  'ลัง', 'ลิตร', 'มล.',
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const baseUOM = (
  id: string,
  unit: string,
  costPrice: number,
  salePrice: number,
  barcode: string,
): ProductUOM => ({
  id,
  unit,
  ratio: 1,
  costPrice,
  salePrice,
  barcodes: [barcode],
  isDefault: true,
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS: ProductMaster[] = [
  {
    id: 'p1', code: 'P001', barcode: '8850999000001',
    name: 'น้ำดื่มสิงห์ 600ml',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม',
    brandId: 'b1', brandName: 'สิงห์', unit: 'ขวด',
    costPrice: 6, salePrice: 10, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'active', stockQty: 100, minStock: 20,
    uoms: [
      { id: 'u1_1', unit: 'ขวด',  ratio: 1,  costPrice: 6,   salePrice: 10,  barcodes: ['8850999000001'],               isDefault: true  },
      { id: 'u1_2', unit: 'แพ็ค', ratio: 6,  costPrice: 33,  salePrice: 55,  barcodes: ['8850999000101','8850999000102'], isDefault: false },
      { id: 'u1_3', unit: 'ลัง',  ratio: 24, costPrice: 120, salePrice: 200, barcodes: ['8850999000201'],               isDefault: false },
    ],
    createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p2', code: 'P002', barcode: '8850999000002',
    name: 'น้ำอัดลม Pepsi 325ml',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม',
    brandId: 'b2', brandName: 'เป๊ปซี่', unit: 'กระป๋อง',
    costPrice: 9, salePrice: 15, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'active', stockQty: 50, minStock: 10,
    uoms: [
      { id: 'u2_1', unit: 'กระป๋อง', ratio: 1,  costPrice: 9,   salePrice: 15,  barcodes: ['8850999000002'], isDefault: true  },
      { id: 'u2_2', unit: 'แพ็ค 6',  ratio: 6,  costPrice: 50,  salePrice: 80,  barcodes: ['8850999000202'], isDefault: false },
      { id: 'u2_3', unit: 'ลัง 24',  ratio: 24, costPrice: 190, salePrice: 290, barcodes: ['8850999000302'], isDefault: false },
    ],
    createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p3', code: 'P003', barcode: '8850999000003',
    name: 'ขนมปังกรอบ 7-11',
    categoryId: 'c2', categoryName: 'อาหาร', unit: 'ชิ้น',
    costPrice: 18, salePrice: 25, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'active', stockQty: 30, minStock: 10,
    uoms: [baseUOM('u3_1', 'ชิ้น', 18, 25, '8850999000003')],
    createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p4', code: 'P004', barcode: '8850999000004',
    name: 'มาม่า หมูสับ',
    categoryId: 'c2', categoryName: 'อาหาร', unit: 'ซอง',
    costPrice: 4, salePrice: 7, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'active', stockQty: 200, minStock: 50,
    uoms: [
      { id: 'u4_1', unit: 'ซอง', ratio: 1,  costPrice: 4,   salePrice: 7,   barcodes: ['8850999000004'], isDefault: true  },
      { id: 'u4_2', unit: 'โหล', ratio: 12, costPrice: 42,  salePrice: 75,  barcodes: ['8850999000404'], isDefault: false },
      { id: 'u4_3', unit: 'ลัง', ratio: 60, costPrice: 200, salePrice: 350, barcodes: ['8850999000504'], isDefault: false },
    ],
    createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p5', code: 'P005', barcode: '8850999000005',
    name: 'เลย์ รสออริจินัล',
    categoryId: 'c3', categoryName: 'ขนม',
    brandId: 'b3', brandName: 'เลย์', unit: 'ถุง',
    costPrice: 14, salePrice: 20, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'active', stockQty: 70, minStock: 15,
    uoms: [
      { id: 'u5_1', unit: 'ถุง',  ratio: 1, costPrice: 14,  salePrice: 20,  barcodes: ['8850999000005'], isDefault: true  },
      { id: 'u5_2', unit: 'แพ็ค', ratio: 8, costPrice: 100, salePrice: 140, barcodes: ['8850999000505'], isDefault: false },
    ],
    createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p6', code: 'P006', barcode: '8850999000006',
    name: 'สบู่ Dove ก้อน',
    categoryId: 'c4', categoryName: 'ของใช้',
    brandId: 'b4', brandName: 'Unilever', unit: 'ก้อน',
    costPrice: 30, salePrice: 45, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'active', stockQty: 3, minStock: 10,
    uoms: [
      { id: 'u6_1', unit: 'ก้อน',  ratio: 1, costPrice: 30, salePrice: 45,  barcodes: ['8850999000006'], isDefault: true  },
      { id: 'u6_2', unit: 'แพ็ค3', ratio: 3, costPrice: 85, salePrice: 120, barcodes: ['8850999000606'], isDefault: false },
    ],
    createdAt: new Date('2024-03-15'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p7', code: 'P007', barcode: '8850999000007',
    name: 'แชมพู Head & Shoulders 170ml',
    categoryId: 'c4', categoryName: 'ของใช้',
    brandId: 'b4', brandName: 'Unilever', unit: 'ขวด',
    costPrice: 65, salePrice: 89, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'active', stockQty: 2, minStock: 5,
    uoms: [baseUOM('u7_1', 'ขวด', 65, 89, '8850999000007')],
    createdAt: new Date('2024-04-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p8', code: 'P008', barcode: '8850999000008',
    name: 'โอรีโอ้ช็อกโกแลต',
    categoryId: 'c3', categoryName: 'ขนม', unit: 'ห่อ',
    costPrice: 13, salePrice: 20, vatIncluded: true, vatRate: 7,
    productType: 'general',
    status: 'inactive', stockQty: 0, minStock: 10,
    uoms: [baseUOM('u8_1', 'ห่อ', 13, 20, '8850999000008')],
    createdAt: new Date('2024-04-10'), updatedAt: new Date('2024-05-20'),
  },
  // ─── Service Products (SERVICE store demo) ────────────────────────────────
  {
    id: 'ps1', code: 'S001', barcode: '8850999100001',
    name: 'ตัดผมชาย',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม', unit: 'ครั้ง',
    costPrice: 0, salePrice: 200, vatIncluded: true, vatRate: 7,
    productType: 'service',
    status: 'active', stockQty: 999, minStock: 0,
    uoms: [baseUOM('us1_1', 'ครั้ง', 0, 200, '8850999100001')],
    createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'ps2', code: 'S002', barcode: '8850999100002',
    name: 'สระผม + เป่า',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม', unit: 'ครั้ง',
    costPrice: 0, salePrice: 150, vatIncluded: true, vatRate: 7,
    productType: 'service',
    status: 'active', stockQty: 999, minStock: 0,
    uoms: [baseUOM('us2_1', 'ครั้ง', 0, 150, '8850999100002')],
    createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'ps3', code: 'S003', barcode: '8850999100003',
    name: 'ทำสีผม',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม', unit: 'ครั้ง',
    costPrice: 0, salePrice: 1500, vatIncluded: true, vatRate: 7,
    productType: 'service',
    status: 'active', stockQty: 999, minStock: 0,
    uoms: [baseUOM('us3_1', 'ครั้ง', 0, 1500, '8850999100003')],
    createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'ps4', code: 'S004', barcode: '8850999100004',
    name: 'นวดศีรษะ',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม', unit: 'ครั้ง',
    costPrice: 0, salePrice: 300, vatIncluded: true, vatRate: 7,
    productType: 'service',
    status: 'active', stockQty: 999, minStock: 0,
    uoms: [baseUOM('us4_1', 'ครั้ง', 0, 300, '8850999100004')],
    createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'ps5', code: 'S005', barcode: '8850999100005',
    name: 'ทำเล็บ',
    categoryId: 'c1', categoryName: 'เครื่องดื่ม', unit: 'ครั้ง',
    costPrice: 0, salePrice: 350, vatIncluded: true, vatRate: 7,
    productType: 'service',
    status: 'active', stockQty: 999, minStock: 0,
    uoms: [baseUOM('us5_1', 'ครั้ง', 0, 350, '8850999100005')],
    createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01'),
  },
  // ─── Products ที่มี Color / Lot / Size / Year ──────────────────────────────
  {
    id: 'p20', code: 'P020', barcode: '8850999020001',
    name: 'เสื้อยืดคอกลม',
    categoryId: 'c4', categoryName: 'ของใช้', unit: 'ตัว',
    costPrice: 80, salePrice: 199, vatIncluded: true, vatRate: 7,
    productType: 'general',
    color: 'ดำ', size: 'L', modelYear: '2024',
    status: 'active', stockQty: 25, minStock: 5,
    uoms: [baseUOM('u20_1', 'ตัว', 80, 199, '8850999020001')],
    createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p21', code: 'P021', barcode: '8850999020002',
    name: 'เสื้อยืดคอกลม',
    categoryId: 'c4', categoryName: 'ของใช้', unit: 'ตัว',
    costPrice: 80, salePrice: 199, vatIncluded: true, vatRate: 7,
    productType: 'general',
    color: 'ขาว', size: 'M', modelYear: '2024',
    status: 'active', stockQty: 18, minStock: 5,
    uoms: [baseUOM('u21_1', 'ตัว', 80, 199, '8850999020002')],
    createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p22', code: 'P022', barcode: '8850999022001',
    name: 'น้ำมันเครื่อง Shell Helix',
    categoryId: 'c4', categoryName: 'ของใช้', unit: 'ขวด',
    costPrice: 280, salePrice: 450, vatIncluded: true, vatRate: 7,
    productType: 'general',
    lotNumber: 'LOT-2024-06A', size: '4 ลิตร', modelYear: '2024',
    status: 'active', stockQty: 12, minStock: 3,
    uoms: [baseUOM('u22_1', 'ขวด', 280, 450, '8850999022001')],
    createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-15'),
  },
  {
    id: 'p23', code: 'P023', barcode: '8850999023001',
    name: 'รองเท้าผ้าใบ Nike Air',
    categoryId: 'c4', categoryName: 'ของใช้', unit: 'คู่',
    costPrice: 1200, salePrice: 2490, vatIncluded: true, vatRate: 7,
    productType: 'general',
    color: 'แดง/ขาว', size: '42', modelYear: '2025',
    status: 'active', stockQty: 8, minStock: 2,
    uoms: [baseUOM('u23_1', 'คู่', 1200, 2490, '8850999023001')],
    createdAt: new Date('2024-05-01'), updatedAt: new Date('2024-06-01'),
  },
];

// ─── findProductByBarcode ─────────────────────────────────────────────────────
export const findProductByBarcode = (
  barcode: string,
  products: ProductMaster[],
): { product: ProductMaster; uom: ProductUOM } | null => {
  for (const product of products) {
    for (const uom of product.uoms ?? []) {
      if (uom.barcodes.includes(barcode)) return { product, uom };
    }
  }
  return null;
};

// ─── Validation Guard (DEV only) ──────────────────────────────────────────────
// ตรวจจับ duplicate id / code / barcode ทุกครั้งที่ module โหลด
(function validateMockProducts() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;

  const seenIds      = new Set<string>();
  const seenCodes    = new Set<string>();
  const seenBarcodes = new Set<string>();
  const errors: string[] = [];

  MOCK_PRODUCTS.forEach((p) => {
    if (seenIds.has(p.id))
      errors.push(`Duplicate id: "${p.id}" (${p.name})`);
    if (seenCodes.has(p.code))
      errors.push(`Duplicate code: "${p.code}" (${p.name})`);

    seenIds.add(p.id);
    seenCodes.add(p.code);

    (p.uoms ?? []).forEach((uom) => {
      uom.barcodes.forEach((bc) => {
        if (seenBarcodes.has(bc))
          errors.push(`Duplicate barcode: "${bc}" → ${p.name} / ${uom.unit}`);
        seenBarcodes.add(bc);
      });
    });
  });

  if (errors.length > 0) {
    console.warn(
      `[mockProducts] ❌ ${errors.length} validation error(s):\n` +
      errors.map((e) => `  • ${e}`).join('\n'),
    );
  } else {
    console.log('[mockProducts] ✅ Validation passed — no duplicates');
  }
})();
