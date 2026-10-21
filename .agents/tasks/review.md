# Data-driven receipt layout builder (reorder / toggle / align with print parity)

Adds a user-configurable receipt layout to the web settings screen. The receipt is now described by a 12-block `layout` array on `ReceiptConfig`, persisted under the zustand key `pos-receipt`. A new "จัดวางบิล" builder lets web users reorder blocks (drag-and-drop plus guaranteed up/down buttons), toggle visibility, and set per-block alignment. A single shared helper (`src/utils/receiptLayout.ts`) produces the ordered/filtered block list that drives BOTH the on-screen preview and the print/capture HTML, so the two cannot diverge. Old persisted configs without `layout` are reconciled to the full 12-block default on rehydrate.

Watch for: the task text names `ReceiptScreen.tsx` as part of the print/capture path to unify — it is intentionally untouched here (confirmed), because it is a native on-screen receipt whose "print" is a `setTimeout` + `Alert` simulation with no HTML path to share. The real HTML capture ("Section 5 / ถ่ายภาพ / Capture") does use the shared helper. This is a deliberate, defensible scoping decision, not a gap.

**Verdict**: APPROVED

## High-level view

The data model is clean and backward compatible. `ReceiptConfig` gains `layout: ReceiptBlock[]`, `DEFAULT_LAYOUT` seeds all 12 blocks in the original receipt order all-visible, and the store is wrapped in `persist` with name `pos-receipt`. Migration is handled through a custom `merge` rather than a `migrate` function: every rehydrate runs `mergeLayout`, which keeps known saved blocks in their saved order/visibility/alignment, drops unknown ids, and appends any missing ids from the default. This self-heals partial or stale persisted state, which is stronger than a version-gated migrate. `version: 1` is declared but no `migrate` is wired; harmless because `merge` covers the same ground.

Print parity is real. `getOrderedBlocks(config)` is the single source of order+visibility; `buildReceiptHtml` iterates it for the print/capture popup, and the preview's render loop iterates the same function with the same dash-insertion rule (`billInfo/items/totals/footerText`). Alignment flows from `block.align` in both paths. Both read `liveConfig` — editor shop fields merged over the store's `layout` — so unsaved field edits and persisted layout changes both show in preview and print identically.

The builder UI is web-gated (`Platform.OS !== 'web'` renders a read-only Thai note), wires reorder/toggle/align to the store setters so changes persist immediately, uses `WebColors` tokens with no hardcoded colors, is Thai throughout, and gives action buttons a 44px touch height. Drag-and-drop is the enhancement; the up/down buttons are the guaranteed reorder path with ends disabled.

The `ReceiptScreen.tsx` scoping is the one judgment call. It has no HTML/capture logic (verified: `handlePrint` simulates with `setTimeout`+`Alert`, no `document.write`, no layout use), and the branch leaves it unchanged. There is no duplicated ordering logic in it that could drift from the helper, so the parity requirement is satisfied by unifying preview with the Section-5 capture path.

Tests cover the store (default shape, reorder valid + invalid-index no-op, toggle, align, setConfig non-layout merge, persist key, mergeLayout migration both from undefined and from stale/unknown-id input) and the helper (ordering, hidden-filtering, HTML order by index assertion, hidden omission, alignment emission).

<details>
<summary>Issues (1)</summary>

1. **`version` without `migrate` (non-blocking)** — persist declares `version: 1` but no `migrate`; migration is handled in `merge`. This works and is robust, but a future bump of `version` with an added `migrate` could run alongside `merge` and surprise a maintainer. Optionally drop `version` or add a comment that `merge` owns reconciliation. No action required to ship.

</details>

<details>
<summary>Details</summary>

### Data model, persistence, and migration — `receiptStore.ts`

`ReceiptBlockId` enumerates exactly the 12 ids (`logo, shopName, shopAddr, shopTel, taxId, headerText, billInfo, items, totals, payment, footerText, branchInfo`). `DEFAULT_LAYOUT` lists them in the pre-existing receipt order, all `visible: true`, with header/shop/tax/footer/branch blocks `center` and billInfo/items/totals/payment `left` — matching the old hardcoded layout, so an existing user sees no visual change until they touch the builder. `DEFAULT.layout` deep-copies the default so store mutations never alias the exported constant.

The store is `create()(persist(...))` with `name: 'pos-receipt'`, `storage: createJSONStorage(() => persistStorage)` — the same house pattern as sibling stores (web→localStorage, mobile→AsyncStorage). `setConfig` still shallow-merges partials, so every non-layout field (shop fields, logo, footer, copies, paperSize, `taxInvoiceEnabled`) keeps working untouched. `setLayout` routes through `mergeLayout` so it can't install an incomplete layout. `reorderLayout` is bounds-checked and no-ops on out-of-range or equal indices (test-covered). `toggleBlock` and `setBlockAlign` map immutably over the array.

Migration happens in the custom `merge`: it spreads persisted `config` over current, then forces `layout: mergeLayout(saved?.layout)`. A config persisted before this feature (no `layout` key) yields `mergeLayout(undefined)` → full default. A config with a subset, reordered ids, or an unknown id is reconciled to a complete, valid 12-block layout preserving saved order/visibility/alignment for known blocks. This is backward compatible and self-healing.

The only nit: `version: 1` is set but there's no `migrate`. Since `merge` already reconciles on every rehydrate, the version is effectively inert. Not a defect — flagged so a future maintainer who adds a `migrate` understands `merge` is the real reconciliation point.

### Shared ordering helper and print parity — `receiptLayout.ts` + `WebSimpleScreens.tsx`

`getOrderedBlocks(config)` returns `config.layout` filtered to `visible !== false`, falling back to `mergeLayout(config.layout)` if `layout` is somehow absent. This is the one ordering authority.

`buildReceiptHtml(config, data)` iterates `getOrderedBlocks`, emits each block's markup with `text-align:${align}` (defaulting `left`), and inserts a dashed separator before `billInfo/items/totals/footerText` when a preceding block already rendered. Field values are HTML-escaped via `esc()` — a good touch, since shop name/address/footer are user-editable and flow into `document.write`. Empty fields produce empty block HTML and are skipped, so dashes don't double up.

The preview in `SettingReceiptScreen` iterates the same `getOrderedBlocks(liveConfig)` and renders each block through `renderPreviewBlock`, applying `block.align` as `textAlign` and using an identical `PREVIEW_DASH_BEFORE` set. Both paths consume `liveConfig = { ...config, ...editorFields, headerLogo: logoPreview }`, so order+visibility come from the persisted store while shop fields reflect unsaved edits — preview and print stay in lockstep. `openPrintPopup` (the Section-5 "ถ่ายภาพ / Capture" button) calls `buildReceiptHtml(liveConfig, sampleData)`. Parity is structural: a single function supplies the order, so the paths cannot drift.

The preview adds an all-hidden empty state ("ไม่มีข้อมูล — เปิดการแสดงผลของบล็อกอย่างน้อย 1 รายการ"), satisfying the empty-state expectation for the configurable region. `taxId` is correctly split into its own block in both paths (previously `billInfo` carried the tax id inline); the HTML and preview both now render it as a standalone centered line.

Other `document.write` sites in the file (TEST PRINT at ~line 993/1493, cash-drawer kick at ~1046) are printer-diagnostic paths, not receipt rendering, and are correctly left out of the helper.

### `ReceiptScreen.tsx` scope

Verified unchanged by this branch (empty diff). `handlePrint` sets `printing`, waits via `setTimeout`, then `Alert.alert('พิมพ์สำเร็จ', …)` — a simulated print over a fixed native JSX receipt. No `document.write`, no `window.open`, no `getOrderedBlocks`/`buildReceiptHtml`, no `useReceiptStore` layout read. Because it carries no HTML ordering logic, there is nothing to unify or that could diverge from the helper; wiring the data-driven layout into the native receipt would be a separate feature with real regression risk. The task's parity requirement is met by the preview↔capture unification. Recorded as a deliberate scoping call, documented in the coder's verification notes.

### Builder UI

`ReceiptLayoutBuilder` renders a read-only Thai note card on native (`Platform.OS !== 'web'`) and the interactive editor on web. Each row has a drag handle (`reorder-three-outline`), up/down arrow buttons sized 44px tall and disabled/dimmed at the ends, the Thai block label from `BLOCK_LABELS`, three alignment chips (ซ้าย/กลาง/ขวา) reflecting `block.align ?? 'left'`, and a visibility `Switch`. Drag-and-drop is wired through RN-Web via `draggable`/`onDragStart`/`onDragOver`/`onDrop`, with the up/down buttons as the guaranteed fallback. All colors are `WebColors.*` tokens; no hardcoded hex. Reorder/toggle/align call the store setters directly, so edits persist immediately and independently of the Save button, and both preview and print reflect them live.

### Tests

`receiptStore.test.ts`: default layout is 12 blocks in the exact expected order, all visible; `reorderLayout(0,2)` moves correctly; `reorderLayout(0,99)` is a no-op; `toggleBlock` flips both ways; `setBlockAlign` sets alignment; `setConfig` merges a non-layout field without disturbing `layout`; persist name asserted as `pos-receipt` via `useReceiptStore.persist.getOptions().name`; `mergeLayout(undefined)` returns the full default; `mergeLayout` on stale input with a hidden block, reordered ids, and an unknown id preserves saved order/visibility/alignment, drops the unknown, and backfills to 12.

`receiptLayout.test.ts`: `getOrderedBlocks` drops hidden and respects a swapped order; `buildReceiptHtml` emits blocks in configured order (index-of assertion), omits a hidden block's text, and emits `text-align:right` from `block.align`. Both suites mock `react-native` and AsyncStorage so the pure logic runs under vitest.

Not tested: the React builder component itself (drag/arrow interactions, the web/mobile guard branch) and the `openPrintPopup` window write — consistent with the project's unit-only harness and acceptable since the ordering/visibility/alignment logic those paths depend on is fully covered at the helper and store level.

### Verification evidence

Per `.agents/tasks/receipt-builder-verification.md`: `tsc --noEmit` before and after both exit 1 with the identical 13 pre-existing errors (BranchSelector, DatePicker, PermissionMatrixScreen, RoleManageScreen, WebUserStaffScreen, errorTracking) — zero new, none in touched files. `npm test` goes from 48 to 62 passing (+14 from the two new suites); the 3 failing files are the known pre-existing suite-load failures recorded in `baseline.md`. Evidence is specific and credible, so the suites were not re-run. Spot-checks performed: confirmed `Switch`/`Platform`/`Image`/`TouchableOpacity` imports exist, confirmed `ReceiptScreen.tsx` has no HTML path, confirmed Section-5 capture routes through `buildReceiptHtml`.

</details>

<details>
<summary>File map</summary>

- `src/store/receiptStore.ts` — `ReceiptBlockId`/`ReceiptBlockAlign`/`ReceiptBlock` types, `layout` on `ReceiptConfig`, `DEFAULT_LAYOUT`, `mergeLayout`, persist(`pos-receipt`) with reconciling `merge`, and `setLayout`/`reorderLayout`/`toggleBlock`/`setBlockAlign` setters.
- `src/utils/receiptLayout.ts` (new) — `getOrderedBlocks`, `buildReceiptHtml` (HTML-escaped, shared dash rule), `ReceiptSampleData`.
- `src/screens/web/WebSimpleScreens.tsx` — `ReceiptLayoutBuilder` card (web-only), `renderPreviewBlock`, preview rewritten to iterate `getOrderedBlocks`, `openPrintPopup` delegated to `buildReceiptHtml`, `liveConfig` bridge.
- `src/store/__tests__/receiptStore.test.ts` (new) — store + migration tests.
- `src/utils/__tests__/receiptLayout.test.ts` (new) — helper + print-parity tests.
- `.agents/tasks/*` — plan, baseline, verification notes.

Full diff: `git -C d:\pos-mobile\.worktrees\receipt diff main`
</details>
