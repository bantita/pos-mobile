# Implementation Plan: Member Promotion Menu Migration

## Overview

ย้ายโปรโมชั่นสมาชิกจากเมนู CRM มาอยู่ภายใต้เมนูโปรโมชั่น พร้อมจัดโครงสร้างเมนูโปรโมชั่นใหม่เป็น 5 หมวดหมู่ และแก้ไข post-login navigation bug ที่ไปหน้า Reports แทน Dashboard

## Tasks

- [x] 1. แก้ไข post-login navigation bug (Requirement 10)
  - [x] 1.1 แก้ไข WebNavigator onLogin route
    - แก้ไขไฟล์ `src/navigation/WebNavigator.tsx`
    - เปลี่ยน `onLogin={() => setRoute('report_sales_main')}` เป็น `onLogin={() => setRoute('dashboard')}`
    - ตรวจสอบว่า MainNavigator tab แรกคือ Dashboard
    - _Requirements: 10.1, 10.2, 10.5_

- [x] 2. สร้าง Data Types และ Store (พื้นฐานสำหรับทุกฟอร์ม)
  - [x] 2.1 สร้าง type definitions สำหรับ ProductGroupPromotion, BundlePromotion, QuantityPromotion, StorePromoFormData
    - สร้างไฟล์ `src/types/productGroupPromo.ts` — interfaces: ProductGroupPromotion, ProductGroupItem, FreeProductItem
    - สร้างไฟล์ `src/types/bundlePromo.ts` — interfaces: BundlePromotion, BundleProductItem
    - สร้างไฟล์ `src/types/quantityPromo.ts` — interfaces: QuantityPromotion, QuantityProductItem, QuantityTier
    - สร้างไฟล์ `src/types/storePromo.ts` — interface: StorePromoFormData
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 11.1–11.4_

  - [x] 2.2 สร้าง promoManagementStore ด้วย Zustand
    - สร้างไฟล์ `src/store/promoManagementStore.ts`
    - Implement CRUD operations สำหรับ productGroupPromos, bundlePromos, quantityPromos
    - Implement `getActiveCountByCategory()` ที่คำนวณจำนวน active ของแต่ละหมวด
    - _Requirements: 1.3, 2.5, 3.3_

  - [x] 2.3 สร้าง promoValidation utility functions
    - สร้างไฟล์ `src/utils/promoValidation.ts`
    - Implement: validateProductGroupForm, validateBundleForm, validateQuantityForm, validateStorePromoForm
    - Implement: validateDiscountValue, detectTierOverlaps, calculateTierPreview
    - _Requirements: 4.2–4.6, 5.2–5.6, 6.2–6.5, 11.5_

  - [ ]* 2.4 เขียน property tests สำหรับ validation (Properties 4–9, 11)
    - **Property 4: Product count validation enforces type-specific bounds**
    - **Property 5: Free product validation enforces 1–10 items with 1–999 quantity**
    - **Property 6: Form completeness validation rejects incomplete forms**
    - **Property 7: Discount value bounds validation**
    - **Property 8: Quantity tier overlap detection**
    - **Property 9: Quantity tier configuration validation**
    - **Property 11: No-end-date checkbox clears endDate**
    - สร้างไฟล์ `src/__tests__/promoValidation.property.test.ts`
    - ใช้ fast-check library, ขั้นต่ำ 100 iterations ต่อ property
    - **Validates: Requirements 4.2–4.6, 5.2–5.6, 6.2–6.5, 11.5**

- [x] 3. Checkpoint - ตรวจสอบ types, store, และ validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. สร้าง PromoCategoriesScreen (initialRoute ใหม่)
  - [x] 4.1 สร้างหน้าจอ PromoCategoriesScreen
    - สร้างไฟล์ `src/screens/promotion/PromoCategoriesScreen.tsx`
    - แสดง 5 หมวด: ร้านค้า, สมาชิก, กลุ่มสินค้า, สินค้าร่วม, จำนวนสินค้า
    - แต่ละ Card แสดง: ไอคอน (Ionicons), ชื่อภาษาไทย, จำนวน active promotions
    - กดเลือกหมวด → navigate ไปหน้า list ของหมวดนั้น
    - แสดง error state + ปุ่มลองใหม่ เมื่อโหลดข้อมูลล้มเหลว
    - ใช้ UI Components ที่มีอยู่ (Card, Button)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.4_

  - [ ]* 4.2 เขียน property tests สำหรับ filtering และ active count (Properties 1–2)
    - **Property 1: Category filter shows only matching promotions**
    - **Property 2: Active count matches actual active promotions**
    - สร้างไฟล์ `src/__tests__/promoFiltering.property.test.ts`
    - **Validates: Requirements 1.2, 1.3, 3.1, 3.5**

- [x] 5. อัปเดต PromotionNavigator เพิ่ม routes ใหม่
  - [x] 5.1 อัปเดต PromotionNavigator ด้วย routes ใหม่ทั้งหมด
    - แก้ไขไฟล์ `src/navigation/PromotionNavigator.tsx`
    - เปลี่ยน initialRouteName เป็น `PromoCategories`
    - เพิ่ม routes: PromoCategories, MemberPromoList, MemberPromoDetail, StorePromoCreate, GroupProductPromoList, GroupProductPromoCreate, BundleProductPromoList, BundleProductPromoCreate, QuantityPromoList, QuantityPromoCreate
    - อัปเดต `PromoStackParamList` type ตาม design
    - คง route เดิมทั้งหมด (PromoList, PercentDiscount, FixedDiscount, Coupon, MemberPrice, AdvancedPromo)
    - Back navigation จากทุก sub-screen กลับไป PromoCategories
    - _Requirements: 7.1–7.7_

- [x] 6. สร้างหน้ารายการโปรโมชั่นแต่ละหมวด
  - [x] 6.1 สร้าง MemberPromoListScreen
    - สร้างไฟล์ `src/screens/promotion/MemberPromoListScreen.tsx`
    - แสดงรายการโปรโมชั่นสมาชิก 12 ประเภท พร้อมชื่อ, ประเภท, สถานะ (badge แยกสี)
    - เรียงลำดับตาม priority จากน้อยไปมาก
    - กดเลือก → navigate ไป MemberPromoDetail ด้วย promoId
    - แสดง error toast ถ้าไม่พบข้อมูลใน memberPromoStore
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 6.2 เขียน property test สำหรับ member promo sorting (Property 3)
    - **Property 3: Member promotions sorted by priority**
    - สร้างไฟล์ `src/__tests__/promoFiltering.property.test.ts` (เพิ่มเข้าไฟล์เดิม)
    - **Validates: Requirements 2.1**

  - [x] 6.3 สร้าง GroupProductPromoListScreen
    - สร้างไฟล์ `src/screens/promotion/GroupProductPromoListScreen.tsx`
    - แสดงรายการโปรโมชั่นกลุ่มสินค้า พร้อมสถานะ (draft/active/expired/disabled)
    - ปุ่มสร้างใหม่ → navigate ไป GroupProductPromoCreate
    - Empty state + ปุ่มสร้างใหม่เมื่อไม่มีรายการ
    - _Requirements: 4.1_

  - [x] 6.4 สร้าง BundleProductPromoListScreen
    - สร้างไฟล์ `src/screens/promotion/BundleProductPromoListScreen.tsx`
    - แสดงรายการโปรโมชั่นสินค้าร่วม พร้อมสถานะ + ปุ่มสร้างใหม่
    - Empty state เมื่อไม่มีรายการ
    - _Requirements: 5.1_

  - [x] 6.5 สร้าง QuantityPromoListScreen
    - สร้างไฟล์ `src/screens/promotion/QuantityPromoListScreen.tsx`
    - แสดงรายการโปรโมชั่นตามจำนวน พร้อมสถานะ + ปุ่มสร้างใหม่
    - Empty state เมื่อไม่มีรายการ
    - _Requirements: 6.1_

  - [x] 6.6 อัปเดต PromoListScreen เพิ่ม status filter สำหรับหมวดร้านค้า
    - แก้ไขไฟล์ `src/screens/promotion/PromoListScreen.tsx`
    - เพิ่ม filter tabs: all, active, expired, disabled
    - แสดงจำนวนรายการในแต่ละสถานะ
    - เพิ่มปุ่มสร้างโปรโมชั่นใหม่ (เลือกประเภท 6 แบบ: ส่วนลด %, ส่วนลดเงิน, คูปอง, ซื้อ X แถม Y, Mix & Match, Happy Hour)
    - แสดง empty state + ปุ่มสร้าง เมื่อไม่มีผลลัพธ์
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Checkpoint - ตรวจสอบ navigation และหน้ารายการ
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. สร้างฟอร์มสร้างโปรโมชั่น (Requirement 11)
  - [x] 8.1 สร้าง StorePromoCreateScreen
    - สร้างไฟล์ `src/screens/promotion/StorePromoCreateScreen.tsx`
    - ฟอร์มฟิลด์: ชื่อ (required), วันที่เริ่ม (required), วันที่สิ้นสุด (required + checkbox "ไม่กำหนดวันสิ้นสุด"), ส่วนลด %, ราคาขั้นต่ำ, รายละเอียด, คลังสินค้า/สาขา
    - ปุ่ม "เพิ่ม" (บันทึก) และ "ยกเลิก"
    - Checkbox "ไม่กำหนดวันสิ้นสุด" ซ่อนฟิลด์ endDate
    - แสดง validation errors inline ใต้แต่ละ field
    - บันทึกสำเร็จ → แสดงข้อความยืนยัน + navigate กลับ PromoList
    - _Requirements: 11.1, 11.5, 11.6, 11.7_

  - [x] 8.2 สร้าง GroupProductPromoCreateScreen
    - สร้างไฟล์ `src/screens/promotion/GroupProductPromoCreateScreen.tsx`
    - ฟอร์มฟิลด์: ชื่อ (required), วันที่เริ่ม, วันที่สิ้นสุด (+ checkbox), คลังสินค้า/สาขา, รายละเอียด, เลือกสินค้า + จำนวน + มูลค่า (min 2, max 200), ราคารวมขั้นต่ำ (0–999,999.99), ประเภทส่วนลด (4 แบบ), เลือกสินค้าแถม (ถ้าเลือก free_product, 1–10 รายการ, qty 1–999)
    - Validation: ไม่ให้บันทึกถ้าสินค้าไม่ครบ 2 รายการ หรือไม่ได้เลือกรูปแบบส่วนลด
    - ปุ่ม "เพิ่ม" + "ยกเลิก"
    - _Requirements: 4.2–4.6, 11.2, 11.5, 11.6, 11.7_

  - [x] 8.3 สร้าง BundleProductPromoCreateScreen
    - สร้างไฟล์ `src/screens/promotion/BundleProductPromoCreateScreen.tsx`
    - ฟอร์มฟิลด์: ชื่อ (required), วันที่เริ่ม, วันที่สิ้นสุด (+ checkbox), คลังสินค้า/สาขา, เลือกสินค้าร่วม + จำนวน + มูลค่า (min 2, max 50), ราคารวมขั้นต่ำ, ประเภทส่วนลด (4 แบบ), เลือกสินค้าแถม (ถ้า free_product)
    - Validation: ไม่ให้บันทึกถ้าข้อมูลจำเป็นไม่ครบ (ชื่อ, วันที่, ส่วนลด, สินค้า < 2)
    - Validate discount bounds: percent 1–99, set_price > 0, fixed_amount > 0
    - ปุ่ม "เพิ่ม" + "ยกเลิก"
    - _Requirements: 5.2–5.6, 11.3, 11.5, 11.6, 11.7_

  - [x] 8.4 สร้าง QuantityPromoCreateScreen
    - สร้างไฟล์ `src/screens/promotion/QuantityPromoCreateScreen.tsx`
    - ฟอร์มฟิลด์: ชื่อ (required), วันที่เริ่ม, วันที่สิ้นสุด (+ checkbox), คลังสินค้า/สาขา, เลือกสินค้า (min 1), ปุ่ม "เพิ่ม" tier (1–10 tiers, minQty ≥ 1, maxQty ≤ 9,999, discount 0.01–99.99%)
    - แสดงตัวอย่างการคำนวณส่วนลด (preview) เมื่อ tiers ครบ
    - Validation: ตรวจ tier overlap, ไม่ให้บันทึกถ้ายังไม่ได้เลือกสินค้า
    - ปุ่ม "บันทึก" + "ยกเลิก"
    - _Requirements: 6.2–6.5, 11.4, 11.5, 11.6, 11.7_

  - [ ]* 8.5 เขียน property test สำหรับ tier calculation (Property 10)
    - **Property 10: Discount preview calculation correctness**
    - สร้างไฟล์ `src/__tests__/tierCalculation.property.test.ts`
    - **Validates: Requirements 6.5**

- [x] 9. Checkpoint - ตรวจสอบฟอร์มและ validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. อัปเดต MemberNavigator (shortcut + read-only promo display)
  - [x] 10.1 อัปเดต PointHistoryScreen เพิ่ม read-only member promo section
    - แก้ไขไฟล์ `src/screens/member/PointHistoryScreen.tsx`
    - เพิ่ม section แสดง active member promos ที่สมาชิกผ่านเงื่อนไข (read-only)
    - แสดง: ชื่อโปรโมชั่น, ประเภท, สรุปรางวัล, วันหมดอายุ
    - แสดง empty state ถ้าไม่มีโปรโมชั่นที่ผ่านเงื่อนไข + ปุ่มลัด "สร้างโปรโมชั่นสมาชิก"
    - _Requirements: 8.3, 8.5_

  - [x] 10.2 เพิ่มปุ่มลัด "สร้างโปรโมชั่นสมาชิก" ใน MemberNavigator
    - แก้ไข MemberNavigator หรือหน้าจอที่เกี่ยวข้อง
    - ปุ่มลัดนำทางข้ามไปยัง Promotion_Navigator (หมวดสมาชิก: MemberPromoList)
    - ตรวจสอบว่า Member_Navigator ยังมีหน้าจอ MemberList, AddMember, PointHistory, Redeem ครบ
    - _Requirements: 2.4, 8.1, 8.2, 8.4_

- [x] 11. อัปเดต Web Promotion Screen (categories)
  - [x] 11.1 อัปเดต WebPromotionScreen แสดงหมวดหมู่โปรโมชั่น
    - แก้ไขไฟล์ `src/screens/web/WebPromotionScreen.tsx`
    - แสดง 5 หมวดหมู่เดียวกับ mobile (ร้านค้า, สมาชิก, กลุ่มสินค้า, สินค้าร่วม, จำนวนสินค้า)
    - Layout: Card Grid multi-column (320px/card) สำหรับหน้าจอ ≥ 768px
    - Layout: single-column สำหรับหน้าจอ < 768px
    - Filter Tabs: horizontal scroll บน mobile, ปกติบน desktop
    - Responsive: ปรับ layout ทันทีเมื่อเปลี่ยนขนาดหน้าจอ โดยไม่ reload + ไม่สูญเสียข้อมูลฟอร์ม
    - _Requirements: 7.5, 9.2, 9.3, 9.5, 9.6_

- [x] 12. Final checkpoint - ตรวจสอบระบบทั้งหมด
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (fast-check library)
- Unit tests validate specific examples and edge cases
- ลำดับ priority: Requirement 10 (post-login bug) → Requirement 11 (forms) ทำก่อน
- ใช้ UI Components ที่มีอยู่ (Card, Button, Input) ไม่เพิ่ม dependency ใหม่
- ใช้ Zustand สำหรับ state management (ตาม pattern ที่มีอยู่ใน project)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["6.1", "6.3", "6.4", "6.5", "6.6"] },
    { "id": 5, "tasks": ["6.2", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["8.5", "10.1", "10.2"] },
    { "id": 7, "tasks": ["11.1"] }
  ]
}
```
