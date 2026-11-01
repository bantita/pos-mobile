# Verification — นำเข้ามาสเตอร์แบบไมเกรต (ตรวจสอบ → ยืนยันอีกครั้ง → ผลลัพธ์)

Branch: `feat/import-migration-review` (worktree `D:\pos-mobile\.worktrees\migrate`, base `main @ 24761d5`)
คำขอ: "เพิ่มส่วนไมเกรตให้แสดงผลก่อน แล้วค่อยกดยืนยันอีกครั้ง"

## สรุป

ทุกมาสเตอร์ (สินค้า หมวดหมู่ แบรนด์ ผู้จำหน่าย) ทั้งเว็บและ mobile นำเข้าแบบเดียวกัน 4 ขั้น:
1 เลือกไฟล์ → 2 ตรวจสอบข้อมูล (ไมเกรต) → 3 ยืนยัน → 4 ผลลัพธ์

- การเทียบข้อมูลอยู่ที่เดียวคือ `buildMigrationPlan` (pure) ใน `src/utils/masterImportExport.ts` ซึ่งเรียก `planImport` เดิม
  ดังนั้นกฎตรวจสอบ, การรวมหน่วยเดิม (partial-file UOM merge), การสร้างมาสเตอร์อัตโนมัติ, variants และ .xlsx/.csv ยังเหมือนเดิมทุกอย่าง
- state ของขั้นตอนอยู่ใน hook เดียว `src/hooks/useMasterMigration.ts` ซึ่งใช้ทั้งเว็บและ mobile
  hook นี้เขียน store ได้ทางเดียวคือ `confirm()` (ปุ่ม ยืนยันนำเข้า ในขั้น 3) ผ่าน `applyMigration(plan, storePorts)` → `applyImport` → audit log 1 รายการ (`auditLogStore.logAction`)
- ก่อนบันทึกจะสร้างแผนใหม่จากไฟล์เดิมเทียบกับข้อมูลล่าสุด ถ้าลายเซ็นของแผน (`migrationSignature`) ต่างจากที่ตรวจสอบ จะไม่บันทึก แต่กลับไปขั้น 2 พร้อมข้อความ "ข้อมูลในระบบมีการเปลี่ยนแปลงระหว่างตรวจสอบ กรุณาตรวจสอบอีกครั้ง"

## ก่อน / หลัง ตามจุดที่ใช้งาน

| จุด | ก่อน | หลัง |
|---|---|---|
| เว็บ สินค้า → แท็บ Import/Export (`WebProductScreen.tsx:2184`) | modal เดียว: ตัวเลข + error 200 ข้อแรก, กดยืนยันแล้วบันทึกทันที | wizard 4 ขั้น (`MasterMigrationWizard` เว็บ) |
| เว็บ มาสเตอร์ → ยี่ห้อ (`WebProductScreen.tsx:1438`) | เหมือนข้างบน | wizard 4 ขั้น |
| เว็บ มาสเตอร์ → หมวดหมู่ (`WebProductScreen.tsx:1558`) | เหมือนข้างบน | wizard 4 ขั้น |
| เว็บ จัดการแบรนด์ (`WebBrandScreen.tsx:59`) | เหมือนข้างบน | wizard 4 ขั้น |
| เว็บ จัดการผู้จำหน่าย (`WebSupplierScreen.tsx:65`) | เหมือนข้างบน | wizard 4 ขั้น |
| mobile `ImportExportScreen` | สินค้าอย่างเดียว, preview 3 ตัวเลข, ยืนยัน inline เฉพาะตอนมี error | เลือกมาสเตอร์ได้ 4 แบบ (chip), StepIndicator, wizard 4 ขั้นแบบ inline ใน Card, ยืนยันขั้น 3 ด้วย `ConfirmModal` |

จุดเว็บทั้ง 5 จุดใช้ `MasterImportExportPanel` ตัวเดิม จึงไม่ต้องแก้ไฟล์หน้าจอเว็บ

## ไฟล์ที่เปลี่ยน

แก้ไข
- `src/utils/masterImportExport.ts`
  - เพิ่ม `RowError.key`, `ErrorBag.key` และ `PlanBase.unchangedItems`
  - เพิ่มส่วน Migration: types, `buildMigrationPlan`, `diffProduct`, `diffFields`, `filterRecords`, `pageRecords`, `canProceed`, `confirmSummaryText`, `migrationSignature`, `applyMigration`, `buildErrorWorkbook`, labels และค่าคงที่
- `src/utils/masterPorts.ts`: `downloadBackup(entity)` (.xlsx) และ `downloadErrorFile(plan)`
- `src/utils/spreadsheetIO.ts`: `exportFileName` รองรับ `'backup'` (`<base>_backup_YYYYMMDD_HHmm.xlsx`) และ `'errors'` (`<base>_import_errors_YYYYMMDD_HHmm.xlsx`)
- `src/components/web/MasterImportExportPanel.tsx`: ใช้ `useMasterMigration` + `MasterMigrationWizard` แทน modal preview เดิม ส่วน export/template/FormatToggle/help/แถบข้อความยังเหมือนเดิม
- `src/screens/product/ImportExportScreen.tsx`: chip เลือกมาสเตอร์, StepIndicator, wizard, `<Alert type="error">`, สถานะกำลังอ่านไฟล์ และ export/template ตามมาสเตอร์ที่เลือก
- `src/components/ui/index.ts`: export Badge, Alert, StepIndicator, ConfirmModal
- `src/utils/__tests__/masterImportExport.test.ts`: ย้าย fixtures ไป `masterFixtures.ts` (ตัว test ไม่เปลี่ยน)
- `src/utils/__tests__/spreadsheetIO.test.ts`: เพิ่ม test ชื่อไฟล์ backup/errors

ไฟล์ใหม่
- `src/hooks/useMasterMigration.ts`
- `src/components/web/MasterMigrationWizard.tsx` (เว็บ, WebColors)
- `src/components/product/MasterMigrationWizard.tsx` (mobile, export `MobileMigrationWizard`, ใช้ tokens + `components/ui`)
- `src/components/ui/Badge.tsx`, `Alert.tsx`, `StepIndicator.tsx` (forwardRef, variant/size) และ `ConfirmModal.tsx`
- `src/utils/__tests__/masterFixtures.ts`, `src/utils/__tests__/masterMigration.test.ts` (20 tests)

## คำสั่งและผลลัพธ์

| คำสั่ง | Baseline | หลังแก้ |
|---|---|---|
| `npm --prefix D:\pos-mobile\.worktrees\migrate run lint` (tsc --noEmit) | 13 errors ใน 6 ไฟล์เดิม | 13 errors ชุดเดิม (BranchSelector 3, DatePicker 4, PermissionMatrix 1, RoleManage 2, WebUserStaff 2, errorTracking 1) ไฟล์ที่แตะไม่มี error |
| `npm --prefix D:\pos-mobile\.worktrees\migrate test` (vitest run) | 135 passed, ไฟล์ 13 ผ่าน / 3 suite โหลดไม่ได้ | 156 passed (0 failed), ไฟล์ 14 ผ่าน / 3 suite โหลดไม่ได้ชุดเดิม (engine.test, SyncService.test, branchPermissionStore.test: `./Libraries/Image/Image`) |
| `npx --prefix D:\pos-mobile\.worktrees\migrate expo export --platform web --output-dir D:\pos-mobile\.worktrees\migrate\.tmp-web-export` | – | สำเร็จ ("App exported to …") ลบโฟลเดอร์ทิ้งแล้ว ไม่ได้แตะ `dist/` |

หมายเหตุ: ถ้าใช้ path ที่ขึ้นต้นด้วย `d:` ตัวเล็ก metro จะขึ้น `SHA-1 … is not computed` (ปัญหาตัวพิมพ์ drive letter ที่รู้กันอยู่แล้ว) ใช้ `D:` แล้วผ่าน

test ใหม่ 21 รายการ (`masterMigration.test.ts` 20 + `spreadsheetIO.test.ts` 1) ครอบคลุม:
- การจัดประเภท เพิ่มใหม่ / อัปเดต / ไม่เปลี่ยน / ข้อผิดพลาด (เลขแถว ข้อความไทย และ key = รหัส)
- export แล้ว import ซ้ำ → ไม่เปลี่ยนทั้งหมด (`unchangedItems.length === products.length`)
- changedFields: ราคาขาย/ราคาทุน, บาร์โค้ด `a|b → a|c`, หมวดหมู่
- หน่วย: เพิ่ม = added, หน่วยที่ไม่มีในไฟล์คงไว้ = same (ไม่ใช่ removed), อัตราส่วน/ราคาที่แก้ = changed
- variants: changed / added / removed และกรณีไม่มีชีต → ว่าง
- diff ของหมวดหมู่ (หมวดหลัก + สถานะ), แบรนด์ (สถานะ), ผู้จำหน่าย (เบอร์โทร) และกรณี unchanged
- `mastersToCreate`: ไม่ซ้ำ และไม่นับสินค้าที่ถูกข้าม
- ก่อนยืนยันต้องไม่มีการเรียก ports เลย และ ctx (deep-frozen) ต้องไม่ถูกแก้
- apply เรียก `addProduct` 1, `updateProduct` 1, `logAction` 1 เท่านั้น และแถวที่ผิดถูกข้าม
- หลัง apply สร้างแผนจากไฟล์เดิมซ้ำแล้วไม่มีอะไรต้องเปลี่ยน
- แบ่งหน้า 1,050 รายการ = 21 หน้า และปรับเลขหน้าที่เกินช่วง
- `canProceed`, `confirmSummaryText` (ตรวจข้อความตรงตัว), ไฟล์ข้อผิดพลาด และ `migrationSignature`

## Walkthrough สำหรับผู้ตรวจ (ทำซ้ำกับทุกมาสเตอร์)

เตรียมไฟล์: กด Export (.xlsx) ของมาสเตอร์นั้น แล้วแก้ในไฟล์
- แก้ 1 รายการ (เช่น ราคาขาย / สถานะ / เบอร์โทร)
- เพิ่ม 1 แถวใหม่
- ใส่ 1 แถวที่ผิด (เช่น ราคาขาย `x`, สถานะ `abc`, หมวดหมู่หลักที่ไม่มีในระบบ)
- ไฟล์สินค้า: เพิ่มหน่วยใหม่ 1 แถว และแก้ราคาในชีต ตัวเลือกสินค้า 1 แถว

| มาสเตอร์ | จุดทดสอบ |
|---|---|
| สินค้า | เว็บ สินค้า → Import/Export → "เลือกไฟล์" และ mobile ImportExportScreen chip "สินค้า" |
| หมวดหมู่ | เว็บ สินค้า → มาสเตอร์ → หมวดหมู่ → "นำเข้า" และ mobile chip "หมวดหมู่" |
| แบรนด์ | เว็บ สินค้า → มาสเตอร์ → ยี่ห้อ, เว็บ จัดการแบรนด์ → "นำเข้า" และ mobile chip "แบรนด์" |
| ผู้จำหน่าย | เว็บ จัดการผู้จำหน่าย → "นำเข้า" และ mobile chip "ผู้จำหน่าย" |

ขั้นตอน:
1. **เลือกไฟล์** → เปิด wizard ที่ขั้น 2 ตรวจสอบข้อมูล (ไมเกรต) แถบขั้นตอนแสดงขั้น 1 เป็นเครื่องหมายถูก และ**ยังไม่มีอะไรถูกบันทึก**
2. **หน้าตรวจสอบ**
   - การ์ดสรุป ทั้งหมด / เพิ่มใหม่ / อัปเดต / ไม่เปลี่ยนแปลง / ข้อผิดพลาด (ข้าม) ต้องตรงกับไฟล์ กดการ์ดเพื่อกรองได้
   - สินค้าที่มีหมวด/แบรนด์/ผู้จำหน่ายใหม่ ต้องมีกล่องม่วง "มาสเตอร์ที่จะสร้างใหม่" แสดงรายชื่อแยกกลุ่ม
   - แท็บกรอง ทั้งหมด / เพิ่มใหม่ / อัปเดต / ไม่เปลี่ยนแปลง / ข้อผิดพลาด ต้องแสดงจำนวนในวงเล็บ แท็บที่ว่างต้องแสดง "ไม่มีข้อมูล" พร้อมไอคอน
   - แถวอัปเดตแสดงเฉพาะฟิลด์ที่เปลี่ยน แบบ `ค่าเดิม (ขีดฆ่า) → ค่าใหม่ (สีแดงเข้ม)`
   - แถวสินค้ากด ˅ แล้วต้องเห็นตาราง หน่วยนับ (หน่วย อัตราส่วน ราคาทุน/ขาย บาร์โค้ด ป้าย เพิ่ม/แก้ไข/เหมือนเดิม) และ ตัวเลือกสินค้า (ตัวเลือก SKU บาร์โค้ด ราคา สต๊อก ป้าย เพิ่ม/แก้ไข/ลบ)
   - แถวข้อผิดพลาดต้องเป็นพื้นแดงอ่อน มีป้าย "จะถูกข้าม" และข้อความ "แถว N: …"
   - ไฟล์ 1,000+ แถวต้องแบ่งหน้า 50 รายการ (ก่อนหน้า / หน้า x/y / ถัดไป)
   - ไฟล์ที่มีแต่แถวผิด หรือไฟล์ export ที่ไม่ได้แก้ ต้องทำให้ "ดำเนินการต่อ" กดไม่ได้ พร้อมข้อความอธิบาย
3. **ดำเนินการต่อ** → กล่องยืนยันแสดง
   - "เพิ่มใหม่ X, อัปเดต Y, ข้าม Z" (สินค้ามี ", สร้างหมวดหมู่/แบรนด์/ผู้จำหน่ายใหม่ N" ต่อท้าย)
   - คำเตือนว่าข้อมูลเดิมจะถูกเขียนทับ
   - ปุ่ม "ดาวน์โหลดข้อมูลสำรองก่อนนำเข้า (.xlsx)" ซึ่งต้องได้ไฟล์ `<base>_backup_YYYYMMDD_HHmm.xlsx` ที่มีข้อมูลปัจจุบัน**ก่อน**นำเข้า
4. **ยืนยันนำเข้า** → ขั้น 4 ผลลัพธ์
   - การ์ด เพิ่มใหม่ / อัปเดต / ไม่เปลี่ยนแปลง / (สร้างมาสเตอร์ใหม่) / ข้าม
   - รายชื่อมาสเตอร์ที่สร้าง
   - รายการที่ถูกข้าม พร้อมปุ่ม "ดาวน์โหลดรายการข้อผิดพลาด (.xlsx)" ซึ่งต้องได้ไฟล์ `<base>_import_errors_…xlsx` คอลัมน์ ชีต / แถว / รหัส/ชื่อ / ข้อความ
   - ปุ่ม "นำเข้าไฟล์ใหม่" และ "เสร็จสิ้น" (เว็บ: หลังปิดต้องมีแถบเขียว "นำเข้า…สำเร็จ" และตารางรีเฟรช)
   - ประวัติการใช้งาน (audit log) ต้องมีรายการ "นำเข้าข้อมูล" **1 รายการ**
5. **ยกเลิกต้องไม่แก้ข้อมูล**
   - ขั้น 2: กด "ย้อนกลับ" / ✕ → กลับไปเลือกไฟล์ ตารางและ audit log ต้องไม่เปลี่ยน
   - ขั้น 3: กด "ยกเลิก" → กลับไปขั้น 2 (รายการเดิม) ข้อมูลไม่เปลี่ยน
   - ระหว่างค้างอยู่ที่ขั้น 2 ถ้าแก้ข้อมูลในอีกแท็บแล้วกดยืนยัน ต้องกลับไปขั้น 2 พร้อมข้อความ "ข้อมูลในระบบมีการเปลี่ยนแปลง…"

## สิ่งที่ยังไม่ได้ตรวจ

- **ยังไม่ได้ดูหน้าจอจริง** (ทั้งเว็บและ mobile): build เว็บผ่าน แต่การไปถึง wizard ต้อง login และเลือกไฟล์ผ่าน file picker ของเบราว์เซอร์ ซึ่ง sandbox นี้ไม่มีเครื่องมือ automation ให้ใช้ (ไม่มี playwright/puppeteer) walkthrough ด้านบนจึงต้องทำด้วยมือ
- ยังไม่ได้ทดสอบ hook `useMasterMigration` และ component แบบ render test (โปรเจกต์ยังไม่มี React test renderer) ส่วนที่ทดสอบอัตโนมัติคือตรรกะ pure ทั้งหมดที่ hook เรียกใช้
- iOS/Android: เลือกไฟล์ได้เฉพาะเว็บเหมือนเดิม (บน native ปุ่มเลือกไฟล์ถูกปิดและมีข้อความแจ้ง)
- ข้อความยืนยันของหมวดหมู่/แบรนด์/ผู้จำหน่ายไม่มีส่วน "สร้างหมวดหมู่/แบรนด์/ผู้จำหน่ายใหม่ N" เพราะการสร้างมาสเตอร์อัตโนมัติเกิดเฉพาะตอนนำเข้าสินค้า (รายการใหม่ของมาสเตอร์นั้นนับรวมใน "เพิ่มใหม่" แล้ว)
- จำนวน "ข้าม" ในหน้าจอนับตามรายการข้อผิดพลาดที่แสดง แต่ audit log ยังใช้ `skippedRecords` ของ `applyImport` เดิม ซึ่งจะต่างกันเฉพาะแถวสินค้าที่ไม่มีรหัสสินค้า (หน้าจอนับ 1 รายการต่อแถว ส่วน log ไม่นับแถวนั้น)
