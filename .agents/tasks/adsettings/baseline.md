# Baseline (main @ 24761d5, branch feat/simplify-ad-settings)

## tsc --noEmit (npm run lint)
13 pre-existing errors in 6 files:
- src/components/ui/BranchSelector.tsx (3) — Typography.bodySmall/titleMedium/bodyMedium missing
- src/components/ui/DatePicker.tsx (4) — 2x TS2769, labelSmall/bodyMedium missing
- src/screens/settings/PermissionMatrixScreen.tsx (1) — 'supplier' not in Module
- src/screens/settings/RoleManageScreen.tsx (2) — 'supplier' not in Module
- src/screens/web/WebUserStaffScreen.tsx (2) — Platform not imported
- src/services/errorTracking.ts (1) — TS2554 arg count

## npm test (vitest)
- Tests: 135 passed / 0 failed
- Test files: 13 passed, 3 failed (suite-load failures, pre-existing):
  - src/engine/__tests__/engine.test.ts
  - src/services/sync/SyncService.test.ts (react-native Image import resolve)
  - src/store/__tests__/branchPermissionStore.test.ts (react-native Image import resolve)
