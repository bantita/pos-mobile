# POS Mobile — Flow Diagrams (draw.io)

เปิดไฟล์ .drawio ได้ที่ [app.diagrams.net](https://app.diagrams.net) หรือ VS Code extension **Draw.io Integration**

---

## ไฟล์ทั้งหมด

| ไฟล์ | หัวข้อ | สี Header |
|---|---|---|
| `01_system_overview.drawio` | ภาพรวมระบบ Platform + Modules + Data Layer | 🔴 Coral |
| `02_user_flow_by_role.drawio` | User Flow แยกตาม 6 Roles | 🌈 Multi-color |
| `03_m03_pos_sale_flow.drawio` | M03 POS Sale + Kiosk Mode Flow | 🔴 Coral |
| `04_m05_inventory_flow.drawio` | M05 Inventory รับ/เบิก/Revision | 🟢 Green |
| `05_m09_reports_flow.drawio` | M09 Reports Listing + Export | 🔴 Coral |
| `06_m10_permission_flow.drawio` | M10 Permission Matrix + Audit Log | ⚫ Dark |
| `07_m11_sync_flow.drawio` | M11 Offline First + Sync + Conflict | 🔵 Blue |
| `08_m01_auth_flow.drawio` | M01 Authentication + Register | 🔴 Coral |

---

## วิธีเปิด

### วิธีที่ 1 — draw.io Online
1. ไปที่ [app.diagrams.net](https://app.diagrams.net)
2. File → Open from → This Device
3. เลือกไฟล์ .drawio

### วิธีที่ 2 — VS Code
1. ติดตั้ง extension: **Draw.io Integration** (hediet.vscode-drawio)
2. Double-click ไฟล์ .drawio ใน VS Code

### วิธีที่ 3 — Desktop App
1. โหลด draw.io Desktop จาก [GitHub Releases](https://github.com/jgraph/drawio-desktop/releases)
2. เปิดไฟล์โดยตรง

---

## Color Scheme (Warm Pastel Theme)

| สี | Hex | ใช้สำหรับ |
|---|---|---|
| 🔴 Coral | `#FF8F8F` | Primary action, Main screens |
| 🟡 Warm Yellow | `#FFF1CB` | Decision diamond, Secondary |
| 🔵 Sky Blue | `#C2E2FA` | Platform, Input methods |
| 🟢 Success | `#D1FAE5` | ผลลัพธ์สำเร็จ, Stock |
| 🟣 Purple | `#EDE9FE` | Permission, Kiosk |
| ⚠️ Warning | `#FEF3C7` | Draft, Pending |
| ❌ Danger | `#FEE2E2` | Error, Cancel, No permission |

---

*สร้างด้วย draw.io XML format | POS Mobile v1.0.0*
