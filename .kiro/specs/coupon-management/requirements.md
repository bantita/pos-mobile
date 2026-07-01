# Requirements Document

## Introduction

ระบบจัดการคูปองสำหรับ POS Mobile App ครอบคลุมการสร้าง/จัดการ campaign คูปอง, การ generate รหัสคูปองอัตโนมัติ, การ import/export คูปอง, และการรองรับคูปองที่ POS checkout ผ่าน promotion engine ที่มีอยู่ ระบบนี้จะขยายจาก `CouponScreen` ที่มีอยู่ให้รองรับ workflow แบบ ERP (batch generation, limit controls, status tracking)

## Glossary

- **Coupon_Manager**: หน้าจอจัดการ campaign คูปอง (CRUD) ภายใน POS Mobile App
- **Coupon_Generator**: module ที่สร้างรหัสคูปองอัตโนมัติตาม prefix + random pattern
- **Coupon_Importer**: module ที่รับไฟล์ CSV/Excel เพื่อ import/migrate คูปองจากระบบเดิม
- **Coupon_Exporter**: module ที่ export รายการคูปองเป็น CSV/Excel
- **Coupon_Engine_Evaluator**: condition evaluator ใน promotion engine ที่ตรวจสอบความถูกต้องของคูปอง
- **POS_Checkout**: หน้าจอขายสินค้าที่แคชเชียร์สแกน/กรอกรหัสคูปอง
- **Coupon_Campaign**: กลุ่มคูปองที่ผูกกับโปรโมชั่นเดียวกัน มี prefix, จำนวน, เงื่อนไข limit ร่วมกัน
- **Coupon_Code**: รหัสคูปองเฉพาะ (unique) ที่ลูกค้าใช้เพื่อรับสิทธิ์
- **Coupon_Status**: สถานะของคูปอง ได้แก่ ACTIVE (ขาย/แจก), USED (ใช้แล้ว), EXPIRED (หมดอายุ), CANCELLED (ยกเลิก)
- **Limit_Control**: กฎควบคุมการใช้คูปอง เช่น จำนวนครั้งทั้งหมด, ต่อบิล, ต่อลูกค้า, ต่อกลุ่มลูกค้า

## Requirements

### Requirement 1: Coupon Campaign Management (CRUD)

**User Story:** As a store admin, I want to create, view, edit, and delete coupon campaigns, so that I can manage promotional coupons for my store.

#### Acceptance Criteria

1. THE Coupon_Manager SHALL display a list of all Coupon_Campaigns with campaign name, promotion reference, coupon count, active count, used count, and expiry date
2. WHEN a store admin creates a new Coupon_Campaign, THE Coupon_Manager SHALL require campaign name, linked promotion, coupon prefix, coupon quantity, expiry date, and Limit_Control settings
3. WHEN a store admin edits an existing Coupon_Campaign, THE Coupon_Manager SHALL allow modification of campaign name, expiry date, and Limit_Control settings
4. WHEN a store admin views a Coupon_Campaign, THE Coupon_Manager SHALL display all individual Coupon_Codes with their Coupon_Status, usage date, and associated bill number
5. WHEN a store admin deletes a Coupon_Campaign that has no USED coupons, THE Coupon_Manager SHALL remove the campaign and all associated Coupon_Codes
6. IF a store admin attempts to delete a Coupon_Campaign that has USED coupons, THEN THE Coupon_Manager SHALL reject the deletion and display a message indicating used coupons exist

### Requirement 2: Coupon Code Generation

**User Story:** As a store admin, I want the system to auto-generate unique coupon codes, so that I can quickly create large batches of coupons without manual entry.

#### Acceptance Criteria

1. WHEN a store admin specifies a prefix and quantity, THE Coupon_Generator SHALL generate the specified number of unique Coupon_Codes using the format `{PREFIX}{8-character-alphanumeric-random}`
2. THE Coupon_Generator SHALL ensure all generated Coupon_Codes are unique across all existing campaigns in the system
3. WHEN the Coupon_Generator creates new codes, THE Coupon_Generator SHALL assign each code an initial Coupon_Status of ACTIVE
4. IF the Coupon_Generator detects a collision with an existing code, THEN THE Coupon_Generator SHALL regenerate the colliding code until uniqueness is achieved
5. THE Coupon_Generator SHALL support batch sizes from 1 to 10,000 codes per generation request

### Requirement 3: Coupon Import and Migration

**User Story:** As a store admin, I want to import coupon codes from an external system or CSV/Excel file, so that I can migrate existing coupons from ERP without re-creating them manually.

#### Acceptance Criteria

1. WHEN a store admin uploads a CSV file, THE Coupon_Importer SHALL parse and validate each row containing coupon code, status, expiry date, and optional usage metadata
2. WHEN a store admin uploads an Excel (.xlsx) file, THE Coupon_Importer SHALL parse and validate each row with the same fields as CSV import
3. THE Coupon_Importer SHALL validate that imported coupon codes do not duplicate existing codes in the system
4. IF the Coupon_Importer encounters invalid rows, THEN THE Coupon_Importer SHALL report all validation errors with row numbers and skip only the invalid rows
5. WHEN import is successful, THE Coupon_Importer SHALL display a summary showing total imported, skipped, and error counts
6. THE Coupon_Importer SHALL map imported status values to the Coupon_Status enum (ขาย/แจก → ACTIVE, ใช้แล้ว → USED, หมดอายุ → EXPIRED, ยกเลิก → CANCELLED)

### Requirement 4: Coupon Export

**User Story:** As a store admin, I want to export coupon data to CSV or Excel, so that I can share coupon lists with other systems or for record-keeping.

#### Acceptance Criteria

1. WHEN a store admin requests an export, THE Coupon_Exporter SHALL generate a file containing coupon code, campaign name, status, expiry date, usage date, bill number, and customer reference
2. THE Coupon_Exporter SHALL support export in CSV format
3. THE Coupon_Exporter SHALL support export in Excel (.xlsx) format
4. WHEN a store admin applies filters (by campaign, status, or date range), THE Coupon_Exporter SHALL export only the filtered subset of coupons
5. THE Coupon_Exporter SHALL include a header row with column names in the exported file

### Requirement 5: POS Checkout Coupon Redemption

**User Story:** As a cashier, I want to scan or enter a coupon code during checkout, so that customers can redeem their coupons for discounts.

#### Acceptance Criteria

1. WHEN a cashier scans or enters a Coupon_Code at POS_Checkout, THE POS_Checkout SHALL send the code to the Coupon_Engine_Evaluator for validation
2. WHEN the Coupon_Engine_Evaluator receives a valid ACTIVE coupon code, THE Coupon_Engine_Evaluator SHALL return the linked promotion benefits to POS_Checkout
3. WHEN a valid coupon is applied, THE POS_Checkout SHALL display the promotion name, discount value, and updated bill total
4. IF the Coupon_Engine_Evaluator receives an EXPIRED coupon code, THEN THE POS_Checkout SHALL display a message indicating the coupon has expired
5. IF the Coupon_Engine_Evaluator receives a USED coupon code, THEN THE POS_Checkout SHALL display a message indicating the coupon has already been used
6. IF the Coupon_Engine_Evaluator receives a coupon code that does not exist, THEN THE POS_Checkout SHALL display a message indicating the coupon is invalid
7. WHEN a transaction is completed with a coupon applied, THE POS_Checkout SHALL update the Coupon_Status to USED and record the bill number and usage date

### Requirement 6: Coupon Status Lifecycle

**User Story:** As a store admin, I want coupons to have clear status tracking, so that I can monitor usage and prevent double-redemption.

#### Acceptance Criteria

1. THE Coupon_Manager SHALL support four statuses: ACTIVE (ขาย/แจก), USED (ใช้แล้ว), EXPIRED (หมดอายุ), CANCELLED (ยกเลิก)
2. WHEN a coupon is redeemed at POS_Checkout, THE Coupon_Manager SHALL transition the Coupon_Status from ACTIVE to USED
3. WHEN the current date exceeds the coupon expiry date, THE Coupon_Manager SHALL transition the Coupon_Status from ACTIVE to EXPIRED
4. WHEN a store admin manually cancels a coupon, THE Coupon_Manager SHALL transition the Coupon_Status from ACTIVE to CANCELLED
5. IF a Coupon_Status is USED, EXPIRED, or CANCELLED, THEN THE Coupon_Manager SHALL prevent any further status transitions for that coupon
6. THE Coupon_Manager SHALL record the timestamp and actor for each status transition

### Requirement 7: Limit Controls

**User Story:** As a store admin, I want to set usage limits on coupons, so that I can control redemption frequency per bill, per customer, and per customer group.

#### Acceptance Criteria

1. WHEN a store admin configures a Coupon_Campaign, THE Coupon_Manager SHALL allow setting a total usage limit (จำนวนครั้งทั้งหมด) for the entire campaign
2. WHEN a store admin configures a Coupon_Campaign, THE Coupon_Manager SHALL allow setting a per-bill limit (จำกัดต่อบิล) specifying max coupons from this campaign per transaction
3. WHEN a store admin configures a Coupon_Campaign, THE Coupon_Manager SHALL allow setting a per-customer limit (จำกัดต่อลูกค้า) specifying max redemptions per member
4. WHEN a store admin configures a Coupon_Campaign, THE Coupon_Manager SHALL allow setting a per-customer-group limit (จำกัดต่อกลุ่มลูกค้า) specifying allowed customer groups
5. WHEN the Coupon_Engine_Evaluator validates a coupon, THE Coupon_Engine_Evaluator SHALL check all applicable Limit_Control rules and reject the coupon if any limit is exceeded
6. IF a limit is exceeded during validation, THEN THE Coupon_Engine_Evaluator SHALL return a specific error indicating which limit was exceeded

### Requirement 8: Promotion Engine Integration

**User Story:** As a developer, I want a coupon condition evaluator integrated into the existing promotion engine, so that coupons leverage the same benefit calculation pipeline as other promotions.

#### Acceptance Criteria

1. THE Coupon_Engine_Evaluator SHALL implement the ConditionEvaluator interface from the existing promotion engine registry
2. WHEN the Coupon_Engine_Evaluator receives a condition of type "coupon", THE Coupon_Engine_Evaluator SHALL validate the coupon code exists, is ACTIVE, is not expired, and passes all Limit_Control checks
3. THE Coupon_Engine_Evaluator SHALL integrate with the existing ConditionRegistry so that promotion configs with condition type "coupon" are routed to the coupon evaluator
4. WHEN a coupon condition passes validation, THE Coupon_Engine_Evaluator SHALL return a successful ConditionResult with the matched cart items (based on the linked promotion's product conditions)
5. THE Coupon_Engine_Evaluator SHALL support all existing benefit types (percentDiscount, amountDiscount, billDiscount, perUnitDiscount, freeGift) through the linked promotion configuration
6. WHEN a coupon-based promotion is evaluated, THE Coupon_Engine_Evaluator SHALL participate in the existing conflict resolution and stacking logic without modification to the resolver
