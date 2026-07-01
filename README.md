# POS Mobile — React Native

ระบบ POS on Mobile พัฒนาด้วย React Native + Expo

## โครงสร้างโปรเจกต์

```
pos-mobile/
├── App.tsx                          # Entry point + Root Navigator
├── app.json                         # Expo config
├── package.json
├── src/
│   ├── constants/
│   │   ├── colors.ts                # Design tokens — สี
│   │   ├── typography.ts            # Design tokens — ตัวอักษร
│   │   └── spacing.ts               # Design tokens — ระยะห่าง, border radius
│   ├── components/
│   │   └── ui/
│   │       ├── Button.tsx           # Reusable Button component
│   │       ├── Input.tsx            # Reusable Input component
│   │       ├── Card.tsx             # Reusable Card component
│   │       └── index.ts
│   ├── navigation/
│   │   └── AuthNavigator.tsx        # M01 Auth stack navigator
│   └── screens/
│       └── auth/
│           ├── WelcomeScreen.tsx    # SCR-AUTH-001
│           ├── LoginScreen.tsx      # SCR-AUTH-002
│           ├── OTPLoginScreen.tsx   # SCR-AUTH-003
│           ├── ForgotPasswordScreen.tsx  # SCR-AUTH-004
│           └── RegisterShopScreen.tsx    # SCR-AUTH-005
```

## Screens ที่สร้างแล้ว

### M01 — Authentication (Phase 1) ✅
| Screen ID | หน้าจอ | สถานะ |
|---|---|---|
| SCR-AUTH-001 | Welcome Screen | ✅ Done |
| SCR-AUTH-002 | Login Screen | ✅ Done |
| SCR-AUTH-003 | OTP Login Screen | ✅ Done |
| SCR-AUTH-004 | Forgot Password Screen | ✅ Done |
| SCR-AUTH-005 | Register Shop Screen | ✅ Done |

### M02 — Dashboard (Phase 1) ✅
| Screen ID | หน้าจอ | สถานะ |
|---|---|---|
| SCR-DASH-001 | Dashboard หลัก (KPI Cards + Top Products + Low Stock) | ✅ Done |
| SCR-DASH-002 | Dashboard Cashier (Shift Status + Start Sale) | ✅ Done |
| SCR-DASH-003 | Sync Status (Queue list + Retry) | ✅ Done |
| Screen ID | หน้าจอ | สถานะ |
|---|---|---|
| SCR-SALE-001 | หน้าขายสินค้า (Product Grid + Search + Category) | ✅ Done |
| SCR-SALE-002 | หน้าสแกน Barcode (Camera + Manual Input) | ✅ Done |
| SCR-SALE-003 | หน้าตะกร้าสินค้า (Qty +/- + Summary) | ✅ Done |
| SCR-SALE-004 | หน้าส่วนลด (% / บาท + Quick select + Approval) | ✅ Done |
| SCR-SALE-005 | หน้าพักบิล/เรียกบิล (Hold + Recall + Delete) | ✅ Done |
| SCR-SALE-006 | หน้าชำระเงิน (Cash/Credit/QR/Transfer/E-Wallet + Split) | ✅ Done |
| SCR-SALE-007 | หน้าใบเสร็จ (Print + Reprint + Audit Log) | ✅ Done |

## วิธีติดตั้งและรัน

```bash
cd pos-mobile
npm install
npx expo start
```

## Dependencies หลัก
- **expo ~51.0.0** — Managed workflow
- **expo-router ~3.5.0** — File-based routing
- **@react-navigation** — Stack & Tab navigation
- **zustand** — State management
- **react-hook-form + zod** — Form validation
- **expo-sqlite** — Local database (Offline First)
- **expo-camera** — Barcode scanning

### M04 — Product Management (Phase 1) ✅
| Screen ID | หน้าจอ | สถานะ |
|---|---|---|
| SCR-PROD-001 | รายการสินค้า (Search + Filter Category + Status) | ✅ Done |
| SCR-PROD-002 | เพิ่มสินค้า (Form + Margin Preview + VAT toggle) | ✅ Done |
| SCR-PROD-003 | แก้ไขสินค้า (รวมกับ SCR-PROD-002 + Audit Log ราคา) | ✅ Done |
| SCR-PROD-004 | Import/Export Excel (Preview table + Error rows + Progress) | ✅ Done |
| SCR-PROD-005 | จัดการหมวด/Brand (Tab switcher + CRUD + FAB) | ✅ Done |
