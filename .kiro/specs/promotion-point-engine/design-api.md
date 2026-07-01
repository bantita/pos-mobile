# Design: API & Error Model — Promotion + Point Engine

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /promotion-engine/calculate | Calculate all promotions + points for a cart |
| POST | /point-engine/preview-usage | Preview how points would be used |
| POST | /point-engine/apply-usage | Confirm point usage |
| POST | /sales/checkout-preview | Full checkout preview (promotions + points + totals) |
| POST | /sales/commit | Commit sale with all applied promotions and points |
| GET | /members/:id/point-balances | Get member's current point balances |
| POST | /promotions | Create promotion |
| PUT | /promotions/:id | Update promotion |
| GET | /promotions/:id | Get promotion detail |
| GET | /promotions | List promotions |
| POST | /promotions/:id/preview | Preview/simulate promotion against sample cart |

---

## Endpoint Details

### POST /promotion-engine/calculate

**Purpose:** Calculate all applicable promotions and earned points for a given cart.

**Request Body:**
```json
{
  "storeId": "string",
  "memberId": "string | null",
  "businessDateTime": "ISO 8601 string",
  "cartItems": [
    { "sku": "string", "name": "string", "quantity": "number", "unitPrice": "number", "categoryId": "string" }
  ],
  "promotionCandidates": [
    { "promotionId": "string", "type": "string", "priority": "number", "stackable": "boolean", ... }
  ]
}
```

**Response Body:**
```json
{
  "appliedPromotions": [ { "promotionId": "string", "description": "string", "discountAmount": "number", "affectedItems": ["sku"] } ],
  "rejectedPromotions": [ { "promotionId": "string", "reason": "string", "code": "string" } ],
  "earnedPoints": { "total": "number", "breakdown": [ { "promotionId": "string", "points": "number", "reason": "string" } ] },
  "totals": { "subtotal": "number", "totalDiscount": "number", "grandTotal": "number" },
  "traceLog": [ "string" ]
}
```

**Key Validation:**
- `cartItems`: min 1 item, each `quantity > 0`, each `unitPrice >= 0`
- `businessDateTime`: valid ISO 8601 format
- `promotionCandidates`: each must have valid `type`, `priority >= 0`

---

### POST /point-engine/preview-usage

**Purpose:** Preview how a member's points would be applied (before committing).

**Request Body:**
```json
{
  "memberId": "string",
  "storeId": "string",
  "pointsToUse": "number",
  "cartTotal": "number"
}
```

**Response Body:**
```json
{
  "pointsAvailable": "number",
  "pointsToDeduct": "number",
  "monetaryValue": "number",
  "remainingBalance": "number",
  "warnings": [ "string" ]
}
```

**Key Validation:**
- `pointsToUse > 0`
- `memberId` must be a valid member
- Cannot exceed max points per transaction

---

### POST /point-engine/apply-usage

**Purpose:** Confirm and deduct points from a member's balance.

**Request Body:**
```json
{
  "memberId": "string",
  "storeId": "string",
  "saleId": "string",
  "pointsToDeduct": "number",
  "businessDateTime": "ISO 8601 string"
}
```

**Response Body:**
```json
{
  "success": true,
  "newBalance": "number",
  "transactionId": "string"
}
```

**Key Validation:**
- `pointsToDeduct > 0`
- Sufficient point balance (else `INSUFFICIENT_POINTS`)
- Points must not be expired (else `POINTS_EXPIRED`)

---

### POST /sales/checkout-preview

**Purpose:** Full checkout preview combining promotions, point usage, and final totals.

**Request Body:**
```json
{
  "storeId": "string",
  "memberId": "string | null",
  "businessDateTime": "ISO 8601 string",
  "cartItems": [ ... ],
  "pointsToUse": "number | null"
}
```

**Response Body:**
```json
{
  "promotionResults": { ... },
  "pointUsagePreview": { ... },
  "totals": { "subtotal": "number", "promoDiscount": "number", "pointDiscount": "number", "grandTotal": "number" }
}
```

**Key Validation:**
- Same as `/promotion-engine/calculate` for cart items
- Point usage validated against member balance

---

### POST /sales/commit

**Purpose:** Commit a finalized sale with all applied promotions and point transactions.

**Request Body:**
```json
{
  "storeId": "string",
  "memberId": "string | null",
  "businessDateTime": "ISO 8601 string",
  "cartItems": [ ... ],
  "appliedPromotions": [ { "promotionId": "string", "discountAmount": "number" } ],
  "pointsUsed": "number",
  "pointsEarned": "number",
  "paymentMethod": "string",
  "totals": { "subtotal": "number", "totalDiscount": "number", "grandTotal": "number" }
}
```

**Response Body:**
```json
{
  "saleId": "string",
  "receiptNumber": "string",
  "committedAt": "ISO 8601 string",
  "pointTransactionId": "string | null"
}
```

**Key Validation:**
- All cart/promotion/point data must be consistent with a prior preview
- `paymentMethod` must be a valid enum value

---

### GET /members/:id/point-balances

**Purpose:** Get a member's current point balances (available, pending, expired).

**Response Body:**
```json
{
  "memberId": "string",
  "available": "number",
  "pendingEarn": "number",
  "expiringSoon": { "points": "number", "expiresAt": "ISO 8601 string" },
  "totalLifetime": "number"
}
```

**Key Validation:**
- `:id` must be a valid member ID (else `404`)

---

### POST /promotions

**Purpose:** Create a new promotion.

**Request Body:**
```json
{
  "name": "string",
  "type": "discount_percent | discount_fixed | buy_x_get_y | point_multiplier",
  "startDate": "ISO 8601 string",
  "endDate": "ISO 8601 string",
  "priority": "number",
  "stackable": "boolean",
  "conditions": { ... },
  "benefits": { ... }
}
```

**Response Body:**
```json
{
  "promotionId": "string",
  "createdAt": "ISO 8601 string"
}
```

**Key Validation:**
- `startDate <= endDate` (else `INVALID_DATE_RANGE`)
- `priority >= 0`
- `name` required, non-empty
- `type` must be a valid enum value

---

### PUT /promotions/:id

**Purpose:** Update an existing promotion.

**Request/Response:** Same schema as POST, with `updatedAt` in response.

**Key Validation:**
- `:id` must exist (else `PROMOTION_NOT_FOUND`)
- Same validation rules as create

---

### GET /promotions/:id

**Purpose:** Get full promotion detail.

**Response Body:** Full promotion object including conditions, benefits, status, usage stats.

**Key Validation:**
- `:id` must exist (else `PROMOTION_NOT_FOUND`)

---

### GET /promotions

**Purpose:** List promotions with filtering and pagination.

**Query Params:** `?status=active|inactive|expired&page=1&limit=20&type=...`

**Response Body:**
```json
{
  "data": [ ... ],
  "pagination": { "page": "number", "limit": "number", "total": "number" }
}
```

---

### POST /promotions/:id/preview

**Purpose:** Preview/simulate how a promotion would apply to a sample cart.

**Request Body:**
```json
{
  "cartItems": [ ... ],
  "businessDateTime": "ISO 8601 string"
}
```

**Response Body:**
```json
{
  "wouldApply": "boolean",
  "reason": "string",
  "simulatedDiscount": "number",
  "affectedItems": [ "sku" ]
}
```

**Key Validation:**
- `:id` must exist (else `PROMOTION_NOT_FOUND`)
- `cartItems` min 1

---

## Error Model

```typescript
interface EngineError {
  code: string;
  message: string;           // English
  messageLocalized?: string; // Thai
  fieldErrors?: FieldError[];
  traceId?: string;
}

interface FieldError {
  field: string;
  message: string;
  code: string;
}
```

All error responses use HTTP status codes:
- `400` — Validation errors, business rule violations
- `404` — Resource not found
- `409` — Conflict (e.g., promotion stacking conflict)
- `500` — Internal server error

---

## Error Codes

| Code | HTTP | Thai Message | When |
|------|------|-------------|------|
| VALIDATION_FAILED | 400 | ข้อมูลไม่ถูกต้อง | Missing/invalid fields |
| INSUFFICIENT_POINTS | 400 | คะแนนไม่เพียงพอ | Point balance < required |
| BELOW_MINIMUM_POINTS | 400 | คะแนนต่ำกว่าขั้นต่ำ | Below min redemption threshold |
| EXCEEDED_MAX_POINTS | 400 | เกินจำนวนคะแนนสูงสุดต่อบิล | Over max points per transaction |
| POINTS_EXPIRED | 400 | คะแนนหมดอายุ | All relevant points expired |
| PROMOTION_CONFLICT | 409 | โปรโมชั่นขัดกัน | Non-stackable promotion conflict |
| NO_APPLICABLE_PROMOTION | 200 | ไม่มีโปรโมชั่นที่ใช้ได้ | No promo matched (not an error, returned in response body) |
| INVALID_DATE_RANGE | 400 | ช่วงวันที่ไม่ถูกต้อง | endDate before startDate |
| PROMOTION_NOT_FOUND | 404 | ไม่พบโปรโมชั่น | Invalid promotion ID |

---

## Validation Rules (Zod-based)

```typescript
import { z } from 'zod';

// Cart item schema
const CartItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  categoryId: z.string().min(1),
});

// Cart must have at least 1 item
const CartSchema = z.array(CartItemSchema).min(1);

// Promotion candidate schema
const PromotionCandidateSchema = z.object({
  promotionId: z.string().min(1),
  type: z.enum(['discount_percent', 'discount_fixed', 'buy_x_get_y', 'point_multiplier']),
  priority: z.number().int().nonnegative(),
  stackable: z.boolean(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'startDate must be <= endDate',
  path: ['endDate'],
});

// Point usage request
const PointUsageRequestSchema = z.object({
  memberId: z.string().min(1),
  storeId: z.string().min(1),
  pointsToUse: z.number().positive(),
  cartTotal: z.number().nonnegative(),
});

// Redeem request
const RedeemRequestSchema = z.object({
  pointCost: z.number().positive(),
  benefitType: z.enum(['discount', 'free_item', 'voucher']),
});

// Business date time
const BusinessDateTimeSchema = z.string().datetime();

// Calculate request (main endpoint)
const CalculateRequestSchema = z.object({
  storeId: z.string().min(1),
  memberId: z.string().nullable(),
  businessDateTime: BusinessDateTimeSchema,
  cartItems: CartSchema,
  promotionCandidates: z.array(PromotionCandidateSchema).optional(),
});
```

---

## Sample Request/Response

### POST /promotion-engine/calculate

**Request:**
```json
{
  "storeId": "store-001",
  "memberId": "member-2024-0042",
  "businessDateTime": "2024-12-15T14:30:00+07:00",
  "cartItems": [
    { "sku": "SKU-RICE-5KG", "name": "ข้าวหอมมะลิ 5kg", "quantity": 2, "unitPrice": 189.00, "categoryId": "cat-food" },
    { "sku": "SKU-OIL-1L", "name": "น้ำมันพืช 1L", "quantity": 1, "unitPrice": 55.00, "categoryId": "cat-food" },
    { "sku": "SKU-SOAP-3PK", "name": "สบู่แพ็ค 3 ก้อน", "quantity": 3, "unitPrice": 45.00, "categoryId": "cat-personal" }
  ],
  "promotionCandidates": [
    {
      "promotionId": "promo-xmas-2024",
      "type": "discount_percent",
      "priority": 1,
      "stackable": false,
      "startDate": "2024-12-01T00:00:00+07:00",
      "endDate": "2024-12-31T23:59:59+07:00",
      "conditions": { "minCartTotal": 300, "categoryIds": ["cat-food"] },
      "benefits": { "discountPercent": 10, "maxDiscount": 100 }
    },
    {
      "promotionId": "promo-soap-bogo",
      "type": "buy_x_get_y",
      "priority": 2,
      "stackable": true,
      "startDate": "2024-12-10T00:00:00+07:00",
      "endDate": "2024-12-20T23:59:59+07:00",
      "conditions": { "sku": "SKU-SOAP-3PK", "buyQuantity": 2 },
      "benefits": { "freeQuantity": 1, "freeSku": "SKU-SOAP-3PK" }
    }
  ]
}
```

**Response:**
```json
{
  "appliedPromotions": [
    {
      "promotionId": "promo-xmas-2024",
      "description": "Christmas 10% off food (max 100฿)",
      "discountAmount": 43.30,
      "affectedItems": ["SKU-RICE-5KG", "SKU-OIL-1L"]
    }
  ],
  "rejectedPromotions": [
    {
      "promotionId": "promo-soap-bogo",
      "reason": "Condition not met: requires buying 2, cart has 3 but non-stackable conflict with promo-xmas-2024",
      "code": "PROMOTION_CONFLICT"
    }
  ],
  "earnedPoints": {
    "total": 5,
    "breakdown": [
      { "promotionId": null, "points": 4, "reason": "Base earn: 1 point per 100฿ spent" },
      { "promotionId": "promo-xmas-2024", "points": 1, "reason": "Bonus point for using Christmas promo" }
    ]
  },
  "totals": {
    "subtotal": 568.00,
    "totalDiscount": 43.30,
    "grandTotal": 524.70
  },
  "traceLog": [
    "Evaluating promo-xmas-2024 (priority 1): conditions MET — food category total = 433.00 >= 300",
    "Applied promo-xmas-2024: 10% of 433.00 = 43.30 (within max 100)",
    "Evaluating promo-soap-bogo (priority 2): REJECTED — non-stackable conflict with already-applied promo-xmas-2024",
    "Point calculation: base 4 pts (524.70 / 100) + 1 bonus = 5 pts total"
  ]
}
```
