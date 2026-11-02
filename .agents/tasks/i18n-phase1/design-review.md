# Design Review: i18n Phase 1 (rev 3)

I reviewed `.agents/tasks/i18n-phase1/design.md` (rev 3) against the original user request (msgs 11–12: switchable TH/EN, delivered in phases; receipts and printed documents get their own language setting) and against the code in `d:\pos-mobile\.worktrees\i18n` (HEAD 36e25a3; the only change in the tree is `.agents/tasks/i18n-phase1/`).

**Verdict: APPROVED** (0 HIGH, 0 MEDIUM, 3 NIT)

Rev 3 fixes all 8 findings from rev 2. I checked each fix against the code:
- The void-note and full-tax producers now set `issuedAt` and `payMethods`.
- A "no direct `label` read" rule is in place, with `th` vs `uiLang` assigned per call site.
- The known ids now include `ewallet`, and the Thai labels are pinned, with the wording changes listed.
- The legacy `dateTime` goes through `receipt.dateTimeValue`.
- The ReceiptScreen order-type badge and captions are on the receipt-language path.
- The dev-guard wording is corrected.
- Line references are refreshed.
- `PAY_ICON` is defined.

The core requirements are covered and enforced:
- th is the source of truth, and en must match its key set (`LocaleShape` at compile time plus a runtime parity test).
- `t()` falls back to th, interpolates `{param}`, can be called outside components, and `useT()` re-renders on language change.
- `receiptLanguage` is separate from the UI language. The `UiKey`/`ReceiptKey` types block mixing them up.
- Designer preview and print use the same label helpers, and a parity test locks this in.
- The v2 → v3 migration defaults `receiptLanguage` to `'th'`.
- User data is never translated.
- Forbidden files are untouched, and phase-2 screens stay out of scope.
- The choice of no new dependency is explained.

The three NITs below are small call-site gaps that the stated rules already cover. They don't block the design.

## Findings

### 1. NIT: `PaymentSettingsModal` reads `PaymentType.label` directly, and it isn't in the call-site list
Where: §5.3, "Rule: no code reads `PaymentType.label`…". The call sites listed are `:2489`, `:2493/:2640` (the pay buttons), `:2610`, `:2648`, `:2713` and `:2771`.
Problem: `WebPOSScreen.tsx:341` renders `{t.label}` in the payment-type settings list. Once `DEFAULT_PAY_TYPES` drop their labels, the built-in rows render blank. The map variable there is called `t` (`types.map((t, i) => …)`), so it shadows the `t` from `useT()` that the design asks this component to call (§2).
Fix: add `:341` to the uiLang display list as `payMethodLabel(pt.id, uiLang, pt.label)`. Rename the map variable from `t` to `pt`. Do the same at `LoginScreen.tsx:118/133` (`onChangeText={(t) => …}`).

### 2. NIT: The pay badge in the invoice-detail header still shows the legacy Thai `payMethod`
Where: §5.3 uiLang displays. Only the list column `:2073` is listed.
Problem: `WebPOSScreen.tsx:3045` renders `{selectedInv?.payMethod}`, which is the Thai legacy string. With the UI in English, that badge stays Thai.
Fix: render the same expression as `:2073` there: `selectedInv.payMethods ? selectedInv.payMethods.map(m => payMethodLabel(m.id, uiLang, m.label)).join(' + ') : selectedInv.payMethod`. You could pull it into a local `invPayLabel(inv, uiLang)` helper and use it at `:1646`, `:2073` and `:3045`.

### 3. NIT: `memberTypeDiscountLabel` defaults to `'th'`, so a forgotten call site stays Thai without any error
Where: §7 Payment. `memberTypeDiscountLabel(type, lang: Language = 'th')`.
Problem: the web summary row `WebPOSScreen.tsx:2395` calls `memberTypeDiscountLabel(memberType)`. The design never says this call site must pass the UI language. The default keeps the existing test unchanged, but it also hides an omission.
Fix: state the call sites explicitly. `:2395` becomes `memberTypeDiscountLabel(memberType, uiLang)`. `PaymentScreen.tsx:122` passes `lang: uiLang` into `runCartPromotions` and adds `uiLang` to the memo deps (`:134`).

## Verified assumptions
- Stack:
  - `typescript ~5.3.3`, zustand 4.5, vitest 2 + happy-dom, React 18.2.
  - `@types/node` is installed and `@types/react-dom` is not, so the ambient `react-dom-test.d.ts` approach is needed and valid.
- Baseline (`baseline.md`): 13 tsc errors in 6 files, and 214 tests passing with 3 suite-load failures.
- `receiptStore.ts`:
  - `version: 2` at `:432`. The current `migrate` (`:435-447`) only handles `< 2`, so the rev-3 chained migrate with identity pass-through for ≥3 is correct.
  - `merge` (`:449-461`) runs on every hydrate and is the right place to normalize `receiptLanguage`.
  - `DEFAULT.shopBranch = 'สำนักงานใหญ่'` (`:247`) and `footerText = 'ขอบคุณที่ใช้บริการ 🙏'` (`:252`) match the §1 constants.
- `receiptStore.migration.test.ts:171-175` is the `migrate(blob, 2)` `toBe(blob)` test, so changing it to `3` is correct.
- No test builds a complete `ReceiptConfig` literal. `receiptTemplate.test.ts:306` uses `as ReceiptConfig` and only checks the shop name and item count, so making `receiptLanguage` required and changing the sample `dateTime`/footer doesn't break existing tests.
- `receiptTemplate.ts`:
  - `makeSampleData(config)` is at `:269`.
  - The sample values are hard-coded: `docTitle` `:294`, `dateTime: '01/01/2567 10:30'` `:296`, `cashier` `:297`, `payMethod` `:298`, `footerText: config.footerText ?? ''` `:290`.
- `WebReceiptDesignerScreen.tsx:160` builds `data` with `makeSampleData(config)`, and `:268` prints that same `data`. So preview = print holds once the helpers are in place.
- `WebPOSScreen.tsx`:
  - `PaymentType` with a required `label` is at `:47`, `Invoice` at `:50`, and `DEFAULT_PAY_TYPES` at `:120-125` (`QR` label).
  - The `printReceipt80mm` data block is at `:384-421`.
  - `invoicesFromHistory` builds the hand-made Thai `payMethod` at `:1619`, and the search is at `:1646`.
  - `voidNote` is at `:1685` and copies `cancelTarget.payMethod` at `:1691`. `fullTaxInv` is at `:3097` and copies `selectedInv.payMethod` at `:3103`.
  - The icon matching is at `:2069-2070` and the list column at `:2073`.
  - The `broadcastDisplay` call that reads `pt.label` is at `:2489`.
  - The split list `:2610`, the caption `:2648`, the add-split `:2663` and the joined-label `payMethod` at `:2713` all read `label`, and the `logAction` at `:2771` does too.
  - The paper pay rows are at `:797/:858/:1005`.
- `src/types/sale.ts`:
  - `ORDER_TYPE_LABELS` is at `:91`.
  - `PAYMENT_LABELS` (`:107-113`) is `cash|transfer|qr|credit|ewallet` with mobile wording `โอนเงิน`/`บัตรเครดิต`, which matches the accepted wording changes in §8.
- `PaymentScreen.tsx:51-55`: the method list includes `ewallet: 'E-Wallet / อื่นๆ'`, so `payment.ewalletOther` is justified. `runCartPromotions` is called at `:122` with memo deps at `:134`.
- `ReceiptScreen.tsx`:
  - The defaults `shopName` (`:47`) and `cashierName = 'พนักงาน'` (`:50`) are as the design says.
  - The order-type badge is at `:144`, the order-detail captions at `:147-158`, and the `PAYMENT_LABELS` pay rows at `:222`.
  - The footer lines are at `:241/:242`. The design cites `:243` for the second one, but the content matches.
- `mockProducts.ts:303`: the guard behaves as the rev-3 wording describes.
- `WebSimpleScreens.tsx`: `TEST_DATA_KEYS` is at `:2781`, `WebSettingsScreen` at `:2792`, and `SettingReceiptScreen` at `:1856`.
- `WebDocumentSettingsScreen.tsx` exists and uses local state, `setConfig` and a save button. The `documents` route is wired up in `WebNavigator.tsx:17/:42`.
- `PAGE_NAMES` (`WebNavigator.tsx:26`), `WebLayout.tsx:47 confirm(...)`, `WebTopBar.tsx` `ROLE_LABELS`/`styles.right`/`userInfo`, `AuthLayout` `formCard` (`:61`), the LoginScreen `error`/`setError` (`:49-60`), and the SettingsHub logout (`:331`) are all as the design describes.
- `SaleNavigator.tsx` contains Thai only in comments, so it needs no change.
- `cartAdapter.ts:50` is `BuildCalculationArgs`. Promo names only show on screen (PaymentScreen `:415`) and never reach a receipt, so using the UI language for them is correct.
- `TaxInvoiceScreen.tsx` and `DocumentCancellationScreen.tsx` are in `src/screens/sale/`.
- The §7 modify list doesn't include any forbidden file. The customer display stays Thai through `payMethodLabel(…, 'th', …)` at `:2489`.

## Unverified / wrong assumptions
- Unverified (not executed): the exact TS excess-property diagnostics for nested `LocaleShape` literals that are annotated per namespace. This is standard TS behaviour, and the runtime parity test backs it up.
- Unverified: the web `window.open` print paths at runtime. The design asks for a browser walkthrough, or an explicit note in the verification doc saying it wasn't done.
- Minor wrong line ref: the ReceiptScreen `กรุณาเก็บใบเสร็จ…` line is `:242`, not `:243`. The content matches, so this has no impact.
