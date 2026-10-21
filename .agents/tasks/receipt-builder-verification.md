# Verification — Receipt Layout Builder (feat/receipt-builder)

Worktree: `d:\pos-mobile\.worktrees\receipt` · Branch: `feat/receipt-builder`

> Note on `review.json`: the `.agents/tasks/review.json` present in this worktree is a **stale artifact
> from a prior (unrelated) task** — its `summary` describes supplierStore/brandStore/syncStore work and
> `findings: []`. The receiptStore was still plain zustand with no `layout` and the branch had no
> receipt-builder commits, so this was treated as the **first iteration** and implemented from the plan.

---

## Commands run & results

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` (before) | exit 1 — **13 pre-existing errors** (baseline) |
| `npx tsc --noEmit` (after)  | exit 1 — **13 errors**, identical list. **0 new**, none in touched files |
| `npm test` (vitest run)     | exit 1 — **62 passed**, `Test Files 3 failed | 9 passed (12)`; the 3 failures are the known pre-existing suite-load failures |

TypeScript — touched files (`src/store/receiptStore.ts`, `src/utils/receiptLayout.ts`,
`src/screens/web/WebSimpleScreens.tsx`) produce **no** tsc errors. The 13 remaining errors are the exact
baseline set (BranchSelector ×3, DatePicker ×4, PermissionMatrixScreen ×1, RoleManageScreen ×2,
WebUserStaffScreen ×2, errorTracking ×1).

Tests — baseline was 48 passing; now **62 passing** (+14 from the two new suites). The 3 failing files are
the pre-existing suite-load failures recorded in `baseline.md`:
`engine.test.ts` (stdout self-test), `SyncService.test.ts` and `branchPermissionStore.test.ts`
(both the `react-native/index.js → ./Libraries/Image/Image` Vite import-resolution error). No regressions.

---

## Per-requirement change summary

### 1. Data model + persist + setters — `src/store/receiptStore.ts`
- Added `ReceiptBlockId` union (the 12 ids), `ReceiptBlockAlign = 'left'|'center'|'right'`,
  `ReceiptBlock = { id; visible; align? }`, and `layout: ReceiptBlock[]` on `ReceiptConfig`.
- Exported `DEFAULT_LAYOUT` in the **current receipt order**, all `visible: true`
  (header/footer/branch/taxId = `center`; billInfo/items/totals/payment = `left`).
- Converted the store to `create()(persist(...))` with `name: 'pos-receipt'`, `version: 1`,
  `storage: createJSONStorage(() => persistStorage)` (same house pattern as sibling stores).
- `setConfig` unchanged (merges partials — non-layout settings keep working).
- Added `setLayout`, `reorderLayout(from,to)` (bounds-checked, no-op on invalid/equal indices),
  `toggleBlock(id)`, `setBlockAlign(id,align)`.

### 2. Shared ordering helper — `src/utils/receiptLayout.ts` (NEW, no React/DOM deps)
- `getOrderedBlocks(config)` → `config.layout` filtered to `visible !== false`, in array order
  (falls back to `mergeLayout` if `layout` is missing).
- `buildReceiptHtml(config, data)` → the full print-popup HTML, iterating `getOrderedBlocks`, emitting each
  block's markup with `text-align:${align}`, inserting a dashed `<div class="dash">` **before**
  billInfo/items/totals/footerText when a preceding visible block was rendered. HTML-escapes field values.

### 3. Preview (Section 4) — `src/screens/web/WebSimpleScreens.tsx`
- Replaced the hardcoded preview JSX with a map over `getOrderedBlocks(liveConfig)`, rendering each block
  via the new `renderPreviewBlock(id, align, fields)` helper and applying `textAlign` from `block.align`.
- Same dash rule as the HTML helper (`PREVIEW_DASH_BEFORE` set = billInfo/items/totals/footerText).
- Hidden blocks disappear; an all-hidden layout shows a Thai empty state ("ไม่มีข้อมูล …").
- `taxId` is now its own block (`เลขผู้เสียภาษี: …`); `billInfo` no longer carries the tax id.

### 4. Builder UI — `src/screens/web/WebSimpleScreens.tsx`
- New card **"🧩 จัดวางบิล (ลากเพื่อจัดลำดับ)"** (`ReceiptLayoutBuilder`), placed just before the preview.
- Web-only interactive (`Platform.OS === 'web'`); on mobile it renders a read-only Thai note card.
- Each row: drag handle (`reorder-three-outline`), up/down arrow buttons (44px tall, disabled at ends),
  Thai block name from `BLOCK_LABELS`, three align chips (ซ้าย/กลาง/ขวา), and a visible `Switch`.
- Reorder wired to `reorderLayout`, toggle to `toggleBlock`, align to `setBlockAlign` — **changes persist
  immediately** (they go through the persisted store, independent of the Save button).
- All colors from `WebColors` tokens; no hardcoded colors; Thai throughout.

### 5. Print — `openPrintPopup` now calls `buildReceiptHtml(liveConfig, sampleData)` (see parity below).

### 6. Non-layout settings preserved
- `handleSave` still persists shop fields via `setConfig` and calls `setShopNameStore`. Logo upload/show
  toggle, shop fields, footer text, copies, paperSize, `taxInvoiceEnabled` are untouched. `DEFAULT` keeps
  every original field plus `layout`.

---

## How PRINT PARITY is achieved
Both the preview and the print popup are driven from the **same ordered block list**:
- Preview iterates `getOrderedBlocks(liveConfig)`.
- Print calls `buildReceiptHtml(liveConfig, sampleData)`, which **also** iterates `getOrderedBlocks`.

They share the identical order/visibility source (`config.layout`), the identical align source
(`block.align`), and the identical dash-insertion rule (before billInfo/items/totals/footerText when a
preceding block rendered). `liveConfig` = editor shop fields (so unsaved edits show) **+** `layout` read
from the store (so reorder/toggle/align persist and apply to both). They cannot diverge in ordering because
there is a single ordering function.

**`ReceiptScreen.tsx` is intentionally out of scope**: it is a native on-screen receipt with a *simulated*
print (`setTimeout` + `Alert`) — it emits no HTML and has no print path. The real print HTML is
`openPrintPopup` (Section 5 capture window), which is fully unified with the preview via `buildReceiptHtml`.
Changing ReceiptScreen's fixed native layout was not required and would risk regressions; recorded here per
the plan's note.

## How PERSISTENCE is achieved
- zustand `persist` with key **`pos-receipt`** (web = localStorage, mobile = AsyncStorage via
  `persistStorage`).
- `mergeLayout(saved?)` + a custom persist `merge`: an old persisted config **without** `layout` (or one
  missing/with extra ids) is reconciled against `DEFAULT_LAYOUT` — known ids keep their saved order +
  visible + align, unknown ids are dropped, missing ids are appended from DEFAULT. Result is always a
  complete, valid 12-block layout (backward compatible).

## Working reorder mechanism
**Both** are wired: web DOM drag-and-drop (`draggable` + `onDragStart`/`onDragOver`/`onDrop` passed through
RN-Web) **and** up/down arrow buttons. The up/down arrows are the **guaranteed** path (always work, bounds
disabled at the ends); drag is the enhancement. **No new DnD dependency** was added.

## Tests added
- `src/store/__tests__/receiptStore.test.ts` — DEFAULT 12-block layout/order/all-visible; `reorderLayout`
  (valid + invalid-index no-op); `toggleBlock`; `setBlockAlign`; `setConfig` still merges non-layout fields;
  persist key `pos-receipt`; `mergeLayout(undefined)` and `mergeLayout([... old visible:false + unknown id])`
  both yield a complete 12-block layout.
- `src/utils/__tests__/receiptLayout.test.ts` — `getOrderedBlocks` drops hidden + respects reorder;
  `buildReceiptHtml` emits blocks in configured order (index-of assertion), omits hidden blocks' text, and
  applies `text-align` from `block.align`.
