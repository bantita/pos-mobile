# Design Review — Crystal-Reports-style Visual Receipt Designer

Reviewed: `d:\pos-mobile\.worktrees\designer\.agents\tasks\design.md` (round 2)
Reviewer: independent design-review subagent (fresh context)
Method: read the design in full, then verified every load-bearing assumption against the worktree source (`receiptStore.ts`, `receiptLayout.ts`, `WebPOSScreen.tsx`, `WebSimpleScreens.tsx`, `WebSidebar.tsx`, `WebNavigator.tsx`, `rolePermissions.ts`, `package.json`, `receiptStore.test.ts`).

## Summary

This is a strong, self-consistent round-2 design. The data model + migration (block-list → canvas elements), the shared `resolveField`/`layoutElement`/`buildTemplateHtml` renderer with its discriminated `ResolvedField` union, the paper-preset + custom mm→px + `@page` math, the separate sidebar menu with a settings-piggy-backed permission gate, the central-single-template behavior (per-branch entry removed), and the web-only guard with a native read-only fallback are all specified concretely, and the prior-round findings were genuinely addressed rather than hand-waved.

Almost every factual claim the design makes about the existing code is **correct** (see Verified Assumptions). The design even correctly anticipated subtle details — the `grand/1.07` in-function math, the verbatim `setTimeout(…,400)` popup sequence, the `items[].total` field name (renamed to `lineTotal`), the `memberInfo` block, the two accessKey spots in the navigator, and the `settings`/`documents`/`licenses`/`branches` piggy-back pattern.

One MEDIUM blocks: the verification gate command the design hangs its "ship the breaking change in one commit" safety argument on (`npm run typecheck`) does not exist in `package.json`. The remaining items are NITs (line-number drift and one collateral test loss).

---

## Findings

### 1. MEDIUM — Verification gate command `npm run typecheck` does not exist

**Where:** §7 ("must pass `npm run typecheck` AND `vitest run`"), §1.4, §8 (the "gated on `npm run typecheck` + `vitest run`" clauses that justify shipping the store-interface break + UI edit + test edit in one commit).

**Problem:** `package.json` (verified in the worktree) defines no `typecheck` script. The scripts are:
```json
"test": "vitest run",
"lint": "tsc --noEmit"
```
The TypeScript check is `npm run lint` (`tsc --noEmit`), and `vitest run` is invoked via `npm test` (or `npm run test`), not as a bare top-level command. The design's gate — the mechanism it repeatedly cites to guarantee there is "no self-inconsistent interim" when the four setters and their callers are removed together — would fail immediately with an npm "missing script: typecheck" error as written. Because the one-commit safety argument leans on this gate, the command needs to be correct.

**Fix:** Replace every "`npm run typecheck`" with "`npm run lint`" and every bare "`vitest run`" with "`npm test`" (or `npx vitest run`). Concretely, §7's gate line becomes: *"the store-interface change, the `WebSimpleScreens.tsx` edit, and the `receiptStore.test.ts` edit ship together and must pass `npm run lint` AND `npm test` before the commit is considered done."*

### 2. NIT — Import line numbers for `WebSimpleScreens.tsx` are off by one

**Where:** §1.4, §5, §8 — "that file has TWO import lines at 21 — `import { useReceiptStore, ReceiptBlockId, ReceiptBlockAlign } …` and `import { getOrderedBlocks, buildReceiptHtml, ReceiptSampleData } …`".

**Problem:** Verified against source: the `receiptStore` import is at **line 20**, and the `receiptLayout` import is at **line 21**. They are two consecutive lines (20 and 21), not "two lines at 21." The names and the deletion/keep plan are exactly right; only the cited line is slightly off.

**Fix:** Change "TWO import lines at 21" to "the import lines at 20–21 (`receiptStore` at line 20, `receiptLayout` at line 21)". No change to the actual edit plan.

### 3. NIT — Removing the whole `describe('receiptStore — setters')` block also deletes a still-valid `setConfig` test

**Where:** §7 / §8 ("REMOVE the `describe('receiptStore — setters')` block").

**Problem:** Verified: that describe block contains five tests, four of which exercise the removed setters (`reorderLayout` ×2, `toggleBlock`, `setBlockAlign`) — correctly removed. But the fifth, `setConfig ยังรวม field อื่นได้โดยไม่กระทบ layout`, tests `setConfig`, which **survives** the refactor and is in fact the API the new `beforeEach` relies on. Deleting the entire describe block throws away still-valid coverage for a kept API.

**Fix:** Either (a) keep that single `setConfig` test by moving it out of the setters block before deletion, or (b) explicitly state in §7/§8 that the `setConfig` assertion is re-homed into the kept `receiptStore — DEFAULT layout`/persist describe rather than dropped. A one-line note resolves it.

### 4. NIT — "บิล" button line range cited as 672–680; actual TouchableOpacity is ~673–679

**Where:** §4 Decision B, §8 ("the 'บิล' button (lines 672–680)").

**Problem:** Verified: the comment `{/* ปุ่มตั้งค่าบิลของสาขา */}` sits at ~672 and the `<TouchableOpacity>…</TouchableOpacity>` spans ~673–679. The cited 672–680 is close and unambiguous (there is exactly one such per-branch receipt button, `onPress={() => setReceiptBranchId(b.id)}`), so this is cosmetic. The removal targets (button, `receiptBranchId` state at 524, early-return at 604–605) are all verified present and correct.

**Fix:** None required; optionally soften to "~673–679 (the per-branch 'บิล' `TouchableOpacity` and its leading comment)".

---

## Verified Assumptions (checked against source, found correct)

1. **Store shape.** `receiptStore.ts` has `version: 1`, a `merge` function and **no** `migrate`; the four setters `setLayout`/`reorderLayout`/`toggleBlock`/`setBlockAlign` exist; `mergeLayout`/`DEFAULT_LAYOUT` exist; `ReceiptConfig.paperSize` is `'58mm'|'80mm'|'A4'`. The migration/persist-bump plan (§1.5) is coherent with this.
2. **`receiptLayout.ts` exports & role.** It exports `getOrderedBlocks`, `buildReceiptHtml`, and the `ReceiptSampleData` interface (which has `price`/`received`/`change`). Its `@page` is `size: 80mm auto; margin: 4mm`, body width `72mm`, and it has an `esc()` helper — all as the design describes. Only `WebSimpleScreens.tsx` imports it; POS does not.
3. **POS print path (`printReceipt80mm`).** Verified signature: `invoice.items` are `{name, qty, unitPrice, disc, total}` (design renames `total`→`lineTotal` — acknowledged and correct); `subtotal/discount/vat/grand`; `status`; `cancelReason?`; `buyerInfo?`; `memberInfo?`; `billType`; `paperSize`. It computes `grandEx = grand/1.07` and `vatAmt = grand - grandEx` inside the function (design moves this to the caller — verified feasible). No `received`/`change` data exists anywhere in the invoice (design's removal of those fields is justified). The popup tail is exactly `if (!w) return; w.document.write(html); w.document.close(); w.focus(); setTimeout(() => { w.print(); }, 400);` — the design's "retain verbatim, swap only the HTML source" claim is accurate. `@page { size: ${paper} auto; margin: 3mm }`, `W = 72mm/50mm/190mm` for 80/58/A4 — matches §2.1's content-width parity reasoning (A4 body is 190mm today, and `210 - 2*10 = 190`, so the preset default lines up).
4. **Member block exists and is being dropped.** The `invoice.memberInfo` section is present in today's HTML; §1.1/§5/§11 explicitly drop it from the central template and declare it Out of Scope. Consistent.
5. **Sidebar.** `NAV_ITEMS` ends `settings`, `superadmin` (`adminOnly: true`); inserting `receipt-designer` between them keeps the admin-only entry last. The `accessKey` ternary mirrors the `['suppliers','brands'] → 'products'` pattern; extending it to map `receipt-designer → settings` is feasible.
6. **Navigator.** `PAGE_NAMES` and the `switch (route)` exist; there are exactly **two** accessKey computations (`navigate()` and the top-level `routeAccessKey` guard), both already mapping `['documents','licenses','branches'] → 'settings'`. Extending both to include `receipt-designer` is the right, verified-correct plan.
7. **Permissions.** `rolePermissions.ts` `ALL_SCREENS` contains a `settings` key and `canAccess` honors it; `documents`/`licenses`/`branches` have no own entry and piggy-back on `settings`. The design's "no new `ALL_SCREENS` entry, gate on `settings`" is consistent with the existing pattern.
8. **Per-branch entry (Decision B).** Verified: `receiptBranchId` state at line 524, the `if (receiptBranchId) return <SettingReceiptScreen …/>` early-return at 604–605, and exactly one per-branch "บิล" `TouchableOpacity` (`setReceiptBranchId(b.id)`) in the branch list. All three removal targets exist.
9. **Dependencies.** `react-native-qrcode-svg` 6.3.2 and `react-native-svg` 15.2.0 are in `package.json` (both worktree and root). No new dependency needed — correct.
10. **Test harness.** `vitest` + `happy-dom` are devDependencies; the existing `receiptStore.test.ts` mocks `react-native` to `{ Platform: { OS: 'web' } }` (as the design says new tests will), uses `setLayout` in `beforeEach`, and has the `describe('receiptStore — setters')` block + the "12 blocks in order" test reading `config.layout`. The disposition in §7/§8 matches reality.

---

## Unverified / Wrong Assumptions

- **WRONG — `npm run typecheck` script (Finding 1).** The design assumes a `typecheck` npm script exists; it does not. The equivalent is `npm run lint` (`tsc --noEmit`). This is the one factual error with blocking weight because the one-commit safety argument depends on the gate being runnable.
- **UNVERIFIED (design already flags, acceptable) — RNW pointer events / `setPointerCapture` (§3.1, §10.2).** Not exercised anywhere in this repo. The design openly lists it as a runtime assumption with a `ref`+`useEffect` fallback. Cannot be confirmed statically; acceptable as a called-out risk, not a blocker.
- **UNVERIFIED (design already flags, acceptable) — `react-native-qrcode-svg` rendering under preview and inline-SVG/data-URL in the print popup (§2.2, §9).** The packages are installed, but no current code renders QR, so the exact preview↔print SVG approach is untested here. Flagged by the design as a risk; acceptable.
- **UNVERIFIED (design already flags, acceptable) — thermal `@page { size: 80mm auto }` behavior and mm→px dot-pitch fidelity (§2.1, §10.3/§10.4).** Same as today's code, so no regression; printer-side scaling is the driver's job. Acceptable.

---

## Verdict

Count of HIGH + MEDIUM findings: **1** (Finding 1, MEDIUM).

**CHANGES_REQUESTED.**

The design is implementable and its code-level assumptions are overwhelmingly verified-correct. The single blocker is a wrong toolchain command in the verification gate (`npm run typecheck` → should be `npm run lint`; `vitest run` → `npm test`). Fixing that one line, plus optionally the three NITs, clears the design for implementation.
