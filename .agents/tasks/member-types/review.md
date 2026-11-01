# Member types (ลูกค้าทั่วไป / พนักงาน) with POS benefits and promotion targeting

The change adds a member TYPE master that is separate from member LEVEL. It ships a `memberTypeStore` (zustand persist `pos-member-types`, `logAction('ประเภทสมาชิก', …)`) seeded with ลูกค้าทั่วไป (default) and พนักงาน, and adds `memberTypeId`/`memberTypeName` on `Member` with a v0→v1 persist migration. Each type can carry an auto discount %, an earn-points flag and a point multiplier. These apply at the mobile POS through a synthetic engine promotion ("ส่วนลดพนักงาน 10%") and at the web POS as a labelled bill-discount line. Promotions and coupons can target types, the CRM has a gated CRUD screen with member counts and reassign-on-delete, and type pickers, badges, filters and search were added on web and mobile. Verification evidence is present: lint is at the 13-error baseline, tests went from 135 to 193 passing, and the same 3 suites still fail to load. Files owned by other workflows are untouched.

Watch for: the staff discount stacks differently on mobile and web when a non-stackable coupon is used (likely). The customer-display discount line leaves out the type discount, the same way it already leaves out coupons (confirmed). The mobile member list has a call icon but no chat icon (confirmed). None of these block the change.

**Verdict**: APPROVED

## High-level view

The master is a standalone function-API store, and it enforces its rules itself: exactly one active default, the default can't be deleted, deactivated or unset, an inactive type can't become the default, a type in use can't be deleted (the error carries the member count), and renaming a type updates `memberTypeName` on its members. On rehydrate, `ensureMemberTypeInvariants` repairs a broken persisted list. `memberStore` and `memberTypeStore` import each other, which is safe because neither touches the other at module top level. Members get the default type through the persist `migrate` hook. At sale time, `resolveMemberType` falls back to the default when a member's type is missing or inactive.

Benefits go through two separate pipelines, because only the mobile POS uses the promotion engine. On mobile, the discount is a synthetic `STACK_ALLOWED` promotion at priority 9999, so it shows up in `appliedBenefits` under its Thai name and is evaluated last. On web, the same pure helper computes a bill-discount line on `afterDisc`. Points go through one helper, `calcEarnedPoints`, which gives exactly `floor(amount/earnRate)` for a default-valued type. Default-valued types (0%, earn, ×1) therefore keep the old totals and points on both platforms.

Promotion targeting adds `memberTypeIds` to the engine's member condition, AND-combined with `levels`. The adapter attaches it to any promotion that has `applicableMemberTypeIds`. `validateCoupon` and the web POS available-coupon list apply the same check. The UI covers the CRM coupon form, `MemberPriceScreen` (which persists) and `PromoConditionTabs` (whose save is still a mock, as documented).

The two POS pipelines stack the type discount differently. The back-office screen follows WebCRM's local style instead of the shared `@/components/ui` kit. Deferred items (`requireStaffLink`, broadcast targeting, import/export, receipt discount field) are documented with reasons.

<details>
<summary>Issues (5)</summary>

1. **Stacking differs between mobile and web POS** (LOW, likely). On mobile, a non-stackable coupon or promotion that applies first causes the staff discount to be rejected. On web, the staff discount always applies alongside the coupon. Either make web skip the type discount when a non-stackable coupon is applied, or state this difference explicitly in the user-facing docs and verification notes.
2. **Customer display discount leaves out the type discount** (LOW, confirmed). `discountOverride: billDiscAmt + itemDiscountTotal` (WebPOSScreen ~1592) leaves `memberTypeDiscount` out while `grandOverride` includes it. Coupons already behave this way, and the customer display is off-limits here, so record it as a follow-up for the customer-display workflow.
3. **No chat icon on the mobile member list** (LOW, confirmed). `MemberListScreen` added only a call button, while WebCRM got both call and sms. Add a 44px `chatbubble` → `sms:` button next to the call button.
4. **New web screen bypasses the shared UI kit** (LOW, confirmed). `WebMemberTypeScreen` builds its own buttons, cards, badges and error banner instead of using `Button`/`Card`/`Badge`/`Alert` from `@/components/ui`. It also uses a local `TOUCH = 44` instead of `ComponentSize.button.md`, plus raw values (`paddingVertical: 2`, `maxWidth: 420/460`, `flexBasis: 260`). A rewritten line in WebCRMScreen's mobile card also keeps the hex `#6B5B57`. Consider switching to the kit and tokens when this screen is next touched.
5. **Web POS discount composition has no tests** (LOW, confirmed). The helpers are unit-tested, but nothing tests the WebPOS `grandTotal` / `discountTotal` composition with a type discount plus coupon and points, and the UI was not run. Do the manual walkthrough before release.

</details>

<details>
<summary>Details</summary>

### Synthetic engine promotion vs. web bill line: stacking divergence

The mobile path appends this candidate when the resolved type has `discountPercent > 0`:

```
member-type:<id>  "ส่วนลด<name> x%"  percent_discount  member{memberTypeIds:[id]}  STACK_ALLOWED  priority 9999
```

`toStackMode(promo.stackable)` maps `stackable: false` to `NO_STACK`, and the CRM coupon form creates coupons with `stackable: false`. On mobile, the resolver applies the coupon (priority 5) first and then rejects the staff discount with "Cannot stack with NO_STACK promotion". On web, `grandTotal = afterDisc − memberTypeDiscount − couponDiscount − pointDiscount` applies both. The same staff member with the same coupon therefore pays different totals depending on the terminal (likely; traced from the adapter and the coupon form, not run). Plan items D4 and D5 each document their own path, but neither mentions the mismatch.

The engine also computes the percent on the original line amounts, so a STACK_ALLOWED percent promo plus the staff percent both apply to the full price. The verification doc notes this.

### Customer-facing totals

The customer display effect sends `discountOverride: billDiscAmt + itemDiscountTotal` and `grandOverride: grandTotal`. With a 10% staff discount, the customer screen shows a grand total that doesn't equal subtotal minus the displayed discount. Coupons already have the same gap. The fix belongs to the customer-display owner, since this workflow can't touch those files.

### Test coverage

The 58 new tests cover store guards, migration, earn rules, the coupon gate, the engine condition and the adapter's stacking cases. Not tested: WebPOS `grandTotal`/`discountTotal` composition, the WebMemberTypeScreen flows (form, reassign modal), permission gating of the CRM menu, and rendering of `PromoConditionTabs`/`MemberPriceScreen`. The verification doc states that no browser or device run was done.

</details>

<details>
<summary>File map</summary>

- `src/types/memberType.ts`, `src/types/member.ts`, `src/types/promotion.ts`: MemberType model, member type fields, `applicableMemberTypeIds`
- `src/constants/memberTypeColors.ts`: color key → web/mobile token pairs
- `src/constants/rolePermissions.ts`: `crm_member_types` key, added to manager defaults
- `src/data/mockMemberTypes.ts`, `src/data/mockMembers.ts`: seed types; mock members assigned types
- `src/store/memberTypeStore.ts`: new master store with invariants, guards, reassign, audit log
- `src/store/memberStore.ts`: persist v1 migrate, default type on add, type-aware search and earnPoints
- `src/store/promoStore.ts`, `src/store/saleHistoryStore.ts`: coupon type gate; sale type snapshot
- `src/utils/memberTypeBenefits.ts`: pure points, discount and label helpers
- `src/engine/**`: `memberTypeId` in request/context, member evaluator `memberTypeIds`, adapter synthetic promo + targeting
- `src/screens/web/WebMemberTypeScreen.tsx`: CRUD screen + `MemberTypeBadge`
- `src/screens/web/WebCRMScreen.tsx`: gated menu, type pickers, filter, badges, contact icons, coupon picker, sales-by-type report
- `src/screens/web/WebPOSScreen.tsx`, `src/screens/sale/PaymentScreen.tsx`: badges, type discount, points, coupon gate, sale snapshot
- `src/screens/member/AddMemberScreen.tsx`, `src/screens/member/MemberListScreen.tsx`: type picker; badge, filter chips, call icon
- `src/screens/promotion/*`: member-type targeting UI
- Tests: `memberTypeStore.test.ts`, `memberStore.memberType.test.ts`, `memberTypeBenefits.test.ts`, `memberCondition.test.ts`, `cartAdapter.test.ts` (+6)

Full diff: `git -C d:\pos-mobile\.worktrees\membertype diff main...feat/member-types`

</details>
