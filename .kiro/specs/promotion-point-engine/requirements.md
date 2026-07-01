# Requirements Document

## Introduction

The Promotion + Point Calculation Engine is a deterministic, pure-function backend module for the POS Mobile system. It accepts a cart context (items, member, store, time) and a set of promotion configurations, then produces a fully calculated result including discounts, free gifts, point earnings, point redemptions, and point payments. The engine enforces a strict calculation order, handles stacking/conflict resolution, and provides full audit traceability for every decision made.

## Glossary

- **Engine**: The Promotion + Point Calculation Engine module that processes cart context and promotion configurations to produce calculation results
- **Cart**: A collection of line items with quantities, prices, and associated metadata representing a sale transaction
- **Line_Item**: A single product entry in the Cart with quantity, unit price, and product identifiers
- **Promotion_Config**: A JSON-based configuration object defining a single promotion's type, conditions, benefits, priority, and stacking rules
- **Condition**: A rule that must be satisfied for a promotion to apply (member, store, day, time, product, purchaseAmount, excludedProduct)
- **Benefit**: The reward granted when a promotion's conditions are met (discount, free gift, points)
- **Point_Ledger**: The current state of a member's point balances across all point types, including expiry dates
- **Point_Type**: One of MEMBER_POINT, PROMOTION_POINT, BIRTHDAY_POINT, REWARD_POINT, or CASHBACK_POINT
- **Point_Policy**: Configuration governing how points are earned, redeemed, and merged across types
- **Stack_Mode**: The stacking behavior of a promotion: NO_STACK, STACK_ALLOWED, or SELECTIVE_STACK
- **Conflict_Resolution**: The strategy to resolve conflicts between non-stackable promotions: HIGHEST_PRIORITY, BEST_BENEFIT, or FIRST_MATCH
- **Quantity_Operator**: An operator defining how quantity/amount conditions are evaluated: EVERY (repeatable), RANGE (between min-max), or MORE_THAN (threshold)
- **Calculation_Result**: The final output of the Engine containing applied promotions, discounts, gifts, point transactions, and totals
- **Audit_Trail**: A structured log of every decision made during calculation, including which promotions were evaluated, matched, rejected, and applied

## Requirements

### Requirement 1: Engine Input/Output Contract

**User Story:** As a POS developer, I want the engine to have a well-defined input/output contract, so that I can integrate it deterministically into the sale flow.

#### Acceptance Criteria

1. THE Engine SHALL accept a Cart context containing line items, member information, store identifier, and current timestamp as input
2. THE Engine SHALL accept an array of Promotion_Config objects as input
3. THE Engine SHALL accept an optional Point_Ledger representing the member's current point balances as input
4. THE Engine SHALL accept an optional Point_Policy configuration as input
5. THE Engine SHALL return a Calculation_Result containing: applied promotions list, total discount amount, free gift list, point transactions list, subtotal before discounts, subtotal after discounts, final payable amount, and Audit_Trail
6. WHEN the same input is provided multiple times, THE Engine SHALL produce identical Calculation_Result objects (deterministic behavior)
7. THE Engine SHALL operate as a pure function with no side effects and no dependency on external state

### Requirement 2: Promotion Evaluation Pipeline

**User Story:** As a POS developer, I want promotions evaluated in a predictable pipeline, so that the calculation order is transparent and testable.

#### Acceptance Criteria

1. THE Engine SHALL execute the evaluation pipeline in the following fixed order: validate cart and context, filter active promotions, evaluate conditions, resolve stacking and conflicts, apply benefits
2. WHEN a Promotion_Config has a startDate in the future or an endDate in the past relative to the current timestamp, THE Engine SHALL exclude the Promotion_Config from evaluation
3. WHEN a Promotion_Config has status other than "active", THE Engine SHALL exclude the Promotion_Config from evaluation
4. WHEN multiple promotions pass condition evaluation, THE Engine SHALL apply Conflict_Resolution strategy to determine which promotions are applied
5. WHEN Conflict_Resolution strategy is HIGHEST_PRIORITY, THE Engine SHALL select the promotion with the lowest numeric priority value
6. WHEN Conflict_Resolution strategy is BEST_BENEFIT, THE Engine SHALL select the promotion that yields the highest monetary benefit to the customer
7. WHEN Conflict_Resolution strategy is FIRST_MATCH, THE Engine SHALL select the first promotion that satisfies all conditions in configuration order

### Requirement 3: Condition Evaluation

**User Story:** As a promotion manager, I want flexible condition types, so that I can target promotions precisely.

#### Acceptance Criteria

1. WHEN a Promotion_Config contains a "member" condition, THE Engine SHALL evaluate whether the current member matches the specified member level, segment, or identifier
2. WHEN a Promotion_Config contains a "store" condition, THE Engine SHALL evaluate whether the current store identifier matches the specified store list
3. WHEN a Promotion_Config contains a "day" condition, THE Engine SHALL evaluate whether the current day of week matches the specified day list
4. WHEN a Promotion_Config contains a "time" condition, THE Engine SHALL evaluate whether the current time falls within the specified time range
5. WHEN a Promotion_Config contains a "product" condition, THE Engine SHALL evaluate whether any Line_Item in the Cart matches the specified product list
6. WHEN a Promotion_Config contains a "purchaseAmount" condition, THE Engine SHALL evaluate the Cart total against the specified amount using the configured Quantity_Operator
7. WHEN a Promotion_Config contains an "excludedProduct" condition, THE Engine SHALL exclude matching Line_Items from benefit application while still allowing the promotion to apply to remaining items
8. WHEN a Quantity_Operator is EVERY, THE Engine SHALL apply the benefit repeatedly for each qualifying multiple of the threshold amount
9. WHEN a Quantity_Operator is RANGE, THE Engine SHALL apply the benefit only when the value falls between the specified minimum and maximum (inclusive)
10. WHEN a Quantity_Operator is MORE_THAN, THE Engine SHALL apply the benefit only when the value exceeds the specified threshold
11. WHEN a Promotion_Config contains multiple conditions, THE Engine SHALL require all conditions to be satisfied (logical AND)

### Requirement 4: Stack and Conflict Resolution

**User Story:** As a promotion manager, I want control over which promotions can combine, so that I prevent unintended double-discounting.

#### Acceptance Criteria

1. WHEN a Promotion_Config has Stack_Mode NO_STACK, THE Engine SHALL prevent any other promotion from applying alongside the Promotion_Config
2. WHEN a Promotion_Config has Stack_Mode STACK_ALLOWED, THE Engine SHALL permit other STACK_ALLOWED promotions to apply alongside the Promotion_Config
3. WHEN a Promotion_Config has Stack_Mode SELECTIVE_STACK, THE Engine SHALL permit only promotions in the specified compatible list to apply alongside the Promotion_Config
4. WHEN two or more non-stackable promotions qualify simultaneously, THE Engine SHALL apply the configured Conflict_Resolution strategy to select one
5. THE Engine SHALL evaluate stacking rules after condition evaluation and before benefit application
6. WHEN a promotion is rejected due to stacking rules, THE Engine SHALL record the rejection reason in the Audit_Trail

### Requirement 5: Benefit Application — Discounts and Gifts

**User Story:** As a cashier, I want discounts and gifts calculated correctly, so that customers receive accurate pricing.

#### Acceptance Criteria

1. WHEN a PROMOTION benefit type is "percent_discount", THE Engine SHALL reduce the eligible Line_Item prices by the specified percentage, respecting any configured maximum discount cap
2. WHEN a PROMOTION benefit type is "amount_discount", THE Engine SHALL reduce the eligible Line_Item prices by the specified fixed amount
3. WHEN a PROMOTION benefit type is "per_unit_discount", THE Engine SHALL reduce each qualifying unit's price by the specified amount multiplied by quantity
4. WHEN a PROMOTION benefit type is "bill_discount", THE Engine SHALL reduce the overall Cart subtotal by the specified amount
5. WHEN a PROMOTION benefit type is "free_gift", THE Engine SHALL add the specified product to the Calculation_Result gift list with quantity and zero cost
6. THE Engine SHALL ensure that no Line_Item price becomes negative after discount application
7. THE Engine SHALL apply discounts to Line_Items in priority order, deducting from the remaining eligible amount

### Requirement 6: Point Earning Calculation

**User Story:** As a member, I want to earn the correct points after my purchase, so that my loyalty rewards are accurate.

#### Acceptance Criteria

1. THE Engine SHALL calculate point earnings as the last step in the pipeline, after all discounts and redemptions have been applied
2. WHEN an EARN_POINT_GIFT promotion qualifies, THE Engine SHALL calculate points based on the eligible subtotal after all discounts
3. WHEN an EARN_POINT_GIFT promotion specifies a point multiplier, THE Engine SHALL multiply the base point earning by the specified multiplier
4. WHEN an EARN_POINT_GIFT promotion specifies point expiry configuration, THE Engine SHALL include the expiry date in the point transaction output
5. WHEN an EARN_POINT_GIFT promotion awards an optional gift, THE Engine SHALL include the gift in the Calculation_Result alongside the point earning
6. THE Engine SHALL assign earned points to the Point_Type specified in the EARN_POINT_GIFT promotion configuration
7. WHEN Point_Policy mode is SINGLE_TYPE, THE Engine SHALL assign all earned points to the highest-priority Point_Type only
8. WHEN Point_Policy mode is MULTI_TYPE, THE Engine SHALL assign earned points to respective Point_Types as configured per promotion

### Requirement 7: Point Redemption

**User Story:** As a member, I want to redeem my points for discounts or products, so that I can use my accumulated loyalty rewards.

#### Acceptance Criteria

1. WHEN a REDEEM_POINT request is included in the input, THE Engine SHALL evaluate it after PROMOTION benefits have been applied
2. WHEN a REDEEM_POINT benefit type is "discount", THE Engine SHALL convert the specified points to a monetary discount using the configured conversion rate
3. WHEN a REDEEM_POINT benefit type is "product", THE Engine SHALL add the specified product to the gift list and deduct the required points
4. WHEN the member's available Point_Ledger balance for the required Point_Type is less than the redemption cost, THE Engine SHALL reject the redemption and record the reason in the Audit_Trail
5. WHEN the Point_Ledger contains expired points, THE Engine SHALL exclude expired points from the available balance before evaluating sufficiency
6. WHEN Point_Policy allowMerge is true, THE Engine SHALL combine points from multiple Point_Types following the priorityOrder to fulfill a redemption
7. WHEN Point_Policy allowMerge is false, THE Engine SHALL use only the single specified Point_Type for the redemption

### Requirement 8: Point Payment

**User Story:** As a member, I want to pay part or all of my bill with points, so that I have flexible payment options.

#### Acceptance Criteria

1. WHEN a POINT_PAYMENT request is included in the input, THE Engine SHALL evaluate it after REDEEM_POINT processing
2. THE Engine SHALL convert points to monetary value using the configured conversion rate (points per currency unit)
3. WHEN a POINT_PAYMENT configuration specifies a minimum point amount, THE Engine SHALL reject the payment if fewer points are offered
4. WHEN a POINT_PAYMENT configuration specifies a maximum point amount, THE Engine SHALL cap the point usage at the maximum regardless of the member's balance
5. WHEN a POINT_PAYMENT configuration allows mixed payment, THE Engine SHALL calculate the remaining payable amount after point deduction for tender via other payment methods
6. WHEN the final payable amount after point payment reaches zero, THE Engine SHALL mark the transaction as fully paid by points
7. WHEN Point_Policy mode applies, THE Engine SHALL deduct points following the priorityOrder, consuming the highest-priority Point_Type first
8. THE Engine SHALL exclude expired points from POINT_PAYMENT usage

### Requirement 9: Point Usage Mode — AUTO vs MANUAL

**User Story:** As a store operator, I want to configure whether points are used automatically or require cashier action, so that the checkout experience matches our business policy.

#### Acceptance Criteria

1. WHEN Point_Policy usage mode is AUTO, THE Engine SHALL automatically select the optimal point redemption or payment based on available balance and configured rules
2. WHEN Point_Policy usage mode is MANUAL, THE Engine SHALL apply point redemption or payment only when explicitly requested in the input
3. WHEN Point_Policy usage mode is AUTO and the input also contains an explicit point request, THE Engine SHALL prioritize the explicit request over the automatic selection
4. WHEN Point_Policy usage mode is AUTO, THE Engine SHALL include the auto-selected point usage details in the Audit_Trail

### Requirement 10: Calculation Order Enforcement

**User Story:** As a POS developer, I want a guaranteed calculation order, so that results are predictable regardless of input ordering.

#### Acceptance Criteria

1. THE Engine SHALL process the calculation in the following strict sequence: (1) validate cart and context, (2) filter active promotions, (3) evaluate conditions, (4) resolve stacking and conflicts, (5) apply PROMOTION benefits, (6) calculate eligible subtotal after promotion, (7) apply REDEEM_POINT, (8) apply POINT_PAYMENT, (9) calculate EARN_POINT last, (10) return final totals and point transactions
2. THE Engine SHALL calculate point earnings based on the subtotal after PROMOTION discounts and before REDEEM_POINT deductions
3. THE Engine SHALL not allow REDEEM_POINT or POINT_PAYMENT to affect the point earning calculation
4. WHEN the input contains promotions of multiple types, THE Engine SHALL process PROMOTION type before EARN_POINT_GIFT type, REDEEM_POINT type, and POINT_PAYMENT type in that order

### Requirement 11: Audit and Explainability

**User Story:** As a store manager, I want to see why each promotion was or was not applied, so that I can explain pricing to customers and resolve disputes.

#### Acceptance Criteria

1. THE Engine SHALL produce an Audit_Trail entry for every Promotion_Config evaluated during the pipeline
2. WHEN a Promotion_Config is excluded during filtering, THE Engine SHALL record the exclusion reason (inactive, date out of range) in the Audit_Trail
3. WHEN a Promotion_Config fails condition evaluation, THE Engine SHALL record which specific condition failed in the Audit_Trail
4. WHEN a Promotion_Config is rejected due to stacking rules, THE Engine SHALL record the conflicting promotion identifier and the resolution strategy used in the Audit_Trail
5. WHEN a benefit is applied, THE Engine SHALL record the benefit type, calculated amount, and affected Line_Items in the Audit_Trail
6. WHEN a point transaction occurs (earn, redeem, or payment), THE Engine SHALL record the Point_Type, quantity, conversion rate, and resulting balance change in the Audit_Trail
7. THE Audit_Trail SHALL include a sequential step number for each entry, preserving the exact evaluation order

### Requirement 12: Edge Case Handling

**User Story:** As a POS developer, I want edge cases handled gracefully, so that the engine never produces invalid results.

#### Acceptance Criteria

1. WHEN the Cart contains zero Line_Items, THE Engine SHALL return an empty Calculation_Result with zero totals and no applied promotions
2. WHEN no Promotion_Config objects are provided, THE Engine SHALL return the Cart totals without modification
3. WHEN a discount calculation would result in a negative Line_Item price, THE Engine SHALL cap the discount at the Line_Item price (floor at zero)
4. WHEN multiple promotions target the same Line_Item and stacking is allowed, THE Engine SHALL apply discounts sequentially in priority order, each reducing the remaining eligible amount
5. WHEN a POINT_PAYMENT would exceed the remaining payable amount, THE Engine SHALL cap the point usage at the remaining payable amount and return unused points
6. WHEN a member has points across multiple Point_Types with some expired, THE Engine SHALL use only non-expired points and skip expired entries without error
7. IF the Engine receives malformed input (missing required fields, invalid types), THEN THE Engine SHALL return a structured validation error listing all violations without partial calculation

### Requirement 13: Performance

**User Story:** As a cashier, I want instant calculation results, so that the checkout process is not delayed.

#### Acceptance Criteria

1. THE Engine SHALL complete calculation for a Cart with up to 100 Line_Items and up to 50 Promotion_Config objects within 50 milliseconds on the target device
2. THE Engine SHALL not perform any network calls or I/O operations during calculation
3. THE Engine SHALL use only in-memory data structures provided in the input

### Requirement 14: Extensibility

**User Story:** As a product owner, I want the engine to support new promotion and point types in the future, so that business rules can evolve without major rewrites.

#### Acceptance Criteria

1. THE Engine SHALL define Promotion_Config using a discriminated union pattern (type field), allowing new promotion types to be added without modifying existing evaluation logic
2. THE Engine SHALL define Point_Type as an extensible enumeration, allowing new point types to be added without modifying existing point logic
3. THE Engine SHALL define Condition types as a registry pattern, allowing new condition evaluators to be registered without modifying the core pipeline
4. THE Engine SHALL define Benefit types as a registry pattern, allowing new benefit calculators to be registered without modifying the core pipeline
