# Simpler "โฆษณาจอ 2" settings page with persisted ads and IndexedDB media (pass 2)

The web second-screen ad page is now one auto-saving page. A single "เพิ่มโฆษณา" button opens the file picker and adds each file with defaults (10 วิ, on). Each ad has its own card with an on/off switch, 5/10/15/30 + กำหนดเอง, ▲▼ and drag reorder, an inline delete confirm, and a collapsed "ตั้งค่าเพิ่มเติม". A clickable 4-step explainer drives a live preview built from the real `WebCustomerDisplayScreen`. This pass fixes the earlier MEDIUM finding. Uploaded files now go to IndexedDB, and the persisted store keeps only short `idb:<id>` references. So ad uploads no longer use the localStorage quota that sale history and products depend on. The three LOW findings from pass 1 (POS end-to-end, video playback, title/subtitle resync) are fixed or verified, and the verification doc records browser evidence for each.

Watch for: uploaded media now lives only in this browser's IndexedDB. The native-only screens that render `ad.uri` directly can't show `idb:` refs (likely; they aren't reachable on web today). IndexedDB blobs are deleted only through `removeAd`, so other ways an ad leaves the list can leave orphaned blobs (likely, LOW).

**Verdict**: APPROVED

## High-level view

The page covers the whole plan checklist. Adding is one step because the type is inferred. URL and sample adds sit behind a secondary link, so nothing was lost. Common settings use plain Thai, and shop name and storage usage are under a collapsed "ขั้นสูง". There are no save buttons; a "บันทึกแล้ว" toast confirms each change and is suppressed when the write fails. The page has loading, error and empty states. My spot-check of the four main new files found no hex/rgba colours, raw font sizes or `any`.

Media is stored in two layers. `adMedia.ts` puts Blobs in IndexedDB (`pos-ad-media`) and keeps a per-window object-URL cache. Every web renderer resolves refs through `useAdMediaUri`. The upload path awaits the IndexedDB write before adding the ad and broadcasting it, so an open `?display=1` window can always resolve the ref when the broadcast arrives. If the budget check rejects an ad, its Blob is deleted again. The persisted shape is additive: `enabled?` treats undefined as on, and `migrateCustomerDisplay` covers both `migrate` and `merge`. No earlier persisted blob exists, because the store wasn't persisted before.

The consumers stay correct. Web `AdSlide` and mobile `IdleScreen` play only the active ads, with a safe index. Web video plays from the resolved URL. The POS reads the configurable success duration, resets จอ 2 to idle on payment cancel, and shows the derived "รายการสินค้า" badge. The verification doc now records a full sale run with จอ 2 open. Off-limits files and `dist/` are untouched.

<details>
<summary>Issues (2)</summary>

1. **Native consumers render `idb:` refs raw (LOW)**: `settings/CustomerDisplaySettingsScreen`, `sale/AdManagerScreen` and `sale/CustomerDisplayScreen` pass `ad.uri` straight to `<Image>`. They're only in the native navigators today, so this is a latent trap if they ever run on web. Add a comment or route them through `useAdMediaUri` if web exposure is ever planned.
2. **Orphaned IndexedDB blobs (LOW)**: Blobs are deleted only in `removeAd`. Ads dropped another way (`reorderAds` with a shorter list, `migrateCustomerDisplay` dropping entries, or clearing the localStorage key) leave their Blobs behind. Consider a small sweep on hydration that deletes Blob ids not referenced by `ads`.

</details>

<details>
<summary>Details</summary>

### IndexedDB media references and their reach

The pass-1 risk is gone. In the verification doc's run, the ads store took 944 chars with an MP4 and a PNG uploaded, against about 182K chars of base64 before the fix. `AD_LIMITS.totalChars` now only guards inline `data:` URLs. Those are converted to Blobs on paste anyway, so the budget mostly applies to long http links.

The cost is that `ad.uri` is no longer a URL every renderer can use. The web renderers (`AdSlide`, the `AdCard` thumbnail and the preview) go through `useAdMediaUri`. The three native screens that read the same store do not. The verification doc argues that native builds never create `idb:` refs, and `SaleNavigator`/`SettingsNavigator` are native-only, so this is latent rather than live (likely). On web, a cleared IndexedDB shows "ไม่พบไฟล์ในเครื่องนี้" on the card. On จอ 2 it shows a dark slide, which still plays its full duration in the rotation. That is documented as a known limitation.

Blob cleanup depends on one path. `removeAd` deletes the Blob after it commits the new list. `reorderAds` (kept for mobile callers) and the migrate/merge normalisation can also drop ads without touching IndexedDB. So can a user or another tool clearing `pos-customer-display`. Each case leaves an unreachable Blob that counts against the origin's IndexedDB quota (likely). The quota is generous, so this is LOW.

### Test coverage

There are 52 new tests across `adSettings`, `customerDisplayStore` and `adMedia`. The verification doc records lint at the 13 baseline errors and 187 passing tests, with the same 3 pre-existing suite-load failures. It also has browser evidence for the POS sale flow, video playback, reload persistence and the title/subtitle resync.

Not tested: the `useAdMediaUri` hook itself (only the underlying functions), the orphan cases above, and the native screens on a device (stated explicitly in the doc).

</details>

<details>
<summary>File map</summary>

- `src/screens/web/WebAdSettingsScreen.tsx`: full rewrite. One-step add via IndexedDB, ad cards with resync, step explainer, ขั้นสูง, live preview, toast, states.
- `src/utils/adMedia.ts`: new. IndexedDB Blob store, `idb:` refs, object-URL cache, `useAdMediaUri`, `dataUrlToBlob`.
- `src/store/customerDisplayStore.ts`: `persist` with partialize/migrate/merge, quota-catching wrapper, new fields and actions, index clamping, Blob delete in `removeAd`.
- `src/utils/adSettings.ts`: pure helpers and constants.
- `src/types/customerDisplay.ts`: `AdMedia.enabled?`.
- `src/screens/web/WebCustomerDisplayScreen.tsx`: playable ads, safe index, resolved media and web video, thank-you text, `changeAmount` fallback, preview props.
- `src/screens/web/WebPOSScreen.tsx`: success duration from store, cancel resets to idle, derived `cart` mode.
- `src/screens/sale/CustomerDisplayScreen.tsx`: playable ads with modulo index.
- `src/screens/sale/AdManagerScreen.tsx`: 5/10/15/30 presets, "วินาที", default 10.
- `src/utils/__tests__/adSettings.test.ts`, `src/utils/__tests__/adMedia.test.ts`, `src/store/__tests__/customerDisplayStore.test.ts`: new tests.
- `.agents/tasks/adsettings/ad-settings-verification.md`: evidence, including the pass-2 fixes.

Full diff: `git -C d:\pos-mobile\.worktrees\adsettings diff main...HEAD`.

</details>
