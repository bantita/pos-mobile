# Implementation Plan — Variant Matrix + supplierId + categoryStore (task-vmat)

Target worktree: `d:\pos-mobile\.worktrees\vmat`. All paths below are relative to that worktree's `src/`.

Build/test facts (verified against the worktree):
- Test runner: `npm test` → `vitest run`. Lint/type-check: `npm run lint` → `tsc --noEmit`.
- 3 of 6 existing test files (`branchPermissionStore`, `cartVat`, `SyncService`) FAIL TO LOAD under vitest because they import `react-native` directly without mocking it — this is a pre-existing baseline condition, NOT something this task introduces or must fix. Do not touch them.
- Green baseline this task must preserve: `npx vitest run src/engine/adapter/__tests__/cartAdapter.test.ts src/utils/__tests__/priceResolver.test.ts` → **19 passed** (14 cartAdapter + 5 priceResolver).
- Any NEW test that imports a store (productStore/categoryStore) transitively imports `react-native` + AsyncStorage via `persistStorage.ts`. It MUST mock both exactly like `src/utils/__tests__/priceResolver.test.ts` does:
  `vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));`
  `vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} } }));`
  With `Platform.OS: 'web'`, persist uses `localStorage` (happy-dom provides it).
- Modern-red theme is ALREADY in `src/constants/colors.ts` (`PRIMARY = '#E23744'`) and flows into `webColors.ts`. Do NOT hardcode colors; read tokens from `Colors`/`WebColors`.

Design-system rules apply to every screen edit: no hardcoded color/font/spacing/radius/shadow (use `Colors.*`/`Typography.*`/`Spacing.*`/`BorderRadius.*`/`Shadow.*`); use `@/components/ui` components; Thai UI text; loading/error (`<Alert type="error">`)/empty states; 44px touch targets; no `any`; TypeScript interfaces for props.

OUT of scope (note in code where relevant): per-variant per-branch pricing; variants in kiosk; stock-document variant handling (stock docs stay master-level); CSV import of variants.

---

## Phase A — Shared foundation (types, utils, stores, mock data, deductStock)

- [ ] 1. Add variant/supplier types to `ProductMaster`.
      Add `ProductOption { name: string; values: string[] }` and `ProductVariant { id: string; sku?: string; barcode?: string; price?: number; stockQty: number; optionValues: Record<string,string> }`. Add optional `options?`, `variants?`, `supplierId?`, `supplierName?` to `ProductMaster`. All additive/optional.
      Files: `src/types/product.ts`
      Verify: `npm run lint` passes (no type errors).

- [ ] 2. Create shared `toCartProduct` + `masterDisplayStock`.
      New module exporting `toCartProduct(master, uom, branchId?, variant?)` returning a `Product` whose id is `` `${master.id}_${uom.id}` `` when no variant, `` `${master.id}_${uom.id}__${variant.id}` `` when a variant is given; price via `resolveCartPrice(master, uom, branchId, variant)`; name appends variant option values when present. Also `masterDisplayStock(master)` = `sum(variants.stockQty)` if `variants?.length` else `master.stockQty`. Absent `variant` MUST produce byte-identical output to the current inline `toCartProduct` copies (id/price/name/stock).
      Files: `src/utils/cartProduct.ts` (new)
      Verify: `npm run lint` passes.

- [ ] 3. Add `variant?` arg to `resolveCartPrice`.
      Signature `resolveCartPrice(master, uom, branchId?, variant?)`. Precedence: if `variant?.price != null` → `round2(variant.price * uom.ratio)` with `source: 'base'`; else existing branch/central resolve; else `uom.salePrice` base. Optional arg + null guard keeps all 5 existing tests green.
      Files: `src/utils/priceResolver.ts`
      Verify: `npx vitest run src/utils/__tests__/priceResolver.test.ts` → 5 pass unchanged.

- [ ] 4. Extend `findProductByBarcode` + DEV guard + add a variant-bearing mock product and `MOCK_CATEGORIES` field parity note.
      Return type `{ product; uom; variant? } | null`. Search order: variant barcodes first, then uom barcodes, then `master.barcode`. Extend the DEV validation IIFE to fold `variant.barcode` values into `seenBarcodes`. Add ≥1 variant-bearing product to `MOCK_PRODUCTS` with `options`/`variants` and unique variant barcodes (master id with no underscore, e.g. `p30`; uom id `u30_1`). Confirm `MOCK_CATEGORIES` entries carry `status` (they do) for categoryStore seeding.
      Files: `src/data/mockProducts.ts`
      Verify: `npm run lint` passes.

- [ ] 5. Update `deductStock` to split on `__` and deduct variant stock.
      Replace the body with: `const [left, variantId] = productId.split('__'); const masterId = left.split('_')[0];` then match `p.id === masterId || p.id === productId`; if `variantId && p.variants?.length` deduct the matching variant's `stockQty` via `Math.max(0, v.stockQty - qty)`; else deduct `master.stockQty` as today. Keep raw qty (no ratio multiply).
      Files: `src/store/productStore.ts`
      Verify: new deductStock test (item 6) passes.

- [ ] 6. Create `categoryStore` mirroring `brandStore`.
      zustand+persist `name: 'pos-categories'`, seed `[...MOCK_CATEGORIES]`, exported `getCategories/getCategory/addCategory/updateCategory/deleteCategory` + `getCategoryProductCount(id)` counting `useProductStore.getState().products.filter(p => p.categoryId === id).length`; each mutation `logAction('หมวดหมู่', ...)`; export `useCategoryStore`.
      Files: `src/store/categoryStore.ts` (new)
      Verify: categoryStore test (item in Phase A tests) passes.

- [ ] 7. Add Phase A unit tests (mock react-native + AsyncStorage in store tests).
      `cartProduct.test.ts`: (a) no-variant output byte-identical to legacy; (b) variant id `` `${master.id}_${uom.id}__${variant.id}` `` + variant price used; (c) `masterDisplayStock` sums variants / equals master for plain. `productStore.deductStock` test using REAL ids (`p1_u1_1__<variantId>`): correct variant deduction, others untouched, non-variant id still deducts master, negative guard (qty>stock ⇒ 0). `priceResolver` new cases: variant wins, scales by ratio, null falls through. `findProductByBarcode` test: variant barcode → variant; uom barcode on variant product → no variant; master barcode on plain unchanged. `categoryStore` test: add/update/delete + `getCategoryProductCount` + persist key.
      Files: `src/utils/__tests__/cartProduct.test.ts` (new), `src/store/__tests__/productStore.test.ts` (new), `src/store/__tests__/categoryStore.test.ts` (new), extend `src/utils/__tests__/priceResolver.test.ts`, `src/data/__tests__/findProductByBarcode.test.ts` (new)
      Verify: `npx vitest run src/utils src/store/__tests__/productStore.test.ts src/store/__tests__/categoryStore.test.ts src/data` → all new + 19 baseline pass.

## Phase B — Sale wiring (mobile + web + kiosk filter)

- [ ] 8. Mobile `VariantSelector` + wire into `POSSaleScreen`.
      Create a mobile `VariantSelector` modal mirroring the existing `UOMSelector`/`StaffPopup` pattern (tokens from `Colors`/`Spacing`). Replace the inline `toCartProduct` with the shared import. In `handleProductPress`/`handleProductLongPress` insert the variant branch with precedence: service → `master.variants?.length` (open VariantSelector) → multi-UOM picker → default add. In `handleScan`, use `findProductByBarcode` result: if `variant` present build cart line directly via `toCartProduct(product, uom, branchId, variant)`; if a variant product matched by a non-variant barcode, open VariantSelector. Grids use `masterDisplayStock` for variant products.
      Files: `src/screens/sale/POSSaleScreen.tsx`, `src/components/sale/VariantSelector.tsx` (new)
      Verify: `npm run lint` passes; manual: variant product opens selector, selection adds correct cart line.

- [ ] 9. Web variant-picker modal + wire into `WebPOSScreen`.
      Replace inline `toCartProduct` with shared import. Add a web variant-picker modal mirroring the existing UOM Picker Modal (tokens from `WebColors`). In both grid onPress blocks (grid ~2247, list ~2294) insert the variant branch (uses the already-in-scope `master`) with precedence over the UOM picker. Refactor `handleBarcodeSubmit` to call shared `findProductByBarcode`; on `variant` present add directly, on non-variant barcode for a variant product open the variant modal. Grids use `masterDisplayStock`.
      Files: `src/screens/web/WebPOSScreen.tsx`
      Verify: `npm run lint` passes; manual on web.

- [ ] 10. Filter variants out of kiosk.
      Build the kiosk grid source and barcode search from `MOCK_PRODUCTS.filter(m => !(m.variants && m.variants.length))`; pass that filtered array into `findProductByBarcode` (not raw `MOCK_PRODUCTS`). Kiosk keeps its existing local 2-arg `toCartProduct` (intentionally not migrated).
      Files: `src/screens/kiosk/KioskPOSSaleScreen.tsx`
      Verify: `npm run lint` passes; manual: no variant products in kiosk grid/scan.

## Phase C — Authoring UI + supplier + category wiring

- [ ] 11. `categoryStore` wiring across pickers + CategoryManageScreen tab.
      Replace `useState(MOCK_CATEGORIES)` + local category mutation in `CategoryManageScreen` with `useCategoryStore` + `addCategory/updateCategory/deleteCategory` (mirror the brand tab). Replace `MOCK_CATEGORIES` reads with `getCategories()` in `AddEditProductScreen` cat picker, `ProductListScreen` chips, and `WebProductScreen`. In `ImportExportScreen`, derive category names reactively in-component via `getCategories()` (not the module-level `ACTIVE_CATEGORY_NAMES` const).
      Files: `src/screens/product/CategoryManageScreen.tsx`, `src/screens/product/AddEditProductScreen.tsx`, `src/screens/product/ProductListScreen.tsx`, `src/screens/product/ImportExportScreen.tsx`, `src/screens/web/WebProductScreen.tsx`
      Verify: `npm run lint` passes; `npx vitest run src/store/__tests__/categoryStore.test.ts` still green.

- [ ] 12. Supplier + options/variant-grid authoring in `AddEditProductScreen` (mobile).
      Add a supplier picker reading `getSuppliers()` (Supplier has NO status — do not filter by status; Thai empty state when store empty). Add an Options editor (add/remove option name+values; name required & unique; ≥1 value each) that auto-generates an editable variant grid (cartesian product) with per-row sku/barcode/price?/stockQty; validate non-negative integer stockQty (default 0) and `price >= 0` if entered, duplicate variant barcodes within the product block save with a Thai inline error. The save payload must ALWAYS include `options`, `variants`, `supplierId`, `supplierName` keys (even when empty/undefined) so edits can clear them.
      Files: `src/screens/product/AddEditProductScreen.tsx`
      Verify: `npm run lint` passes; manual: generate grid, clear fields, save round-trips.

- [ ] 13. Mirror supplier + options/variant-grid authoring in `WebProductScreen` modal.
      Same supplier picker, options/variant grid, validation, and always-include-keys save rule in the web product modal (tokens from `WebColors`).
      Files: `src/screens/web/WebProductScreen.tsx`
      Verify: `npm run lint` passes; manual on web.

## Final verification

- [ ] 14. Full suite + type-check.
      Verify: `npm run lint` clean; `npx vitest run src/engine/adapter/__tests__/cartAdapter.test.ts src/utils src/store/__tests__/productStore.test.ts src/store/__tests__/categoryStore.test.ts src/data` → 19 baseline + all new tests pass. (The 3 pre-existing react-native-import failures remain out of scope.)
