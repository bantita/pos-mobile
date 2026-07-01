# Implementation Plan: POS Store Types

## Overview

Implement a 3-tier store type system (SERVICE, RETAIL, ENTERPRISE) with feature gating, staff/technician management, service charge calculation, per-product VAT, and multi-branch/terminal management. Implementation follows a bottom-up approach: types → utility functions → stores → UI components → integration.

## Tasks

- [x] 1. Define core types and utility functions
  - [x] 1.1 Create store type interfaces and data models
    - Create `src/types/store.ts` with `StoreType`, `ServiceChargeConfig`, `StoreConfig`, `Technician`, `Branch`, `Terminal` interfaces
    - _Requirements: 1.1, 2.1, 3.1, 8.2, 9.1, 10.2_

  - [x] 1.2 Extend Product and CartItem types
    - Add `productType: 'general' | 'service'` field to `ProductMaster` in `src/types/product.ts`
    - Add `technicianId?: string` and `technicianName?: string` to `CartItem` in `src/types/sale.ts`
    - _Requirements: 5.2, 6.1, 6.2_

  - [x] 1.3 Implement feature gating utility
    - Create `src/utils/storeFeatures.ts` with `getFeaturesByStoreType(type)` pure function
    - SERVICE → `staffManagement`, `staffPopup`; RETAIL → `terminalManagement`; ENTERPRISE → `branchManagement`, `terminalManagement`
    - _Requirements: 2.2_

  - [x] 1.4 Implement service charge calculation utility
    - Create `src/utils/serviceCharge.ts` with `calcServiceCharge(config, subtotal)` pure function
    - Percentage mode: `subtotal * (value / 100)`; Fixed mode: return value directly
    - Include validation helper `validatePercentage(value): boolean` for 0–100 range
    - _Requirements: 3.2, 3.3, 4.2, 4.3_

  - [x] 1.5 Implement VAT calculation utility
    - Create `src/utils/vatCalc.ts` with `calcItemVat(subtotal, vatRate)` and `calcCartVat(items)` pure functions
    - Per-item VAT: `subtotal * vatRate / 100`; Cart VAT: sum of all item VATs
    - _Requirements: 7.4_

  - [ ]* 1.6 Write property tests for utility functions
    - **Property 1: Store type determines feature set** — verify `getFeaturesByStoreType()` returns correct features for each type
    - **Property 2: Bounded percentage validation** — verify validation accepts only 0–100
    - **Property 3: Service charge percentage calculation** — verify `calcServiceCharge` percentage mode
    - **Property 4: Service charge fixed amount calculation** — verify `calcServiceCharge` fixed mode
    - **Property 5: Per-item VAT calculation** — verify `calcCartVat` equals sum of individual item VATs
    - **Validates: Requirements 2.2, 3.2, 3.3, 4.2, 4.3, 7.3, 7.4**

- [x] 2. Implement Zustand stores
  - [x] 2.1 Create store config store
    - Create `src/store/storeConfigStore.ts` with Zustand store holding `StoreConfig` state
    - Actions: `setStoreType(type)`, `setServiceCharge(config)`, `toggleServiceCharge(enabled)`
    - Default: RETAIL type, service charge disabled
    - _Requirements: 1.2, 2.1, 2.2, 3.1, 3.4_

  - [x] 2.2 Create staff store
    - Create `src/store/staffStore.ts` with Zustand store for technician CRUD
    - Actions: `addTechnician(data)`, `updateTechnician(id, data)`, `deleteTechnician(id)`, `getAvailableTechnicians()` (returns only status='available')
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 2.3 Create branch store
    - Create `src/store/branchStore.ts` with Zustand store for branch + terminal CRUD
    - Actions: `addBranch(data)`, `updateBranch(id, data)`, `deleteBranch(id)`, `addTerminal(branchId?, name)`, `getTerminalsByBranch(branchId)`
    - Terminal creation assigns unique ID; for ENTERPRISE, scoped to branch
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 2.4 Extend cartStore with addServiceItem
    - Add `addServiceItem(product, technicianId, technicianName)` action to existing `cartStore.ts`
    - Always creates a new line item (never merges with same product but different technician)
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 2.5 Write property tests for store logic
    - **Property 6: Service product cart line items carry technician identity** — adding N times with N different technicians yields N separate line items
    - **Property 7: Staff popup filters to available technicians only** — `getAvailableTechnicians()` returns only available status
    - **Property 8: Terminal ID uniqueness** — all terminal IDs are distinct after creation sequence
    - **Property 9: Terminal filtering by branch** — `getTerminalsByBranch` returns only matching branchId
    - **Validates: Requirements 5.2, 5.4, 8.5, 8.6, 9.4, 10.4, 10.6**

- [x] 3. Checkpoint - Core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create demo/mock data
  - [x] 4.1 Create mock staff data
    - Create `src/data/mockStaff.ts` with 3 technicians (distinct names, positions, statuses) for SERVICE demo "ร้านตัดผม Demo"
    - Include at least 1 technician with status 'unavailable' to test filtering
    - _Requirements: 11.1, 11.2_

  - [x] 4.2 Create mock branches data
    - Create `src/data/mockBranches.ts` with:
      - RETAIL: 2 terminals with distinct names for "ร้านค้าปลีก Demo"
      - ENTERPRISE: 3 branches with distinct names/addresses + 2 terminals per branch (6 total) for "ร้านค้าใหญ่ Demo"
    - _Requirements: 12.1, 12.2, 13.1, 13.2, 13.3_

  - [x] 4.3 Update mockProducts with productType field
    - Add `productType: 'general'` to all existing products in `src/data/mockProducts.ts`
    - Add 5 service products (hair/spa services) and 1 general product for SERVICE demo
    - _Requirements: 11.3, 11.4_

- [x] 5. Build UI components
  - [x] 5.1 Create StaffPopup component
    - Create `src/components/sale/StaffPopup.tsx` — modal displaying available technicians
    - Props: `visible`, `onSelect(technicianId, technicianName)`, `onClose`
    - Show technician name, position, photo; filter by status 'available'
    - Show empty state message when no technicians available
    - _Requirements: 5.1, 5.2, 8.5_

  - [x] 5.2 Create WebStaffManageScreen
    - Create `src/screens/web/WebStaffManageScreen.tsx` — technician list with add/edit/delete
    - Fields: name, position, status toggle (available/unavailable), optional photo
    - Uses `staffStore` for CRUD operations
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.3 Create WebBranchManageScreen
    - Create `src/screens/web/WebBranchManageScreen.tsx` — branch list with add/edit/delete + terminal management per branch
    - Branch fields: name, address, contact phone/email
    - Terminal section: list terminals, add new terminal with name, show status
    - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 5.4 Write unit tests for StaffPopup component
    - Test: only available technicians shown
    - Test: empty state when no available technicians
    - Test: onSelect callback passes correct technician data
    - _Requirements: 5.1, 8.5, 8.6_

- [x] 6. Integrate with existing screens
  - [x] 6.1 Integrate StaffPopup into WebPOSScreen
    - Modify `src/screens/web/WebPOSScreen.tsx`: on product tap, check `productType`
    - If `'service'` → show `StaffPopup`, then call `addServiceItem` with selected technician
    - If `'general'` → use existing `addItem` flow (no popup)
    - Display technician name on cart line items for service products
    - _Requirements: 5.1, 5.2, 5.5, 6.3_

  - [x] 6.2 Add service charge and VAT to bill summary
    - Modify bill summary section in `WebPOSScreen.tsx`:
    - Show service charge line when enabled (using `calcServiceCharge`)
    - Calculate VAT per item using `calcCartVat`
    - Include service charge in grand total calculation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.4_

  - [x] 6.3 Update WebSidebar with conditional navigation
    - Modify `src/components/web/WebSidebar.tsx`: use `getFeaturesByStoreType` to conditionally show nav items
    - SERVICE → show "จัดการพนักงาน" (Staff Management)
    - RETAIL → show "จัดการจุดขาย" (Terminal Management)
    - ENTERPRISE → show "จัดการสาขา" (Branch Management)
    - _Requirements: 8.1, 10.1_

  - [x] 6.4 Add store type selector and service charge settings
    - Add store type selector UI to settings area (3 options with icons/descriptions)
    - Add service charge configuration: enable/disable toggle, mode picker (percentage/fixed), value input with validation
    - Owner-only visibility for store type change
    - _Requirements: 1.1, 1.3, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4_

- [x] 7. Checkpoint - Full integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Final wiring and validation
  - [x] 8.1 Wire navigation routes for new screens
    - Register `WebStaffManageScreen` and `WebBranchManageScreen` in navigation/routing
    - Ensure conditional nav items from WebSidebar link to correct screens
    - _Requirements: 8.1, 10.1_

  - [ ]* 8.2 Write integration tests for end-to-end flows
    - Test: SERVICE store → tap service product → popup → select technician → cart shows technician name
    - Test: Service charge enabled → bill total includes charge
    - Test: ENTERPRISE → branch selected → terminals filtered by branch
    - _Requirements: 5.1, 5.2, 4.2, 10.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The project uses TypeScript with Zustand for state management and React Native (Expo) for UI
- fast-check library should be used for property-based tests
- All new Zustand stores follow the existing pattern: `create<StateType>((set, get) => ({...}))`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6", "2.1", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2"] }
  ]
}
```
