# Plan — ทำหน้า "ตั้งค่าโฆษณาจอ 2" ให้ใช้ง่ายขึ้น

Worktree: `d:\pos-mobile\.worktrees\adsettings` (branch `feat/simplify-ad-settings`). Use absolute paths everywhere; relative paths land in the parent workspace `d:\pos-mobile`.

Off-limits (concurrent workflow): `masterImportExport.ts`, `WebProductScreen.tsx`, `WebBrandScreen*`, `WebSupplierScreen*`, `ImportExportScreen.tsx`, anything under `dist/`.
`npm run web:build` writes to `dist/` → never run it as-is. Use `npx expo export --platform web --output-dir .agents/tmp-web-build`, then delete `.agents/tmp-web-build`.

Baseline (measured before any change, at commit 24761d5):
- `npm run lint` (`tsc --noEmit`) → 13 errors, all in unrelated files (BranchSelector, DatePicker, PermissionMatrixScreen, RoleManageScreen, WebUserStaffScreen, errorTracking). Success criterion = still exactly these 13, no new ones.
- `npx vitest run` → 3 suites already fail to load (engine.test, SyncService.test, branchPermissionStore.test: "Failed to resolve ./Libraries/Image/Image" from react-native). 135 tests pass. New tests must `vi.mock('react-native', ...)` and AsyncStorage like `src/store/__tests__/receiptStore.migration.test.ts`.

---

## (A) Audit — what makes the current page hard

File: `src/screens/web/WebAdSettingsScreen.tsx` (441 lines) unless noted.

How users reach it: Settings → "สาขา & จุดขาย" → POS → tab "จอที่ 2" → button "จัดการโฆษณาจอที่ 2" (`WebSimpleScreens.tsx` ~L1111–1138, `setPosAdSettingsId(p.id)` → L599). Also `subView === 'ads'` (L2812), though no settings card currently sets `'ads'` (needs verification during implementation; leave routing as is). The POS id is ignored; ads are global.

Adding an ad is a multi-step form:
1. You have to open a hidden form first. The header button toggles between "เพิ่มโฆษณา" and "ซ่อน" (L62).
2. Before an ad exists you face about 6 decisions: type toggle รูปภาพ/วิดีโอ (L96–106), quick-pick samples (L108–124), a required URL field (L126), a separate file-pick box (L146–176), title + subtitle (L206–216), duration chips "3s…20s" (L219), then the confirm "บันทึกโฆษณา" (L228). You have to choose the type before picking a file. It cannot be inferred.
3. Files picked from the computer become `URL.createObjectURL` blob URLs (L155). These die on reload and do not exist in the `?display=1` window's memory, so the uploaded ad breaks on จอ 2 or after a refresh.
4. Durations use the technical unit "s" (L219–224), and the presets 3/5/8/10/15/20 don't match the requested 5/10/15/30.

Managing ads:
5. Ads cannot be reordered. The store has `reorderAds` (`customerDisplayStore.ts` L157) but the UI never uses it.
6. Ads cannot be paused (no on/off per ad). The only option is delete.
7. Delete runs instantly with no confirm (L278).
8. Duration and title cannot be edited after creation.
9. Action buttons are 28px tall (L425), below the 44px minimum. The back button has no min height.
10. "ดูตัวอย่าง" opens a modal that shows images only (L317+). Video shows nothing, and the modal is fixed at `width: 400` (L433).

No real preview, no link to the real screen:
11. There is no preview of what จอ 2 looks like and no "open จอ 2" button on this page. `WebDisplayScreen.tsx` and the POS panel have one; this page does not.

Confusing "โหมดแสดงผลจอที่ 2" section (user report: "what is this for? I can't click it"), L288–313:
12. Four colored cards (Slideshow โฆษณา / รายการสินค้า / รอชำระเงิน / ชำระสำเร็จ) look like buttons but are plain Views with no handler.
13. The hint "เปิดจอที่ 2 ได้จากปุ่ม 'จอ 2' ในหน้าขายสินค้า แล้วเลือกโหมดที่ต้องการแสดง" (L310) is wrong. Code investigation of `WebPOSScreen.tsx`:
    - Modes switch automatically. Default is `idle`. Pressing a payment button sets `payment_pending` (L2444). Confirming payment sets `payment_success`, then `setTimeout(5000)` sets back to `idle` (L2746–2753).
    - `cart` is never set on web. While items are scanned, the mode stays `idle`. The display still lists items on its left panel (single layout), but the mode badge says "โฆษณา".
    - The POS "จอ 2" panel has no mode-selector buttons. Its header comment says only name + open-window + close remain (L2782). Unused style `displayModeBtns` is left over. Users cannot choose a mode manually.
    - Bug: cancelling the payment modal (L2654) does not reset the mode, so จอ 2 stays on "กรุณาชำระเงิน".
    - What each mode renders (`WebCustomerDisplayScreen.tsx` L147–340):
      - idle: amount ฿0, items empty, ads play.
      - cart: items + grand total.
      - payment_pending: pulsing amount + "กรุณาชำระเงิน" banner + overlay on the ad area.
      - payment_success: green "ชำระเงินสำเร็จ!" banner/overlay + เงินทอน (from `store.changeAmount`).
    - No mode has any configurable setting today. The 5 s success duration and the "ชำระเงินสำเร็จ!" text are hard-coded.

Data / runtime problems behind the page:
14. `customerDisplayStore.ts` is not persisted (plain `create`, L86). Ads reset to `MOCK_ADS` on every reload. A freshly opened `?display=1` window starts with `MOCK_ADS` and only gets real ads after the next ad change is broadcast. So "I changed my ads but จอ 2 shows the sample pictures" is likely (needs verification in browser).
15. `nextAd` does `% s.ads.length` (L145–147). With 0 ads this gives `NaN`. After deleting ads, `currentAdIndex` can point past the end.
16. Video ads are not played on the web display. `AdSlide` renders a dark box for `type==='video'` (`WebCustomerDisplayScreen.tsx` ~L55–57).
17. `AdSlide` effect deps are `[currentAdIndex, ads.length]` (L40). Changing an ad's duration or replacing an ad doesn't restart the timer.

Shop name and code quality:
18. The shop name has its own separate "บันทึก" button (L83), while everything else applies instantly. That is inconsistent.
19. Hard-coded colors (`'#fff'`, `'#000'`, `'#1a1a2e'`, `rgba(...)`), raw font sizes, `textTransform: 'uppercase'` on Thai labels (L360), `useRef<any>` (L32), `as any` icon names, fixed `width: '48%'` cards (L403).
20. No error states. A failed image load silently clears the preview.

`WebDisplayScreen.tsx` and `SettingDisplaySection` (WebSimpleScreens L2399) are separate mock pages with local-only `useState` toggles. Out of scope; noted only.

---

## (B) Data model and migration

Current `AdMedia` (`src/types/customerDisplay.ts`): `{ id, type: 'image'|'video', uri, duration (sec), title?, subtitle? }`. Store fields: `mode, paidAmount, changeAmount, shopName, ads, currentAdIndex, syncedItems, syncedDiscount, syncedGrand, payMethodLabel, memberInfo`. Sync across windows uses BroadcastChannel + a localStorage `pos_display_state` fallback.

The model has no transition style, no layout options and no "show ads when" mode. Ads always play in the bottom-right panel in every mode. Decision: do not invent those settings. The page explains the real behaviour instead. Adding UI that does nothing is exactly what the user complained about.

Changes (all additive and optional, so old data stays valid):
- `AdMedia.enabled?: boolean`. `undefined` is treated as `true`, so existing ads and MOCK_ADS keep showing.
- New store fields:
  - `adsEnabled: boolean` (default `true`): master switch for ads on จอ 2.
  - `successDurationSec: number` (default `5`): replaces the hard-coded 5000 ms in WebPOSScreen.
  - `thankYouMessage: string` (default `'ชำระเงินสำเร็จ!'`): replaces the hard-coded success text on the display.
- Persistence (new): wrap the store with zustand `persist` (pattern: `receiptStore.ts` L344 + `persistStorage.ts`).
  - Key: `pos-customer-display`, `version: 1`, `storage: createJSONStorage(() => persistStorage)`.
  - `partialize` keeps only `{ ads, shopName, adsEnabled, successDurationSec, thankYouMessage }`. Live sale state is never persisted.
  - `migrate(persisted, version)` calls the pure `migrateCustomerDisplay` (below). It normalizes ads (drops entries without `uri`, coerces `duration` to a finite value >0, default 10) and fills missing fields with defaults.
  - Fresh installs still start with `MOCK_ADS`, same as today.
  - Rationale: without persistence, uploads vanish on reload and the `?display=1` window boots with sample ads (A14).
- Uploaded files are stored as data URLs (`FileReader.readAsDataURL`) instead of blob URLs, so they survive reload and load in the display window.
  - localStorage is about 5 MB per origin, so enforce limits: image ≤ 1.5 MB, video ≤ 3 MB, total ads budget ≤ 4 MB (estimated from string length).
  - The storage adapter used by this store wraps `setItem` in try/catch and sets `storageError: string | null` (non-persisted) on failure, so the page can show `<Alert>`-style error text "พื้นที่จัดเก็บเต็ม ลบโฆษณาบางรายการหรือใช้ลิงก์แทน".
- Broadcast: extend `DisplaySyncPayload` and `applySync` with `adsEnabled`, `successDurationSec`, `thankYouMessage`, so an already-open จอ 2 window updates live.

---

## (C) New store actions and pure helpers + tests

New file `src/utils/adSettings.ts`. Pure, no react-native import, easy to test:
- `DURATION_PRESETS = [5, 10, 15, 30]`, `DEFAULT_AD_DURATION = 10`, `MAX_AD_DURATION = 300`, `SUCCESS_DURATION_PRESETS = [3, 5, 10]`.
- `AD_LIMITS = { imageBytes: 1.5MB, videoBytes: 3MB, totalChars: 4_000_000 }`.
- `inferAdType(mimeOrUrl: string): AdMediaType | null`.
  - `image/*` gives `'image'`; `video/*` gives `'video'`.
  - URL extension `.mp4/.webm/.mov/.m4v` gives `'video'`; `.jpg/.jpeg/.png/.gif/.webp/.svg` and `data:image/` give `'image'`.
  - An http(s) URL with an unknown extension defaults to `'image'`. Anything else gives `null`.
- `validateAdFile({ type, size }): string | null`. Returns Thai error text or null:
  - "รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ"
  - "ไฟล์รูปใหญ่เกินไป (สูงสุด 1.5 MB)"
  - "ไฟล์วิดีโอใหญ่เกินไป (สูงสุด 3 MB) — แนะนำให้วางลิงก์วิดีโอแทน"
- `validateAdUrl(url): string | null`: requires `http(s)://` or `data:`, message "ลิงก์ไม่ถูกต้อง".
- `validateDuration(n): string | null`: "ระยะเวลาต้องมากกว่า 0 วินาที" / "ระยะเวลาต้องไม่เกิน 300 วินาที" / non-integer → "กรุณากรอกตัวเลข".
- `createAd(input: { uri; type; title? }, now = Date.now()): AdMedia`. Defaults: `duration: 10`, `enabled: true`, `id: 'ad_' + now + random suffix`.
- `moveItem<T>(arr, from, to): T[]`. Immutable; out-of-range input returns a copy unchanged.
- `getPlayableAds(ads, adsEnabled)`. Returns `adsEnabled ? ads.filter(a => a.enabled !== false) : []`.
- `estimateAdsChars(ads)`. Sum of `uri.length` + small overhead.
- `migrateCustomerDisplay(persisted: unknown, version: number): PersistedCustomerDisplay`. Tolerant of null/garbage input.

Store (`src/store/customerDisplayStore.ts`) new or changed actions. Every ad mutation keeps the existing `broadcast({ ads })`.
- `addAdWithDefaults(input) → AdMedia`. Uses `createAd`, appends, broadcasts, returns the ad.
- `updateAd(id, patch: Partial<Omit<AdMedia,'id'>>)`. Duration is clamped/validated by the caller; the store ignores a `duration` ≤ 0.
- `toggleAd(id)`.
- `moveAd(id, direction: -1 | 1)` and `moveAdTo(from, to)`. Both use `moveItem`; the latter is for drag.
- `setAdsEnabled(v)`, `setSuccessDuration(sec)`, `setThankYouMessage(text)`. Each broadcasts.
- `nextAd` fix: modulo the playable count; if 0, set index 0 (no NaN). `removeAd` clamps `currentAdIndex`.
- Keep `addAd`, `removeAd`, `reorderAds` for mobile and other callers.

Tests:
- `src/utils/__tests__/adSettings.test.ts`.
  - `inferAdType` for MIME/extension/data URL/unknown.
  - `validateAdFile` for ok / bad type / too-large image / too-large video.
  - `validateDuration` for 0, -1, 301, 'abc', 10.
  - `createAd` defaults.
  - `moveItem` up/down/edges/out-of-range.
  - `getPlayableAds` for master off, per-ad off, undefined enabled.
  - `migrateCustomerDisplay` for undefined, `{}`, ads missing `enabled`, bad durations, ads without uri.
- `src/store/__tests__/customerDisplayStore.test.ts`. Mock `react-native` (`Platform.OS: 'web'`) and AsyncStorage exactly like `receiptStore.migration.test.ts`.
  - `addAdWithDefaults` appends with duration 10, enabled true.
  - `moveAd` ±1 incl. edges.
  - `toggleAd`, `updateAd` ignores duration ≤ 0.
  - `nextAd` with 0 ads and with all disabled gives no NaN.
  - `removeAd` clamps the index.
  - `setAdsEnabled` / `setSuccessDuration` / `setThankYouMessage`.
  - `partialize` excludes `mode` / `syncedItems`: check `localStorage.getItem('pos-customer-display')` after a change contains `ads` but not `syncedItems`.

---

## (D) New page layout (`WebAdSettingsScreen.tsx`, rewritten)

One `ScrollView` with a two-column flex row (`flexWrap: 'wrap'`, `gap`). The left column has `flex: 3, minWidth` from tokens; the right preview column has `flex: 2`. On narrow screens they stack. No fixed pixel widths except icon/thumbnail sizes and the preview's virtual canvas. Colors come from `WebColors`; spacing, radius and type from `@/constants/spacing` and `@/constants/typography` (map numbers to tokens). All text is Thai and every pressable is ≥44px (`ComponentSize.button.md`).

0. Header row:
   - Back "← ตั้งค่า" (44px hit area).
   - Title "โฆษณาจอ 2" with sub "ภาพและวิดีโอที่ลูกค้าเห็นบนจอที่ 2 — บันทึกอัตโนมัติ".
   - Right side: secondary button "เปิดจอ 2 จริง" (`tv-outline`). It calls `window.open(window.location.href.split('?')[0] + '?display=1', 'CustomerDisplay', 'width=1280,height=720,menubar=no,toolbar=no')`, the same as WebPOSScreen L2790. Web only, hidden on native.

1. Card "แสดงโฆษณาบนจอ 2" with a Switch bound to `adsEnabled`.
   - Helper text: "โฆษณาจะเล่นวนที่มุมขวาล่างของจอ 2 ตลอดเวลา (ถ้าปิด จะแสดงชื่อร้านแทน)".
   - If `storageError` is set, show the error Alert here.

2. Card "รายการโฆษณา (n)" (dimmed with note "ปิดอยู่" when `adsEnabled` is false; still editable).
   - Primary big button "เพิ่มโฆษณา" (`add`, size md/lg, 44px+). On web it opens the hidden `<input type="file" accept="image/*,video/*" multiple>` directly (typed `useRef<HTMLInputElement | null>`).
   - For each file: `validateAdFile`, then `readAsDataURL`, then check the budget, then `addAdWithDefaults({ uri, type: inferAdType(file.type), title: file name without extension })`, then a "เพิ่มโฆษณาแล้ว" toast.
   - While reading, the button shows a loading state "กำลังอ่านไฟล์…". Errors show inline as `Alert type="error"`-style text.
   - Secondary text button "หรือวางลิงก์รูป/วิดีโอ" expands one inline row: URL input + "เพิ่ม" button. It runs `validateAdUrl` + `inferAdType`, and there is no type toggle. Below it, "หรือใช้รูปตัวอย่าง" chips (existing SAMPLE_IMAGES) add instantly. This keeps the sample capability. On native (no file input) this URL row is shown expanded by default.
   - Empty state (no ads): icon + "ยังไม่มีโฆษณา — กด เพิ่มโฆษณา เพื่ออัปโหลดรูปหรือวิดีโอ" + the same add button.
   - Card grid (`flexDirection: 'row', flexWrap: 'wrap', gap`, each card `flexGrow: 1, flexBasis` token-based min). Per card:
     - Thumbnail (16:9). Image → `<Image>`; video → on web a `<video muted preload="metadata">` frame, otherwise a play icon.
     - Order badge "1", type chip "รูป/วิดีโอ".
     - A dimmed overlay "ปิดอยู่" when `enabled === false`.
     - Row: Switch "แสดง" (`toggleAd`).
     - Duration row: label "แสดงนาน" + chips "5 วิ / 10 วิ / 15 วิ / 30 วิ / กำหนดเอง". "กำหนดเอง" reveals a numeric input + "วินาที", validated with `validateDuration` (error text under the field) and applied on blur/submit.
     - Reorder: ▲ "เลื่อนขึ้น" / ▼ "เลื่อนลง" buttons (44px, disabled at the edges, `accessibilityLabel`).
     - On web the card is wrapped in a raw `<div draggable onDragStart/onDragOver/onDrop>` that calls `moveAdTo`, with a visual drop highlight. The existing file already uses raw `<input>`, so raw DOM is an accepted pattern here.
     - Delete (trash, 44px) → an inline confirm row "ลบโฆษณานี้?" [ยกเลิก] [ลบ] (inline, because `Alert.alert` is a no-op on react-native-web).
     - Collapsible "ตั้งค่าเพิ่มเติม ▾": title + subtitle inputs (commit on blur via `updateAd`). Helper: "ข้อความนี้จะแสดงทับบนโฆษณา".
     - Clicking the card thumbnail selects that ad in the preview (sets `previewMode='idle'` + jumps the preview index).

3. Card "จอ 2 ทำงานอย่างไร". Replaces the fake mode buttons and fixes A12/A13.
   - Heading text: "จอ 2 จะเปลี่ยนโหมดอัตโนมัติตามขั้นตอนการขาย — ไม่ต้องกดเลือกเอง".
   - A step flow 1 → 2 → 3 → 4 with arrow icons (`arrow-forward`; wraps on narrow screens):
     1. "รอลูกค้า (โฆษณา)": "ยังไม่มีสินค้าในบิล"
     2. "รายการสินค้า": "เมื่อสแกน/เพิ่มสินค้า"
     3. "รอชำระเงิน": "เมื่อกดปุ่มชำระเงิน"
     4. "ชำระสำเร็จ": "หลังรับเงิน แล้วกลับไปข้อ 1 อัตโนมัติ"
   - Each step is a real pressable with the caption "กดเพื่อดูตัวอย่าง". It sets `previewMode`. Selected state: primary border + check icon + `accessibilityState={{ selected }}`. Default selected = 1.
   - Settings under the matching step, shown when that step is selected:
     - Step 1: shortcut text "เปิด/ปิดโฆษณาได้ที่ด้านบน".
     - Steps 2 and 3: "ไม่ต้องตั้งค่า — แสดงข้อมูลจากหน้าขายอัตโนมัติ".
     - Step 4: input "ข้อความขอบคุณ" (`thankYouMessage`, commit on blur; empty falls back to default) + chips "แสดงนาน 3 / 5 / 10 วินาที" (`successDurationSec`).
   - The old inaccurate hint text is removed.

4. Collapsed "ขั้นสูง ▾":
   - "ชื่อร้านบนจอ 2" input (commit on blur, no separate save button; empty keeps the old name).
   - Storage usage line "ใช้พื้นที่เก็บโฆษณา X.X / 4 MB" from `estimateAdsChars`.

5. Right column "ตัวอย่างจอ 2" (live preview).
   - A 16:9 box measured with `onLayout`. Inside, a 1280×720 virtual canvas scaled by `transform: [{ scale: width/1280 }]` (`transformOrigin` top-left on web). It renders `<WebCustomerDisplayScreen embedded mode={previewMode} displayItems={SAMPLE_ITEMS} discountOverride grandOverride changeAmount={…} hideMemberInfo />`.
   - Sample data for modes 2–4: 3 items, e.g. "น้ำดื่ม 600 มล.", "ขนมปังโฮลวีท", "กาแฟเย็น", total ฿125, เงินทอน ฿375. Mode 1 uses `displayItems={[]}` and `grandOverride={0}`.
   - Cycling uses the real `AdSlide` with playable ads and real durations.
   - Mode tabs under the preview mirror section 3's selection.
   - Below: "เปิดจอ 2 จริง" button again + note "การเปลี่ยนแปลงบันทึกอัตโนมัติและส่งไปจอ 2 ที่เปิดอยู่ทันที".

Save feedback: the store persists on change, so there is no save button. A small toast "บันทึกแล้ว" (auto-hide 1.5 s, pattern from `WebReceiptDesignerScreen.tsx` L406/L700) appears after each settings change (debounced for text inputs, which commit on blur).

States:
- Loading: file reading (button loading) and a short "กำลังโหลด…" until the persist store has hydrated (`useCustomerDisplayStore.persist.hasHydrated()`; web localStorage hydrates synchronously, so this mostly matters on native).
- Error: validation and storage errors as Alert-styled boxes with a dismiss button.
- Empty: as above.

---

## (E) Consumer impact

- `src/screens/web/WebCustomerDisplayScreen.tsx` (`?display=1`, POS embedded panel, the new preview). Changes:
  - `AdSlide` uses `getPlayableAds(ads, adsEnabled)` and `ad = playable[currentAdIndex % playable.length]`. Timer deps become `[currentAdIndex, playable.length, ad?.id, ad?.duration]`.
  - Empty / `adsEnabled === false` → shop name fallback (existing empty-state style; text "ยังไม่มีโฆษณา" stays when there are no ads and master is on).
  - Video on web is rendered with `<video src autoPlay muted loop playsInline>` absolute-fill.
  - Success banner and overlay text use `store.thankYouMessage || 'ชำระเงินสำเร็จ!'`.
  - The prop `changeAmount` currently defaults to `0` and is unused. Change to `changeAmount?: number` with `const change = changeAmount ?? store.changeAmount`. Add an optional `hideMemberInfo?: boolean`.
  - Existing callers (App.tsx: no props; WebPOSScreen L2806: mode / embedded / onClose / discountOverride / …) are unaffected. Verify the WebPOSScreen call site does not pass `changeAmount`.
- `src/screens/web/WebPOSScreen.tsx`:
  - (a) Success timeout `5000` (L2750) becomes `useCustomerDisplayStore.getState().successDurationSec * 1000`.
  - (b) Payment-modal cancel (L2654) also calls `setDisplayMode('idle')` + `broadcastDisplay({ mode: 'idle' })`. This fixes the stuck "กรุณาชำระเงิน" bug from A13.
  - (c) Derive `effectiveDisplayMode = displayMode === 'idle' && items.length > 0 ? 'cart' : displayMode`. Use it in the broadcast effect (L1566) and in the embedded panel prop (L2807).
  - Rationale for (c): the new step-flow explanation says step 2 "รายการสินค้า" appears when items are scanned, and today the badge wrongly says "โฆษณา". This is a small, user-visible badge-text change and must be reported in the final summary.
  - Do not touch anything else in this 3600-line file.
- `src/screens/sale/CustomerDisplayScreen.tsx` (mobile):
  - `IdleScreen` uses `getPlayableAds` + modulo indexing so disabled ads are skipped and the index never goes out of range.
  - The existing fallback (storefront + shopName + "ยินดีต้อนรับ") covers no-ads / master-off.
  - Its "ชำระสำเร็จ" screen: use `thankYouMessage` only if there is a direct equivalent string. Otherwise leave it and note it.
- `src/screens/sale/AdManagerScreen.tsx` (mobile):
  - Keeps working: `addAd` / `removeAd` remain, and new ads without `enabled` count as enabled.
  - Trivial alignment only: use `DURATION_PRESETS`, show "วินาที" instead of "s", and default duration 10.
  - Full redesign is NOT done (separate modal flow, native file picking not available). State this in the summary.
- `src/screens/web/WebDisplayScreen.tsx`, `SettingDisplaySection` (WebSimpleScreens L2399): they don't use the store; no change.
- `WebSimpleScreens.tsx` L1121–1124: the info text "เปิดได้จากปุ่ม 'จอ 2' ในหน้าขายสินค้า" is accurate; leave it. Routing is unchanged.

---

## (F) Implementation steps

- [ ] 1. Pure helpers + tests.
      Create `src/utils/adSettings.ts` (section C helpers, typed, no `any`; import only `AdMedia`/`AdMediaType` types) and `src/utils/__tests__/adSettings.test.ts`.
      Files: `src/utils/adSettings.ts`, `src/utils/__tests__/adSettings.test.ts`
      Verify: `npx vitest run src/utils/__tests__/adSettings.test.ts` → all pass; `npm run lint` → still the 13 baseline errors only.

- [ ] 2. Types + store: persistence, migration, new actions, sync fields.
      Add `enabled?` to `AdMedia`. Wrap the store in `persist` (key `pos-customer-display`, v1, partialize, migrate via `migrateCustomerDisplay`) with the try/catch storage wrapper that sets `storageError`. Add `adsEnabled`, `successDurationSec`, `thankYouMessage`, `storageError`, `addAdWithDefaults`, `updateAd`, `toggleAd`, `moveAd`, `moveAdTo`, `setAdsEnabled`, `setSuccessDuration`, `setThankYouMessage`, `clearStorageError`. Fix `nextAd`/`removeAd` index. Extend `DisplaySyncPayload`/`applySync`, and replace the `(patch as any)` casts touched here with typed fields (`payMethodLabel`, `memberInfo` already exist on the state). The existing BroadcastChannel/storage listeners stay outside the persist initializer exactly as now.
      Files: `src/types/customerDisplay.ts`, `src/store/customerDisplayStore.ts`, `src/store/__tests__/customerDisplayStore.test.ts`
      Depends on: 1.
      Verify: `npx vitest run src/store/__tests__/customerDisplayStore.test.ts src/utils/__tests__/adSettings.test.ts` → pass; `npm run lint` → 13 baseline errors only.

- [ ] 3. Consumers honour the new fields.
      Update `WebCustomerDisplayScreen.tsx` (playable ads, safe index, timer deps, web video, thankYouMessage, `changeAmount ?? store.changeAmount`, `hideMemberInfo`). Update `CustomerDisplayScreen.tsx` IdleScreen (playable ads + modulo). Make the three WebPOSScreen edits from (E): success duration, cancel → idle, effective `cart` mode.
      Files: `src/screens/web/WebCustomerDisplayScreen.tsx`, `src/screens/sale/CustomerDisplayScreen.tsx`, `src/screens/web/WebPOSScreen.tsx`
      Depends on: 2.
      Verify: `npm run lint` → baseline only; `npx vitest run` → 135+ new tests pass, only the 3 pre-existing suite failures.

- [ ] 4. Rewrite `WebAdSettingsScreen.tsx` per section D.
      Sections 0–5, one-step add (file/URL/sample), per-ad cards (switch, duration presets + custom, ▲▼, web drag, inline delete confirm, "ตั้งค่าเพิ่มเติม"), step-flow mode cards with preview selection + step-4 settings, "ขั้นสูง", the scaled live preview, the "เปิดจอ 2 จริง" button, the toast, and loading/error/empty states. Keep the `Props { onBack }` signature (callers in WebSimpleScreens L599/L2812 unchanged). Use the WebColors and design tokens, no hard-coded hex, typed refs, icon names typed via `React.ComponentProps<typeof Ionicons>['name']`.
      Files: `src/screens/web/WebAdSettingsScreen.tsx`
      Depends on: 2, 3.
      Verify: `npm run lint` → baseline only; `npx expo export --platform web --output-dir .agents/tmp-web-build` succeeds (then delete that folder); manual check per verification doc §3.

- [ ] 5. Mobile AdManager trivial alignment.
      Use `DURATION_PRESETS` (5/10/15/30), label "วินาที", default 10. No structural change.
      Files: `src/screens/sale/AdManagerScreen.tsx`
      Verify: `npm run lint` → baseline only.

- [ ] 6. Verification doc + browser check.
      Run `npx expo start --web` (or the existing dev server if one is already running; do not kill other servers). Walk through §3 of the verification doc in a real browser, including a second `?display=1` window. Record the results.
      Files: `.agents/tasks/adsettings/ad-settings-verification.md`
      Verify: full `npx vitest run` + `npm run lint` outputs pasted in the doc; every checklist item marked pass/fail with notes.

Commit locally on `feat/simplify-ad-settings` after each step (stage specific files only; never `dist/`, never the off-limits files). Do not push.

---

## (G) Verification doc outline — `.agents/tasks/adsettings/ad-settings-verification.md`

1. Summary: what changed and why (link to audit items A1–A20).
2. Automated:
   - `npx vitest run` output (expect the new adSettings + customerDisplayStore suites pass; only the 3 pre-existing load failures).
   - `npm run lint` (exactly the 13 baseline errors, list unchanged).
   - The `expo export --output-dir .agents/tmp-web-build` result (folder deleted afterwards).
3. Manual browser checklist (pass/fail + note each):
   - Add an image file in one click: the card appears with 10 วิ and "แสดง" on; toast "บันทึกแล้ว"/"เพิ่มโฆษณาแล้ว".
   - Add a video file ≤3 MB: it plays on the preview and on `?display=1`.
   - A >3 MB video, a >1.5 MB image, and a .pdf each give the Thai errors.
   - Paste a URL; a sample chip adds instantly.
   - Duration presets 5/10/15/30 work; custom 0 / -1 / abc / 301 show errors; a valid custom value applies.
   - ▲▼ reorder, including the disabled edge buttons; drag-reorder on web.
   - Delete shows the inline confirm; "ยกเลิก" keeps the ad.
   - Per-ad off is skipped in the preview and on จอ 2; the master switch off shows the shop-name fallback.
   - Mode steps 1–4: clicking switches the preview with sample data and shows a visible selected state. Step-4 thank-you text + duration are reflected in the preview.
   - Real sale: scan items → จอ 2 badge "รายการสินค้า"; pay → "รอชำระ"; cancel payment → back to idle/cart (bug fixed); confirm → thank-you text for the chosen duration → back.
   - Reload the settings page → ads/settings persist. Open a new `?display=1` window → it shows the real ads, not the samples. Edits apply live to the already-open จอ 2.
   - "เปิดจอ 2 จริง" opens the display window.
   - Shop name in "ขั้นสูง" saves on blur with no extra button.
   - Every button ≥44px (devtools check); narrow width stacks columns; no element looks clickable but does nothing.
   - Mobile `AdManagerScreen` still adds/removes (or "not verifiable in this environment", stated explicitly).
4. Consumer impact results per file (section E).
5. Known limitations / follow-ups:
   - localStorage size limits.
   - Mobile AdManager not fully redesigned.
   - `WebDisplayScreen` / `SettingDisplaySection` remain mock pages.
   - The `cart` badge behaviour change in POS.
