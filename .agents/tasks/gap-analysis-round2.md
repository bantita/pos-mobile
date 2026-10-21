# Gap Analysis — Round 2 (Current State)

โปรเจกต์: `d:\pos-mobile` — Expo / React Native Web POS CRM (mock data)
โหมด: read-only re-audit (ไม่แก้โค้ด / ไม่รัน build/test) — ต่อยอดจาก `.agents/tasks/gap-analysis.md`
โฟกัสหลักตามคำสั่งผู้ใช้: **มาสเตอร์สินค้า + การกำหนดราคา (ราคากลางทุกสาขา vs. ราคาแยกตามสาขา)**

ป้ายกำกับ: **[DONE]** · **[PARTIAL]** (ระบุว่าขาดอะไร) · **[MISSING]** · **[BACKEND-DEPENDENT]**

---

## 0. สรุปคำตอบสั้น (Executive Summary)

หลังรอบ gap-fill (branch `78203e7`) โค้ดฝั่ง front/mock แน่นขึ้นมาก — ของที่รอบแรกเป็น "ช่องว่างใหญ่" ถูกต่อจริงแล้วหลายอย่าง และ**ยืนยันว่าทำงานจริง** ได้แก่:

- **Promotion engine ต่อเข้า cart/payment แล้วจริง** — `PaymentScreen` เรียก `runCartPromotions()` ผ่าน `src/engine/adapter/cartAdapter.ts` คำนวณโปรทั้ง 7 ประเภทตอนขาย (ไม่ใช่คูปองใบเดียวแล้ว) มี unit test ครอบ `cartAdapter.test.ts` **[DONE]**
- **PromptPay QR จริง** — `PaymentScreen` เรนเดอร์ `<QRCode>` (react-native-qrcode-svg) จาก `paymentApi.generateOfflineQR()` + mock auto-confirm ผ่าน `FEATURE_FLAGS.MOCK_PAYMENT_AUTOCONFIRM` **[DONE (mock)]**
- **โหมดการขาย ปกติ/Pre-order/Delivery/Dine-in** — มี `OrderType` ใน `cartStore` + UI เลือกใน `POSSaleScreen` (OrderTypeModal) + pre-order ไม่ตัดสต๊อก (`PaymentScreen`: `if (orderType !== 'preorder') deductStock`) **[DONE]**
- **Auto-coupon triggers** — `src/services/autoCouponTriggers.ts` (welcome/levelup/winback/birthday) ถูกเรียกจริงจาก `memberStore.addMember` + idempotent **[DONE (mock)]**
- **Multi-tier auto-upgrade** — `PaymentScreen.handleConfirmPayment` เลือกระดับสูงสุดที่ `minSpent <= totalSpent` (ข้ามหลายขั้นได้) **[DONE]**

**แต่คำถามหลักของผู้ใช้ — การกำหนดราคาแยกตามสาขา — ยังเป็น half-wired อย่างชัดเจน:**

> **ราคากลาง (ทุกสาขา) = [DONE]** — ราคาขายอยู่บน product master (`salePrice` + ราคาต่อ UOM) และ POS ใช้ค่านี้จริงตอนขาย
>
> **ราคาแยกตามสาขา (per-branch) = [PARTIAL / half-wired]** — มีครบทั้ง (ก) data model (`pricingStore` + `resolvePrice` ที่มี priority branch > central), และ (ข) UI สร้างเอกสารราคาแยกสาขา (`WebPricingModuleScreen`)
> **แต่หน้าขายไม่เรียก `resolvePrice()` เลย** — `cartStore.addItem` ใช้ `product.price` ตรงๆ, `POSSaleScreen`/`WebPOSScreen` สร้างราคาจาก `uom.salePrice` ไม่เคยถาม pricingStore, และ **ไม่มีการส่ง active branchId เข้าไปในขั้นตอนคิดราคาเลย** → ราคาแยกสาขาที่ตั้งไว้ "ไม่มีผลตอนขายจริง"

นอกจากนี้ยังพบปัญหา **branch id ไม่ตรงกัน 3 ชุด** (ดูหัวข้อ 1.3) ซึ่งทำให้ต่อให้ wiring แล้วก็ยัง resolve ไม่เจอ และ **มีหน้าจอ pricing ซ้อนสองตัว** โดยตัวที่ route ใช้งานจริงคือตัวที่ผูก store (ดี) ส่วนอีกตัว (`WebPricingScreen`) เป็น dead code ที่ import/export เป็นแค่ `alert()`

---

## 1. PRODUCT MASTER + PRICING — Deep-dive (สำคัญที่สุด)

### 1.1 Product Master — ฟิลด์ / CRUD / UOM / Import-Export

**ฟิลด์ของสินค้า** — `src/types/product.ts` → `ProductMaster`:

| กลุ่ม | ฟิลด์ที่มี | หมายเหตุ |
|------|-----------|---------|
| รหัส/บาร์โค้ด | `code`, `barcode` (หน่วยฐาน) + barcode ต่อ UOM (`uoms[].barcodes[]`) | หลายบาร์โค้ดต่อหน่วย ✅ |
| ชื่อ/หมวด/แบรนด์ | `name`, `categoryId`+`categoryName`, `brandId?`+`brandName?` | มี `Category` และ `Brand` type |
| ราคา | `costPrice`, `salePrice` + per-UOM `costPrice`/`salePrice` | ราคาเดียวต่อสินค้า (ไม่มี field ราคาสาขา — ดู 1.3) |
| ภาษี | `vatIncluded`, `vatRate` (0 \| 7) | VAT-inclusive/exclusive มี flag |
| สต๊อก | `stockQty` (เป็น baseUnit), `minStock` | |
| สถานะ | `status: 'active'\|'inactive'` | deactivate ได้ |
| ประเภท | `productType: 'general'\|'service'` | service = เลือกช่าง |
| variant | `color?`, `size?`, `modelYear?`, `lotNumber?` | เป็น field เดี่ยว ไม่ใช่ระบบ variant matrix |
| รูป | `image?` | **ดูหมายเหตุด้านล่าง** |

**CRUD** — ทำได้จริงและ persist:
- ฝั่ง web `WebProductScreen` ผูก `useProductStore` เต็ม: `addProduct` / `updateProduct` / `deleteProduct` (WebProductScreen.tsx:1546, modal onSave:1932-1946, ปุ่มลบ:1783)
- `productStore` ใช้ `persist` (`name: 'pos-products'`) — ข้อมูลคงอยู่ **[DONE]**
- `AddEditProductScreen` (mobile) มีฟอร์มครบ + `UOMManager` + margin preview + VAT toggle/อัตรา + สลับ general/service + min stock + สถานะ
- **หมวดหมู่** — `CategoryManageScreen` สร้าง/สี/ลำดับได้ (ยืนยันจากรอบแรก) **[DONE]**

**UOM หลายระดับ** — `src/components/product/UOMManager.tsx` **[DONE]**: เพิ่ม/แก้/ลบหน่วย, ตั้ง default, ratio (1 แพ็ค = N หน่วยฐาน), ราคาทุน/ขายต่อหน่วย (auto = base × ratio หรือกรอกเอง), บาร์โค้ดหลายอันต่อหน่วย (`BarcodeChips`). `mockProducts` มีตัวอย่าง 3 ระดับ (ขวด/แพ็ค/ลัง) ครบ

**Import/Export CSV** — **[PARTIAL — ไม่ parse จริง]**:
- `src/screens/product/ImportExportScreen.tsx` (mobile): preview table ใช้ `MOCK_IMPORT` คงที่, `handleSelectFile` แค่ `setImportStep('preview')` — **ไม่อ่านไฟล์จริง**; progress เป็น `setInterval` จำลอง; `handleExport`/`handleDownloadTemplate` เป็น `Alert.alert` — ไม่มีไฟล์จริง
- `WebPricingScreen` (dead code — ไม่ถูก route): `handleImport` เปิด file picker แล้ว `alert('...Demo...')` — ไม่ parse; แต่ `handleExport`/`handleDownloadTemplate` ของตัวนี้ **สร้างไฟล์ CSV จริง** ด้วย Blob (ใช้ได้บน web) — น่าเสียดายที่หน้านี้ไม่ได้ถูกใช้
- สรุป: export CSV ทำได้จริงเฉพาะในโค้ดที่ตายแล้ว; **import ไม่เคย parse** ทั้งสองที่

**Audit log ราคา** — `AddEditProductScreen.handleSave` เมื่อราคาเปลี่ยนเรียกแค่ `console.log('[AUDIT] PRICE_CHANGE ...')` — **ไม่เรียก `logAction()`** จริง (ต่างจาก productStore ฝั่งอื่น) **[PARTIAL]**

**รูปภาพ** — ปุ่ม "เพิ่มรูปภาพ" ใน `AddEditProductScreen` เป็น `TouchableOpacity` ที่ **ไม่มี onPress** (no-op placeholder) **[PARTIAL — upload ยังไม่ทำงาน]**

**มาสเตอร์ที่ขาด (เทียบแนวคิดทั่วไป / คู่มือ):**
- **แบรนด์/หมวด** มี type + mock (`MOCK_BRANDS`) แต่หน้าจอ "มาสเตอร์ > แบรนด์" (ตามคู่มือ §7 Tab "มาสเตอร์") ยังไม่ชัดว่ามี CRUD แบรนด์แยก (มีแค่ picker ตอนสร้างสินค้า) — **[PARTIAL]**
- **Supplier master** (ผู้จำหน่าย) — **[MISSING]** (ไม่มี type/store)
- **Product variants/options แบบ matrix** (สี×ไซส์ → หลาย SKU) — **[MISSING]** มีแค่ field `color/size` เดี่ยว
- **Tax class** นอกเหนือ 0/7% — **[MISSING]** (มีแค่ boolean + 0/7)

### 1.2 PRICING — GLOBAL (ทุกสาขา) = [DONE]

- **ราคากลางอยู่บน product master**: `ProductMaster.salePrice` (+ `uoms[].salePrice`)
- **จุดที่ POS อ่านราคา**:
  - `POSSaleScreen.toCartProduct` → `price: uom.salePrice` (POSSaleScreen.tsx ~บรรทัด toCartProduct)
  - `WebPOSScreen.toCartProduct` เช่นเดียวกัน (WebPOSScreen.tsx:122)
  - `cartStore.addItem` → `unitPrice: product.price`, `subtotal: product.price * qty`
  - `PaymentScreen` คิดจาก `getSubtotal()` ของ cart แล้วส่งเข้า engine
- **ยืนยัน**: การขายใช้ราคากลางจริง (global price ถูกใช้ end-to-end)
- ⚠️ ข้อสังเกต: `POSSaleScreen` ยังสร้าง `ALL_CART_PRODUCTS` จาก `MOCK_PRODUCTS` **แบบ static** (ไม่ได้อ่านจาก `useProductStore`) — ดังนั้นสินค้า/ราคาที่ผู้ใช้แก้ใน back-office **จะไม่สะท้อนบนหน้าขาย mobile** (`WebPOSScreen` ดีกว่า: ใช้ `useProductStore().products`) — **[PARTIAL บน POSSaleScreen]**

### 1.3 PRICING — PER-BRANCH = [PARTIAL / half-wired]  ← คำถามหลักของผู้ใช้

**(ก) Data model — มี [DONE ในเชิงโครงสร้าง]**
`src/types/pricing.ts` + `src/store/pricingStore.ts`:
- `PricingDocument` มี `scope: 'central'|'branch'`, `branchId?`, `duration: 'permanent'|'temporary'`, `effectiveDate`, `expiryDate?`, `items[]` (ราคาใหม่ต่อสินค้า)
- `resolvePrice(productId, branchId)` มี logic priority ชัดเจน:
  `branch-temp > branch-perm > central-temp > central-perm` + กรองตามวันที่ effective/expiry + เลือก effectiveDate ล่าสุด → คืน `ResolvedPrice`
- `resolvePriceList(branchId)` วนทุกสินค้า
- store ใช้ `persist` (`pos-pricing`) + `logAction`

**(ข) UI — มี [DONE] (ตัวที่ route จริง)**
- Route `pricing` → **`WebPricingModuleScreen`** (WebNavigator.tsx:137) ซึ่งผูก `usePricingStore` จริง: create/delete/cancel/copy เอกสาร + tab "CheckPricePanel" เรียก `resolvePriceList()` ให้ลองดูราคาที่ resolve ตามสาขา
- สร้างเอกสาร scope=branch เลือก branchId ได้

**(ค) การ RESOLVE ตอนขาย — ❌ ไม่มีเลย [นี่คือ link ที่ขาด]**
- `grep resolvePrice|usePricingStore` ทั้ง repo → **พบเฉพาะใน `WebPricingModuleScreen`** (หน้าตั้งค่า) เท่านั้น
- `cartStore`, `POSSaleScreen`, `WebPOSScreen`, `PaymentScreen` **ไม่ import pricingStore / ไม่เรียก resolvePrice เลย**
- `cartStore.addItem` hardcode `unitPrice = product.price` (= ราคากลาง) — ไม่มีพารามิเตอร์ branch
- **ไม่มีการส่ง active branch เข้าสู่ path คิดราคา**: `useBranchGuard`/`branchPermissionStore.activeBranchId` ถูกใช้แค่ `BranchSelector` และ `WebSaleHistoryScreen` (filter ประวัติ) — ไม่เคยถูกอ่านตอนประกอบ cart/จ่ายเงิน

**สรุป trace ของ "ราคาที่ cart line ใช้":**
```
active branch:  branchPermissionStore.activeBranchId  →  (ไม่ถูกอ่านในขั้นคิดราคา)
ราคา product:   uom.salePrice / product.price         →  cartStore.addItem(unitPrice)
                                                       ↑ ไม่มีการแวะถาม pricingStore.resolvePrice()
cart line ใช้:  product.price (ราคากลางเสมอ)
```
→ **per-branch price ที่ตั้งใน WebPricingModuleScreen ไม่มีผลต่อราคาขายจริง** = classify **[PARTIAL]**: model ✅ + UI ✅ แต่ **POS ignore มัน (ไม่มี active-branch resolution)**

**(ง) ปัญหาเสริมที่ทำให้ wiring ไม่ง่าย — branch id ไม่ตรงกัน 3 ชุด:**
| แหล่ง | ค่า id | ไฟล์ |
|------|-------|------|
| pricingStore mock docs | `branch-01`, `branch-02` | `pricingStore.ts` (MOCK_DOCS) |
| active branch (permission) | `b1` (default) | `branchPermissionStore.ts` |
| mockBranches (enterprise) | `branch-001`, `branch-002`, `branch-003` | `mockBranches.ts` |
| WebPricingScreen (dead) | `br1`, `br2`, `br3` | `WebPricingScreen.tsx` |

→ แม้ wiring แล้วก็ยัง resolve ไม่เจอเพราะ branchId ไม่ match — ต้องรวม id ให้เป็นชุดเดียวก่อน

**(จ) หน้าจอ pricing ซ้อนกัน 2 ตัว (สับสน):**
- `WebPricingModuleScreen` — ผูก `pricingStore` จริง = ตัวที่ route ใช้ ✅
- `WebPricingScreen` — มี state/mock เอง (`MOCK_DOCS`, `BRANCHES` hardcode), import/export เป็น `alert()`, **ไม่ถูก import ที่ไหนเลย** (grep ยืนยัน) = **dead code** ควรลบหรือรวม

### 1.4 การ layer ราคา: member price / promotion / tiers — precedence ตอนขาย

- **Promotion (engine)**: `PaymentScreen` รัน `runCartPromotions()` หลังได้ subtotal จากราคากลาง → engine จัดการ percent/fixed/coupon/member_price/buy_x_get_y/happy_hour/mix_match + conflict resolver (`stackable`/`priority`) — ทำงานบน **ราคากลางเท่านั้น** (เพราะ cart ใช้ราคากลาง)
- **Member price**: มาในรูปโปรประเภท `member_price` (เงื่อนไข `member.levels`) — คิดโดย engine ไม่ใช่ price list แยก
- **Pricing tiers (เอกสารราคา)**: **ไม่ถูก layer เข้า checkout เลย** (ตาม 1.3ค)
- **Precedence จริงที่เกิดขึ้นตอนขาย**: `ราคากลาง (master) → ลบส่วนลดรายการ/บิลใน cart → engine โปร → − แลกคะแนน → + service charge`
  **ไม่มี** ชั้น "ราคาสาขา/ราคาเอกสาร" คั่นเลย (ชั้นที่ผู้ใช้คาดหวังหายไป)

### 1.5 Gaps ราคาอื่นๆ

| ประเด็น | สถานะ | หลักฐาน/หมายเหตุ |
|--------|-------|-----------------|
| Effective date / scheduling | **[PARTIAL]** | `pricingStore` มี effective/expiry + กรองใน `resolvePrice` แล้ว — แต่เพราะไม่ถูกเรียกตอนขาย จึงไม่มีผล |
| Price history / audit | **[PARTIAL]** | pricingStore `logAction` ตอน create/update; แต่ AddEditProduct ราคาเปลี่ยนแค่ `console.log` |
| Cost vs margin tracking | **[DONE (แสดงผล)]** | margin% ใน AddEditProduct + WebProductScreen |
| Price rounding rules | **[MISSING]** | ไม่มี config ปัดเศษ |
| Multi-currency | **[MISSING]** | ฿ อย่างเดียว |
| VAT inclusive/exclusive | **[PARTIAL]** | มี flag `vatIncluded`+`vatRate` ต่อสินค้า; แต่ `cartStore.getVatAmount` คิด 7% แบบ flat บน (subtotal − discount) ไม่ได้อ่าน `vatIncluded`/`vatRate` รายสินค้า → การคิด VAT ไม่ตรงกับ flag ของสินค้า |

---

## 2. (A) POS FRONT-OF-HOUSE

| ฟีเจอร์ | สถานะ | หลักฐาน |
|--------|-------|---------|
| ตะกร้า + แก้จำนวน/ส่วนลดรายการ/บิล | **[DONE]** | `cartStore` (addItem/updateQty/updateItemDiscount/setDiscount/holdBill/recallBill) |
| Order types ปกติ/preorder/delivery/dinein | **[DONE]** | `OrderType` + OrderTypeModal (POSSaleScreen) + preorder ไม่ตัดสต๊อก (PaymentScreen) + บันทึก orderType/orderDetails ลง SaleRecord |
| Barcode scan | **[PARTIAL]** | manual input + `findProductByBarcode` ใช้ได้; กล้องจริงต้องทดสอบบนอุปกรณ์; UOMManager ปุ่มสแกน = TODO |
| เลือกสมาชิก + คะแนน earn/redeem | **[DONE]** | PaymentScreen member modal + earnPoints/redeemPoints + pointConfig |
| โปร auto-apply ผ่าน engine (7 ประเภท) | **[DONE]** | `runCartPromotions` + `cartAdapter.ts` + test ครบทั้ง percent/fixed/coupon/member_price/buy_x_get_y/happy_hour/mix_match |
| Split payment | **[DONE]** | PaymentScreen `showSplitMode` |
| PromptPay QR + auto-confirm | **[DONE (mock)]** | `<QRCode>` จริง + `generateOfflineQR` + MOCK_PAYMENT_AUTOCONFIRM (~4s) |
| ใบเสร็จ (print + LINE) | **[PARTIAL]** | ReceiptScreen + receiptStore; ส่ง LINE เป็น mock/backend-dependent |
| Void / Return | **[PARTIAL]** | มี CancelBill/DocumentCancellation + WebReturn (คืนสต๊อก); PIN ต่อ action ยังไม่บังคับทุก flow |
| Hold / Recall | **[DONE]** | cartStore holdBills |
| เปิด/ปิดกะ | **[DONE]** | shiftStore + CashierDashboard |
| Kiosk / Customer display | **[DONE]** | kioskStore / customerDisplayStore |
| Mobile auth (login/OTP/forgot) | **[DONE (mock)]** | authStore requestOTP/verifyOTP/resetPassword + AuthNavigator (ตามโน้ต gap-fill) |
| **ราคาต่อสาขาในหน้าขาย** | **[PARTIAL]** | ดูหัวข้อ 1.3 — POS ไม่ resolve ราคาสาขา |
| **POSSaleScreen ใช้ MOCK static** | **[PARTIAL]** | ราคาที่แก้ใน back-office ไม่สะท้อนบนหน้าขาย mobile (ต่างจาก WebPOSScreen) |

---

## 3. (B) BACK-OFFICE / WEB ADMIN

จาก `WebNavigator.tsx` (routes + REPORT_ROUTE_TO_VIEW):

| โมดูล | สถานะ | หลักฐาน/หมายเหตุ |
|------|-------|-----------------|
| Dashboard KPI | **[PARTIAL]** | `WebDashboardScreen` ต่อ store จริงบางส่วน (ตามโน้ต gap-fill); บางตัวเลขเดือน/กำไรยัง stub — ควรตรวจค่าที่ derive จริง vs คงที่ |
| Products CRUD/UOM | **[DONE]** | WebProductScreen ผูก productStore |
| Pricing (ราคากลาง/สาขา) | **[PARTIAL]** | model+UI ครบ แต่ไม่ resolve ตอนขาย (หัวข้อ 1.3); WebPricingScreen เป็น dead code |
| Inventory (receive/issue/revise) | **[DONE]** | stockDocStore (ตามรอบแรก) |
| CRM (สมาชิก/ระดับ/คะแนน/LINE link/segment/แคมเปญ) | **[DONE/ PARTIAL]** | WebCRMScreen + member-LINE link + auto-triggers; level config เกณฑ์อาจต่างคู่มือ |
| Promotions (promoStore + promoManagementStore 18 ชนิด + 10 แคมเปญ) | **[PARTIAL]** | engine ต่อแล้ว (ดี); auto-triggers welcome/levelup/winback/birthday จริง; stamp card/referral/flash-limit ยังเป็น data/UI |
| Communication (broadcast/outbox/Flex/SMS/Push) | **[PARTIAL (mock)]** | communicationStore outbox + sendCouponCampaign (ใช้โดย auto-trigger); ส่งจริง backend-dependent |
| Rich menu editor | **[DONE (mock)]** | richMenuStore + WebRichMenuScreen (ตามโน้ต gap-fill) |
| Reports (ทุก sub-view + profit gauge/dead-stock/turnover) | **[DONE/ PARTIAL]** | REPORT_ROUTE_TO_VIEW ครบ 16 views; gauge/dead-stock ตามรอบแรกควรตรวจความครบ |
| Permissions/role/audit log | **[DONE/ PARTIAL]** | rolePermissions + permissionStore + auditLogStore (logAction ถูกเรียกจริงหลาย store); granularity ระดับหน้าจอ |
| Staff / user management | **[DONE]** | staffStore/employeeStore + WebUserStaffScreen |
| Settings: shop/branch/POS/printer/security | **[DONE/ PARTIAL]** | WebSimpleScreens (branch/POS/printer/card config); security policy บางตัวยังไม่บังคับ |
| Settings: payment channels (PromptPay id) | **[DONE]** | `paymentConfigStore` + PaymentScreen อ่าน `promptPayId` → QR (fallback ENV) |
| Settings: ERP | **[DONE (mock)]** | erpStore + WebErpSettingsScreen (ตามโน้ต gap-fill) |
| Settings: SYNC | **[PARTIAL/placeholder]** | syncStore มี MOCK_SYNC; audit mock ยังโชว์ "SYNC_DATA ... รอดำเนินการ" — หน้า sync settings ฝั่ง web ยังเป็น placeholder ตามที่ reviewer ระบุ |
| License / Document screens | **[DONE]** | WebLicenseScreen / WebDocumentSettingsScreen |

---

## 4. ของที่ "อ้างว่าเสร็จแต่ half-wired" (เน้นย้ำ)

1. **ราคาแยกสาขา** — store `resolvePrice` + UI ครบ แต่ **ไม่มีใครเรียกตอนขาย** → ตั้งราคาสาขาไปก็ไม่มีผล (ข้อใหญ่สุด)
2. **branchId 3 ชุดไม่ตรงกัน** — ทำให้แม้ wiring แล้วก็ resolve พลาด
3. **WebPricingScreen** — dead code, import/export เป็น `alert()` ลวงตา
4. **Import สินค้า (ImportExportScreen)** — preview เป็น mock คงที่ ไม่เคยอ่าน/parse ไฟล์จริง
5. **ปุ่มเพิ่มรูปสินค้า** — `TouchableOpacity` ไม่มี onPress
6. **Audit log การเปลี่ยนราคาใน AddEditProduct** — เป็น `console.log` ไม่ใช่ `logAction`
7. **POSSaleScreen (mobile)** — อ่านสินค้าจาก MOCK static ไม่ใช่ productStore → แก้ของใน admin ไม่เห็นบนหน้าขาย
8. **VAT รายสินค้า** — cartStore คิด 7% flat ไม่อ่าน `vatIncluded`/`vatRate` ต่อสินค้า

---

## 5. TODO จัดลำดับความสำคัญ

### A. Frontend/mock — ทำได้เลย (คุ้มสุด เรียงตามผลกระทบ)

1. **ต่อ per-branch pricing เข้าหน้าขาย** (แก้ข้อใหญ่สุด):
   - รวม branchId ให้เป็นชุดเดียว (เลือก `branch-00x` หรือ `bX` แล้วแก้ mock ทั้ง pricingStore/branchPermissionStore/mockBranches ให้ตรง)
   - ในขั้นสร้าง cart item ให้ resolve ราคา: อ่าน `activeBranchId` จาก `useBranchGuard`/`branchPermissionStore` → เรียก `usePricingStore.getState().resolvePrice(productId, branchId)` → ถ้าเจอใช้ราคานั้นแทน `uom.salePrice`, ถ้าไม่เจอ fallback ราคากลาง
   - จุดแก้: `cartStore.addItem` (รับ price ที่ resolve แล้ว) หรือ `toCartProduct` ใน `POSSaleScreen`/`WebPOSScreen`
   - ควรระวัง: resolvePrice ปัจจุบัน key ด้วย `productId` ระดับ master แต่ cart แยกตาม UOM (`masterId_uomId`) — ต้อง map ให้ถูก
2. **POSSaleScreen ให้อ่านจาก `useProductStore`** แทน MOCK static (ให้ตรงกับ WebPOSScreen)
3. **Import สินค้า parse จริง** — ใช้ Blob/FileReader + แปลง CSV → `productStore.addProduct` (ฝั่ง web ทำง่าย เหมือน export ใน WebPricingScreen ที่ทำ Blob อยู่แล้ว)
4. **ลบ/รวม `WebPricingScreen`** (dead code) ให้เหลือ WebPricingModuleScreen ตัวเดียว
5. **เปิดใช้ pricingStore.resolvePrice ให้สอดคล้อง effective date** (ได้ฟรีเมื่อทำข้อ 1)
6. **ต่อปุ่มเพิ่มรูปสินค้า** (expo-image-picker) + เก็บ base64/uri ใน `image`
7. **Audit log ราคา** — เปลี่ยน `console.log` เป็น `logAction('สินค้า','เปลี่ยนราคา',...)`
8. **VAT ต่อสินค้า** — ให้ cart คิด VAT ตาม `vatIncluded`/`vatRate` รายรายการ
9. **Supplier master / brand CRUD / product variant matrix** — ถ้าต้องการให้ครบคู่มือ §7 "มาสเตอร์"
10. **หน้า sync settings (web)** ให้ผูก syncStore จริง (แทน placeholder)

### B. Backend-dependent (ทำในรีโปนี้อย่างเดียวไม่จบ — มี mock ภายในแล้ว flow ในแอปทำงานได้)

- Payment auto-confirm/reconcile ผ่าน gateway จริง (ตอนนี้ MOCK_PAYMENT_AUTOCONFIRM)
- LINE Messaging/LIFF/Webhook ส่งจริง (ตอนนี้ MOCK_LINE + outbox)
- SMS/Push จริง
- Sync จริง + conflict resolution ฝั่ง server (ตอนนี้ MOCK_SYNC)
- ERP integration จริง (ตอนนี้ erpStore mock)

---

## 6. หมายเหตุวิธีตรวจ

- อ่านไฟล์ตรงทุกข้อ ไม่ได้รัน build/test (ตามโจทย์ read-only)
- หลักฐานหลักของข้อสรุป per-branch: `grep "resolvePrice|usePricingStore"` ทั้ง repo → พบเฉพาะ `WebPricingModuleScreen`; `cartStore.addItem` ใช้ `product.price`; `POSSaleScreen`/`WebPOSScreen`/`PaymentScreen` ไม่ import pricingStore
- ไฟล์อ้างอิงหลัก: `src/types/{product,pricing,sale}.ts`, `src/store/{cartStore,productStore,pricingStore,branchPermissionStore}.ts`, `src/hooks/useBranchGuard.ts`, `src/screens/sale/{POSSaleScreen,PaymentScreen}.tsx`, `src/screens/web/{WebPricingModuleScreen,WebPricingScreen,WebProductScreen,WebPOSScreen}.tsx`, `src/components/product/UOMManager.tsx`, `src/engine/adapter/cartAdapter.ts`, `src/data/{mockProducts,mockBranches}.ts`, `src/navigation/WebNavigator.tsx`
