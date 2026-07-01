# วิธีเอาขึ้น Server ให้คนอื่นเทส

## TL;DR
```bash
# 1. Build web version
npx expo export:web

# 2. เปิด server ด้วย serve (ใช้เครื่องเราเป็น server)
npx serve dist --listen 0.0.0.0:8080

# 3. แจก URL ให้ทีม
# http://<IP เครื่องเรา>:8080
```

---

## วิธีที่ 1: ใช้เครื่องเราเป็น Server (LAN — ง่ายที่สุด)

### ขั้นตอน

1. **Build web version**
```bash
npx expo export:web
```
สร้างโฟลเดอร์ `dist/` ที่มีไฟล์ HTML/JS/CSS พร้อมใช้

2. **หา IP เครื่องเรา**
```bash
# Windows
ipconfig
# ดู IPv4 Address เช่น 192.168.1.100

# Mac/Linux
ifconfig | grep "inet "
```

3. **เปิด server**
```bash
# ติดตั้ง serve (ครั้งแรกครั้งเดียว)
npm install -g serve

# เปิด server
serve dist --listen 0.0.0.0:8080
```

4. **แจก URL ให้ทีม**
```
http://192.168.1.100:8080
```
ทุกคนใน LAN เดียวกันเปิดได้เลย

### ข้อมูลการทดสอบ
- **แต่ละ browser เก็บข้อมูลแยกกัน** (localStorage)
- คน A เทสที่เครื่อง A → ปิด → เปิดมาใหม่ → ข้อมูลยังอยู่
- คน B เทสที่เครื่อง B → เห็นเฉพาะผลของตัวเอง
- **ไม่ต้องมี database** — ทุกอย่างอยู่ใน browser

---

## วิธีที่ 2: ใช้ Expo Dev Server (Development Mode)

```bash
# เปิด Expo web dev server ให้คนอื่นเข้าได้
npx expo start --web --host lan
```
จะได้ URL เช่น `http://192.168.1.100:8081`

**ข้อดี**: Hot reload, เห็นการเปลี่ยนแปลงทันที
**ข้อเสีย**: ช้ากว่า build, ต้องเปิด terminal ตลอด

---

## วิธีที่ 3: ใช้ ngrok (ให้คนนอก LAN เข้าได้)

ถ้าทีมอยู่คนละที่ ไม่ได้อยู่ LAN เดียวกัน:

```bash
# 1. Build + เปิด local server
npx expo export:web
serve dist --listen 0.0.0.0:8080

# 2. เปิด tunnel ด้วย ngrok
npx ngrok http 8080
```
จะได้ URL เช่น `https://abc123.ngrok-free.app` — แจกให้ใครก็ได้เข้าผ่าน internet

---

## วิธีที่ 4: Deploy ถาวร (Vercel / Netlify)

```bash
# Vercel (ฟรี)
npm install -g vercel
npx expo export:web
cd dist && vercel --prod

# หรือ Netlify
npm install -g netlify-cli
npx expo export:web
netlify deploy --dir=dist --prod
```
ได้ URL ถาวร เช่น `https://xcellence-pos.vercel.app`

---

## สรุปแต่ละวิธี

| วิธี | เข้าถึง | ข้อดี | ข้อเสีย |
|------|---------|-------|---------|
| LAN (serve) | เฉพาะ LAN | ง่าย, เร็ว | ต้องอยู่ WiFi เดียวกัน |
| Expo dev | เฉพาะ LAN | Hot reload | ช้า, dev mode |
| ngrok | ทุกที่ | ฟรี tunnel | URL เปลี่ยนทุกครั้ง (free plan) |
| Vercel/Netlify | ทุกที่ | URL ถาวร, ฟรี | ต้อง deploy ใหม่ทุกครั้ง |

---

## ข้อมูลการทดสอบ — ทำไมเก็บแยกแต่ละเครื่อง?

### หลักการ
- ใช้ **localStorage** (Zustand persist) — ข้อมูลอยู่ใน browser ของแต่ละคน
- **ปิด browser → เปิดมาใหม่ → ข้อมูลยังอยู่** (persist)
- **แต่ละคนเห็นเฉพาะผลของตัวเอง** — ไม่ปนกัน
- **ไม่ต้องมี backend/database** สำหรับเก็บผลทดสอบ

### Flow การทดสอบ
```
ทีม QA 3 คน

คน A (Chrome เครื่อง A):
  → เปิด http://192.168.1.100:8080
  → ไปที่ ตั้งค่า > Test Tracker
  → สร้าง Test Run "UAT Sprint 5 - คน A"
  → ทดสอบ TST-001 → ผ่าน ✓
  → ทดสอบ TST-010 → ไม่ผ่าน ✗ (note: "คำนวณทอนผิด")
  → ปิด browser
  → วันรุ่งขึ้นเปิดมาใหม่ → ข้อมูลยังอยู่ครบ ✓

คน B (Chrome เครื่อง B):
  → เปิด URL เดียวกัน
  → สร้าง Test Run "UAT Sprint 5 - คน B"
  → เห็นเฉพาะผลของตัวเอง
  → ทดสอบ module CRM ทั้งหมด

คน C (Safari iPad):
  → เปิด URL เดียวกัน
  → ทดสอบ module POS บน tablet
```

---

## คำสั่ง Quick Start

```bash
# ทำทั้งหมดใน 1 คำสั่ง (Windows)
npx expo export:web && npx serve dist --listen 0.0.0.0:8080

# ดู IP เครื่อง (Windows)
ipconfig | findstr "IPv4"

# ดู IP เครื่อง (Mac)
ifconfig | grep "inet " | grep -v 127.0.0.1
```

แล้วแจก URL: `http://<IP>:8080` ให้ทีม

---

## Firewall Note (Windows)

ถ้าคนอื่นเข้าไม่ได้ ต้องเปิด port:
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="POS Test Server" dir=in action=allow protocol=tcp localport=8080
```
