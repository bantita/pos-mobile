# Bilingual TH/EN UI with a separate receipt language (i18n phase 1), pass 2

This is the second review pass. The branch adds an in-house i18n layer (`src/i18n/`): typed th/en dictionaries, a pure `translate()`, `useT()`/`t()`, deterministic formatters, and a persisted per-device `languageStore` (`'pos-language'`, default `th`). Printed and paper output follows a separate `receiptStore.config.receiptLanguage`, which a chained v2 → v3 migration adds. That matches the user's request: TH/EN selectable, delivered in phases, with receipts and printed documents set separately (msgs 11–12). Since pass 1, the branch has merged `main` @ `d65c8cc` (`3c4cc77`), and `cb0b528` fixes the three pass-1 NITs. I re-ran both checks on the merged tree. `npm run lint` gives 13 errors in the same 6 baseline files and 0 in touched files. `npm test` gives 353 passed (301 from this branch plus main's 52), with only the 3 known suite-load failures (engine, SyncService, branchPermissionStore).

Watch for: one NIT remains. The web POS PIN modal subtitle still renders Thai from `POS_ACTION_LABELS` in EN mode (confirmed). It's sourced from `posPermissionStore` and the phase-2 inventory lists it. The manual browser walkthrough (verification §7) still hasn't been done, and none of the large screens are covered by render tests.

**Verdict**: APPROVED

## High-level view

The pass-1 merge conflict is resolved correctly. `merge-base main HEAD` is now `d65c8cc`. In `WebPOSScreen.tsx`, the payment-modal cancel keeps main's `setDisplayMode('idle')` + `broadcastDisplay({ mode: 'idle' })` and uses this branch's `t('common.cancel')`. Main's `effectiveDisplayMode` (broadcast effect and embedded `WebCustomerDisplayScreen`), the `successDurationSec * 1000` timeout and the cart-scroll `minHeight: 0` / `flexShrink: 0` styles appear line for line as on main. The pay-button broadcast is the only display-path difference: `pt.label` became `payMethodLabel(pt.id, 'th', pt.label)`, so the second screen keeps getting Thai.

The pass-1 NITs are fixed. The mobile `ReceiptScreen` and `TaxInvoiceScreen` paper dates now use `receiptDateTime(…, receiptLang)`, so on-screen paper equals the printed tax-invoice HTML (` น.` in th). `WebDocumentSettingsScreen` shows `settings.footerSeedHint` under the footer field when the receipt language is EN and the (trimmed) footer is the Thai seed. Save also trims, so the hint agrees with `receiptFooter`'s exact comparison. `LanguageToggle` segments now carry `"<label>: TH/EN"`, which makes the two SettingsHub toggles distinguishable on native screen readers. The new key is present in both th and en, and parity holds.

The core (`translate`, `languageStore`, the `UiKey`/`ReceiptKey` split, the `receiptStore` migrate/merge) is unchanged since pass 1. A scan of every phase-1 file (added and unchanged lines) found Thai only in mock/product/category data, shop constants, `logAction`, wallet actor/`cancelReason` strings, the cash-movement default reasons and the `฿` glyph. The one UI-visible exception is the PIN modal below. No forbidden file is in `main...HEAD` or the working tree. The only uncommitted path is the untracked `.agents/tasks/i18n-phase1/`. `d:\pos-mobile\dist` was last written at 03:16, before the first i18n commit at 09:53. The phase-2 inventory (217 files, grouped by module) is plausible, and it explicitly lists `posPermissionStore`, `authStore.ROLE_LABELS` and the `sale.ts` label maps.

<details>
<summary>Issues (1)</summary>

1. **PIN modal subtitle stays Thai in EN** (confirmed, NIT): `WebPOSScreen.tsx:3352` renders `POS_ACTION_LABELS[pinAction]`, and `alert(result.message || …)` at `:1346` shows the store's Thai message. Both come from `posPermissionStore`, which is listed for phase 2. Either map `POSAction` → `UiKey` in `labels.ts` now, or leave it for phase 2 as documented.

</details>

<details>
<summary>Details</summary>

### Remaining Thai on the web POS chrome

The PIN-approval modal is part of `WebPOSScreen.tsx`, which the design marks as fully translated except `logAction` and mock data. Its title uses `t('pos.pin.title')`, but the subtitle under it is `POS_ACTION_LABELS[pinAction]` (e.g. "ยกเลิกบิล"). The rejection alert falls back to `t('pos.pin.invalid')` only when `result.message` is empty, and `posPermissionStore` always fills it with Thai. With the UI in English, a cashier sees an English modal title over a Thai action name (**confirmed**). This isn't a hard-coded literal in the phase-1 file, and the inventory names it. That's why this is a NIT and not a gap. The `logAction` uses at `:1340/:1344` should stay Thai either way. A similar but harmless case: the wallet top-up flow parks the cart with `holdBill('เติมเงิน Wallet')`, so that note appears in Thai in the hold list. It's a stored note, i.e. data.

### Test coverage

The pass-1 picture is unchanged. 87 new unit tests cover parity, `translate` fallback/interpolation, formatters, `languageStore`, `useT` re-render, the label maps, the receipt helpers in both language directions, `posReceiptData` (including sample ↔ print parity), `taxInvoiceHtml`, the v1/v2/v3 migrations and the member-type discount label.

Not tested: the `cb0b528` fixes have no tests (the paper-date swap, the footer hint condition, the toggle labels), and no large screen is rendered. The `receiptLanguage` wiring into the paper mocks and the `'th'` vs `uiLang` choice at each `payMethodLabel` call site rest on `tsc` and reading. The browser walkthrough in verification §7 is still not performed. It matters most around `WebPOSScreen`, the file where the i18n and customer-display changes overlap.

</details>

<details>
<summary>File map</summary>

- `src/i18n/{types,translate,format,labels,useT,useReceiptT,index}.ts`: i18n core; typed keys, UiKey/ReceiptKey split, th fallback, deterministic formatters, label maps, seed constants
- `src/i18n/locales/{th,en}/*.ts`: 8 namespaces, 555 keys; en typed by `LocaleShape` (adds `settings.footerSeedHint` this pass)
- `src/i18n/__tests__/*`, `src/store/__tests__/languageStore.test.ts`: parity, translate, format, labels, useT, store tests
- `src/store/languageStore.ts`: persisted UI language (`pos-language`, default th, `<html lang>`)
- `src/store/receiptStore.ts`: `receiptLanguage`, chained v3 migrate, merge normalization, DEFAULT from seed constants
- `src/utils/receiptTemplate.ts`, `src/utils/posReceiptData.ts`, `src/utils/taxInvoiceHtml.ts`: receipt-language helpers, extracted POS print data, extracted tax-invoice HTML
- `src/utils/memberTypeBenefits.ts`, `src/engine/adapter/cartAdapter.ts`: language-aware member-type discount label
- `src/components/ui/LanguageToggle.tsx` (+ `index.ts`): TH/EN segmented control; per-segment a11y labels this pass
- `src/components/web/*`, `src/navigation/*`, `src/screens/auth/*`: nav and auth translated, toggles
- `src/screens/web/WebPOSScreen.tsx`: full translation, receipt-language paper/print/top-up slip; main's customer-display changes merged in
- `src/screens/sale/*`, `src/components/sale/VariantSelector.tsx`: mobile sale flow; paper dates use `receiptDateTime` this pass
- `src/screens/settings/SettingsHubScreen.tsx`, `src/screens/web/{WebDocumentSettings,WebReceiptDesigner,WebSimple}Screen(s).tsx`: language selectors; footer-seed hint this pass
- `.agents/tasks/i18n-phase1-verification.md`, `.agents/tasks/i18n-phase2-inventory.md`: verification (updated for merge and fixes) and phase-2 inventory

Full diff: `git -C d:\pos-mobile\.worktrees\i18n diff main...HEAD`

</details>
