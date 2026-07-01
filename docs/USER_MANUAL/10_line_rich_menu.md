# 10 — LINE Rich Menu & LINE Official Account

## LINE Official Account คืออะไร?

LINE Official Account (LINE OA) คือบัญชีธุรกิจบน LINE ที่ร้านค้าใช้สื่อสารกับลูกค้า:
- ส่งข้อความ/โปรโมชั่น/คูปอง
- แจ้งเตือนคะแนน/สถานะ
- ให้ลูกค้าเช็คยอดคะแนน/ประวัติ
- **Rich Menu** — เมนูกดด้านล่าง chat ที่ลูกค้าใช้งานได้ทันที

---

## สมัคร LINE Official Account

1. ไปที่ [LINE OA Manager](https://manager.line.biz)
2. กด **"สร้างบัญชีใหม่"**
3. กรอก:
   - ชื่อบัญชี (ชื่อร้าน)
   - หมวดหมู่ (ค้าปลีก/ร้านอาหาร/ร้านบริการ)
   - รูปโปรไฟล์ (โลโก้ร้าน)
4. เลือกแผน:
   - **Free** — 500 ข้อความ broadcast/เดือน (Push message ไม่จำกัด)
   - **Light** — 5,000 ข้อความ (~800 บาท/เดือน)
   - **Standard** — 30,000 ข้อความ (~1,200 บาท/เดือน)

---

## เปิด Messaging API (จำเป็นสำหรับเชื่อม POS)

1. ใน LINE OA Manager → **Settings** → **Messaging API**
2. กด **"เปิดใช้ Messaging API"**
3. เลือก/สร้าง **Provider** → สร้าง Channel
4. จด credentials:
   - **Channel ID**
   - **Channel Secret**
   - **Channel Access Token** (กด Issue ใน LINE Developers Console)

---

## Rich Menu คืออะไร?

Rich Menu คือ **เมนูภาพแบบกดได้** ที่แสดงด้านล่างห้องแชท ลูกค้าเห็นทันทีเมื่อเปิดแชทกับร้าน

ตัวอย่าง Rich Menu สำหรับร้านค้า POS CRM:

```
┌────────────┬────────────┬────────────┐
│  🛒 ซื้อ   │  ⭐ คะแนน  │  🎫 คูปอง  │
│  สินค้า    │  ของฉัน    │  ส่วนลด    │
├────────────┼────────────┼────────────┤
│  📋 ประวัติ │  🏪 สาขา  │  📞 ติดต่อ  │
│  การซื้อ   │  ใกล้ฉัน   │  ร้านค้า   │
└────────────┴────────────┴────────────┘
```

---

## วิธีสร้าง Rich Menu

### วิธีที่ 1: สร้างผ่าน LINE OA Manager (ง่ายที่สุด)

1. เข้า [LINE OA Manager](https://manager.line.biz) → เลือกบัญชี
2. ไปที่ **Chat** → **Rich Menu**
3. กด **"สร้าง Rich Menu"**
4. ตั้งค่า:
   - **ชื่อ** (สำหรับ admin ดู): "เมนูหลักร้าน"
   - **ช่วงเวลาแสดง**: ตั้งวันที่เริ่ม-สิ้นสุด (หรือ "แสดงตลอด")
   - **แสดงค่าเริ่มต้น**: เปิดใช้ (แสดงทันทีเมื่อเข้าแชท)
5. **เลือก Template** (จำนวนปุ่ม):
   - 2 ปุ่ม (1 แถว)
   - 3 ปุ่ม (1 แถว)
   - 4 ปุ่ม (2 แถว)
   - **6 ปุ่ม (2 แถว)** ← แนะนำ
6. **อัปโหลดรูป Rich Menu**:
   - ขนาด: **2500 x 1686 px** (6 ปุ่ม) หรือ **2500 x 843 px** (3 ปุ่ม)
   - ออกแบบใน Canva / Figma / Photoshop
7. **กำหนด Action แต่ละปุ่ม**:

| ปุ่ม | Action Type | ค่า |
|------|-------------|-----|
| ซื้อสินค้า | URL | `https://your-shop.com/products` |
| คะแนนของฉัน | Message | `เช็คคะแนน` |
| คูปองส่วนลด | URL | LIFF URL สำหรับดูคูปอง |
| ประวัติการซื้อ | Message | `ประวัติการซื้อ` |
| สาขาใกล้ฉัน | URL | Google Maps link |
| ติดต่อร้านค้า | Message | `ติดต่อร้าน` |

8. กด **"บันทึก"** → Rich Menu เริ่มแสดงทันที

---

### วิธีที่ 2: สร้างผ่าน API (สำหรับ developer)

ใช้ LINE Messaging API สร้าง Rich Menu แบบ dynamic:

```bash
# 1. สร้าง Rich Menu object
curl -X POST https://api.line.me/v2/bot/richmenu \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "size": { "width": 2500, "height": 1686 },
    "selected": true,
    "name": "เมนูหลักร้าน",
    "chatBarText": "เมนู",
    "areas": [
      {
        "bounds": { "x": 0, "y": 0, "width": 833, "height": 843 },
        "action": { "type": "uri", "uri": "https://liff.line.me/{LIFF_ID}/shop" }
      },
      {
        "bounds": { "x": 833, "y": 0, "width": 834, "height": 843 },
        "action": { "type": "message", "text": "เช็คคะแนน" }
      },
      {
        "bounds": { "x": 1667, "y": 0, "width": 833, "height": 843 },
        "action": { "type": "uri", "uri": "https://liff.line.me/{LIFF_ID}/coupons" }
      },
      {
        "bounds": { "x": 0, "y": 843, "width": 833, "height": 843 },
        "action": { "type": "message", "text": "ประวัติการซื้อ" }
      },
      {
        "bounds": { "x": 833, "y": 843, "width": 834, "height": 843 },
        "action": { "type": "uri", "uri": "https://maps.google.com/..." }
      },
      {
        "bounds": { "x": 1667, "y": 843, "width": 833, "height": 843 },
        "action": { "type": "message", "text": "ติดต่อร้าน" }
      }
    ]
  }'

# 2. อัปโหลดรูป Rich Menu
curl -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @richmenu-image.png

# 3. ตั้งเป็น default Rich Menu (แสดงกับทุกคน)
curl -X POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId} \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}"
```

---

## เชื่อม Rich Menu กับ POS CRM

### 1. ปุ่ม "เช็คคะแนน"

เมื่อลูกค้ากด → ส่งข้อความ "เช็คคะแนน" → **Webhook** รับข้อความ → Backend ค้นหาสมาชิก → ตอบกลับด้วย Flex Message:

```
⭐ คะแนนสะสมของคุณ
───────────────
คุณ สมชาย วงศ์สุข
ระดับ: Gold
คะแนน: 1,250 pts
ยอดซื้อสะสม: ฿48,500
───────────────
[แลกคะแนน] [ดูประวัติ]
```

### 2. ปุ่ม "คูปองส่วนลด" (ใช้ LIFF)

เปิด LIFF App ภายใน LINE:
- แสดงคูปองที่ใช้ได้ (ยังไม่หมดอายุ)
- กดใช้คูปอง → แสดง QR/barcode ให้พนักงานสแกน
- POS สแกน → apply ส่วนลดอัตโนมัติ

### 3. ปุ่ม "ประวัติการซื้อ"

Webhook รับข้อความ → ดึง sale history → ตอบ Flex Message:
```
📋 ประวัติ 5 รายการล่าสุด
─────────
15/06 INV-0045 ฿450
14/06 INV-0044 ฿1,250
13/06 INV-0043 ฿180
...
```

---

## ตั้งค่า Webhook

Webhook คือ URL ที่ LINE ส่ง events มาเมื่อลูกค้าส่งข้อความ/กดปุ่ม:

1. ใน LINE Developers Console → Channel → **Messaging API** tab
2. ตั้ง **Webhook URL**: `https://your-api.com/api/v1/line/webhook`
3. เปิด **Use webhook**: ON
4. ปิด **Auto-reply messages**: OFF
5. ปิด **Greeting messages**: OFF (จัดการเองผ่าน webhook)

### Webhook Events ที่จะรับ:

| Event | เมื่อไหร่ | ทำอะไร |
|-------|----------|--------|
| `message` | ลูกค้าส่งข้อความ/กดปุ่ม Rich Menu | ตรวจข้อความ → ตอบกลับ |
| `follow` | ลูกค้า Add friend | ส่ง Welcome message + ลิงก์สมัครสมาชิก |
| `postback` | ลูกค้ากดปุ่มใน Flex Message | จัดการ action (แลกคะแนน, ใช้คูปอง) |

---

## ตั้งค่าใน POS (Backend)

ไฟล์ `.env` ของ Backend:

```env
# LINE OA
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxx
LINE_LIFF_ID=1234567890-abcdefgh

# Webhook
LINE_WEBHOOK_PATH=/api/v1/line/webhook
```

Backend endpoint:

```typescript
// POST /api/v1/line/webhook
app.post('/api/v1/line/webhook', async (req, res) => {
  const events = req.body.events;
  
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text;
      const userId = event.source.userId;
      
      if (text === 'เช็คคะแนน') {
        const member = await findMemberByLineId(userId);
        if (member) {
          await replyPointsFlex(event.replyToken, member);
        } else {
          await replyText(event.replyToken, 'คุณยังไม่ได้ลงทะเบียนสมาชิก กดที่นี่เพื่อสมัคร →');
        }
      }
      
      if (text === 'ประวัติการซื้อ') {
        const history = await getSaleHistory(userId);
        await replyHistoryFlex(event.replyToken, history);
      }
    }
    
    if (event.type === 'follow') {
      await sendWelcomeMessage(event.source.userId);
    }
  }
  
  res.status(200).send('OK');
});
```

---

## ออกแบบ Rich Menu Image

### ขนาดที่แนะนำ

| Layout | ขนาด (px) | ปุ่ม |
|--------|-----------|------|
| Full (2 แถว 3 คอลัมน์) | 2500 x 1686 | 6 ปุ่ม |
| Half (1 แถว 3 คอลัมน์) | 2500 x 843 | 3 ปุ่ม |
| Compact (1 แถว 2 คอลัมน์) | 2500 x 843 | 2 ปุ่ม |

### เครื่องมือออกแบบ

- **Canva** — ใช้ template "LINE Rich Menu" (ฟรี)
- **Figma** — สร้าง frame 2500x1686 แล้ว export PNG
- **Photoshop** — ใช้ template ที่ดาวน์โหลดจาก LINE

### Tips ออกแบบ

- ใช้สีแบรนด์ร้าน (coral #FF8A75 สำหรับ Xcellence ERP)
- ไอคอนใหญ่ + ข้อความชัด (มือถือจอเล็ก)
- ไม่ใช้ตัวอักษรเล็กกว่า 24px
- มีขอบแบ่งแต่ละปุ่มชัดเจน
- Export เป็น PNG หรือ JPEG (ไม่เกิน 1MB)

---

## Rich Menu สำหรับแต่ละระดับสมาชิก (Advanced)

สร้าง Rich Menu หลายชุดสำหรับแต่ละระดับ:

| ระดับ | Rich Menu | ปุ่มพิเศษ |
|-------|-----------|----------|
| Member | เมนูพื้นฐาน | สมัครอัปเกรด |
| Gold | เมนู Gold | ดูสิทธิพิเศษ Gold |
| Platinum | เมนู Platinum | แลก exclusive reward |
| VIP | เมนู VIP | VIP concierge chat |

ใช้ API เปลี่ยน Rich Menu ตาม userId:
```bash
# ตั้ง Rich Menu เฉพาะคน
curl -X POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId} \
  -H "Authorization: Bearer {TOKEN}"
```

---

## สรุปขั้นตอนทั้งหมด

1. ✅ สมัคร LINE Official Account
2. ✅ เปิด Messaging API → ได้ Channel Access Token
3. ✅ ออกแบบรูป Rich Menu (2500x1686 PNG)
4. ✅ สร้าง Rich Menu ใน LINE OA Manager (หรือ API)
5. ✅ กำหนด Action แต่ละปุ่ม (URL / Message / LIFF)
6. ✅ ตั้งค่า Webhook URL ใน LINE Developers Console
7. ✅ Backend รับ Webhook → ตอบกลับอัตโนมัติ
8. ✅ สร้าง LIFF App สำหรับหน้า คูปอง/สมัครสมาชิก (optional)
9. ✅ เชื่อม LINE userId กับสมาชิกใน POS (ผ่าน LIFF login)
10. ✅ ส่งแจ้งเตือนคะแนน/คูปองอัตโนมัติหลังขาย

---

## คำถามที่พบบ่อย

**Q: สร้าง Rich Menu ฟรีไหม?**
A: ฟรี — Rich Menu เป็นฟีเจอร์ของ LINE OA ทุกแผน (รวมแผนฟรี)

**Q: เปลี่ยน Rich Menu ได้บ่อยแค่ไหน?**
A: เปลี่ยนได้ตลอดเวลา ไม่จำกัด (เช่น เปลี่ยนตามเทศกาล/โปรโมชั่น)

**Q: ลูกค้าต้องทำอะไรบ้าง?**
A: แค่ Add friend LINE OA ของร้าน → เห็น Rich Menu ทันที

**Q: ต้องมี Backend ไหม?**
A: ถ้าใช้แค่ URL link → ไม่ต้อง Backend, ถ้าต้องการตอบกลับอัตโนมัติ (เช่น เช็คคะแนน) → ต้องมี Backend + Webhook
