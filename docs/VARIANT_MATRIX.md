# Variant Matrix + Supplier + Category Store — สรุปฟังก์ชัน

เอกสารนี้สรุปฟีเจอร์ที่เพิ่มเข้ามาในสาขา `feat/vmat` แบบย่อ เพื่อให้ทีมเข้าใจขอบเขตและจุดเชื่อมต่อหลัก
ทุกการเปลี่ยนแปลงเป็นแบบ additive และ backward-compatible (สินค้าที่ไม่มี variant/options ทำงานเหมือนเดิมทุกประการ)

## 1. Product Variant Matrix (ระบบตัวเลือกสินค้า)

### Types ใหม่ (`src/types/product.ts`)
- `ProductOption { name: string; values: string[] }` — ชื่อตัวเลือก + ค่าที่เลือกได้ เช่น `{ name: 'สี', values: ['แดง','น้ำเงิน'] }`
- `ProductVariant { id; sku?; barcode?; price?; stockQty; optionValues }` — ตัวแปรสินค้าแต่ละชุด
  - `optionValues` เป็น `Record<string,string>` เช่น `{ สี: 'แดง', ขนาด: 'M' }`
  - `stockQty` เป็นสต็อกระดับ variant (หน่วยฐาน)
  - `price?` เป็นราคาเฉพาะ variant (หน่วยฐาน) — ถ้าไม่ตั้งจะตกลงไปใช้ราคาปกติ
- `ProductMaster` เพิ่ม field optional: `options?`, `variants?`, `supplierId?`, `supplierName?`

### Cart-line id แบบ `__` (double-underscore)
- ไม่มี variant: `${master.id}_${uom.id}` (เหมือนเดิม)
- มี variant: `${master.id}_${uom.id}__${variant.id}`
- **สำคัญ:** master id ไม่มี underscore (`p1`), uom id มี underscore เดี่ยว (`u1_1`) ส่วน delimiter ของ variant เป็น underscore คู่ (`__`)
- ตัวสร้าง id อยู่ที่ `toCartProduct` (`src/utils/cartProduct.ts`) ตัวถอด id อยู่ที่ `deductStock` — ทั้งสองต้องตรงกัน

### การตัดสต็อก variant (`src/store/productStore.ts` → `deductStock`)
- แยก `productId` ด้วย `__` ก่อน เพื่อดึง `variantId` แล้วค่อย `left.split('_')[0]` เพื่อดึง master id (ห้ามใช้การตัดตำแหน่งแบบ positional)
- ถ้ามี `variantId` และสินค้ามี `variants` → ตัดจาก `master.variants[i].stockQty`
- ถ้าไม่มี → ตัดจาก `master.stockQty` ตามเดิม
- มี negative guard `Math.max(0, ...)` ใช้ qty ดิบ (ไม่คูณ ratio)

### ลำดับความสำคัญของราคา (`src/utils/priceResolver.ts` → `resolveCartPrice`)
เพิ่ม argument ตัวที่ 4 `variant?` โดยลำดับคือ:
1. `variant.price` (ถ้าตั้งค่า) — เป็นราคาหน่วยฐาน คูณด้วย `uom.ratio`
2. ราคาต่อสาขา `resolvePrice(master.code, branchId)`
3. ราคาฐาน `uom.salePrice`

เมื่อไม่ส่ง `variant` ผลลัพธ์เหมือนเดิมทุกประการ

### Barcode (`src/data/mockProducts.ts` → `findProductByBarcode`)
- คืนค่า `{ product; uom; variant? } | null`
- ลำดับค้นหา: barcode ของ variant ก่อน (เฉพาะเจาะจงที่สุด) → barcode ของ uom → barcode ของ master
- DEV validation IIFE รวม `variant.barcode` เข้าในการตรวจความซ้ำของบาร์โค้ดด้วย
- สินค้าทดสอบที่มี variant: master `p30` (code `P030`), options `[{ สี: [แดง, น้ำเงิน] }]`, variants `v30_red`/`v30_blue` พร้อมบาร์โค้ดและสต็อกแยก

### VariantSelector (ทำแยกกัน 2 ชุดตามแนวทางเดิมของโปรเจกต์)
เหมือนกับ UOM selector ที่โปรเจกต์มีอยู่แล้ว (mobile inline + web modal) — ไม่ได้รวมเป็น component กลางตัวเดียว เพราะใช้ token คนละระบบ
- **Mobile:** `src/components/sale/VariantSelector.tsx` — bottom-sheet modal ใช้ `Colors`/`Spacing`/`Typography` ผู้ใช้เลือกค่าทีละ option แล้ว resolve variant ที่ตรงกันด้วย `optionValues` สร้าง cart line ผ่าน `toCartProduct(master, master.uoms[0], branchId, variant)` มี preview ราคา, touch target 44px, empty/no-match state ภาษาไทย
- **Web:** modal inline ใน `src/screens/web/WebPOSScreen.tsx` เลียนแบบ UOM Picker Modal ใช้ `WebColors`

### ลำดับ precedence ที่ tap/barcode handler (mobile + web)
Tap: `service` → `variant` (มี `master.variants?.length`) → multi-UOM → เพิ่มลงบิลตรง
Barcode: ถ้าเจอ `variant` → เพิ่มลงบิลตรง (ไม่เปิด modal เพราะระบุ variant ชัดแล้ว); ถ้าเป็นสินค้ามี variant แต่สแกนด้วยบาร์โค้ด master/uom → เปิด VariantSelector (เพราะยังกำกวม); นอกนั้นตามเดิม

### การแสดงสต็อกบนการ์ด
`masterDisplayStock(master)` (`src/utils/cartProduct.ts`): ถ้ามี variant → ผลรวม `variants[].stockQty`; ถ้าไม่มี → `master.stockQty` ใช้กับ grid ของ POS mobile + web

### Kiosk — ไม่รองรับ variant (กรองออก)
`src/screens/kiosk/KioskPOSSaleScreen.tsx`: `KIOSK_PRODUCTS = MOCK_PRODUCTS.filter(m => !(m.variants && m.variants.length))` ใช้ทั้งใน grid, unit lookup และส่งเข้า `findProductByBarcode` เพื่อไม่ให้ kiosk ไปถึง path ของ variant kiosk ยังใช้ `toCartProduct` local 2-argument ของตัวเองตามเดิม (ตั้งใจให้อยู่นอกขอบเขต variant)

## 2. Supplier บน ProductMaster

- `ProductMaster` เพิ่ม `supplierId?` และ `supplierName?` (denormalized สำหรับแสดงผล เหมือน `brandName`/`categoryName`)
- Supplier picker (mobile `AddEditProductScreen` + web `WebProductScreen`):
  - อ่านจาก `supplierStore.getSuppliers()` — **Supplier ไม่มี field `status` จึงไม่กรองตามสถานะ**
  - มีตัวเลือก `— ไม่ระบุ —` (เลือก supplier เป็น optional)
  - แสดง empty state ภาษาไทย `ไม่มีข้อมูล` เมื่อ store ว่าง
  - เมื่อเลือกจะตั้งทั้ง `supplierId` + `supplierName`

## 3. Category Store (`src/store/categoryStore.ts`)

Mirror `brandStore.ts` ทุกประการ:
- zustand + persist `name: 'pos-categories'`, seed `[...MOCK_CATEGORIES]`
- export: `useCategoryStore`, `getCategories()`, `getCategory(id)`, `addCategory`, `updateCategory`, `deleteCategory`, `getCategoryProductCount(id)` (นับ product จาก `useProductStore` ด้วย `categoryId`)
- ทุก mutation เรียก `logAction('หมวดหมู่', ...)` id ใหม่รูปแบบ `cat-<ts>-<rand>`

### Pickers ที่ wire เข้า categoryStore (ไม่มีหน้าจอไหนอ่าน `MOCK_CATEGORIES` ตรง ๆ สำหรับ picker/chip/import อีกแล้ว)
- `CategoryManageScreen.tsx` — tab หมวดหมู่ใช้ `useCategoryStore` + add/update/delete, badge จำนวนใช้ `getCategoryProductCount`
- `AddEditProductScreen.tsx` (mobile) — picker หมวดหมู่ = `getCategories().filter(c => c.status === 'active')`
- `ProductListScreen.tsx` — filter chips แบบ reactive จาก `useCategoryStore`
- `WebProductScreen.tsx` — tab หมวดหมู่ + dropdown ใน product modal ใช้ categoryStore
- `ImportExportScreen.tsx` — ลบ const ระดับโมดูล ย้ายไป derive ชื่อหมวดหมู่แบบ reactive ใน component ผ่าน `getCategories()` ทุกครั้งที่เรียก

### Authoring UI (options/variant grid)
ทั้ง mobile `AddEditProductScreen` และ web `WebProductScreen`:
- Options editor: เพิ่ม/ลบ option (ชื่อ + ค่าคั่นด้วย comma) แก้ options แล้ว regenerate variant grid เป็น cartesian product โดยเก็บแถวเดิมที่ `optionValues` ตรงกันไว้
- Variant grid: แก้ sku / barcode / price? / stockQty ต่อแถว
- Validation (error ภาษาไทยแบบ inline, block การ save): ชื่อ option ต้องมีและไม่ซ้ำ, แต่ละ option ต้องมีค่า ≥ 1, `stockQty` เป็นจำนวนเต็มไม่ติดลบ, `price` (ถ้าใส่) ≥ 0, barcode ของ variant ไม่ซ้ำภายในสินค้าเดียวกัน
- Save payload **เขียนครบทุก key เสมอ** (`options` = `[]` เมื่อไม่มี, `variants` = `[]`, `supplierId`/`supplierName` = `undefined`) เพื่อให้แก้ไขแล้วเคลียร์ค่าได้

## OUT of scope (ไม่อยู่ในขอบเขตงานนี้)

- ราคาต่อ variant ต่อสาขา (per-variant per-branch pricing)
- การจัดการ variant ในเอกสารสต็อก (รับ/จ่าย/ปรับ) — เอกสารสต็อกยังทำงานระดับ master เท่านั้น
- การ import variant ผ่าน CSV
- การรองรับ variant บน kiosk

## หมายเหตุการตรวจสอบ

- `npm run lint`: error ที่เหลือทั้งหมดเป็น baseline เดิม (BranchSelector/DatePicker/PermissionMatrixScreen/RoleManageScreen/WebUserStaffScreen/errorTracking) — ไม่มี error ใหม่จากไฟล์ที่แก้
- Unit tests ที่ครอบคลุม: `cartProduct`, `priceResolver`, `productStore.deductStock`, `findProductByBarcode`, `categoryStore`, `cartAdapter` (regression guard) ผ่านทั้งหมด
- การทำงานของ VariantSelector (mobile/web), การ generate variant grid และการกรอง kiosk ตรวจแบบ integration/manual ด้วยการรันแอป (ไม่อยู่ใน unit suite)
