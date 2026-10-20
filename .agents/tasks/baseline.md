# Baseline — feat/pricing-fix worktree

Recorded before any task changes, so later steps can compare.

- Worktree: `d:\pos-mobile\.worktrees\pricing-fix`
- Branch: `feat/pricing-fix` (from `main` @ `78203e7`)
- `npm install`: succeeded (1247 packages added)

## TypeScript — `npx tsc --noEmit`

Exit code: 1 — **13 pre-existing errors** (all expected, none introduced by this task):

1. `src/components/ui/BranchSelector.tsx(100,33)` — TS2339 Property 'bodySmall' does not exist on Typography
2. `src/components/ui/BranchSelector.tsx(109,34)` — TS2339 Property 'titleMedium' does not exist on Typography
3. `src/components/ui/BranchSelector.tsx(116,29)` — TS2339 Property 'bodyMedium' does not exist on Typography
4. `src/components/ui/DatePicker.tsx(62,73)` — TS2769 No overload matches this call (ViewStyle)
5. `src/components/ui/DatePicker.tsx(89,71)` — TS2769 No overload matches this call (ViewStyle)
6. `src/components/ui/DatePicker.tsx(111,26)` — TS2339 Property 'labelSmall' does not exist on Typography
7. `src/components/ui/DatePicker.tsx(127,19)` — TS2339 Property 'bodyMedium' does not exist on Typography
8. `src/screens/settings/PermissionMatrixScreen.tsx(31,3)` — TS2353 'supplier' does not exist in type Record<Module, string>
9. `src/screens/settings/RoleManageScreen.tsx(20,3)` — TS2322 Type '"supplier"' is not assignable to type 'Module'
10. `src/screens/settings/RoleManageScreen.tsx(30,3)` — TS2353 'supplier' does not exist in type Record<Module, string>
11. `src/screens/web/WebUserStaffScreen.tsx(482,14)` — TS2304 Cannot find name 'Platform'
12. `src/screens/web/WebUserStaffScreen.tsx(490,14)` — TS2304 Cannot find name 'Platform'
13. `src/services/errorTracking.ts(34,5)` — TS2554 Expected 3-4 arguments, but got 1

## Tests — `npm test` (vitest run)

Exit code: 1

- Test Files: 3 failed | 1 passed (4 total)
- Tests: **14 passed** (cartAdapter.test.ts — 14/14)
- Engine self-test (runs inside engine.test.ts stdout): **Passed 39 / Failed 0 / Total 39**

### 3 pre-existing suite-load failures (expected, not introduced by this task):

1. `src/engine/__tests__/engine.test.ts` — "No test suite found in file" (runs its own self-test harness via stdout; 39/0 pass)
2. `src/services/sync/SyncService.test.ts` — Failed to resolve import "./Libraries/Image/Image" from react-native/index.js
3. `src/store/__tests__/branchPermissionStore.test.ts` — Failed to resolve import "./Libraries/Image/Image" from react-native/index.js
