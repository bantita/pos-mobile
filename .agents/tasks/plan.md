# Implementation Plan — Product-Master + Pricing Fix

Worktree (ALL work here, absolute paths): `d:\pos-mobile\.worktrees\pricing-fix`
Git: `git -C d:\pos-mobile\.worktrees\pricing-fix ...`
Authoritative spec: `.agents/tasks/gap-analysis-round2.md` Section 1 + Section 5A (items 1–9).
Baseline: `.agents/tasks/baseline.md` — 13 pre-existing tsc errors; `npm test` = 14 cartAdapter pass + engine self-test 39/0 + 3 pre-existing suite-load failures. Do NOT regress passing tests; do NOT add new tsc errors in touched files.

Design-system steering (`.kiro/steering`): use real tokens (`src/constants/colors.ts|typography.ts|spacing.ts`, `webColors.ts` for web screens), components in `src/components/ui`; all user-facing text Thai; loading/error/empty states on new screens; TypeScript, no `any` abuse.

---

## KEY DESIGN DECISIONS (resolved here — do NOT re-decide)

### Decision A — Canonical branch-id scheme = `b1`, `b2`, `b3`
Evidence read: `branchPermissionStore.ts` (default `activeBranchId: 'b1'`, entries use `b1/b2/b3`), `useBranchGuard.ts` (reads `activeBranchId` + `getBranches()`), `useUserBranches.ts` (`ALL_BRANCHES = [{id:'b1',name:'สาขาหลัก'},{id:'b2',name:'สาขา 1'},{id:'b3',name:'สาขา เชียงใหม่'}]`), `branchStore.ts` (empty at runtime — `MOCK_BRANCHES` never seeded; `setBranches`/`mockBranches` referenced nowhere in `src`).
Rationale: the ACTIVE-branch plumbing already live at runtime uses `b1/b2/b3`. `mockBranches.ts` (`branch-001..003`) and `WebPricingScreen` (`br1..3`) are NOT wired to the active-branch path; `pricingStore` MOCK_DOCS use `branch-01/02` which match nothing. Align everything to `b1/b2/b3`.
Actions:
- `src/store/pricingStore.ts` MOCK_DOCS: `branchId: 'branch-01'` → `'b1'` (branchName `'สาขาหลัก'`), `branchId: 'branch-02'` → `'b2'` (branchName `'สาขา 1'`). Keep the central doc unchanged.
- `src/data/mockBranches.ts` `MOCK_BRANCHES`: retarget the 3 ids to `b1/b2/b3` with names matching `useUserBranches.ALL_BRANCHES` (`สาขาหลัก`, `สาขา 1`, `สาขา เชียงใหม่`). (This file is currently unused but align it to avoid a future third scheme; do not add new wiring.)
- Do NOT touch `useUserBranches.ALL_BRANCHES` (already canonical). Do NOT touch `branchPermissionStore` default (already `b1`).

### Decision B — resolvePrice key = product CODE (`P001`), not master id (`p1`)
Evidence read: `pricingStore.ts` MOCK_DOCS items use `productId: 'P001'`; `mockProducts.ts` masters have `id: 'p1'`, `code: 'P001'`. `pricing_import_template.csv` keys rows by `รหัสสินค้า` = `P001`. So the pricing domain is keyed by product CODE.
Decision: at the resolve boundary, call `resolvePrice(master.code, branchId)` (pass the master CODE, not the master id, not the cart `masterId_uomId`). The cart product id is `${master.id}_${uom.id}` (e.g. `p1_u1_1`); map cart line → master via `masterProducts.find(m => m.id === p.id.split('_')[0])` (pattern already used in `WebPOSScreen.handleProductTap`), then use `master.code`.

### Decision C — UOM × branch-price interaction = branch price is the BASE-UNIT price; scale by UOM ratio
Evidence read: `ProductUOM.ratio` (1 base-unit multiple), `uom.salePrice` is per-UOM; pricing docs carry one `newPrice` per product with `unit` = base unit (e.g. `ขวด`). `toCartProduct` sets `price: uom.salePrice`.
Decision: treat `resolvePrice().price` as the price of ONE base unit. Resolved per-UOM price = `resolved.price * uom.ratio`. For the base UOM (`ratio:1`) this equals `resolved.price`. If no doc resolves, fall back to `uom.salePrice` (current behaviour). Round to 2 decimals. Document this in a code comment at the resolve site.

### Decision D — Resolve at the add-to-cart boundary (toCartProduct site), not inside cartStore
Rationale: `toCartProduct` already has both `master` (→ code, ratio) and `uom`; the active branch is available via `useBranchGuard()` in the screen. Resolving here keeps `cartStore.addItem` pure and preserves the promo pipeline order (branch/base price → item/bill discount → engine promos → points → service charge). Put the resolution in a small shared pure helper so both screens + the unit test use identical logic.

### Decision E — CSV parsing = hand-rolled, no new dependency
Evidence: `package.json` has no `papaparse`; it has `react-native-qrcode-svg`. The template is simple comma-delimited with a BOM. Hand-roll a minimal CSV line splitter (handle `\ufeff` BOM, CRLF/LF, quoted fields optional) rather than adding a dependency. Web-only parsing via `FileReader`.

### Decision F — Product image = web `<input type=file>` + FileReader data URI
Evidence: `package.json` has NO `expo-image-picker`. Do not add a heavy native dep for a mock/web target. Use a hidden `<input type="file" accept="image/*">` (web) read via `FileReader.readAsDataURL` into `product.image`; show preview. Guard with `Platform.OS === 'web'`; on native, keep a no-op with a Thai “รองรับเฉพาะเว็บในเวอร์ชันนี้” note.

### NEEDS-VERIFICATION-AT-RUNTIME (coder must confirm, do not assume)
1. `AddEditProductScreen.onSaved` is wired in `ProductNavigator.tsx` to only `goBack()` — it does NOT call `productStore.addProduct/updateProduct`. Mobile edits may not persist to the store today. For item 7 (audit log), fire `logAction` inside `handleSave` regardless. Verify whether mobile save should also persist; if out of scope, note it, do not silently expand.
2. Camera barcode scan and native file/image pickers can only be confirmed on a device/web runtime, not by reading. Verify item 2 scan + item 3 import + item 6 image on web at runtime.
3. `branchStore` is empty at runtime; `BranchSelector` falls back. Confirm `useBranchGuard().activeBranchId` returns `'b1'` by default at runtime so resolution has a real branch id to work with.

---

## ORDERED ITEMS

- [ ] 1. Unify branch ids to `b1/b2/b3` (Decision A).
      Files: `src/store/pricingStore.ts` (MOCK_DOCS branchId/branchName), `src/data/mockBranches.ts` (MOCK_BRANCHES ids/names).
      Verify: `npx tsc --noEmit` shows no NEW errors in these files; `npm test` still 14/39 green.

- [ ] 2. Add a shared pure price-resolution helper.
      Create `resolveCartPrice(master, uom, branchId)` → returns `{ price, source }` using `usePricingStore.getState().resolvePrice(master.code, branchId)`; if hit, `price = round2(resolved.price * uom.ratio)`, else `price = uom.salePrice` (Decisions B+C). Pure, no React, importable by screens AND vitest.
      Files: new `src/utils/priceResolver.ts` (or `src/engine/adapter/priceResolver.ts` — pick one and keep it).
      Verify: `npx tsc --noEmit` clean for the new file.

- [ ] 3. Wire helper + active branch into the sale flow (mobile + web) and switch POSSaleScreen to productStore.
      In `WebPOSScreen.tsx` and `POSSaleScreen.tsx`: read `activeBranchId` via `useBranchGuard()`; make `toCartProduct` (or its call sites) use `resolveCartPrice(master, uom, activeBranchId)` for `price`. POSSaleScreen must source products from `useProductStore().products` (mirror WebPOSScreen `masterProducts`/`ALL_BASE` reactive pattern) instead of static `MOCK_PRODUCTS`/`ALL_CART_PRODUCTS`. Keep barcode scan + UOM selector working. Optionally show active branch name on the POS header. Order stays: branch/base price → item/bill discount → engine promos → points → service charge (unchanged in PaymentScreen).
      Files: `src/screens/web/WebPOSScreen.tsx`, `src/screens/sale/POSSaleScreen.tsx`.
      Verify: `npx tsc --noEmit` no new errors in touched files; manual runtime note: switching active branch changes resolved price for a product with an active branch doc.

- [ ] 4. Add vitest for per-branch price resolution (test 1e).
      Cover: product with an active branch doc at branch `b1` → cart line uses the branch price (× ratio for a non-base UOM); same product at branch `b3` (no doc) → falls back to `uom.salePrice`; central doc applies when no branch doc. Use the real `usePricingStore`/mock docs or inject docs; style after `src/engine/adapter/__tests__/cartAdapter.test.ts`.
      Files: new `src/utils/__tests__/priceResolver.test.ts` (or alongside the helper).
      Verify: `npm test` — new suite passes; cartAdapter 14 + engine 39/0 unchanged.

- [ ] 5. Per-line VAT (item 8).
      Rework `cartStore.getVatAmount` to compute VAT per line from each line's `product.vatIncluded`/`product.vatRate` (rate 0 or 7): exclusive → `lineNet * rate/100`; inclusive → `lineNet - lineNet/(1+rate/100)`; sum lines. `lineNet` = per-line subtotal after its item discount, proportionally reduced by the bill-level discount so totals stay consistent. Keep `getGrandTotal` correct (inclusive items must not double-add VAT). Update `PaymentScreen.tsx` VAT label if the flat-7% assumption no longer holds (e.g. drop hardcoded “VAT 7% (รวมแล้ว)” when mixed).
      Files: `src/store/cartStore.ts`, `src/screens/sale/PaymentScreen.tsx`.
      Verify: `npm test` — new mixed-VAT test passes; do not regress existing cart totals.

- [ ] 6. Add vitest for mixed-VAT lines (test 8).
      Cover: inclusive 7% line + exclusive 7% line + 0% line → `getVatAmount` equals the hand-computed sum; grand total unchanged for inclusive, increased correctly for exclusive; with a bill discount applied.
      Files: new `src/store/__tests__/cartVat.test.ts`.
      Verify: `npm test` — passes; engine/cartAdapter unchanged.

- [ ] 7. Real CSV import + export in ImportExportScreen (item 3).
      Replace static `MOCK_IMPORT`: `handleSelectFile` opens a web file picker, `FileReader.readAsText` the CSV, hand-parse rows against `public/templates/pricing_import_template.csv` columns + product fields (Decision E), build `ImportRow[]` with per-row validation + error summary, render a REAL preview. On confirm, call `productStore.addProduct/updateProduct` for each valid row. Make `handleExport` emit a real CSV via Blob/`URL.createObjectURL` (reuse the pattern from the dead `WebPricingScreen.tsx` before it is deleted). `handleDownloadTemplate` serves the real template. Thai UI, keep loading/error/empty states.
      Files: `src/screens/product/ImportExportScreen.tsx`.
      Verify: `npx tsc --noEmit` no new errors; runtime note: import a sample CSV adds/updates products in the store; export downloads a CSV.

- [ ] 8. Wire product image button (item 6, Decision F).
      Give the `เพิ่มรูปภาพ` TouchableOpacity in `AddEditProductScreen.tsx` an `onPress` that (web) triggers a hidden `<input type=file accept="image/*">`, reads via `FileReader.readAsDataURL`, stores the data URI into the product `image` state, and shows a preview; native → Thai “รองรับเฉพาะเว็บในเวอร์ชันนี้”. Include the image in the `saved` object in `handleSave`.
      Files: `src/screens/product/AddEditProductScreen.tsx`.
      Verify: `npx tsc --noEmit` no new errors; runtime note: selecting an image shows a preview and persists into the saved product.

- [ ] 9. Real audit log on price change (item 7).
      Replace the `console.log('[AUDIT] PRICE_CHANGE ...')` in `AddEditProductScreen.handleSave` with `logAction('สินค้า', 'เปลี่ยนราคา', '<Thai desc old→new>', { productId, old, new })` imported from `src/store/auditLogStore.ts` (signature: `logAction(module, action, description, metadata?)`). Fire only when editing and `salePrice` changed.
      Files: `src/screens/product/AddEditProductScreen.tsx`.
      Verify: `npx tsc --noEmit` no new errors.

- [ ] 10. Remove dead WebPricingScreen (item 4).
      Confirm via grep it is imported nowhere except itself (verified: WebNavigator routes only `WebPricingModuleScreen`). Migrate the Blob CSV export/template helper into ImportExportScreen (item 7) first, then delete `src/screens/web/WebPricingScreen.tsx`. Do not break the `pricing` route.
      Files: delete `src/screens/web/WebPricingScreen.tsx`.
      Verify: `npx tsc --noEmit` no new errors; `pricing` route still renders `WebPricingModuleScreen`.

- [ ] 11. (OPTIONAL — item 9, only if 1–10 solid) Supplier master type + store + minimal Thai CRUD screen, and/or brand CRUD. Product-variant matrix remains out of scope — state so explicitly.
      Files: new `src/types/supplier.ts`, `src/store/supplierStore.ts`, a screen under `src/screens/...`.
      Verify: `npx tsc --noEmit` no new errors; new screen renders with loading/error/empty states.

## OUT OF SCOPE (per task)
- Item 10 (web sync settings) — OUT OF SCOPE.
- Product-variant matrix — not implemented; note explicitly rather than drop silently.

## FINAL VERIFICATION (whole task)
- `npx tsc --noEmit` → still only the 13 pre-existing errors; zero new errors in any touched file.
- `npm test` → cartAdapter 14 pass + engine self-test 39/0 + two NEW suites (per-branch price, mixed VAT) pass; the 3 pre-existing suite-load failures may remain.
