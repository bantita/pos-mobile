# สรุปฟังก์ชันระบบ Xcellence POS CRM (ฉบับเต็ม)

> เอกสารสรุป **ความสามารถทั้งหมดของระบบ ณ สถานะปัจจุบัน** แยกเป็น 2 ฝั่ง: POS หน้าร้าน และ ระบบหลังบ้าน (Web Admin)
> อ้างอิงจากโค้ดจริงใน `d:\pos-mobile` และรายงาน gap analysis 2 รอบใน `.agents/tasks/`
> ระบบรันบนข้อมูลจำลอง (mock) เป็นหลัก — ฟีเจอร์ที่ปกติต้องต่อ backend จริงถูกทำเป็น **mock ภายใน** ควบคุมด้วย `FEATURE_FLAGS`

**แพลตฟอร์ม:** Expo (React Native Web) — รันได้ทั้ง Mobile (iOS/Android), Web (Browser), Kiosk, Customer Display
**ธีม:** ขาว-แดงเข้ม (`#B91C2C`) โมเดิร์น minimal
**เว็บ production:** Admin → https://dist-admin-rose-delta.vercel.app · POS → https://dist-pos-rho.vercel.app

---

## เครื่องหมายสถานะ

| สัญลักษณ์ | ความหมาย |
|---|---|
| ✅ | ใช้งานได้จริง (frontend/mock สมบูรณ์) |
| 🟡 | ทำงานได้บางส่วน / มีข้อจำกัด |
| 🎭 | **Mock ภายใน** — flow ทำงานในแอป แต่ไม่ได้ต่อ backend จริง (สลับเป็นจริงได้ผ่าน flag) |

### Feature Flags (ควบคุม mock) — `src/config/featureFlags.ts`
| Flag | คุม | ค่า default |
|---|---|---|
| `MOCK_PAYMENT_AUTOCONFIRM` | ยืนยันการชำระ QR/บัตรอัตโนมัติ | = `ENABLE_MOCK` |
| `MOCK_LINE` | ส่งข้อความ/Flex LINE OA | = `ENABLE_MOCK` |
| `MOCK_SYNC` | ซิงค์ข้อมูลออฟไลน์↔ออนไลน์ | = `ENABLE_MOCK` |
| `MOCK_ERP` | เชื่อม ERP | = `ENABLE_MOCK` |

> `ENABLE_MOCK` dev = true · ตั้ง `ENABLE_MOCK=false` เพื่อสลับไปเรียก service จริง (`src/services/api/*`)

---

# ส่วน A — POS หน้าร้าน (Front-of-house)

## A1. การเข้าสู่ระบบ (Authentication)
- ✅ สมัครร้านใหม่ (Register) → สร้างร้าน + เข้า dashboard
- ✅ เข้าสู่ระบบด้วยเบอร์โทร + รหัสผ่าน (ตรวจ credential จริงกับ store)
- ✅ เข้าสู่ระบบด้วย OTP (mock OTP เก็บใน store)
- ✅ ลืมรหัสผ่าน → รีเซ็ตรหัสใน store จริง
- demo: `admin` / `1234`

## A2. หน้าขาย (POS Sale) — `src/screens/sale/`
- ✅ **ตะกร้า**: เพิ่ม/ลด/ลบรายการ, แก้ราคา-ส่วนลดรายรายการ, ส่วนลดทั้งบิล
- ✅ **โหมดการขาย 4 แบบ**: ปกติ / สั่งจอง (Pre-order, ไม่ตัดสต๊อก) / เดลิเวอรี (เก็บที่อยู่) / ทานที่ร้าน (ระบุโต๊ะ) — แสดงบนใบเสร็จ
- ✅ **เลือกสินค้าแบบ grid** + หมวดหมู่ + ค้นหา
- ✅ **เลือก variant** (สี/ไซส์) ผ่าน VariantSelector ก่อนเพิ่มลงตะกร้า — ราคา/สต๊อก/SKU ตาม variant
- 🟡 **สแกนบาร์โค้ด**: กรอกมือ/เครื่องสแกนภายนอกใช้ได้, กล้องจริงต้องทดสอบบนอุปกรณ์
- ✅ **เลือกสมาชิก** + แสดงคะแนน + ราคาสมาชิก
- ✅ **คะแนนสะสม**: ให้คะแนนหลังขาย (อัตโนมัติ) + แลกคะแนนเป็นส่วนลด
- ✅ **โปรโมชันอัตโนมัติ** ผ่าน promotion engine — apply ครบ 7 ประเภทตอนขาย (percent/fixed/coupon/member_price/buy_x_get_y/happy_hour/mix_match) + stacking/conflict resolution (ไม่ใช่แค่คูปองใบเดียว)
- ✅ **คูปอง** — ป้อนรหัส → เข้าเป็น input ของ engine
- ✅ **พักบิล / เรียกบิลคืน** (Hold/Recall)

## A3. การชำระเงิน (Payment) — `src/screens/sale/PaymentScreen.tsx`
- ✅ 5 ช่องทาง: เงินสด / QR PromptPay / บัตรเครดิต / โอนเงิน / E-Wallet
- ✅ **ชำระแยก (Split Payment)** — หลายช่องทางในบิลเดียว คำนวณคงเหลือ/ทอน
- ✅ **PromptPay QR จริง** — สร้าง EMVCo payload (CRC16) + render QR สแกนได้จริง (ไม่ต้อง backend)
- 🎭 **Auto-confirm** (`MOCK_PAYMENT_AUTOCONFIRM`) — หลังโชว์ QR จำลองการตรวจ ~4 วิ → "ชำระสำเร็จ" อัตโนมัติ (มีปุ่มยืนยันเองเป็น fallback)
- ✅ ราคาที่คิด = ราคาสาขา (ถ้ามี) → ราคากลาง → ส่วนลด → โปร engine → แลกคะแนน
- ✅ **VAT รายบรรทัด** — คิดตาม flag `vatIncluded`/`vatRate` ของสินค้าแต่ละตัว (ไม่ใช่ 7% flat)

## A4. หลังการขาย
- ✅ **ใบเสร็จ** (ReceiptScreen) + พิมพ์ (expo-print/HTML), แสดงโหมดขาย + variant
- 🎭 ส่งใบเสร็จทาง LINE (`MOCK_LINE`)
- ✅ ให้คะแนน + อัปเกรดระดับสมาชิกอัตโนมัติ (ข้ามหลายขั้นได้)
- ✅ **ใบกำกับภาษีเต็มรูป** (TaxInvoiceScreen) + **ยกเลิกเอกสาร** (DocumentCancellationScreen)

## A5. ยกเลิก/คืนสินค้า
- 🟡 **ยกเลิกบิล (Void)** + เหตุผล + คืนสต๊อก (PIN ยังไม่บังคับทุก flow)
- ✅ **คืนสินค้า (Return)** — เลือกรายการ+จำนวน+วิธีคืนเงิน + คืนสต๊อก (ฝั่งเว็บ)

## A6. กะการขาย (Shift)
- ✅ เปิดกะ (เงินเริ่มต้น) / ปิดกะ — นับเงินแยกชนิดธนบัตร·เหรียญ, พิมพ์ใบปิดกะ, logout กลับ login
- ✅ Dashboard แคชเชียร์ (ยอดกะ/บิล/เฉลี่ย)
- ✅ **ShiftGate** — กั้นให้เปิดกะก่อนเริ่มขาย

## A7. Kiosk & จอลูกค้า
- ✅ **Kiosk Mode** — ล็อกหน้าจอเป็น POS, PIN ออก (สินค้าที่มี variant ถูกกรองออกจาก kiosk)
- ✅ **Customer Display** — จอที่ 2 แสดงรายการ/ราคา (เปิดด้วย `?display=1`)
- ✅ **License Activation** — กั้นเปิดใช้งานด้วย license key (mock validation)

---

# ส่วน B — ระบบหลังบ้าน (Web Admin)

## B1. Dashboard — `src/screens/web/WebDashboardScreen.tsx`
- ✅ KPI ยอดขาย/บิล/ลูกค้า + แจ้งเตือนสต๊อกต่ำ (ดึงจาก store จริง)
- 🟡 ตัวเลขบางช่อง (เดือน/กำไร) ยัง stub

## B2. มาสเตอร์สินค้า (Product Master) — `src/screens/product/`, `WebProductScreen.tsx`
- ✅ CRUD สินค้า: รหัส/บาร์โค้ด/ชื่อ/หมวด/แบรนด์/ต้นทุน/ราคา/min stock/รูป/สถานะ/VAT
- ✅ **UOM หลายระดับ** (ขวด/แพ็ค/ลัง) + ratio + ราคา/บาร์โค้ดต่อหน่วย
- ✅ **Variant Matrix** — options (สี×ไซส์) → generate หลาย variant, แต่ละตัวมี SKU/บาร์โค้ด/ราคา/สต๊อก (สินค้าเดิมไม่มี variant ทำงานปกติ)
- ✅ **รูปสินค้า** — เลือกไฟล์ + preview (data URI)
- ✅ **CSV Import/Export** — parse ไฟล์จริง + validation ต่อแถว + export Blob
- ✅ บันทึก audit log เมื่อเปลี่ยนราคา
- ✅ persist ข้อมูลทั้ง mobile + web (เพิ่ม/แก้ สะท้อนทุกหน้าจอ)

## B3. มาสเตอร์อื่น ๆ
- ✅ **หมวดหมู่** (categoryStore) — CRUD + นับจำนวนสินค้า, picker ทุกจุดอ่านจาก store
- ✅ **แบรนด์** (brandStore) — CRUD + นับจำนวนสินค้า
- ✅ **ผู้จำหน่าย/Supplier** (supplierStore) — CRUD + ผูกกับการรับสินค้า + picker ในสินค้า
- ✅ ผูก supplierId เข้า product master

## B4. การกำหนดราคา (Pricing) — `src/store/pricingStore.ts`, `WebPricingModuleScreen.tsx`
- ✅ **ราคากลาง (ทุกสาขา)** — ราคาบน product master, POS ใช้จริงตอนขาย
- ✅ **ราคาแยกตามสาขา** — เอกสารราคา scope=branch, `resolvePrice` (priority: branch > central + effective date) และ **หน้าขาย resolve ราคาตาม active branch จริง** (ต่อครบวงจรแล้ว)
- ✅ ลำดับราคา: variant → ราคาสาขา → ราคากลาง
- ✅ Pricing module มี effective/expiry date + CheckPrice panel

## B5. คลังสินค้า (Inventory) — `src/store/stockDocStore.ts`
- ✅ ดูสต๊อก + สถานะ (ปกติ/ใกล้หมด/หมด) + มูลค่ารวม
- ✅ รับสินค้า (Receive) draft/confirm + ต้นทุน + เลือก supplier
- ✅ เบิก/โอน (Issue/Transfer) ต้นทาง→ปลายทาง
- ✅ แก้ไขเอกสารที่ confirm แล้ว (Revise) + ประวัติ revision

## B6. CRM & Loyalty — `src/store/memberStore.ts`, `WebCRMScreen.tsx`
- ✅ เพิ่ม/ค้นหาสมาชิก (ชื่อ/เบอร์/เลขสมาชิก real-time)
- ✅ ระดับสมาชิก 5 ชั้น (Member/Silver/Gold/Platinum/VIP) เกณฑ์ตรงคู่มือ (5k/15k/50k/100k, x1.5/x2/x3)
- ✅ ตั้งค่าอัตราคะแนน + ระดับได้จริง (WebCrmConfigScreen)
- ✅ ให้/แลกคะแนน + ประวัติ + อัปเกรดระดับอัตโนมัติ
- 🎭 **ผูก LINE กับสมาชิก** (`MOCK_LINE`) — โชว์ QR → ยืนยัน → mark linked
- ✅ Member Wallet (เติม/จ่าย)

## B7. โปรโมชัน (Promotion) — `src/store/promoStore.ts`, `promoManagementStore.ts`
- ✅ 7 ประเภทโปรพื้นฐาน + 18 ประเภทโปรสมาชิก + หน้าสร้างต่อชนิด
- ✅ **Promotion engine** คำนวณครบ ต่อเข้า cart/payment จริง (`src/engine/adapter/cartAdapter.ts`)
- ✅ **Auto-coupon triggers** — สมัคร→Welcome, เลื่อนระดับ→Level-up, ไม่ซื้อ 30 วัน→Win-back, วันเกิด→Birthday
- 🟡 stamp card/referral/flash-limit ยังเป็น data/UI

## B8. การสื่อสาร (Communication) — `src/store/communicationStore.ts`
- 🎭 **Broadcast + target** (ทุกคน/ระดับ/segment) — `MOCK_LINE`, บันทึกใน outbox
- 🎭 **ส่งข้อความเดี่ยว / Flex (คูปอง/แจ้งคะแนน)** — preview Flex ในแอป, log การส่ง
- 🎭 SMS / Push — จำลองส่ง + log
- 🎭 **Rich Menu Editor** (richMenuStore, WebRichMenuScreen) — จัดการ 6 ปุ่ม + preview, บันทึก local

## B9. รายงาน (Reports) — `src/screens/web/WebReportsScreen.tsx`
- ✅ 16 sub-views: การขาย / สรุปการขาย / สรุปประจำวัน / ภาษีขาย (รวม·แยกร้าน) / สรุปรับจ่าย / ยอดขายแยก POS·แคชเชียร์·สินค้า / โอนเงิน / ชำระบิล / ยกเลิกขาย / รายงานสินค้า / คลัง / กำไร / Enterprise
- ✅ Enterprise: เทียบสาขา + Turnover + GMROI
- 🟡 gauge กำไร / dead-stock บางส่วนควรตรวจความครบ
- ✅ Export Excel/PDF/print (บน web)

## B10. สิทธิ์ & Audit — `src/constants/rolePermissions.ts`, `auditLogStore.ts`
- ✅ 6 Roles (Owner/Manager/Cashier/Stock/ReportViewer/Admin)
- 🟡 Permission Matrix ระดับ "เข้าถึงหน้าจอ" (granularity ต่างจากคู่มือบางจุด)
- ✅ **Audit Log** — ใคร/ทำอะไร/เมื่อไหร่/อุปกรณ์ (ถูกเรียกจริงจากหลาย store) + filter
- ✅ จัดการพนักงาน/ผู้ใช้ (เพิ่ม/ระงับ/role/สาขา)

## B11. ตั้งค่า (Settings)
- ✅ ข้อมูลร้าน / สาขา & POS / เครื่องพิมพ์ / จอลูกค้า / โฆษณา
- ✅ **ช่องทางชำระเงิน** (paymentConfigStore) — กรอกเลข PromptPay/บัญชี, เปิด-ปิด-จัดลำดับ, ผูกเข้า QR
- 🟡 ความปลอดภัย — บาง policy (lockout/force-change) ยังไม่บังคับเต็ม
- 🎭 **ERP** (`MOCK_ERP`) — หน้า config + ทดสอบเชื่อมต่อ + sync สินค้า/ยอดขาย (จำลอง)
- ✅ **Sync Settings** (WebSyncSettingsScreen) — ผูก syncStore จริง: queue stats, ซิงค์ทันที, ลองใหม่, resolve conflict
- ✅ **License / Document Settings**

## B12. Sync & Offline — `src/store/syncStore.ts`
- 🎭 **Sync Queue** (`MOCK_SYNC`) — pending→syncing→success + จำลอง conflict เป็นระยะ
- ✅ **Conflict Resolution** — client/server/manual
- ✅ Offline-first persist (localStorage/AsyncStorage) — ทำงานจริง (queue→server เป็น mock)

---

# สิ่งที่ต้องต่อ Backend จริง (ปัจจุบันเป็น Mock)

ฟีเจอร์เหล่านี้ flow ในแอปทำงานครบ แต่ **ไม่ได้เชื่อมต่อจริง** — ต้องมีเซิร์ฟเวอร์ + credential เมื่อขึ้น production จริง (ปิด flag ที่เกี่ยวข้อง แล้ว implement `src/services/api/*`):

| ฟีเจอร์ | Flag | สิ่งที่ต้องมีจริง |
|---|---|---|
| ยืนยันชำระเงินอัตโนมัติ | `MOCK_PAYMENT_AUTOCONFIRM` | Payment Gateway (2C2P/SCB/KBANK/Omise) + webhook |
| LINE OA (ส่งข้อความ/Flex/Rich Menu/ผูกสมาชิก) | `MOCK_LINE` | LINE Messaging API + LIFF + server proxy |
| SMS / Push | `MOCK_LINE` | SMS gateway / push service |
| Sync ข้ามอุปกรณ์ | `MOCK_SYNC` | Sync API + server-side merge |
| ERP | `MOCK_ERP` | ERP endpoint + field mapping |

---

# สิ่งที่ยังไม่ได้ทำ (Out of scope ปัจจุบัน)

- Product variant **แบบ per-variant per-branch pricing** (ราคา variant แยกสาขา) — ปัจจุบันราคาสาขาอยู่ระดับสินค้า
- Variant ในโหมด **Kiosk** (กรองออก)
- CSV import ของ **variant** / stock document ของ variant
- Tax class นอกเหนือ 0/7%, multi-currency, price rounding rules

---

_เอกสารนี้สะท้อนสถานะ ณ วันที่จัดทำ — ดูรายละเอียดเชิงลึกได้ที่ `.agents/tasks/gap-analysis.md` และ `gap-analysis-round2.md`_
