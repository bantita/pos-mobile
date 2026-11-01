# Verification — ประเภทสมาชิก (Member Types)

Branch: `feat/member-types` (worktree `d:\pos-mobile\.worktrees\membertype`), base `24761d5`.
User request: "เพิ่มประเภทสมาชิกเช่นประเภท พนักงาน ลูกค้าทั่วไป"

Member TYPE is separate from member LEVEL. `level`, `MOCK_LEVEL_CONFIGS`, `levelConfigs` and auto-upgrade were not changed.

## Lint / test (before → after)

| Check | Baseline | After |
|---|---|---|
| `npm run lint` (tsc --noEmit) | 13 errors in 6 files | 13 errors, same 6 files (BranchSelector, DatePicker, PermissionMatrixScreen, RoleManageScreen, WebUserStaffScreen, errorTracking). 0 errors in touched files |
| `npm test` (vitest) | 135 passed, 13 files passed, 3 suites fail to load | 193 passed (135 + 58 new), 17 files passed, same 3 suite-load failures (engine.test.ts, SyncService.test.ts, branchPermissionStore.test.ts) |

New tests (58):
- `src/store/__tests__/memberTypeStore.test.ts` (28): seed, validation (empty or duplicate name, discount 0–100, multiplier 0–10), add/update, rename updates `memberTypeName`, exactly one default, can't deactivate or unset the default, inactive type can't become default, delete blocked for the default type and for types in use (returns memberCount), reassign then delete, `resolveMemberType` fallbacks, `ensureMemberTypeInvariants` (empty / no default / two defaults / already valid).
- `src/store/__tests__/memberStore.memberType.test.ts` (12): `migrateMembersToV1` plus persist `migrate` v0→v1, `addMember` defaults to ลูกค้าทั่วไป, `updateMember` updates the type name, `searchMembers('พนักงาน')`, earn rules (default type unchanged, earnPoints=false → no points and no transaction but totalSpent still grows, multiplier ×2, inactive type falls back to the default), `promoStore.validateCoupon` member-type gate.
- `src/utils/__tests__/memberTypeBenefits.test.ts` (7): `calcEarnedPoints`, `computeMemberTypeDiscount`, label.
- `src/engine/conditions/__tests__/memberCondition.test.ts` (5): member type match / no match / no member / levels AND types / no types configured behaves as before.
- `src/engine/adapter/__tests__/cartAdapter.test.ts` (+6): staff 10% → applied benefit "ส่วนลดพนักงาน 10%" = 100 on 1000; 0% type / no member / no memberType arg → same totals as before; NO_STACK promo already applied → type discount rejected; STACK_ALLOWED → both applied; `applicableMemberTypeIds` gates a percent promo; `member_price` levels AND types.

## Files changed

New:
- `src/types/memberType.ts`: `MemberType`, `MemberTypeColorKey`, `MemberTypeBenefit`
- `src/constants/memberTypeColors.ts`: maps color key → token pair (web `WebColors`, mobile `Colors`)
- `src/data/mockMemberTypes.ts`: seeds ลูกค้าทั่วไป (`mt-general`, default) and พนักงาน (`mt-staff`, 0%, earns points, ×1)
- `src/utils/memberTypeBenefits.ts`: `calcEarnedPoints`, `computeMemberTypeDiscount`, `memberTypeDiscountLabel` (pure)
- `src/store/memberTypeStore.ts`: zustand + persist `pos-member-types` v1, function API + `useMemberTypeStore`, `logAction('ประเภทสมาชิก', …)`
- `src/screens/web/WebMemberTypeScreen.tsx`: CRUD screen + `MemberTypeBadge`
- 4 test files listed above (cartAdapter test extended)

Modified:
- `src/types/member.ts` (`memberTypeId?`, `memberTypeName?`), `src/types/promotion.ts` (`applicableMemberTypeIds?`)
- `src/data/mockMembers.ts`: every mock member gets a type; mem-003 and mem-008 are พนักงาน
- `src/store/memberStore.ts`: persist v1 + migrate, default type in `addMember`, type name refresh and log in `updateMember`, search by type name, type-aware `earnPoints` (returns `PointTransaction | null`)
- `src/store/promoStore.ts`: `validateCoupon(..., memberTypeId?)` type gate
- `src/store/saleHistoryStore.ts`: `SaleRecord.memberTypeId?/memberTypeName?`
- Engine: `types/inputs.ts`, `types/internal.ts`, `core/engine.ts` (`memberTypeId` in request/context), `conditions/evaluators/member.ts` (`memberTypeIds`), `adapter/cartAdapter.ts`
- `src/constants/rolePermissions.ts`: new key `crm_member_types` (CRM group, also in manager defaults; admin/owner get it automatically)
- `src/screens/web/WebCRMScreen.tsx`: menu "ประเภทสมาชิก" (gated), type picker in add/edit, type column/badge, type filter chips, call/chat icons, coupon type picker, report card "ยอดขายตามประเภทสมาชิก"
- `src/screens/member/AddMemberScreen.tsx` (type picker), `src/screens/member/MemberListScreen.tsx` (badge, filter chips, call icon, empty state)
- `src/screens/sale/PaymentScreen.tsx`, `src/screens/web/WebPOSScreen.tsx`: badges, discount, points, coupon gate, sale snapshot
- `src/screens/promotion/MemberPriceScreen.tsx`, `components/PromoConditionTabs.tsx`, `StorePromoCreateScreen.tsx`: member-type targeting

Not touched (owned by other workflows): `masterImportExport.ts`, WebProductScreen, WebBrandScreen, WebSupplierScreen, ImportExportScreen, import UI components, WebAdSettingsScreen, customerDisplayStore and customer display screens. The `memberInfo` object sent to the customer display in WebPOSScreen keeps the same shape. `dist/` not touched.

## Design decisions

- **Colors** are stored as a token key (`gray|blue|green|orange|red|purple`), not hex. Each platform maps the key to its own tokens.
- **Type discount, mobile POS (`PaymentScreen`, uses the promotion engine).** The adapter adds one synthetic promotion when the selected member's resolved type has `discountPercent > 0`:
  - id `member-type:<id>`
  - name `ส่วนลด<ชื่อ> x%` (for example "ส่วนลดพนักงาน 10%")
  - `percent_discount`
  - condition `member{memberTypeIds:[id]}`
  - `STACK_ALLOWED`, priority 9999

  It shows up in `appliedBenefits`, so the applied-promotions list in the bill shows "โปรฯ · ส่วนลดพนักงาน 10%".
- **Stacking.** The resolver sorts by priority ascending, so the type discount is evaluated last:
  - It never blocks an existing promotion.
  - If a NO_STACK promotion was already applied, it is rejected ("Cannot stack with NO_STACK promotion").
  - Otherwise it stacks with STACK_ALLOWED promotions.

  Like every engine promotion, the percent is computed on the original line amounts, not on what remains after other promotions.
- **Type discount, web POS (`WebPOSScreen`, does not use the engine; it has its own manual bill-discount, coupon and points pipeline).** Here the type discount is a clearly labelled bill-discount line "ส่วนลด<ชื่อ> x%":
  - `memberTypeDiscount = computeMemberTypeDiscount(afterDisc, type)`, computed after the manual bill discount and before coupon and points.
  - `grandTotal = max(0, afterDisc − memberTypeDiscount − coupon − points)`
  - It is included in the saved sale's `discountTotal`.
  - The coupon is still computed on `afterDisc`, as before.
- **Points.** `calcEarnedPoints(amount, earnRate, type)`:
  - `earnPoints=false` → 0.
  - Otherwise `floor(amount / earnRate × multiplier)`.
  - For the default type (earn, ×1) this equals the old `floor(amount / earnRate)`, so there is no behavior change.
  - `memberStore.earnPoints` applies the rule. For a type that doesn't earn points, it still adds `totalSpent` (so level upgrades keep working), creates no point transaction, and returns `null`. The displayed "pointsEarned" on both POS screens uses the same helper.
- **Resolution.** `resolveMemberType(member)` returns the member's type if it exists and is active, otherwise the current default type. Badges show the member's own type, and the back office adds "(ปิดใช้งาน)" for inactive types.
- **Migration.**
  - `pos-members` persist is now v1. `migrate` gives every stored member without `memberTypeId` the type ลูกค้าทั่วไป (`migrateMembersToV1`, exported and tested).
  - `pos-member-types` uses `merge` + `ensureMemberTypeInvariants`: an empty list is reseeded, and there is always exactly one default, which is active.
  - Member types are configuration, so they are seeded even for a fresh store.
- **Rules enforced in the store** (functions return `{ ok, error }`; nothing throws):
  - There is exactly one default.
  - The default can't be deleted, deactivated or unset directly.
  - Inactive types can't become the default.
  - A type in use can't be deleted: the error gives the member count, and the UI offers reassign-then-delete.
  - Renaming a type updates `memberTypeName` on its members.
- **Management UI.** CRM sidebar/tab menu "ประเภทสมาชิก" (after ระดับสมาชิก), gated by `canAccess(user.role, 'crm_member_types')`. It shows all menus when there is no user, matching WebSidebar.
  - States: loading (persist hydration), error banner, empty state "ไม่มีข้อมูล".
  - Note: roles whose permissions were customised and saved before this change won't have the new key until it is ticked in the Permission Matrix (admin is always allowed).
- **Targeting.** The engine member condition now accepts `memberTypeIds`, AND-combined with `levels`. The adapter applies `applicableMemberTypeIds` to any mapped promotion. UI:
  - `MemberPriceScreen`: type checkboxes; validation is now "level or type, at least one".
  - Web CRM coupon form: optional type picker.
  - `PromoConditionTabs` สมาชิก tab: type chips. `StorePromoCreateScreen` holds the state, but its save is still a mock, so nothing new is persisted there.
  - `validateCoupon` rejects with "คูปองนี้ใช้ได้เฉพาะประเภทสมาชิกที่กำหนด".
  - The WebPOS member modal's available-coupon list respects types.

## Deferred / skipped

- `requireStaffLink`: deferred. `staffStore` holds service technicians, and linking to employees would need cross-store identity matching, which is not low-risk.
- Broadcast/segment targeting by type: deferred. The existing "level" target in `communicationStore` is a placeholder count with no member↔contact link, so a type target would be equally fake.
- Member-type import/export: deferred, as instructed.
- Reports: done (low-risk). New sales snapshot `memberTypeId`/`memberTypeName` (WebPOS now also stores `memberId`). The CRM report has a real "ยอดขายตามประเภทสมาชิก" card. Older member bills show as "ไม่ระบุ" and non-member bills as "ไม่ใช่สมาชิก".
- There is no mobile edit-member screen (none existed). Changing a member's type is done in the web CRM detail → แก้ไข.
- The WebPOS printed receipt's "discount" field still shows only the manual bill discount, as it already did for coupons. The grand total on the receipt is correct.

## Not manually verified

UI was not run in a browser or device (no dev server in this step). Typecheck and unit tests cover store, engine and adapter logic. Screen rendering, the Switch/Modal interactions and `Linking` (tel:/sms:) need a manual pass.

## Reviewer walkthrough

1. Web → CRM → **ประเภทสมาชิก**. Edit **พนักงาน**: discount 10, turn off **สะสมคะแนน**, save. The card shows "ส่วนลด 10%", "สะสมคะแนน: ไม่ได้" and "สมาชิก 2 คน" (mem-003 วิชัย, mem-008 กัญญา).
2. CRM → ข้อมูลสมาชิก → open a member (for example สมชาย) → แก้ไข → choose ประเภทสมาชิก "พนักงาน" → บันทึก. The badge next to "ประเภทสมาชิก" changes to พนักงาน, and the พนักงาน card count becomes 3.
3. POS (mobile PaymentScreen) → เลือกสมาชิก: rows show a blue "พนักงาน" badge. Select the staff member: the summary shows "โปรฯ · ส่วนลดพนักงาน 10%  -฿x" and the total drops 10%. On web POS the summary row reads "ส่วนลดพนักงาน 10%".
4. Pay → the member's point balance is unchanged, no new point transaction appears, and ยอดซื้อสะสม increases. The sale record has `memberTypeName: 'พนักงาน'`.
5. Repeat with a ลูกค้าทั่วไป member: no extra discount line, and points = floor(total / 25), exactly as before.
6. Promotion targeting: Promotion → ราคาสมาชิก → tick only ประเภท "พนักงาน", 5%. It applies at POS only for staff members, not for ลูกค้าทั่วไป or walk-in. The same applies to a CRM coupon created with ประเภทสมาชิกที่ใช้ได้ = พนักงาน: a general member gets "คูปองนี้ใช้ได้เฉพาะประเภทสมาชิกที่กำหนด".
7. CRM list: tap the "พนักงาน" filter chip → only staff are listed. Typing "พนักงาน" in search also finds them. The mobile MemberListScreen has the same chips and a call icon per row.
8. Delete พนักงาน while it's in use → the modal says "มีสมาชิก N คนใช้ประเภทนี้อยู่…" with "ย้ายสมาชิกไปยัง". Choose ลูกค้าทั่วไป → "ย้ายสมาชิกและลบ". The default type's ลบ button is disabled, with the hint "ประเภทเริ่มต้นลบหรือปิดใช้งานไม่ได้".
