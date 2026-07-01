# Design: Testing Strategy — Promotion + Point Engine

## Correctness Properties

| # | Property | Description |
|---|----------|-------------|
| 1 | Determinism | same input → same output |
| 2 | Non-negative payable | finalPayable >= 0 |
| 3 | Discount bounded | total discounts <= subtotal |
| 4 | Point conservation | points used <= non-expired balance |
| 5 | Earn timing | earned based on post-discount subtotal |
| 6 | Stacking integrity | NO_STACK = only 1 promo applied |
| 7 | Pipeline ordering | audit steps monotonically increasing |
| 8 | Quantity operators | EVERY repeats, RANGE bounds, MORE_THAN threshold |
| 9 | Condition conjunction | all conditions must pass (AND) |
| 10 | Excluded products | no discount on excluded items |
| 11 | Inactive filtered | expired/inactive never applied |
| 12 | Conflict resolution | correct strategy applied |
| 13 | Manual mode | no auto point usage without explicit request |
| 14 | Audit completeness | every candidate has audit entry |
| 15 | Empty promotions | no changes to totals |

---

## Test Strategy

| Level | Scope | Tool |
|-------|-------|------|
| Property-based | 15 properties above | fast-check |
| Unit | Each evaluator/calculator | vitest |
| Integration | Full pipeline flows | vitest |
| Performance | 100 items × 50 promos < 50ms | vitest bench |

---

## Test Scenarios (Key)

### Promotion

- ซื้อครบ 2500 ลด 250 (MORE_THAN amount discount)
- ซื้อ 2 แถม 1 (EVERY product + free gift)
- Happy Hour 17:00-19:00 ลด 10% (time + percent discount)
- ลดเฉพาะกลุ่มสินค้า (product group + amount discount)

### Points

- สมาชิกซื้อครบ 3000 ได้ Cashback 100 คะแนน (earn)
- ใช้ 100 Member Point แลกส่วนลด 50 บาท (redeem)
- ใช้ Cashback + Member Point ชำระ 200 บาท (multi-type payment)
- คะแนนหมดอายุไม่ให้ใช้ (expired rejection)

### Conflict

- 2 โปรมา NO_STACK → highest priority wins
- STACK_ALLOWED + STACK_ALLOWED → both apply
- SELECTIVE_STACK → only compatible ones apply

### Edge Cases

- Empty cart → empty result
- All promos expired → no benefits
- Discount > item price → cap at item price
- Point payment > remaining → cap at remaining
- Zero balance → reject redemption
- Same item in condition + excluded → excluded wins

---

## Test File Structure

```
src/engine/__tests__/
├── properties.test.ts       — 15 property-based tests
├── conditions/*.test.ts     — 7 condition evaluator tests
├── benefits/*.test.ts       — 5 benefit calculator tests
├── points/*.test.ts         — earning, redemption, payment tests
├── conflict/resolver.test.ts
├── pipeline.test.ts         — full integration
└── validation.test.ts       — input schema tests
```

---

## Mock Data

- 5 members (different levels)
- 5 stores
- 20 products (4 groups)
- 10 promotions (covering all 4 types)
- 5 point balance scenarios
