# Baseline — feat/i18n-phase1 (from main @ 36e25a3)

## tsc --noEmit (npm run lint): 13 errors in 6 files

| File | Errors |
|---|---|
| src/components/ui/BranchSelector.tsx | 3 (TS2339 missing Typography keys) |
| src/components/ui/DatePicker.tsx | 4 (2x TS2769, 2x TS2339) |
| src/screens/settings/PermissionMatrixScreen.tsx | 1 (TS2353 'supplier') |
| src/screens/settings/RoleManageScreen.tsx | 2 (TS2322, TS2353 'supplier') |
| src/screens/web/WebUserStaffScreen.tsx | 2 (TS2304 'Platform') |
| src/services/errorTracking.ts | 1 (TS2554) |

## npm test (vitest)

- Tests: 214 passed / 0 failed
- Test files: 18 passed, 3 failed (suite-load failures, pre-existing)
  - src/engine/__tests__/engine.test.ts
  - src/services/sync/SyncService.test.ts (Failed to resolve "./Libraries/Image/Image" from react-native)
  - src/store/__tests__/branchPermissionStore.test.ts (same react-native resolve error)
