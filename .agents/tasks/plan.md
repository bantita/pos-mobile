# Implementation Plan — Four Deferred Features (worktree: d:\pos-mobile\.worktrees\deferred)

All paths are relative to the worktree root `d:\pos-mobile\.worktrees\deferred`. Honor the design-system steering: web screens use `src/constants/webColors.ts` (WebColors.*) and match sibling web screens (e.g. WebBranchManageScreen); mobile/shared screens use `Colors/Typography/Spacing` tokens. All user-facing text in Thai. TypeScript, no `any` abuse. Each new store follows the `productStore`/`branchStore` house style (zustand + persist via `persistStorage`) and calls `logAction(module, action, description, metadata?)` from `src/store/auditLogStore.ts` on mutations.

Build/verify commands (from package.json): `npm run lint` = `tsc --noEmit`; `npm test` = `vitest run`. Baseline (do not regress): 13 pre-existing tsc errors in 6 files; 24 vitest tests pass, 3 suites fail to load (pre-existing). New code must add zero new tsc errors and zero new test failures.

Key registration facts discovered:
- Web routes are switch cases in `src/navigation/WebNavigator.tsx` (`renderContent`), with a Thai label in its local `PAGE_NAMES`, access gated via `canAccess(user.role, routeAccessKey)` (routes not in `rolePermissions` fall back to `'settings'` — see the `['documents','licenses','branches']` pattern).
- Sidebar menu entries live in `NAV_ITEMS` in `src/components/web/WebSidebar.tsx`.
- `canAccess` maps unknown routes 1:1 to a screen key; admin always passes. New back-office routes can reuse the `products`/`settings` access key.

---

- [ ] 1. Create `supplierStore` (Task 1 — Supplier Master).
      Follow `src/store/branchStore.ts` house style: zustand + persist, name `'pos-suppliers'`, `storage: createJSONStorage(() => persistStorage)`, seeded from `MOCK_SUPPLIERS` (`src/data/mockInventory.ts`). Export function API: `getSuppliers()`, `getSupplier(id)`, `addSupplier(data)`, `updateSupplier(id, updates)`, `deleteSupplier(id)`. Each mutation calls `logAction('ผู้จำหน่าย', 'เพิ่ม'|'แก้ไข'|'ลบ', <desc>, { supplierId })`. Type `Supplier` already exists in `src/types/inventory.ts`.
      Files: `src/store/supplierStore.ts`
      Verify: `npm run lint` — no new tsc errors.

- [ ] 2. Build `WebSupplierScreen` and register it (Task 1).
      CRUD management screen under `src/screens/web/WebSupplierScreen.tsx` modeled on `WebBranchManageScreen.tsx` (WebColors, card grid, inline form, `window.confirm` on delete). Fields: name (required), taxId, phone, contactName. Loading/error/empty states in Thai ("ยังไม่มีผู้จำหน่าย"). Register in `WebNavigator.tsx`: add `case 'suppliers': return <WebSupplierScreen />;`, add `suppliers: 'ผู้จำหน่าย'` to `PAGE_NAMES`, and add to `WebSidebar.tsx` `NAV_ITEMS` (`route: 'suppliers'`, icon `'business-outline'`, label `'ผู้จำหน่าย'`). Access: reuse `'products'` key (map in `navigate`/`routeAccessKey` the same way `branches` reuses `settings` — add `'suppliers'` to that reuse list or map it to `products`).
      Files: `src/screens/web/WebSupplierScreen.tsx`, `src/navigation/WebNavigator.tsx`, `src/components/web/WebSidebar.tsx`
      Verify: `npm run lint`; manual: reviewer opens สินค้า-area → ผู้จำหน่าย, adds/edits/deletes a supplier, reloads page, confirms persistence.

- [ ] 3. Point the stock-receive supplier picker at `supplierStore` (Task 1).
      In `src/screens/inventory/StockDocFormScreen.tsx` the receive flow already uses a `SimplePickerModal` fed by `MOCK_SUPPLIERS` (it is NOT free-text). Replace the `MOCK_SUPPLIERS` import/usages (`supplierName` lookup ~line 221 and picker items ~line 690) with `supplierStore.getSuppliers()` so newly-created suppliers appear. Keep the `'— ไม่ระบุ —'` option and all existing stock-doc save behavior (`supplierId`/`supplierName` on receive only). Note decision in findings: do NOT add `supplierId` to `ProductMaster` (ProductMaster has no supplier field today; linkage stays supplier↔stock-doc to keep risk low).
      Files: `src/screens/inventory/StockDocFormScreen.tsx`
      Verify: `npm run lint`; manual: create a supplier in step 2, open รับสินค้า form, confirm it appears in the picker and saves.

- [ ] 4. Create `brandStore` (Task 2 — Brand CRUD).
      `productStore` holds only products (no brands), so create a dedicated store like `branchStore`: zustand + persist, name `'pos-brands'`, seeded from `MOCK_BRANDS` (`src/data/mockProducts.ts`). API: `getBrands()`, `getBrand(id)`, `addBrand(data)`, `updateBrand(id, updates)`, `deleteBrand(id)` with `logAction('แบรนด์', ...)`. Add a helper `getBrandProductCount(brandId)` that counts `useProductStore.getState().products` with matching `brandId` (derive productCount live). `Brand` type exists in `src/types/product.ts`.
      Files: `src/store/brandStore.ts`
      Verify: `npm run lint` — no new tsc errors.

- [ ] 5. Build `WebBrandScreen` and register it (Task 2).
      `src/screens/web/WebBrandScreen.tsx` modeled on `WebBranchManageScreen.tsx`: CRUD, Thai labels, loading/error/empty ("ยังไม่มีแบรนด์"), `window.confirm` on delete, show live productCount via `brandStore.getBrandProductCount`. Register in `WebNavigator.tsx` (`case 'brands'`, `PAGE_NAMES.brands = 'แบรนด์'`, access key `'products'`) and `WebSidebar.tsx` `NAV_ITEMS` (icon `'ribbon-outline'`, label `'แบรนด์'`).
      Files: `src/screens/web/WebBrandScreen.tsx`, `src/navigation/WebNavigator.tsx`, `src/components/web/WebSidebar.tsx`
      Verify: `npm run lint`; manual: add a brand, confirm it persists after reload.

- [ ] 6. Make brand pickers read from `brandStore` (Task 2).
      Mobile `src/screens/product/AddEditProductScreen.tsx`: replace `MOCK_BRANDS` in the brand `PickerModal` items (~line 541) with `brandStore.getBrands().filter(b => b.status === 'active')`. Web `src/screens/web/WebProductScreen.tsx` product modal brand dropdown (~lines 672–686): replace `MOCK_BRANDS` reads with `brandStore.getBrands()`; also make the "มาสเตอร์ › ยี่ห้อ" tab (local `brands` state seeded from `MOCK_BRANDS`, handlers `handleAddBrand`/`handleSaveEditBrand`/`handleDeleteBrand`/`handleToggleBrandStatus` ~lines 922–959) read/write `brandStore` so edits persist and reflect in the picker. Keep product save (`brandId`/`brandName`) working. Pick ONE source of truth: the store.
      Files: `src/screens/product/AddEditProductScreen.tsx`, `src/screens/web/WebProductScreen.tsx`
      Verify: `npm run lint`; manual: add a brand in WebBrandScreen, confirm it appears in both product brand pickers and a product saves with it.

- [ ] 7. Persist mobile product add/edit (Task 3 — Mobile Product Persist).
      In `src/navigation/ProductNavigator.tsx`, `AddEditProductScreen.onSaved(saved: ProductMaster)` currently only calls `navigation.goBack()`. Wire it to persist: `AddProduct` → `useProductStore.getState().addProduct(saved)` then `goBack()`; `EditProduct` → `useProductStore.getState().updateProduct(saved.id, saved)` then `goBack()`. `onSaved` already receives the built `ProductMaster` (see `handleSave` in AddEditProductScreen). Persist in exactly ONE place (the navigator), do not add a second persist inside the screen. Leave the web flow (WebProductScreen) untouched.
      Files: `src/navigation/ProductNavigator.tsx`
      Verify: `npm run lint`; manual: on mobile/web-mobile viewport, add a product via ProductList → AddProduct, confirm it appears in the list after returning; edit it, confirm changes persist.

- [ ] 8. Build the web Sync settings screen bound to `syncStore` (Task 4).
      Create `src/screens/web/WebSyncSettingsScreen.tsx` bound to `useSyncStore` (`src/store/syncStore.ts`), mirroring `src/screens/sync/SyncQueueScreen.tsx` (already store-bound): live stats from `getStats()` (pending/syncing/success/failed/conflict/total), list of queued+failed items, a `'ซิงค์ทันที'` button calling `startSync()` (and optionally `retryAllFailed()` when failures exist), last-synced time from `lastSyncAt`, and when `getStats().conflict > 0` a button/section that opens conflict resolution reusing `ConflictResolutionScreen` (props `{ onBack, onResolved }`) or an inline resolver calling `resolveConflict(id, resolution)`. Thai labels, loading/empty/error states. Stays mock — keep `FEATURE_FLAGS.MOCK_SYNC` behavior; no real server. Use webColors tokens / match sibling web screens.
      Files: `src/screens/web/WebSyncSettingsScreen.tsx`
      Verify: `npm run lint` — no new tsc errors.

- [ ] 9. Replace the Sync placeholder in web settings (Task 4).
      In `src/screens/web/WebSimpleScreens.tsx`, the settings `subView === 'sync'` currently renders a `SimpleSubPage` placeholder (titled "Sync Monitor"). Replace it with `<WebSyncSettingsScreen onBack={() => setSubView(null)} />` (import it). Keep the existing settings tile (`key: 'sync'`) that routes to it.
      Files: `src/screens/web/WebSimpleScreens.tsx`
      Verify: `npm run lint`; manual: ตั้งค่า → Sync Monitor tile opens the real screen; press ซิงค์ทันที and watch pending→syncing→success/conflict; when a conflict exists, open the resolver.

- [ ] 10. Full integration verification.
      Run the full build and test suite; confirm no regressions vs baseline.
      Files: (none)
      Verify: `npm run lint` (≤ 13 pre-existing tsc errors, none new) and `npm test` (≥ 24 tests pass, no new failures).

## Notes / assumptions
- `ProductMaster` gets NO `supplierId` field (Task 1 optional item declined — low value, ProductMaster has none today; keeping supplier↔stock-doc linkage avoids touching product type/variant territory which is out of scope).
- Product-variant matrix is explicitly OUT OF SCOPE; do not introduce variant systems when editing product types/screens.
- New back-office routes (`suppliers`, `brands`) reuse the `'products'` access key via the same fallback mechanism `branches`/`documents`/`licenses` use for `'settings'`.
