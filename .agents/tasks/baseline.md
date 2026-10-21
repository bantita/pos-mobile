# Baseline — feat/receipt-builder

Worktree: `d:\pos-mobile\.worktrees\receipt`
Branch: `feat/receipt-builder` (from `main` @ 586f214)
Recorded: 2026-10-21

## Dependencies

`npm install` completed: 1247 packages added, 1248 audited.
(react-native-svg + react-native-qrcode-svg already present in package.json.)

## TypeScript (`npx tsc --noEmit`)

Exit code: 1 — **13 pre-existing errors** (all expected, none related to the receipt-builder task):

| File | Count | Notes |
|------|-------|-------|
| src/components/ui/BranchSelector.tsx | 3 | Typography props `bodySmall`, `titleMedium`, `bodyMedium` not on type |
| src/components/ui/DatePicker.tsx | 4 | ViewStyle overload (x2) + Typography `labelSmall`, `bodyMedium` |
| src/screens/settings/PermissionMatrixScreen.tsx | 1 | `supplier` not in `Record<Module, string>` |
| src/screens/settings/RoleManageScreen.tsx | 2 | `supplier` not assignable to `Module` (x2) |
| src/screens/web/WebUserStaffScreen.tsx | 2 | `Platform` not found (x2) |
| src/services/errorTracking.ts | 1 | Expected 3-4 args, got 1 |
| **TOTAL** | **13** | |

## Tests (`npm test` → `vitest run`)

Exit code: 1

- **Engine self-test: 39 passed / 0 failed** (engine.test.ts stdout block)
- **Unit tests: 48 passed** across 7 suites
- **3 pre-existing suite-load failures** (do NOT count as test failures):
  - `src/engine/__tests__/engine.test.ts` — "No test suite found" (self-test uses stdout, not vitest cases)
  - `src/services/sync/SyncService.test.ts` — Vite import resolution: `react-native/index.js` → `./Libraries/Image/Image`
  - `src/store/__tests__/branchPermissionStore.test.ts` — same react-native import resolution error

Summary line: `Test Files  3 failed | 7 passed (10)` / `Tests  48 passed (48)`

## Baseline status

All error/failure counts match the expected pre-existing state. Safe to proceed with the receipt-builder feature; any NEW tsc error or test failure introduced by the task must be fixed.
