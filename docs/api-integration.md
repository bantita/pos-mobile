# Xcellence ERP POS — API Integration Guide

## Overview

ระบบ POS ปัจจุบันทำงานแบบ **Offline-First** โดยใช้ mock data + Zustand stores
เมื่อเชื่อมต่อ API จริง จะเปลี่ยนจาก mock → HTTP calls ผ่าน service layer

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  UI Screens  │────▶│ Zustand Store│────▶│ API Service  │
│  (React)     │     │ (State)      │     │ (HTTP)       │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  Backend API │
                                          │  (REST/GQL)  │
                                          └──────────────┘
```

### Offline Strategy
1. **Write**: บันทึกใน local store → queue sync เมื่อ online
2. **Read**: อ่านจาก local store (cache) → background refresh จาก API
3. **Conflict**: Last-write-wins + manual resolve สำหรับ critical data

---

## API Endpoints (Proposed)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | สมัครร้านค้าใหม่ |
| POST | `/api/auth/login` | เข้าสู่ระบบ (ได้ JWT token) |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | ออกจากระบบ |
| GET | `/api/auth/me` | ข้อมูล user ปัจจุบัน |

#### Request: Register
```json
{
  "shopName": "ร้านสะดวกซื้อ ABC",
  "businessType": "retail",
  "businessScale": "small",
  "ownerName": "สมชาย ใจดี",
  "phone": "0812345678",
  "email": "owner@shop.com",
  "password": "secret123"
}
```

#### Response: Login
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBh...",
  "user": {
    "id": "u-001",
    "name": "สมชาย ใจดี",
    "role": "owner",
    "shopId": "shop-001",
    "shopName": "ร้านสะดวกซื้อ ABC"
  }
}
```

---

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | รายการสินค้า (paginated, search, filter) |
| GET | `/api/products/:id` | รายละเอียดสินค้า |
| POST | `/api/products` | สร้างสินค้าใหม่ |
| PUT | `/api/products/:id` | แก้ไขสินค้า |
| DELETE | `/api/products/:id` | ลบสินค้า |
| POST | `/api/products/import` | Import จาก Excel |
| GET | `/api/products/export` | Export เป็น Excel |
| GET | `/api/categories` | หมวดหมู่ทั้งหมด |
| GET | `/api/brands` | แบรนด์ทั้งหมด |

#### Query Params (GET /api/products)
```
?page=1&limit=50&search=น้ำดื่ม&category=เครื่องดื่ม&status=active
```

---

### Sales (POS)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sales` | สร้างบิลขาย |
| GET | `/api/sales` | ประวัติบิล (paginated, filter) |
| GET | `/api/sales/:id` | รายละเอียดบิล |
| POST | `/api/sales/:id/void` | ยกเลิกบิล |
| POST | `/api/sales/:id/return` | คืนสินค้า |
| POST | `/api/sales/:id/receipt` | พิมพ์ใบเสร็จซ้ำ |

#### Request: Create Sale
```json
{
  "items": [
    { "productId": "p1", "qty": 3, "unitPrice": 10, "discountAmount": 0 },
    { "productId": "p2", "qty": 2, "unitPrice": 25, "discountAmount": 5 }
  ],
  "memberId": "mem-001",
  "couponCode": "SUMMER2024",
  "discount": { "type": "percent", "value": 10 },
  "payments": [
    { "method": "cash", "amount": 500 }
  ],
  "pointsUsed": 0,
  "posId": "pos-001",
  "branchId": "branch-001"
}
```

#### Response: Sale Created
```json
{
  "id": "sale-001",
  "saleNo": "INV20670622001",
  "grandTotal": 320,
  "change": 180,
  "pointsEarned": 12,
  "receiptUrl": "/receipts/INV20670622001.pdf"
}
```

---

### Members (CRM)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members` | รายการสมาชิก |
| GET | `/api/members/:id` | รายละเอียดสมาชิก |
| POST | `/api/members` | เพิ่มสมาชิก |
| PUT | `/api/members/:id` | แก้ไข |
| POST | `/api/members/:id/points/earn` | สะสมคะแนน |
| POST | `/api/members/:id/points/redeem` | ใช้คะแนน |
| GET | `/api/members/:id/history` | ประวัติคะแนน |
| GET | `/api/members/:id/purchases` | ประวัติซื้อ |

---

### Promotions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/promotions` | รายการโปรโมชั่น |
| POST | `/api/promotions` | สร้างโปร |
| PUT | `/api/promotions/:id` | แก้ไข |
| DELETE | `/api/promotions/:id` | ปิดใช้งาน |
| POST | `/api/promotions/validate` | ตรวจสอบคูปอง |
| POST | `/api/promotions/apply` | ใช้คูปอง |

#### Request: Validate Coupon
```json
{
  "code": "SUMMER2024",
  "cartTotal": 500,
  "memberLevel": "gold"
}
```

#### Response
```json
{
  "valid": true,
  "promotionId": "promo-003",
  "promotionName": "คูปอง SUMMER2024 ลด 100 บาท",
  "discountAmount": 100
}
```

---

### Communication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/communication/contacts` | LINE OA contacts |
| POST | `/api/communication/broadcast` | ส่ง broadcast |
| GET | `/api/communication/broadcasts` | ประวัติส่ง |
| GET | `/api/communication/templates` | Templates |
| POST | `/api/communication/send-coupon` | ส่งคูปองผ่าน LINE/SMS |

---

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/daily-summary` | สรุปประจำวัน |
| GET | `/api/reports/sales` | รายงานการขาย |
| GET | `/api/reports/products` | รายงานสินค้า |
| GET | `/api/reports/inventory` | รายงานคลัง |
| GET | `/api/reports/profit` | รายงานกำไร |
| GET | `/api/reports/cashiers` | รายงานพนักงาน |

#### Query Params
```
?startDate=2026-06-01&endDate=2026-06-22&branchId=all&posId=all
```

---

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/stock` | สต๊อกปัจจุบัน |
| POST | `/api/inventory/adjust` | ปรับสต๊อก |
| POST | `/api/inventory/transfer` | โอนสต๊อกระหว่างสาขา |
| GET | `/api/inventory/movements` | ประวัติเคลื่อนไหว |

---

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/shop` | ข้อมูลร้าน |
| PUT | `/api/settings/shop` | แก้ไขข้อมูลร้าน |
| GET | `/api/settings/branches` | สาขาทั้งหมด |
| POST | `/api/settings/branches` | เพิ่มสาขา |
| GET | `/api/settings/payment-methods` | ช่องทางชำระ |
| PUT | `/api/settings/payment-methods` | อัพเดทช่องทางชำระ |

---

## วิธีเชื่อม API (Implementation Guide)

### Step 1: สร้าง API Client

```typescript
// src/services/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: process.env.API_URL || 'https://api.xcellence-erp.com/v1',
  timeout: 30000,
});

// Attach token
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // Try refresh token
      const refreshed = await refreshToken();
      if (refreshed) return api(err.config);
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default api;
```

### Step 2: สร้าง Service Layer

```typescript
// src/services/saleService.ts
import api from './apiClient';

export const saleService = {
  create: (data: CreateSaleRequest) => api.post('/sales', data),
  getAll: (params: SaleFilter) => api.get('/sales', { params }),
  getById: (id: string) => api.get(`/sales/${id}`),
  void: (id: string, reason: string) => api.post(`/sales/${id}/void`, { reason }),
};
```

### Step 3: ปรับ Store ให้เรียก API

```typescript
// src/store/saleHistoryStore.ts (ส่วนที่เปลี่ยน)
addSale: async (saleData) => {
  // 1. บันทึก local ก่อน (optimistic)
  const localSale = { ...saleData, id: genId(), syncStatus: 'pending' };
  set(s => ({ sales: [localSale, ...s.sales] }));

  // 2. ส่ง API (background)
  try {
    const response = await saleService.create(saleData);
    set(s => ({
      sales: s.sales.map(sl =>
        sl.id === localSale.id
          ? { ...sl, ...response.data, syncStatus: 'synced' }
          : sl
      ),
    }));
  } catch (err) {
    // Mark as failed — retry later
    set(s => ({
      sales: s.sales.map(sl =>
        sl.id === localSale.id ? { ...sl, syncStatus: 'failed' } : sl
      ),
    }));
  }
},
```

### Step 4: Sync Queue สำหรับ Offline

```typescript
// src/services/syncQueue.ts
interface SyncItem {
  id: string;
  action: string;
  endpoint: string;
  payload: any;
  retries: number;
  createdAt: Date;
}

class SyncQueue {
  private queue: SyncItem[] = [];

  add(item: Omit<SyncItem, 'id' | 'retries' | 'createdAt'>) { /* ... */ }

  async processQueue() {
    for (const item of this.queue) {
      try {
        await api[item.action](item.endpoint, item.payload);
        this.remove(item.id);
      } catch (err) {
        item.retries++;
        if (item.retries > 5) this.markFailed(item.id);
      }
    }
  }
}
```

---

## ERP Integration Flow

```
POS Sale Completed
    │
    ▼
┌─────────────────────┐
│  POST /api/sales    │ → บันทึกบิลใน POS DB
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Webhook → ERP      │ → ส่งข้อมูลบิลไป ERP
└─────────┬───────────┘
          │
          ├──▶ บัญชี: ลงบันทึกรายรับ
          ├──▶ สต๊อก: ตัดยอดสินค้า
          └──▶ CRM: อัพเดทยอดซื้อสมาชิก
```

### ERP Endpoints
| Action | POS → ERP |
|--------|-----------|
| ขายสินค้า | `POST /erp/journal-entries` (รายรับ) |
| ตัดสต๊อก | `PUT /erp/inventory/deduct` |
| รับสินค้า (PO) | `POST /erp/inventory/receive` |
| สรุปวัน | `POST /erp/daily-close` |
| สมาชิกใหม่ | `POST /erp/customers` |

### Configuration (ตั้งค่า > ERP Integration)
```json
{
  "erpUrl": "https://erp.company.com/api",
  "apiKey": "erp-api-key-xxx",
  "syncInterval": 300,
  "modules": {
    "sales": true,
    "inventory": true,
    "accounting": true,
    "customers": true
  }
}
```

---

## Environment Variables

```env
# .env
API_URL=https://api.xcellence-erp.com/v1
ERP_URL=https://erp.company.com/api
ERP_API_KEY=xxx

# LINE OA
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=abc...
LINE_ACCESS_TOKEN=token...

# SMS
SMS_PROVIDER=thaibulksms
SMS_API_KEY=xxx

# Firebase (Push)
FCM_SERVER_KEY=xxx
```

---

## Authentication Flow

```
┌────────┐    POST /auth/login     ┌────────┐
│ Client │ ──────────────────────▶ │ Server │
│        │ ◀────────────────────── │        │
└────────┘   { token, refresh }    └────────┘
     │
     │  ทุก request แนบ
     │  Authorization: Bearer <token>
     │
     │  เมื่อ token หมดอายุ (401)
     │  POST /auth/refresh { refreshToken }
     │  ได้ token ใหม่ → retry request เดิม
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": true,
  "code": "COUPON_EXPIRED",
  "message": "คูปองหมดอายุแล้ว",
  "details": { "expiredAt": "2026-03-31" }
}
```

### Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| AUTH_INVALID | 401 | Token ไม่ถูกต้อง |
| AUTH_EXPIRED | 401 | Token หมดอายุ |
| FORBIDDEN | 403 | ไม่มีสิทธิ์ |
| NOT_FOUND | 404 | ไม่พบข้อมูล |
| VALIDATION | 422 | ข้อมูลไม่ถูกต้อง |
| COUPON_EXPIRED | 400 | คูปองหมดอายุ |
| COUPON_LIMIT | 400 | คูปองใช้ครบสิทธิ์ |
| INSUFFICIENT_STOCK | 400 | สต๊อกไม่พอ |
| INSUFFICIENT_POINTS | 400 | คะแนนไม่พอ |
