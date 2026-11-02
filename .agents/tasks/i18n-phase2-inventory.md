# i18n Phase 2 — Inventory of remaining Thai strings

Generated at the end of phase 1 (branch `feat/i18n-phase1`, after commit `4afb747`).

**How it was counted.** Scope is every `src/**/*.ts(x)` except `src/i18n/locales/**`, `*.test.*` and `__tests__/**`. The count is the number of lines that contain a Thai character (`[\u0E00-\u0E7F]`), skipping lines that start with `//`, `*` or `/*`:

```powershell
Get-ChildItem -Recurse src -Include *.ts,*.tsx | ForEach-Object {
  (Select-String -Path $_ -Pattern '[\u0E00-\u0E7F]' -Encoding UTF8 |
    Where-Object { $_.Line -notmatch '^\s*(//|\*|/\*)' }).Count }
```

The numbers are approximate. The filter still counts JSX comments (`{/* … */}`), trailing `// …` comments and the `฿` currency glyph (U+0E3F, which is in the Thai block). Totals: **217 files, about 6,695 lines**.

Notes that apply to the whole list:
- **`src/data/**` is mock data, not UI.** Product, member, employee and report names stand in for user data and are never translated. They're listed for completeness only.
- **Forbidden / owned by another workflow.** Customer-display and ad files are being edited by a parallel workflow, so phase 1 didn't touch them. Phase 2 must coordinate with that workflow before translating them.
- **Phase-1 files with intentional Thai.** Some phase-1 files still show Thai on purpose: `logAction` audit sentences, mock data, persisted/actor strings, Thai-only customer-display labels, user-data defaults and comments. See the last section.
- Sorted by count, descending, inside each group.

## 1. Web back-office (`src/screens/web/**`, `src/components/web/**`)

| Lines | File | Note |
|---:|---|---|
| 459 | src/screens/web/WebSimpleScreens.tsx | Only `WebSettingsScreen`'s language card was done in phase 1. Every other screen in the file is phase 2. |
| 377 | src/screens/web/WebCRMScreen.tsx | CRM (see also group 5) |
| 341 | src/screens/web/WebReportsScreen.tsx | Reports (see also group 2) |
| 199 | src/screens/web/WebProductScreen.tsx | |
| 104 | src/screens/web/WebPricingModuleScreen.tsx | |
| 95 | src/screens/web/WebInventoryScreen.tsx | |
| 94 | src/screens/web/WebUserStaffScreen.tsx | Has pre-existing lint errors (baseline) |
| 87 | src/screens/web/WebMemberPromotionScreen.tsx | |
| 73 | src/screens/web/WebCommunicationScreen.tsx | |
| 70 | src/screens/web/WebReceiptDesignerScreen.tsx | Phase 1 added only the receipt-language toolbar toggle. Designer chrome is phase 2. |
| 69 | src/screens/web/WebPromotionScreen.tsx | |
| 61 | src/components/web/MasterMigrationWizard.tsx | |
| 60 | src/screens/web/WebWelcomeScreen.tsx | |
| 59 | src/screens/web/WebSaleHistoryScreen.tsx | |
| 58 | src/screens/web/WebDailySummaryScreen.tsx | |
| 45 | src/screens/web/WebTestTrackerScreen.tsx | Internal QA tool |
| 43 | src/screens/web/WebMemberTypeScreen.tsx | |
| 42 | src/screens/web/WebCouponScreen.tsx | |
| 41 | src/screens/web/WebBranchManageScreen.tsx | |
| 36 | src/screens/web/WebReturnScreen.tsx | |
| 35 | src/components/web/MasterImportExportPanel.tsx | |
| 33 | src/screens/web/WebSyncSettingsScreen.tsx | |
| 27 | src/components/settings/WebStoreSettingsSection.tsx | |
| 23 | src/screens/web/WebLicenseScreen.tsx | |
| 23 | src/screens/web/WebErpSettingsScreen.tsx | |
| 22 | src/screens/web/WebRichMenuScreen.tsx | |
| 22 | src/screens/web/WebSuperAdminScreen.tsx | |
| 21 | src/screens/web/WebScannerScreen.tsx | |
| 20 | src/screens/web/WebCampaignScreen.tsx | |
| 19 | src/screens/web/WebCrmConfigScreen.tsx | |
| 17 | src/screens/web/WebSegmentScreen.tsx | |
| 16 | src/screens/web/WebSupplierScreen.tsx | |
| 15 | src/screens/web/WebDocumentSettingsScreen.tsx | Phase 1 added only the receipt-language row. The rest of the form is phase 2. |
| 15 | src/screens/web/WebBrandScreen.tsx | |
| 14 | src/screens/web/WebStaffManageScreen.tsx | |
| 13 | src/screens/web/WebGamificationScreen.tsx | |
| 12 | src/screens/web/WebDashboardScreen.tsx | |
| 12 | src/screens/web/WebPrinterScreen.tsx | |

## 2. Reports (mobile + shared)

| Lines | File |
|---:|---|
| 44 | src/screens/reports/ProductReportListScreen.tsx |
| 44 | src/screens/reports/InventoryReportListScreen.tsx |
| 37 | src/screens/reports/SalesReportListScreen.tsx |
| 30 | src/screens/reports/EnterpriseReportListScreen.tsx |
| 29 | src/screens/reports/ProfitReportListScreen.tsx |
| 28 | src/screens/reports/ProfitReportScreen.tsx |
| 24 | src/screens/reports/InventoryReportScreen.tsx |
| 21 | src/screens/reports/SalesReportScreen.tsx |
| 19 | src/screens/reports/EnterpriseReportScreen.tsx |
| 17 | src/screens/reports/ProductReportScreen.tsx |
| 17 | src/navigation/ReportsNavigator.tsx |
| 9 | src/components/reports/DateRangePicker.tsx |
| 6 | src/utils/exportReport.ts |
| 5 | src/components/reports/ReportListView.tsx |
| 2 | src/types/reports.ts |
| 1 | src/components/reports/ReportCard.tsx |

Web reports (`WebReportsScreen`, `WebDailySummaryScreen`, `WebSaleHistoryScreen`) are listed in group 1.

## 3. Products, categories and master import/export

| Lines | File | Note |
|---:|---|---|
| 212 | src/utils/masterImportExport.ts | Column headers / validation messages. Some headers are also file-format identifiers, so check import compatibility before translating them. |
| 87 | src/screens/product/AddEditProductScreen.tsx | |
| 43 | src/components/product/UOMManager.tsx | |
| 43 | src/components/product/MasterMigrationWizard.tsx | |
| 36 | src/screens/product/AddProductScreen.tsx | |
| 21 | src/screens/product/ImportExportScreen.tsx | |
| 16 | src/screens/product/CategoryManageScreen.tsx | |
| 16 | src/screens/product/ProductListScreen.tsx | |
| 7 | src/hooks/useMasterMigration.ts | |
| 6 | src/types/product.ts | |
| 3 | src/utils/spreadsheetIO.ts | |
| 3 | src/store/categoryStore.ts | |
| 3 | src/store/brandStore.ts | |
| 3 | src/store/supplierStore.ts | |

## 4. Inventory

| Lines | File |
|---:|---|
| 53 | src/screens/inventory/StockDocDetailScreen.tsx |
| 46 | src/screens/inventory/StockDocFormScreen.tsx |
| 22 | src/screens/inventory/StockDocListScreen.tsx |
| 17 | src/navigation/InventoryNavigator.tsx |
| 16 | src/store/stockDocStore.ts |
| 13 | src/components/inventory/ProductSearchDropdown.tsx |
| 6 | src/types/inventory.ts |
| 5 | src/types/stockDocument.ts |
| 3 | src/components/inventory/DocStatusBadge.tsx |

## 5. CRM / customer / promotion / coupon

| Lines | File |
|---:|---|
| 72 | src/screens/promotion/components/PromoConditionTabs.tsx |
| 54 | src/screens/promotion/BundleProductPromoCreateScreen.tsx |
| 50 | src/screens/promotion/GroupProductPromoCreateScreen.tsx |
| 49 | src/screens/promotion/StorePromoCreateScreen.tsx |
| 43 | src/screens/promotion/QuantityPromoCreateScreen.tsx |
| 38 | src/utils/promoValidation.ts |
| 35 | src/screens/member/PointHistoryScreen.tsx |
| 34 | src/screens/promotion/PromoGroupManageScreen.tsx |
| 33 | src/screens/promotion/AdvancedPromoScreen.tsx |
| 29 | src/screens/promotion/components/PromoRewardSection.tsx |
| 27 | src/types/memberPromotion.ts |
| 24 | src/store/memberTypeStore.ts |
| 21 | src/screens/member/RedeemScreen.tsx |
| 21 | src/screens/promotion/MemberPromoListScreen.tsx |
| 21 | src/screens/promotion/GroupProductPromoListScreen.tsx |
| 19 | src/screens/promotion/PercentDiscountScreen.tsx |
| 19 | src/types/coupon.ts |
| 18 | src/services/api/lineApi.ts |
| 18 | src/screens/promotion/BundleProductPromoListScreen.tsx |
| 17 | src/screens/promotion/MemberPriceScreen.tsx |
| 17 | src/screens/promotion/PromoListScreen.tsx |
| 16 | src/screens/promotion/FixedDiscountScreen.tsx |
| 15 | src/screens/member/AddMemberScreen.tsx |
| 15 | src/screens/promotion/CouponScreen.tsx |
| 15 | src/screens/promotion/QuantityPromoListScreen.tsx |
| 13 | src/services/autoCouponTriggers.ts |
| 11 | src/store/promoStore.ts |
| 11 | src/store/memberStore.ts |
| 10 | src/screens/promotion/PromoCategoriesScreen.tsx |
| 10 | src/screens/coupon/components/CouponImportModal.tsx |
| 9 | src/screens/coupon/components/CouponExportModal.tsx |
| 8 | src/store/richMenuStore.ts |
| 8 | src/screens/member/MemberListScreen.tsx |
| 7 | src/store/walletStore.ts |
| 6 | src/constants/memberTypeColors.ts |
| 4 | src/store/couponStore.ts |
| 4 | src/screens/coupon/components/CouponStatusBadge.tsx |
| 3 | src/components/sale/CouponInput.tsx |
| 3 | src/services/coupon/CouponImporter.ts |
| 2 | src/components/sale/CouponAppliedBanner.tsx |
| 1 | src/store/communicationStore.ts |

Store-provided messages shown as-is in phase-1 screens belong here too: `validateCoupon` `result.error` (`promoStore`), wallet `tx.description` (`walletStore`) and member-type names (user data).

## 6. Mobile settings (`src/screens/settings/**`)

| Lines | File | Note |
|---:|---|---|
| 59 | src/screens/settings/ShopSettingsScreen.tsx | |
| 59 | src/screens/settings/CustomerDisplaySettingsScreen.tsx | Customer-display related, so coordinate with the display/ad workflow |
| 47 | src/screens/settings/StaffManagementScreen.tsx | |
| 40 | src/screens/settings/UserManageScreen.tsx | |
| 35 | src/screens/settings/SettingsHubScreen.tsx | Phase 1 added the language card (UI + receipt rows). The hub rows are phase 2. |
| 32 | src/screens/settings/PermissionMatrixScreen.tsx | Has pre-existing lint errors (baseline) |
| 30 | src/screens/settings/BranchManageScreen.tsx | |
| 30 | src/screens/settings/POSManageScreen.tsx | |
| 28 | src/screens/settings/SecuritySettingsScreen.tsx | |
| 25 | src/screens/settings/UserManagementScreen.tsx | |
| 24 | src/screens/settings/SyncMonitorScreen.tsx | |
| 23 | src/screens/settings/RoleManageScreen.tsx | Has pre-existing lint errors (baseline) |
| 18 | src/screens/settings/AuditLogScreen.tsx | |
| 18 | src/screens/settings/PrinterSettingsScreen.tsx | |

## 7. Mobile sale screens outside phase 1

| Lines | File |
|---:|---|
| 72 | src/screens/sale/ShiftScreen.tsx |
| 45 | src/screens/sale/CancelBillScreen.tsx |
| 28 | src/components/sale/SaleModePicker.tsx |
| 27 | src/screens/sale/DiscountScreen.tsx |
| 15 | src/screens/sale/BarcodeScannerScreen.tsx |
| 12 | src/screens/sale/ShiftGateScreen.tsx |
| 9 | src/components/sale/ServiceStaffPopup.tsx |
| 3 | src/components/sale/StaffPopup.tsx |

## 8. Kiosk

| Lines | File |
|---:|---|
| 32 | src/screens/kiosk/KioskSetupScreen.tsx |
| 26 | src/screens/kiosk/KioskPOSSaleScreen.tsx |
| 12 | src/components/kiosk/KioskExitModal.tsx |
| 5 | src/store/kioskStore.ts |
| 3 | src/components/kiosk/KioskLockScreen.tsx |
| 3 | src/components/kiosk/KioskWrapper.tsx |

## 9. Sync / offline

| Lines | File |
|---:|---|
| 33 | src/screens/sync/ConflictResolutionScreen.tsx |
| 26 | src/store/syncStore.ts |
| 23 | src/screens/dashboard/SyncStatusScreen.tsx |
| 21 | src/screens/sync/SyncQueueScreen.tsx |
| 14 | src/navigation/SyncNavigator.tsx |
| 13 | src/screens/sync/LocalTransactionScreen.tsx |
| 7 | src/types/sync.ts |
| 1 | src/services/sync/SyncService.ts |

## 10. Dashboards

| Lines | File |
|---:|---|
| 29 | src/screens/dashboard/MainDashboardScreen.tsx |
| 20 | src/screens/dashboard/CashierDashboardScreen.tsx |
| 16 | src/screens/dashboard/DashboardScreen.tsx |

## 11. Stores / types / constants / services with user-visible labels

These are mostly label maps, default config values or messages that a store returns. Some are persisted defaults (user data), so decide per field: move the label to a key map in `src/i18n/labels.ts`, or keep it as data.

| Lines | File | Note |
|---:|---|---|
| 56 | src/store/permissionStore.ts | Permission/module labels |
| 39 | src/types/staff.ts | |
| 35 | src/constants/rolePermissions.ts | |
| 29 | src/store/saleHistoryStore.ts | |
| 27 | src/store/storeConfigStore.ts | Seeded store defaults (user data) |
| 27 | src/store/testTrackerStore.ts | Internal QA tool |
| 20 | src/store/pricingStore.ts | |
| 11 | src/store/posPermissionStore.ts | `POS_ACTION_LABELS`, PIN `result.message`, shown as-is on the web POS |
| 10 | src/types/sale.ts | `ORDER_TYPE_LABELS` / `PAYMENT_LABELS` kept on purpose for phase-2 callers |
| 9 | src/services/api/paymentApi.ts | |
| 9 | src/store/branchPermissionStore.ts | |
| 5 | src/store/paymentConfigStore.ts | |
| 5 | src/store/authStore.ts | `ROLE_LABELS` (fallback; UI uses `ROLE_KEYS`) |
| 5 | src/store/erpStore.ts | |
| 3 | src/store/shiftStore.ts | |
| 3 | src/hooks/useUserBranches.ts | |
| 2 | src/store/auditLogStore.ts | |
| 2 | src/hooks/useBranchGuard.ts | |
| 1 | src/config/env.ts | |

## 12. Shared UI components / design system / misc screens

| Lines | File | Note |
|---:|---|---|
| 9 | src/components/ui/LookupCheckbox.tsx | |
| 6 | src/screens/auth/LicenseActivationScreen.tsx | Not part of the phase-1 auth set |
| 5 | src/components/ui/Alert.tsx | |
| 4 | src/components/ui/BranchSelector.tsx | Has pre-existing lint errors (baseline) |
| 3 | src/screens/LoadingScreen.tsx | |
| 1 | src/components/ui/ConfirmModal.tsx | |
| 1 | src/components/ui/StepIndicator.tsx | |
| 1 | src/components/ui/DatePicker.tsx | Has pre-existing lint errors (baseline) |
| 1 | src/design-system/components/AppTable.tsx | |
| 1 | src/design-system/components/AppSearch.tsx | |
| 1 | src/design-system/components/EmptyState.tsx | |

## 13. Mock data (`src/data/**`), not UI, never translated

| Lines | File |
|---:|---|
| 91 | src/data/mockMembers.ts |
| 85 | src/data/mockProducts.ts |
| 70 | src/data/mockEmployees.ts |
| 47 | src/data/mockCommunication.ts |
| 35 | src/data/mockReports.ts |
| 23 | src/data/mockMemberPromotions.ts |
| 22 | src/data/mockInventory.ts |
| 16 | src/data/mockPromotions.ts |
| 5 | src/data/mockBranches.ts |
| 4 | src/data/mockMemberTypes.ts |
| 3 | src/data/mockStaff.ts |

## 14. Forbidden files, owned by another workflow (not touched in phase 1)

| Lines | File |
|---:|---|
| 48 | src/screens/web/WebCustomerDisplayScreen.tsx |
| 42 | src/screens/web/WebAdSettingsScreen.tsx |
| 31 | src/screens/sale/AdManagerScreen.tsx |
| 29 | src/screens/sale/CustomerDisplayScreen.tsx |
| 19 | src/screens/web/WebDisplayScreen.tsx |
| 6 | src/types/customerDisplay.ts |
| 4 | src/store/customerDisplayStore.ts |

Phase 1 sends Thai pay-method labels to the customer display on purpose (`broadcastDisplay({ payMethodLabel: payMethodLabel(id, 'th', label) })` in WebPOSScreen), so the display stays Thai until its own workflow translates it.

## 15. Phase-1 files that still contain Thai on purpose

Every non-comment hit in these files falls into the categories named here. None of them is untranslated UI chrome.

| Lines | File | What remains |
|---:|---|---|
| 142 | src/screens/web/WebPOSScreen.tsx | `logAction` titles/sentences; `MOCK_INVOICES` (cashier/item names, legacy `payMethod` strings, BE dates, cancel reasons); `CATS` category names (`CATS[0]` is the all-sentinel, rendered via `t('pos.allCategories')`); `SHOP_NAME`/`SHOP_ADDR`/`SHOP_BRANCH` shop data; persisted/actor strings (`'แคชเชียร์'` actor, cash-movement fallback reasons, hold-bill remark, auto cancel reason); JSX comments |
| 21 | src/store/receiptStore.ts | Trailing `// …` comments, plus the seeded `shopName`/`shopAddr` defaults (user data). `DEFAULT_FOOTER_TH`/`DEFAULT_BRANCH_TH` are imported from `labels.ts`. |
| 12 | src/utils/receiptTemplate.ts | Designer sample item names (stand-ins for user data); `฿` in `money()`; trailing comments |
| 7 | src/screens/sale/POSSaleScreen.tsx | `CATEGORIES` mock category names (`[0]` is the all-sentinel → `t('pos.allCategories')`); unit-matching regex `/^(ชิ้น|ขวด|…)$/` (data matching, not display); JSX/trailing comments |
| 6 | src/screens/sale/PaymentScreen.tsx | `฿` glyph (input prefix, quick-cash buttons); trailing/JSX comments |
| 4 | src/navigation/SaleNavigator.tsx | Comments only (checked, no change needed) |
| 3 | src/components/web/WebSidebar.tsx | JSX comments |
| 3 | src/components/sale/VariantSelector.tsx | JSX comments |
| 3 | src/screens/sale/ReceiptScreen.tsx | `shopName = 'ร้านค้าตัวอย่าง'` / `shopAddress` defaults (placeholder shop data, user data); JSX comment |
| 1 | src/components/web/WebTopBar.tsx | JSX comment |
| 1 | src/i18n/format.ts | `฿` glyph in `formatMoney` |
| — | WebSimpleScreens / WebReceiptDesignerScreen / WebDocumentSettingsScreen / SettingsHubScreen | Only the language rows were in scope for phase 1. The remaining Thai is phase-2 work (groups 1 and 6). |

The phase-1 auth screens (`LoginScreen`, `AuthLayout`, `OTPLoginScreen`, `ForgotPasswordScreen`, `RegisterShopScreen`, `WelcomeScreen`), `CartScreen`, `HoldBillScreen`, `TaxInvoiceScreen`, `DocumentCancellationScreen`, `MainNavigator`, `WebNavigator`, `AuthNavigator` and `WebLayout` have no non-comment Thai left, so they don't appear in the scan.
