# Implementation Plan — i18n Phase 1 (ไทย / English) + separate receipt language

Source of truth: `design.md` (rev 3, APPROVED) + the 3 NITs in `design-review.md` (folded in below).
Worktree: `d:\pos-mobile\.worktrees\i18n` (branch `feat/i18n-phase1`). ALWAYS use absolute paths — relative paths land in the parent workspace `d:\pos-mobile`.

Build / test (run in the worktree):
- `npm run lint` (= `tsc --noEmit`, tests included). Baseline: 13 errors in 6 files (BranchSelector, DatePicker, PermissionMatrixScreen, RoleManageScreen, WebUserStaffScreen, errorTracking). Touched files must add 0 errors; total must stay 13 (or drop).
- `npm test` (= `vitest run`, happy-dom, `@` alias → `src`). Baseline: 214 pass, 3 known suite-load failures (engine.test.ts, SyncService.test.ts, branchPermissionStore.test.ts). No regressions; new tests add to the pass count.
- Tests that import anything reaching `persistStorage` (languageStore, receiptStore, receiptTemplate, posReceiptData, useT) must mock `react-native` (`{ Platform: { OS: 'web' } }`) and `@react-native-async-storage/async-storage` exactly like `src/store/__tests__/receiptStore.migration.test.ts:7-10`.

## FORBIDDEN — never modify (another workflow owns them)
- `src/screens/web/WebAdSettingsScreen.tsx`
- `src/store/customerDisplayStore.ts`
- `src/types/customerDisplay.ts`
- `WebCustomerDisplayScreen` (`src/screens/web/WebCustomerDisplayScreen.tsx`), `WebDisplayScreen`, `CustomerDisplayScreen`, `AdManagerScreen` (any path)
- `d:\pos-mobile\dist` (never touch, never build into it)
WebPOSScreen imports `useCustomerDisplayStore` / `WebCustomerDisplayScreen` — keep those imports and calls as-is; `broadcastDisplay({ payMethodLabel })` passes `payMethodLabel(pt.id, 'th', pt.label)` so the customer display stays Thai.
Before each commit: `git -C d:\pos-mobile\.worktrees\i18n diff --name-only HEAD` must list none of the above.

Rules for every item: Thai stays default + source of truth; user-entered data never translated; `logAction` sentences stay Thai; no hardcoded colors (web: `WebColors`, mobile: `Colors`/`Typography`/`Spacing` + `src/components/ui`); touch targets ≥ 44 (`ComponentSize.button.md`); no `any`; module constants hold `UiKey`s, never call `t()` at module scope; rename shadowing `.map((t, …))`/`onChangeText={(t) …}` params to avoid clobbering `t` from `useT()`.

---

- [ ] 1. i18n core: types, locales (all 8 namespaces seeded), translate, format, labels, hooks, languageStore, test d.ts, LanguageToggle — plus their unit tests.
      - `src/i18n/types.ts`: `Language`, `LANGUAGES`, `isLanguage`, `LocaleShape<T>`, `Leaves`, `TranslationKey`, `UiKey`, `ReceiptKey`, `TParams` (design §1).
      - `src/i18n/locales/th/{common,nav,auth,pos,payment,receipt,receiptScreen,settings}.ts` (`as const`) + `th/index.ts`; `src/i18n/locales/en/<same>.ts` each typed `LocaleShape<typeof thX>` + `en/index.ts`. Seed now: `common.langShort.th|en`, `common.docType.receipt|taxShort|taxFull`, common buttons (save/cancel/confirm/close/back/loading/error/noData/retry…), `payment.method.{cash,transfer,qr,credit,wallet,ewallet,coupon}` (th pinned: เงินสด/โอน/QR Code/บัตร/Wallet/E-Wallet/คูปอง; en: Cash/Transfer/QR Code/Card/Wallet/E-Wallet/Coupon), `payment.memberTypeDiscount` (th `'ส่วนลด{name} {percent}%'`, en `'{name} discount {percent}%'`), `pos.orderType.*` for every `OrderType` in `src/types/sale.ts`, `nav.role.*` for every role in `ROLE_LABELS`, the full `receipt.*` set from design §5.2–5.4 (`thankYou` 'ขอบคุณที่ใช้บริการ 🙏'/'Thank you 🙏', `headOffice`, `dateTimeValue` '{date} {time} น.'/'{date} {time}', `cashierFallback`, `sampleCashier` 'พนักงาน A'/'Staff A', `docTitle.receipt|taxShort|taxFull`, `cancelledStamp`, captions, `orderDetail.readyDate|address|phone|note|table|zone`, column headers, totals/VAT/change labels), `settings.language`, `settings.uiLanguage`, `settings.receiptLanguage`, `settings.receiptLanguageHint`. Other namespaces may start with only a few keys; later items extend them.
      - `src/i18n/translate.ts` (`translate`, `interpolate`, `lookup`, dev guard `typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production'`), `src/i18n/format.ts` (manual dd/MM/BBBB, HH:mm, grouping, `฿`, invalid → `-`, NaN → `฿0.00`), `src/i18n/labels.ts` (`PAY_METHOD_KEYS`, `PAY_ICON`, `ORDER_TYPE_KEYS`, `ROLE_KEYS`, `DOC_TYPE_KEYS`, `payMethodLabel(id, lang, customLabel?)`, `DEFAULT_FOOTER_TH = th.receipt.thankYou`, `DEFAULT_BRANCH_TH = th.receipt.headOffice`), `src/store/languageStore.ts` (persist `pos-language`, v1, merge normalizes, invalid set ignored, `document.documentElement.lang` on web), `src/i18n/useT.ts` (`useT`, `useUiLanguage`, non-hook `t`, `useFormat`), (`useReceiptT.ts` is created in item 2, once `receiptLanguage` exists), `src/i18n/index.ts` barrel (NOT re-exporting `format.ts`).
      - `src/types/react-dom-test.d.ts` (design §10 ambient decls).
      - `src/components/ui/LanguageToggle.tsx` (forwardRef-free controlled segmented TH|EN, 44px segments, `Colors.primary/white/border`, `accessibilityRole="button"`, `accessibilityState={{selected}}`, labels via `common.langShort.*`), exported from `src/components/ui/index.ts`.
      - Tests: `src/i18n/__tests__/{parity,translate,format,labels,useT}.test.ts(x)`, `src/store/__tests__/languageStore.test.ts` (design §10 rows).
      Files: above. Namespaces: all 8 registered.
      Verify: `npm run lint` → still 13 errors, none in new files; `npm test` → new i18n/languageStore tests pass, 214 baseline still pass.

- [ ] 2. Receipt language core (depends on 1): `receiptLanguage` in receipt config, label helpers, POS receipt data + tax-invoice HTML extraction, member-type/cart labels, tests.
      - `src/store/receiptStore.ts`: `ReceiptConfig.receiptLanguage: Language`; `DEFAULT` uses `receiptLanguage: 'th'`, `footerText: DEFAULT_FOOTER_TH`, `shopBranch: DEFAULT_BRANCH_TH`; persist `version 3` with chained `migrate` (design §5.1); `merge` normalizes garbage → `'th'`.
      - `src/i18n/useReceiptT.ts` → `{ rt, receiptLang, fmt }` (export via barrel).
      - `src/utils/receiptTemplate.ts`: add `ReceiptDocType`, `receiptDocTitle`, `receiptDateTime`, `receiptPayMethod`, `receiptCashier`, `receiptFooter`, `receiptBranch`; `makeSampleData(config, lang = config.receiptLanguage ?? 'th')` per §5.2. Renderer signatures unchanged; `text` elements untouched; `money()` unchanged.
      - New `src/utils/posReceiptData.ts`: `PosPrintInvoice`, `ShopFallbacks`, `buildPosReceiptData(invoice, billType, cfg, fallbacks)` (§5.3). Not yet wired into WebPOSScreen (item 4 does that).
      - New `src/utils/taxInvoiceHtml.ts`: `TaxInvoiceHtmlArgs`, `buildTaxInvoiceHtml(args, lang)` — port of `TaxInvoiceScreen.tsx` `buildHTML` (`:71-116`); wiring happens in item 5.
      - `src/utils/memberTypeBenefits.ts`: `memberTypeDiscountLabel(type, lang: Language = 'th')` via `translate(lang,'payment.memberTypeDiscount',…)`.
      - `src/engine/adapter/cartAdapter.ts`: `BuildCalculationArgs.lang?: Language` → synthetic promo name in that language.
      - Tests: extend `src/utils/__tests__/receiptTemplate.test.ts` (cases a–d), new `src/utils/__tests__/posReceiptData.test.ts` (incl. sample↔print parity), new `src/utils/__tests__/taxInvoiceHtml.test.ts`, extend `src/store/__tests__/receiptStore.migration.test.ts` (change `:171` pass-through to `migrate(blob, 3)`; add v2/v1/en-kept/merge-garbage/DEFAULT constants), extend `src/utils/__tests__/memberTypeBenefits.test.ts` (en label, name verbatim).
      Files: above. Namespaces: `receipt.*`, `payment.memberTypeDiscount`, `pos.promo*` as needed.
      Verify: `npm run lint` → 13; `npm test` → all receipt tests pass, existing receiptTemplate/receiptStore/memberTypeBenefits tests unchanged-passing.

- [ ] 3. Receipt-language selectors + UI switchers + navigation + auth (depends on 1–2).
      - Selectors: `src/screens/web/WebDocumentSettingsScreen.tsx` (row "ภาษาใบเสร็จ / Receipt language" in local state, saved via existing บันทึก + `setConfig`, hint `settings.receiptLanguageHint`); `src/screens/web/WebReceiptDesignerScreen.tsx` toolbar `LanguageToggle` → `setConfig({ receiptLanguage })` immediately (rest of designer chrome stays Thai = phase 2); `src/screens/settings/SettingsHubScreen.tsx` card above logout with UI-language and receipt-language rows; `src/screens/web/WebSimpleScreens.tsx` `WebSettingsScreen` (`:2792`) "ภาษา / Language" card above the grid ONLY (do not add to `TEST_DATA_KEYS`; leave the rest of the file Thai).
      - Switchers: `src/screens/auth/LoginScreen.tsx` (top-right row, `setError('')` on change), `src/screens/auth/AuthLayout.tsx` (top of `formCard`), `src/screens/auth/RegisterShopScreen.tsx` (inline), `src/components/web/WebTopBar.tsx` (inside `styles.right` before `userInfo`).
      - Navigation (`nav.*`): `src/components/web/WebSidebar.tsx` (NAV_ITEMS + report sub-items → `labelKey: UiKey`, logout, 'ผู้ใช้ทดลอง'), `src/navigation/WebNavigator.tsx` (`PAGE_NAMES: Record<string, UiKey | [UiKey, UiKey]>`, breadcrumb `t(a) + ' › ' + t(b)`, thrown login error via `t()`), `src/components/web/WebLayout.tsx` (label map + `confirm`), `WebTopBar.tsx` (`ROLE_KEYS` fallback `ROLE_LABELS`), `src/navigation/MainNavigator.tsx` (9 `tabBarLabel`s built in component body). `SaleNavigator.tsx`: no change (Thai only in comments).
      - Auth (`auth.*`): `LoginScreen.tsx`, `OTPLoginScreen.tsx`, `ForgotPasswordScreen.tsx`, `RegisterShopScreen.tsx`, `WelcomeScreen.tsx`, `src/navigation/AuthNavigator.tsx` — all labels, placeholders, validation errors (store `UiKey` in state), thrown errors/alerts via `t()`. Rename `onChangeText={(t) => …}` at LoginScreen `:118/:133`.
      Files: above. Namespaces: `nav.*`, `auth.*`, `settings.*`, `common.*`.
      Verify: `npm run lint` → 13; `npm test` → green (parity test proves th/en key sets after additions).

- [ ] 4. Web POS sale + web payment flow + POS print path (depends on 1–2; only file `src/screens/web/WebPOSScreen.tsx`).
      - Whole file through `useT()`/`useFormat()` except `logAction` strings and mock product/member/shop data. Sub-components (cart row, `PaymentSettingsModal`, paper components) call `useT()`/`useReceiptT()` themselves.
      - `printReceipt80mm` → `buildPosReceiptData` + `buildTemplateHtml` (signature unchanged). `Invoice` + `issuedAt?`, `payMethods?`; producers: new sale (`:2704-2713`, also `cashier: currentUser?.name ?? ''`), `invoicesFromHistory` (`:1608`, `:1619` → `payMethodLabel(p.method,'th')`), `voidNote` (`:1685`), `fullTaxInv` (`:3097`), `MOCK_INVOICES` (`payMethods` ids only).
      - `PaymentType.label?`; `DEFAULT_PAY_TYPES` drop built-in labels; `splitPayments` `{method,label?,amount}`. No direct `label` reads: `'th'` at `:2713` legacy string, `:2771` logAction, `:2489` broadcastDisplay; `uiLang` at pay buttons, `:2610`, `:2648`, `:2073`, `:341` (PaymentSettingsModal list; rename map var `t`→`pt`), `:3045` invoice-detail badge — add local `invPayLabel(inv, uiLang)` used at `:1646` (search also matches `inv.payMethod`), `:2073`, `:3045`. Icons via `PAY_ICON[...] ?? 'card-outline'` (`:2068-2071`).
      - `:2395` → `memberTypeDiscountLabel(memberType, uiLang)`; `buildCalculationArgs`/promo calls pass `lang: uiLang` + memo deps; cashier fallback `:1299` → `t('pos.cashierFallback')`.
      - Paper mocks (`iv.rc*` receipt / abbreviated / full tax): stamps `:789/:851/:956` `rt('receipt.cancelledStamp')`, captions `rt`, dates `:795/:856/:1003`, pay rows `:797/:858/:1005`, thank-you + `receiptBranch(SHOP_BRANCH, rl)`; wallet top-up slip `:3403-3420` via `translate(rl,…)` + `formatMoney(…, rl)`.
      Files: `src/screens/web/WebPOSScreen.tsx` (+ new keys in `pos.*`, `payment.*`, `receipt.*`, `receiptScreen.*`).
      Verify: `npm run lint` → 13 (0 in WebPOSScreen); `npm test` → green incl. posReceiptData parity.

- [ ] 5. Mobile sale/payment/receipt screens (depends on 1–2).
      - `src/screens/sale/POSSaleScreen.tsx` (incl. order-type modal via `ORDER_TYPE_KEYS`), `src/screens/sale/CartScreen.tsx`, `src/screens/sale/HoldBillScreen.tsx`, `src/components/sale/VariantSelector.tsx` → `pos.*`.
      - `src/screens/sale/PaymentScreen.tsx` → `payment.*`; method list (`:51-55`) drops `label`, renders `payMethodLabel(m.key, uiLang)`, ewallet button `payment.ewalletOther`; `runCartPromotions` (`:122`) gets `lang: uiLang`, deps (`:134`) + `uiLang`; `PAYMENT_LABELS` usage → `payMethodLabel`.
      - `src/screens/sale/ReceiptScreen.tsx`: paper via `rt`/`useReceiptT().fmt`; badge `translate(rl, ORDER_TYPE_KEYS[orderType])`; captions `receipt.orderDetail.*`; pay rows `payMethodLabel(p.method, rl)`; `cashierName = ''` → `receiptCashier`; chrome via `t` (`receiptScreen.*`).
      - `src/screens/sale/TaxInvoiceScreen.tsx`: replace inline `buildHTML` with `buildTaxInvoiceHtml(args, receiptLang)`; document body `rt`, chrome `t`.
      - `src/screens/sale/DocumentCancellationScreen.tsx`: UI language only (`receiptScreen.cancel.*`, `DOC_TYPE_KEYS`).
      - Keep `ORDER_TYPE_LABELS`, `PAYMENT_LABELS`, `PAYMENT_ICONS` in `src/types/sale.ts` for phase 2.
      Verify: `npm run lint` → 13; `npm test` → green.

- [ ] 6. Phase-2 inventory + verification doc (depends on 1–5).
      - `d:\pos-mobile\.worktrees\i18n\.agents\tasks\i18n-phase2-inventory.md`: every `src/**/*.ts(x)` (excluding `src/i18n/locales/th/**`, tests, `src/data/**` mock data noted separately, forbidden files flagged as "owned by other workflow") still containing Thai UI strings, with approx Thai-line counts (PowerShell `Select-String '[\u0E00-\u0E7F]'` per file, minus comment-only lines where practical), grouped by module.
      - `d:\pos-mobile\.worktrees\i18n\.agents\tasks\i18n-phase1-verification.md`: files changed (`git diff --stat main...HEAD`), namespaces + key counts, how to add a phase-2 string (design §9), lint/test numbers vs baseline, reviewer walkthrough (switch TH/EN on login/top bar/settings; reload persists; UI=en + receipt=th prints Thai and vice versa; designer preview = print), and an explicit statement whether the browser walkthrough was done.
      Verify: `npm run lint` → 13; `npm test` → green; both docs exist.
