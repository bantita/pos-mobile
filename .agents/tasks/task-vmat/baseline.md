# Baseline — task-vmat

Recorded before any implementation work. Worktree: `d:\pos-mobile\.worktrees\vmat` (branch `feat/vmat`, from `main` @ c4a17a4).

## Worktree setup

- `git worktree add d:\pos-mobile\.worktrees\vmat -b feat/vmat main` — succeeded (new branch created).
- `npm install` in worktree — succeeded. 1247 packages added, 1248 audited.
  - Deprecation warnings only; no install failure.
  - `npm audit`: 81 vulnerabilities (1 low, 23 moderate, 52 high, 5 critical) — pre-existing, not addressed.
- Required packages confirmed present: `react-native-svg@15.2.0`, `react-native-qrcode-svg@6.3.2` (both already declared in package.json; node_modules verified).

## tsc baseline — `npm run lint` (tsc --noEmit)

Exit code 1. **13 pre-existing errors** (matches expected baseline):

| File | Count | Errors |
|------|-------|--------|
| src/components/ui/BranchSelector.tsx | 3 | TS2339 bodySmall (100), titleMedium (109), bodyMedium (116) |
| src/components/ui/DatePicker.tsx | 4 | TS2769 (62), TS2769 (89), TS2339 labelSmall (111), TS2339 bodyMedium (127) |
| src/screens/settings/PermissionMatrixScreen.tsx | 1 | TS2353 'supplier' not in Record<Module,string> (31) |
| src/screens/settings/RoleManageScreen.tsx | 2 | TS2322 'supplier' (20), TS2353 'supplier' (30) |
| src/screens/web/WebUserStaffScreen.tsx | 2 | TS2304 Cannot find name 'Platform' (482, 490) |
| src/services/errorTracking.ts | 1 | TS2554 Expected 3-4 args, got 1 (34) |
| **Total** | **13** | |

## test baseline — `npm test` (vitest run)

Exit code 1.

- **Tests: 24 passed** (0 failed) across the 3 loadable suites:
  - src/engine/adapter/__tests__/cartAdapter.test.ts — 14 tests
  - src/utils/__tests__/priceResolver.test.ts — 5 tests
  - src/store/__tests__/cartVat.test.ts — 5 tests
- Engine self-test (console harness inside engine.test.ts): **Passed 39 / Failed 0 / Total 39**.
- **Test Files: 3 failed | 3 passed (6 total)** — 3 pre-existing suite-load failures:
  - src/engine/__tests__/engine.test.ts — "No test suite found in file" (self-test prints via console, no vitest `test()` blocks).
  - src/store/__tests__/branchPermissionStore.test.ts — "Failed to resolve import ./Libraries/Image/Image from react-native/index.js".
  - src/services/sync/SyncService.test.ts — same react-native import resolution failure.

These 3 suite-load failures and the 13 tsc errors are PRE-EXISTING and are the accepted baseline. New work should not increase these counts.
