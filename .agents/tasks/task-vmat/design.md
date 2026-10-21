# Design — Variant Matrix + supplierId + categoryStore

## Overview

This design adds a product-variant matrix (TASK 1), an optional `supplierId` on products (TASK 2), and a `categoryStore` that mirrors the existing `brandStore` (TASK 3) to the Expo RN-Web POS CRM in `d:\pos-mobile\.worktrees\vmat`. The architecture, type shape, cart-id scheme, pricing precedence, and store conventions are already settled from three prior design rounds (see "Validated facts referenced" at the end). This document specifies only the delta: the exact type additions, the file-by-file change list, the exact function signatures for the web/mobile sale seam (the one remaining MEDIUM, M-1), and the test list. Tech stack is locked: TypeScript + React Native / React-Native-Web, Zustand + persist, the existing `src/components/ui` + `src/constants` (mobile) and `src/constants/webColors.ts` (web) design tokens. No new libraries.

## M-1 resolution — the web/mobile variant-selection seam (SETTLED HERE)

The blocker was: on web, `findProductByBarcode`/the grid hands `handleProductTap` a cart `Product`, but `VariantSelector` needs the MASTER (`ProductMaster`) to read `variants[]`. Reading both screens shows the master is **already resolved in scope at the exact tap point**, so no plumbing of the master through new props is needed — we reuse the existing lookup.

Web (`WebPOSScreen.tsx`): both grid branches (grid view ~line 2245 and list view ~line 2296) and `handleBarcodeSubmit` already compute:
```ts
const baseId = p.id.split('_')[0];
const master = masterProducts.find(m => m.id === baseId);
```
before deciding UOM-picker vs `handleProductTap`. We insert the variant check in the SAME block, taking precedence over the UOM picker.

Mobile (`POSSaleScreen.tsx`): `handleProductPress`/`handleProductLongPress` already compute `const master = products.find(m => product.id.startsWith(m.id + '_'))`. Same insertion point.

Exact new signatures (identical contract on both screens):

```ts
// VariantSelector.tsx — new shared UI component in src/components/ui? NO — see decision below.
interface VariantSelectorProps {
  visible: boolean;
  master: ProductMaster;          // source of truth for variants[]/options[]
  branchId?: string;
  onSelect: (cartProduct: Product, variant: ProductVariant) => void;
  onClose: () => void;
}

// Shared cart-line builder (replaces the three divergent toCartProduct copies' variant branch).
// Lives in src/utils/cartProduct.ts (new) and is imported by POSSaleScreen + WebPOSScreen.
export function toCartProduct(
  master: ProductMaster,
  uom: ProductUOM,
  branchId?: string,
  variant?: ProductVariant,      // NEW optional 4th arg — absent ⇒ byte-identical to today
): Product;
```

Decision — where `VariantSelector` lives: **two thin wrappers, one shared hook/helper is NOT warranted.** Mobile and web use different token systems (`Colors`/`Spacing` vs `WebColors`) and different modal chrome, exactly like the existing `UOMSelector` pattern (mobile has an inline `UOMSelector` component; web has the inline UOM picker modal at ~line 3220). So `VariantSelector` is implemented **twice, matching each screen's existing selector**: a mobile `VariantSelector` co-located in `POSSaleScreen.tsx` (or `src/components/sale/VariantSelector.tsx` mirroring `StaffPopup`), and a web inline variant-picker modal in `WebPOSScreen.tsx` mirroring the existing UOM picker modal. Both consume the SAME `master.options`/`master.variants` data and the SAME `toCartProduct(..., variant)` builder, so selection logic (compute selected variant → build cart line → `addItem`) is shared via `toCartProduct`. This matches house style and avoids forcing one token system onto the other screen.

Tap-handler precedence (both screens), evaluated against the already-in-scope `master`:
1. `master.productType === 'service'` → existing staff-popup path (unchanged).
2. `master.variants?.length` → open VariantSelector (NEW, takes precedence over UOM picker).
3. `master.uoms.length > 1` → existing UOM picker.
4. else → `addItem(toCartProduct(master, master.uoms[0], branchId))` (unchanged).

Barcode path (both screens): `findProductByBarcode` returns `{ product, uom, variant? }`. If `variant` is present → build the cart line directly with `toCartProduct(product, uom, branchId, variant)` and `addItem` (no modal — the barcode already identified the exact variant). If a variant-bearing product is matched by a NON-variant barcode (the master/uom barcode), open the VariantSelector instead, because the variant is ambiguous. This is the variant-barcode precedence rule.

## Type additions (`src/types/product.ts`)

```ts
export interface ProductOption {
  name: string;        // e.g. "สี", "ขนาด"
  values: string[];    // e.g. ["แดง","น้ำเงิน"]
}

export interface ProductVariant {
  id: string;                              // stable, unique within the master; used in cart id
  sku?: string;                            // optional variant SKU/code
  barcode?: string;                        // optional dedicated variant barcode
  price?: number;                          // optional per-variant price override (base unit)
  stockQty: number;                        // variant-level stock (base unit)
  optionValues: Record<string, string>;   // { "สี": "แดง", "ขนาด": "M" }
}
```
Add to `ProductMaster` (both optional, additive; a product with neither behaves exactly as today):
```ts
options?: ProductOption[];
variants?: ProductVariant[];
supplierId?: string;     // TASK 2
supplierName?: string;   // TASK 2 (denormalized for display, like brandName/categoryName)
```

## Cart-line id scheme & stock deduction (SETTLED — honor)

- Variant cart-line id = `` `${master.id}_${uom.id}__${variant.id}` `` (double-underscore before the variant segment). Non-variant id stays `` `${master.id}_${uom.id}` `` unchanged.
- `productStore.deductStock(productId, qty)` must split on `__` first to recover the variant id, then split the left part on `_` once to recover the master id. It must NOT use a positional `slice(2)`. When a variant id is present, deduct from `master.variants[i].stockQty`; otherwise deduct from `master.stockQty` as today. Add a negative-quantity guard (`Math.max(0, ...)` already present) and keep `qty` as raw cart-line qty (no ratio multiply — both callers pass raw qty). Exact new shape:
```ts
deductStock: (productId, qty) => set(s => ({
  products: s.products.map(p => {
    const [left, variantId] = productId.split('__');     // variantId may be undefined
    const masterId = left.split('_')[0];
    if (p.id !== masterId && p.id !== productId) return p;
    if (variantId && p.variants?.length) {
      return { ...p, variants: p.variants.map(v =>
        v.id === variantId ? { ...v, stockQty: Math.max(0, v.stockQty - qty) } : v) };
    }
    return { ...p, stockQty: Math.max(0, p.stockQty - qty) };
  }),
})),
```

## Pricing (`src/utils/priceResolver.ts`) — SETTLED

`resolveCartPrice(master, uom, branchId?, variant?)`. Guard `variant?.price != null`. Precedence: **variant.price (if set) → per-branch `resolvePrice(master.code, branchId)` → uom.salePrice base**. Per-variant per-branch pricing is OUT of scope. When `variant.price` is set it is a base-unit price and is scaled by `uom.ratio` the same way `resolved.price` is, so variant pricing stays correct across UOMs. Absent `variant` ⇒ identical to today (keeps the 5 priceResolver + 14 cartAdapter tests green).

## Shared barcode contract (`src/data/mockProducts.ts`)

`findProductByBarcode(barcode, products): { product: ProductMaster; uom: ProductUOM; variant?: ProductVariant } | null`. Search order: variant barcodes first (most specific), then uom barcodes, then master.barcode. Extend the existing DEV validation IIFE to also fold `variant.barcode` values into `seenBarcodes` so variant barcodes participate in uniqueness checking. WebPOSScreen's `handleBarcodeSubmit` currently inlines its own master/uom loop — refactor it to call this shared helper so web and mobile share one barcode path.

## Kiosk (OUT of scope — filtered)

`KioskPOSSaleScreen.tsx`: filter variant-bearing products out of the kiosk grid, and exclude their uom barcodes from the kiosk barcode match, so kiosk never reaches an undefined variant path. Filter predicate: `products.filter(m => !(m.variants && m.variants.length))`.

## Grid stock aggregation

New helper `masterDisplayStock(master): number` (in `src/utils/cartProduct.ts`): if `master.variants?.length`, return `sum(variants.stockQty)`; else return `master.stockQty`. Grids display this aggregate for variant products so a variant product with per-variant stock shows a meaningful total.

## Authoring UI

- `AddEditProductScreen.tsx` (mobile): add an Options editor (add/remove option name + values) that auto-generates an editable variant grid (cartesian product of option values); each variant row edits sku/barcode/price?/stockQty. Add a supplier picker (reads `supplierStore` via `getSuppliers()` — Supplier has NO status field, do not filter by status) and a category picker reading `categoryStore`. Save payload must ALWAYS include `options`, `variants`, `supplierId`, `supplierName` keys (even when empty/undefined) so edits can clear them.
- `WebProductScreen.tsx` (web): mirror options/variant-grid + supplier picker + category picker in the product modal if feasible with the existing modal; same always-include-keys rule.

## TASK 3 — categoryStore

New `src/store/categoryStore.ts` mirroring `brandStore.ts` exactly: zustand+persist `name: 'pos-categories'`, seed `[...MOCK_CATEGORIES]`, exported fns `getCategories/getCategory(getById)/addCategory/updateCategory/deleteCategory` + `getCategoryProductCount(id)` counting `useProductStore.getState().products.filter(p => p.categoryId === id).length`, each mutation calls `logAction('หมวดหมู่', ...)`, and export `useCategoryStore` hook. Wire category pickers in `AddEditProductScreen`, `WebProductScreen`, `ProductListScreen` (filter chips) and `ImportExportScreen` to read from `categoryStore`. In `ImportExportScreen`, category names must be derived reactively in-component via `getCategories()` — not a module-level const.

## File-by-file change list

| File | Change |
|---|---|
| `src/types/product.ts` | add `ProductOption`, `ProductVariant`; add `options?`,`variants?`,`supplierId?`,`supplierName?` to `ProductMaster` |
| `src/utils/cartProduct.ts` (NEW) | shared `toCartProduct(master,uom,branchId?,variant?)` + `masterDisplayStock(master)` |
| `src/utils/priceResolver.ts` | add `variant?` arg + `variant?.price != null` precedence |
| `src/data/mockProducts.ts` | `findProductByBarcode` returns `variant?`; DEV guard folds variant barcodes; add ≥1 variant-bearing mock product |
| `src/store/productStore.ts` | `deductStock` splits on `__`, deducts variant stock |
| `src/store/categoryStore.ts` (NEW) | mirror `brandStore` |
| `src/screens/sale/POSSaleScreen.tsx` | import shared `toCartProduct`; add variant branch in tap handlers + barcode; mobile `VariantSelector` |
| `src/screens/web/WebPOSScreen.tsx` | import shared `toCartProduct`; variant branch in both grid handlers + `handleBarcodeSubmit` (via shared `findProductByBarcode`); web variant-picker modal |
| `src/screens/kiosk/KioskPOSSaleScreen.tsx` | filter variant-bearing products + their barcodes out |
| `src/components/sale/VariantSelector.tsx` (NEW, mobile) | modal mirroring `StaffPopup`/`UOMSelector` pattern |
| `src/screens/products/AddEditProductScreen.tsx` | options/variant-grid editor + supplier picker + category picker; always-include save keys |
| `src/screens/web/WebProductScreen.tsx` | same authoring UI in modal if feasible |
| `src/screens/products/ProductListScreen.tsx` | category chips from `categoryStore` |
| `src/screens/.../ImportExportScreen.tsx` | category names reactive via `getCategories()` |
| `src/screens/.../CategoryManageScreen.tsx` | category tab wired to `categoryStore` |

## Error handling & validation

- Variant authoring: option name required & unique; each option needs ≥1 value; a generated variant must keep a non-negative integer `stockQty` (default 0) and, if `price` entered, `price >= 0`. Invalid rows block save with a Thai inline error (`<Alert type="error">` on web / existing error style on mobile). Recoverable — user corrects and retries; nothing logged (local form validation).
- Barcode uniqueness: enforced at the DEV guard layer (dev-only crash/log, fatal in dev, no-op in prod) because mock data owns uniqueness; runtime save in authoring screens validates the edited product's own variant barcodes against duplicates within that product and surfaces a Thai inline error (recoverable).
- `deductStock` with an unknown variant id: no matching variant → falls through to master-level deduction guarded by `Math.max(0,...)`; non-fatal, not logged (defensive).
- `resolveCartPrice` with `variant.price == null`: silently falls through to branch/base precedence (expected, not an error).
- Supplier/category picker when store empty: show Thai empty state ("ไม่มีข้อมูล") per design-system; selection optional, so save proceeds with `supplierId` undefined.

## Invariants & ownership

- Cart-id format (`_` single vs `__` variant delimiter) is owned by `toCartProduct` (producer) and `deductStock` (consumer); both must agree and are pinned by tests using REAL uom ids.
- Variant-stock source of truth is `master.variants[].stockQty`; `masterDisplayStock` is derived read-only.
- Save-payload completeness (always include option/variant/supplier keys) owned by the authoring screens.

## OUT of scope (noted)

Per-variant per-branch pricing; stock-document (receive/issue/adjust) variant handling — stock docs continue to operate at master level for now; CSV import of variants; kiosk variant support.

## Tests

1. `cartProduct` — `toCartProduct` without `variant` is byte-identical to the current output (id, price, stock) → protects the 14 cartAdapter tests.
2. `cartProduct` — `toCartProduct` with a variant builds id `` `${master.id}_${uom.id}__${variant.id}` `` and uses variant price when set.
3. `productStore.deductStock` — using REAL ids (`p1_u1_1__<variantId>`): deducts the correct `variants[i].stockQty`, leaves others untouched; non-variant id still deducts `master.stockQty`; negative guard holds (qty > stock ⇒ 0, never negative).
4. `priceResolver` — existing 5 tests unchanged; new: variant price wins; variant price scales by `uom.ratio`; `variant.price == null` falls through to branch then base.
5. `findProductByBarcode` — variant barcode returns `variant`; uom barcode on a variant product returns no `variant` (→ modal path); master barcode on a plain product unchanged.
6. `masterDisplayStock` — sums variant stock; equals `master.stockQty` for plain products.
7. `categoryStore` — add/update/delete + `getCategoryProductCount` reflects `productStore`; persist key `pos-categories`.

Unit-testable: items 1–7 (all pure fns / stores). Integration/manual: VariantSelector modal wiring on mobile + web, authoring grid generation, kiosk filtering (RN component render — verify by running the app; not in the unit suite).

## Validated facts referenced (not re-derived)

ID/underscore facts, `__` delimiter, raw-qty `deductStock`, `resolveCartPrice` guard & precedence, three `toCartProduct` copies, kiosk-out, shared `findProductByBarcode` contract, Supplier has no status, supplier/brand function-API + exported hook, ImportExport reactive category names, always-include save keys, categoryStore mirrors brandStore — all per the task's ALREADY-VALIDATED DESIGN FACTS.

## Responses to review findings

First iteration from a nearly-approved prior design. Resolved the single remaining MEDIUM **M-1**: the web variant seam is pinned — the MASTER is already in scope at the tap point in both grid branches and `handleBarcodeSubmit` (`masterProducts.find(m => m.id === baseId)`), so VariantSelector receives `master` directly via `VariantSelectorProps.master` with no new prop plumbing; exact `toCartProduct(master, uom, branchId?, variant?)` and `VariantSelectorProps` signatures are specified, and the decision to implement two token-matched modals (mirroring the existing UOM selector split) rather than one shared UI component is recorded with reasoning.
