---
inclusion: auto
name: crm-domain
description: กฎและคำศัพท์เฉพาะของโดเมน CRM/ลูกค้า เช่น loyalty points, segment, campaign — ใช้เมื่อสร้างหรือแก้หน้าจอใน src/screens/customer/**
---

# CRM Domain Rules

## คำศัพท์มาตรฐาน

| ภาษาไทย (UI) | English (Code/Variable) | หมายเหตุ |
|--------------|------------------------|----------|
| ลูกค้า | Customer | ใช้ในหน้าจอ |
| แต้มสะสม | Loyalty Points | pointBalance, earnPoints, redeemPoints |
| กลุ่มลูกค้า | Segment | segmentId, segmentName |
| แคมเปญ/โปรโมชัน | Campaign | campaignId, campaignStatus |
| ประวัติการซื้อ | Purchase History | purchaseHistory, saleHistory |
| การติดตาม | Follow-up | followUpDate, followUpStatus |

## สีสถานะลูกค้า

- `Colors.confirmed` — ลูกค้าประจำ (active/loyal)
- `Colors.pending` — รอติดตาม (pending follow-up)
- `Colors.draft` — ลูกค้าใหม่/ยังไม่ทัก (new/inactive)

## กฎ UI สำหรับหน้าจอลูกค้า

- ทุกหน้าจอลูกค้าต้องมีปุ่มลัดโทร/แชทอย่างน้อย icon เดียว (Ionicons: `call`, `chatbubble`)
