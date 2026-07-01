# Backend API Specification — POS CRM Mobile

## สิ่งที่ Backend ต้อง provide เพื่อเชื่อมต่อกับ Mobile App

---

## 🔑 Authentication & Authorization

**Base:** `/api/v1/auth`

| Method | Endpoint | Body | Response | หมายเหตุ |
|--------|----------|------|----------|----------|
| POST | `/login` | `{ username, password, deviceId? }` | `{ user, accessToken, refreshToken }` | username = เบอร์โทร |
| POST | `/register` | `{ phone, name, password, shopName, shopType? }` | `{ user, accessToken, refreshToken }` | สร้างร้านใหม่ |
| POST | `/logout` | — | 204 | Invalidate refresh token |
| POST | `/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` | Token หมดอายุ auto-refresh |
| POST | `/otp/request` | `{ phone }` | `{ refCode }` | ส่ง OTP ผ่าน SMS |
| POST | `/otp/verify` | `{ phone, code }` | `{ user, accessToken, refreshToken }` | Login ด้วย OTP |
| POST | `/forgot-password` | `{ phone }` | `{ message }` | ส่ง reset link/OTP |
| POST | `/reset-password` | `{ token, newPassword }` | `{ message }` | |
| GET | `/profile` | — | `{ user }` | ดึงข้อมูล user ปัจจุบัน |

**Token Format:** JWT (HS256/RS256)
- Access Token TTL: 15 นาที
- Refresh Token TTL: 30 วัน
- Header: `Authorization: Bearer <accessToken>`

**User Object:**
```json
{
  "id": "u_001",
  "name": "สมชาย ใจดี",
  "username": "0811111111",
  "role": "owner|manager|cashier|stock_staff|report_viewer|admin",
  "shopId": "shop_001",
  "shopName": "ร้านสมชาย",
  "branchId": "b_001"
}
```

---

## 📦 Products

**Base:** `/api/v1/products`

| Method | Endpoint | Params/Body | Response |
|--------|----------|-------------|----------|
| GET | `/` | `?page&limit&search&categoryId&isActive&lowStock&sortBy&sortOrder` | `{ data: Product[], meta: Pagination }` |
| GET | `/:id` | — | `{ data: Product }` |
| GET | `/barcode?barcode=xxx` | — | `{ data: Product }` |
| POST | `/` | Product body | `{ data: Product }` |
| PUT | `/:id` | Partial Product | `{ data: Product }` |
| DELETE | `/:id` | — | `{ message }` |
| GET | `/categories` | — | `{ data: Category[] }` |
| POST | `/categories` | `{ name, color }` | `{ data: Category }` |
| PATCH | `/:id/price` | `{ salePrice, costPrice? }` | `{ data: Product }` |
| POST | `/price/bulk` | `{ items: [{productId, salePrice}] }` | `{ updated: number }` |

**Product Object:**
```json
{
  "id": "prd_001",
  "code": "SKU001",
  "barcode": "8851234567890",
  "name": "น้ำดื่มสิงห์ 600ml",
  "categoryId": "cat_001",
  "categoryName": "เครื่องดื่ม",
  "unit": "ขวด",
  "salePrice": 15.00,
  "costPrice": 8.00,
  "stockQty": 150,
  "minStockQty": 20,
  "imageUrl": "https://...",
  "isActive": true,
  "uoms": [
    { "id": "uom_001", "unit": "แพ็ค", "ratio": 12, "barcode": "...", "salePrice": 160, "costPrice": 88 }
  ]
}
```

---

## 👥 Members (CRM)

**Base:** `/api/v1/members`

| Method | Endpoint | Params/Body | Response |
|--------|----------|-------------|----------|
| GET | `/` | `?page&limit&search&level&isActive&hasLine&tag` | `{ data: Member[], meta }` |
| GET | `/:id` | — | `{ data: Member }` |
| GET | `/phone?phone=xxx` | — | `{ data: Member|null }` |
| POST | `/` | Member body | `{ data: Member }` |
| PUT | `/:id` | Partial Member | `{ data: Member }` |
| POST | `/:id/points/earn` | `{ points, saleId, saleAmount, description? }` | `{ data: PointTransaction }` |
| POST | `/:id/points/redeem` | `{ points, saleId?, description? }` | `{ data: PointTransaction }` |
| POST | `/:id/points/adjust` | `{ points, reason }` | `{ data: PointTransaction }` |
| GET | `/:id/points/history` | `?page&limit` | `{ data: PointTransaction[], meta }` |
| GET | `/segments` | — | `{ data: Segment[] }` |

**Member Object:**
```json
{
  "id": "mem_001",
  "memberNo": "M0001",
  "name": "วิชัย ศรีสุข",
  "phone": "0891234567",
  "email": "wichai@email.com",
  "birthday": "1990-05-15",
  "level": "gold",
  "pointBalance": 1250,
  "totalSpent": 45000,
  "visitCount": 23,
  "lastVisitDate": "2024-06-15",
  "joinDate": "2024-01-10",
  "isActive": true,
  "lineUserId": "U1234567890abcdef",
  "tags": ["ลูกค้าประจำ", "ซื้อเครื่องดื่มเยอะ"]
}
```

**Point Config (ควร return จาก settings API):**
```json
{
  "earnRate": 1,
  "earnPerBaht": 25,
  "redeemRate": 1,
  "minRedeemPoints": 100,
  "pointExpireDays": 365
}
```

---

## 🛒 Sales

**Base:** `/api/v1/sales`

| Method | Endpoint | Body/Params | Response |
|--------|----------|-------------|----------|
| POST | `/` | CreateSaleRequest | `{ data: Sale }` |
| GET | `/` | `?page&limit&dateFrom&dateTo&status&cashierId&memberId` | `{ data: Sale[], meta }` |
| GET | `/:id` | — | `{ data: Sale }` |
| POST | `/:id/void` | `{ reason }` | `{ data: Sale }` |
| POST | `/:id/return` | `{ items, refundMethod }` | `{ data: Sale }` |
| GET | `/summary/daily?date=2024-06-15` | — | DailySummary |

**CreateSaleRequest:**
```json
{
  "items": [
    { "productId": "prd_001", "qty": 2, "unitPrice": 15, "discount": 0, "total": 30, "unit": "ขวด" }
  ],
  "payments": [
    { "method": "cash", "amount": 100, "change": 70 }
  ],
  "memberId": "mem_001",
  "pointsRedeemed": 0,
  "couponCode": "SAVE20",
  "note": ""
}
```

---

## 🏪 Shifts

**Base:** `/api/v1/shifts`

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/open` | `{ openingCash }` | `{ data: Shift }` |
| POST | `/:id/close` | `{ closingCash }` | `{ data: Shift }` |
| GET | `/current` | — | `{ data: Shift|null }` |

---

## 📦 Inventory

**Base:** `/api/v1/inventory`

| Method | Endpoint | Params/Body | Response |
|--------|----------|-------------|----------|
| GET | `/stock` | `?warehouseId&lowStock&outOfStock&page&limit` | `{ data: StockItem[], meta }` |
| GET | `/stock/product/:id` | — | `{ data: StockItem[] }` |
| GET | `/documents` | `?docType&status&page&limit` | `{ data: StockDoc[], meta }` |
| GET | `/documents/:id` | — | `{ data: StockDoc }` |
| POST | `/documents` | StockDoc body | `{ data: StockDoc }` |
| POST | `/documents/:id/confirm` | — | `{ data: StockDoc }` |
| POST | `/documents/:id/cancel` | `{ reason? }` | `{ data: StockDoc }` |
| GET | `/warehouses` | — | `{ data: Warehouse[] }` |

---

## 💳 Payment Gateway

**Base:** `/api/v1/payment`

| Method | Endpoint | Body/Params | Response |
|--------|----------|-------------|----------|
| POST | `/create` | `{ orderId, amount, method, description?, customerId? }` | PaymentResponse |
| GET | `/:id/status` | — | PaymentStatusResponse |
| POST | `/:id/confirm` | `{ ref? }` | PaymentStatusResponse |
| POST | `/refund` | `{ paymentId, amount, reason }` | RefundResponse |
| GET | `/history` | `?dateFrom&dateTo&status` | `{ data: Payment[] }` |

**Payment Methods:** `promptpay`, `credit_card`, `ewallet_truemoney`, `ewallet_linepay`, `ewallet_shopeepay`, `bank_transfer`

**PaymentResponse:**
```json
{
  "paymentId": "pay_001",
  "orderId": "INV2406-0001",
  "amount": 450.00,
  "method": "promptpay",
  "status": "pending",
  "qrCodeData": "000201010212...",
  "qrCodeImage": "data:image/png;base64,...",
  "expiresAt": "2024-06-15T10:05:00Z"
}
```

**Polling:** Client เรียก `GET /payment/:id/status` ทุก 3 วินาที จนกว่า status = `completed|failed|expired`

---

## 💬 LINE OA

**Base:** `/api/v1/line`

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/send` | `{ to: lineUserId, messages: LineMessage[] }` | `{ messageId, status, sentAt }` |
| POST | `/broadcast` | `{ messages, targetAudience? }` | `{ messageId, targetCount }` |
| POST | `/send-coupon` | `{ memberId, couponCode, couponName, discount, expiryDate }` | `{ messageId, status }` |
| GET | `/profile/:lineUserId` | — | `{ userId, displayName, pictureUrl }` |
| POST | `/link-member` | `{ memberId, lineUserId }` | `{ linked: boolean }` |
| GET | `/rich-menus` | — | `{ data: RichMenu[] }` |
| POST | `/notify-points/:memberId` | `{ pointsEarned, totalPoints, level, saleId }` | `{ messageId, status }` |
| GET | `/stats` | — | `{ followers, targetReach, messagesUsed, messagesLimit }` |

**Backend Implementation:**
- Backend เก็บ LINE Channel Access Token (ห้าม expose ที่ client)
- Backend เรียก `https://api.line.me/v2/bot/message/push` แทน client
- Webhook URL: `https://your-api.com/api/v1/line/webhook` (สำหรับรับ events)

---

## 🔄 Sync (Offline First)

**Base:** `/api/v1/sync`

| Method | Endpoint | Body/Params | Response |
|--------|----------|-------------|----------|
| POST | `/push` | `{ deviceId, deviceName, transactions[] }` | `{ synced, failed, conflicts[] }` |
| GET | `/pull?since=ISO&entityTypes=sale,product` | — | `{ changes[], serverTime }` |
| POST | `/resolve` | `{ transactionId, resolution, manualValue? }` | `{ resolved: boolean }` |
| GET | `/status/:deviceId` | — | `{ lastSyncAt, pendingCount, conflictCount }` |

---

## 📐 Standard Response Format

ทุก endpoint ใช้ format เดียวกัน:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Format:**
```json
{
  "success": false,
  "message": "รายละเอียด error",
  "code": "VALIDATION_ERROR",
  "errors": {
    "phone": ["เบอร์โทรซ้ำในระบบ"],
    "name": ["กรุณากรอกชื่อ"]
  }
}
```

**HTTP Status Codes:**
- `200` — Success
- `201` — Created
- `400` — Validation error
- `401` — Unauthorized (token หมดอายุ/ไม่มี)
- `403` — Forbidden (ไม่มีสิทธิ์)
- `404` — Not found
- `409` — Conflict (duplicate/sync conflict)
- `500` — Server error

---

## 🔧 ข้อมูลที่ต้องเตรียมจาก Backend Team

1. **Base URL** ของ API server (dev/staging/prod)
2. **LINE Channel Access Token** + Channel Secret (จาก LINE Developers Console)
3. **PromptPay ID** ของร้านค้า (เบอร์โทร 10 หลัก หรือ เลข National ID 13 หลัก)
4. **Payment Gateway credentials** (ถ้าใช้ 2C2P/Omise/Stripe)
5. **SMS Provider** credentials (สำหรับ OTP — เช่น ThaiBulkSMS, SMSMKT)
6. **Webhook URL** สำหรับ LINE events + Payment notifications

---

## 🏗️ Backend Tech Stack แนะนำ

| Component | ตัวเลือก |
|-----------|---------|
| Framework | NestJS / Express / Fastify |
| Database | PostgreSQL + Prisma/TypeORM |
| Cache | Redis (session, rate limit) |
| Queue | BullMQ / RabbitMQ (LINE messages, sync) |
| Storage | S3 / MinIO (product images) |
| Auth | JWT + bcrypt |
| LINE SDK | `@line/bot-sdk` |
| Payment | 2C2P API / Omise / KBank KPGW |
| SMS | ThaiBulkSMS API / Firebase Auth |
| Deploy | Docker + Railway / AWS ECS / GCP Cloud Run |
