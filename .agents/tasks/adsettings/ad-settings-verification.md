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
| `npm test` (vitest) | 135 passed, 3 suites fail to load | **177 passed** (+42 new: `adSettings.test.ts` 24, `customerDisplayStore.test.ts` 18), the same 3 pre-existing suite-load failures (engine.test, SyncService.test, branchPermissionStore.test) |
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

Not covered:
- A real video file playing (only the size check was tested; video playback code is `<video autoPlay muted loop playsInline>`).
- A full sale on POS to see the "รายการสินค้า" badge, the payment-cancel reset and the custom success duration end to end. Those code paths are small and type-checked, but I didn't run them in a browser.

## 5. Consumers

- **`WebCustomerDisplayScreen.tsx`**: renders correctly in the `?display=1` window (screenshot checked) and in the new preview. Existing call sites (App.tsx with no props, WebPOSScreen embedded) compile unchanged. WebPOSScreen does not pass `changeAmount`, so it now falls back to `store.changeAmount`, which matches what the banner used before.
- **`WebPOSScreen.tsx`**: compiles. Only the 3 edits in §2 changed. Not run through a full sale in the browser (see §4).
- **`WebDisplayScreen.tsx`**: doesn't use the store, so no change.
- **`sale/CustomerDisplayScreen.tsx`**: compiles. IdleScreen skips disabled ads and its index can't go out of range. The fallback for no ads / master off is unchanged. Not run on a device.
- **`sale/AdManagerScreen.tsx`**: compiles and still uses `addAd`/`removeAd`. New ads have no `enabled` field, which counts as on. Not run on a device.
- **`settings/CustomerDisplaySettingsScreen.tsx`** (also a store user): only uses `addAd`/`removeAd`/`setShopName`/`setMode`, all unchanged.

## 6. Known limitations

- Uploaded files are kept in localStorage per browser (about 5 MB). The page limits images to 1.5 MB, videos to 3 MB and 4 MB in total, and shows a Thai error when storage is full. Uploads are not shared across devices.
- Mobile AdManager is not fully redesigned.
- `WebDisplayScreen` / `SettingDisplaySection` are still mock pages.
- POS badge behaviour change: "รายการสินค้า" now shows while the bill has items.
