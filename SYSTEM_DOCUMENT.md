# POS Mobile — System Document v2.0

> เอกสารสรุปฟังก์ชัน, Flow และ User Journey ครบทุกโมดูล
> Version 1.0.0 | React Native + Expo | Theme: Warm Pastel

---

## 1. ภาพรวมระบบ

```
POS Mobile
├── Platform      : iOS · Android · Web (macOS/Windows/Browser PWA)
├── Offline First : SQLite → SyncQueue → Server
├── Multi-Branch  : หลายสาขา / หลาย POS / หลายผู้ใช้
├── Role-Based    : 6 Roles · Permission Matrix · Menu Visibility
├── Kiosk Mode    : Fullscreen · PIN Exit · Auto-lock · 3 Layouts
└── Export        : Excel (CSV) + PDF ทุก Report
```

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | React Native 0.74 + Expo 51 |
| Web | react-native-web + Webpack + PWA |
| Navigation | React Navigation 6 (Stack + Bottom Tab) |
| State | Zustand 4 |
| Local DB | expo-sqlite |
| Export | expo-print + expo-sharing |
| Icons | @expo/vector-icons (Ionicons) |
| Forms | react-hook-form + Zod |

---

## 2. Navigation Map

```
App.tsx
├── LoadingScreen (splash + progress bar)
│
├── AuthNavigator          ← M01
│   ├── WelcomeScreen
│   ├── LoginScreen
│   ├── OTPLoginScreen
│   ├── ForgotPasswordScreen
│   └── RegisterShopScreen
│
└── MainNavigator (Bottom Tab 7 tabs)
    ├── [หน้าหลัก]  DashboardNavigator    ← M02
    ├── [ขาย]       SaleNavigator         ← M03 + Kiosk
    ├── [สินค้า]    ProductNavigator      ← M04
    ├── [คลัง]      InventoryNavigator    ← M05
    ├── [รายงาน]    ReportsNavigator      ← M09
    ├── [Sync]       SyncNavigator         ← M11
    └── [ตั้งค่า]   SettingsNavigator     ← M10
```

---

## 3. User Flow ทุก Role

---

### 3.1 Owner — เจ้าของร้าน

```
เปิดแอป → LoadingScreen
  └── Login (Phone: 0811111111 / Pass: Demo1234)
        └── DashboardScreen (Owner)
              ├── ดู KPI: ยอดขายวันนี้ / บิล / กำไร / ยอดเดือน
              ├── สินค้าขายดี Top 5
              ├── Low Stock Alert → กด "จัดซื้อ"
              └── Quick Actions

[Tab ขาย]
  └── POSSaleScreen
        ├── เลือก Sale Mode (ปุ่ม/สแกน/ทั้ง2)
        ├── กดปุ่ม Kiosk → ตั้งค่า → เข้า Kiosk Mode
        ├── เลือกสินค้า (Grid + Category + Search)
        ├── Long press → เลือก UOM (แพ็ค/ลัง)
        ├── CartScreen → DiscountScreen → PaymentScreen
        └── ReceiptScreen → พิมพ์ใบเสร็จ

[Tab สินค้า]
  └── ProductListScreen
        ├── Search / Filter / Sort
        ├── กด + → AddEditProductScreen
        │     └── กำหนด Multi-Unit + Barcode หลายบาร์
        ├── Import Excel → Preview → Confirm
        └── CategoryManageScreen (CRUD หมวด/Brand)

[Tab คลัง]
  └── InventoryHubScreen
        ├── รับสินค้า → StockDocFormScreen
        │     ├── Dropdown เลือกสินค้า + UOM + ยอดคงเหลือ
        │     ├── สแกน Barcode สะสมต่อเนื่อง
        │     └── Confirm → เลขที่ RCV2406-xxxx
        ├── เบิกสินค้า → (เหมือนรับ แต่ตรวจ Stock)
        └── Revision → แก้ไขเอกสารที่ confirm แล้ว

[Tab รายงาน]
  └── ReportsHubScreen
        ├── รายงานยอดขาย → Listing (รายวัน/พนักงาน) → Export
        ├── รายงานสินค้า → Listing (ขายดี/Master) → Export
        ├── รายงานคลัง → Listing (คงเหลือ/รับ/เบิก) → Export
        ├── รายงานกำไร → Listing (วัน/เดือน/สินค้า) → Export
        └── Enterprise → Listing (สาขา/POS KPI) → Export

[Tab ตั้งค่า]
  └── SettingsHubScreen
        ├── ข้อมูลร้านค้า / สาขา / POS / เครื่องพิมพ์
        ├── User Management → Add/Edit/Disable/Reset Password
        ├── Permission Matrix → Toggle ✅/❌ ต่อ Role×Module
        ├── Menu Visibility → เปิด/ปิดเมนูทั้งโมดูล
        ├── Security Policy
        ├── Audit Log → ดูย้อนหลัง / Export
        └── Sync Monitor → Retry / Resolve Conflict
```

---

### 3.2 Manager — ผู้จัดการ

```
Login (0822222222 / Demo1234)
  └── DashboardScreen (เหมือน Owner แต่ไม่เห็น Enterprise Report)

[Tab ขาย]
  └── เหมือน Owner + อนุมัติส่วนลดเกิน limit ของ Cashier

[Tab สินค้า]
  └── เห็นทุก action ยกเว้น Delete (ถ้า Permission ไม่ได้เปิด)

[Tab คลัง]
  └── อนุมัติ Stock Adjustment ของ Stock Staff

[Tab รายงาน]
  └── ดูได้ทุก Report ยกเว้น Enterprise (Phase 2)

[Tab ตั้งค่า]
  └── เห็นแค่ User Management (ไม่เห็น Permission Matrix)
```

---

### 3.3 Cashier — พนักงานขาย

```
Login (0833333333 / Demo1234)
  └── CashierDashboardScreen
        ├── นาฬิกา Real-time
        ├── Shift Status (ยอดขายกะนี้ / จำนวนบิล)
        └── ปุ่ม "เริ่มขายสินค้า" (pulse animation)

[กด "เริ่มขายสินค้า"]
  └── POSSaleScreen
        ├── เลือกสินค้า / สแกน Barcode
        ├── CartScreen
        │     ├── ส่วนลด (≤ 15% = ทำเองได้, > 15% = ต้องขอ Approval)
        │     └── ชำระเงิน
        ├── PaymentScreen → Cash/QR/Credit/Transfer/E-Wallet
        └── ReceiptScreen → พิมพ์ใบเสร็จ

[ไม่เห็น] Tab คลัง / Tab รายงาน / Tab ตั้งค่า (ส่วนใหญ่)
```

---

### 3.4 Stock Staff — พนักงานคลัง

```
Login (0844444444 / Demo1234)
  └── DashboardScreen (ดูได้อย่างเดียว)

[Tab คลัง] — สิทธิ์เต็ม
  └── InventoryHubScreen
        ├── รับสินค้า (สร้าง / ยืนยัน)
        ├── เบิกสินค้า
        ├── นับสต๊อก
        ├── ปรับสต๊อก (ต้องส่งอนุมัติ Manager)
        └── ตรวจสอบคงเหลือ

[Tab สินค้า] — ดูได้อย่างเดียว
[Tab รายงาน] — ดูรายงานคลัง
[ไม่เห็น] Tab ขาย (Cashier) / Settings ส่วนใหญ่
```

---

### 3.5 Report Viewer — ผู้ดูรายงาน

```
Login (0855555555 / Demo1234)
  └── DashboardScreen (ดูอย่างเดียว)

[Tab รายงาน] — สิทธิ์เต็ม
  └── ReportsHubScreen
        ├── เปิด Report ได้ทุกประเภท
        ├── Export Excel / PDF ได้
        └── กรอง Date Range / Search / Sort

[ไม่เห็น] Tab ขาย / คลัง / ตั้งค่า
```

---

### 3.6 Admin — ผู้ดูแลระบบ

```
Login (admin / Demo1234)
  └── SettingsHubScreen (หน้าหลัก)
        ├── User Management — Full CRUD
        ├── Role Management — Full CRUD
        ├── Permission Matrix — ตั้งค่าทุก Role
        ├── Security Settings — Password Policy
        ├── Audit Log — ดูและ Export
        └── Sync Monitor — จัดการ Queue / Conflict

[ไม่เห็น] Tab ขาย / สินค้า / คลัง (ขึ้นอยู่กับ Permission)
```

---

## 4. M03 POS Sale — Flow ละเอียด

```
┌─────────────────────────────────────────────────────┐
│                   POSSaleScreen                      │
│  [Mode: button_only / scan_only / both]              │
│                                                      │
│  Top Bar:                                            │
│  [Kiosk] [Mode] [จอ2] [พัก] [ยกเลิก]               │
└──────────┬──────────────────┬───────────────────────┘
           │                  │
    [Grid Mode]          [Scan Mode]
    Product Grid         Camera/Manual
    Category Filter      Barcode Input
    Search               Auto UOM detect
    Long press = UOM     Scan accumulate
           │                  │
           └────────┬─────────┘
                    ▼
              addItem(product)
                    │
                    ▼
           ┌────────────────┐
           │  CartScreen    │
           │  qty ± / delete│
           │  VAT summary   │
           └──┬─────────┬───┘
              │         │
         [Discount]  [Checkout]
              │         │
              ▼         ▼
        DiscountScreen  PaymentScreen
        % หรือ บาท      Cash/QR/Credit
        Approval PIN    Transfer/Ewallet
              │         Split Payment
              │              │
              └──────┬───────┘
                     ▼
               ReceiptScreen
               Print/Share PDF
               Reprint + AuditLog
                     │
               [ขายต่อ] → CartScreen

─── Kiosk Flow ───
[กดปุ่ม Kiosk] → KioskSetupScreen
  Layout: Compact/Split/FullGrid
  PIN: ตั้งใหม่ (≥4 หลัก)
  Idle: 1/3/5/10 นาที
  [เข้า Kiosk] → KioskPOSSaleScreen
    กดค้างปุ่ม "ออก Kiosk" 2 วิ
    → KioskExitModal (PIN Pad)
    → กรอก PIN ถูก → ออก Kiosk
```

---

## 5. M04 Product — Flow ละเอียด

```
ProductListScreen
  ├── Search (ชื่อ/รหัส/บาร์โค้ด)
  ├── Category chips + Status toggle
  ├── [เพิ่ม] → AddEditProductScreen
  │     Form Sections:
  │     1. รหัส (Auto-gen) + Barcode (scan icon)
  │     2. ชื่อ / หมวด / Brand / Unit (Picker Modal)
  │     3. ราคาทุน + ราคาขาย → Margin Preview live
  │     4. VAT toggle
  │     5. UOMManager:
  │           หน่วยฐาน (ratio=1) + Barcodes
  │           + เพิ่มหน่วยใหม่ (ratio, auto-calc ราคา)
  │           + แต่ละหน่วยมีบาร์โค้ดหลายบาร์ได้
  │     6. Min Stock / Status
  │     [บันทึก] → Audit Log ถ้าเปลี่ยนราคา
  │
  ├── [Import/Export] → ImportExportScreen
  │     Upload → Preview Table → Error rows
  │     → Confirm → Progress bar → Done
  │     Export: ทั้งหมด / ที่กรอง / Template
  │
  └── [หมวดหมู่] → CategoryManageScreen
        Tab: หมวดหมู่ / Brand
        CRUD + FAB + Toggle Status
```

---

## 6. M05 Inventory — Flow ละเอียด

```
InventoryHubScreen
  Stats: เอกสารวันนี้ / แบบร่าง / รวม
  Menu: รับ / เบิก / โอน / นับ / ปรับ / ตรวจ
  Recent: 3 เอกสารล่าสุด

─── รับ/เบิกสินค้า ───
DocListScreen
  Filter: แบบร่าง / ยืนยัน / ยกเลิก
  Search: เลขที่ / Supplier
  [สร้างใหม่] → StockDocFormScreen
    Header: เลือกคลัง + Supplier/ปลายทาง
    
    วิธีที่ 1 — Dropdown:
      ค้นหาสินค้า → เลือก UOM → แสดงคงเหลือ
      → กด + → เพิ่มใน row list
    
    วิธีที่ 2 — Scan Barcode:
      กด "สแกน ON" → กรอก/สแกน barcode
      → auto-detect UOM → เพิ่ม row
      → สแกนซ้ำ barcode เดิม = qty +1
      → สแกนใหม่ = row ใหม่
    
    Row แต่ละรายการ:
      [unit badge] [ชื่อ] [คงเหลือ] [qty ±] [ราคา] [มูลค่า]
    
    Summary: รายการ / หน่วยฐาน / มูลค่ารวม
    
    [บันทึกแบบร่าง] → status=draft
    [ยืนยัน] → status=confirmed + Running No.
               RCV2406-0001 / ISS2406-0001

─── Revision ───
DocDetailScreen (confirmed)
  [กด Revise] → ReviseModal
    เลือกเหตุผล (6 ตัวเลือก)
    [ยืนยัน] → สร้าง Rev.1 draft (copy items)
                เดิม = status=revised
  Revision Timeline: แสดงทุก version
  กดข้ามไปแต่ละ Rev ได้
```

---

## 7. M09 Reports — Flow ละเอียด

```
ReportsHubScreen (5 รายงาน)
  Feature badges: ตาราง / Excel / PDF / Search / Sort
  
  กดเข้ารายงาน → [Report]ListScreen
    ┌─────────────────────────────────┐
    │  DateRangePicker (6 presets)    │
    │  KPI Summary Cards              │
    │  Tab selector (ตัวเลือกมุมมอง) │
    │                                 │
    │  ReportListView                 │
    │  ┌───────────────────────────┐  │
    │  │ Header + Export buttons   │  │
    │  │ Search bar + result count │  │
    │  │ Table Header (sort ได้)   │  │
    │  │ Data rows (striped)       │  │
    │  │ Summary section           │  │
    │  │ Pagination (20/หน้า)      │  │
    │  └───────────────────────────┘  │
    └─────────────────────────────────┘
    
    [Export Excel] → ดาวน์โหลด .csv (เปิดได้ใน Excel)
    [Export PDF]   → Print dialog / Share PDF

─── แต่ละ Report ───

SCR-RPT-001 ยอดขาย:
  Tab: รายวัน | ตามพนักงาน
  Cols: วันที่/ยอดขาย/บิล/เฉลี่ย/กำไร/Margin

SCR-RPT-002 สินค้า:
  Tab: สินค้าขายดี | Master สินค้า
  ขายดี: #/รหัส/ชื่อ/หมวด/ขาย/รายได้/กำไร/Margin
  Master: รหัส/บาร์โค้ด/ชื่อ/หมวด/ราคา/คงเหลือ/สถานะ

SCR-RPT-003 คลัง:
  Tab: คงเหลือ | รับสินค้า | เบิกสินค้า
  คงเหลือ: รหัส/ชื่อ/คลัง/คงเหลือ(สีตามสถานะ)/มูลค่า/สถานะ
  เอกสาร: เลขที่/Supplier/รายการ/จำนวน/มูลค่า/สถานะ/วันที่

SCR-RPT-004 กำไร:
  Tab: รายวัน | รายเดือน | ตามสินค้า
  Cols: ช่วง/รายได้/ต้นทุน/กำไร(สีเขียว)/Margin(สีตามค่า)

SCR-RPT-005 Enterprise (Phase 2):
  Tab: เปรียบเทียบสาขา | ประสิทธิภาพ POS
  สาขา: สาขา/ยอดขาย/บิล/กำไร/Margin/Turnover/GMROI
  POS: จุดขาย/สาขา/พนักงาน/ยอดขาย/บิล/เฉลี่ย
```

---

## 8. M10 Settings — Permission Flow

```
SettingsHubScreen
  Role Switcher (Dev Mode): เปลี่ยน Role ทดสอบสิทธิ์

  เมนูแสดงตามสิทธิ์:
  ✅ มีสิทธิ์ → เข้าได้
  🔒 ไม่มีสิทธิ์ → dim + lock icon
  👁️‍🗨️ เมนูปิด → icon ปิดตา + "เมนูถูกปิดใช้งาน"

Permission Matrix Flow:
  [Owner/Admin เท่านั้น]
  เลือก Role Tab
  → Module rows × Action columns
  → Toggle ✅/❌ แต่ละ cell
  → Menu Visibility Section
     ปิด/เปิดเมนูทั้งโมดูล
  [บันทึก] → Audit Log: PERMISSION_CHANGE

Audit Log Flow:
  Search + Filter Action Type
  กด row → expand
    Before Value / After Value
    IP Address / Device
  [Export Excel/PDF]
```

---

## 9. M11 Sync — Flow ละเอียด

```
User Action (Offline)
  → บันทึก SQLite
  → สร้าง SyncQueue entry (status=pending)

เมื่อ Online:
  → Auto Sync → status=success ✅

ถ้า Fail:
  → status=failed
  → SyncQueueScreen แสดง error
  → กด Retry / Retry ทั้งหมด

ถ้า Conflict:
  → status=conflict
  → ConflictResolutionScreen
    เปรียบเทียบ Client vs Server
    เลือก:
      Server Wins → ใช้ Server data
      Client Wins → เขียนทับ Server
      Manual Merge → กรอกค่าเอง
    → status=success ✅
```

---

## 10. Export Excel/PDF — Flow

```
ทุก Report มีปุ่ม [Excel] [PDF]

[Export Excel]
  → Platform.OS === 'web'
      → download .csv ผ่าน browser
  → Native (iOS/Android)
      → เขียน temp .csv
      → Sharing.shareAsync() → บันทึก / ส่ง

[Export PDF]
  → Platform.OS === 'web'
      → เปิด window ใหม่ + print dialog
  → Native
      → Print.printToFileAsync(html)
      → Sharing.shareAsync(.pdf)
      → หรือ Print.printAsync() (พิมพ์โดยตรง)

HTML Template:
  - Warm Pastel theme (#FF8F8F header)
  - Table striped + border
  - Summary footer
  - ชื่อร้าน + วันที่พิมพ์
  - รองรับ Thai font
```

---

## 11. Screen Count Summary

| Module | Screens | Phase | Export |
|---|---|---|---|
| M01 Authentication | 5 | 1 | — |
| M02 Dashboard | 3 | 1 | — |
| M03 POS Sale + Kiosk | 10 | 1 | PDF ใบเสร็จ |
| M04 Product | 5 | 1 | Excel/PDF |
| M05 Inventory | 8 | 1 | Excel/PDF |
| M09 Reports | 5 (+ Listing) | 1/2 | Excel/PDF |
| M10 Settings | 11 | 1 | Audit Log Export |
| M11 Sync | 4 | 1 | — |
| **รวม** | **~51** | | |

---

## 12. File Structure

```
pos-mobile/
├── App.tsx                     Entry + Loading
├── app.json                    Expo config (Web PWA)
├── webpack.config.js           Web build
├── public/manifest.json        PWA manifest
├── DEMO.md                     Demo credentials
├── SYSTEM_DOCUMENT.md          เอกสารนี้
│
└── src/
    ├── components/
    │   ├── ui/          Button · Input · Card
    │   ├── kiosk/       KioskWrapper · ExitModal · LockScreen
    │   ├── reports/     ReportListView · DateRangePicker · MiniBarChart
    │   ├── inventory/   DocStatusBadge · ProductSearchDropdown
    │   ├── product/     UOMManager
    │   └── settings/    PermissionGuard
    │
    ├── constants/       colors · typography · spacing
    │
    ├── data/            mockProducts · mockInventory · mockReports
    │
    ├── hooks/           usePermission
    │
    ├── navigation/      Auth · Main · Sale · Dashboard
    │                    Product · Inventory · Reports · Settings · Sync
    │
    ├── screens/
    │   ├── auth/        Welcome · Login · OTP · Forgot · Register
    │   ├── dashboard/   Dashboard · CashierDashboard · SyncStatus
    │   ├── sale/        POSSale · Barcode · Cart · Discount
    │   │                HoldBill · Payment · Receipt · Cancel · CustomerDisplay
    │   ├── kiosk/       KioskPOSSale · KioskSetup
    │   ├── product/     ProductList · AddEdit · ImportExport · Category
    │   ├── inventory/   Hub · DocList · DocForm · DocDetail
    │   ├── reports/     SalesList · ProductList · InventoryList
    │   │                ProfitList · EnterpriseList
    │   ├── settings/    Hub · Shop · Branch · User · Role · Permission
    │   │                POS · Printer · Security · AuditLog · SyncMonitor
    │   ├── sync/        LocalTransaction · SyncQueue · ConflictResolution
    │   └── LoadingScreen
    │
    ├── store/           cart · saleMode · kiosk · permission · stockDoc · sync
    │
    ├── types/           sale · product · inventory · reports
    │                    stockDocument · sync · saleMode
    │
    └── utils/           format · platform · exportReport
```

---

## 13. Quick Reference

| สิ่งที่ต้องการ | ไฟล์ |
|---|---|
| เปลี่ยนสี Theme | `src/constants/colors.ts` |
| เพิ่มสินค้า Mock | `src/data/mockProducts.ts` |
| เพิ่มรายงาน Mock | `src/data/mockReports.ts` |
| เปลี่ยน Permission | `src/store/permissionStore.ts` |
| แก้ Kiosk PIN default | `src/store/kioskStore.ts` |
| แก้ Export Template | `src/utils/exportReport.ts` |
| เพิ่ม Tab ใหม่ | `src/navigation/MainNavigator.tsx` |

---

*POS Mobile v1.0.0 · สร้างด้วย React Native + Expo · Warm Pastel Theme*
