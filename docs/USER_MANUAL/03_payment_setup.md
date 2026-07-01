# 03 — การชำระเงิน & QR Payment

## ช่องทางชำระเงินที่รองรับ

| ช่องทาง | ประเภท | ต้อง setup เพิ่ม? |
|---------|--------|------------------|
| เงินสด | Offline | ❌ ใช้ได้ทันที |
| PromptPay QR | Semi-offline | ✅ ต้องใส่เลข PromptPay |
| โอนเงิน (แจ้งโอน) | Manual | ✅ ใส่เลขบัญชี |
| บัตรเครดิต/เดบิต | Online | ✅ ต้องเชื่อม Payment Gateway |
| E-Wallet (TrueMoney, LINE Pay) | Online | ✅ ต้องเชื่อม API |

---

## ตั้งค่าช่องทางชำระ

เข้าที่ **ตั้งค่า > ช่องทางชำระเงิน**

### เปิด/ปิดช่องทาง
- กดสวิตช์เปิด/ปิดแต่ละช่องทาง
- ช่องทางที่ปิดจะไม่แสดงตอนชำระ

### ลำดับช่องทาง
- ลากเพื่อจัดลำดับ (ช่องทางที่ใช้บ่อยไว้บนสุด)

---

## 📱 ตั้งค่า PromptPay QR

### วิธีทำ (ไม่ต้องเชื่อม API ธนาคาร)

1. ไปที่ **ตั้งค่า > ช่องทางชำระ > PromptPay**
2. กรอก **เลข PromptPay**:
   - เบอร์โทร (10 หลัก) เช่น `0891234567`
   - หรือ เลขประจำตัวผู้เสียภาษี (13 หลัก)
3. กด **"บันทึก"**
4. ทดสอบ: ไปหน้าขาย → ชำระ → เลือก QR → ระบบสร้าง QR ให้อัตโนมัติ

### หลักการทำงาน
- ระบบสร้าง **EMVCo PromptPay QR** ตามมาตรฐาน BOT
- QR จะมีจำนวนเงินฝังอยู่ (ลูกค้าไม่ต้องกรอกยอดเอง)
- **ไม่ต้องเชื่อม API ธนาคาร** — ใช้ได้ทันที
- ข้อจำกัด: ต้อง manual confirm (กดยืนยันว่าเงินเข้า)

### Auto-confirm (ต้องเชื่อม API)
ถ้าต้องการให้ระบบตรวจสอบอัตโนมัติว่าเงินเข้าแล้ว:
- ดูหัวข้อ "เชื่อม API ธนาคาร" ด้านล่าง

---

## 🏦 เชื่อมต่อ API ธนาคาร

### ทำไมต้องเชื่อม?
- **Auto-confirm** — ระบบรู้เองว่าเงินเข้า (ไม่ต้องกดยืนยัน)
- **Real-time notification** — แจ้งทันทีที่ลูกค้าชำระ
- **Reconciliation** — ยอดตรงกับบัญชีธนาคาร 100%

### ตัวเลือก API ธนาคารในไทย

| ธนาคาร | API/Service | ค่าใช้จ่าย |
|---------|-------------|-----------|
| กสิกร (KBANK) | K-Payment Gateway (KPGW) | ตาม volume |
| ไทยพาณิชย์ (SCB) | SCB Payment API | ตาม volume |
| กรุงไทย (KTB) | KTB Payment Gateway | ตาม volume |
| บัวหลวง (BBL) | Bualuang iBanking API | ตาม volume |
| **2C2P** (aggregator) | 2C2P Payment | รวมทุกธนาคาร |
| **Omise** | Omise Payment Gateway | 3.65% ต่อรายการ |
| **Stripe** | Stripe Thailand | 3.4% + ฿10 |

### ขั้นตอนเชื่อม (ตัวอย่าง 2C2P)

1. **สมัคร merchant account** ที่ [2C2P Merchant Portal](https://merchant.2c2p.com)
2. **รับ credentials:**
   - Merchant ID
   - Secret Key
   - API Endpoint (sandbox/production)
3. **ตั้งค่าใน Backend:**
   ```env
   PAYMENT_PROVIDER=2c2p
   PAYMENT_MERCHANT_ID=JT001234
   PAYMENT_SECRET_KEY=sk_test_xxxxx
   PAYMENT_API_URL=https://sandbox-pgw.2c2p.com/payment/4.1/
   ```
4. **ตั้งค่า Webhook:**
   - URL: `https://your-api.com/api/v1/payment/webhook/2c2p`
   - เมื่อลูกค้าชำระ → 2C2P เรียก webhook → Backend อัปเดต status → POS แสดงผลทันที

### ขั้นตอนเชื่อม (ตัวอย่าง SCB Payment)

1. สมัครที่ [SCB Developer Portal](https://developer.scb)
2. สร้าง Application → ได้ API Key + Secret
3. ตั้งค่า:
   ```env
   PAYMENT_PROVIDER=scb
   SCB_API_KEY=l7xxxxxxxxxxxx
   SCB_API_SECRET=xxxxxxxxxxxx
   SCB_BILLER_ID=xxxxxxxxxxxxxx
   ```
4. SCB มี Confirm API — เรียกเช็คว่า QR ถูก pay แล้ว
5. Backend poll ทุก 3 วินาที หรือใช้ webhook

---

## 💳 เพิ่ม QR รับชำระ (สรุปขั้นตอน)

### แบบ 1: PromptPay Static (ง่ายที่สุด — 5 นาที)
1. ตั้งค่า > ชำระเงิน > PromptPay > กรอกเบอร์
2. เสร็จ! ระบบสร้าง QR มาตรฐาน BOT ให้ทุกครั้ง
3. ลูกค้าสแกน → จ่าย → พนักงานกด "ยืนยัน"

### แบบ 2: PromptPay + Auto Confirm (ต้องมี Backend)
1. ทำแบบ 1 ก่อน
2. Backend เชื่อม Bank API (SCB/KBANK)
3. เมื่อเงินเข้า → Backend แจ้ง POS → ปิดบิลอัตโนมัติ
4. POS poll `GET /payment/:id/status` ทุก 3 วิ

### แบบ 3: Payment Gateway (รวมทุกช่อง)
1. สมัคร 2C2P / Omise / Stripe
2. Backend integrate SDK
3. POS เรียก `POST /payment/create` → ได้ QR/link
4. ลูกค้าชำระ → webhook → POS อัปเดตทันที
5. รองรับ: QR, บัตรเครดิต, E-Wallet ในที่เดียว

---

## Flow การชำระเงินผ่าน QR (Technical)

```
[POS App]                    [Backend]                 [ธนาคาร/Gateway]
    |                            |                          |
    |-- POST /payment/create --> |                          |
    |   {orderId, amount,        |-- create payment ------> |
    |    method: promptpay}      |                          |
    |                            |<-- QR payload ---------- |
    |<-- {qrCodeData, paymentId} |                          |
    |                            |                          |
    | [แสดง QR ให้ลูกค้า]        |                          |
    |                            |                          |
    |                            |        [ลูกค้าสแกนจ่าย]  |
    |                            |<-- webhook: paid --------|
    |                            |                          |
    |-- GET /payment/:id/status->|                          |
    |<-- {status: completed} --- |                          |
    |                            |                          |
    | [ปิดบิล + พิมพ์ใบเสร็จ]    |                          |
```

---

## คำถามที่พบบ่อย

**Q: ไม่มี internet สามารถรับ QR ได้ไหม?**
A: PromptPay Static QR สร้างได้ offline (ไม่ต้อง internet) แต่ auto-confirm ต้องมี internet

**Q: ค่าธรรมเนียมเท่าไหร่?**
A: PromptPay = ฟรี (0%), บัตรเครดิต = 2-3.65%, E-Wallet = 1-2%

**Q: ใช้เวลากี่วันในการ setup?**
A: PromptPay basic = 5 นาที, เชื่อม API ธนาคาร = 1-3 สัปดาห์ (รอ approve)
