# Verification: simplify "โฆษณาจอ 2" (WebAdSettingsScreen)

Branch `feat/simplify-ad-settings` (worktree `.worktrees/adsettings`). Not pushed.

## 1. Audit: what was hard before

From plan §A:
- **Adding an ad was a hidden multi-step form.** You opened it with the header toggle, chose image or video *first*, filled in a required URL, picked a file, typed title and subtitle, chose a duration, then pressed "บันทึกโฆษณา". (A1–A2)
- **Uploaded files did not last.** They were saved as `blob:` URLs, which break after a reload and in the `?display=1` window. (A3)
- **Durations were confusing.** They were labelled "3s…20s", not 5/10/15/30. (A4)
- **Ads were hard to manage.** You couldn't reorder or pause them, delete had no confirm, and you couldn't edit an ad after adding it. (A5–A8)
- **Small targets and a weak preview.** Buttons were 28 px high. The preview modal showed images only and was a fixed 400 px wide. (A9–A10)
- **No way to see จอ 2.** There was no live preview and no "open จอ 2" button. (A11)
- **The "โหมดแสดงผล" cards looked clickable but did nothing.** Their hint also described a manual mode selector that doesn't exist. (A12–A13)
- **Nothing was saved.** The store wasn't persisted, so ads went back to the sample pictures on every reload, and a new จอ 2 window started with the samples too. (A14)
- **Runtime bugs on the display:**
  - `nextAd` gave NaN when there were 0 ads.
  - Video ads were never played.
  - The ad timer ignored changes to duration. (A15–A17)
- **Inconsistent and hard-coded UI.** The shop name had its own save button, colours and font sizes were hard-coded, and there were no error states. (A18–A20)

## 2. What changed

| Area | Change |
|---|---|
| `src/utils/adSettings.ts` (new) | Pure helpers: `DURATION_PRESETS` 5/10/15/30, default 10 s, `inferAdType`, `validateAdFile` / `validateAdUrl` / `validateDuration` (Thai messages), `createAd`, `moveItem`, `getPlayableAds`, `estimateAdsChars`, `migrateCustomerDisplay`. |
| `src/utils/adMedia.ts` (new, review fix #1) | Uploaded files are now stored as Blobs in **IndexedDB** (`pos-ad-media` / `media`). `ad.uri` only holds a short reference `idb:<id>` (~30 chars). `saveAdMedia`, `resolveAdMediaUri` (object-URL cache per window), `deleteAdMedia`, `dataUrlToBlob`, `isMediaStorageAvailable`, and the `useAdMediaUri` hook used by every web renderer. The backend is swappable (`setMediaBackend`) so tests run against an in-memory map. |
| `src/types/customerDisplay.ts` | `AdMedia.enabled?: boolean` (additive; `undefined` = on, so old data stays valid). |
| `src/store/customerDisplayStore.ts` | **Persistence:** now saved with zustand `persist` (key `pos-customer-display`, v1). `partialize` keeps only ads, shopName, adsEnabled, successDurationSec and thankYouMessage. `migrate`/`merge` normalise old or garbage data. A storage wrapper catches quota errors (sets `storageError`) and skips writes when nothing changed. **New fields:** `adsEnabled`, `successDurationSec`, `thankYouMessage`. **New actions:** `addAdWithDefaults`, `updateAd` (ignores duration ≤ 0), `toggleAd`, `moveAd`, `moveAdTo`, `setAdIndex`, `setAdsEnabled`, `setSuccessDuration`, `setThankYouMessage`, `clearStorageError`. **Fixes:** `nextAd` and `removeAd` keep the index in range. The new fields are broadcast to open จอ 2 windows. The localStorage broadcast fallback now writes then removes its key, so large data-URL ads don't use up the quota. `addAd`, `removeAd` and `reorderAds` are kept. |
| `WebAdSettingsScreen.tsx` (rewritten) | One page with a two-column flex-wrap layout:<br>1. Master switch.<br>2. Ads card. The big **เพิ่มโฆษณา** button opens the file picker straight away (image/video, multiple files). Files are saved as data URLs and the card appears with 10 วิ, on. A secondary "วางลิงก์ / รูปตัวอย่าง" row infers the type, so there's no type toggle. Each card has a thumbnail, a "แสดง" switch, 5/10/15/30 วิ + กำหนดเอง (validated), ▲▼ buttons, drag-to-reorder on web, delete with an inline confirm, and a collapsed "ตั้งค่าเพิ่มเติม" with title/subtitle.<br>3. "จอ 2 ทำงานอย่างไร": 4 real, pressable steps that drive the preview. Step 4 holds the thank-you text and the 3/5/10 s success-duration setting.<br>4. Collapsed "ขั้นสูง": shop name (saves on blur) and storage usage.<br>5. Live preview: the real `WebCustomerDisplayScreen` scaled from a 1280×720 canvas, with sample items for modes 2–4, mode tabs, **เปิดจอ 2 จริง**, a "บันทึกแล้ว" toast, and loading/error/empty states. There are no save buttons. All buttons are ≥44 px, colours come from `WebColors`, and sizes from FontSize/Spacing/BorderRadius tokens. |
| `WebCustomerDisplayScreen.tsx` | `AdSlide` plays only playable ads with a safe index, and its timer now restarts when the ad or its duration changes. Video plays on web (`<video autoPlay muted loop>`). When the master switch is off or every ad is disabled, the shop name shows instead. The success text uses `thankYouMessage`. `changeAmount` now falls back to the store. New optional props `hideMemberInfo` and `subtotalOverride` (used by the preview only). |
| `WebPOSScreen.tsx` (3 small edits) | (a) The success screen now returns to idle after `successDurationSec` (default 5, same as before). (b) Cancelling the payment modal now resets จอ 2 to idle (it used to stay stuck on "กรุณาชำระเงิน"). (c) `effectiveDisplayMode`: when the bill has items, the จอ 2 badge reads "รายการสินค้า" instead of "โฆษณา". **This is a small, user-visible change on the POS badge.** |
| `sale/CustomerDisplayScreen.tsx` | `IdleScreen` uses playable ads with a modulo index. The success title stays hard-coded "ชำระเงินสำเร็จ" because it isn't a direct match for the configurable text, so `thankYouMessage` isn't used there. |
| `sale/AdManagerScreen.tsx` | Small alignment only: presets 5/10/15/30, label "วินาที", default 10. **Not redesigned:** it's a separate native modal flow and has no native file picker. |

## 3. Automated checks

| Check | Before (baseline) | After |
|---|---|---|
| `npm run lint` (`tsc --noEmit`) | 13 errors in 6 files | **13 errors, the same 6 files** (BranchSelector 3, DatePicker 4, PermissionMatrixScreen 1, RoleManageScreen 2, WebUserStaffScreen 2, errorTracking 1). No new errors. |
| `npm test` (vitest) | 135 passed, 3 suites fail to load | **187 passed** (+52 new: `adSettings.test.ts` 24, `customerDisplayStore.test.ts` 20, `adMedia.test.ts` 8), the same 3 pre-existing suite-load failures (engine.test, SyncService.test, branchPermissionStore.test) |
| `npx expo export --platform web --output-dir .agents/tmp-web-build` | — | Succeeded. Folder deleted afterwards; `dist/` untouched. On Windows this must run from an uppercase `D:\` cwd, because Metro SHA-1 lookups fail with `d:\`. |

The new tests cover:
- add-with-defaults (10 s, enabled)
- duration presets, plus `updateAd` ignoring ≤0
- ▲▼ moves including edges
- drag `moveAdTo`
- toggle
- `nextAd` with 0 ads, all disabled, and skipping disabled ads
- `removeAd` index clamp
- the 3 common settings
- persisted blob contains settings only (no `syncedItems` / `mode` / `storageError`)
- `migrate`/`merge` on old or garbage blobs
- storage-quota error is set, then cleared on the next successful write

## 4. Reviewer walkthrough (run in headless Chrome against the exported web build)

I logged in as admin/1234 and went to ตั้งค่า → สาขา & จุดขาย → POS 1 ตั้งค่า → จอที่ 2 → จัดการโฆษณาจอที่ 2. Clicks and typing were sent as real CDP mouse and keyboard input. Files were set on the page's file input, which is the same handler the picker uses.

| Step | Result |
|---|---|
| Empty state (after deleting the samples through the inline confirm) | PASS. Shows icon + "ยังไม่มีโฆษณา — กด เพิ่มโฆษณา เพื่ออัปโหลดรูปหรือวิดีโอ" + a big เพิ่มโฆษณา button + size limits. |
| Add an image in one step | PASS. File input is `accept=image/*,video/*`, `multiple`. After picking a PNG the card appears right away; stored as `{title:'โปรหน้าร้อน', duration:10, enabled:true, uri:data:image/png…}`. Toast "บันทึกแล้ว" / "เพิ่มโฆษณาแล้ว" shows. |
| Validation | PASS. A `.pdf` shows "รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ". A 1.6 MB PNG shows "ไฟล์รูปใหญ่เกินไป (สูงสุด 1.5 MB)". A 3.2 MB MP4 shows "ไฟล์วิดีโอใหญ่เกินไป…". The URL "not a url" shows "ลิงก์ไม่ถูกต้อง". |
| URL + sample add | PASS. A pasted Unsplash URL and the "ขนม" sample were each added in one click. |
| Change duration preset | PASS. 30 วิ saves 30. กำหนดเอง with 0 shows "ระยะเวลาต้องมากกว่า 0 วินาที"; 20 saves 20. |
| Reorder ▲▼ | PASS. ▼ swaps 1↔2 and ▲ restores. ▲ on the first card and ▼ on the last are disabled. |
| Reorder by drag (web) | PASS. Dragging card 3 onto card 1 moved it to position 1. |
| Toggle off one ad | PASS. Stored flags are `true,false,true`; the card shows a "ปิดอยู่" overlay; the header reads "กำลังเล่น 2 จาก 3". |
| Preview cycles only active ads | PASS. Watched for 14 s: 2 distinct frames, and the disabled ad never appeared. The mode tabs and step cards switch the preview; step 4 shows "ชำระเงินสำเร็จ!" + เงินทอน ฿375.00 on sample items. |
| เปิดจอ 2 จริง shows the same ads | PASS. The `?display=1` window opened, read the same 3 ad ids from persisted storage, played the "ขนม" ad, and showed 2 dots (active ads only). |
| Reload keeps settings | PASS. The stored blob is byte-identical after `Page.reload`, and the cards are still there. |
| Touch targets / responsive | PASS. No button or role=button under 44 px on the page. At 760 px wide the columns stack and the cards wrap. |

Note: the "Add an image" row above is from iteration 1, when uploads were data URLs. Since the review fix, uploads are stored as `idb:` references; see §7.

## 5. Consumers

- **`WebCustomerDisplayScreen.tsx`**: renders correctly in the `?display=1` window (screenshot checked) and in the new preview. Existing call sites (App.tsx with no props, WebPOSScreen embedded) compile unchanged. WebPOSScreen does not pass `changeAmount`, so it now falls back to `store.changeAmount`, which matches what the banner used before.
- **`WebPOSScreen.tsx`**: compiles. Only the 3 edits in §2 changed. Not run through a full sale in the browser (see §4).
- **`WebDisplayScreen.tsx`**: doesn't use the store, so no change.
- **`sale/CustomerDisplayScreen.tsx`**: compiles. IdleScreen skips disabled ads and its index can't go out of range. The fallback for no ads / master off is unchanged. Not run on a device.
- **`sale/AdManagerScreen.tsx`**: compiles and still uses `addAd`/`removeAd`. New ads have no `enabled` field, which counts as on. Not run on a device.
- **`settings/CustomerDisplaySettingsScreen.tsx`** (also a store user): only uses `addAd`/`removeAd`/`setShopName`/`setMode`, all unchanged.

## 6. Known limitations

- Uploaded files are kept in this browser's IndexedDB. They aren't shared across devices, and clearing site data removes them. If that happens, the card shows "ไม่พบไฟล์ในเครื่องนี้" and จอ 2 shows a dark slide for that ad. Per-file limits are unchanged: images 1.5 MB, videos 3 MB. If IndexedDB is unavailable, uploading shows "เบราว์เซอร์นี้เก็บไฟล์ไม่ได้ — กรุณาวางลิงก์รูป/วิดีโอแทน", and links still work.
- Mobile consumers (`sale/CustomerDisplayScreen`, `sale/AdManagerScreen`) don't resolve `idb:` refs. They don't need to, because native builds use AsyncStorage and never create `idb:` refs, and on web App.tsx always routes to the web screens.
- Mobile AdManager is not fully redesigned.
- `WebDisplayScreen` / `SettingDisplaySection` are still mock pages.
- POS badge behaviour change: "รายการสินค้า" now shows while the bill has items.

## 7. Review iteration 2: fixes and evidence

These checks ran in headless Google Chrome (system install, so H.264 is supported) through playwright-core 1.46.1, which was installed in a temp folder outside the repo. They ran against a fresh `expo export --platform web` build served from a temp folder. Clicks, typing and file picks went through the real UI. All temp folders were deleted afterwards, and `dist/` was untouched.

### Finding 1 (MEDIUM): ad uploads could fill the shared localStorage quota. Fixed.

- **Fix:** uploaded files now go to IndexedDB (`src/utils/adMedia.ts`). localStorage holds only `idb:<id>` references, so other stores (`pos-sale-history`, products and the rest) no longer share their quota with media.
  - Pasted `data:` URLs are converted to Blobs and stored the same way.
  - Removing an ad also deletes its Blob.
  - The inline budget (`AD_LIMITS.totalChars`) is cut from 4,000,000 to 1,000,000 characters. It now only guards inline data.
- **What the user sees:** nothing changes. Upload, the per-file limits (image 1.5 MB, video 3 MB) and the error texts stay the same.
- **Measured:** 3 sample ads plus 1 PNG and 1 MP4 (137 KB) uploaded. The ads store used **944 chars** in localStorage, and the whole origin used 1,373 chars. IndexedDB held 2 Blobs. Before the fix, the same video alone would have taken about 182K chars of base64.
- **Impact on other stores:** with the ads store at under 1K chars, the remaining ~5M-char quota is left for the other ~31 persisted stores. Their unguarded `setItem` path is unchanged and is no longer at risk from ad uploads.
- **Tests:**
  - `adMedia.test.ts`: refs, save/resolve/cache, a missing file resolves to null, delete revokes the URL, no-backend throws, and `dataUrlToBlob`.
  - Store tests: `removeAd` deletes the Blob, and the persisted blob holds only the short ref.

### Finding 2 (LOW): POS end-to-end. Verified.

I ran one sale with `?display=1` open. Success duration was set to 3 วินาที on the ad settings page; the stored value was 3.

| Step | จอ 2 badge |
|---|---|
| Empty bill | โฆษณา |
| Scan น้ำดื่มสิงห์ 600ml (unit ขวด) | รายการสินค้า; the item is listed on จอ 2 |
| Press เงินสด | รอชำระ + "กรุณาชำระเงิน" |
| ยกเลิก | รายการสินค้า at the first 40 ms sample, staying for 2 s. No flicker through โฆษณา was observed. |
| เงินสด again | รอชำระ |
| ฿20 → + เพิ่ม → ยืนยัน & พิมพ์บิล | ชำระสำเร็จ, then back to โฆษณา after 2,990 ms of sampling, which matches 3 s. The receipt print window opened, and `pos-sale-history` was written (7 sales). |

### Finding 3 (LOW): video playback. Verified.

I recorded a 2.5 s H.264 MP4 (`video/mp4;codecs=avc1`, 136,794 bytes) in the browser with MediaRecorder, then uploaded it with the PNG through the เพิ่มโฆษณา file input. Toast: "เพิ่มโฆษณา 2 รายการแล้ว". Both cards appeared with defaults (10 วิ, on). I then turned off every other ad.

- **Admin page:** the live preview `<video>` played (`paused:false`, `readyState 4`, `videoWidth 320`, currentTime advancing). The card thumbnail is a paused `blob:` video.
- **`?display=1`:** a `<video src=blob:…>` played and looped (t = 1.45 s → 0.47 s after wrapping, `paused:false`, no error). The screenshot shows the frame with caption "promo-video".
- **After reload:** the ads were still there (5), media resolved again from IndexedDB, the video played, the PNG thumbnail rendered from `blob:`, and no "ไม่พบไฟล์" fallback appeared.
- **Delete:** deleting the video ad (with confirm) dropped the IndexedDB Blobs from 2 to 1.

### Finding 4 (LOW): title/subtitle resync. Fixed.

`AdCard` now tracks which field has focus. When `ad.title` / `ad.subtitle` changes, it resyncs any field that isn't being edited.

- **Browser check:** tab A had "ตั้งค่าเพิ่มเติม" open, and tab B changed the title to "ชื่อจากแท็บอื่น". Tab A's input then showed "ชื่อจากแท็บอื่น" without a remount.

### Checks after the fixes

- `npm run lint`: 13 errors in the same 6 baseline files. No new errors.
- `npm test`: 187 passed, plus the same 3 pre-existing suite-load failures.
