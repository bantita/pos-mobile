# POS & CRM Flow — Gap Analysis

> เปรียบเทียบ `docs/system-flow-summary.md` กับโค้ดปัจจุบัน
> ตรวจสอบเมื่อ: 22/06/2567

---

## สรุปภาพรวม

| สถานะ | จำนวน | หมายเหตุ |
|-------|-------|---------|
| ✅ ทำเสร็จแล้ว | 38 รายการ | ใช้งานได้ + build ผ่าน |
| ⚠️ ทำบางส่วน | 5 รายการ | มีโค้ดแต่ยังไม่ครบ |
| ❌ ยังไม่ได้ทำ | 7 รายการ | ตามแผน Phase 2-3 |

---

## M01 Authentication

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| Welcome Screen | ✅ | |
| Login (Username + Password) | ✅ | |
| OTP Login | ✅ | OTP = 123456 |
| Forgot Password | ✅ | |
| Register (4 steps) | ✅ | โทร → OTP → ข้อมูลร้าน → จุดขาย |
| เลือก Business Type (SERVICE/RETAIL) | ✅ | มี picker ในหน้า shop-info |
| เลือก Business Scale (BUSINESS/ENTERPRISE) | ⚠️ | **type ใน store มีแล้ว แต่ UI RegisterShopScreen ยังเลือกเป็น flat 3 ตัว (SERVICE/RETAIL/ENTERPRISE) ไม่ได้แยก 2 มิติ** |

---

## M02 Dashboard

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| KPI ยอดขายวันนี้/เดือน | ✅ | Web + Mobile |
| กราฟ 7 วัน | ✅ | |
| Low Stock Alert | ✅ | |
| Shortcut ไปหน้าขาย | ✅ | |

---

## M03 POS Sale

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| 3 โหมด (Button/Scan/Both) | ✅ | SaleModePicker |
| เลือกสินค้า Grid | ✅ | |
| สแกนบาร์โค้ด | ✅ | Manual + Camera |
| Multi-UOM (เลือกหน่วย) | ✅ | UOMSelector |
| สินค้าบริการ → Popup เลือกช่าง | ✅ | ServiceStaffPopup |
| ตะกร้า (Cart) CRUD | ✅ | CartScreen |
| ส่วนลดรายสินค้า | ✅ | |
| ส่วนลดท้ายบิล | ✅ | DiscountScreen |
| ใช้คูปอง | ✅ | CouponInput component |
| ชำระเงิน (หลายช่องทาง) | ✅ | PaymentScreen |
| Split Payment | ✅ | |
| พิมพ์ใบเสร็จ | ✅ | ReceiptScreen |
| พักบิล (Hold/Recall) | ✅ | HoldBillScreen |
| ยกเลิกบิล (Void) | ✅ | CancelBillScreen |
| Kiosk Mode | ✅ | KioskSetupScreen + PIN |
| Customer Display (จอ 2) | ✅ | CustomerDisplayScreen |
| Ad Manager | ✅ | AdManagerScreen |
| **เปิด/ปิดกะ (Shift)** | ✅ | ShiftScreen + ShiftStore |
| **เงินเข้า/ออก (Cash In/Out)** | ✅ | อยู่ใน ShiftScreen |
| ตัดสต๊อกอัตโนมัติ (local) | ⚠️ | Mock — ยังไม่ตัดจริง (ไม่มี API) |
| สะสมแต้ม CRM หลังชำระ | ⚠️ | Logic ตรวจสมาชิกมี แต่ยังไม่ auto-earn |

---

## M04 สินค้า & กำหนดราคา

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| Listing สินค้า + ค้นหา/กรอง | ✅ | Web + Mobile |
| เพิ่มสินค้าใหม่ (ฟอร์มครบ) | ✅ | AddEditProductScreen |
| Multi-UOM + Multi-Barcode | ✅ | UOMManager |
| VAT% เลือกได้ (0%/7%) | ✅ | |
| ประเภทสินค้า (ทั่วไป/บริการ) | ✅ | |
| Import สินค้า Excel | ✅ | WebProductScreen |
| กำหนดราคา (เอกสาร 3 step) | ✅ | WebPricingScreen |
| Import/Export ราคา | ✅ | CSV + Template |
| เฉพาะ ENTERPRISE เท่านั้น | ✅ | ตรวจ storeType |

---

## M05 คลังสินค้า & ERP

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| รับสินค้า (Receive) | ✅ | WebInventoryScreen |
| เบิกสินค้า (Issue) | ✅ | |
| นับสต๊อก | ✅ | |
| โอนข้ามสาขา (Transfer) | ❌ | **ยังไม่ได้ทำ — Phase 2** |
| ERP Sync (Online) | ❌ | **ต้องมี backend — Phase 2** |
| ERP Sync (Offline Queue) | ❌ | **ออกแบบแล้ว ยังไม่ implement** |

---

## M06 CRM สมาชิก

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| ข้อมูลสมาชิก (Listing) | ✅ | กดดูรายละเอียดได้ |
| รายละเอียดสมาชิก (คะแนน+ประวัติ) | ✅ | Member Detail view |
| เพิ่มสมาชิก (ฟอร์ม) | ✅ | AddMemberPanel |
| ระดับสมาชิก (ตั้งค่า+แก้ไข) | ✅ | กดที่ card แก้ไขเงื่อนไขได้ |
| ตั้งค่าคะแนน (อัตรา/หมดอายุ/โบนัส) | ✅ | PointsSettingsPanel |
| ปรับปรุงคะแนน (Manual +/-) | ✅ | PointAdjustPanel |
| คูปอง/Voucher (สร้าง+จัดการ) | ✅ | CouponsPanel + ฟอร์ม |
| Campaign Marketing (สร้าง) | ✅ | CampaignsPanel + ฟอร์ม |
| Gamification (สร้างเกม) | ✅ | GamificationPanel + ฟอร์ม |
| Segment ลูกค้า | ✅ | SegmentsPanel |
| ประวัติการซื้อ | ✅ | HistoryPanel |
| Wallet/Credit | ✅ | WalletPanel (summary) |
| **รายงาน CRM** | ✅ | 5 KPI + 5 ตาราง (แต้ม/ระดับ/คูปอง/สมาชิกใหม่/แคมเปญ) |
| ตั้งค่า CRM (LINE OA + e-Card + แจ้งเตือน) | ✅ | SettingsPanel |

---

## M07 โปรโมชั่น

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| Promotion Engine (Conditions) | ✅ | src/engine/conditions/ |
| Promotion Engine (Benefits) | ✅ | src/engine/benefits/ |
| Conflict Resolution (3 strategies) | ✅ | src/engine/conflict/ |
| Audit Trail | ✅ | src/engine/audit/ |
| สร้างโปรโมชั่น (Web) | ✅ | WebPromotionScreen |
| โปรฯ เชื่อมกับ POS | ✅ | ใช้ CouponInput + engine |

---

## M08 รายงาน

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| รายงานยอดขาย | ✅ | WebReportsScreen |
| รายงานแยกช่องทางชำระ | ✅ | |
| รายงานสินค้าขายดี | ✅ | |
| รายงานกำไร | ✅ | |
| รายงานสต๊อก | ✅ | |
| **สรุปประจำวัน (Daily Summary)** | ✅ | WebDailySummaryScreen (7 ส่วน) |
| Export PDF / Excel / Print | ✅ | ปุ่มมี (alert demo) |
| รายงานเปรียบเทียบสาขา (Enterprise) | ❌ | **Phase 2** |

---

## M09 ผู้ใช้งาน & พนักงาน

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| จัดการพนักงาน (CRUD ครบ) | ✅ | StaffManagementScreen + Web |
| ข้อมูลพนักงานครบ (ส่วนบุคคล/ติดต่อ/ฉุกเฉิน/จ้างงาน/PDPA) | ✅ | |
| จัดการผู้ใช้งาน (CRUD + เชื่อม Employee) | ✅ | UserManagementScreen + Web |
| Reset Password | ✅ | ปุ่มไอคอนกุญแจ |
| Role & Permissions | ✅ | PermissionMatrixScreen |
| สิทธิ์ตามสาขา (Enterprise) | ❌ | **Phase 2** |

---

## M10 ตั้งค่าระบบ

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| ตั้งค่าร้านค้า (ชื่อ/ที่อยู่/Tax/VAT/SC) | ✅ | ShopSettingsScreen |
| ประเภทร้าน (SERVICE/RETAIL) | ✅ | |
| ขนาดร้าน (BUSINESS/ENTERPRISE) | ⚠️ | **Store มี field แล้ว แต่ UI ยังเป็น flat 3 ตัว** |
| จัดการสาขา | ✅ | BranchManageScreen + Web |
| จัดการจุดขาย | ✅ | POSManageScreen |
| เครื่องพิมพ์ | ✅ | PrinterSettingsScreen |
| จอที่ 2 | ✅ | CustomerDisplaySettingsScreen |
| Security (PIN/Timeout) | ✅ | SecuritySettingsScreen |
| Audit Log | ✅ | AuditLogScreen |
| ERP Integration config | ❌ | **Phase 2 — ยังไม่มีหน้า config ERP** |

---

## M11 Sync & Offline

| Flow | สถานะ | หมายเหตุ |
|------|-------|---------|
| Sync Monitor UI | ✅ | SyncNavigator + SyncMonitorScreen |
| **Zustand Persist (จำค่า demo)** | ⚠️ | **storeConfigStore ใช้ persist แล้ว — แต่ product/cart/shift/employee ยังไม่ได้** |
| Offline Queue | ❌ | **ออกแบบแล้ว ยังไม่ implement** |
| Conflict Resolution (Sync) | ❌ | **Phase 2** |

---

## สรุป Gap ที่เหลือ (ต้องทำ)

### ⚠️ ทำบางส่วน (ควรทำให้ครบ)

| # | รายการ | สิ่งที่ขาด |
|---|--------|-----------|
| 1 | RegisterShopScreen — businessScale | UI ยังไม่แยกเป็น 2 มิติ (type + scale) |
| 2 | Zustand Persist | เฉพาะ storeConfig ใช้แล้ว — ต้องเพิ่มใน product, cart, shift, employee |
| 3 | ตัดสต๊อกอัตโนมัติ | Logic mock ไม่ได้ตัดจริง |
| 4 | สะสมแต้ม CRM อัตโนมัติ | ยังไม่ auto-earn หลังชำระ |
| 5 | ShopSettings — businessScale UI | Store มี field แต่ไม่มี picker |

### ❌ ยังไม่ได้ทำ (Phase 2-3)

| # | รายการ | Priority |
|---|--------|----------|
| 1 | โอนสินค้าข้ามสาขา | Phase 2 |
| 2 | ERP Sync (Online/Offline) | Phase 2 |
| 3 | Offline Queue + Retry | Phase 2 |
| 4 | สิทธิ์ตามสาขา | Phase 2 |
| 5 | รายงานเปรียบเทียบสาขา | Phase 2 |
| 6 | ERP Integration config UI | Phase 2 |
| 7 | Sync Conflict Resolution | Phase 2 |

---

## ข้อเสนอลำดับการทำต่อ

1. **เร่งด่วน:** เพิ่ม Persist ให้ stores ที่เหลือ (product, cart, shift, employee) — ใช้เวลาน้อย ได้ผลมาก (demo จำค่า)
2. **เร่งด่วน:** อัปเดต RegisterShopScreen + ShopSettings ให้แยก businessType + businessScale เป็น 2 มิติ
3. **ถัดไป:** Auto-earn แต้ม CRM หลังชำระเงิน
4. **Phase 2:** ERP Integration, Transfer Stock, Branch Permissions

---

*ตรวจสอบเมื่อ 22/06/2567 — Build: ✅ Pass (Web)*
