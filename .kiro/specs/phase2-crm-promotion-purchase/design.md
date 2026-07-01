# Design — Phase 2: CRM, Promotion & Purchase

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         App.tsx                                    │
│    Platform.web → WebNavigator    Platform.native → MainNavigator │
└──────────────────────────────┬───────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
  ┌─────▼─────┐        ┌──────▼──────┐       ┌──────▼──────┐
  │ M06 CRM   │        │M07 Promotion│       │M08 Purchase │
  │            │        │             │       │             │
  │ Store:     │        │ Store:      │       │ Store:      │
  │ memberStore│        │ promoStore  │       │ purchaseStore│
  │            │        │             │       │             │
  │ Screens:   │        │ Screens:    │       │ Screens:    │
  │ 4 mobile   │        │ 6 mobile    │       │ 4 mobile    │
  │ 1 web      │        │ 1 web       │       │ 1 web       │
  └────────────┘        └─────────────┘       └─────────────┘
```

---

## M06 CRM & Loyalty — Design

### Data Models

```typescript
// src/types/member.ts
interface Member {
  id: string;
  memberNo: string;           // auto-gen: MEM-XXXXXX
  phone: string;              // unique
  name: string;
  birthday?: string;          // ISO date
  level: 'silver' | 'gold' | 'platinum';
  pointBalance: number;
  totalSpent: number;
  joinDate: string;
  isActive: boolean;
  shopId: string;
  branchId: string;
}

interface PointTransaction {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;             // + earn, - redeem/expire
  balanceAfter: number;
  refType: 'sale' | 'manual' | 'system';
  refNo: string;              // sale no หรือ adjust no
  description: string;
  expireDate?: string;
  createdAt: string;
  createdBy: string;
}

interface PointConfig {
  earnRate: number;           // บาท/1 คะแนน (เช่น 25 = ทุก 25 บาท ได้ 1 คะแนน)
  redeemRate: number;         // 1 คะแนน = กี่บาท (เช่น 1 = 1 คะแนน ลด 1 บาท)
  minRedeemPoints: number;    // ขั้นต่ำที่ใช้ได้
  pointExpireDays: number;    // หมดอายุหลังกี่วัน (0=ไม่หมดอายุ)
}
```

### Store: `src/store/memberStore.ts`
```typescript
interface MemberStore {
  members: Member[];
  selectedMember: Member | null;
  pointTransactions: PointTransaction[];
  pointConfig: PointConfig;
  
  // Actions
  searchMembers: (keyword: string) => Member[];
  addMember: (data: Omit<Member, 'id'|'memberNo'|'pointBalance'|'totalSpent'|'joinDate'>) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;
  selectMember: (member: Member | null) => void;
  earnPoints: (memberId: string, saleAmount: number, saleNo: string) => PointTransaction;
  redeemPoints: (memberId: string, points: number, saleNo: string) => PointTransaction;
  getPointHistory: (memberId: string) => PointTransaction[];
}
```

### Screens (Mobile)
| Screen | Path | Component |
|--------|------|-----------|
| รายการสมาชิก | MemberNavigator > MemberListScreen | `src/screens/member/MemberListScreen.tsx` |
| เพิ่มสมาชิก | MemberNavigator > AddMemberScreen | `src/screens/member/AddMemberScreen.tsx` |
| ประวัติคะแนน | MemberNavigator > PointHistoryScreen | `src/screens/member/PointHistoryScreen.tsx` |
| ใช้คะแนน | MemberNavigator > RedeemScreen | `src/screens/member/RedeemScreen.tsx` |

### Screens (Web)
| Screen | Route | Component |
|--------|-------|-----------|
| CRM Hub | `crm` | `src/screens/web/WebCRMScreen.tsx` |

---

## M07 Promotion Engine — Design

### Data Models

```typescript
// src/types/promotion.ts
type PromoType = 'percent' | 'fixed' | 'coupon' | 'member_price' | 'buy_x_get_y' | 'mix_match' | 'happy_hour';
type PromoStatus = 'draft' | 'active' | 'expired' | 'disabled';

interface Promotion {
  id: string;
  promoCode: string;
  name: string;
  description: string;
  type: PromoType;
  status: PromoStatus;
  
  // Conditions
  startDate: string;
  endDate: string;
  startTime?: string;         // HH:mm (Happy Hour)
  endTime?: string;
  minPurchase?: number;
  applicableProducts?: string[];   // product IDs (empty = ทุกสินค้า)
  applicableCategories?: string[];
  applicableLevels?: string[];     // member levels
  
  // Discount
  discountPercent?: number;
  discountAmount?: number;
  maxDiscount?: number;       // cap สำหรับ percent
  
  // Coupon specific
  couponCode?: string;
  couponLimit?: number;       // จำนวนสิทธิ์ทั้งหมด
  couponUsed?: number;
  
  // Buy X Get Y
  buyQty?: number;
  getQty?: number;
  getProductId?: string;
  
  // Stacking
  stackable: boolean;
  priority: number;           // ลำดับการคำนวณ (ต่ำ = คำนวณก่อน)
  
  // Meta
  usageCount: number;
  totalDiscountGiven: number;
  createdAt: string;
  createdBy: string;
  shopId: string;
}

interface CouponUsage {
  id: string;
  promotionId: string;
  couponCode: string;
  memberId?: string;
  saleNo: string;
  discountAmount: number;
  usedAt: string;
}
```

### Store: `src/store/promoStore.ts`
```typescript
interface PromoStore {
  promotions: Promotion[];
  coupons: CouponUsage[];
  
  // Actions
  getActivePromotions: () => Promotion[];
  createPromotion: (data: Omit<Promotion, 'id'|'usageCount'|'totalDiscountGiven'|'createdAt'>) => Promotion;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  disablePromotion: (id: string) => void;
  
  // POS Integration
  calculateDiscount: (cart: CartItem[], member?: Member) => AppliedDiscount[];
  validateCoupon: (code: string, cartTotal: number, member?: Member) => { valid: boolean; promotion?: Promotion; error?: string };
  applyCoupon: (code: string, saleNo: string, memberId?: string) => CouponUsage;
}

interface AppliedDiscount {
  promotionId: string;
  promoName: string;
  type: PromoType;
  discountAmount: number;
  appliedTo: 'bill' | 'item';
  itemId?: string;
}
```

### Screens (Mobile)
| Screen | Component |
|--------|-----------|
| รายการโปรโมชั่น | `src/screens/promotion/PromoListScreen.tsx` |
| สร้างส่วนลด % | `src/screens/promotion/PercentDiscountScreen.tsx` |
| สร้างส่วนลดเงิน | `src/screens/promotion/FixedDiscountScreen.tsx` |
| คูปอง | `src/screens/promotion/CouponScreen.tsx` |
| ราคาสมาชิก | `src/screens/promotion/MemberPriceScreen.tsx` |
| โปรโมชั่นขั้นสูง | `src/screens/promotion/AdvancedPromoScreen.tsx` |

### Screens (Web)
| Route | Component |
|-------|-----------|
| `promotions` | `src/screens/web/WebPromotionScreen.tsx` |

---

## M08 Supplier & Purchase — Design

### Data Models

```typescript
// src/types/purchase.ts
interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;      // '30 days', 'COD'
  isActive: boolean;
  shopId: string;
  createdAt: string;
}

type PRStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted';
type POStatus = 'draft' | 'approved' | 'partial_receive' | 'completed' | 'cancelled';

interface PurchaseRequisition {
  id: string;
  prNo: string;               // auto-gen: PR-YYYYMM-XXXX
  status: PRStatus;
  items: PRItem[];
  reason: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  shopId: string;
  branchId: string;
}

interface PRItem {
  productId: string;
  productName: string;
  productCode: string;
  requestQty: number;
  unit: string;
  currentStock: number;
  minStock: number;
  estimatedCost?: number;
  preferredSupplierId?: string;
}

interface PurchaseOrder {
  id: string;
  poNo: string;               // auto-gen: PO-YYYYMM-XXXX
  status: POStatus;
  supplierId: string;
  supplierName: string;
  prId?: string;              // อ้างอิง PR (ถ้ามี)
  items: POItem[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  deliveryDate: string;
  paymentTerms: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  shopId: string;
  branchId: string;
}

interface POItem {
  productId: string;
  productName: string;
  productCode: string;
  orderQty: number;
  receivedQty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface POReceive {
  id: string;
  receiveNo: string;
  poId: string;
  poNo: string;
  items: POReceiveItem[];
  receivedBy: string;
  receivedAt: string;
  notes?: string;
}

interface POReceiveItem {
  productId: string;
  productName: string;
  receiveQty: number;
  unit: string;
  actualCost: number;
  lotNo?: string;
  expireDate?: string;
}
```

### Store: `src/store/purchaseStore.ts`
```typescript
interface PurchaseStore {
  suppliers: Supplier[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  receives: POReceive[];
  
  // Supplier
  addSupplier: (data: Omit<Supplier, 'id'|'createdAt'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  
  // PR
  createPR: (data: Omit<PurchaseRequisition, 'id'|'prNo'|'requestedAt'>) => PurchaseRequisition;
  approvePR: (id: string, approvedBy: string) => void;
  autoSuggestPR: () => PRItem[];  // สินค้า low stock
  
  // PO
  createPO: (data: Omit<PurchaseOrder, 'id'|'poNo'|'createdAt'>) => PurchaseOrder;
  approvePO: (id: string, approvedBy: string) => void;
  
  // Receive
  receivePO: (poId: string, items: POReceiveItem[], receivedBy: string) => POReceive;
}
```

### Screens (Mobile)
| Screen | Component |
|--------|-----------|
| รายการ Supplier | `src/screens/purchase/SupplierListScreen.tsx` |
| Purchase Requisition | `src/screens/purchase/PRScreen.tsx` |
| Purchase Order | `src/screens/purchase/POScreen.tsx` |
| รับตาม PO | `src/screens/purchase/ReceivePOScreen.tsx` |

### Screens (Web)
| Route | Component |
|-------|-----------|
| `purchase` | `src/screens/web/WebPurchaseScreen.tsx` |

---

## Navigation Changes

### Mobile — MainNavigator
เพิ่ม Tab ใหม่:
```
Tab: Member  → MemberNavigator (4 screens)
Tab: Promo   → PromotionNavigator (6 screens)  
Tab: Purchase → PurchaseNavigator (4 screens)
```
หรือเก็บไว้ใน "เพิ่มเติม" (More) tab

### Web — WebNavigator
เพิ่ม routes: `crm`, `promotions`, `purchase`

### Web — WebSidebar
เพิ่ม NAV_ITEMS:
```typescript
{ route: 'crm',       icon: 'people-circle-outline', label: 'สมาชิก' },
{ route: 'promotions', icon: 'pricetag-outline',     label: 'โปรโมชั่น' },
{ route: 'purchase',   icon: 'cart-outline',          label: 'จัดซื้อ' },
```

---

## File Structure (New Files)

```
src/
├── types/
│   ├── member.ts
│   ├── promotion.ts
│   └── purchase.ts
├── store/
│   ├── memberStore.ts
│   ├── promoStore.ts
│   └── purchaseStore.ts
├── navigation/
│   ├── MemberNavigator.tsx
│   ├── PromotionNavigator.tsx
│   └── PurchaseNavigator.tsx
├── screens/
│   ├── member/
│   │   ├── MemberListScreen.tsx
│   │   ├── AddMemberScreen.tsx
│   │   ├── PointHistoryScreen.tsx
│   │   └── RedeemScreen.tsx
│   ├── promotion/
│   │   ├── PromoListScreen.tsx
│   │   ├── PercentDiscountScreen.tsx
│   │   ├── FixedDiscountScreen.tsx
│   │   ├── CouponScreen.tsx
│   │   ├── MemberPriceScreen.tsx
│   │   └── AdvancedPromoScreen.tsx
│   ├── purchase/
│   │   ├── SupplierListScreen.tsx
│   │   ├── PRScreen.tsx
│   │   ├── POScreen.tsx
│   │   └── ReceivePOScreen.tsx
│   └── web/
│       ├── WebCRMScreen.tsx
│       ├── WebPromotionScreen.tsx
│       └── WebPurchaseScreen.tsx
├── data/
│   ├── mockMembers.ts
│   ├── mockPromotions.ts
│   └── mockPurchase.ts
```
