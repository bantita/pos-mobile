# Tasks — Phase 2: CRM, Promotion & Purchase

## Task 1: สร้าง Type Definitions
- [x] สร้าง `src/types/member.ts` — Member, PointTransaction, PointConfig interfaces
- [x] สร้าง `src/types/promotion.ts` — Promotion, CouponUsage, AppliedDiscount interfaces
- [x] สร้าง `src/types/purchase.ts` — Supplier, PR, PO, POReceive interfaces

## Task 2: สร้าง Mock Data
- [x] สร้าง `src/data/mockMembers.ts` — ข้อมูลสมาชิกตัวอย่าง 10 คน + point transactions
- [x] สร้าง `src/data/mockPromotions.ts` — โปรโมชั่นตัวอย่าง 5 รายการ (แต่ละประเภท)
- [x] สร้าง `src/data/mockPurchase.ts` — Supplier 3 ราย, PR 2, PO 3, Receive 2

## Task 3: สร้าง Zustand Stores
- [x] สร้าง `src/store/memberStore.ts` — CRUD สมาชิก, earn/redeem points
- [x] สร้าง `src/store/promoStore.ts` — CRUD promotion, calculateDiscount, validateCoupon
- [x] สร้าง `src/store/purchaseStore.ts` — CRUD supplier/PR/PO, receivePO

## Task 4: M06 CRM Screens (Mobile)
- [x] สร้าง `src/screens/member/MemberListScreen.tsx` — ค้นหา แสดงรายการ
- [x] สร้าง `src/screens/member/AddMemberScreen.tsx` — form เพิ่ม/แก้ไขสมาชิก
- [x] สร้าง `src/screens/member/PointHistoryScreen.tsx` — timeline คะแนน
- [x] สร้าง `src/screens/member/RedeemScreen.tsx` — ใช้คะแนนแลกส่วนลด
- [x] สร้าง `src/navigation/MemberNavigator.tsx`

## Task 5: M07 Promotion Screens (Mobile)
- [x] สร้าง `src/screens/promotion/PromoListScreen.tsx` — รายการ + filter
- [x] สร้าง `src/screens/promotion/PercentDiscountScreen.tsx` — form ส่วนลด %
- [x] สร้าง `src/screens/promotion/FixedDiscountScreen.tsx` — form ส่วนลดเงิน
- [x] สร้าง `src/screens/promotion/CouponScreen.tsx` — สร้าง/จัดการคูปอง
- [x] สร้าง `src/screens/promotion/MemberPriceScreen.tsx` — ราคาสมาชิก
- [x] สร้าง `src/screens/promotion/AdvancedPromoScreen.tsx` — Buy X Get Y / Mix & Match
- [x] สร้าง `src/navigation/PromotionNavigator.tsx`

## Task 6: M08 Purchase Screens (Mobile)
- [x] สร้าง `src/screens/purchase/SupplierListScreen.tsx` — CRUD supplier
- [x] สร้าง `src/screens/purchase/PRScreen.tsx` — สร้าง/อนุมัติ PR
- [x] สร้าง `src/screens/purchase/POScreen.tsx` — สร้าง/อนุมัติ PO
- [x] สร้าง `src/screens/purchase/ReceivePOScreen.tsx` — รับสินค้าตาม PO
- [x] สร้าง `src/navigation/PurchaseNavigator.tsx`

## Task 7: Web Screens
- [x] สร้าง `src/screens/web/WebCRMScreen.tsx` — hub สมาชิก + ค้นหา + ประวัติ
- [x] สร้าง `src/screens/web/WebPromotionScreen.tsx` — hub โปรโมชั่น + สร้าง/แก้ไข
- [x] สร้าง `src/screens/web/WebPurchaseScreen.tsx` — hub จัดซื้อ (Supplier/PR/PO/Receive)

## Task 8: Navigation Integration
- [x] แก้ `src/navigation/MainNavigator.tsx` — เพิ่ม Tab สำหรับ Member/Promo/Purchase
- [x] แก้ `src/navigation/WebNavigator.tsx` — เพิ่ม routes crm/promotions/purchase
- [x] แก้ `src/components/web/WebSidebar.tsx` — เพิ่ม NAV_ITEMS สำหรับ Phase 2
- [x] แก้ `src/constants/rolePermissions.ts` — เพิ่ม permissions สำหรับ crm/promotions/purchase

## Task 9: POS Integration
- [x] แก้หน้าขายสินค้า — เพิ่มปุ่มเลือกสมาชิก + คำนวณคะแนน
- [x] แก้หน้าชำระเงิน — เพิ่มช่องใช้คูปอง + ใช้คะแนน
- [x] แก้ logic คำนวณราคา — apply promotions อัตโนมัติ

## Task 10: Testing & Polish
- [x] ตรวจ Role Permission ทุกหน้า
- [ ] ตรวจ Audit Log ทุก action สำคัญ
- [ ] ตรวจ Offline Mode — cache data สมาชิก/โปรโมชั่น
- [ ] ตรวจ Export Excel/PDF ในรายงานที่เกี่ยวข้อง
- [ ] ตรวจ Responsive (mobile/tablet/web)
