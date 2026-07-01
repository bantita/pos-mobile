# Requirements Document

## Introduction

ระบบแยกประเภทร้านค้า POS ออกเป็น 3 ประเภท ได้แก่ SERVICE (ร้านบริการ), RETAIL (ร้านค้าปลีก/ค้าส่ง), และ ENTERPRISE (ร้านค้าหลายสาขา) เพื่อให้แต่ละประเภทร้านมี feature set ที่เหมาะสมกับรูปแบบธุรกิจ รวมถึงระบบเลือกช่าง/พนักงานบริการสำหรับร้านประเภทบริการ, ระบบ Service Charge, การจัดการ VAT%, และระบบจัดการสาขา/จุดขายสำหรับร้านขนาดใหญ่

## Glossary

- **Store_Type_Selector**: หน้าจอหรือ UI component ที่ให้ผู้ใช้เลือกประเภทร้านค้า
- **POS_System**: ระบบขายหน้าร้าน (Point of Sale) ที่แสดงสินค้าและประมวลผลการขาย
- **Staff_Popup**: Modal/popup ที่แสดงรายชื่อพนักงานบริการ (ช่าง) ให้เลือกเมื่อเพิ่มสินค้าประเภทบริการลงตะกร้า
- **Cart**: ตะกร้าสินค้าในหน้า POS ที่แสดงรายการสินค้าที่เลือก
- **Product_Manager**: หน้าจอจัดการข้อมูลสินค้า (CRUD)
- **Staff_Manager**: หน้าจอจัดการข้อมูลพนักงาน/ช่าง (CRUD)
- **Branch_Manager**: หน้าจอจัดการสาขาสำหรับร้านประเภท ENTERPRISE
- **Terminal_Manager**: หน้าจอจัดการจุดขาย (POS terminal) ภายในร้านหรือสาขา
- **Bill_Summary**: ส่วนแสดงสรุปยอดรวม ส่วนลด service charge และภาษี ก่อนชำระเงิน
- **Registration_Screen**: หน้าจอสมัครสมาชิก/ลงทะเบียนร้านค้าใหม่
- **Settings_Screen**: หน้าจอตั้งค่าร้านค้า
- **SERVICE**: ประเภทร้านบริการ เช่น ตัดผม สปา
- **RETAIL**: ประเภทร้านค้าปลีก/ค้าส่งทั่วไป มี 1 จุดบริการขึ้นไปภายในร้านเดียว
- **ENTERPRISE**: ประเภทร้านค้าขนาดใหญ่ที่มีหลายสาขา แต่ละสาขามีหลายจุดขาย
- **Service_Product**: สินค้าที่มีประเภทเป็น "บริการ" ซึ่งต้องเลือกช่างเมื่อเพิ่มลงตะกร้า
- **General_Product**: สินค้าทั่วไปที่ไม่ต้องเลือกช่าง
- **Service_Charge**: ค่าบริการเพิ่มเติมที่คิดจากยอดรวม (เป็น % หรือจำนวนเงินคงที่)
- **Technician**: พนักงานบริการ/ช่างที่ให้บริการในร้านประเภท SERVICE

## Requirements

### Requirement 1: Store Type Selection at Registration

**User Story:** ในฐานะเจ้าของร้าน ฉันต้องการเลือกประเภทร้านค้าตั้งแต่ขั้นตอนสมัคร เพื่อให้ระบบแสดง feature ที่เหมาะสมกับธุรกิจของฉัน

#### Acceptance Criteria

1. WHEN a new user registers, THE Registration_Screen SHALL display the Store_Type_Selector with three options: SERVICE, RETAIL, and ENTERPRISE
2. WHEN the user selects a store type, THE Registration_Screen SHALL save the selected store type to the user profile
3. THE Store_Type_Selector SHALL display both a description and an icon together for each store type option to help users choose correctly
4. IF no store type is selected, THEN THE Registration_Screen SHALL prevent the user from completing registration

### Requirement 2: Store Type Configuration in Settings

**User Story:** ในฐานะเจ้าของร้าน ฉันต้องการเปลี่ยนประเภทร้านค้าภายหลังได้ เพื่อให้ปรับระบบตามธุรกิจที่เปลี่ยนแปลง

#### Acceptance Criteria

1. WHEN the owner navigates to the Settings_Screen, THE Settings_Screen SHALL display the current store type with an option to change it
2. WHEN the owner selects a new store type, THE Settings_Screen SHALL update the store configuration and adjust available features accordingly
3. WHILE the user role is not "owner", THE Settings_Screen SHALL hide the store type change option

### Requirement 3: Service Charge Configuration

**User Story:** ในฐานะเจ้าของร้าน ฉันต้องการตั้งค่า service charge เพื่อเรียกเก็บค่าบริการเพิ่มเติมจากลูกค้า

#### Acceptance Criteria

1. THE Settings_Screen SHALL provide a Service_Charge configuration with two modes: percentage and fixed amount
2. WHEN the owner sets a percentage-based Service_Charge, THE Settings_Screen SHALL accept a value between 0 and 100
3. WHEN the owner sets a fixed-amount Service_Charge, THE Settings_Screen SHALL accept a positive numeric value in Thai Baht
4. THE Settings_Screen SHALL allow the owner to enable or disable Service_Charge regardless of store type

### Requirement 4: Service Charge Display in Bill

**User Story:** ในฐานะพนักงานขาย ฉันต้องการเห็น service charge ใน bill summary เพื่อแจ้งลูกค้าก่อนชำระเงิน

#### Acceptance Criteria

1. WHILE Service_Charge is enabled, THE Bill_Summary SHALL display the Service_Charge as a separate line item with label and amount
2. WHEN Service_Charge mode is percentage, THE Bill_Summary SHALL calculate the charge as the configured percentage of the subtotal before tax
3. WHEN Service_Charge mode is fixed amount, THE Bill_Summary SHALL add the configured fixed amount to the total
4. WHILE Service_Charge is disabled, THE Bill_Summary SHALL omit the Service_Charge line item

### Requirement 5: Service Staff Selection Popup

**User Story:** ในฐานะพนักงานขาย ฉันต้องการเลือกช่างผู้ให้บริการเมื่อเพิ่มสินค้าประเภทบริการลงตะกร้า เพื่อบันทึกว่าช่างคนไหนให้บริการ

#### Acceptance Criteria

1. WHEN a Service_Product is tapped on the POS_System, THE POS_System SHALL display the Staff_Popup showing available technicians
2. WHEN the user selects a Technician from the Staff_Popup, THE POS_System SHALL add the Service_Product to the Cart with the selected Technician name displayed
3. WHEN the same Service_Product is tapped again, THE POS_System SHALL always display the Staff_Popup for every addition to allow selecting a different Technician
4. WHEN a second Technician is selected for the same Service_Product, THE Cart SHALL display two separate line items each with the respective Technician name
5. WHEN a General_Product is tapped on the POS_System, THE POS_System SHALL add the product to the Cart without displaying the Staff_Popup

### Requirement 6: Product Type Field

**User Story:** ในฐานะเจ้าของร้าน ฉันต้องการกำหนดประเภทสินค้า (ทั่วไป/บริการ) เพื่อให้ระบบรู้ว่าสินค้าใดต้องเลือกช่าง

#### Acceptance Criteria

1. THE Product_Manager SHALL display a product type field with two options: General_Product and Service_Product
2. WHEN creating a new product, THE Product_Manager SHALL default the product type to General_Product
3. WHEN a product is saved with type Service_Product, THE POS_System SHALL trigger the Staff_Popup when that product is added to the Cart

### Requirement 7: Product VAT Configuration

**User Story:** ในฐานะเจ้าของร้าน ฉันต้องการกำหนด VAT% ของแต่ละสินค้า เพื่อคำนวณภาษีได้ถูกต้อง

#### Acceptance Criteria

1. THE Product_Manager SHALL display a VAT percentage field with preset options: 0%, 7%, and a custom input
2. WHEN the user selects a preset VAT option, THE Product_Manager SHALL set the product VAT rate to the selected value
3. WHEN the user explicitly selects the custom option, THE Product_Manager SHALL allow input of a numeric VAT percentage between 0 and 100
4. THE Bill_Summary SHALL calculate VAT for each Cart item based on the individual product VAT rate

### Requirement 8: Staff/Technician Management

**User Story:** ในฐานะเจ้าของร้านบริการ ฉันต้องการจัดการข้อมูลช่าง/พนักงานบริการ เพื่อให้ระบบแสดงชื่อช่างที่ถูกต้องเมื่อเลือกสินค้าบริการ

#### Acceptance Criteria

1. WHILE the store type is SERVICE, THE Staff_Manager SHALL be accessible from the main navigation
2. THE Staff_Manager SHALL allow creating a new Technician with: name, position, status (available/unavailable), and optional photo
3. THE Staff_Manager SHALL allow editing existing Technician records
4. THE Staff_Manager SHALL allow deleting a Technician record
5. THE Staff_Popup SHALL display only Technicians with status "available"
6. WHEN a Technician's status changes to "unavailable", THE Staff_Popup SHALL exclude that Technician from the selection list

### Requirement 9: Multi-Terminal Management for RETAIL

**User Story:** ในฐานะเจ้าของร้านค้าปลีก ฉันต้องการจัดการจุดขายหลายจุดในร้านเดียว เพื่อรองรับหลายเคาน์เตอร์พร้อมกัน

#### Acceptance Criteria

1. WHILE the store type is RETAIL, THE Terminal_Manager SHALL require at least one active POS terminal and allow creating additional terminals within a single store
2. THE Terminal_Manager SHALL allow naming each terminal (e.g., "จุดขาย 1", "จุดขาย 2")
3. THE Terminal_Manager SHALL display the list of all terminals with their status (active/inactive)
4. WHEN a terminal is created, THE Terminal_Manager SHALL assign a unique identifier to the terminal

### Requirement 10: Multi-Branch and Multi-Terminal Management for ENTERPRISE

**User Story:** ในฐานะเจ้าของธุรกิจหลายสาขา ฉันต้องการจัดการสาขาและจุดขายในแต่ละสาขา เพื่อรองรับการดำเนินงานระดับองค์กร

#### Acceptance Criteria

1. WHILE the store type is ENTERPRISE, THE Branch_Manager SHALL be accessible from the main navigation
2. THE Branch_Manager SHALL allow creating a new branch with: name, address, and contact information
3. THE Branch_Manager SHALL allow editing and deleting existing branches
4. WHEN a branch is selected, THE Terminal_Manager SHALL display terminals belonging to that branch
5. THE Terminal_Manager SHALL allow creating one or more POS terminals within each branch
6. THE Terminal_Manager SHALL assign each terminal a unique identifier scoped to its branch

### Requirement 11: Demo Data for SERVICE Store Type

**User Story:** ในฐานะนักพัฒนา ฉันต้องการ mock data สำหรับร้านบริการ เพื่อทดสอบและ demo ระบบ

#### Acceptance Criteria

1. THE POS_System SHALL include demo data for a SERVICE store type with the name "ร้านตัดผม Demo"
2. THE demo data SHALL include 3 Technician records with distinct names, positions, and statuses
3. THE demo data SHALL include 5 Service_Product records representing hair/spa services
4. THE demo data SHALL include at least 1 General_Product record for testing non-service product behavior

### Requirement 12: Demo Data for RETAIL Store Type

**User Story:** ในฐานะนักพัฒนา ฉันต้องการ mock data สำหรับร้านค้าปลีก เพื่อทดสอบและ demo ระบบ

#### Acceptance Criteria

1. THE POS_System SHALL include demo data for a RETAIL store type with the name "ร้านค้าปลีก Demo"
2. THE demo data SHALL include 2 POS terminal records with distinct names

### Requirement 13: Demo Data for ENTERPRISE Store Type

**User Story:** ในฐานะนักพัฒนา ฉันต้องการ mock data สำหรับร้านค้าหลายสาขา เพื่อทดสอบและ demo ระบบ

#### Acceptance Criteria

1. THE POS_System SHALL include demo data for an ENTERPRISE store type with the name "ร้านค้าใหญ่ Demo"
2. THE demo data SHALL include 3 branch records with distinct names and addresses
3. THE demo data SHALL include exactly 2 POS terminal records per branch (6 terminals total, evenly distributed)
