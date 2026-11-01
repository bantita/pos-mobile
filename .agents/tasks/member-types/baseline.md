# Baseline (branch feat/member-types @ main 24761d5)

## tsc --noEmit (npm run lint)
13 errors in 6 files (all pre-existing, matches expectation):
- src/components/ui/BranchSelector.tsx: 3 (TS2339 bodySmall/titleMedium/bodyMedium)
- src/components/ui/DatePicker.tsx: 4 (2x TS2769, TS2339 labelSmall/bodyMedium)
- src/screens/settings/PermissionMatrixScreen.tsx: 1 (TS2353 'supplier')
- src/screens/settings/RoleManageScreen.tsx: 2 (TS2322/TS2353 'supplier')
- src/screens/web/WebUserStaffScreen.tsx: 2 (TS2304 Platform)
- src/services/errorTracking.ts: 1 (TS2554)

## npm test (vitest)
- Tests: 135 passed (135)
- Test files: 13 passed, 3 failed (suite-load failures, pre-existing):
  - src/engine/__tests__/engine.test.ts
  - src/services/sync/SyncService.test.ts
  - src/store/__tests__/branchPermissionStore.test.ts
  (react-native "./Libraries/Image/Image" import resolution)

No differences from expected baseline.
