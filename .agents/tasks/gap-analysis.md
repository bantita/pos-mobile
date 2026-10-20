# Gap Analysis — POS CRM (d:\pos-mobile) vs. 10-Chapter User Manual

วันที่วิเคราะห์: การตรวจแบบ read-only (ไม่แก้โค้ด) เทียบโค้ดจริงกับคู่มือใน `docs/USER_MANUAL/`
Branch: `main` @ `93b2c6f`

---

## สรุปคำตอบ (Executive Summary)

ตัวแอปเป็น **Expo / React Native Web POS CRM ที่สมบูรณ์ในระดับ "front-end + mock data"** มากกว่าที่คาด — มีหน้าจอครบเกือบทุกโมดูลในคู่มือ ทั้งฝั่ง mobile (`src/screens/<module>/`) และฝั่ง web back-office (`src/screens/web/`) พร้อม zustand stores + mock data รองรับ และยังมี **promotion/points engine ที่เขียนไว้ครบ** (`src/engine/`) และ **service layer stub สำหรับ backend จริง** (`src/services/api/`)

ช่องว่างหลักแบ่งเป็น 3 กลุ่ม:

1. **Front-end/mock ที่ทำเพิ่มได้เลย (คุ้มสุด):**
   - **โหมดการขาย ปกติ/Pre-order/Delivery/Dine-in — ยังไม่มีเลย** โค้ด "Sale Mode" ที่มีอยู่ (`saleModeStore`) เป็นคนละเรื่อง (เป็น input method: ปุ่ม/สแกน/ทั้งสอง)
   - **Promotion engine ที่เขียนไว้ครบ (`src/engine/`) ไม่ได้ถูกต่อเข้ากับ cart/payment จริง** — หน้าชำระเงินทำแค่ validate คูปอง 1 ใบ + ส่วนลดบิลเดียว ส่วน buy X get Y / happy hour / mix&match / member price ไม่ถูก apply อัตโนมัติตอนขาย
   - **PromptPay QR ใช้ placeholder** ทั้งที่มี generator EMVCo จริงอยู่แล้ว (`generatePromptPayQR`) — ต่อให้เรนเดอร์ QR จริงได้โดยไม่ต้อง backend
   - Dashboard KPI / low-stock ใช้ค่า hardcode ไม่ได้ดึงจาก store จริง

2. **Auth ที่เป็น stub:** Login บน mobile navigator และ OTP/Forgot password เป็น no-op (ไม่เช็ค credential จริง) — ฝั่ง web ต่อ `authStore.login()` จริงแล้ว

3. **Backend-dependent (ทำในรีโปนี้อย่างเดียวไม่จบ):** LINE Messaging API / Webhook / LIFF / Rich Menu, auto-confirm การชำระผ่าน bank/gateway, SMS/Push จริง, การ sync จริง + conflict resolution ระดับ server, ERP integration — ทั้งหมดมี UI + mock + service stub แต่ต้องมีเซิร์ฟเวอร์ + credential จริงจึงจะทำงาน

> หมายเหตุคำถามแรกของผู้ใช้ (เว็บ 2 โดเมนเป็นโปรเจคเดียวกันไหม): git log ของรีโปนี้ rebrand เป็น "Xcellence POS" และมี WebNavigator/WebLayout ครบ สอดคล้องกับเว็บที่ deploy — รีโปนี้คือ source ของเว็บฝั่ง POS/Admin ดังกล่าว (ยืนยันแบบ UI/metadata ไม่ได้ fetch ตัวเว็บจริงในโหมด read-only นี้)

---

## หลักฐานแยกตามโมดูล

ป้ายกำกับ: **[DONE]** ตรงคู่มือ · **[PARTIAL]** มีแต่ขาด/ต่าง · **[MISSING]** ไม่พบ · **[BACKEND-DEPENDENT]** ต้องมี server/credential จริง

### M01 — Authentication (01_overview)

| ฟีเจอร์ | สถานะ | คู่มือต้องการ vs โค้ดที่มี | ไฟล์ |
|--------|-------|--------------------------|------|
| Register ร้านใหม่ | **[DONE]** | สมัคร → สร้างร้าน → เข้า dashboard; `register()` ล้าง storage + ตั้ง fresh-store flag + reload | `src/store/authStore.ts` (`register`), `src/screens/auth/RegisterShopScreen.tsx` |
| Login (เว็บ) | **[DONE]** | เช็ค credential จริงกับ `registeredUsers` + demo users + super admin `xclnc` | `src/store/authStore.ts` (`login`), `src/navigation/WebNavigator.tsx` |
| Login (mobile) | **[PARTIAL]** | ควรเช็ค credential แต่ `AuthNavigator` เรียก `onAuthSuccess()` ตรงๆ มี `// TODO: connect to auth store` — เข้าได้โดยไม่ตรวจรหัส | `src/navigation/AuthNavigator.tsx` |
| OTP Login | **[PARTIAL]** | UI 2-step (กรอกเบอร์→OTP 6 หลัก) ครบ แต่ `onRequestOTP`/`onVerifyOTP` เป็น no-op; บนเว็บ `onOTPLogin={() => {}}` | `src/screens/auth/OTPLoginScreen.tsx`, `AuthNavigator.tsx`, `WebNavigator.tsx` |
| ลืมรหัสผ่าน | **[PARTIAL]** | มีหน้าจอ แต่ `onResetSuccess` แค่ navigate กลับ ไม่เปลี่ยนรหัสจริงใน store | `src/screens/auth/ForgotPasswordScreen.tsx` |

สรุป M01: โครงหน้าจอครบ 5 จอ แต่ OTP/Forgot/Login-mobile ยังไม่ผูก logic จริง (ทำ mock-level ได้: เก็บ OTP ใน store, reset password ใน `registeredUsers`)

### M02 — Dashboard

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| KPI ยอดขาย/บิล/ลูกค้า/สต๊อกต่ำ | **[PARTIAL]** | การ์ด KPI + trend มีครบ แต่ค่าเป็น **hardcode** (`data.todaySales` ฯลฯ) ไม่ดึงจาก `saleHistoryStore`/`productStore` | `src/screens/dashboard/DashboardScreen.tsx`, `MainDashboardScreen.tsx` |
| แจ้งเตือนสต๊อกต่ำ | **[PARTIAL]** | section + badge มี แต่ `LOW_STOCK`/`lowStockProducts` เป็น array คงที่ ไม่ผูกกับ min stock จริงของ `productStore` | `DashboardScreen.tsx`, `MainDashboardScreen.tsx` |
| Dashboard แคชเชียร์ (ยอดกะ) | **[DONE]** | ดึงจาก `shiftStore` จริง (salesAmount/billCount/avg) | `src/screens/dashboard/CashierDashboardScreen.tsx` |

### M03 — POS Sale (02_pos_sale)

| ฟีเจอร์ | สถานะ | คู่มือ vs โค้ด | ไฟล์ |
|--------|-------|--------------|------|
| ตะกร้า + เพิ่ม/ลด/ลบ/แก้ราคา-ส่วนลดรายรายการ | **[DONE]** | `cartStore` ครบ: addItem, updateQty, updateItemDiscount, setDiscount, VAT 7% | `src/store/cartStore.ts`, `src/screens/sale/CartScreen.tsx`, `POSSaleScreen.tsx` |
| ค้นหา/เลือกสินค้าเป็น grid | **[DONE]** | grid + หมวดหมู่ + ปรับคอลัมน์/ขนาด | `POSSaleScreen.tsx`, `SaleModePicker.tsx` |
| สแกนบาร์โค้ด | **[PARTIAL]** | มีหน้าจอ scanner + โหมด scan/both + รองรับ external scanner (พิมพ์ในช่องค้นหา) แต่กล้องจริงต้องทดสอบบนอุปกรณ์ | `src/screens/sale/BarcodeScannerScreen.tsx`, `WebScannerScreen.tsx` |
| เลือกสมาชิก + แสดงคะแนน | **[DONE]** | modal ค้นหาสมาชิก + badge ระดับ ใน PaymentScreen | `src/screens/sale/PaymentScreen.tsx`, `memberStore.ts` |
| คูปอง | **[PARTIAL]** | validate 1 ใบ + คำนวณ % / จำนวนเงิน + cap ได้ แต่ไม่ auto-apply โปรร้านจาก engine | `PaymentScreen.tsx` (`handleValidateCoupon`), `promoStore.ts` (`validateCoupon`) |
| แลกคะแนน | **[DONE]** | ขั้นต่ำ/อัตราแลกจาก `pointConfig`; หักคะแนนตอนปิดบิล (`redeemPoints`) | `PaymentScreen.tsx`, `memberStore.ts` |
| ให้คะแนนหลังขาย + auto-upgrade ระดับ | **[DONE]** | `earnPoints` + เช็ค `MOCK_LEVEL_CONFIGS` เลื่อนระดับอัตโนมัติ | `PaymentScreen.tsx` (`handleConfirmPayment`) |
| Split Payment | **[DONE]** | เลือกหลายช่องทาง คำนวณคงเหลือ/ทอน | `PaymentScreen.tsx` (`showSplitMode`) |
| โหมดขาย ปกติ/Pre-order/Delivery/Dine-in | **[MISSING]** | คู่มือต้องการ 4 โหมด (จอง ไม่ตัดสต๊อก / บันทึกที่อยู่ / ระบุโต๊ะ) **ไม่พบใน code เลย**; `saleMode.ts` คือ input method (button/scan/both) คนละความหมาย; เจอแค่ placeholder "โต๊ะ 3" ใน HoldBill | `src/types/saleMode.ts`, `SaleModePicker.tsx`, `HoldBillScreen.tsx` |
| พักบิล (Hold/Recall) | **[DONE]** | เกินคู่มือ — `holdBill/recallBill/deleteHoldBill` | `cartStore.ts`, `HoldBillScreen.tsx` |
| ยกเลิกบิล (Void) + เหตุผล + คืนสต๊อก | **[PARTIAL]** | มีหน้าจอ void/cancel + document cancellation แต่ "ใส่ PIN" ตามสิทธิ์ยังไม่บังคับใช้จริงในทุก flow | `src/screens/sale/CancelBillScreen.tsx`, `DocumentCancellationScreen.tsx` |
| คืนสินค้า (Return/Refund) | **[DONE]** (ฝั่งเว็บ) | เลือกบิล→เลือกรายการ+จำนวน→เหตุผล→คืนเงิน(เงินสด/เครดิต)+คืนสต๊อก | `src/screens/web/WebReturnScreen.tsx` (`returnItems`, `deductStock` ลบ qty) |
| พิมพ์ใบเสร็จ / ส่งใบเสร็จ LINE | **[PARTIAL]** | มี ReceiptScreen + ตั้งค่าเครื่องพิมพ์; "ส่งใบเสร็จทาง LINE" เป็น backend-dependent | `src/screens/sale/ReceiptScreen.tsx`, `receiptStore.ts` |

### Payment / QR (03_payment_setup) — cross-cutting

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| ช่องทาง เงินสด/บัตร/QR/โอน/E-Wallet | **[DONE]** | 5 ช่องทางใน PaymentScreen + ช่องกรอก reference | `PaymentScreen.tsx` (`PAYMENT_METHODS`) |
| PromptPay QR (EMVCo สร้าง offline) | **[PARTIAL]** | **มี generator EMVCo จริงพร้อม CRC16** (`generatePromptPayQR`) แต่ PaymentScreen เรนเดอร์ไอคอน placeholder + ข้อความ "QR จะถูก generate จาก Payment Gateway" ไม่ได้เรียก generator และไม่ได้ render QR image จริง | `src/services/api/paymentApi.ts` (`generatePromptPayQR`, `generateOfflineQR`), `PaymentScreen.tsx` (QR Modal) |
| ตั้งค่าเลข PromptPay / บัญชีธนาคาร | **[PARTIAL]** | `PROMPTPAY_ID` อยู่ใน `env.ts` (ค่า default) — ยังไม่มีหน้าตั้งค่าช่องทางชำระใน settings ที่กรอกเลขแล้วผูกเข้า QR | `src/config/env.ts` |
| Auto-confirm / reconcile ผ่าน bank API | **[BACKEND-DEPENDENT]** | `paymentApi.create/checkStatus/confirm/refund/getHistory` เป็น stub ชี้ `localhost:3000`; ต้องมี backend + merchant credential (2C2P/SCB/Omise) + webhook | `src/services/api/paymentApi.ts` |

### M04 — Product (07_products_inventory)

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| เพิ่ม/แก้ไขสินค้า (SKU, barcode, ราคา, min stock, รูป) | **[DONE]** | | `src/screens/product/AddEditProductScreen.tsx`, `AddProductScreen.tsx`, `productStore.ts` |
| หมวดหมู่ (สร้าง/สี/จัดลำดับ) | **[DONE]** | | `src/screens/product/CategoryManageScreen.tsx` |
| UOM หลายระดับ (แพ็ค/ขวด + อัตราส่วน + ราคา/บาร์โค้ดต่อหน่วย) | **[DONE]** | มี component จัดการ UOM เต็มรูปแบบ | `src/components/product/UOMManager.tsx`, `src/types/product.ts` |
| Import/Export CSV | **[PARTIAL]** | มีหน้าจอ Import/Export; การ parse/preview CSV จริงควรตรวจเพิ่ม | `src/screens/product/ImportExportScreen.tsx` |
| กำหนดราคา (pricing module) | **[DONE]** | มี store + หน้าจอแยก | `src/store/pricingStore.ts`, `src/screens/web/WebPricingModuleScreen.tsx` |

### M05 — Inventory (07_products_inventory)

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| ดูสต๊อก + สถานะ ปกติ/ใกล้หมด/หมด + มูลค่ารวม | **[DONE]** | | `src/screens/inventory/StockDocListScreen.tsx`, `src/data/mockInventory.ts` |
| รับสินค้า (Receive) draft/confirm + ต้นทุน | **[DONE]** | `addDocument`/`confirmDocument`, docType `receive`, สถานะ draft→confirmed | `src/store/stockDocStore.ts`, `StockDocFormScreen.tsx` |
| เบิก/โอน (Issue/Transfer) ต้นทาง→ปลายทาง | **[DONE]** | docType `issue` + `toWarehouse` | `stockDocStore.ts` |
| Revise เอกสารที่ confirmed + เหตุผล + history | **[DONE]** | `reviseDocument` สร้าง rev ใหม่ status draft, เดิม→revised, เก็บ `revisionHistory` | `stockDocStore.ts` |
| สแกนบาร์โค้ดตอนรับ/ตรวจนับ | **[PARTIAL]** | ใช้ scanner ร่วมกับ POS; auto-count ตอนรับควรตรวจบนอุปกรณ์จริง | `BarcodeScannerScreen.tsx` |

### M06 — CRM & Loyalty (04_crm_line)

| ฟีเจอร์ | สถานะ | คู่มือ vs โค้ด | ไฟล์ |
|--------|-------|--------------|------|
| เพิ่ม/ค้นหาสมาชิก (ชื่อ/เบอร์/เลขสมาชิก real-time) | **[DONE]** | `addMember`, `searchMembers`, auto `MEM-XXXXXX` | `src/store/memberStore.ts`, `src/screens/member/*` |
| ระดับสมาชิก 5 ชั้น (Member/Silver/Gold/Platinum/VIP) | **[PARTIAL]** | ครบ 5 ชั้น แต่ **เกณฑ์/สิทธิ์ต่างจากคู่มือ**: คู่มือ Silver 5,000 / Gold 15,000 / Platinum 50,000 / VIP 100,000 และ Gold x1.5, Platinum x2, VIP x3; โค้ด `MOCK_LEVEL_CONFIGS` ใช้ Gold **30,000** / Platinum **100,000** / VIP **250,000** และ discount/ multiplier ต่างค่า | `src/data/mockMembers.ts` (`MOCK_LEVEL_CONFIGS`), `src/types/member.ts` |
| ตั้งค่าอัตราคะแนน (earn/redeem/min/expire) | **[PARTIAL]** | `PointConfig` ครบ 4 ค่า (earn 25, redeem 1, min 50, expire 365) แต่ยังไม่พบหน้า "ตั้งค่า > CRM > คะแนนสะสม" ให้แก้ค่าพวกนี้ (ใช้ค่า mock คงที่) | `memberStore.ts` (`pointConfig`), `mockMembers.ts` (`MOCK_POINT_CONFIG`) |
| คะแนนหมดอายุ | **[PARTIAL]** | มี `expireDate` ต่อ transaction + ประเภท `expire` ใน mock แต่ไม่มี job/logic หมดอายุอัตโนมัติ (frontend-only) | `memberStore.ts` |
| ให้/แลกคะแนน | **[DONE]** | `earnPoints`/`redeemPoints` + ประวัติ | `memberStore.ts`, `PointHistoryScreen.tsx`, `RedeemScreen.tsx` |
| อัปเกรดระดับอัตโนมัติ | **[PARTIAL]** | เลื่อน "ทีละขั้น" ต่อการขาย 1 ครั้ง (เทียบ next level เท่านั้น) — ถ้ายอดกระโดดข้ามหลายขั้นจะไม่ข้ามให้; ใช้เกณฑ์ mock (ไม่ตรงคู่มือ) | `PaymentScreen.tsx` (`handleConfirmPayment`) |
| ผูก LINE กับสมาชิก (LIFF/QR) | **[BACKEND-DEPENDENT]** | มี `linkContactToMember` ใน communicationStore (mock) + `lineApi.linkMember` stub; LIFF/QR จริงต้องมี LINE channel + backend | `communicationStore.ts`, `src/services/api/lineApi.ts` |
| Member Wallet (เติมเงิน/จ่าย) | **[DONE]** (เกินคู่มือ) | มี wallet + transaction mock | `walletStore.ts`, `mockMembers.ts` (`MOCK_WALLETS`) |

### M07 — Promotion (05_promotions)

โครงสร้างโปรโมชั่นมี **2 ระบบซ้อนกัน**: (ก) `promoStore` + `types/promotion.ts` (7 ประเภทพื้นฐาน) และ (ข) `promoManagementStore` + `types/memberPromotion.ts` (**18 ประเภทโปรสมาชิก**) + engine แยก `src/engine/`

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| 7 ประเภทโปร (percent/fixed/coupon/member_price/buy_x_get_y/mix_match/happy_hour) | **[PARTIAL]** | `PromoType` ประกาศครบ 7 ชนิด; mock มีตัวอย่าง **6/7** (ขาด `mix_match`); มีหน้าจอสร้างต่อชนิด (Percent/Fixed/Quantity/Group/Bundle/Member) | `src/types/promotion.ts`, `src/data/mockPromotions.ts`, `src/screens/promotion/*` |
| โปร auto-apply ตอนขาย (ไม่ใช่แค่คูปอง) | **[PARTIAL/MISSING ในทางปฏิบัติ]** | **engine คำนวณครบ** (bill/percent/amount/per-unit/free-gift + conditions day/time/product/member/amount/coupon + conflict resolver) **แต่ไม่ถูกเรียกจาก sale flow เลย** — `calculate()` ถูกใช้แค่ใน `engine.test.ts`; PaymentScreen apply แค่คูปอง 1 ใบ + bill discount เดียว ดังนั้น Happy Hour / Buy X Get Y / Mix&Match / Member price ไม่ทำงานอัตโนมัติตอนคิดเงินจริง | `src/engine/core/engine.ts`, `src/engine/benefits/*`, `src/engine/conditions/*`, `PaymentScreen.tsx` |
| 10 ตัวอย่างแคมเปญ CRM | **[PARTIAL]** | `MemberPromoType` 18 แบบครอบคลุม Welcome/Birthday/Level-up/Win-back/Stamp/Referral/VIP/Milestone ครบเชิงโครงสร้าง + mock 12 ตัว; **แต่** trigger อัตโนมัติ (ส่งตอนสมัคร/ก่อนวันเกิด/ครบ 30 วัน), stamp card accrual, referral link, countdown/flash-sale limit ยังไม่มี logic จริง (เป็น data/ UI) | `src/types/memberPromotion.ts`, `src/data/mockMemberPromotions.ts`, `src/store/promoManagementStore.ts` |
| Stacking rules (ห้าม/อนุญาตใช้ร่วม, เลือกส่วนลดสูงสุด) | **[PARTIAL]** | engine มี `resolveConflicts` (firstMatch/highestPriority/bestBenefit) + field `stackable`/`priority` แต่ไม่ถูกใช้ใน PaymentScreen | `src/engine/conflict/*`, `types/promotion.ts` |
| Promotion dashboard (usage/discount given/ROI) | **[PARTIAL]** | `usageCount`/`totalDiscountGiven` ถูกอัปเดตเมื่อ applyCoupon; ROI ยังไม่มี | `promoStore.ts`, `WebCampaignScreen.tsx` |

### M08 — Communication (04_crm_line / 10_line_rich_menu)

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| Broadcast + target (ทุกคน/ระดับ/segment/tag) | **[PARTIAL]** | `createBroadcast`/`sendBroadcast` คำนวณ target + simulate sent/open/click; ทำงานบน mock contacts เท่านั้น | `src/store/communicationStore.ts`, `WebCommunicationScreen.tsx` |
| Push หาคนเดียว + Flex คูปอง | **[PARTIAL]** | มี `buildCouponFlexMessage`/`buildPointNotifyFlexMessage` (JSON จริง) แต่ส่งจริงต้อง backend | `src/services/api/lineApi.ts` |
| SMS / Push | **[PARTIAL]** | มี config + segment แต่ simulate เท่านั้น | `communicationStore.ts`, `mockCommunication.ts` |
| ส่งคูปองอัตโนมัติตาม trigger | **[MISSING (logic)]** | คู่มือ: สมัคร→Welcome, วันเกิด, เลื่อนระดับ, 30 วัน→Win-back; ยังไม่มี trigger จริง (มีแต่ประเภทโปรใน memberPromotion) | — |
| ส่ง LINE/SMS/Push จริง | **[BACKEND-DEPENDENT]** | `lineApi.*` ชี้ backend proxy; ต้องมี Channel Access Token + server | `lineApi.ts` |

### M09 — Reports (08_reports)

| รายงาน (ตาม route map / sidebar) | สถานะ | ไฟล์ |
|--------|-------|------|
| รายงานการขาย (sales_main) | **[DONE]** | `WebReportsScreen.tsx` (`SalesReport`), `SalesReportScreen.tsx` |
| สรุปการขาย (sales_summary), สรุปประจำวัน (daily_summary) | **[DONE]** | `WebReportsScreen` (`SalesSummaryReport`, `DailySummaryReport`), `WebDailySummaryScreen.tsx` |
| ภาษีขายรวม/แยกร้าน (tax_all/tax_by_shop) | **[DONE]** | `TaxAllShopsReport` ฯลฯ |
| สรุปรับจ่าย, ยอดขายแยก POS/แคชเชียร์/สินค้า | **[DONE]** | `pay_summary`, `sales_by_pos`, `sales_by_cashier`, `sales_by_product` |
| โอนเงิน/ชำระบิล/ยกเลิกการขาย | **[DONE]** | `transfer`, `bill_payment`, `void_sales` |
| รายงานกำไร (Gross Profit, margin, รายสินค้า, gauge) | **[PARTIAL]** | มี `ProfitReport`; gauge chart ตามคู่มือควรตรวจว่ามี widget จริงหรือเป็นตาราง | `ProfitReportScreen.tsx` |
| รายงานสินค้า (top selling, dead stock, หมวด) | **[PARTIAL]** | มี `products` view; dead-stock/turnover ตามคู่มือต้องตรวจความครบ | `ProductReportScreen.tsx` |
| รายงานคลัง (stock, turnover, ประวัติรับ/เบิก) | **[DONE]** | `inventory` view | `InventoryReportScreen.tsx` |
| Enterprise (เทียบสาขา, GMROI, เทียบ POS) | **[DONE]** | `EnterpriseReport` มีตาราง KPI สาขา + Turnover + GMROI + export | `WebReportsScreen.tsx` (`EnterpriseReport`, `MOCK_BRANCH_KPI`), `EnterpriseReportScreen.tsx` |
| รายงานพนักงานบริการ / กะ | **[DONE]** | `staff_service`, `shift_report` | `WebReportsScreen.tsx` |
| Export Excel/PDF/print | **[PARTIAL]** | มีปุ่ม + `exportGenericExcel`/`printGenericPDF`; export จริงบน web ใช้ได้, "แชร์ผ่าน LINE/Email" เป็น backend-dependent | `WebReportsScreen.tsx` |

> รวม: report sub-views ในคู่มือ (ยอดขาย/กำไร/สินค้า/คลัง/Enterprise + sub ย่อย) **มีครบแทบทั้งหมด** ทั้ง route (`REPORT_ROUTE_TO_VIEW`) และ component — เป็นโมดูลที่สมบูรณ์ที่สุด

### M10 — Permission & Audit (06_settings / 09_history_team)

| ฟีเจอร์ | สถานะ | คู่มือ vs โค้ด | ไฟล์ |
|--------|-------|--------------|------|
| 6 Roles (Owner/Manager/Cashier/Stock/ReportViewer/Admin) | **[DONE]** | `UserRole` ครบ 6; label ไทยครบ | `src/store/authStore.ts`, `src/constants/rolePermissions.ts` (`ROLE_LABELS`) |
| Permission Matrix + default ต่อ role | **[PARTIAL]** | มี `DEFAULT_SCREEN_PERMISSIONS` + `canAccess` + หน้าแก้สิทธิ์; **แต่ matrix ในโค้ดเป็นระดับ "เข้าถึงหน้าจอ" (screen keys)** ส่วนคู่มือระบุสิทธิ์ย่อยเช่น "ตั้งค่า = บางส่วน", "CRM = ดูอย่างเดียว (cashier)" — granularity ต่างกัน (cashier มี `crm_members` = เข้าถึงได้ ไม่ได้จำกัดเป็น read-only) | `rolePermissions.ts`, `src/screens/settings/PermissionMatrixScreen.tsx`, `permissionStore.ts` |
| Custom Role | **[PARTIAL]** | มีหน้า RoleManage + permissionStore ปรับ permission ได้ | `RoleManageScreen.tsx`, `permissionStore.ts` |
| PIN สำหรับ action พิเศษ (void/เปลี่ยนราคา/reprint) | **[PARTIAL]** | มีแนวคิด PIN (kiosk exit ใช้ PIN) แต่ยังไม่บังคับ PIN ต่อ action ตามคู่มือทุกจุด | `SecuritySettingsScreen.tsx`, `KioskExitModal.tsx` |
| Audit Log (ใคร/ทำอะไร/เมื่อไหร่/อุปกรณ์) + filter/export | **[DONE]** | `logAction` ถูกเรียกจริงใน member/promo/stock stores; มีหน้าดู log | `src/store/auditLogStore.ts`, `AuditLogScreen.tsx` |
| จัดการพนักงาน (เพิ่ม/ระงับ/reset PIN/role/สาขา) | **[DONE]** | | `staffStore.ts`, `employeeStore.ts`, `StaffManagementScreen.tsx`, `UserManagementScreen.tsx` |

### Settings (06_settings) — cross-cutting

| ฟีเจอร์ | สถานะ | ไฟล์ |
|--------|-------|------|
| ข้อมูลร้าน (ชื่อ/โลโก้/ที่อยู่/ประเภท) | **[DONE]** | `ShopSettingsScreen.tsx`, `storeConfigStore.ts` |
| สาขา & POS | **[DONE]** | `BranchManageScreen.tsx`, `POSManageScreen.tsx`, `branchStore.ts` |
| ช่องทางชำระ (เปิด/ปิด/ลำดับ/กรอกเลข PromptPay-บัญชี) | **[PARTIAL/MISSING]** | ยังไม่พบหน้าตั้งค่าช่องทางชำระที่กรอกเลข PromptPay/บัญชีแล้วผูกเข้า PaymentScreen (ค่าอยู่ใน env) | — |
| เครื่องพิมพ์ (ประเภท/template/auto-print/ลิ้นชัก) | **[DONE]** | `PrinterSettingsScreen.tsx`, `WebPrinterScreen.tsx`, `receiptStore.ts` |
| ความปลอดภัย (session timeout/PIN length/lockout/force change/devices) | **[PARTIAL]** | หน้าจอมี; บาง policy (force change 90 วัน, lockout 5 ครั้ง) อาจยังไม่บังคับใช้จริง | `SecuritySettingsScreen.tsx` |
| จอลูกค้า (Customer Display) | **[DONE]** | `CustomerDisplayScreen.tsx`, `WebDisplayScreen.tsx`, `customerDisplayStore.ts`, `WebCustomerDisplayScreen.tsx` |
| โฆษณา/Ad Manager | **[DONE]** (เกินคู่มือ) | `AdManagerScreen.tsx`, `WebAdSettingsScreen.tsx` |
| ERP Integration | **[BACKEND-DEPENDENT]** | ไม่พบหน้าจอ ERP config; ต้องมี endpoint + field mapping + sync จริง | — |

### M11 — Sync & Offline (09_history_team)

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| Sync Queue (pending/syncing/success/failed/conflict) | **[PARTIAL]** | `syncStore` มี stats + retry + mock transactions; **retry/sync เป็น `setTimeout` จำลองว่าสำเร็จ** ไม่ได้ส่งขึ้น server จริง | `src/store/syncStore.ts`, `SyncQueueScreen.tsx`, `SyncStatusScreen.tsx` |
| Conflict Resolution (client/server/manual) | **[PARTIAL]** | UI + `resolveConflict` ครบ 3 ทางเลือก แต่ทำงานบน mock conflict | `syncStore.ts`, `ConflictResolutionScreen.tsx` |
| Offline-first (บันทึก local เมื่อออฟไลน์) | **[PARTIAL]** | persist ผ่าน `persistStorage` (localStorage/AsyncStorage) ทำงานจริง แต่ queue → server เป็น mock | `persistStorage.ts`, stores ที่ใช้ `persist` |
| Sync Monitor (ทุกอุปกรณ์/force sync) | **[PARTIAL]** | `MOCK_DEVICES` + หน้า monitor | `SyncMonitorScreen.tsx`, `syncStore.ts` |
| Sync จริงกับ server | **[BACKEND-DEPENDENT]** | `src/services/SyncService.ts` + `syncApi.ts` stub | `src/services/syncApi.ts`, `SyncService.ts` |

### LINE OA / LIFF / Rich Menu / Webhook (04 + 10)

| ฟีเจอร์ | สถานะ | หมายเหตุ | ไฟล์ |
|--------|-------|---------|------|
| ตั้งค่า LINE OA (token/secret/test connection) | **[PARTIAL]** | `lineConfig` ใน store + env fields ว่าง; ไม่มี "ทดสอบการเชื่อมต่อ" จริง | `communicationStore.ts`, `env.ts` |
| Rich Menu (6 ปุ่ม, action URL/message/LIFF) | **[MISSING]** | ไม่พบ UI/data สำหรับสร้าง/จัดการ Rich Menu; มีแค่ `lineApi.getRichMenus` stub + `RichMenuDTO` type | `lineApi.ts` |
| LIFF (member linking / ดูคูปอง) | **[BACKEND-DEPENDENT]** | `LINE_LIFF_ID` env ว่าง; ต้องมี LIFF app + backend | `env.ts`, `lineApi.ts` |
| Webhook (message/follow/postback, เช็คคะแนน/ประวัติ) | **[BACKEND-DEPENDENT]** | เป็น logic ฝั่ง server ล้วน (ตัวอย่างใน 10_line_rich_menu.md) — รีโปนี้เป็น client ไม่มี endpoint | — |
| Flex message (คูปอง/แจ้งคะแนน/ประวัติ) | **[PARTIAL]** | builder JSON จริง 2 แบบ (คูปอง, แจ้งคะแนน) พร้อมใช้เมื่อมี backend | `lineApi.ts` |

---

## ภาพรวมสถานะ (นับคร่าวๆ)

- โมดูลที่ "สมบูรณ์ระดับ frontend/mock": **M04 Product, M05 Inventory, M09 Reports, M10 Audit/Staff** และโครง M03/M06 ส่วนใหญ่
- โมดูลที่ "มีแต่ยังไม่ครบ logic": **M02 Dashboard (hardcode), M07 Promotion (engine ไม่ต่อ), M08 Communication, M11 Sync** (จำลองด้วย setTimeout)
- สิ่งที่ "หายไปจริง": **โหมดขาย 4 แบบ (M03), Rich Menu (10), auto-coupon triggers (M08), หน้าตั้งค่าช่องทางชำระ (03/06), ERP config (06)**

---

## ข้อเสนอแนะ — ลำดับความสำคัญ

### A. ทำได้เลย (frontend/mock-feasible) — คุ้มค่าสูงสุดก่อน

1. **เรนเดอร์ PromptPay QR จริงใน PaymentScreen** — เรียก `paymentApi.generateOfflineQR(amount)` ที่มีอยู่แล้ว + ใส่ไลบรารี QR (เช่น `react-native-qrcode-svg` / `qrcode`) แทน placeholder ไอคอน ได้ QR สแกนได้จริงโดยไม่ต้อง backend (ข้อ 02/03 ของคู่มือ). ไฟล์: `PaymentScreen.tsx`, `paymentApi.ts`
2. **ต่อ promotion engine เข้ากับ cart/payment** — map `cartStore` → `CalculationRequest`, เรียก `calculate()` จาก `src/engine` เพื่อ auto-apply Happy Hour / Buy X Get Y / Mix&Match / Member price + conflict/stacking. นี่คือช่องว่างใหญ่สุดเพราะโค้ด engine ทำไว้ครบแล้วแต่ไม่ถูกใช้. ไฟล์: `src/engine/*`, `PaymentScreen.tsx`/`cartStore.ts`
3. **เพิ่มโหมดการขาย ปกติ/Pre-order/Delivery/Dine-in** — เพิ่ม field ใน sale (saleType + ที่อยู่/โต๊ะ + flag ไม่ตัดสต๊อกสำหรับ pre-order) และ UI เลือกโหมดบนหน้าขาย (อย่าชนกับ `saleMode` ที่เป็น input method — ควรตั้งชื่อใหม่ เช่น `orderType`). ไฟล์: ใหม่ + `cartStore.ts`, `POSSaleScreen.tsx`
4. **ผูก Dashboard KPI/low-stock กับ store จริง** — คำนวณจาก `saleHistoryStore` + `productStore.minStock` แทน hardcode. ไฟล์: `DashboardScreen.tsx`, `MainDashboardScreen.tsx`
5. **ปรับ level config ให้ตรงคู่มือ** (Silver 5k/Gold 15k/Platinum 50k/VIP 100k + multiplier x1.5/x2/x3) และทำให้ auto-upgrade ข้ามได้หลายขั้น + เพิ่มหน้า "ตั้งค่า CRM > คะแนน/ระดับ" ให้แก้ `pointConfig`/level ได้จริง. ไฟล์: `mockMembers.ts`, `memberStore.ts`, `PaymentScreen.tsx`
6. **ผูก Login/OTP/Forgot (mobile) เข้ากับ authStore** — ให้ `AuthNavigator` เรียก `login()` จริง, เก็บ OTP mock ใน store, reset password ใน `registeredUsers`. ไฟล์: `AuthNavigator.tsx`, `authStore.ts`
7. **หน้าตั้งค่าช่องทางชำระ** — กรอกเลข PromptPay/บัญชี/เปิด-ปิด-จัดลำดับช่องทาง แล้วผูกเข้า PaymentScreen (ตอนนี้อยู่ใน env อย่างเดียว). ไฟล์: ใหม่ใน `src/screens/settings/`
8. **Auto-coupon triggers (mock)** — hook ตอน `addMember` (Welcome), เลื่อนระดับ (Level-up), ใช้ segment "ไม่ซื้อ 30 วัน" (Win-back) ให้สร้าง coupon/broadcast ใน store. ไฟล์: `memberStore.ts`, `communicationStore.ts`, `promoManagementStore.ts`
9. **Stamp card accrual + Referral (mock)** — เพิ่ม logic นับแสตมป์ตอนขาย + referral code. ไฟล์: `promoManagementStore.ts`, `memberStore.ts`
10. **Mix&Match mock + ปรับ permission matrix** ให้ granular ตามคู่มือ (cashier CRM = read-only, manager settings = บางส่วน) และบังคับ PIN ต่อ action (void/เปลี่ยนราคา/reprint).

### B. ต้องมี backend/credential จริง (ทำในรีโปนี้อย่างเดียวไม่จบ)

- **LINE Messaging API / Webhook / LIFF / Rich Menu** (M06/M08/10) — ต้องมี LINE channel + server proxy (ห้าม expose token ที่ client ตามคอมเมนต์ใน `lineApi.ts`)
- **Payment auto-confirm / reconcile** ผ่าน 2C2P/SCB/KBANK/Omise (M03/03) — ต้องมี merchant account + webhook + backend `POST /payment/create`, `GET /payment/:id/status`
- **ส่ง SMS/Push จริง** (M08) — ต้องมี SMS gateway / push service
- **Sync จริง + conflict resolution ระดับ server** (M11) — ปัจจุบันจำลองด้วย `setTimeout`; ต้องมี sync API + server-side merge
- **ERP Integration** (06) — ต้องมี endpoint ERP + field mapping + scheduler

> Rich Menu แบบใช้ URL ล้วน (ไม่ตอบกลับอัตโนมัติ) สร้างได้ใน LINE OA Manager โดยไม่ต้อง backend — แต่การ "เช็คคะแนน/ประวัติผ่าน webhook" ต้องมี server เสมอ

---

## หมายเหตุวิธีตรวจ

- โหมด mock: `ENV.ENABLE_MOCK` (ค่า default = true) ประกาศใน `src/config/env.ts` แต่ stores ส่วนใหญ่ import mock array ตรงๆ (`isFreshStore()` สลับเป็น array ว่างเมื่อสมัครร้านใหม่) — ดังนั้นแอปทำงานบน mock เป็นหลัก ไม่ได้เรียก API service จริง
- ไม่ได้รัน build/test (ตามโจทย์ read-only); อ้างอิงจากการอ่านไฟล์โดยตรงที่ระบุ path ไว้ทุกข้อ
- ข้อสังเกตที่ควรตรวจเพิ่มหากจะลงมือ: ความครบของ CSV import parsing, gauge chart ในรายงานกำไร, dead-stock/turnover ในรายงานสินค้า, การบังคับ security policy จริง (lockout/force-change)
