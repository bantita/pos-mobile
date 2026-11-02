# Design — i18n Phase 1 (ไทย / English) + separate receipt language  (rev 3)

Worktree: `d:\pos-mobile\.worktrees\i18n` (branch `feat/i18n-phase1`, from main @ 36e25a3). All paths below are relative to it. Rev 2 resolved the 11 rev-1 findings; rev 3 resolves the 8 rev-2 findings in `design-review.md`. See "Review responses" at the end.

## Overview

We add a small in-house i18n layer under `src/i18n/`. It has typed dictionaries, a pure `translate()`, a `useT()` hook, a non-hook `t()` and deterministic formatters. A persisted `languageStore` holds the per-device UI language, and a new `receiptLanguage` field goes on the existing receipt config. Thai stays the default and the source of truth for wording.

Two languages flow through the app on separate paths:
- The **UI language** (`languageStore.uiLanguage`) drives every translated screen.
- The **receipt language** (`receiptStore.config.receiptLanguage`) drives everything that is printed or that mimics paper: print HTML, the designer preview, and the on-screen receipt "paper".

The type system enforces the split. `receipt.*` keys can't be passed to `t()`/`useT()`, and only receipt translators accept them. The shared renderer `src/utils/receiptTemplate.ts` never reads the UI language. Phase 1 translates the sidebar/navigation, auth, POS sale, payment and the receipt screens. Every other screen stays Thai and is listed in `.agents/tasks/i18n-phase2-inventory.md`.

**Locked stack:** TypeScript 5.3 (`typescript ~5.3.3`), React 18.2 / RN 0.74.5 / RN-Web 0.19 / Expo 51, zustand 4.5 + `persist` + the existing `src/store/persistStorage.ts`, vitest 2 + happy-dom. **No new dependency.** That includes no `@types/react-dom`; see §10.

## Key decisions

**Dependency: in-house, no library.** The requirements are a typed key set, `{param}` interpolation, a th fallback, and both a hook and a non-hook call. That is about 150 LOC. Our own types give the compile-time th/en parity and the UI/receipt key split directly. i18next + react-i18next would add two deps and a typing setup, and would still need a Hermes/RN-Web check. expo-localization isn't needed because the user picks the language; nothing is detected. There is no ICU plural support. Phase-1 phrasing avoids plurals (e.g. "Items: {count}"). If phase 2 needs plurals, it adds `…One` / `…Other` keys.

**Dates are formatted by hand, not with Intl.** `toLocaleDateString('th-TH')` (used today in `src/utils/format.ts`) depends on the JS engine's ICU data, and Hermes can differ from the browser. Receipts already build `dd/MM/BBBB` by hand: `invoicesFromHistory` in `WebPOSScreen.tsx:1608` and the new-sale invoice at `:2704-2713`. The new formatters do the same thing deterministically, so they can be unit tested.

**The renderer API stays language-agnostic.** `resolveField` / `resolveFieldValue` / `buildTemplateHtml` / `layoutElement` and `ReceiptCanvas` keep their signatures. The renderer emits no captions of its own. It only renders field values: `money()`, items rows, and the data strings `docTitle`, `dateTime`, `payMethod`, `cashier`, `cancelReason`, `footerText`, `shopBranch`. So every receipt-language string lives in the `ReceiptRenderData` values. Those values come from pure **receipt-label helpers in `receiptTemplate.ts`** that take an explicit `lang`.

The designer (`makeSampleData`) and POS print (`buildPosReceiptData`) both go through the same helpers, including `receiptFooter` and `receiptBranch`. A parity test locks this in (§10). `money()` stays `฿${toFixed(2)}` with no grouping, so existing output and tests don't change.

**The type system enforces UI vs receipt keys** (it is not left to review):
```ts
// src/i18n/types.ts
export type ReceiptKey = Extract<TranslationKey, `receipt.${string}`>;
export type UiKey      = Exclude<TranslationKey, `receipt.${string}`>;
```
`t()` / `useT()` accept `UiKey` only. `useReceiptT().rt` accepts `ReceiptKey` only. `translate(lang, key: TranslationKey, p?)` stays generic and is used only by the pure helpers (`receipt*`, `payMethodLabel`, `memberTypeDiscountLabel`). A `t('receipt.x')` on a paper mock is a compile error.

**Seeded Thai defaults count as "unset", not as user data.** `DEFAULT.footerText` and `DEFAULT.shopBranch` in `receiptStore.ts` (lines 247-252), and the `SHOP_BRANCH` print fallback (`WebPOSScreen.tsx:451`), were seeded by the app. When a value equals the seeded Thai default (or is empty), the renderer prints the receipt-language translation. Any other value is printed exactly as entered.

## 1. Module layout

```
src/i18n/
  types.ts            Language = 'th' | 'en'; LANGUAGES; isLanguage(x); LocaleShape<T>; TranslationKey; UiKey; ReceiptKey; TParams
  locales/th/{common,nav,auth,pos,payment,receipt,receiptScreen,settings}.ts   each `export const X = {...} as const`
  locales/th/index.ts export const th = { common, nav, auth, pos, payment, receipt, receiptScreen, settings } as const
  locales/en/<same files>.ts   each `export const X: LocaleShape<typeof thX> = {...}`
  locales/en/index.ts export const en: LocaleShape<typeof th> = { common, nav, ... }
  translate.ts        PURE: translate(lang, key: TranslationKey, params?), interpolate(), lookup()
  format.ts           PURE: formatDate/formatTime/formatDateTime/formatNumber/formatMoney(…, lang)
  labels.ts           PURE: PAY_METHOD_KEYS, PAY_ICON, ORDER_TYPE_KEYS, ROLE_KEYS, DOC_TYPE_KEYS (→ common.docType.*),
                      payMethodLabel(id, lang, customLabel?), DEFAULT_FOOTER_TH, DEFAULT_BRANCH_TH
  useT.ts             useT(), useUiLanguage(), t() (non-hook), useFormat()
  useReceiptT.ts      useReceiptT() → { rt, receiptLang, fmt }   (fmt = formatters bound to receiptLang)
  index.ts            barrel: types, useT/t/useUiLanguage/useFormat, useReceiptT, labels.
                      It does NOT re-export format.ts (avoids a formatDate/formatNumber clash with src/utils/format.ts)
src/store/languageStore.ts
src/types/react-dom-test.d.ts   test-only ambient module declarations (§10)
```

`DEFAULT_FOOTER_TH = th.receipt.thankYou` (`'ขอบคุณที่ใช้บริการ 🙏'`) and `DEFAULT_BRANCH_TH = th.receipt.headOffice` (`'สำนักงานใหญ่'`) live in `labels.ts`. `receiptStore.ts` imports them to build `DEFAULT`, so the seed and the comparison can never drift apart. `labels.ts` imports only dictionaries and `translate`, so there is no import cycle.

Purity: `translate.ts`, `format.ts`, `labels.ts`, `types.ts` and the locales import no stores and no `react-native`. `memberTypeBenefits.ts` and `cartAdapter.ts` import only those. `receiptTemplate.ts` already imports runtime values from `receiptStore` (→ `persistStorage` → `react-native`). Its tests already mock `react-native` + AsyncStorage (`receiptTemplate.test.ts:11-15`). `posReceiptData.ts` imports `receiptTemplate`, so its test uses the same mocks. Pure modules import `i18n/translate|format|labels|types` directly and never `i18n/index`.

**Types (TS 5.3):**
```ts
export type LocaleShape<T> = { [K in keyof T]: T[K] extends string ? string : LocaleShape<T[K]> };
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string];
export type TranslationKey = Leaves<typeof th>;
export type TParams = Record<string, string | number>;
```
Each en namespace file is a fresh object literal annotated `LocaleShape<typeof thX>`. A missing key fails as a missing-property error, and an extra key at any depth fails as an excess-property error. The parity test (§10) backs this up at runtime. Keys are camelCase and at most 3 levels deep. Placeholders are `{name}` with `[A-Za-z0-9_]`. Keys are never built with template strings plus a cast. Data → key always goes through a typed `Record<X, UiKey | ReceiptKey>` in `labels.ts`.

## 2. `translate` / `t()` / `useT()`

- `translate(lang, key, params?)`:
  1. Look up the dot path in `dict[lang]`. If the value is missing or not a non-empty string, fall back to `th` and `console.warn('[i18n] missing en key', key)` in dev only.
  2. If th is also missing (only possible with a cast key), return `key` and warn in dev.
  3. `interpolate` replaces `/\{(\w+)\}/g` with `String(params[name])`. A placeholder with no matching param stays literal and triggers a dev warning. Extra params are ignored.
- The dev check is `typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production'`. It is similar to `src/data/mockProducts.ts:303`, but where mockProducts treats a missing `__DEV__` as "off", this guard falls back to `NODE_ENV`, so vitest (`NODE_ENV='test'`) counts as dev and the translate test can assert the warning. `@types/node` is installed, so `process` type-checks. Production never logs.
- `t(key: UiKey, params?)` (non-hook) is `translate(useLanguageStore.getState().uiLanguage, …)`. It reads the store at call time and is not reactive. Use it in handlers, `alert`/`confirm`, thrown errors and utilities. Never call it at module scope. Module constants hold keys (e.g. `NAV_ITEMS[i].labelKey`), not strings.
- `useT(): (key: UiKey, params?) => string` subscribes with `useLanguageStore(s => s.uiLanguage)` and returns a `useCallback` bound to that language. Any mounted component that calls it re-renders on change. Module-level sub-components in large files (the cart row, `PaymentSettingsModal` in WebPOSScreen) call `useT()` themselves. The `MainNavigator` `options` are built in the component body, so they re-evaluate.
- `useUiLanguage(): Language`. `useFormat()` returns `{ date, time, dateTime, number, money }` bound to the UI language.
- `useReceiptT()` subscribes to `useReceiptStore(s => s.config.receiptLanguage ?? 'th')` and returns `{ rt: (k: ReceiptKey, p?) => string, receiptLang, fmt }`.
- Errors kept in state: local validation errors are stored as a `UiKey` and rendered with `t(key)`, so they switch language live. Thrown errors (e.g. `onLogin` rejects) are translated with `t()` at throw time. LoginScreen clears `error` when its toggle changes.

## 3. `languageStore` (`src/store/languageStore.ts`)

```ts
interface LanguageState { uiLanguage: Language; setUiLanguage: (l: Language) => void }
```
- Built with `create()(persist(...))`: `name: 'pos-language'`, `version: 1`, `storage: createJSONStorage(() => persistStorage)`, `partialize: s => ({ uiLanguage: s.uiLanguage })`. This is the same pattern as `receiptStore.ts`.
- `merge`: `uiLanguage: isLanguage(saved?.uiLanguage) ? saved.uiLanguage : 'th'`. Garbage or a missing value becomes `'th'` silently. This store owns the invariant.
- `setUiLanguage` ignores a value that isn't a valid language (dev warning, state unchanged).
- On the web, a `subscribe` call plus `onRehydrateStorage` set `document.documentElement.lang`, guarded by `typeof document !== 'undefined'`.
- Mobile AsyncStorage hydrates asynchronously, so a one-frame Thai flash is possible on cold start. That's accepted.
- The language setting is per device. It is not added to `TEST_DATA_KEYS` (`WebSimpleScreens.tsx:2781`).

## 4. Formatting helpers (`src/i18n/format.ts`)

`DateInput = Date | number | string(ISO)`. An invalid date returns `'-'`.

| fn | th | en |
|---|---|---|
| `formatDate(d, lang)` | `08/06/2569` (dd/MM/ year+543) | `08/06/2026` (dd/MM/yyyy Gregorian) |
| `formatTime(d, lang)` | `10:25` | `10:25` |
| `formatDateTime(d, lang)` | `08/06/2569 10:25` | `08/06/2026 10:25` |
| `formatNumber(n, lang, decimals=0)` | `1,234` | `1,234` (manual grouping) |
| `formatMoney(n, lang)` | `฿1,234.50`, `-฿10.00`, NaN/±Inf → `฿0.00` | same (keep ฿) |

`receipt.dateTimeValue` is `'{date} {time} น.'` in th and `'{date} {time}'` in en, so the Thai POS print `dateTime` keeps today's ` น.` suffix (`printReceipt80mm`, the `dateTime:` line of the `data` literal, `WebPOSScreen.tsx:419`). The designer sample deliberately gains ` น.` (see §5.2). `src/utils/format.ts` stays unchanged for phase-2 screens. Phase-1 screens switch to `useFormat()`, which replaces `toLocaleString(...)`, the local `fmt` in WebPOSScreen and `฿{formatCurrency(x)}`. Paper mocks use `useReceiptT().fmt`.

## 5. Receipt language

### 5.1 `src/store/receiptStore.ts`
- `ReceiptConfig.receiptLanguage: Language` (required). `DEFAULT` gets `receiptLanguage: 'th'`, `footerText: DEFAULT_FOOTER_TH` and `shopBranch: DEFAULT_BRANCH_TH`, so the values stay the same as today.
- Persist `version: 2 → 3`. `migrate` is restructured so the version steps chain:
```ts
migrate: (persisted, fromVersion) => {
  const blob = persisted as { config?: Partial<ReceiptConfig> } | undefined;
  if (!blob?.config || fromVersion >= 3) return persisted;            // identity pass-through
  let config = { ...blob.config };
  if (fromVersion < 2) config = { ...config, template: migrateLayoutToTemplate(blob.config) };
  if (fromVersion < 3) config = { ...config, receiptLanguage: isLanguage(config.receiptLanguage) ? config.receiptLanguage : 'th' };
  return { ...blob, config };
},
```
- `merge` also normalizes `receiptLanguage` (garbage → `'th'`). Merge runs on every hydrate, so it is the layer that owns the invariant. Migrate handles upgrades, and the renderer's `?? 'th'` defends against partial configs in tests.
- `setConfig` is already a shallow merge, so `setConfig({ receiptLanguage })` works as is.
- `receiptStore.migration.test.ts:171` (pass-through) changes to `migrate(blob, 3)`, still asserting `toBe(blob)`.

### 5.2 `src/utils/receiptTemplate.ts` (explicit `lang`)
New exports:
- `type ReceiptDocType = 'receipt' | 'tax_short' | 'tax_full'` and `receiptDocTitle(type, lang)`. th: ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ / ใบกำกับภาษี. en: Receipt / Abbreviated Tax Invoice / Tax Invoice.
- `receiptDateTime(d: DateInput, lang)` returns `translate(lang,'receipt.dateTimeValue',{date: formatDate(d,lang), time: formatTime(d,lang)})`.
- `receiptPayMethod(methods: {id: string; label?: string}[], lang)` joins `payMethodLabel(m.id, lang, m.label)` with `' + '`.
- `receiptCashier(name: string, lang)` returns `name || translate(lang,'receipt.cashierFallback')` (th แคชเชียร์ / en Cashier).
- `receiptFooter(cfgFooter: string, lang)` returns `!cfgFooter || cfgFooter === DEFAULT_FOOTER_TH ? translate(lang,'receipt.thankYou') : cfgFooter`. The en value is `'Thank you 🙏'`.
- `receiptBranch(cfgBranch: string, lang)` returns `!cfgBranch || cfgBranch === DEFAULT_BRANCH_TH ? translate(lang,'receipt.headOffice') : cfgBranch`. The en value is `'Head Office'`.
- `makeSampleData(config, lang: Language = config.receiptLanguage ?? 'th')` sets:
  - `docTitle = receiptDocTitle('tax_short', lang)`
  - `dateTime = receiptDateTime(new Date(2024,0,1,10,30), lang)`
  - `payMethod = receiptPayMethod([{id:'cash'}], lang)`
  - `cashier = translate(lang,'receipt.sampleCashier')` (th 'พนักงาน A' / en 'Staff A')
  - `footerText = receiptFooter(config.footerText ?? '', lang)`
  - `shopBranch = receiptBranch(config.shopBranch ?? '', lang)`

  Sample item names stay Thai because they stand in for user product data. In th the output is identical to today except for two deliberate changes, both made so preview = print: the sample `dateTime` becomes `01/01/2567 10:30 น.` (today `'01/01/2567 10:30'`, `receiptTemplate.ts:296`), and an empty footer shows the thank-you line.
- `ReceiptRenderData`, `resolveField*`, `buildTemplateHtml` and `layoutElement` are unchanged. `text` elements pass through untouched.

### 5.3 POS print path (`src/screens/web/WebPOSScreen.tsx`)
- The data-building part of `printReceipt80mm` (`:383`, through the `data: ReceiptRenderData` literal at `:414`) moves to the new `src/utils/posReceiptData.ts`:
  `buildPosReceiptData(invoice: PosPrintInvoice, billType: ReceiptDocType, cfg: ReceiptConfig, fallbacks: ShopFallbacks): ReceiptRenderData`.
  - It sets `const rl = cfg.receiptLanguage ?? 'th'` and computes `docTitle`, `dateTime`, `payMethod` and `cashier` with the 5.2 helpers.
  - `footerText = receiptFooter(cfg.footerText ?? '', rl)`. This replaces `cfg.footerText || 'ขอบคุณที่ใช้บริการ 🙏'` at `:401`.
  - `shopBranch = receiptBranch(cfg.shopBranch || fallbacks.shopBranch, rl)`. `fallbacks.shopBranch` is `SHOP_BRANCH` (`:451`), which equals `DEFAULT_BRANCH_TH` and so gets translated.
  - `printReceipt80mm` keeps its signature and its callers. It calls `buildPosReceiptData`, then `buildTemplateHtml`, then opens the window as it does today.
- `PosPrintInvoice` is the current inline type plus optional `issuedAt?: number` and `payMethods?: {id: string; label?: string}[]`.
  - With `issuedAt`, `dateTime = receiptDateTime(issuedAt, rl)`. Without it (only `MOCK_INVOICES` and pre-existing in-memory data), `dateTime = translate(rl, 'receipt.dateTimeValue', { date: invoice.date, time: invoice.time })`, so th keeps today's ` น.` suffix.
  - With `payMethods`, it uses `receiptPayMethod`. Without them, it uses `invoice.payMethod`.
  - The `Invoice` interface (`:50`) gains the same two optional fields.
- Producers. Every place that builds an `Invoice` sets both fields, so no printed document falls back to the Thai legacy strings:
  - The new-sale invoice (`:2704-2713`) adds `issuedAt: now.getTime()`, `payMethods: splitPayments.map(sp => ({ id: sp.method, label: sp.label }))` and `cashier: currentUser?.name ?? ''`. The `billNo` keeps its BE year because it is an identifier. The on-screen `cashierName` fallback (`:1299`) becomes `t('pos.cashierFallback')`.
  - `invoicesFromHistory` (`:1608`) adds `issuedAt: d.getTime()` and `payMethods: sale.payments.map(p => ({ id: p.method }))`. Its hand-built Thai `payMethod` string (`:1619`) becomes `sale.payments.map(p => payMethodLabel(p.method, 'th')).join(' + ')`.
  - The void note in the cancel flow (`voidNote`, `:1685-1700`) adds `issuedAt: Date.now()` and `payMethods: cancelTarget.payMethods`.
  - The full tax invoice (`fullTaxInv`, `:3097-3113`) adds `issuedAt: now.getTime()` and `payMethods: selectedInv.payMethods`.
  - `MOCK_INVOICES` (`:69-112`) get `payMethods` ids (`cash`, `qr`, `transfer`) and no `issuedAt`, so they exercise the legacy date branch.
- Pay-method labels (`src/i18n/labels.ts`):
  - Known ids are `cash|transfer|qr|credit|wallet|ewallet|coupon`, mapped through `PAY_METHOD_KEYS: Record<KnownPayMethod, UiKey>` to `payment.method.<id>`. `payMethodLabel(id, lang, customLabel?)` returns the translated label for a known id, and `customLabel ?? id` for any other id (user-added `pay_*` types).
  - The th values are pinned to today's web print wording: `cash 'เงินสด'`, `transfer 'โอน'`, `qr 'QR Code'`, `credit 'บัตร'`, `wallet 'Wallet'`, `ewallet 'E-Wallet'`, `coupon 'คูปอง'`. The en values are `Cash`, `Transfer`, `QR Code`, `Card`, `Wallet`, `E-Wallet`, `Coupon`. One set is used on every surface. There is no per-surface short set; the wording changes this causes are listed in §8.
  - `PaymentType` (`:47`) becomes `{ id; label?: string; icon; color }`, where `label` is set only for user-added `pay_*` types.
  - `splitPayments` state (`:1532`) becomes `{ method: string; label?: string; amount: number }[]`. The add-split handler (`:2663`) stores `payTypes.find(...)?.label`, which is `undefined` for built-ins. That is harmless because every read goes through `payMethodLabel`.
  - `DEFAULT_PAY_TYPES` (`:120-125`) drop the built-in Thai labels.
  - Pay types are local `useState` (`:1427`) and not persisted, so this needs no migration.
- Rule: **no code reads `PaymentType.label` or `splitPayments[].label` directly.** Every read is `payMethodLabel(id, lang, label)`, with `lang` chosen by what the value is:
  - `'th'` for persisted or Thai-only data: the legacy `invoice.payMethod` string at `:2713` (`splitPayments.map(sp => payMethodLabel(sp.method, 'th', sp.label)).join(' + ')`), the `logAction` detail at `:2771` (`${payMethodLabel(sp.method, 'th', sp.label)} ฿${sp.amount}`), and `broadcastDisplay({ payMethodLabel })` at `:2489`, so the customer display (forbidden files) stays Thai.
  - `uiLang` for on-screen displays: the pay buttons, the amount caption at `:2648`, the split list at `:2610`, and the invoice-list pay-method column (`:2073`), which renders `inv.payMethods ? inv.payMethods.map(m => payMethodLabel(m.id, uiLang, m.label)).join(' + ') : inv.payMethod`.
  - The invoice search (`:1646`) matches that same derived UI-language text, plus `inv.payMethod` as a fallback, so searching "Cash" works in en and "เงินสด" still works.
  - The `logAction` sentence itself (`'ขายสินค้า'`, `บิล … ยอด … ชำระ:`) stays Thai, as before.
- Icons: `PAY_ICON: Record<string, string> = { cash: 'cash-outline', qr: 'qr-code-outline', transfer: 'phone-portrait-outline', credit: 'card-outline', wallet: 'wallet-outline', ewallet: 'wallet-outline' }` in `labels.ts`. The invoice list (`:2068-2071`) uses `PAY_ICON[inv.payMethods?.[0]?.id ?? ''] ?? 'card-outline'` instead of matching `'เงินสด'`/`'QR Code'`.
- Paper mocks in this file use the receipt language through `useReceiptT()`. This covers all three `iv.rc*` paper blocks (the receipt, the abbreviated tax invoice and the full tax invoice components):
  - The `ยกเลิก` cancelled stamps (`:789`, `:851`, `:956`) use `rt('receipt.cancelledStamp')`.
  - The captions (`เลขที่`, `วันที่`, `แคชเชียร์`, `ชำระด้วย`, `เลขที่ใบกำกับภาษี`, `วันที่ออก`, `โทร`, `เลขประจำตัวผู้เสียภาษี`, …) use `rt('receipt.*')`.
  - The date values (`:795`, `:856`) render `invoice.issuedAt ? receiptDateTime(invoice.issuedAt, rl) : rt('receipt.dateTimeValue', { date: invoice.date, time: invoice.time })`. The full-tax `วันที่ออก` value (`:1003`) uses `fmt.date(invoice.issuedAt)` when present, otherwise `invoice.date`.
  - The pay-method values (`:797`, `:858`, `:1005`) render `invoice.payMethods ? receiptPayMethod(invoice.payMethods, rl) : invoice.payMethod`.
  - The thank-you footers use `rt('receipt.thankYou')`, and `{SHOP_BRANCH}` uses `receiptBranch(SHOP_BRANCH, rl)`.
  - The wallet top-up slip HTML (`:3403-3420`) uses `translate(rl, …)` and `formatMoney(…, rl)`.
  - Tabs, buttons and the bill-type selector around these blocks use `t()`.

### 5.4 Other receipt-language consumers
- **`WebReceiptDesignerScreen.tsx`**: `data = useMemo(() => makeSampleData(config), [config])` (`:160`) follows `config.receiptLanguage` with no change, and the print at `:268` uses the same `data`. A toolbar `LanguageToggle` labelled `settings.receiptLanguage` writes `setConfig({ receiptLanguage })` immediately. The rest of the designer chrome is phase 2.
- **`TaxInvoiceScreen.tsx`**: the inline `buildHTML` closure (`:71-116`) moves to a new pure `src/utils/taxInvoiceHtml.ts` as `buildTaxInvoiceHtml(args: TaxInvoiceHtmlArgs, lang: Language): string`. `args` holds the values the closure reads today: shop, buyer, items, totals and date. It uses `translate(lang, 'receipt.*')`, `receiptDateTime` and `formatMoney(…, lang)`. The screen calls `buildTaxInvoiceHtml(args, receiptLang)` from `useReceiptT()`. The on-screen document body uses `rt`, and the chrome uses `t`.
- **`ReceiptScreen.tsx`**: the paper body (date, totals, VAT, change, `ขอบคุณที่ใช้บริการ` `:241`, `กรุณาเก็บใบเสร็จไว้เป็นหลักฐาน` `:243`) uses `rt`. The order-type badge on the paper (`:144`, today `ORDER_TYPE_LABELS[orderType]`) renders `translate(rl, ORDER_TYPE_KEYS[orderType])`. That is allowed because `translate` takes any `TranslationKey`, and it must not be `t()`. The order-detail captions (`:147-158`: `วันที่นัดรับ`, `จัดส่ง`, `เบอร์ติดต่อ`, `หมายเหตุ`, `โต๊ะ`, `โซน`) go under `receipt.orderDetail.readyDate|address|phone|note|table|zone` and render with `rt`. The pay-method rows (`:222`, today `PAYMENT_LABELS[p.method]`) render `payMethodLabel(p.method, rl)`. The prop defaults change from `cashierName = 'พนักงาน'` to `cashierName = ''`, rendered as `receiptCashier(cashierName, rl)`. `shopName` keeps its default `'ร้านค้าตัวอย่าง'` because it is placeholder shop data (user data, never translated). Buttons and headers use `t`.
- **`DocumentCancellationScreen.tsx`** is a form, so all of it uses the UI language (`receiptScreen.cancel.*`). Its doc-type label goes through `DOC_TYPE_KEYS` → `common.docType.receipt|taxShort|taxFull` (UI keys).

### 5.5 Receipt-language selector placement
- `WebDocumentSettingsScreen.tsx` (route `documents`, the existing receipt-config form) gets a "ภาษาใบเสร็จ / Receipt language" `LanguageToggle` row. It joins the screen's local-state + บันทึก pattern.
- The designer toolbar (5.4) applies the change immediately.
- The mobile `SettingsHubScreen` language card (§6) gets a second row.
- A hint `settings.receiptLanguageHint` sits under each selector: "ใบกำกับภาษีตามกฎหมายควรออกเป็นภาษาไทย". It is informational only.
- `SettingReceiptScreen` (`WebSimpleScreens.tsx:1856`) can't be reached, so it's left alone.

## 6. Language switcher

The new `src/components/ui/LanguageToggle.tsx` is exported from `src/components/ui/index.ts`. It is a controlled `TH | EN` segmented control.
- Props: `value: Language; onChange(l: Language): void; size?: 'md' | 'lg'; accessibilityLabel?: string; style?: ViewStyle`.
- Segment height is `ComponentSize.button.md` (44). It uses tokens only: `Colors.primary`/`white`/`border`, `Typography`, `Spacing`, `BorderRadius`.
- Each segment has `accessibilityRole="button"` and `accessibilityState={{ selected }}`.
- The labels are `common.langShort.th|en` ("TH"/"EN" in both locales).

| Surface | File | Binding |
|---|---|---|
| Login (web + mobile, shared) | `src/screens/auth/LoginScreen.tsx`: a right-aligned row at the top of the form column | uiLanguage + `setError('')` |
| Other auth screens | `src/screens/auth/AuthLayout.tsx` (OTP/Forgot): the top of `formCard`. `RegisterShopScreen`: inline | uiLanguage |
| Web top bar | `src/components/web/WebTopBar.tsx`: inside `styles.right`, before `userInfo` | uiLanguage |
| Web settings | `WebSettingsScreen` (`WebSimpleScreens.tsx:2792`): a "ภาษา / Language" card above the cards grid | uiLanguage |
| Mobile settings | `src/screens/settings/SettingsHubScreen.tsx`: a card above logout with UI-language and receipt-language rows | uiLanguage / `receiptStore.setConfig` |

## 7. Files per surface (phase 1)

- **Infra:**
  - New: `src/i18n/**`, `src/store/languageStore.ts`, `src/components/ui/LanguageToggle.tsx`, `src/utils/posReceiptData.ts`, `src/utils/taxInvoiceHtml.ts`, `src/types/react-dom-test.d.ts`.
  - Modified: `src/components/ui/index.ts`, `src/store/receiptStore.ts`, `src/utils/receiptTemplate.ts`.
- **Navigation:**
  - `src/components/web/WebSidebar.tsx`: `labelKey` on NAV_ITEMS and the report sub-items, plus logout and the 'ผู้ใช้ทดลอง' fallback.
  - `src/navigation/WebNavigator.tsx`: `PAGE_NAMES` becomes `Record<string, UiKey | [UiKey, UiKey]>`, breadcrumbs are `t(a) + ' › ' + t(b)`, and the login error is thrown via `t()`.
  - `src/components/web/WebLayout.tsx`: the label map and `confirm('เปิดโหมดเต็มจอ?')`.
  - `src/components/web/WebTopBar.tsx`: `ROLE_KEYS`, falling back to `ROLE_LABELS`.
  - `src/navigation/MainNavigator.tsx`: the 9 `tabBarLabel`s.
  - `SaleNavigator.tsx` is checked and needs no change (`headerShown:false`, Thai only in comments).
- **Auth:** `LoginScreen.tsx`, `AuthLayout.tsx`, `OTPLoginScreen.tsx`, `ForgotPasswordScreen.tsx`, `RegisterShopScreen.tsx`, `WelcomeScreen.tsx`, `src/navigation/AuthNavigator.tsx` (thrown errors and the OTP alert).
- **POS sale:**
  - `src/screens/web/WebPOSScreen.tsx`: the whole file except `logAction` strings and mock product/member/shop data.
  - `src/screens/sale/POSSaleScreen.tsx` (including the order-type modal), `CartScreen.tsx`, `HoldBillScreen.tsx`, `src/components/sale/VariantSelector.tsx`.
  - Order types use `ORDER_TYPE_KEYS`. `ORDER_TYPE_LABELS` (`src/types/sale.ts:91`) stays for phase-2 callers.
- **Payment:**
  - `src/screens/sale/PaymentScreen.tsx` and the web payment modal in WebPOSScreen. The PaymentScreen method list (`:51-55`) keeps its `key`/icon/colors and drops `label`; it renders `payMethodLabel(m.key, uiLang)`. The ewallet button keeps its longer wording through its own key, `payment.ewalletOther` (th 'E-Wallet / อื่นๆ', en 'E-Wallet / Other').
  - Phase-1 mobile screens (PaymentScreen, ReceiptScreen `:222`) replace `PAYMENT_LABELS[...]` with `payMethodLabel(...)`. `PAYMENT_LABELS` and `PAYMENT_ICONS` (`src/types/sale.ts:107-121`) stay in place for phase-2 callers.
  - `src/utils/memberTypeBenefits.ts`: `memberTypeDiscountLabel(type, lang: Language = 'th')` → `translate(lang,'payment.memberTypeDiscount',{name, percent})`. The th template is `'ส่วนลด{name} {percent}%'`, so the existing test is unchanged.
  - `src/engine/adapter/cartAdapter.ts`: `BuildCalculationArgs` (`:50`) gains `lang?: Language`, passed to the synthetic promo name. Screens pass `useUiLanguage()` and add it to the memo deps.
- **Receipt screens:** `ReceiptScreen.tsx`, `TaxInvoiceScreen.tsx`, `DocumentCancellationScreen.tsx`.
- **Settings selectors (only the rows named in §5.5/§6):** `WebSimpleScreens.tsx`, `WebDocumentSettingsScreen.tsx`, `WebReceiptDesignerScreen.tsx`, `SettingsHubScreen.tsx`.
- **Docs:** `.agents/tasks/i18n-phase2-inventory.md`, `.agents/tasks/i18n-phase1-verification.md`.
- **Forbidden, not touched:** `WebAdSettingsScreen.tsx`, `customerDisplayStore.ts`, `types/customerDisplay.ts`, `WebCustomerDisplayScreen`, `WebDisplayScreen`, `CustomerDisplayScreen`, `AdManagerScreen`.

## 8. Edge cases

- **Unknown stored language** (`'jp'`, `null`): both stores' `merge` turns it into `'th'`.
- **Pre-v3 receipt config:** `migrate` adds `'th'`, and the renderer still defends with `?? 'th'`.
- **Mixed languages:** UI en + receipt th prints Thai, and the on-screen paper is Thai too. UI th + receipt en is the reverse.
- **Footer/branch:** an untouched seeded default (`DEFAULT_FOOTER_TH` / `DEFAULT_BRANCH_TH`) or an empty value prints in the receipt language. Edited text prints exactly as entered. If a user re-types the exact Thai default by hand, it is treated as the default. That's acceptable because it's the same text.
- **Never translated:** custom pay types, product/member/shop names, header text, edited footer/branch, designer `text` elements and `cancelReason`.
- **Cancelled-bill stamp:** it is paper, so it uses `rt('receipt.cancelledStamp')`.
- **Pay-method wording changes in Thai (accepted):** the single `payment.method.*` set (§5.3) changes a few Thai labels that differ between surfaces today. On mobile (PaymentScreen, ReceiptScreen), transfer goes from `โอนเงิน` to `โอน` and credit from `บัตรเครดิต` to `บัตร`. On the web new-sale path, QR goes from `QR` to `QR Code`, which matches what `invoicesFromHistory` already prints. Everything else is unchanged.
- **Unknown pay-method id** (a future method, or a `pay_*` type whose label is missing): `payMethodLabel` returns `customLabel ?? id`, and the icon falls back to `'card-outline'`.
- **Text length:** labels change length between languages. Layouts use flex/`numberOfLines` and add no new fixed widths.

## 9. How phase 2 adds a string

1. Add the key to `src/i18n/locales/th/<ns>.ts`. For a new screen family, add a namespace file and register it in `th/index.ts` and `en/index.ts`.
2. `npm run lint` now fails on the en file. Add the English text.
3. In the screen, add `const t = useT();` and replace `'ข้อความ'` with `t('ns.key')` or `t('ns.key', { count })`. Dates and money go through `useFormat()`. Printed text goes in `receipt.*` and is rendered with `rt` (the compiler blocks `t`).
4. `npm test` runs the parity and placeholder checks.

## 10. Test plan (vitest)

| File | Covers |
|---|---|
| `src/i18n/__tests__/parity.test.ts` | th/en flattened key sets are identical; every value is non-empty; the `{param}` sets match per key |
| `src/i18n/__tests__/translate.test.ts` | interpolation (string/number, repeated, missing param); blank/missing en → th + one `console.warn`; no warn with the dev guard off; unknown key → key |
| `src/i18n/__tests__/format.test.ts` | `formatDate(new Date(2026,5,8),'th')`=`08/06/2569`, en `08/06/2026`; time padding; invalid → `-`; money grouping/negative/NaN; ฿ in both |
| `src/store/__tests__/languageStore.test.ts` (mocks `react-native` + AsyncStorage like `receiptStore.migration.test.ts:7-10`) | default th; `setUiLanguage('en')` writes `pos-language`; rehydrate en; garbage → th; invalid set ignored; non-hook `t()` follows the store |
| `src/i18n/__tests__/useT.test.ts` | a `React.createElement` component re-renders in English after `setUiLanguage('en')` |
| `src/utils/__tests__/receiptTemplate.test.ts` (extend) | (a) ui `en` + receipt `th`: HTML contains `ใบกำกับภาษีอย่างย่อ`, `2567`, `เงินสด`, ` น.`, `พนักงาน A`, `ขอบคุณที่ใช้บริการ`. (b) ui `th` + receipt `en`: contains `Abbreviated Tax Invoice`, `01/01/2024`, `Cash`, `Staff A`, `Thank you`, `Head Office`, and does **not** contain any of `ใบกำกับภาษีอย่างย่อ`, `เงินสด`, `2567`, ` น.`, `พนักงาน A`, `ขอบคุณที่ใช้บริการ`, `สำนักงานใหญ่` (sample item and shop names are Thai by design and aren't asserted). (c) `text` element unchanged in both. (d) th output for the DEFAULT config is unchanged from today except the two deliberate sample changes in §5.2: `dateTime` is now `01/01/2567 10:30 น.`, and an empty footer renders the thank-you line |
| `src/utils/__tests__/posReceiptData.test.ts` (same mocks) | doc titles ×3 × lang; `issuedAt` → BE vs Gregorian; legacy date fallback (`th` → `{date} {time} น.`, `en` → no suffix); `tax_full` + `en` with `payMethods:[{id:'cash'}]` and `issuedAt` → `Tax Invoice`, `Cash`, Gregorian year, no `เงินสด`; a void-note-shaped invoice (negative totals, copied `payMethods`) + `en` → `Cash`; `pay_*` custom label kept; cashier fallback; DEFAULT config + `en` → footer `Thank you 🙏`, branch `Head Office`; edited footer/branch kept verbatim in en; flipping uiLanguage has no effect. **Parity:** for `th` and `en`, `makeSampleData(cfg)` and `buildPosReceiptData(inv,'tax_short',cfg,fb)` give equal `docTitle`, `footerText` (default and `''`) and `shopBranch`, and both `dateTime`s match `/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}( น\.)?$/` |
| `src/i18n/__tests__/labels.test.ts` | `payMethodLabel` for every known id (`cash`, `transfer`, `qr`, `credit`, `wallet`, `ewallet`, `coupon`) × th/en equals the pinned values in §5.3; unknown id + custom label → label in both languages; unknown id without label → id; `PAY_ICON` covers every known id except `coupon`; `ORDER_TYPE_KEYS` covers every `OrderType` |
| `src/utils/__tests__/taxInvoiceHtml.test.ts` | `buildTaxInvoiceHtml(args,'th')` contains `ใบกำกับภาษี` and a BE year; `'en'` contains `Tax Invoice` and a Gregorian year, with no `ใบกำกับภาษี`; buyer/shop names verbatim |
| `src/store/__tests__/receiptStore.migration.test.ts` (extend) | v2 → adds `'th'`; v1 → template + `'th'`; existing `'en'` kept; merge garbage → `'th'`; `migrate(blob,3)` `toBe(blob)`; DEFAULT footer/branch equal `DEFAULT_FOOTER_TH`/`DEFAULT_BRANCH_TH` |
| `src/utils/__tests__/memberTypeBenefits.test.ts` (extend) | th label unchanged; en → `Staff discount 10%`-style with the name untranslated |

**useT test typing (no new dependency).** `npm run lint` is `tsc --noEmit` with no `include`, so tests are type-checked, and `@types/react-dom` isn't installed. Add `src/types/react-dom-test.d.ts`, following the existing ambient precedent `src/types/xlsx-dist.d.ts`:
```ts
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export function createRoot(c: Element): { render(n: ReactNode): void; unmount(): void };
}
declare module 'react-dom/test-utils' { export function act(cb: () => void | Promise<void>): Promise<void>; }
```
The test sets `(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true`, imports `act` from `react-dom/test-utils` (React 18.2 has no `act` in `react`), and mocks `react-native` + AsyncStorage (`useT` → `languageStore` → `persistStorage`).

**Verification:** run in the worktree.
- `npm run lint`: baseline 13 errors / 6 files (`.agents/tasks/i18n-phase1/baseline.md`). Touched files must add 0.
- `npm test`: baseline 214 pass + 3 known suite-load failures.

The large screens aren't unit-rendered, which is why the logic is extracted into pure modules (`posReceiptData`, `taxInvoiceHtml`, the `receiptTemplate` helpers, `labels`, `format`). The `UiKey`/`ReceiptKey` types guard the paper mocks at compile time. Do a browser walkthrough if automation is available, and otherwise state that it wasn't done in the verification doc.

## Review responses, rev 2 (rev-1 review)

1. **MEDIUM, seeded Thai defaults:** addressed. `DEFAULT_FOOTER_TH`/`DEFAULT_BRANCH_TH` in `labels.ts` are used by `DEFAULT`. `receiptFooter`/`receiptBranch` treat the default or an empty value as unset. They are used in `makeSampleData`, `buildPosReceiptData` (including the `SHOP_BRANCH` fallback) and the paper mocks. Tests are in `posReceiptData.test.ts` and `receiptTemplate.test.ts`.
2. **MEDIUM, preview ≠ print footer:** addressed. `makeSampleData` uses `receiptFooter`/`receiptBranch`, and the parity test covers th and en, including an empty footer.
3. **MEDIUM, useT test tsc:** addressed with `src/types/react-dom-test.d.ts`, `act` from `react-dom/test-utils`, `IS_REACT_ACT_ENVIRONMENT` and RN/AsyncStorage mocks. No new dependency.
4. **MEDIUM, key isolation:** addressed with `UiKey`/`ReceiptKey`. `t`/`useT` take `UiKey`, `rt` takes `ReceiptKey`, and `DOC_TYPE_KEYS` → `common.docType.*`. It is now enforced by the type system.
5. **NIT, migrate chaining:** addressed with the restructured `migrate` (§5.1) and identity pass-through for ≥3.
6. **NIT, stale lines:** refreshed (`:1608`, `:2704-2713`, `cartAdapter.ts:50`, `sale.ts:91`, footer fallback `:401`; the review cited `:403`, but `:401` is the current line). The purity claim is also corrected: `receiptTemplate.ts` already depends on `receiptStore` at runtime, so its tests and `posReceiptData`'s tests use the existing RN mocks.
7. **NIT, `PaymentType.label`:** addressed. `label?: string` on `PaymentType` and `splitPayments`, and all display goes through `payMethodLabel`.
8. **NIT, barrel collision:** addressed. `i18n/index.ts` doesn't re-export `format.ts`.
9. **NIT, paper pay-method and ReceiptScreen defaults:** addressed with `receiptPayMethod(payMethods, rl)` on the paper and `cashierName = ''` + `receiptCashier`. `shopName` default kept as placeholder user data.
10. **NIT, "no Thai labels" assertion:** addressed. It now asserts the absence of an explicit string list (§10).
11. **NIT, TaxInvoice HTML untested:** addressed. It is extracted to `src/utils/taxInvoiceHtml.ts` with a th/en test.

## Review responses, rev 3 (design-review.md, rev-2 review)

1. **MEDIUM, void-note and full-tax producers:** addressed. §5.3 "Producers" now lists `voidNote` (`:1685`) and `fullTaxInv` (`:3097`), each with `issuedAt` and `payMethods` copied from the source invoice. `posReceiptData.test.ts` adds a `tax_full` + `en` case and a void-note-shaped case.
2. **MEDIUM, optional `label` reads:** addressed with the §5.3 rule that nothing reads `label` directly. `'th'` is used for the legacy `payMethod` string (`:2713`), `logAction` (`:2771`) and `broadcastDisplay` (`:2489`). `uiLang` is used for displays (`:2610`, `:2648`, the pay buttons, the list column `:2073`). The search (`:1646`) matches the derived UI label plus `inv.payMethod`. The `:2663` raw-`undefined` store is called out as harmless.
3. **MEDIUM, `ewallet` and canonical Thai labels:** addressed. Known ids now include `ewallet`. The th values are pinned to the web print wording, as the review proposed. A single set is used everywhere, and the resulting Thai wording changes (mobile โอนเงิน→โอน, บัตรเครดิต→บัตร; web new-sale QR→QR Code) are listed and accepted in §8. PaymentScreen keeps `E-Wallet / อื่นๆ` on its button through `payment.ewalletOther`. Phase-1 mobile screens switch from `PAYMENT_LABELS` to `payMethodLabel`, and `PAYMENT_LABELS` stays for phase 2. A `labels.test.ts` covers every id.
4. **NIT, ` น.` byte-identity:** addressed. The legacy branch uses `translate(rl, 'receipt.dateTimeValue', …)`. §4, §5.2 and §10(d) now state that the sample `dateTime` deliberately gains ` น.` and that an empty footer becomes the thank-you line.
5. **NIT, ReceiptScreen order-type badge and captions:** addressed in §5.4: `translate(rl, ORDER_TYPE_KEYS[orderType])` for the badge and `receipt.orderDetail.*` via `rt` for the captions. The pay rows (`:222`) also use `payMethodLabel(p.method, rl)`.
6. **NIT, dev guard wording:** addressed in §2. It is described as similar to `mockProducts.ts:303` but falling back to `NODE_ENV`, so vitest counts as dev.
7. **NIT, stale paper-mock refs:** refreshed against HEAD: stamps `:789/:851/:956`, pay rows `:797/:858/:1005`, date rows `:795/:856/:1003`, legacy `dateTime` `:419` (the review cited `:420`, but `:419` is the current line). Where lines may drift, the symbol is named too (`voidNote`, `fullTaxInv`, `printReceipt80mm`).
8. **NIT, icon mapping:** addressed with `PAY_ICON` in `labels.ts` and the `'card-outline'` default (§5.3), covered by `labels.test.ts`.
