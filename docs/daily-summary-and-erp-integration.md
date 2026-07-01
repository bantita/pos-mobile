# หน้าสรุปประจำวัน & การเชื่อมต่อสต๊อกกับ ERP

> เอกสารออกแบบ — POS Mobile

---

## 1. หน้าสรุปประจำวัน (Daily Summary)

### 1.1 ภาพรวม

หน้าสรุปประจำวันแสดงข้อมูลทุกอย่างที่เกิดขึ้นในแต่ละวัน เพื่อให้เจ้าของร้าน/ผู้จัดการ ตรวจสอบและสรุปก่อนปิดร้าน

### 1.2 ส่วนประกอบของหน้าสรุป

```
┌─────────────────────────────────────────────────────────────────────┐
│  📅 สรุปประจำวัน — 22/06/2567                   [เลือกวันที่ ▼]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ─── KPI รวม ───                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ ยอดขายรวม │ │ จำนวนบิล │ │ เฉลี่ย/บิล │ │ กำไรเบื้อง │ │ คืนสินค้า │ │
│  │ ฿48,320  │ │ 156      │ │ ฿310     │ │ ฿12,080  │ │ 2 บิล    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  ─── 1. สรุปยอดขาย ───                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ช่องทางชำระ    │ จำนวนบิล │ ยอดเงิน    │ สัดส่วน         │   │
│  │ เงินสด         │ 98       │ ฿32,100    │ ████████░░ 66%  │   │
│  │ QR Code        │ 35       │ ฿10,500    │ ████░░░░░░ 22%  │   │
│  │ บัตรเครดิต     │ 15       │ ฿4,500     │ ██░░░░░░░░ 9%   │   │
│  │ โอนเงิน       │ 8        │ ฿1,220     │ █░░░░░░░░░ 3%   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─── 2. สรุปสต๊อก (เชื่อม ERP) ───                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ สถานะ Sync     │ ✅ Synced เมื่อ 22:30                     │   │
│  │ สินค้าขายวันนี้ │ 45 รายการ (ตัดสต๊อกแล้ว)                  │   │
│  │ สินค้าใกล้หมด   │ 3 รายการ ⚠️                               │   │
│  │ สินค้าหมดสต๊อก  │ 1 รายการ ❌                               │   │
│  │                                                             │   │
│  │ [ดูรายละเอียดสต๊อก] [Sync กับ ERP ตอนนี้]                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─── 3. สรุปคะแนน CRM ───                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ แต้มที่แจกวันนี้      │ 1,250 แต้ม (45 ธุรกรรม)             │   │
│  │ แต้มที่ใช้/แลกวันนี้  │ 320 แต้ม (5 ธุรกรรม)               │   │
│  │ สมาชิกใหม่วันนี้      │ 3 คน                                │   │
│  │ อัปเกรดระดับวันนี้    │ 1 คน (Silver → Gold)                │   │
│  │ คูปองที่ใช้วันนี้     │ 8 ใบ (ส่วนลดรวม ฿450)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─── 4. สรุปกะ (Shift) ───                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ กะ      │ พนักงาน     │ เปิด   │ ปิด   │ ยอดขาย │ ผลต่าง │   │
│  │ กะเช้า  │ สมศักดิ์    │ 08:00  │ 15:00 │ ฿28,500│ +฿50  │   │
│  │ กะบ่าย  │ สมหญิง     │ 15:00  │ 22:00 │ ฿19,820│ -฿20  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─── 5. เงินเข้า-ออกระหว่างวัน ───                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ เวลา  │ ประเภท     │ จำนวน    │ เหตุผล          │ โดย     │   │
│  │ 09:30 │ เงินเข้า 💰│ +฿5,000  │ เพิ่มเงินทอน    │ สมชาย  │   │
│  │ 14:15 │ เงินออก 📤│ -฿3,000  │ นำฝากธนาคาร    │ สมหญิง │   │
│  │ 18:00 │ เงินออก 📤│ -฿2,000  │ จ่ายค่าของ     │ สมชาย  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─── 6. รายการขายวันนี้ (Top 10) ───                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ # │ สินค้า                  │ จำนวน │ ยอดเงิน │ กำไร     │   │
│  │ 1 │ น้ำดื่มสิงห์ 600ml      │ 85    │ ฿850   │ ฿340    │   │
│  │ 2 │ มาม่า หมูสับ            │ 60    │ ฿420   │ ฿180    │   │
│  │ 3 │ เลย์ รสออริจินัล        │ 45    │ ฿900   │ ฿270    │   │
│  │...│                         │       │        │         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─── 7. รายการยกเลิก/คืนสินค้า ───                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ เวลา  │ เลขบิล │ สินค้า        │ ยอด    │ เหตุผล   │ อนุมัติ│   │
│  │ 11:30 │ #1198  │ แชมพู H&S    │ ฿89    │ ลูกค้าเปลี่ยนใจ│ MGR │   │
│  │ 16:45 │ #1210  │ สบู่ Dove    │ ฿45    │ สินค้าชำรุด   │ MGR │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [📄 Export PDF]  [📊 Export Excel]  [🖨️ พิมพ์สรุป]                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. การเชื่อมต่อสต๊อกกับ ERP หลังบ้าน

### 2.1 Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   POS Mobile    │◄───────►│   Sync Service   │◄───────►│  ERP Server │
│  (หน้าร้าน)     │  REST/  │   (Middleware)   │  API/   │  (หลังบ้าน)  │
│                 │  WS     │                  │  Queue  │             │
│  - ขายสินค้า    │         │  - Queue Manager │         │  - สต๊อกกลาง │
│  - ตัดสต๊อก     │         │  - Conflict Res. │         │  - บัญชี     │
│  - เงินเข้า/ออก │         │  - Retry Logic   │         │  - จัดซื้อ    │
└─────────────────┘         └──────────────────┘         └─────────────┘
        │                                                       │
        │  [Offline Mode]                                       │
        │  เก็บ transaction ไว้ใน                                │
        │  local storage                                        │
        │  sync เมื่อ online                                    │
        └───────────────────────────────────────────────────────┘
```

### 2.2 การตัดสต๊อก (Stock Deduction)

| เหตุการณ์ | ที่ POS | ส่งไป ERP |
|----------|---------|----------|
| ขายสินค้า | ตัดสต๊อก local ทันที | Queue → ERP ตัดสต๊อกกลาง |
| ยกเลิกบิล | คืนสต๊อก local ทันที | Queue → ERP คืนสต๊อกกลาง |
| รับสินค้า | เพิ่มสต๊อก local | Queue → ERP เพิ่มสต๊อก |
| โอนข้ามสาขา | ลดสต๊อก local (ต้นทาง) | Queue → ERP โอน |

### 2.3 Online vs Offline Mode

```
┌─ Online Mode ─────────────────────────────────────────────┐
│                                                           │
│  POS ขาย → ตัดสต๊อก local → ส่ง API ทันที → ERP ตัด     │
│                                                           │
│  สต๊อก POS = สต๊อก ERP (Real-time sync)                  │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌─ Offline Mode ────────────────────────────────────────────┐
│                                                           │
│  POS ขาย → ตัดสต๊อก local → เก็บ Queue (IndexedDB)       │
│                                                           │
│  เมื่อ Online กลับมา:                                     │
│    Queue → Sync Service → ERP ตัดสต๊อก                   │
│    ERP ส่งสต๊อกล่าสุด → Update local                     │
│                                                           │
│  ⚠️ อาจเกิด Conflict:                                    │
│    - สินค้าหมดที่ ERP แต่ POS ยังขายอยู่ (offline)        │
│    - แก้ไข: ERP flag "oversold" → ร้านตรวจสอบ             │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 2.4 Sync Protocol

```typescript
interface StockSyncPayload {
  transactionId: string;
  posId: string;
  branchId: string;
  timestamp: string;          // ISO 8601
  type: 'SALE' | 'VOID' | 'RECEIVE' | 'TRANSFER' | 'ADJUST';
  items: StockSyncItem[];
}

interface StockSyncItem {
  productCode: string;
  uomUnit: string;
  quantity: number;           // + เพิ่ม, - ลด
  reason?: string;
}

interface ERPStockResponse {
  productCode: string;
  branchId: string;
  currentStock: number;       // สต๊อกที่ ERP
  lastUpdated: string;
  status: 'ok' | 'low' | 'out_of_stock' | 'oversold';
}
```

### 2.5 ERP API Endpoints (ที่ POS เรียก)

| Endpoint | Method | คำอธิบาย |
|----------|--------|----------|
| `/api/stock/deduct` | POST | ตัดสต๊อกจากการขาย |
| `/api/stock/restore` | POST | คืนสต๊อกจากยกเลิกบิล |
| `/api/stock/receive` | POST | เพิ่มสต๊อกจากรับสินค้า |
| `/api/stock/transfer` | POST | โอนสินค้าข้ามสาขา |
| `/api/stock/query` | GET | ดึงสต๊อกปัจจุบันจาก ERP |
| `/api/stock/sync` | POST | Sync batch (offline queue) |
| `/api/stock/alerts` | GET | ดึงรายการสินค้าใกล้หมด/หมด |

### 2.6 Conflict Resolution

| สถานการณ์ | วิธีจัดการ |
|----------|-----------|
| สต๊อก ERP = 0 แต่ POS ขายไป (offline) | Flag "oversold" → แจ้ง Manager ตรวจสอบ |
| ราคา ERP เปลี่ยน ระหว่าง offline | ใช้ราคาที่ POS ขายไป (ราคา ณ เวลาขาย) |
| สินค้าถูกลบจาก ERP | Flag "discontinued" → POS ซ่อนสินค้า |
| 2 สาขาโอนสินค้าพร้อมกัน | Queue FIFO + Lock |

---

## 3. การ Persist ข้อมูลสำหรับ Demo (Offline Storage)

### 3.1 เทคโนโลยีที่ใช้

| Platform | Storage | ขนาด |
|----------|---------|------|
| Web | localStorage + IndexedDB | 5MB / 50MB+ |
| Mobile (React Native) | AsyncStorage | ไม่จำกัด |

### 3.2 ข้อมูลที่ Persist

```typescript
interface PersistedData {
  // ร้านค้า
  storeConfig: StoreConfig;

  // สินค้า & ราคา
  products: ProductMaster[];
  pricingDocs: PricingDoc[];

  // ยอดขาย
  salesHistory: SaleOrder[];
  dailySummaries: DailySummary[];

  // กะ
  shifts: Shift[];
  cashMovements: CashMovement[];

  // สต๊อก
  stockLevels: Record<string, number>;  // productId → qty
  syncQueue: StockSyncPayload[];        // offline queue

  // CRM
  members: Member[];
  pointTransactions: PointTransaction[];

  // ผู้ใช้/พนักงาน
  employees: Employee[];
  users: UserAccount[];

  // Meta
  lastSyncAt: string;
  version: string;
}
```

### 3.3 Zustand Persist (Implementation)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useCartStore = create(
  persist(
    (set, get) => ({
      // ... state & actions
    }),
    {
      name: 'pos-cart-storage',
      storage: createJSONStorage(() =>
        Platform.OS === 'web' ? localStorage : AsyncStorage
      ),
    }
  )
);
```

---

## 4. หน้าสรุปประจำวัน — Data Model

```typescript
interface DailySummary {
  date: string;               // YYYY-MM-DD
  branchId: string;
  posId: string;

  // ยอดขาย
  sales: {
    totalAmount: number;
    totalBills: number;
    averagePerBill: number;
    grossProfit: number;
    byPaymentMethod: Record<string, { count: number; amount: number }>;
  };

  // สต๊อก
  stock: {
    itemsSold: number;        // จำนวน SKU ที่ขาย
    totalQtySold: number;     // จำนวนชิ้นรวม
    lowStockCount: number;    // สินค้าใกล้หมด
    outOfStockCount: number;  // สินค้าหมด
    lastSyncAt?: string;      // sync กับ ERP ล่าสุด
    syncStatus: 'synced' | 'pending' | 'error';
  };

  // CRM
  crm: {
    pointsEarned: number;     // แต้มที่แจก
    pointsRedeemed: number;   // แต้มที่ใช้
    newMembers: number;       // สมาชิกใหม่
    levelUpgrades: number;    // อัปเกรดระดับ
    couponsUsed: number;      // คูปองที่ใช้
    couponDiscount: number;   // ส่วนลดจากคูปอง
  };

  // กะ
  shifts: {
    id: string;
    cashierName: string;
    openedAt: string;
    closedAt: string;
    salesTotal: number;
    cashDifference: number;   // ผลต่าง (นับจริง - ควรเป็น)
  }[];

  // เงินเข้า-ออก
  cashMovements: {
    time: string;
    type: 'cash_in' | 'cash_out';
    amount: number;
    reason: string;
    by: string;
  }[];

  // Top สินค้า
  topProducts: {
    code: string;
    name: string;
    qtySold: number;
    revenue: number;
    profit: number;
  }[];

  // ยกเลิก/คืน
  voids: {
    time: string;
    billNo: string;
    productName: string;
    amount: number;
    reason: string;
    approvedBy: string;
  }[];
}
```

---

## 5. Flow การทำงานรวม (วันปกติ)

```
06:00  ──── เปิดร้าน ────
         │
         ▼
       เปิดกะเช้า (กรอกเงินเปิดกะ ฿5,000)
         │
         ▼
       ขายสินค้า → ตัดสต๊อก local → Queue sync ERP
         │
09:30    ├── เงินเข้า: +฿5,000 (เพิ่มเงินทอน)
         │
12:00    ├── Sync สต๊อกกับ ERP (อัตโนมัติทุก 30 นาที)
         │
14:15    ├── เงินออก: -฿3,000 (นำฝากธนาคาร)
         │
15:00  ──── เปลี่ยนกะ ────
         │
         ▼
       ปิดกะเช้า (นับเงิน → ผลต่าง +฿50)
       เปิดกะบ่าย (กรอกเงินเปิดกะ)
         │
         ▼
       ขายต่อ...
         │
18:00    ├── เงินออก: -฿2,000 (จ่ายค่าของ)
         │
22:00  ──── ปิดร้าน ────
         │
         ▼
       ปิดกะบ่าย (นับเงิน → ผลต่าง -฿20)
         │
         ▼
       ดูหน้าสรุปประจำวัน:
         - ยอดขายรวม: ฿48,320
         - จำนวนบิล: 156
         - สินค้าขาย: 45 SKU
         - สต๊อกหมด: 1 รายการ
         - แต้มแจก: 1,250
         - สมาชิกใหม่: 3
         │
         ▼
       Final Sync → ERP (สต๊อก + ยอดขาย + บัญชี)
         │
         ▼
       [Export PDF] [พิมพ์สรุป]
```

---

## 6. ERP ที่รองรับ (แผนอนาคต)

| ERP | Protocol | หมายเหตุ |
|-----|----------|---------|
| Custom API | REST JSON | กำหนดเอง — flexible ที่สุด |
| SAP Business One | SAP Service Layer | สำหรับ Enterprise ใหญ่ |
| Microsoft Dynamics | Dataverse API | |
| Odoo | XML-RPC / REST | Open-source ERP |
| AccCloud | REST API | ERP ไทย |
| PEAK Account | REST API | ระบบบัญชีไทย |
| FlowAccount | REST API | ระบบบัญชีไทย |

### Integration Config (ตั้งค่าในระบบ)

```typescript
interface ERPIntegrationConfig {
  enabled: boolean;
  provider: 'custom' | 'sap' | 'dynamics' | 'odoo' | 'acccloud' | 'peak' | 'flow';
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  syncInterval: number;       // นาที (0 = real-time)
  syncStock: boolean;
  syncSales: boolean;
  syncAccounting: boolean;
  retryCount: number;
  retryDelay: number;         // วินาที
}
```

---

## 7. สรุป

| หัวข้อ | รายละเอียด |
|--------|-----------|
| หน้าสรุปประจำวัน | KPI, ยอดขายแยกช่องทาง, สต๊อก, CRM, กะ, เงินเข้า/ออก, Top สินค้า, ยกเลิก |
| สต๊อก | ตัด local ทันที → Sync กับ ERP (online: real-time, offline: queue) |
| Conflict | Flag "oversold" / "discontinued" → แจ้ง Manager |
| Persist (Demo) | Zustand persist → localStorage (web) / AsyncStorage (mobile) |
| Export | PDF, Excel, พิมพ์ |
