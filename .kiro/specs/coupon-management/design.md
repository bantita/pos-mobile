# Design Document: Coupon Management

## Overview
ขยาย POS Mobile promotion engine ให้รองรับคูปอง โดยเพิ่ม CouponConditionEvaluator เข้า ConditionRegistry ที่มีอยู่ ไม่แก้ resolver/benefit calculator ที่มี

## Architecture
1. แคชเชียร์สแกน/กรอกรหัสคูปอง
2. POS สร้าง CalculationRequest โดยใส่ condition type: 'coupon' + couponCode
3. Engine route ไปที่ CouponConditionEvaluator
4. Evaluator เรียก CouponService.validateCoupon()
5. ถ้าผ่าน → return ConditionResult { passed: true, matchedItems }
6. Engine ทำ conflict resolution + benefit calculation ตามปกติ
7. POS แสดงผล discount → เมื่อ commit sale เรียก CouponService.redeemCoupon()

## File Structure
- src/types/coupon.ts — Data models
- src/services/coupon/CouponGenerator.ts — Generate codes
- src/services/coupon/CouponService.ts — Validate, redeem, cancel
- src/services/coupon/CouponImporter.ts — Parse CSV/Excel
- src/services/coupon/CouponExporter.ts — Export CSV/Excel
- src/store/couponStore.ts — Zustand state
- src/engine/conditions/evaluators/coupon.ts — Engine evaluator
- src/screens/coupon/ — Management screens
- src/components/sale/CouponInput.tsx — POS checkout

## Data Models
See src/types/coupon.ts for interfaces:
- CouponCampaign, LimitControl, CouponCode, CouponStatus, StatusTransition
- ValidationContext, ValidationResult, RedemptionResult, ImportResult, ExportFilter

## Engine Integration
CouponConditionEvaluator implements ConditionEvaluator (type: 'coupon')
Registered in condition registry. Delegates to CouponService for validation.
