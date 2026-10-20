# Implementation Plan — Match d:\pos-mobile to deployed "Xcellence POS"

Goal: Rebrand metadata/PWA and add 6 missing screens + navigation wiring so the local Expo (RN Web) source matches the deployed app at https://dist-pos-rho.vercel.app/ (brand "Xcellence POS"). Work directly on branch `main`. Do NOT commit or push.

## Ground truth discovered during exploration (read before implementing)

- Design tokens actually exported (use THESE exact names, the steering doc's Material-style names like `headlineMedium`/`bodySmall` and components like `Table`/`Badge`/`Alert`/`StatCard`/`Textarea` do NOT exist):
  - `src/constants/colors.ts` → `Colors.*`: `primary`, `primaryLight`, `primaryDark`, `background`, `backgroundSecondary`, `surface`, `text`, `textSecondary`, `textDisabled`, `border`, `success`, `successLight`, `warning`, `warningLight`, `danger`, `dangerLight`, `info`, `infoLight`, `white`, `black`, `gray100..gray800`, `gray400`, etc. (no `gray0`/`gray8` beyond compat aliases — they exist but prefer `background`/`text`). `Gradients.primary`.
  - `src/constants/typography.ts` → `Typography.*`: `h1`,`h2`,`h3`,`h4`,`body1`,`body2`,`subtitle1`,`subtitle2`,`caption`,`label`,`button`,`price`,`kpiValue`,`displayMedium`,`displaySmall`.
  - `src/constants/spacing.ts` → `Spacing.*` (xs4 sm8 md12 lg16 xl20 xxl/2xl24 3xl32 4xl40 5xl48), `BorderRadius.*` (sm8 md12 lg16 xl20 full9999), `Shadow.*` (none/xs/sm/md/lg/xl/glow), `ComponentSize.button` ({sm36,md44,lg52}), `Container.full`/`Container.center`.
- UI components actually exported from `src/components/ui/index.ts`: `Button`, `Input`, `Card`, `GradientBox`, `DatePicker`, `BranchSelector`. There is NO `Textarea`, `Table`, `Badge`, `Chip`, `Alert`, `StatCard`, `FAB`.
  - `Button` prop API: `title` (NOT `label`), `onPress`, `variant` ('primary'|'secondary'|'outline'|'ghost'|'danger'), `size` ('sm'|'md'|'lg'), `loading`, `disabled`, `fullWidth`, `style`, `textStyle`.
  - `Input` prop API: `label`, `error`, `hint`, `leftIcon`, `rightIcon`, `isPassword`, plus all `TextInputProps` (`value`, `onChangeText`, `placeholder`, `multiline`, etc.). For a "Textarea" use `<Input multiline numberOfLines={n} />`.
- Sibling SALE/AUTH screens (ReceiptScreen, ShiftScreen, AuthLayout) do NOT use the ui barrel heavily. They compose raw RN primitives (`View`/`Text`/`TouchableOpacity`/`TextInput`/`ScrollView`/`Modal`) inside `SafeAreaView` from `react-native-safe-area-context`, with a colored header bar + Ionicons back button, and `StyleSheet.create` using `Colors`/`Typography`/`Spacing`/`BorderRadius`. New sale/auth screens MUST match this; use the `ui` `Button`/`Input` where it fits but follow the header/StyleSheet pattern of the siblings. All error/empty states inline (no `Alert` component exists); use a styled `View` + `Ionicons` + Thai text for empty/error, and `Alert.alert`/`window.alert` for transient messages (ShiftScreen's `confirmAction`/`notify` cross-platform helpers are the reference).
- Sibling WEB screens (WebSimpleScreens, WebBranchManageScreen) use a DIFFERENT palette: `WebColors` from `src/constants/webColors.ts` and tokens from `src/design-system/tokens` (`Colors`,`Space`,`Radius`,`Shadow`,`Font`). They are web-only, use `window.alert`/`window.confirm`, `FlatList`/`ScrollView`, and inline styles + a local `StyleSheet`. New Web* screens MUST follow this web convention (WebColors), NOT the mobile `src/constants` tokens, to match their siblings.
- Stores (verified to exist):
  - `src/store/shiftStore.ts` → `useShiftStore` with `currentShift`, `openShift({posId,posName,cashierName,openingAmount})`, `closeShift`, `isShiftOpen()`, `getExpectedCash()`. `Shift` type exported.
  - `src/store/saleHistoryStore.ts` → `useSaleHistoryStore` with `getSaleByNo(saleNo): SaleRecord | undefined`. `SaleRecord` has items/payments/discount/subtotal/vatAmount/grandTotal/memberName/cashierName/posName/status/createdAt. USE THIS for TaxInvoiceScreen + DocumentCancellationScreen.
  - `src/store/storeConfigStore.ts` → `useStoreConfigStore` holds `storeName`,`storeAddress`,`storePhone`,`storeTaxId` + setters. This is where the LICENSE fields will be added (no license concept exists yet).
  - `src/store/receiptStore.ts` → `useReceiptStore` with `config` (shopName/shopAddr/shopTel/shopTaxId/shopBranch/posRegNo/paperSize/headerText/footerText/showLogo/copies) + `setConfig`. USE THIS for WebDocumentSettingsScreen.
  - `src/store/kioskStore.ts` → `useKioskStore` (kiosk only; shift status for ShiftGate comes from shiftStore).
  - NO plan-tier helpers exist (`getPlanTier`/`getFeaturesByPlan` NOT FOUND). WebLicenseScreen must use local mock plan/feature data and document this as non-1:1.
- Permissions: `src/constants/rolePermissions.ts` → `canAccess(role, routeKey)`. Keys include `settings`, `reports`, `pos`, etc. There is NO `licenses`/`documents`/`branches` key. Per task W3, gate `documents` and `licenses` and `branches` under the existing `'settings'` key (safe existing key).
- `src/components/web/WebSidebar.tsx` HAS a data-driven `NAV_ITEMS` array, but adding visible menu items is OPTIONAL per task and risks changing visible behavior. DO NOT add sidebar items (task says only if obvious; keeping sidebar unchanged is the conservative, behavior-preserving choice). Document this.
- Print: ReceiptScreen's "print" is a MOCKED modal (setTimeout + Alert), it does NOT call expo-print. The real cross-platform print pattern is in `src/utils/exportReport.ts` (`Print.printToFileAsync`/`Print.printAsync` + `Sharing`) and ShiftScreen's web `window.open(...).print()`. TaxInvoiceScreen should build an HTML invoice and print via that pattern (web: `window.open`+print; native: `expo-print`). Document that pixel-exact match to the minified bundle's print is not possible.
- HTML template: there is NO Expo web template override (public/templates has only a CSV; metro.config has no template; webpack unused). `dist/index.html` is Expo-export output with `<title>POS Mobile</title>`, `theme-color #FF343D`, `lang="en"`, and NO manifest link/splash. The title+theme are injected from `app.json` `expo.web` at export time. Plan: update `app.json` (handles title/theme/bg on next export) AND hand-edit the static `dist/index.html` head to match the live head (title, lang="th", description, theme-color #EA580C, manifest link, apple-touch-icon, icon, #splash SVG + "กำลังโหลด POS...", noscript Thai, bg #FFF9F4) WITHOUT touching the hashed `/_expo/static/js/web/index-*.js` script tag. Document that a true rebuild needs `npm run web:build` after app.json changes.

## Verification reality
- `npx tsc --noEmit` (the repo's `lint`/`test` proxy) has **13 PRE-EXISTING errors** unrelated to this task (BranchSelector, DatePicker, PermissionMatrix/RoleManage `supplier`, WebUserStaffScreen `Platform`, errorTracking). The bar is: **introduce ZERO new tsc errors in files we create/modify** (total count must stay ≤ 13, and none of the new errors may reference our new/edited files). `npm run test` (vitest) covers the promotion engine/stores; run it to confirm no regressions.

---

## Part 1 — Rebrand metadata/PWA

- [ ] 1. Update `app.json` branding.
      Set `expo.name` = "Xcellence POS". Under `expo.web`: `name` = "Xcellence POS", `shortName` = "POS", `themeColor` = "#EA580C", `backgroundColor` = "#FFF9F4". Keep `slug` "pos-mobile", `expo.web.output` "single", and every other field untouched.
      Files: `app.json`
      Verify: `node -e "const j=require('./app.json');const w=j.expo.web;if(j.expo.name!=='Xcellence POS'||w.name!=='Xcellence POS'||w.themeColor!=='#EA580C'||w.backgroundColor!=='#FFF9F4'||w.shortName!=='POS'||j.expo.slug!=='pos-mobile'||w.output!=='single')throw new Error('app.json mismatch');console.log('app.json OK')"` prints `app.json OK`.

- [ ] 2. Replace `public/manifest.json` to match the live manifest exactly (name, short_name, description, start_url `/?target=pos`, scope `/`, display `standalone`, display_override, background_color `#FFF9F4`, theme_color `#EA580C`, orientation `any`, lang `th`, dir `ltr`, the 3 icons incl `/icon-pos.svg`, the 4 shortcuts, the 2 screenshots, categories, related_applications `[]`, prefer_related_applications `false`) — full content in the original task spec. Mirror the same file into `dist/manifest.json` so the deployed output matches too.
      Files: `public/manifest.json`, `dist/manifest.json`
      Verify: `node -e "const m=require('./public/manifest.json');if(m.name!=='Xcellence POS'||m.start_url!=='/?target=pos'||m.theme_color!=='#EA580C'||m.icons.length!==3||m.shortcuts.length!==4||m.screenshots.length!==2||m.dir!=='ltr')throw new Error('manifest mismatch');console.log('manifest OK')"` prints `manifest OK`; repeat for `./dist/manifest.json`.

- [ ] 3. Hand-edit `dist/index.html` head to match the live head. Set `<html lang="th">`; `<title>Xcellence POS — ระบบขายหน้าร้าน</title>`; meta description (the manifest description text); `theme-color` `#EA580C`; add `<link rel="manifest" href="/manifest.json">`, `<link rel="apple-touch-icon" href="/icon-192.png">`, `<link rel="icon" href="/icon-pos.svg">`; set body background `#FFF9F4`; add an inline `#splash` SVG with pulse animation + text "กำลังโหลด POS..."; Thai `<noscript>` "กรุณาเปิดใช้งาน JavaScript". Do NOT change the hashed `<script src="/_expo/static/js/web/index-*.js">` tag or any `/_expo/` asset path. Add a `public/index.html` copy as a documented template-of-record for future exports.
      Files: `dist/index.html`, `public/index.html` (new, documentation template)
      Verify: `node -e "const h=require('fs').readFileSync('dist/index.html','utf8');['lang=\"th\"','Xcellence POS','#EA580C','rel=\"manifest\"','กำลังโหลด POS','_expo/static/js/web/index-'].forEach(s=>{if(!h.includes(s))throw new Error('missing '+s)});console.log('index.html OK')"` prints `index.html OK`.

## Part 2 — Sale-side screens + wiring + license gate

- [ ] 4. Create `src/screens/sale/TaxInvoiceScreen.tsx` — `export const TaxInvoiceScreen: React.FC<{saleNo:string; onBack:()=>void; onCancelInvoice:()=>void}>`. Pull `SaleRecord` via `useSaleHistoryStore().getSaleByNo(saleNo)`; read shop tax info from `useStoreConfigStore` / `useReceiptStore`. Full tax invoice (ใบกำกับภาษีเต็มรูป): buyer fields (ชื่อผู้ซื้อ, เลขประจำตัวผู้เสียภาษี, ที่อยู่) as editable `Input`s, line items, VAT 7% breakdown (base + VAT, since prices are VAT-included), invoice number. Buttons: ย้อนกลับ (onBack), พิมพ์ใบกำกับภาษี (build HTML → print via `src/utils/exportReport.ts` pattern / `window.open` on web), ยกเลิกใบกำกับภาษี (onCancelInvoice). Loading (no store hydration), empty/error state when saleNo not found (styled View + Ionicon + Thai "ไม่พบข้อมูลการขาย"). Follow ReceiptScreen header/StyleSheet conventions + tokens.
      Files: `src/screens/sale/TaxInvoiceScreen.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13 and none reference TaxInvoiceScreen.

- [ ] 5. Create `src/screens/sale/DocumentCancellationScreen.tsx` — `export const DocumentCancellationScreen: React.FC<{saleNo:string; documentType:string; onBack:()=>void; onDone:()=>void}>`. Modal-style. Reason form (เหตุผลการยกเลิก, required) using `<Input multiline>`; confirm section showing saleNo + documentType label ('tax_invoice'→'ใบกำกับภาษี', 'receipt'→'ใบเสร็จ'); ยืนยันการยกเลิก button → on confirm call `useSaleHistoryStore().voidSale(saleNo, reason)` then `onDone()`; ปิด/ยกเลิก → `onBack()`. Inline error when reason empty. Thai labels, tokens, sibling conventions.
      Files: `src/screens/sale/DocumentCancellationScreen.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13 and none reference DocumentCancellationScreen.

- [ ] 6. Create `src/screens/sale/ShiftGateScreen.tsx` — `export const ShiftGateScreen: React.FC` (no props). Gate blocking POS until a shift is open. Read `useShiftStore()`; if `isShiftOpen()` show a brief "กะเปิดอยู่" status, else a prominent เปิดกะการขาย button + เงินทอนเริ่มกะ `TextInput`/`Input` (decimal), calling `openShift({posId:'pos1',posName:'POS 1',cashierName: authStore name ?? 'พนักงาน', openingAmount})`. Loading + empty states. Match ShiftScreen's visual conventions/tokens.
      Files: `src/screens/sale/ShiftGateScreen.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13 and none reference ShiftGateScreen.

- [ ] 7. Add license fields to `storeConfigStore` then create `src/screens/auth/LicenseActivationScreen.tsx`. First extend `useStoreConfigStore` with `licenseKey: string`, `licenseActivated: boolean`, and `activateLicense(key:string): boolean` (mock: accept any non-empty trimmed key of length ≥ 6; set both fields; `logAction`). Add non-hook accessor `getStoreConfig()` already returns state. Then `export const LicenseActivationScreen: React.FC<{onActivated:()=>void}>`: storefront-outline Ionicon + Typography heading at top; license key `Input` (คีย์ใบอนุญาต / รหัสเปิดใช้งาน); เปิดใช้งาน License `Button`; on success call `onActivated`, on invalid show inline error (styled View, Thai "คีย์ใบอนุญาตไม่ถูกต้อง"). Loading state on activate. Match AuthLayout/Login styling + tokens.
      Files: `src/store/storeConfigStore.ts`, `src/screens/auth/LicenseActivationScreen.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13 and none reference these files; `npm run test` passes (storeConfig persists).

- [ ] 8. Wire SaleNavigator (W1). In `src/navigation/SaleNavigator.tsx`: import TaxInvoiceScreen + DocumentCancellationScreen; add to `SaleStackParamList`: `TaxInvoice: { saleNo: string }`, `DocumentCancellation: { saleNo: string; documentType: string }`. Register `TaxInvoice` (renders TaxInvoiceScreen, `saleNo` from route, `onBack=goBack`, `onCancelInvoice=()=>navigation.navigate('DocumentCancellation',{saleNo,documentType:'tax_invoice'})`) and `DocumentCancellation` (`options={{presentation:'modal'}}`, renders DocumentCancellationScreen with saleNo+documentType from route, `onBack=goBack`, `onDone=()=>navigation.navigate('Receipt',{saleNo,payments:[]})` — Receipt params need `payments`; pass `[]` safely OR reuse lastPayments state). In ReceiptScreen add OPTIONAL `onTaxInvoice?:()=>void` prop + a button "ออกใบกำกับภาษีเต็มรูป" rendered only when provided (do not break existing `{saleNo,payments}` params); pass `onTaxInvoice={()=>navigation.navigate('TaxInvoice',{saleNo})}` from the navigator.
      Files: `src/navigation/SaleNavigator.tsx`, `src/screens/sale/ReceiptScreen.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13.

- [ ] 9. Add license gate to `App.tsx` (W2, native path only). Change `MobileState` to `'loading'|'license'|'auth'|'main'`. After splash, if `getStoreConfig().licenseActivated` is true go straight to `'auth'`, else `'license'`. Render `LicenseActivationScreen onActivated={()=>setAppState('auth')}` for `'license'`; keep existing `'auth'`→AuthNavigator→`'main'`→MainNavigator. Do NOT change the web path (Platform.OS==='web') except the manifest/head already done. Keep ErrorBoundary/SafeAreaProvider/MainNavigator. NOTE: the existing `useState<MobileState>` is declared AFTER an early web return — keep that structure (hooks run only on native path as today) to avoid breaking the conditional-hook pattern already in the file.
      Files: `App.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13.

## Part 3 — Web-side screens + wiring

- [ ] 10. Create `src/screens/web/WebLicenseScreen.tsx` — `export const WebLicenseScreen: React.FC` (no props). Web admin page (ใบอนุญาต / แพ็กเกจการใช้งาน) following WebSimpleScreens/WebBranchManageScreen conventions (`WebColors`, local `StyleSheet`, `ScrollView`). Read license status from `useStoreConfigStore` (`licenseKey`,`licenseActivated` added in step 7). Show current plan tier, license status, expiry, features — using LOCAL MOCK plan/feature data (no getPlanTier/getFeaturesByPlan exist; document non-1:1). Loading/empty/error states (styled, Thai).
      Files: `src/screens/web/WebLicenseScreen.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13 and none reference WebLicenseScreen.

- [ ] 11. Create `src/screens/web/WebDocumentSettingsScreen.tsx` — `export const WebDocumentSettingsScreen: React.FC` (no props). Web settings page (ตั้งค่าเอกสาร): form bound to `useReceiptStore().config` + `setConfig` for หัวใบเสร็จ (headerText), เลขที่เอกสาร (posRegNo), ที่อยู่ร้าน (shopAddr), เลขประจำตัวผู้เสียภาษี (shopTaxId), footer ใบเสร็จ (footerText), and a เปิด/ปิดใบกำกับภาษี toggle (`Switch`, persisted via a new `taxInvoiceEnabled` flag on receiptStore config OR local state + note). บันทึก button → `setConfig(...)` + success feedback. WebColors conventions, loading/error states.
      Files: `src/screens/web/WebDocumentSettingsScreen.tsx`, (optional) `src/store/receiptStore.ts` (add `taxInvoiceEnabled?: boolean` to config + default)
      Verify: `npx tsc --noEmit` error count stays ≤ 13 and none reference these files.

- [ ] 12. Wire WebNavigator (W3). In `src/navigation/WebNavigator.tsx`: import WebLicenseScreen, WebDocumentSettingsScreen, and WebBranchManageScreen. Add `PAGE_NAMES.licenses='ใบอนุญาต'`, `PAGE_NAMES.documents='ตั้งค่า › เอกสาร'`, `PAGE_NAMES.branches='สาขา'`. Add switch cases: `case 'licenses': return <WebLicenseScreen/>;`, `case 'documents': return <WebDocumentSettingsScreen/>;`, `case 'branches': return <WebBranchManageScreen/>;`. Access control in `navigate()`: map `documents`,`licenses`,`branches` → require `'settings'` access (the safe existing key; none of these keys exist in rolePermissions). Do NOT add sidebar menu items (behavior-preserving; documented). WebBranchManageScreen is NOT currently registered, so adding `branches` is required.
      Files: `src/navigation/WebNavigator.tsx`
      Verify: `npx tsc --noEmit` error count stays ≤ 13.

## Final integration
- [ ] 13. Full verification. Run `npx tsc --noEmit` and confirm total error count ≤ 13 with none referencing any new/edited file from steps 1–12. Run `npm run test` and confirm no regressions. Confirm Part-1 node checks pass. Clean up any temp files.
      Verify: `npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object` ≤ 13; `npm run test` green.

## Non-1:1 / limitations (document in review)
- WebLicenseScreen plan tier + features are mock (no getPlanTier/getFeaturesByPlan in source).
- TaxInvoice printing uses the repo's HTML+print pattern, not the minified bundle's exact routine (not recoverable from minified pos.js).
- License validation is mock (any key length ≥ 6) — the deployed validation logic is minified/unknown.
- dist/index.html is hand-edited to match live head; a real rebuild (`npm run web:build`) regenerates it from app.json and would need a template override to reproduce the splash/CSP exactly.
- Sidebar menu items intentionally NOT added (conservative, matches "only if obvious data-driven list" guidance while avoiding visible behavior change).
