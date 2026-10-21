# Design Review — Variant Matrix + supplierId + categoryStore (task-vmat)

Reviewed: `d:\pos-mobile\.agents\tasks\task-vmat\design.md`
Target codebase: `d:\pos-mobile\.worktrees\vmat`
Scope of this round: confirm the one remaining MEDIUM (**M-1**, the web VariantSelector/master seam) is resolved with exact signatures, and that no new HIGH/MEDIUM gap was introduced. Source files read only to confirm the seams are real.

## Verdict

**APPROVED** — 0 HIGH, 0 MEDIUM. M-1 is resolved; all five verification targets (a–e) check out against real source. Remaining findings are NITs (non-blocking).

---

## Verification against the required targets

### (a) `__` cart-line id delimiter + deductStock split-on-`__` with REAL uom ids — CONFIRMED
- Current `productStore.deductStock` (verified, `src/store/productStore.ts`) uses `productId.split('_')[0]` to recover the master id — NOT a positional `slice(2)`. The design's change to `split('__')` first, then `left.split('_')[0]`, is a correct, additive evolution of the existing logic.
- Real ids verified in `src/data/mockProducts.ts`: master id `p1`, uom ids `u1_1`/`u1_2`/`u1_3`. So a non-variant cart id is `p1_u1_1`. The design's variant id `p1_u1_1__<variantId>` round-trips correctly: `split('__')` → `['p1_u1_1','<variantId>']`, then `'p1_u1_1'.split('_')[0]` → `p1`. The uom id itself contains an underscore (`u1_1`), which is exactly why the design mandates split-on-`__` first and forbids positional slicing — this is handled correctly.
- Test #3 pins this with real ids (`p1_u1_1__<variantId>`), including the negative guard (`Math.max(0,...)` already present in source).

### (b) resolveCartPrice variant arg guarded by `variant?.price != null`, precedence, tests safe — CONFIRMED
- Verified `src/utils/priceResolver.ts`: current signature is `resolveCartPrice(master, uom, branchId?)` returning `{ price, source }`, scaling `resolved.price * uom.ratio`. The design adds an optional 4th `variant?` arg with guard `variant?.price != null` and precedence **variant.price → branch resolvePrice → uom.salePrice base**, scaling variant.price by `uom.ratio` the same way. Because the arg is optional and the guard is null-checked, absent `variant` is byte-identical to today, keeping the 5 priceResolver + 14 cartAdapter tests green. Test #4 covers variant-wins, ratio scaling, and null fall-through.

### (c) M-1 web seam — how the master reaches VariantSelector in WebPOSScreen, concrete signatures — CONFIRMED (with one doc NIT)
- Verified `src/screens/web/WebPOSScreen.tsx`:
  - Grid view onPress (~line 2247) and list view onPress (~line 2294) BOTH compute `const baseId = p.id.split('_')[0]; const master = masterProducts.find(m => m.id === baseId);` inside the tap block, before choosing UOM-picker vs `handleProductTap(p)`. The design's insertion of the variant check in that same block, taking precedence over the UOM picker, is accurate and feasible — the master is genuinely in scope at both tap points.
  - `VariantSelectorProps` and `toCartProduct(master, uom, branchId?, variant?)` signatures are concrete and typed. The two-token-modal decision (mirroring the existing inline UOM picker split rather than one shared UI component) is recorded with reasoning and matches house style.
- NIT N-1 (below): the design claims `handleBarcodeSubmit` "already computes `baseId`/`master`" — it does not; it runs its own master/uom loop. This does not break the plan (the barcode path is separately replaced by shared `findProductByBarcode`), so it is a documentation inaccuracy, not a plan gap.

### (d) kiosk filtered out of variants — CONFIRMED
- Verified `src/screens/kiosk/KioskPOSSaleScreen.tsx`: grid source is `ALL_PRODUCTS = MOCK_PRODUCTS.flatMap(m => m.uoms.map(uom => toCartProduct(m, uom)))` and the barcode path calls `findProductByBarcode(barcode.trim(), MOCK_PRODUCTS)`. The design's predicate `products.filter(m => !(m.variants && m.variants.length))` applied at the `MOCK_PRODUCTS` source removes variant products from both the grid and barcode match. Feasible. See NIT N-2 for an explicitness note on the barcode-match arg.

### (e) categoryStore mirrors brandStore — CONFIRMED
- Verified `src/store/brandStore.ts`: zustand+persist `name: 'pos-brands'`, seed `[...MOCK_BRANDS]`, function-API `getBrands/getBrand/addBrand/updateBrand/deleteBrand` + `getBrandProductCount` (counts `useProductStore.getState().products.filter(p => p.brandId === id).length`), each mutation calls `logAction('แบรนด์', ...)`, exports `useBrandStore`.
- `MOCK_CATEGORIES` exists (`src/data/mockProducts.ts` line 9) and product mock data carries `categoryId` (e.g. `c1`), so `getCategoryProductCount` filtering on `p.categoryId === id` is sound.
- The design's categoryStore spec (`pos-categories`, seed `[...MOCK_CATEGORIES]`, `getCategories/getCategory/addCategory/updateCategory/deleteCategory` + `getCategoryProductCount`, `logAction('หมวดหมู่', ...)`, `useCategoryStore`) is a faithful mirror.

---

## Findings

1. **NIT (N-1) — Inaccurate claim that `handleBarcodeSubmit` computes `master` in scope.**
   In the "M-1 resolution" section the design states both grid branches AND `handleBarcodeSubmit` "already compute `const baseId = p.id.split('_')[0]; const master = masterProducts.find(...)`". Verified in `WebPOSScreen.tsx`: only `handleProductTap` and the two grid onPress blocks compute `baseId`/`master`. `handleBarcodeSubmit` (~line 1459) runs its own `for (const master of masterProducts) { for (const uom of master.uoms) ... }` loop and then calls `handleProductTap(found)`. The plan is unaffected because the design separately refactors `handleBarcodeSubmit` to call shared `findProductByBarcode` (which returns `variant?`), so the master-in-scope claim is not load-bearing there.
   **Fix:** reword to "both grid branches compute the master in scope; `handleBarcodeSubmit` is refactored to the shared `findProductByBarcode` which returns `{ product, uom, variant? }`, so the variant is determined there rather than via an in-scope master lookup."

2. **NIT (N-2) — Kiosk barcode-exclusion arg not stated explicitly.**
   The design says to "exclude their uom barcodes from the kiosk barcode match." Kiosk calls `findProductByBarcode(barcode, MOCK_PRODUCTS)` with the full `MOCK_PRODUCTS`. To actually exclude variant products, the implementer must pass the filtered array (the same `!(m.variants && m.variants.length)` predicate) into `findProductByBarcode`, not the raw `MOCK_PRODUCTS`.
   **Fix:** add "pass the same filtered product array into `findProductByBarcode` (not raw `MOCK_PRODUCTS`), and build `ALL_PRODUCTS` from the filtered list" to the kiosk section.

3. **NIT (N-3) — Kiosk has its own local 2-arg `toCartProduct`.**
   `KioskPOSSaleScreen.tsx` defines a local `toCartProduct(master, uom)` (line 35) and does not take `branchId`. The design's shared-`toCartProduct` migration list does not mention kiosk (correctly — kiosk is OUT of scope for variants). No change needed, but worth noting the kiosk copy stays as-is and is intentionally not migrated, so reviewers don't flag the divergence later.
   **Fix (optional):** one line in the kiosk/OUT-of-scope section: "kiosk keeps its existing local `toCartProduct`; it is not migrated to the shared helper."

---

## Verified Assumptions

- `deductStock` recovers master id via `split('_')[0]` (not positional slice) — true (`productStore.ts`).
- Real uom ids contain underscores (`u1_1`), master ids do not (`p1`), so `__` delimiter + split order is necessary and correct — true (`mockProducts.ts`).
- `resolveCartPrice` currently takes `(master, uom, branchId?)` and scales by `uom.ratio`; adding optional `variant?` with a null-guarded precedence is non-breaking — true (`priceResolver.ts`).
- In `WebPOSScreen`, both grid-view and list-view onPress blocks compute `baseId` + `master` before the UOM-picker decision — true (lines ~2247, ~2294).
- In `POSSaleScreen`, `handleProductPress`/`handleProductLongPress` compute `const master = products.find(m => product.id.startsWith(m.id + '_'))` — true (lines 444, 462); mobile has a local `UOMSelector` component and local `toCartProduct` to mirror — true (lines 69/77/43).
- `findProductByBarcode(barcode, products)` returns `{ product, uom } | null`, uom-barcode search only; a DEV IIFE folds uom barcodes into `seenBarcodes` — true (`mockProducts.ts` lines 253, 268+). Extensible to variant-first + variant-barcode uniqueness as designed.
- `brandStore` shape, persist key `pos-brands`, function-API, `getBrandProductCount`, `logAction('แบรนด์', ...)`, exported `useBrandStore` — true; categoryStore spec is a faithful mirror.
- `MOCK_CATEGORIES` exists and products carry `categoryId` — true, so `getCategoryProductCount` is sound.
- Kiosk builds its grid from `MOCK_PRODUCTS.flatMap(...)` and matches barcodes via `findProductByBarcode(..., MOCK_PRODUCTS)` — true; the design's filter predicate is applicable.

## Unverified / Wrong Assumptions

- **WRONG (minor):** design's statement that `handleBarcodeSubmit` "already computes" `baseId`/`master` — it does not (see N-1). Non-load-bearing because the barcode path is replaced by shared `findProductByBarcode`.
- **UNVERIFIED (not in scope to design here):** exact shape of `MOCK_CATEGORIES` entries (whether categories carry a `status` field like brands). The design does not rely on category status, and `getCategoryProductCount` filters on `categoryId`, so this does not affect the verdict. Flag for the implementer to confirm field parity when seeding `pos-categories`.
- **UNVERIFIED (integration-only, acknowledged by design):** VariantSelector modal wiring, authoring grid generation, and kiosk filtering are RN component behaviors verified by running the app, not by the unit suite — the design already classifies these as integration/manual.
