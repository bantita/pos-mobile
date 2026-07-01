# Design: Architecture — Promotion + Point Calculation Engine

## Overview

A deterministic, side-effect-free TypeScript module. Accepts cart + promotions + points → returns discounts, gifts, point transactions, audit trail.

**Principles:** Pure Functions | Pipeline Pattern | Strategy Pattern | Registry Pattern | Determinism

## Pipeline (10 Steps)

```
Request → [1.Validate] → [2.Filter] → [3.Evaluate] → [4.Resolve Conflicts] → [5.Apply Benefits]
       → [6.Calc Subtotal] → [7.Redeem Points] → [8.Point Payment] → [9.Earn Points] → [10.Build Result] → Response
```

Step details:
1. **Validate** — Zod schema check, return errors if invalid
2. **Filter** — Remove inactive/expired/out-of-date promotions
3. **Evaluate** — Run condition evaluators (AND logic across all conditions)
4. **Resolve** — Apply stack/conflict rules to select applicable promos
5. **Apply Benefits** — Calculate discounts and gifts
6. **Subtotal** — Compute eligible subtotal after discounts
7. **Redeem** — Process point redemption (if requested)
8. **Payment** — Process point-as-payment (if requested)
9. **Earn** — Calculate points earned (based on post-discount subtotal)
10. **Build** — Assemble final CalculationResult + audit trail

## Module Structure

```
src/engine/
├── types/              — enums, interfaces, DTOs
├── core/               — engine entry point + pipeline orchestrator
├── conditions/         — condition evaluators (registry pattern)
│   └── evaluators/     — member, store, day, time, product, purchaseAmount, excluded
├── benefits/           — benefit calculators (registry pattern)
│   └── calculators/    — percentDiscount, amountDiscount, perUnit, bill, freeGift
├── points/             — earning, redemption, payment, policy enforcer
├── conflict/           — resolver + strategies (highestPriority, bestBenefit, firstMatch)
├── audit/              — ExplainTrailBuilder
├── validators/         — Zod input schemas
└── __tests__/          — unit + property + integration tests
```

## Design Patterns

### Registry Pattern (Extensibility)
```typescript
// Register new condition type without modifying core
conditionRegistry.register(new MemberConditionEvaluator());
conditionRegistry.register(new StoreConditionEvaluator());
// ... future: conditionRegistry.register(new CouponConditionEvaluator());
```

### Strategy Pattern (Conditions & Benefits)
```typescript
interface ConditionEvaluator {
  readonly type: string;
  evaluate(condition: ConditionConfig, context: EvaluationContext): ConditionResult;
}

interface BenefitCalculator {
  readonly type: string;
  calculate(benefit: BenefitConfig, context: BenefitContext): BenefitResult;
}
```

### Pipeline Pattern (Core Engine)
```typescript
function calculate(request: CalculationRequest): CalculationResult {
  const validation = validateInput(request);
  if (!validation.valid) throw new EngineError(validation.errors);
  
  const context = buildContext(request);
  const filtered = filterActive(request.promotionCandidates, context);
  const evaluated = evaluateConditions(filtered, context);
  const resolved = resolveConflicts(evaluated);
  const benefits = applyBenefits(resolved, context);
  const subtotal = calcSubtotal(request.subtotal, benefits);
  const redeem = processRedeem(request.redeemRequest, request.pointBalances, subtotal);
  const payment = processPayment(request.pointUsageRequest, request.pointBalances, subtotal - redeem.value);
  const earned = calcEarnPoints(resolved, subtotal, request.pointPolicy);
  return buildResult(benefits, redeem, payment, earned, audit);
}
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Side effects | None | POS real-time, deterministic testing |
| I/O | None | Performance (50ms target) |
| State | Immutable | No mutation between steps |
| Conflict resolution | Configurable per promo | Different stores need different rules |
| Point earning timing | After discounts, before point usage | Standard POS accounting |
| Extensibility | Registry | Add types without modifying core |
