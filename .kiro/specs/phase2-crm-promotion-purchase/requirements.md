# Requirements — Phase 2: CRM, Promotion & Purchase

## Overview
Phase 2 ขยายระบบ POS ด้านลูกค้า โปรโมชั่น และจัดซื้อ ประกอบด้วย 3 โมดูล 14 หน้าจอ

---

## Requirement 1: M06 - โมดูลสมาชิกและคะแนน (CRM & Loyalty)

### Description
จัดการสมาชิก ระบบคะแนน การใช้คะแนน และประวัติ Point Transaction

### Acceptance Criteria
- [ ] SCR-MEM-001: หน้ารายการสมาชิก — ค้นหาด้วยเบอร์โทร ชื่อ หรือ Member No แสดงแต้มคงเหลือและระดับสมาชิก
- [ ] SCR-MEM-002: หน้าเพิ่มสมาชิก — บันทึก Phone, Name, Birthday, Level เริ่มต้น ตรวจเบอร์ซ้ำก่อนบันทึก
- [ ] SCR-MEM-003: หน้าประวัติคะแนน — แสดง Point Transaction ทั้งหมด (Earn/Redeem/Expire) วันที่รับ ใช้ หมดอายุ เลขเอกสารอ้างอิง
- [ ] SCR-MEM-004: หน้าใช้คะแนน — ตรวจคะแนนคงเหลือ เงื่อนไขขั้นต่ำ Redeem Point เป็นส่วนลดผูกกับ Sale
- [ ] ค้นหา/เลือกสมาชิกระหว่างทำรายการขายใน POS ได้
- [ ] ระบบคำนวณคะแนนอัตโนมัติเมื่อชำระเงินสำเร็จ (ตามอัตราที่กำหนด)
- [ ] รองรับหลายระดับสมาชิก (Silver, Gold, Platinum)
- [ ] แสดง Notification เมื่อคะแนนใกล้หมดอายุ
- [ ] ตรวจสิทธิ์ตาม Role ก่อนแสดงปุ่ม Add/Edit/Delete
- [ ] บันทึก Audit Log สำหรับรายการสำคัญ

---

## Requirement 2: M07 - โมดูลโปรโมชั่น (Promotion Engine)

### Description
จัดการโปรโมชั่น ส่วนลด คูปอง ราคาสมาชิก และโปรโมชั่นขั้นสูง

### Acceptance Criteria
- [ ] SCR-PROMO-001: หน้ารายการโปรโมชั่น — แสดงโปรโมชั่นที่ใช้งานอยู่ วันเริ่ม/สิ้นสุด สถานะ ประเภท
- [ ] SCR-PROMO-002: หน้าสร้างส่วนลด % — กำหนดสินค้า/หมวด/ช่วงเวลา/เงื่อนไขขั้นต่ำ และเปอร์เซ็นต์ส่วนลด
- [ ] SCR-PROMO-003: หน้าสร้างส่วนลดจำนวนเงิน — กำหนดยอดซื้อขั้นต่ำ จำนวนเงินลด กลุ่มลูกค้าที่ใช้ได้
- [ ] SCR-PROMO-004: หน้าคูปอง — สร้าง Code จำนวนสิทธิ์ วันหมดอายุ เงื่อนไข ตรวจการใช้ซ้ำ
- [ ] SCR-PROMO-005: หน้าราคาสมาชิก — ตั้งราคาพิเศษตามระดับสมาชิกหรือสินค้าเฉพาะรายการ
- [ ] SCR-PROMO-006: โปรโมชั่นขั้นสูง — Buy X Get Y / Mix & Match / Happy Hour
- [ ] ระบบนำโปรโมชั่นไปคำนวณอัตโนมัติในหน้า POS Sale
- [ ] รองรับ Stacking Rules (ใช้พร้อมกันได้/ไม่ได้)
- [ ] โปรโมชั่นแบบ Scheduled (เปิด/ปิดอัตโนมัติตามเวลา)
- [ ] รายงานประสิทธิภาพโปรโมชั่น (จำนวนครั้งใช้, ยอดลด, ROI)
- [ ] ตรวจสิทธิ์ตาม Role ก่อนแสดงปุ่ม Add/Edit/Delete
- [ ] บันทึก Audit Log สำหรับการสร้าง/แก้ไข/ปิดโปรโมชั่น

---

## Requirement 3: M08 - โมดูล Supplier และจัดซื้อ (Supplier & Purchase)

### Description
จัดการ Supplier, Purchase Requisition, Purchase Order และการรับสินค้าตาม PO

### Acceptance Criteria
- [ ] SCR-SUP-001: หน้ารายการ Supplier — ค้นหา เพิ่ม แก้ไข ปิดใช้งาน Supplier พร้อมข้อมูล Tax ID, Phone, Email
- [ ] SCR-PO-001: หน้า Purchase Requisition — สร้างใบขอซื้อจากสินค้าใกล้หมดหรือกรอกเอง ส่งอนุมัติก่อนเปิด PO
- [ ] SCR-PO-002: หน้า Purchase Order — เลือก Supplier รายการสินค้า จำนวน ราคา วันส่งของ สถานะ Draft/Approved/Partial/Completed
- [ ] SCR-PO-003: หน้ารับตาม PO — ดึง PO มารับจริง รองรับรับบางส่วน ปิด PO เมื่อรับครบ
- [ ] Workflow: PR → Approve → PO → Receive → Stock Update
- [ ] Auto-suggest PR จากสินค้า Low Stock (ต่ำกว่า Min Stock)
- [ ] รองรับหลาย Supplier ต่อสินค้า (Preferred/Alternate)
- [ ] ตรวจราคาทุน (Cost) เมื่อรับสินค้า เปรียบเทียบกับ PO
- [ ] พิมพ์ PO ส่ง Supplier (PDF)
- [ ] ตรวจสิทธิ์ตาม Role ก่อนแสดงปุ่ม Add/Edit/Delete/Approve
- [ ] บันทึก Audit Log สำหรับรายการสำคัญ

---

## Actors

| Role | สิทธิ์ใน Phase 2 |
|------|------------------|
| Owner | ทุก Module — View/Add/Edit/Delete/Approve |
| Manager | CRM, Promotion, Purchase — View/Add/Edit/Approve บางรายการ |
| Cashier | CRM — ค้นหาสมาชิก/ใช้คะแนน ระหว่างขาย |
| Stock Staff | Purchase — สร้าง PR, รับสินค้าตาม PO |
| Report Viewer | View รายงานโปรโมชั่น/สมาชิก |

---

## Technical Constraints
- ใช้ React Native + Expo (mobile) และ React Native Web (web back-office)
- รองรับ Offline First — CRM data cache ใน SQLite, Sync เมื่อ Online
- State management: Zustand
- Form validation: react-hook-form + zod
- Navigation: @react-navigation/stack (mobile), state-based routing (web)
- Export: Excel (TSV+BOM), PDF (window.print / expo-print)
- Theme: WebColors (Soft Red #E57373, Dark Sidebar #424242)
