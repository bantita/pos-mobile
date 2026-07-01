# สรุปการ Implement: Member Promotion Menu Migration

## วันที่: 17 มิถุนายน 2569

---

## ภาพรวม

ปรับโครงสร้างเมนูโปรโมชั่นจาก flat list เป็นระบบ 5 หมวดหมู่ พร้อมสร้างฟอร์มสร้างโปรโมชั่นตามแบบ Zort POS และแก้ไข post-login navigation

---

## ไฟล์ที่สร้างใหม่ (New Files)

### Types
| ไฟล์ | รายละเอียด |
|------|-----------|
| `src/types/productGroupPromo.ts` | Type สำหรับโปรโมชั่นกลุ่มสินค้า (ProductGroupPromotion, ProductGroupItem, FreeProductItem) |
| `src/types/bundlePromo.ts` | Type สำหรับโปรโมชั่นสินค้าร่วม (BundlePromotion, BundleProductItem) |
| `src/types/quantityPromo.ts` | Type สำหรับโปรโมชั่นตามจำนวน (QuantityPromotion, QuantityProductItem, QuantityTier) |
| `src/types/storePromo.ts` | Type สำหรับฟอร์มโปรโมชั่นร้านค้า (StorePromoFormData) |

### Store
| ไฟล์ | รายละเอียด |
|------|-----------|
| `src/store/promoManagementStore.ts` | Zustand store จัดการ CRUD สำหรับ ProductGroup/Bundle/Quantity + getActiveCountByCategory() |

### Utilities
| ไฟล์ | รายละเอียด |
|------|-----------|
| `src/utils/promoValidation.ts` | ฟังก์ชัน validation ทั้งหมด: validateStorePromoForm, validateProductGroupForm, validateBundleForm, validateQuantityForm, validateDiscountValue, detectTierOverlaps, calculateTierPreview |

### Screens — โปรโมชั่น
| ไฟล์ | รายละเอียด |
|------|-----------|
| `src/screens/promotion/PromoCategoriesScreen.tsx` | หน้าเลือก 5 หมวดโปรโมชั่น (initialRoute ใหม่) |
| `src/screens/promotion/StorePromoCreateScreen.tsx` | ฟอร์มสร้างโปรโมชั่นร้านค้า (ตามแบบ Zort POS) |
| `src/screens/promotion/GroupProductPromoListScreen.tsx` | รายการโปรโมชั่นกลุ่มสินค้า |
| `src/screens/promotion/GroupProductPromoCreateScreen.tsx` | ฟอร์มสร้างโปรโมชั่นกลุ่มสินค้า |
| `src/screens/promotion/BundleProductPromoListScreen.tsx` | รายการโปรโมชั่นสินค้าร่วม |
| `src/screens/promotion/BundleProductPromoCreateScreen.tsx` | ฟอร์มสร้างโปรโมชั่นสินค้าร่วม |
| `src/screens/promotion/QuantityPromoListScreen.tsx` | รายการโปรโมชั่นตามจำนวน |
| `src/screens/promotion/QuantityPromoCreateScreen.tsx` | ฟอร์มสร้างโปรโมชั่นจำนวนสินค้า |
| `src/screens/promotion/MemberPromoListScreen.tsx` | รายการโปรโมชั่นสมาชิก 12 ประเภท |

---

## ไฟล์ที่แก้ไข (Modified Files)

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `src/navigation/PromotionNavigator.tsx` | เปลี่ยน initialRoute เป็น PromoCategories + เพิ่ม routes ใหม่ 10 routes |
| `src/navigation/MemberNavigator.tsx` | เพิ่ม `onGoToMemberPromo` prop ที่ cross-navigate ไป Promo tab > MemberPromoList |
| `src/navigation/WebNavigator.tsx` | ยืนยัน onLogin → setRoute('dashboard') (ไม่ใช่ report_sales_main) |
| `src/screens/promotion/PromoListScreen.tsx` | เพิ่ม onBack prop, FAB เปิด type selection modal, filter out member_price, empty state + create button |
| `src/screens/member/PointHistoryScreen.tsx` | เพิ่ม section "โปรโมชั่นที่ใช้ได้" (read-only) + ปุ่มลัด "สร้างโปรโมชั่นสมาชิก" |
| `src/screens/web/WebPromotionScreen.tsx` | เพิ่ม category grid (5 หมวด) + responsive layout + active counts |

---

## โครงสร้างเมนูโปรโมชั่นใหม่

```
โปรโมชั่น (Tab)
└── PromoCategoriesScreen (หน้าหลัก — 5 หมวด)
    ├── ร้านค้า → PromoListScreen (filter, status tabs, create modal)
    │   └── StorePromoCreateScreen
    │   └── PercentDiscount / FixedDiscount / Coupon / MemberPrice / AdvancedPromo
    ├── สมาชิก → MemberPromoListScreen (12 ประเภท, sort by priority)
    │   └── MemberPromoDetail
    ├── กลุ่มสินค้า → GroupProductPromoListScreen (table layout)
    │   └── GroupProductPromoCreateScreen
    ├── สินค้าร่วม → BundleProductPromoListScreen
    │   └── BundleProductPromoCreateScreen
    └── จำนวนสินค้า → QuantityPromoListScreen (table layout)
        └── QuantityPromoCreateScreen (tier table + preview)
```

---

## ฟอร์มสร้างโปรโมชั่น (อ้างอิง Zort POS)

### 1. โปรโมชั่นร้านค้า
- ชื่อ *, วันเริ่ม *, วันสิ้นสุด *, □ ไม่กำหนดวันสิ้นสุด
- ส่วนลด %, ราคาขั้นต่ำ, รายละเอียด, คลังสินค้า/สาขา
- ปุ่ม: เพิ่ม / ยกเลิก

### 2. โปรโมชั่นกลุ่มสินค้า
- ข้อมูลทั่วไป (ชื่อ, วันที่, คลังสินค้า, รายละเอียด)
- เงื่อนไข: เลือกสินค้า (2-200 รายการ, จำนวน, มูลค่า)
- ส่วนลด: ราคารวมขั้นต่ำทั้งบิล (A) + ประเภท (B: ตั้งราคา/ส่วนลด/ส่วนลด%/แถม)
- โปรโมชั่นของแถม (เมื่อเลือก "แถมสินค้า")
- ปุ่ม: บันทึก

### 3. โปรโมชั่นสินค้าร่วม
- เหมือนกลุ่มสินค้า แต่: สินค้าร่วม 2-50 รายการ, คลังสินค้า/สาขา (radio: ทั้งหมด/บางส่วน)
- ลูกค้าเลือกซื้อตัวใดตัวหนึ่งก็ได้โปรโมชั่น
- ปุ่ม: บันทึก

### 4. โปรโมชั่นจำนวนสินค้า
- ข้อมูลทั่วไป + คลังสินค้า/สาขา (radio)
- เลือกสินค้า (รหัส, ชื่อ, ราคาขาย)
- ช่วงราคา (tier table): จำนวนขั้นต่ำ — จำนวนสูงสุด — ส่วนลดต่อหน่วย
- ปุ่ม: + เพิ่ม (tier) / x ลบ / บันทึก
- แสดง preview ส่วนลดอัตโนมัติ

---

## Validation Rules

| ประเภท | เงื่อนไข |
|--------|---------|
| ร้านค้า | ชื่อ required, วันที่ required, ส่วนลด 1-99% |
| กลุ่มสินค้า | สินค้า 2-200, ประเภทส่วนลด required, ขั้นต่ำ 0-999,999.99, แถม 1-10 items qty 1-999 |
| สินค้าร่วม | สินค้า 2-50, เหมือนกลุ่มสินค้า, discount bounds enforced |
| จำนวนสินค้า | สินค้า min 1, tiers 1-10, minQty ≥ 1, maxQty ≤ 9999, discount 0.01-99.99%, no overlap |
| ทั่วไป | noEndDate = true → ไม่ต้อง endDate |

---

## Cross-Navigation

- **CRM → โปรโมชั่น**: PointHistoryScreen มีปุ่มลัด "สร้างโปรโมชั่นสมาชิก" → navigate ข้าม tab ไป Promo > MemberPromoList
- **Post-login**: WebNavigator → setRoute('dashboard') → เข้า Dashboard เป็นหน้าแรก

---

## สิ่งที่ยังเหลือ (Optional)

- [ ] Property-based tests (fast-check) — Properties 1-11
- [ ] Product picker modal จริง (ตอนนี้ใช้ mock products)
- [ ] Date picker component จริง (ตอนนี้ใช้ TextInput)
- [ ] Integration กับ API backend

---

## Tech Stack ที่ใช้

- React Native + Expo
- TypeScript
- @react-navigation/stack
- Zustand (state management)
- Ionicons (icons)
- React Native Web (web back-office)
