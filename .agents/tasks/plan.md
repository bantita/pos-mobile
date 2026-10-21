# Implementation Plan — Receipt Layout Builder (drag-to-reorder)

Worktree: `d:\pos-mobile\.worktrees\receipt` (branch `feat/receipt-builder`).
Do NOT `cd`; use `git -C` and absolute paths.

## Context discovered during exploration

- **Store**: `src/store/receiptStore.ts` is plain zustand (no persist). Other stores use the house
  persist pattern: `persist(() => ({...}), { name: 'pos-xxx', storage: createJSONStorage(() => persistStorage) })`
  with `persistStorage` from `src/store/persistStorage.ts` (web=localStorage, mobile=AsyncStorage).
- **Preview (Section 4)** and **print (`openPrintPopup`, Section 5)** both live in the SAME component
  `SettingReceiptScreen` in `src/screens/web/WebSimpleScreens.tsx` (component starts ~line 1867;
  `openPrintPopup` ~1891–1952; Section 4 preview ~2062–2123; Section 5 ~2125–2142; save ~2145–2152).
  This is the ONLY real receipt layout render path.
- **`ReceiptScreen.tsx`** (`src/screens/sale/ReceiptScreen.tsx`) is a native on-screen receipt with a
  *simulated* print (setTimeout + Alert); it emits NO HTML and does not read `config.layout`. The task
  brief's "ReceiptScreen print HTML" does not exist there — the actual print HTML is `openPrintPopup`.
  Decision: PRINT PARITY is satisfied by driving `openPrintPopup` from the shared helper. `ReceiptScreen.tsx`
  is left out of scope (changing its fixed native layout is not required and risks regressions); note this
  in findings. If reviewers insist, a follow-up can refactor ReceiptScreen, but it is not a print HTML path.
- **Current block order** (both preview and print): logo → shopName → shopAddr → shopTel → headerText →
  (dash) → billInfo (bill#+date; print also shows taxId on that row) → (dash) → items → (dash) →
  totals (รวมทั้งสิ้น) → payment (รับเงิน/เงินทอน) → (dash) → footerText → branchInfo (สาขา|เครื่อง).
  NOTE: there is no standalone `taxId` block in the preview today; in print it is part of the billInfo row.
  Decision for the `taxId` block id: render it as its own line `เลขผู้เสียภาษี: {shopTaxId}` placed by
  default right after `billInfo` in the DEFAULT layout, `visible: true`. This keeps all 12 required ids real
  and backward-compatible (taxId value still shows). Keep the taxId text inside the billInfo row too? No —
  avoid duplication: remove taxId from the billInfo row and give it its own block so alignment/visibility work.
- **Tests**: vitest, `environment: 'happy-dom'`, alias `@`→`./src`, command `npm test` (= `vitest run`).
  Store tests mock `react-native` (`Platform.OS:'web'`) and `@react-native-async-storage/async-storage`,
  then assert persist via `useStore.persist.getOptions().name`. happy-dom provides `localStorage`.
- **Typecheck**: `npx tsc --noEmit` (script `npm run lint`). Baseline = 13 pre-existing errors, 48 tests pass,
  3 pre-existing suite-load failures. Bar: NO NEW tsc errors in touched files; no test regressions.
- **Tokens**: web screens use `WebColors` from `src/constants/webColors.ts`. Never hardcode colors.
- zustand `^4.5.2` — persist + `partialize`/`merge`/`version`/`migrate` all available.

## Block id → content mapping (fixed)

`logo, shopName, shopAddr, shopTel, taxId, headerText, billInfo, items, totals, payment, footerText, branchInfo`

Dashed separators are NOT blocks; render a dash between logical groups derived from the ordered visible
list (see step 3 for the rule).

---

- [ ] 1. Add the layout data model + persist + setters to the receipt store.
      Add `ReceiptBlockId` union (the 12 ids above), `ReceiptBlockAlign = 'left'|'center'|'right'`,
      and `ReceiptBlock = { id: ReceiptBlockId; visible: boolean; align?: ReceiptBlockAlign }`. Add
      `layout: ReceiptBlock[]` to `ReceiptConfig`. Export `DEFAULT_LAYOUT: ReceiptBlock[]` in the CURRENT
      order, all `visible: true`, sensible default aligns (logo/shopName/shopAddr/shopTel/taxId/headerText/
      footerText/branchInfo = 'center'; billInfo/items/totals/payment = 'left'). Convert `useReceiptStore`
      to `create<ReceiptStoreState>()(persist(() => ({ config: DEFAULT }), { name: 'pos-receipt',
      storage: createJSONStorage(() => persistStorage), version: 1, partialize, merge/migrate }))`. Keep
      `setConfig(partial)` working (merge into `config`). Add setters implemented via `useReceiptStore.setState`
      as functions on the store OR exported helpers (match sibling house style — functions are fine):
      `setLayout(layout)`, `reorderLayout(fromIndex,toIndex)`, `toggleBlock(id)`, `setBlockAlign(id,align)`.
      Migration/merge: write a `mergeLayout(saved?: ReceiptBlock[]): ReceiptBlock[]` that starts from
      `DEFAULT_LAYOUT`, applies saved order/visible/align for ids present in `saved`, drops unknown ids, and
      appends any DEFAULT ids missing from `saved` (so an old persisted `pos-receipt` without `layout`, or a
      future id, still yields a complete valid layout). Use it in persist `merge` (merge persisted state into
      current, then `config.layout = mergeLayout(persisted?.config?.layout)`), so `layout` is always complete.
      Files: `src/store/receiptStore.ts`
      Verify: `cd` is denied — run from repo: `npm test` after step 2 adds the test. For this step alone,
      run `npx tsc --noEmit` from `d:\pos-mobile\.worktrees\receipt` and confirm no NEW errors in `receiptStore.ts`.

- [ ] 2. Create a shared layout-ordering helper used by preview AND print.
      New file `src/utils/receiptLayout.ts`. Export:
      (a) `getOrderedBlocks(config: ReceiptConfig): ReceiptBlock[]` — returns `config.layout` filtered to
      `visible !== false`, in array order (uses `mergeLayout` defensively if `layout` missing).
      (b) a data descriptor for each visible block so BOTH renderers stay in sync — e.g.
      `type ReceiptBlockContent = { id: ReceiptBlockId; align: ReceiptBlockAlign; lines: ... }` OR, simplest
      and least divergent, build the PRINT HTML here: `buildReceiptHtml(config, data)` returning the full
      popup HTML string by iterating `getOrderedBlocks`, emitting each block's markup with
      `text-align:${align}`, and inserting a dashed `<div class="dash">` between the group boundaries
      (after the header group ends, around billInfo/taxId, around items, around totals/payment — derive the
      dash rule from which block ids are present rather than hardcoding indices: insert a dash before
      `billInfo`, before `items`, before `totals`, and before `footerText` IF the preceding visible block
      exists). `data` carries the mock sample (shop fields come from config; items/amounts are the Section-5
      mock) so the helper has no React/DOM deps and is unit-testable. Keep the shop-field/logo values read
      from `config`. All Thai text preserved exactly as today.
      Files: `src/utils/receiptLayout.ts`
      Verify: covered by step 8 test; `npx tsc --noEmit` shows no new errors in this file.

- [ ] 3. Refactor Section 4 preview to render from `getOrderedBlocks(config)`.
      In `SettingReceiptScreen`, replace the hardcoded preview JSX (~2062–2123) with a map over
      `getOrderedBlocks(config)`; for each block render the existing visual content (unchanged fonts/sizes/
      WebColors), applying `textAlign: block.align` to the block's `Text`/row container. Skip `visible:false`
      (already filtered). Keep dashed separators by the same group rule as the helper (before billInfo/items/
      totals/footerText when a preceding visible block exists) so preview and print match. The preview must
      read from the live store `config.layout` (so it reflects builder edits immediately) — use
      `useReceiptStore(s => s.config)` or the existing `config`. Logo block still gated by `showLogo && logoPreview`;
      taxId block renders `เลขผู้เสียภาษี: {shopTaxId}`; billInfo renders bill#+date (no taxId now); payment
      renders รับเงิน/เงินทอน; branchInfo renders `{shopBranch} | {posRegNo}`.
      Files: `src/screens/web/WebSimpleScreens.tsx`
      Verify: `npm test` green; `npx tsc --noEmit` no new errors; manual: preview still shows all blocks.

- [ ] 4. Point `openPrintPopup` at the shared helper (PRINT PARITY).
      Replace the inline `html` template in `openPrintPopup` (~1898–1949) with
      `const html = buildReceiptHtml(config, mock)` from `src/utils/receiptLayout.ts`, passing the current
      shop fields from the editor state (or read from `config` after save) and the Section-5 mock items/amounts.
      Keep the `@page 80mm`, font-family, and popup-open logic. Remove the now-duplicated taxId-in-billInfo row
      (taxId is its own ordered block). Keep the `alert('⚠️ กรุณาอนุญาต popup...')` guard.
      Files: `src/screens/web/WebSimpleScreens.tsx`
      Verify: `npx tsc --noEmit` no new errors; manual: Capture popup renders blocks in configured order.

- [ ] 5. Decide the single source of field values for preview+print and wire save.
      To avoid preview (local editor state) and print (also local editor state) diverging from the persisted
      `config.layout`, keep the editor's shop-field local state as-is BUT source `layout` from the store
      (`config.layout`) in BOTH preview and `buildReceiptHtml`. `handleSave` already persists shop fields via
      `setConfig`; builder edits (step 6) call the layout setters directly so they persist immediately and do
      not depend on the Save button. Confirm `handleSave` is unchanged for shop fields and still calls
      `setShopNameStore`.
      Files: `src/screens/web/WebSimpleScreens.tsx`
      Verify: `npx tsc --noEmit` no new errors; manual: edit a field → Save → reload → field persists; reorder
      a block → reload → order persists (persist key `pos-receipt`).

- [ ] 6. Add the builder UI section 'จัดวางบิล (ลากเพื่อจัดลำดับ)' (web-only).
      Insert a new card in `SettingReceiptScreen` (place it just before Section 4 so users reorder then see the
      preview). Guard the interactive builder with `Platform.OS === 'web'`; on mobile render a read-only note
      card ("ปรับลำดับบิลได้บนเวอร์ชันเว็บ"). The builder lists `config.layout` (full, incl. hidden) in order;
      each row: (1) drag handle icon (`reorder-three-outline`); (2) Thai block name from a
      `BLOCK_LABELS: Record<ReceiptBlockId,string>` map (โลโก้ / ชื่อร้าน / ที่อยู่ / เบอร์โทร / เลขผู้เสียภาษี /
      ข้อความหัวบิล / ข้อมูลบิล / รายการสินค้า / ยอดรวม / การชำระเงิน / ข้อความท้ายบิล / สาขา·เครื่อง);
      (3) a `Switch` bound to `visible` → `toggleBlock(id)`; (4) an align control (3 chips ซ้าย/กลาง/ขวา using
      the existing `chip`/`chipActive` styles) → `setBlockAlign(id,align)`, shown only for blocks where align
      makes sense (hide for `logo`? logo can center — keep align for all except skip where meaningless; simplest:
      show for all 12); (5) up/down arrow buttons (`chevron-up`/`chevron-down`, disabled at ends) →
      `reorderLayout(i,i-1)`/`reorderLayout(i,i+1)` as the GUARANTEED fallback. DRAG: on web, set
      `draggable` and wire `onDragStart`/`onDragOver`/`onDrop` via the row's web DOM props (RN-Web passes through
      DOM events; use a `dataSet`/ref + `onStartShouldSetResponder` is NOT needed — use the web-only path with
      `{...(Platform.OS==='web' ? { draggable:true, onDragStart, onDragOver, onDrop } : {})}` typed as `any` only
      on the DOM-event bag, no broad `any`). On drop, call `reorderLayout(fromIndex,dropIndex)`. All colors from
      `WebColors`; min touch height 44 for arrow buttons. No new npm dependency (web DOM drag + arrows suffice).
      Files: `src/screens/web/WebSimpleScreens.tsx`
      Verify: `npx tsc --noEmit` no new errors; `npm test` green; manual on web: arrows reorder, switch toggles,
      align chips change alignment, drag reorders, and preview/popup reflect changes; on mobile: read-only note.

- [ ] 7. Keep all non-layout settings working (regression guard).
      Confirm shop fields, logo upload/show toggle, paper size (note: Section 4 title says 80mm; leave paper
      size handling unchanged), copies, footer text, and `taxInvoiceEnabled` are untouched by the refactor.
      `setConfig` still merges partials; `DEFAULT` still carries all original fields plus `layout`.
      Files: `src/screens/web/WebSimpleScreens.tsx`, `src/store/receiptStore.ts`
      Verify: `npx tsc --noEmit` no new errors; `npm test` green; manual smoke of each field.

- [ ] 8. Add focused unit tests for the store and the shared helper.
      New `src/store/__tests__/receiptStore.test.ts` mirroring `categoryStore.test.ts` setup
      (mock `react-native` `Platform.OS:'web'` and AsyncStorage). Cover: DEFAULT config includes a 12-block
      `layout` all visible in the current order; `reorderLayout(from,to)` moves a block; `toggleBlock(id)`
      flips `visible`; `setBlockAlign(id,'center')` sets align; `setConfig` still merges non-layout fields;
      persist key is `pos-receipt` (`useReceiptStore.persist.getOptions().name`); `mergeLayout(undefined)`
      and `mergeLayout([{id:'items',visible:false,align:'left'}])` both return a complete 12-block layout
      (missing ids appended from DEFAULT, old `visible:false` honored, unknown ids dropped).
      New `src/utils/__tests__/receiptLayout.test.ts`: `getOrderedBlocks` returns blocks in configured order
      with `visible:false` removed (e.g. hide `headerText` → not present; reorder puts `footerText` before
      `items` when configured); `buildReceiptHtml` output contains block markup in the configured order
      (assert index-of one block's text < index-of another after reorder) and omits hidden blocks' text.
      Files: `src/store/__tests__/receiptStore.test.ts`, `src/utils/__tests__/receiptLayout.test.ts`
      Verify: from `d:\pos-mobile\.worktrees\receipt` run `npm test` — the two new suites pass; total passing
      count increases from 48 with no new failures (the 3 pre-existing suite-load failures may remain).

- [ ] 9. Full verification pass.
      Run the project's typecheck and tests and confirm the baseline bar holds.
      Verify: from `d:\pos-mobile\.worktrees\receipt`:
      `npx tsc --noEmit` → no NEW errors beyond the 13 pre-existing (none in touched files
      receiptStore.ts / receiptLayout.ts / WebSimpleScreens.tsx);
      `npm test` → all previously-passing suites still pass plus the 2 new suites; only the 3 known
      suite-load failures remain. Clean up any temp files.

## Notes / assumptions

- `ReceiptScreen.tsx` is intentionally out of scope: it has no HTML print path (simulated print only), so
  "print parity" is fully delivered via the shared `buildReceiptHtml` driving `openPrintPopup`. Recorded here
  so the implementer doesn't chase a non-existent HTML builder in that file.
- `taxId` becomes its own ordered block (previously only embedded in the print billInfo row); value still
  renders, now with independent order/visibility/alignment. Duplicate taxId in billInfo is removed.
- No new DnD dependency: web DOM `draggable` + up/down arrows meet requirement 2's "guaranteed-working fallback".
