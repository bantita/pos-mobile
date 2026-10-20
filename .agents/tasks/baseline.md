# Baseline — feat/deferred worktree

Captured in the isolated worktree at `d:\pos-mobile\.worktrees\deferred` (branch `feat/deferred`, created from `main` @ 3d2e06a) immediately after a fresh `npm install`. Later steps compare against this to confirm they introduce no regressions.

## Environment
- Worktree: `d:\pos-mobile\.worktrees\deferred`
- Branch: `feat/deferred` (base: `main` @ 3d2e06a)
- `npm install`: completed — 1247 packages added, 1248 audited.
- Key deps verified present: `react-native-svg`, `react-native-qrcode-svg`.

## TypeScript — `npx tsc --noEmit`
Result: **13 errors in 6 files** (all pre-existing). Exit code 1.

| File | Count | Errors |
|------|-------|--------|
| src/components/ui/BranchSelector.tsx | 3 | TS2339 Typography.bodySmall / titleMedium / bodyMedium do not exist (lines 100, 109, 116) |
| src/components/ui/DatePicker.tsx | 4 | TS2769 style overload (lines 62, 89); TS2339 Typography.labelSmall / bodyMedium (lines 111, 127) |
| src/screens/settings/PermissionMatrixScreen.tsx | 1 | TS2353 'supplier' not in Record<Module, string> (line 31) |
| src/screens/settings/RoleManageScreen.tsx | 2 | TS2322 'supplier' not assignable to Module (line 20); TS2353 'supplier' not in Record<Module, string> (line 30) |
| src/screens/web/WebUserStaffScreen.tsx | 2 | TS2304 Cannot find name 'Platform' (lines 482, 490) |
| src/services/errorTracking.ts | 1 | TS2554 logAction expected 3-4 args, got 1 (line 34) |

## Tests — `npm test` (vitest run)
Result: **24 tests passed**; **3 passed suites, 3 failed suites** (all failures pre-existing). Exit code 1.

Passing suites / tests:
- src/engine/adapter/__tests__/cartAdapter.test.ts — 14
- src/utils/__tests__/priceResolver.test.ts — 5
- src/store/__tests__/cartVat.test.ts — 5
- Total: **24 passed**

Engine self-test (stdout from engine.test.ts run): **✅ Passed 39 / ❌ Failed 0 / Total 39**.

Pre-existing failed suites (suite-load failures, NOT test assertion failures):
1. `src/engine/__tests__/engine.test.ts` — "No test suite found in file" (runs its checks via stdout self-test rather than vitest cases).
2. `src/services/sync/SyncService.test.ts` — Vite import-analysis: cannot resolve `./Libraries/Image/Image` from `react-native/index.js`.
3. `src/store/__tests__/branchPermissionStore.test.ts` — same `react-native/index.js` import-analysis failure.

## Interpretation
All 13 tsc errors and all 3 failed test suites are pre-existing baseline conditions. Any later step must leave these unchanged (or reduced) and must not introduce new tsc errors or new test failures.
