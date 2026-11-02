# i18n Phase 1 — Verification

Branch `feat/i18n-phase1` in worktree `d:\pos-mobile\.worktrees\i18n`, based on `main` @ `36e25a3`. Nothing has been pushed.

| Commit | Feature |
|---|---|
| `0079e9c` | FEAT-001: i18n core, language store, `LanguageToggle` |
| `9620371` | FEAT-002: separate receipt language, v3 migration, receipt label helpers |
| `1d44e3d` | FEAT-003: language switchers, receipt-language selectors, nav + auth translated |
| `c12fa03` | FEAT-004: web POS + payment, receipt-language POS printing |
| `4afb747` | FEAT-005: mobile sale, payment and receipt screens |

**Browser walkthrough NOT performed.** This environment has no browser automation, and I didn't start a dev server or export (an export would write `d:\pos-mobile\dist`, which is off-limits). Everything below was checked with `tsc --noEmit` (`npm run lint`), vitest unit tests and source scans. The reviewer walkthrough at the end still needs a person to run it.

## 1. Files changed

`git -C d:\pos-mobile\.worktrees\i18n diff --stat main...HEAD`: **73 files changed** (including the two committed docs under `.agents/tasks/`).

The working tree is clean for `src/`. This doc and `i18n-phase2-inventory.md` are committed separately (`docs:` commit after `4afb747`). The workflow artifacts under `.agents/tasks/i18n-phase1/` are untracked; the merge step commits them.

New files:
- `src/i18n/{types,translate,format,labels,useT,useReceiptT,index}.ts`
- `src/i18n/locales/{th,en}/{common,nav,auth,pos,payment,receipt,receiptScreen,settings,index}.ts`
- `src/i18n/__tests__/{format,labels,parity,translate}.test.ts`, `useT.test.tsx`
- `src/store/languageStore.ts` and `src/store/__tests__/languageStore.test.ts`
- `src/components/ui/LanguageToggle.tsx`
- `src/utils/posReceiptData.ts`, `src/utils/taxInvoiceHtml.ts` and their tests
- `src/types/react-dom-test.d.ts`

Modified files:
- **Infra:** `src/components/ui/index.ts`, `src/store/receiptStore.ts`, `src/utils/receiptTemplate.ts`, `src/utils/memberTypeBenefits.ts`, `src/engine/adapter/cartAdapter.ts`
- **Navigation:** `src/components/web/{WebLayout,WebSidebar,WebTopBar}.tsx`, `src/navigation/{AuthNavigator,MainNavigator,WebNavigator}.tsx`
- **Auth:** `src/screens/auth/{AuthLayout,ForgotPasswordScreen,LoginScreen,OTPLoginScreen,RegisterShopScreen,WelcomeScreen}.tsx`
- **Web POS:** `src/screens/web/WebPOSScreen.tsx`
- **Mobile sale:** `src/screens/sale/{POSSaleScreen,CartScreen,HoldBillScreen,PaymentScreen,ReceiptScreen,TaxInvoiceScreen,DocumentCancellationScreen}.tsx`, `src/components/sale/VariantSelector.tsx`
- **Settings selectors:** `src/screens/settings/SettingsHubScreen.tsx`, `src/screens/web/{WebDocumentSettingsScreen,WebReceiptDesignerScreen,WebSimpleScreens}.tsx` (WebSimpleScreens: 3 import lines + `WebSettingsScreen` only)
- **Tests:** `src/store/__tests__/receiptStore.migration.test.ts`, `src/utils/__tests__/{receiptTemplate,memberTypeBenefits}.test.ts`

Forbidden files were checked and are not in the diff: `WebAdSettingsScreen.tsx`, `customerDisplayStore.ts`, `types/customerDisplay.ts`, `WebCustomerDisplayScreen`, `WebDisplayScreen`, `CustomerDisplayScreen`, `AdManagerScreen`, `d:\pos-mobile\dist`.

## 2. Namespaces and key counts

These are leaf keys in the th source of truth. The en files have exactly the same key set: it is enforced by `LocaleShape<typeof th…>` at compile time and by `parity.test.ts` at runtime.

| Namespace | Keys | Used by |
|---|---:|---|
| `common` | 16 | shared buttons/states, `langShort.*`, `docType.*` |
| `nav` | 56 | sidebar, breadcrumbs, mobile tabs, roles, report sub-items |
| `auth` | 74 | login, OTP, forgot password, register, welcome |
| `pos` | 232 | web POS + mobile sale/cart/hold (`pos.mobile.*`, `pos.hold.*`), order types, variants |
| `payment` | 65 | pay methods, web payment modal, mobile PaymentScreen (`payment.mobile.*`), member-type discount |
| `receipt` | 77 | **printed/paper text only** (receipt language): captions, totals, tax invoice, top-up slip, `receipt.paper.*` |
| `receiptScreen` | 30 | UI chrome of the receipt / tax-invoice / cancel-document screens |
| `settings` | 4 | language selectors and the receipt-language hint |
| **Total** | **554** | |

Unused-key scan (integration pass): every key is referenced except six `common.*` seeds that the plan asked for up front (`loading`, `error`, `errorTitle`, `noData`, `retry`, `search`) and are kept for phase 2. The two dead FEAT-001 placeholders `receiptScreen.print` / `receiptScreen.share` were removed.

## 3. Architecture summary

- **In-house, no new dependency.** `translate(lang, key, params?)` is pure. It does `{param}` interpolation, falls back to th with a dev-only `console.warn`, and returns the key itself if th is missing too. The hooks are `useT()`, `useUiLanguage()` and `useFormat()`. There's also a non-hook `t()` for handlers and alerts. Dates and money are formatted deterministically, without Intl: th is `dd/MM/(BE)`, en is `dd/MM/yyyy`, and both use `฿1,234.50`.
- **`UiKey` vs `ReceiptKey`.** `ReceiptKey` covers `receipt.*` and `UiKey` covers everything else. `t()`/`useT()` accept only `UiKey`, and `useReceiptT().rt` accepts only `ReceiptKey`, so calling `t('receipt.x')` on a paper mock is a compile error. Pure helpers use the generic `translate(lang, TranslationKey)`. That is how the ReceiptScreen order-type badge renders `translate(rl, ORDER_TYPE_KEYS[type])` in the receipt language.
- **`languageStore`.** It is persisted as `'pos-language'` (v1, `persistStorage`) and holds the per-device `uiLanguage`. `merge` turns garbage into `'th'`. On the web it sets `document.documentElement.lang`. It is not part of `TEST_DATA_KEYS`.
- **Receipt language.** `ReceiptConfig.receiptLanguage` is persisted under the existing `receiptStore` key, now at version 3. `migrate` chains v1 → template, then v<3 → `receiptLanguage: 'th'`, and passes v≥3 through unchanged. `merge` also normalizes the value. The pure helpers in `receiptTemplate.ts` (`receiptDocTitle`, `receiptDateTime`, `receiptPayMethod`, `receiptCashier`, `receiptFooter`, `receiptBranch`) take an explicit `lang`. Both the designer (`makeSampleData`) and POS print (`buildPosReceiptData`) go through them, and a parity test keeps preview equal to print.
  - Mobile `ReceiptScreen`/`TaxInvoiceScreen` paper uses `useReceiptT()` (`rt` + `fmt`).
  - The tax-invoice HTML comes from the pure `buildTaxInvoiceHtml(args, receiptLang)`.
  - `DocumentCancellationScreen` is a form, so it uses the UI language only.
- **Seeded-default footer/branch rule.** If the stored footer/branch is empty or equals the seeded Thai default (`DEFAULT_FOOTER_TH` = `'ขอบคุณที่ใช้บริการ 🙏'`, `DEFAULT_BRANCH_TH` = `'สำนักงานใหญ่'`, both defined once in `labels.ts` and used by `receiptStore.DEFAULT`), it prints in the receipt language (`Thank you 🙏` / `Head Office`). Any edited value prints verbatim.
- **Pay methods.** There is one canonical set, `payment.method.*`, used through `payMethodLabel(id, lang, customLabel?)`. User-added `pay_*` types keep their own label. No code reads `PaymentType.label` directly. Persisted or customer-display strings use `'th'`, and on-screen text uses `uiLang`. Mobile PaymentScreen passes `lang: uiLang` to `runCartPromotions` (with `uiLang` in the memo deps), so the synthetic member-type discount name follows the UI language.
- **Kept for phase 2:** `ORDER_TYPE_LABELS`, `PAYMENT_LABELS` and `PAYMENT_ICONS` in `src/types/sale.ts`. Phase-1 screens no longer read them.
- **Left in Thai on purpose:** `logAction` sentences, mock data (`src/data/**`, `MOCK_INVOICES`, category names), shop/product/member names, persisted actor strings such as the cashier name saved to sale history (via `translate('th', 'pos.cashierFallback')`), and labels sent to the customer display.

## 4. How phase 2 adds a string (design §9)

1. Add the key to `src/i18n/locales/th/<ns>.ts`. For a new screen family, create a namespace file and register it in both `th/index.ts` and `en/index.ts`. Keys are camelCase, at most 3 levels deep, with `{name}` placeholders.
2. Run `npm run lint`. The en file now fails with a missing-property error. Add the English text.
3. In the screen, add `const t = useT();` and replace `'ข้อความ'` with `t('ns.key')` or `t('ns.key', { count })`. Dates and money go through `useFormat()` (`f.money`, `f.dateTime`, …). Printed or paper text goes in `receipt.*` and renders with `useReceiptT().rt`/`fmt`; the compiler rejects `t` there. Module constants hold keys (`labelKey: UiKey`), never `t()` calls at module scope. Data→key mappings go through a typed `Record<…, UiKey>` in `labels.ts`.
4. Run `npm test`. The parity test checks the key sets, non-empty values and that placeholder sets match per key.

The remaining work is listed in `.agents/tasks/i18n-phase2-inventory.md` (217 files, about 6.7k lines, grouped by module).

## 5. Lint and test results vs baseline

| Check | Baseline (`baseline.md`) | Now (after cross-FEAT integration fix) |
|---|---|---|
| `npm run lint` (`tsc --noEmit`) | 13 errors in 6 files | **13 errors**, same 6 files (BranchSelector ×3, DatePicker ×4, PermissionMatrixScreen ×1, RoleManageScreen ×2, WebUserStaffScreen ×2, errorTracking ×1). **0 in touched files.** |
| `npm test` (`vitest run`) | 214 pass + 3 suite-load failures | **301 pass**, 0 failing tests. The 3 suite-load failures are the same known ones: `src/engine/__tests__/engine.test.ts`, `src/services/sync/SyncService.test.ts` and `src/store/__tests__/branchPermissionStore.test.ts`, which fail on react-native `Libraries/Image/Image` resolution. |

Cross-FEAT integration pass (re-run after the fix commit): lint 13 errors in the same 6 baseline files, 0 in touched files; tests 301 passed, 26 test files passed, only the 3 known suite-load failures. Fixes: the WebPOSScreen wallet top-up slip helper `tr` now takes `ReceiptKey` (it was the generic `TranslationKey`), so a UI key can't leak onto the printed slip, and the two unused `receiptScreen` keys were dropped. Remaining Thai in the phase-1 files falls into the categories listed in §3 and in the FEAT notes: comments, mock/shop data, `logAction`, persisted actor strings and the `฿` glyph. It also covers the parts that are phase 2 by design: the other SettingsHub rows, the WebDocumentSettings fields, the designer chrome and the rest of WebSimpleScreens. `git diff --name-only main...HEAD` touches no forbidden file.

The 87 new tests: FEAT-001 added 45 (labels 15, translate 10, format 9, parity 4, languageStore 6, useT 1) and FEAT-002 added 42 (posReceiptData, taxInvoiceHtml, receiptTemplate, receiptStore migration, memberTypeBenefits). FEAT-003/004/005 added no tests; their screen logic goes through the tested pure modules. No previously passing test fails.

## 6. Thai wording changes accepted

These are the deliberate changes to Thai output:
- **Pay-method labels are unified (design §8).**
  - Mobile PaymentScreen buttons/split list and ReceiptScreen pay rows: `โอนเงิน` → `โอน`, `บัตรเครดิต` → `บัตร`. The ewallet button keeps `E-Wallet / อื่นๆ` through `payment.ewalletOther`.
  - Web new-sale path: `QR` → `QR Code`, which matches what `invoicesFromHistory` already printed.
- **Designer sample `dateTime`** gains ` น.` (`01/01/2567 10:30 น.`), and an empty footer now renders the thank-you line, so preview = print. An empty `shopBranch` in the sample shows `สำนักงานใหญ่`.
- **Tax-invoice HTML date** changes from `toLocaleString('th-TH')` to `dd/MM/(BE) HH:mm น.`. On-screen dates in ReceiptScreen, TaxInvoiceScreen and HoldBillScreen also switch from the engine-dependent `toLocale*` to the deterministic `dd/MM/(BE) HH:mm`.
- **Mobile ReceiptScreen footer** becomes `ขอบคุณที่ใช้บริการ 🙏`. It now uses the shared `receipt.thankYou`, which adds the emoji.
- **DocumentCancellationScreen doc type** for `receipt` changes from `ใบเสร็จ` to `ใบเสร็จรับเงิน` (`common.docType.receipt`). `tax_invoice` still shows `ใบกำกับภาษี`.
- **Mobile point balances** use digit grouping (`1,234 คะแนน`) through `f.number`.

## 7. Reviewer walkthrough (manual, not yet performed)

1. **Login (web + mobile).** Use the TH | EN toggle at the top of the form column. Labels, placeholders, demo hint and errors switch immediately, and any visible error clears. OTP, Forgot and Register have the toggle too.
2. **Web top bar.** The toggle sits next to the user info. Switching to EN translates the sidebar items, report sub-items, breadcrumbs, role label and the fullscreen confirm.
3. **Web settings (`WebSettingsScreen`).** The language card sits above the cards grid and drives the same store as the top bar.
4. **Reload persists.** With EN selected, reload the web app (or cold-start mobile). The UI comes back in EN. Mobile may flash Thai for one frame while AsyncStorage hydrates; that's accepted. On web, `<html lang>` should be `en`.
5. **UI=en + receipt=th.**
   - Set receipt language TH in `WebDocumentSettingsScreen` (บันทึก / Save) or the designer toolbar.
   - On the web POS, complete a sale and print. The 80 mm print shows Thai titles/captions, a BE date with ` น.` and `เงินสด`, while the POS chrome stays English.
   - Open the receipt designer. The preview matches the print (title, footer, branch, date format).
6. **UI=th + receipt=en (the reverse).** The print and designer preview show `Abbreviated Tax Invoice` / `Receipt`, a Gregorian date with no ` น.`, `Cash`, `Thank you 🙏` and `Head Office` (when footer/branch are untouched). The chrome stays Thai. An edited footer/branch prints verbatim in both languages.
7. **Mobile POS flow** (sale → cart → hold → payment → receipt → tax invoice → cancel document):
   - Chrome follows the UI language, including the order-type modal, VariantSelector, payment methods, QR modal, the member/points modals and the cancel-document form with its validation error (switches live).
   - The receipt paper, the tax-invoice document body and the printed tax-invoice HTML follow the receipt language. That includes the order-type badge and the order-detail captions.
   - With EN UI and a member of a discounted type selected, the promotion row reads `<Type> discount N%`.
8. **Mobile settings hub.** The language card has a UI-language row and a receipt-language row with the legal hint. Both work and persist. The other hub rows are still Thai (phase 2).
9. **Customer display (forbidden files).** It stays Thai in both UI languages, as intended.
