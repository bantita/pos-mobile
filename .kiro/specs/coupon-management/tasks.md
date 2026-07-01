# Tasks

## Task 1: Data Models and Types
- [ ] 1.1 Create coupon types file with all interfaces and enums

## Task 2: Coupon Generator Service
- [ ] 2.1 Create CouponGenerator with generateCouponCodes function <!-- depends:1.1 -->

## Task 3: Coupon Service
- [ ] 3.1 Create CouponService with validate, redeem, cancel, expire methods <!-- depends:1.1,2.1 -->

## Task 4: Engine Integration
- [ ] 4.1 Create CouponConditionEvaluator <!-- depends:3.1 -->
- [ ] 4.2 Register evaluator in condition registry <!-- depends:4.1 -->

## Task 5: Import Service
- [ ] 5.1 Create CouponImporter with parseCSV, validateImportRows, mapThaiStatus <!-- depends:1.1 -->

## Task 6: Export Service
- [ ] 6.1 Create CouponExporter with exportToCSV, applyExportFilter <!-- depends:1.1 -->

## Task 7: Zustand Store
- [ ] 7.1 Create couponStore with campaigns/codes state and CRUD <!-- depends:1.1 -->

## Task 8: Campaign List Screen
- [ ] 8.1 Create CouponCampaignListScreen <!-- depends:7.1 -->

## Task 9: Campaign Create Screen
- [ ] 9.1 Create CouponLimitForm component <!-- depends:1.1 -->
- [ ] 9.2 Create CouponCampaignCreateScreen <!-- depends:7.1,9.1 -->

## Task 10: Campaign Detail Screen
- [ ] 10.1 Create CouponStatusBadge component <!-- depends:1.1 -->
- [ ] 10.2 Create CouponCodeRow component <!-- depends:10.1 -->
- [ ] 10.3 Create CouponCampaignDetailScreen <!-- depends:7.1,10.2 -->

## Task 11: Modal Components
- [ ] 11.1 Create CouponGenerateModal <!-- depends:2.1,7.1 -->
- [ ] 11.2 Create CouponImportModal <!-- depends:5.1,7.1 -->
- [ ] 11.3 Create CouponExportModal <!-- depends:6.1,7.1 -->

## Task 12: POS Checkout Integration
- [ ] 12.1 Create CouponInput component <!-- depends:3.1 -->
- [ ] 12.2 Create CouponAppliedBanner component <!-- depends:1.1 -->

## Task 13: Navigation
- [ ] 13.1 Add coupon routes to PromotionNavigator <!-- depends:8.1,9.2,10.3 -->

## Task 14: Tests
- [ ] 14.1 Create CouponGenerator tests <!-- depends:2.1 -->
- [ ] 14.2 Create CouponService tests <!-- depends:3.1 -->
- [ ] 14.3 Create CouponConditionEvaluator tests <!-- depends:4.1 -->
