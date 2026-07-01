# Xcellence ERP POS — Deploy & วิธีดึง Test Log

## Part 1: Deploy ขึ้น Vercel (ฟรี, ปิดคอมได้)

### ขั้นตอน (ทำครั้งเดียว)

```bash
# 1. Login Vercel (เปิด browser ให้ login)
vercel login

# 2. Build web version
npx expo export --platform web

# 3. Deploy
cd dist
vercel --prod

# หรือทำทีเดียว:
npx expo export --platform web && cd dist && vercel --prod
```

### ผลลัพธ์
- ได้ URL ถาวร เช่น `https://xcellence-pos.vercel.app`
- ปิดคอมได้เลย — website ยังเปิดได้ 24/7
- ทุกคนเข้าได้จากทุกที่ (มี internet)

### Deploy ใหม่ (เมื่อแก้ code)
```bash
npx expo export --platform web && cd dist && vercel --prod
```

### ทางเลือก: Netlify (ไม่ต้อง login ผ่าน terminal)
1. ไปที่ https://app.netlify.com/drop
2. ลากโฟลเดอร์ `dist/` ไปวาง
3. ได้ URL ทันที

---

## Part 2: วิธีดึง Test Log (ผลการทดสอบ)

### ข้อมูลอยู่ที่ไหน?
- ผลทดสอบเก็บใน **localStorage** ของ browser แต่ละคน
- Key: `pos-test-tracker`

---

### วิธีที่ 1: กดปุ่ม "ส่งผลให้ Admin" (แนะนำ)

**Tester ทำ:**
1. เปิดเว็บ → ตั้งค่า → Test Tracker
2. หาชื่อ Test Run ที่ทดสอบเสร็จแล้ว
3. กดปุ่ม **"📤 ส่งผลให้ Admin"**
4. JSON จะถูก copy ไปที่ clipboard
5. ส่ง JSON ให้ Admin (LINE / Slack / Email / Google Sheet)

**Admin ทำ:**
1. เปิดเว็บ → ตั้งค่า → Test Tracker
2. เลื่อนลงด้านล่าง → "Admin: ดูผลทดสอบจากทีม"
3. กด **"นำเข้า"**
4. วาง JSON ที่ได้รับ → กด **"นำเข้า"**
5. เห็นสรุป: % ผ่าน, อะไร fail, note ของ tester

---

### วิธีที่ 2: Export จาก Browser Console (ดึงข้อมูลดิบ)

เปิด browser ของ Tester → กด F12 → Console → พิมพ์:

```javascript
// ดึงผลทดสอบทั้งหมด
const data = JSON.parse(localStorage.getItem('pos-test-tracker'));
console.log(data);

// Copy ไปที่ clipboard
copy(JSON.stringify(data, null, 2));
// แล้ว paste ใน Notepad / Google Docs
```

---

### วิธีที่ 3: Export เป็นไฟล์ .json (Download)

เปิด Console (F12) → พิมพ์:

```javascript
const data = localStorage.getItem('pos-test-tracker');
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'test-results.json';
a.click();
```

จะ download ไฟล์ `test-results.json` ที่มีผลทดสอบทั้งหมด

---

### วิธีที่ 4: Export เป็น Excel (สวย)

เปิด Console (F12) → พิมพ์:

```javascript
const store = JSON.parse(localStorage.getItem('pos-test-tracker'));
const runs = store?.state?.runs || [];

// สร้าง HTML Table
let html = '<table border="1"><tr><th>Test Run</th><th>Tester</th><th>Test ID</th><th>Module</th><th>Title</th><th>Status</th><th>Note</th><th>Tested At</th></tr>';
runs.forEach(run => {
  run.results.forEach(t => {
    html += `<tr><td>${run.name}</td><td>${run.tester}</td><td>${t.id}</td><td>${t.module}</td><td>${t.title}</td><td>${t.status}</td><td>${t.note||''}</td><td>${t.testedAt||''}</td></tr>`;
  });
});
html += '</table>';

const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'test-results.xls';
a.click();
```

จะ download ไฟล์ `test-results.xls` ที่ Excel เปิดเป็นตารางสวย

---

## Part 3: โครงสร้างข้อมูล Test Log

```json
{
  "state": {
    "runs": [
      {
        "id": "run_1719050400000",
        "name": "UAT Sprint 5",
        "tester": "สมชาย",
        "startedAt": "2026-06-22T10:00:00.000Z",
        "completedAt": "2026-06-22T12:30:00.000Z",
        "status": "completed",
        "results": [
          {
            "id": "TST-001",
            "module": "Auth",
            "title": "สมัครร้านค้าใหม่",
            "status": "pass",
            "note": "",
            "testedAt": "2026-06-22T10:05:00.000Z"
          },
          {
            "id": "TST-010",
            "module": "POS",
            "title": "ขายสินค้าปกติ",
            "status": "fail",
            "note": "คำนวณทอนผิด กรณีส่วนลด",
            "testedAt": "2026-06-22T10:15:00.000Z"
          }
        ]
      }
    ],
    "sharedRuns": []
  }
}
```

---

## Part 4: Flow การทดสอบแบบทีม

```
┌─────────────────────────────────────────────────────┐
│                    ADMIN                             │
│  1. Deploy ขึ้น Vercel                              │
│  2. แจก URL ให้ทีม                                  │
│  3. รอรับ JSON ผลทดสอบจาก Tester                    │
│  4. นำเข้า → ดูสรุปรวม                              │
└─────────────────────────────────────────────────────┘
        ▲ ส่ง JSON กลับ
        │
┌───────┴─────────────────────────────────────────────┐
│              TESTER (แต่ละคน)                        │
│  1. เปิด URL                                        │
│  2. ตั้งค่า → Test Tracker → สร้าง Test Run         │
│  3. ทดสอบแต่ละ case → กด ✓/✗/—                     │
│  4. เสร็จ → กด "ส่งผลให้ Admin"                     │
│  5. ส่ง JSON ให้ Admin (LINE/Slack)                  │
│                                                     │
│  ⚡ ข้อมูลอยู่ใน browser ตัวเอง                     │
│  ⚡ ปิดเปิดใหม่ข้อมูลยังอยู่                       │
│  ⚡ ใช้งาน Offline ได้                              │
└─────────────────────────────────────────────────────┘
```

---

## สรุปคำสั่งที่ใช้บ่อย

```bash
# Build
npx expo export --platform web

# Deploy Vercel
cd dist && vercel --prod

# เปิด local server (ใน LAN)
serve dist -l tcp://0.0.0.0:8080 --single

# เปิด tunnel (นอก LAN)
lt --port 8080 --subdomain xcellence-pos
```
