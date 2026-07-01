# Implementation Plan: Promotion + Point Calculation Engine

## Overview

สร้าง TypeScript module สำหรับคำนวณโปรโมชั่นและคะแนนสะสม (pure function, deterministic, no I/O) ตามโครงสร้าง pipeline 10 ขั้นตอน ใช้ Registry Pattern + Strategy Pattern เพื่อรองรับการเพิ่ม condition/benefit types ในอนาคต

## Tasks

- [ ] 1. Set up project structure, types, and enums
  - [ ] 1.1 Create directory structure and base files
    - สร้างโครงสร้าง `src/engine/` ทั้งหมด (types/, core/, conditions/evaluators/, benefits/calculators/, points/, conflict/strategies/, audit/, validators/, __tests__/)
    - สร้าง `src/engine/index.ts` เป็น entry point
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 1.2 Implement enums and type definitions
    - สร้าง `src/engine/types/enums.ts` — PromotionType, PointType, QuantityOperator, StackMode, ConflictResolution, PointPolicyMode, PointUsageMode, PromotionStatus
    - สร้าง `src/engine/types/inputs.ts` — CalculationRequest, CartItem, PromotionConfig, ConditionConfig, BenefitConfig, PointEarningConfig, PointBalance, PointPolicy, PointUsageRequest, RedeemRequest
    - สร้าง `src/engine/types/outputs.ts` — CalculationResult, EvaluationSummary, AppliedBenefit, FreeGift, PointTransaction, FinalTotals, ExplainEntry
    - สร้าง `src/engine/types/internal.ts` — EvaluationContext, ConditionResult, BenefitContext, BenefitResult, LineDiscount, EvaluatedPromotion, ValidationResult, ValidationError, EarnResult, RedeemResult, PaymentResult
    - สร้าง `src/engine/types/index.ts` barrel export
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 14.1, 14.2_

  - [ ] 1.3 Implement registry interfaces and base classes
    - สร้าง `src/engine/types/registry.ts` — ConditionEvaluator interface (type + evaluate method), BenefitCalculator interface (type + calculate method)
    - สร้าง `src/engine/core/ConditionRegistry.ts` — register/get evaluator by type
    - สร้าง `src/engine/core/BenefitRegistry.ts` — register/get calculator by type
    - _Requirements: 14.3, 14.4_

- [ ] 2. Implement validators (Zod schemas)
  - [ ] 2.1 Create input validation schemas
    - สร้าง `src/engine/validators/schemas.ts` — Zod schemas สำหรับ CalculationRequest, CartItem, PromotionConfig, ConditionConfig, BenefitConfig, PointBalance, PointPolicy, PointUsageRequest, RedeemRequest
    - ตรวจสอบ: cartItems min 1, quantity > 0, unitPrice >= 0, valid ISO datetime, startDate <= endDate, priority >= 0
    - สร้าง `src/engine/validators/index.ts` — export validateInput function ที่ return ValidationResult
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 12.7_

  - [ ]* 2.2 Write unit tests for validators
    - ทดสอบ: valid input ผ่าน, missing required fields, invalid types, empty cart, malformed dates
    - _Requirements: 12.7_

- [ ] 3. Implement condition evaluators (7 types)
  - [ ] 3.1 Implement MemberConditionEvaluator
    - สร้าง `src/engine/conditions/evaluators/member.ts`
    - ตรวจสอบ member level, segment, หรือ identifier ตรงกับ condition params
    - Return ConditionResult with passed/reason
    - _Requirements: 3.1_

  - [ ] 3.2 Implement StoreConditionEvaluator
    - สร้าง `src/engine/conditions/evaluators/store.ts`
    - ตรวจสอบ storeCode ตรงกับ store list ใน condition params
    - _Requirements: 3.2_

  - [ ] 3.3 Implement DayConditionEvaluator
    - สร้าง `src/engine/conditions/evaluators/day.ts`
    - ตรวจสอบวันในสัปดาห์ (จาก businessDateTime) ตรงกับ day list
    - _Requirements: 3.3_

  - [ ] 3.4 Implement TimeConditionEvaluator
    - สร้าง `src/engine/conditions/evaluators/time.ts`
    - ตรวจสอบเวลาปัจจุบัน (จาก businessDateTime) อยู่ในช่วง time range
    - _Requirements: 3.4_

  - [ ] 3.5 Implement ProductConditionEvaluator
    - สร้าง `src/engine/conditions/evaluators/product.ts`
    - ตรวจสอบว่า CartItem ตรงกับ product list (by itemCode หรือ groupCodes)
    - Return matchedItems ใน ConditionResult
    - _Requirements: 3.5_

  - [ ] 3.6 Implement PurchaseAmountConditionEvaluator
    - สร้าง `src/engine/conditions/evaluators/purchaseAmount.ts`
    - รองรับ QuantityOperator: EVERY (repeatable), RANGE (min-max inclusive), MORE_THAN (threshold)
    - _Requirements: 3.6, 3.8, 3.9, 3.10_

  - [ ] 3.7 Implement ExcludedProductConditionEvaluator
    - สร้าง `src/engine/conditions/evaluators/excludedProduct.ts`
    - Exclude matching items จาก benefit application แต่ไม่ block promotion
    - Return excludedItems ใน ConditionResult
    - _Requirements: 3.7_

  - [ ] 3.8 Create condition evaluator index and register all evaluators
    - สร้าง `src/engine/conditions/index.ts` — register ทุก evaluator ใน ConditionRegistry
    - สร้าง `src/engine/conditions/evaluateAll.ts` — function ที่ evaluate ทุก conditions แบบ AND logic
    - _Requirements: 3.11, 14.3_

  - [ ]* 3.9 Write unit tests for condition evaluators
    - ทดสอบแต่ละ evaluator: pass/fail cases, edge cases
    - ทดสอบ AND logic: multiple conditions ต้องผ่านทุกข้อ
    - _Requirements: 3.1–3.11_

- [ ] 4. Implement benefit calculators (5 types)
  - [ ] 4.1 Implement PercentDiscountCalculator
    - สร้าง `src/engine/benefits/calculators/percentDiscount.ts`
    - ลดราคาตาม % พร้อม max discount cap
    - ไม่ให้ราคาติดลบ (floor at zero)
    - _Requirements: 5.1, 5.6_

  - [ ] 4.2 Implement AmountDiscountCalculator
    - สร้าง `src/engine/benefits/calculators/amountDiscount.ts`
    - ลดราคาตาม fixed amount
    - ไม่ให้ราคาติดลบ
    - _Requirements: 5.2, 5.6_

  - [ ] 4.3 Implement PerUnitDiscountCalculator
    - สร้าง `src/engine/benefits/calculators/perUnit.ts`
    - ลดราคาต่อชิ้น × quantity
    - ไม่ให้ราคาติดลบ
    - _Requirements: 5.3, 5.6_

  - [ ] 4.4 Implement BillDiscountCalculator
    - สร้าง `src/engine/benefits/calculators/billDiscount.ts`
    - ลดยอดรวม (bill-level discount)
    - _Requirements: 5.4, 5.6_

  - [ ] 4.5 Implement FreeGiftCalculator
    - สร้าง `src/engine/benefits/calculators/freeGift.ts`
    - เพิ่มสินค้าแถมใน gift list (quantity, zero cost)
    - _Requirements: 5.5_

  - [ ] 4.6 Create benefit calculator index and register all calculators
    - สร้าง `src/engine/benefits/index.ts` — register ทุก calculator ใน BenefitRegistry
    - สร้าง `src/engine/benefits/applyBenefits.ts` — function ที่ apply benefits ตาม priority order, track remainingAmounts
    - _Requirements: 5.7, 14.4_

  - [ ]* 4.7 Write unit tests for benefit calculators
    - ทดสอบ: percent discount with cap, amount discount, per-unit, bill discount, free gift
    - ทดสอบ edge case: discount > item price → cap at item price
    - _Requirements: 5.1–5.7, 12.3_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement conflict resolver (3 strategies)
  - [ ] 6.1 Implement HighestPriorityStrategy
    - สร้าง `src/engine/conflict/strategies/highestPriority.ts`
    - เลือก promotion ที่มี priority value ต่ำสุด (highest priority)
    - _Requirements: 2.5_

  - [ ] 6.2 Implement BestBenefitStrategy
    - สร้าง `src/engine/conflict/strategies/bestBenefit.ts`
    - เลือก promotion ที่ให้ส่วนลดสูงสุดแก่ลูกค้า
    - _Requirements: 2.6_

  - [ ] 6.3 Implement FirstMatchStrategy
    - สร้าง `src/engine/conflict/strategies/firstMatch.ts`
    - เลือก promotion แรกที่ผ่าน conditions (ตาม config order)
    - _Requirements: 2.7_

  - [ ] 6.4 Implement ConflictResolver
    - สร้าง `src/engine/conflict/resolver.ts` — orchestrate stacking rules (NO_STACK, STACK_ALLOWED, SELECTIVE_STACK) แล้วใช้ strategy ที่เหมาะสม
    - สร้าง `src/engine/conflict/index.ts`
    - บันทึก rejection reason ใน audit trail
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 6.5 Write unit tests for conflict resolver
    - ทดสอบ: NO_STACK → only 1 applied, STACK_ALLOWED → both apply, SELECTIVE_STACK → only compatible
    - ทดสอบ 3 strategies แยกกัน
    - _Requirements: 4.1–4.6_

- [ ] 7. Implement point engine (earning, redemption, payment, policy)
  - [ ] 7.1 Implement point earning calculator
    - สร้าง `src/engine/points/earning.ts`
    - คำนวณคะแนนจาก eligible subtotal หลังหักส่วนลด
    - รองรับ multiplier, expiryDays, optional gift
    - SINGLE_TYPE: ใส่คะแนนเข้า highest-priority type เท่านั้น
    - MULTI_TYPE: ใส่คะแนนตาม pointType ที่กำหนดในแต่ละ promotion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ] 7.2 Implement point redemption processor
    - สร้าง `src/engine/points/redemption.ts`
    - รองรับ benefit type: discount (แปลงคะแนนเป็นส่วนลด), product (แลกสินค้า)
    - ตรวจสอบ balance, expired points, allowMerge
    - Return RedeemResult with success/rejection reason
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 7.3 Implement point payment processor
    - สร้าง `src/engine/points/payment.ts`
    - แปลงคะแนนเป็นเงิน (conversion rate)
    - ตรวจสอบ min/max, exclude expired, deduct ตาม priorityOrder
    - Cap point usage ที่ remaining payable amount
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ] 7.4 Implement point policy enforcer
    - สร้าง `src/engine/points/policyEnforcer.ts`
    - จัดการ AUTO vs MANUAL mode
    - AUTO: เลือก optimal point usage อัตโนมัติ
    - MANUAL: ใช้เฉพาะ explicit request
    - Explicit request override AUTO selection
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 7.5 Create points module index
    - สร้าง `src/engine/points/index.ts` — export all point functions
    - _Requirements: 6.1–6.8, 7.1–7.7, 8.1–8.8, 9.1–9.4_

  - [ ]* 7.6 Write unit tests for point engine
    - ทดสอบ: earning with multiplier, redemption success/reject, payment cap, expired exclusion, AUTO/MANUAL modes, allowMerge
    - _Requirements: 6.1–6.8, 7.1–7.7, 8.1–8.8, 9.1–9.4_

- [ ] 8. Implement core pipeline orchestrator
  - [ ] 8.1 Implement promotion filter
    - สร้าง `src/engine/core/filter.ts`
    - ตัด promotions ที่ expired (startDate/endDate), inactive (status != ACTIVE)
    - บันทึก exclusion reason ใน audit
    - _Requirements: 2.2, 2.3_

  - [ ] 8.2 Implement subtotal calculator
    - สร้าง `src/engine/core/subtotal.ts`
    - คำนวณ eligible subtotal หลัง discounts
    - คำนวณ FinalTotals (subtotalBeforePromotion, totalItemDiscount, totalBillDiscount, subtotalAfterPromotion, pointRedemptionValue, pointPaymentValue, finalPayable)
    - _Requirements: 10.1, 10.2_

  - [ ] 8.3 Implement main pipeline orchestrator (calculate function)
    - สร้าง `src/engine/core/engine.ts`
    - Implement 10-step pipeline: validate → filter → evaluate → resolve → apply benefits → subtotal → redeem → payment → earn → build result
    - Enforce strict order (requirement 10)
    - Handle empty cart → empty result, no promotions → pass-through
    - _Requirements: 2.1, 10.1, 10.2, 10.3, 10.4, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 1.5, 1.6, 1.7_

  - [ ] 8.4 Wire up engine exports
    - อัพเดท `src/engine/index.ts` — export calculate function, types, registries
    - ตรวจสอบว่า module ใช้งานได้ครบ
    - _Requirements: 1.5, 13.2, 13.3_

- [ ] 9. Implement audit trail builder
  - [ ] 9.1 Implement ExplainTrailBuilder
    - สร้าง `src/engine/audit/trailBuilder.ts`
    - บันทึกทุก step: FILTERED, EVALUATED, MATCHED, REJECTED, APPLIED
    - Sequential step number (monotonically increasing)
    - Include details: condition failures, stacking rejections, benefit amounts, point transactions
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ] 9.2 Create audit module index
    - สร้าง `src/engine/audit/index.ts`
    - _Requirements: 11.1–11.7_

  - [ ]* 9.3 Write unit tests for audit trail builder
    - ทดสอบ: ทุก candidate มี entry, step numbers เรียงลำดับ, details ครบถ้วน
    - _Requirements: 11.1–11.7_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration tests and property tests
  - [ ]* 11.1 Write property test: Determinism (Property 1)
    - **Property 1: Determinism — same input → same output**
    - ใช้ fast-check generate random CalculationRequest แล้วเรียก calculate 2 ครั้ง เปรียบเทียบ output
    - **Validates: Requirements 1.6**

  - [ ]* 11.2 Write property test: Non-negative payable (Property 2)
    - **Property 2: finalPayable >= 0 เสมอ**
    - Generate random cart + promotions + point usage → assert finalPayable >= 0
    - **Validates: Requirements 12.3, 12.5**

  - [ ]* 11.3 Write property test: Discount bounded (Property 3)
    - **Property 3: total discounts <= subtotal**
    - Generate random scenarios → assert totalItemDiscount + totalBillDiscount <= subtotalBeforePromotion
    - **Validates: Requirements 5.6, 12.3**

  - [ ]* 11.4 Write property test: Point conservation (Property 4)
    - **Property 4: points used <= non-expired balance**
    - Generate random point usage → assert ไม่ใช้เกิน balance ที่ยังไม่หมดอายุ
    - **Validates: Requirements 7.4, 7.5, 8.8**

  - [ ]* 11.5 Write property test: Earn timing (Property 5)
    - **Property 5: earned based on post-discount subtotal**
    - Generate cart + promotions → verify earn calc ใช้ subtotal หลังหัก discount
    - **Validates: Requirements 6.2, 10.2**

  - [ ]* 11.6 Write property test: Stacking integrity (Property 6)
    - **Property 6: NO_STACK = only 1 promo applied**
    - Generate promotions with NO_STACK → assert max 1 applied
    - **Validates: Requirements 4.1**

  - [ ]* 11.7 Write property test: Pipeline ordering (Property 7)
    - **Property 7: audit steps monotonically increasing**
    - Generate random request → verify explainTrace step numbers increase
    - **Validates: Requirements 11.7**

  - [ ]* 11.8 Write property test: Quantity operators (Property 8)
    - **Property 8: EVERY repeats, RANGE bounds, MORE_THAN threshold**
    - Generate amounts + operators → verify correct behavior
    - **Validates: Requirements 3.8, 3.9, 3.10**

  - [ ]* 11.9 Write property test: Condition conjunction (Property 9)
    - **Property 9: all conditions must pass (AND logic)**
    - Generate multiple conditions → if any fails, promotion not applied
    - **Validates: Requirements 3.11**

  - [ ]* 11.10 Write property test: Excluded products (Property 10)
    - **Property 10: no discount on excluded items**
    - Generate cart with excluded items → verify no discount applied to excluded
    - **Validates: Requirements 3.7**

  - [ ]* 11.11 Write property test: Inactive filtered (Property 11)
    - **Property 11: expired/inactive never applied**
    - Generate expired/inactive promos → verify 0 applied
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 11.12 Write property test: Conflict resolution (Property 12)
    - **Property 12: correct strategy applied**
    - Generate conflicting promos + strategy → verify correct winner
    - **Validates: Requirements 2.5, 2.6, 2.7**

  - [ ]* 11.13 Write property test: Manual mode (Property 13)
    - **Property 13: no auto point usage without explicit request**
    - Generate MANUAL mode without explicit request → verify no point usage
    - **Validates: Requirements 9.2**

  - [ ]* 11.14 Write property test: Audit completeness (Property 14)
    - **Property 14: every candidate has audit entry**
    - Generate N promotions → verify explainTrace has entry for each
    - **Validates: Requirements 11.1**

  - [ ]* 11.15 Write property test: Empty promotions (Property 15)
    - **Property 15: no changes to totals when no promotions**
    - Generate cart with empty promotions → verify totals unchanged
    - **Validates: Requirements 12.2**

  - [ ]* 11.16 Write integration tests for full pipeline flows
    - ทดสอบ scenario จริง: ซื้อครบ 2500 ลด 250, ซื้อ 2 แถม 1, Happy Hour ลด 10%, multi-type point payment
    - ทดสอบ edge cases: empty cart, all expired, discount > price, point payment > remaining
    - _Requirements: 2.1, 10.1, 12.1–12.6_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (from design-testing.md)
- Unit tests validate specific examples and edge cases
- ใช้ TypeScript ตาม design documents ทั้งหมด
- ใช้ Zod สำหรับ validation, fast-check สำหรับ property tests, vitest สำหรับ test runner
- Engine เป็น pure function ไม่มี side effects, ไม่มี I/O, ไม่มี network calls
- Target performance: 100 items × 50 promos < 50ms

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7"] },
    { "id": 3, "tasks": ["2.2", "3.8", "3.9", "4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["4.6", "6.1", "6.2", "6.3"] },
    { "id": 5, "tasks": ["4.7", "6.4", "6.5", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 6, "tasks": ["7.5", "7.6", "9.1"] },
    { "id": 7, "tasks": ["8.1", "8.2", "9.2", "9.3"] },
    { "id": 8, "tasks": ["8.3"] },
    { "id": 9, "tasks": ["8.4"] },
    { "id": 10, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "11.7", "11.8", "11.9", "11.10", "11.11", "11.12", "11.13", "11.14", "11.15", "11.16"] }
  ]
}
```
