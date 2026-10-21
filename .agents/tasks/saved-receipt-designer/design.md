# Design — Crystal-Reports-style Visual Receipt Designer

## Overview

This design adds a visual, drag-and-drop receipt template designer to the Expo (React Native Web) POS CRM, modeled on Crystal Reports: a physical-size paper canvas with freely positioned, resizable elements (text, bound fields, lines, boxes/frames, logo, QR). It lives on its OWN top-level sidebar menu — `receipt-designer` labeled **"แก้ไขรูปแบบบิล"** — separated from the general **"ตั้งค่าระบบ"** settings menu. The designed template is a SINGLE CENTRAL template: central admin edits one template and every branch/POS/print path renders from it, exactly like the central-pricing model ("แก้ไขที่ส่วนกลาง ทุกสาขาใช้ร่วมกัน").

This REPLACES (option A) the existing block-list reorder/toggle builder (`ReceiptLayoutBuilder` in `WebSimpleScreens.tsx`). The old `ReceiptBlock[]` layout is preserved on disk only long enough to be migrated into canvas elements, so no saved configuration is lost.

A single shared renderer (`buildTemplateHtml`) drives both the live preview in the designer AND the sales/tax-receipt print output, guaranteeing WYSIWYG parity. The designer is web-only (`Platform.OS === 'web'`); on native the screen shows a read-only Thai note, but printing from the saved central template still works.

**Technology stack (locked):** TypeScript + React 18.2 + React Native 0.74.5 + react-native-web 0.19.10 on Expo SDK 51. State via Zustand 4.5 with `persist`. QR via the already-installed `react-native-qrcode-svg` 6.3.2 + `react-native-svg` 15.2.0. Drag/resize via raw DOM pointer events on absolutely-positioned `View`s (react-native-web renders `View` → `div`), **no new dependency**. Colors exclusively from `WebColors` (`src/constants/webColors.ts`); all user-facing text in Thai.

---

## 1. Data model (`src/store/receiptStore.ts`)

### 1.1 New types

Add alongside the existing `ReceiptConfig` (the existing shop-info fields and `ReceiptBlock`/`DEFAULT_LAYOUT`/`mergeLayout` are KEPT — they still feed field values and are needed by the migration):

```ts
export type PaperPresetId = '58mm' | '80mm' | 'A4' | 'A5' | 'custom';

/** ขนาดกระดาษเป็น "มิลลิเมตร" — ความกว้างคงที่, ความสูงอาจเป็น auto (ม้วนความร้อน) */
export interface PaperSpec {
  preset: PaperPresetId;
  widthMm: number;              // 58 | 80 | 210 | 148 | custom
  heightMm: number | null;      // null = auto (thermal roll); A4/A5/custom = fixed
  marginMm: number;             // ขอบกระดาษ (default 4 สำหรับ thermal — ดู §2.1 / finding 10)
}

export type ReceiptElementType = 'text' | 'field' | 'line' | 'box' | 'image' | 'qr';

/**
 * ฟิลด์ที่ผูกข้อมูลได้ — ค่าเหล่านี้มาจาก ReceiptConfig + ข้อมูลบิลจริง (ReceiptRenderData)
 * คีย์ทุกตัวต้องมีแหล่งข้อมูลจริงจาก POS (ดู §2.2) — ถ้าไม่มีแหล่งจริง ห้ามเพิ่มเป็นฟิลด์ผูกข้อมูล
 */
export type ReceiptFieldKey =
  // ข้อมูลร้าน (จาก ReceiptConfig)
  | 'shopName' | 'shopAddr' | 'shopTel' | 'shopTaxId' | 'shopBranch' | 'posRegNo'
  | 'headerText' | 'footerText'
  // ข้อมูลเอกสาร/บิล (จากบิลจริง)
  | 'docTitle'                                // ชื่อเอกสาร: ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ / ใบกำกับภาษี
  | 'billNo' | 'dateTime' | 'cashier' | 'payMethod'
  | 'items'                                   // บล็อกรายการสินค้า (ขยายอัตโนมัติ, หลายคอลัมน์)
  // ข้อมูลผู้ซื้อ (ใบกำกับภาษีเต็มรูป — ว่างเมื่อไม่มี)
  | 'buyerName' | 'buyerAddr' | 'buyerTaxId' | 'buyerBranch'
  // ยอดเงิน (คำนวณมาแล้วจากชั้น POS — ดู §2.2)
  | 'subtotal' | 'discount' | 'preVatAmount' | 'vat' | 'total'
  // ข้อความ/สถานะ
  | 'cancelReason'
  // สื่อ
  | 'logo' | 'qr';
```

> **Finding 1 / 6 / 8 resolution — field set is driven by the real POS invoice, not invented.**
> The old design listed `received`/`change`; **both are REMOVED** — `printReceipt80mm` has no cash-tendered data and does not track it (verified: `WebPOSScreen.tsx` `printReceipt80mm` signature takes `subtotal/discount/vat/grand`, no `received`/`change`). Keeping dead fields would let an admin place a payment row that renders empty in every real print. The old `payment` block therefore does NOT migrate to `received`/`change` (see §1.5).
> Conversely, fields the current tax receipt *does* print are ADDED as first-class keys so the refactor loses no data: `docTitle`, `cashier`, `payMethod`, `buyerName/buyerAddr/buyerTaxId/buyerBranch`, `preVatAmount` (มูลค่าก่อน VAT), `cancelReason`. The **member-info block** (สมาชิก/คะแนน/wallet) is explicitly DROPPED from the central template and declared Out of Scope (§11, finding 6 option b) — it is per-transaction loyalty data, not a layout concern, and modeling it as placed fields with no conditional logic would print a half-empty member box on every non-member sale.

```ts
export type ElementAlign = 'left' | 'center' | 'right';

export interface ReceiptElementStyle {
  fontSize: number;             // px @96dpi ที่ zoom=1 (ดู mm→px math §2.1)
  bold: boolean;
  italic?: boolean;
  align: ElementAlign;
  border: boolean;              // กรอบรอบ element (text/box/field)
  borderWidthMm: number;        // ใช้เมื่อ border=true หรือ type line/box
  color?: string;               // default WebColors.text; UI เลือกจาก token เท่านั้น
}

export interface ReceiptElement {
  id: string;                   // สร้างด้วย genId() (self-rolled, ไม่มี nanoid ใน deps)
  type: ReceiptElementType;
  xMm: number;                  // ตำแหน่งซ้าย (มม.) เทียบขอบในของกระดาษ
  yMm: number;                  // ตำแหน่งบน (มม.)
  wMm: number;                  // ความกว้าง (มม.)
  hMm: number;                  // ความสูง (มม.)
  z: number;                    // ลำดับชั้น (วาดจากน้อยไปมาก)
  style: ReceiptElementStyle;
  text?: string;                // type 'text': ข้อความอิสระ (ว่าง = กล่องกรอบเปล่า)
  field?: ReceiptFieldKey;      // type 'field'/'image'/'qr': คีย์ที่ผูก
}

export interface ReceiptTemplate {
  version: 1;                   // schema version ของตัว template เอง
  paper: PaperSpec;
  elements: ReceiptElement[];
}
```

`ReceiptConfig` gains ONE field: `template?: ReceiptTemplate`. Everything else on `ReceiptConfig` stays. `paperSize` is retained for backward compatibility and seeds the migration default, but the template's `paper` becomes authoritative once a template exists.

### 1.2 Element units — why millimeters

All geometry is stored in **millimeters**, not pixels. Reason: the canvas must render at physical paper size and the print output must match exactly; mm is the one unit shared by screen rendering (`mm → px`) and `@page size` (mm). Storing px would couple the saved template to one zoom level and break print parity. The renderer converts mm→px once, from a single constant.

### 1.3 Defaults

```ts
// marginMm default is 4 for thermal so content width ≈ widthMm - 2*margin stays ~72mm on 80mm
// paper, matching today's legacy 72mm body width (finding 10).
export const DEFAULT_PAPER: PaperSpec = { preset: '80mm', widthMm: 80, heightMm: null, marginMm: 4 };

export const PAPER_PRESETS: Record<Exclude<PaperPresetId,'custom'>, PaperSpec> = {
  '58mm': { preset: '58mm', widthMm: 58,  heightMm: null, marginMm: 4 },  // content ≈ 50mm
  '80mm': { preset: '80mm', widthMm: 80,  heightMm: null, marginMm: 4 },  // content ≈ 72mm
  'A4':   { preset: 'A4',   widthMm: 210, heightMm: 297,  marginMm: 10 },
  'A5':   { preset: 'A5',   widthMm: 148, heightMm: 210,  marginMm: 8 },
};
```

`DEFAULT_TEMPLATE` is produced by running the migration against `DEFAULT_LAYOUT` (see §1.5), so a fresh install and a migrated install share identical seeding logic.

### 1.4 Store actions

The old block-layout setters (`setLayout`, `reorderLayout`, `toggleBlock`, `setBlockAlign`) are **REMOVED from `ReceiptStoreState`**. New template actions are ADDED:

```ts
setTemplate:   (t: ReceiptTemplate) => void;           // replace whole template (save from designer)
setPaper:      (p: PaperSpec) => void;
addElement:    (el: Omit<ReceiptElement,'id'|'z'>) => string;  // returns new id
updateElement: (id: string, patch: Partial<ReceiptElement>) => void;
moveElement:   (id: string, xMm: number, yMm: number) => void; // drag (snap applied by caller)
resizeElement: (id: string, wMm: number, hMm: number) => void; // resize
removeElement: (id: string) => void;
duplicateElement: (id: string) => string;              // offset +2mm/+2mm, new id
```

> **Finding 4 resolution — verified caller inventory for the removed setters.** A grep across the worktree shows the ONLY callers of `setLayout` / `reorderLayout` / `toggleBlock` / `setBlockAlign` are:
> 1. `src/screens/web/WebSimpleScreens.tsx` — `SettingReceiptScreen` (selectors at lines 2089–2091: `reorderLayout`, `toggleBlock`, `setBlockAlign`) and the `ReceiptLayoutBuilder` usage. These are deleted in §8.
> 2. `src/store/__tests__/receiptStore.test.ts` — the "setters" describe block + the `beforeEach` `setLayout(...)` reset. These are edited in §8 (finding 3).
> No other file references them (POS uses its own `printReceipt80mm` and never imports the setters). The store-interface change, the `WebSimpleScreens.tsx` edit, and the test edit ship in **one commit**, gated on `npm run typecheck` + `vitest run` (§7). There is no self-inconsistent interim: the setters and their callers disappear together.

`mergeLayout` and `DEFAULT_LAYOUT` are KEPT (the migration consumes them); only the four setters leave the public store interface.

Invariant ownership: the STORE owns id uniqueness and `z` assignment (monotonic counter from `max(z)+1`); it clamps `wMm/hMm` to a 2mm floor and clamps `xMm/yMm ≥ 0`. The DESIGNER UI owns snap-to-grid rounding and clamping to paper bounds (it knows the live paper size); it passes already-snapped values to `moveElement`/`resizeElement`. Rationale: snap is a view concern tied to the rendered grid, while structural integrity (ids, z, non-negative/min-size) must hold regardless of which caller mutates — including the migration and future callers.

### 1.5 MANDATORY migration (block-list → canvas elements)

The store currently uses a `merge` function with `version: 1` (no `migrate`). The migration is a pure function `migrateLayoutToTemplate(saved)` living in `receiptStore.ts`, unit-tested directly.

Mapping of each `ReceiptBlockId` → `ReceiptElement`:

| Block | Element | Notes |
|---|---|---|
| `logo` | `image`, field `logo` | row 22mm |
| `shopName` | `field` `shopName` | fontSize 14 bold |
| `shopAddr` | `field` `shopAddr` | fontSize 11 |
| `shopTel` | `field` `shopTel` | fontSize 11 |
| `taxId` | `field` `shopTaxId` | fontSize 11 |
| `headerText` | `field` `headerText` | italic |
| `billInfo` | two `field` elements (`billNo`, `dateTime`) | stacked |
| `items` | `field` `items` | row 30mm (expandable) |
| `totals` | `field` `total` | bold |
| `payment` | **DROPPED — no element emitted** | POS has no received/change data (findings 1 & 8); omitting it is lossless because the old payment row only ever showed mock preview numbers, never real print values |
| `footerText` | `field` `footerText` | |
| `branchInfo` | `field` `shopBranch` | fontSize 10 |

Stacking: keep only `visible !== false` blocks in saved order; start `y = marginMm`, `x = marginMm`, `w = widthMm - 2*marginMm`; each block advances `y` by its `rowH` (logo 22, items 30, single-line text 6, totals 8). Carry `block.align` into `style.align`. `paper` seeded from `config.paperSize` (`'58mm'|'80mm'|'A4'` → preset; anything else → `DEFAULT_PAPER`). Garbage/undefined input → `DEFAULT_TEMPLATE` (reuses `mergeLayout`'s existing tolerance).

**Persist `migrate`/`merge` interaction (finding 7):**

1. Bump persist `version` from `1` → `2`.
2. Add a `migrate(persisted, fromVersion)` that, for `fromVersion < 2`, returns the blob with `config.template = migrateLayoutToTemplate(config)`. Zustand runs `migrate` ONLY when the stored version is lower than the persisted version.
3. The existing `merge` is extended to be **idempotent** and to key its migration decision **solely on `config.template` well-formedness** (`template?.version === 1 && Array.isArray(template.elements)`):
   - if `config.template` is well-formed → keep it untouched (so running after `migrate`, or a second time, is a no-op — the idempotency guarantee);
   - else → `config.template = migrateLayoutToTemplate(config)`.
   This makes `merge` safe whether or not `migrate` already ran (handles the case of a fresh v1-less blob that never triggers `migrate`).
4. `merge` **still calls `mergeLayout(saved?.layout)`** to keep `config.layout` complete during the transition. **`config.layout` is deliberately RETAINED after migration** — this is a documented, intentional state, not an accident: `mergeLayout`/`DEFAULT_LAYOUT` remain referenced by the migration itself, so dropping `layout` now would complicate the migration. The old `layout` becomes dead data to carry a later `version: 3` cleanup; that cleanup is Out of Scope here (§11).

The migration unit test asserts **idempotency**: running `merge` twice on the same blob yields an identical `template` (deep-equal), and running `merge` on an already-migrated v2 blob does not rebuild the template.

---

## 2. Shared renderer & paper math (`src/utils/receiptTemplate.ts` — NEW)

This new module REPLACES `receiptLayout.ts`'s role for the new template path. `receiptLayout.ts` (and its test) are DELETED together with the old builder, because the block-list model no longer exists after migration. Verified call sites of `buildReceiptHtml`/`getOrderedBlocks`: only `WebSimpleScreens.tsx` (line 21 import) and `receiptLayout.test.ts` — POS does NOT import them (it has its own `printReceipt80mm`).

### 2.1 Paper mm→px math

Single constant: `const PX_PER_MM = 96 / 25.4; // ≈ 3.7795` (CSS reference pixel at 96dpi — the basis for `@page`/`mm` in browsers, so screen preview and print agree).

- Canvas/preview renders each element at `px = mm * PX_PER_MM * zoom`, where `zoom` is a view-only scale (default 1; the designer offers 0.75/1/1.5). Zoom NEVER touches stored mm.
- Print HTML uses mm directly in CSS (`width:${widthMm}mm`, element `left/top/width/height` in `mm`, `@page { size: ${widthMm}mm ${heightMm|'auto'}; margin: 0 }`), so the browser's own mm→device mapping applies — no px rounding in print.
- **`@page` margin is `0` — this is intentional (finding 9).** All paper margin is modeled by `PaperSpec.marginMm` as an element inset (elements start at `x = marginMm`), replacing today's `@page margin: 3mm` / `buildReceiptHtml`'s `4mm`. Mixing zero `@page` margin with an inner `marginMm` keeps a single source of margin truth (the template) and avoids double margins in print.
- **Content width (finding 10):** the legacy `printReceipt80mm` hard-coded a `72mm` body inside `80mm` paper (and `50mm` inside `58mm`). The new renderer uses full `widthMm` minus `2*marginMm`. `marginMm` defaults (§1.3) are chosen as `4` for 58/80mm so effective content width stays ≈72mm (80mm) / ≈50mm (58mm) — print-width parity with today's thermal output is preserved, not a silent regression.
- Paper container: width `widthMm`mm; height `heightMm`mm when fixed (A4/A5/custom) or `auto`/content-driven min-height for thermal rolls (58/80mm). For thermal, container min-height = max element bottom + margin. This matches today's `size: ${paper} auto` behavior.

### 2.2 Renderer contract (the WYSIWYG guarantee)

The contract is defined to match the **real POS invoice shape**, verified against `printReceipt80mm` in `WebPOSScreen.tsx`:

```ts
export interface ReceiptRenderData {
  // ร้าน (จาก ReceiptConfig)
  shopName: string; shopAddr: string; shopTel: string; shopTaxId: string;
  shopBranch: string; posRegNo: string; footerText: string; headerText: string;
  logoUri: string; showLogo: boolean;
  // เอกสาร/บิล
  docTitle: string;                 // 'ใบเสร็จรับเงิน' | 'ใบกำกับภาษีอย่างย่อ' | 'ใบกำกับภาษี'
  billNo: string; dateTime: string; cashier: string; payMethod: string;
  cancelReason: string;             // '' = ไม่ยกเลิก
  // ผู้ซื้อ (ใบกำกับภาษีเต็มรูป; '' เมื่อไม่มี)
  buyerName: string; buyerAddr: string; buyerTaxId: string; buyerBranch: string;
  // รายการสินค้า — ตรงกับ invoice.items จริง (4 คอลัมน์ตัวเลข)
  items: { name: string; qty: number; unitPrice: number; disc: number; lineTotal: number }[];
  // ยอดเงิน — ส่งมาคำนวณสำเร็จแล้วจากชั้น POS (ดูหมายเหตุด้านล่าง)
  subtotal: number; discount: number; preVatAmount: number; vat: number; total: number;
  qrPayload?: string;               // ถ้าว่าง element qr แสดงกรอบว่าง
}
```

> **Finding 1 resolution — items carry the 4 numeric columns the receipt actually prints** (`qty`, `unitPrice`, `disc`, `lineTotal`), not a single ambiguous `price`. The old `{name,qty,price}` collapsed the per-line discount column; this restores it.
>
> **`subtotal` / `discount` / `preVatAmount` / `vat` / `total` are passed ALREADY-COMPUTED by the POS layer.** Today `printReceipt80mm` computes `grandEx = grand/1.07` and `vatAmt = grand - grandEx` *inside* the function; in the refactor that arithmetic MOVES TO THE CALLER in `WebPOSScreen` (the caller builds `ReceiptRenderData` and fills `preVatAmount`/`vat`). The renderer does no math — it only formats and positions. This keeps the renderer a pure, testable formatter and is why no computed/conditional field logic is needed (that remains Out of Scope).

**The shared resolver — a discriminated `ResolvedField` union (finding 1).** A single `string | null` resolver cannot be the shared source of truth because `items` (a list), `logo` (an image), and `qr` (an SVG) are not strings. If each renderer hand-rolled those three, the two renderers would drift — exactly the failure the parity guarantee must prevent. So the ONE shared resolver returns a discriminated union, and BOTH `buildTemplateHtml` and `ReceiptCanvas` `switch` on `kind` with identical branch logic:

```ts
/** ผลลัพธ์การ resolve ของ element หนึ่ง — ตัวเดียวที่ทั้ง preview และ print HTML ใช้ร่วมกัน */
export type ResolvedField =
  | { kind: 'text';  value: string | null }                         // text, field (ข้อความ/ตัวเลข), null/'' = ว่าง
  | { kind: 'items'; rows: ReceiptRenderData['items'] }             // บล็อกรายการสินค้า (ขยายอัตโนมัติ)
  | { kind: 'image'; uri: string | null; show: boolean }           // logo — show=showLogo, uri=logoUri
  | { kind: 'qr';    payload: string | null };                      // qr — payload=qrPayload

/** resolver เดียวที่ใช้ร่วม — เลือก kind ตาม element.type/field แล้วดึงค่าจาก ReceiptRenderData */
export function resolveField(el: ReceiptElement, d: ReceiptRenderData): ResolvedField;

/** helper บาง ๆ สำหรับเคส text/field เท่านั้น (เรียกภายใน resolveField สำหรับ kind:'text') —
 *  คืน null/'' = ว่าง ตาม §2.3; ไม่ใช้กับ items/logo/qr */
export function resolveFieldValue(el: ReceiptElement, d: ReceiptRenderData): string | null;

/** geometry ที่ใช้ร่วมกันของ element (px) — ทั้ง React preview และ HTML อ้างตัวนี้ตัวเดียว */
export function layoutElement(el: ReceiptElement, zoom: number): { leftPx: number; topPx: number; widthPx: number; heightPx: number };

/** HTML ของ print popup ทั้งหน้า — ใช้ทั้ง capture และ POS print (sales/tax receipt).
 *  tpl อาจเป็น undefined (อ่านก่อน hydrate) → coerce เป็น DEFAULT_TEMPLATE ภายใน ไม่ throw (finding 6) */
export function buildTemplateHtml(tpl: ReceiptTemplate | undefined, d: ReceiptRenderData): string;

/** สร้างข้อมูลตัวอย่างสำหรับ live preview ในดีไซเนอร์ (ชื่อร้านจาก config, items จำลอง 5 คอลัมน์) */
export function makeSampleData(config: ReceiptConfig): ReceiptRenderData;
```

`resolveFieldValue(): string | null` is kept but DEMOTED: it is an internal helper for the `kind:'text'` case only (plain text elements and the string-valued field keys), and `resolveField` calls it to fill `{kind:'text', value}`. It is NEVER used directly by either renderer for `items`/`logo`/`qr` — those go through `resolveField`'s own branches. This removes the contradiction in the previous draft where a string resolver was claimed to also drive lists/images/QR.

`buildTemplateHtml` and the React preview both iterate `tpl.elements` sorted by `z`, call the SAME `resolveField`, `switch` on the SAME four `kind`s, and apply the SAME style rules via the SAME `layoutElement` helper. The React preview is a thin wrapper (`<ReceiptCanvas mode="preview" />`) rendering each element as an absolutely-positioned `View`; the HTML builder emits the equivalent absolutely-positioned `<div>`. Both read geometry from mm through `layoutElement`, so they cannot drift. This is the single source of truth the requirement demands.

**Per-`kind` branch logic (identical in both renderers):**
- `kind:'text'` → `value` null/'' → empty (or empty bordered box per §2.3); else the string, styled by `style` (fontSize/bold/align/border).
- `kind:'items'` → auto-stacked list inside the element box, one row per item as a flex row with 5 cells matching today's thermal columns — `name` (flex, left), `qty` (center), `unitPrice` (right), `disc` (right, shows `-` when 0), `lineTotal` (right, bold). Column proportions are fixed within the box (name = remaining space; numeric cells ≈ 24/52/44/56 px-equivalent scaled to element width), mirroring the current `<th width>` values. Simple auto-list, NOT a column-editable grid (Out of Scope §11). Overflow is visible per thermal convention. Empty `rows` → nothing (or empty box if bordered).
- `kind:'image'` → `<img src=uri>` (RNW `<Image>` in preview) when `show && uri`; else empty/empty-box.
- `kind:'qr'` → QR svg (preview via `react-native-qrcode-svg`) / inline SVG or pre-rendered data-URL (print) when `payload` present; else an empty framed box.

### 2.2.1 `ReceiptFieldKey` → `ReceiptRenderData` mapping (finding 2)

One row per field key. "Empty-when" is the rule `resolveField` applies to decide the field is empty (`kind:'text'` → value `null`; others → their own empty branch). The renderer OWNS this rule (§6), so it is specified here, not inferred.

| `ReceiptFieldKey` | source prop(s) on `ReceiptRenderData` | empty-when | `ResolvedField.kind` |
|---|---|---|---|
| `shopName` | `shopName` | `''` | text |
| `shopAddr` | `shopAddr` | `''` | text |
| `shopTel` | `shopTel` | `''` | text |
| `shopTaxId` | `shopTaxId` | `''` | text |
| `shopBranch` | `shopBranch` | `''` | text |
| `posRegNo` | `posRegNo` | `''` | text |
| `headerText` | `headerText` | `''` | text |
| `footerText` | `footerText` | `''` | text |
| `docTitle` | `docTitle` | `''` | text |
| `billNo` | `billNo` | `''` | text |
| `dateTime` | `dateTime` | `''` | text |
| `cashier` | `cashier` | `''` | text |
| `payMethod` | `payMethod` | `''` | text |
| `buyerName` | `buyerName` | `''` (ไม่มีผู้ซื้อ) | text |
| `buyerAddr` | `buyerAddr` | `''` | text |
| `buyerTaxId` | `buyerTaxId` | `''` | text |
| `buyerBranch` | `buyerBranch` | `''` | text |
| `cancelReason` | `cancelReason` | `''` (ไม่ยกเลิก) | text |
| `subtotal` | `subtotal` (number → `money()`) | — (ตัวเลขเสมอ; 0 ก็แสดง) | text |
| `discount` | `discount` (number → `money()`) | — | text |
| `preVatAmount` | `preVatAmount` (number → `money()`) | — | text |
| `vat` | `vat` (number → `money()`) | — | text |
| `total` | `total` (number → `money()`) | — | text |
| `items` | `items[]` | `items.length === 0` | items |
| `logo` | `logoUri` + `showLogo` | `!showLogo \|\| logoUri === ''` | image |
| `qr` | `qrPayload` | `qrPayload` undefined/`''` | qr |

Notes: the three media/list keys (`logo`/`qr`/`items`) are handled by their own `kind`, NOT as plain strings (ties to finding 1). Numeric amount keys are always rendered (even `0.00`) because a zero total is meaningful on a receipt; their elements are hidden by simply not placing them, not by an empty rule. A `text`-type element (free text) ignores `field` entirely and resolves to `{kind:'text', value: el.text ?? ''}`.

### 2.3 Empty / hidden field handling

- A `field` element that `resolveField` reports empty (`kind:'text'` with `value===null`, or `kind:'items'` with no rows, or `image`/`qr` with no source — per the §2.2.1 "empty-when" column) renders as: nothing (no border, no space) IF `style.border === false`; OR an empty bordered box IF `style.border === true` (this is precisely the "กรอบช่องว่างให้ใส่ข้อความ" use case). Identical in preview and print.
- `text` with empty `text` + `border:true` → blank framed box (same intent).
- `showLogo === false` → `logo` element renders empty box (bordered if styled) regardless of `logoUri`.
- A plain `receipt` (not tax) leaves `shopTaxId`-line / buyer / `preVatAmount` / `vat` fields empty — they simply render nothing (or an empty box if bordered). This is how a single central layout serves receipt + tax_short + tax_full WITHOUT conditional logic. The tradeoff is acknowledged in §10.1.

---

## 3. Designer screen (`src/screens/web/WebReceiptDesignerScreen.tsx` — NEW)

Top-level exported `WebReceiptDesignerScreen: React.FC`. Layout, left→right:

1. **Toolbar (top):** paper preset selector (58/80/A4/A5/CUSTOM); when CUSTOM, two numeric inputs width×height (mm) + an auto-height toggle; "เพิ่มองค์ประกอบ" menu (ข้อความ / ฟิลด์ / เส้น / กรอบ / โลโก้ / QR); zoom 0.75×/1×/1.5×; "บันทึกรูปแบบบิล" (primary, red); "ดูตัวอย่าง & พิมพ์" (opens the shared-renderer popup). A Thai note chip: **"รูปแบบบิลกลาง ใช้ร่วมกันทุกสาขา"**.
2. **Canvas (center):** `<ReceiptCanvas mode="edit" />` — a paper-sized surface (mm→px×zoom) with a light 2mm grid background. Elements are absolutely positioned `View`s. Selecting an element shows a selection outline + 8 resize handles (corners/edges). Empty-state when `elements.length === 0`: centered Thai hint "ยังไม่มีองค์ประกอบ — กดปุ่ม 'เพิ่มองค์ประกอบ' เพื่อเริ่มออกแบบ".
3. **Inspector (right panel):** props of the selected element — content (text) OR field binding (dropdown of `ReceiptFieldKey` with Thai labels); numeric x·y·w·h (mm); fontSize, bold, align; border on/off + weight; stroke for line/box; buttons ทำซ้ำ (duplicate) / ลบ (delete). No selection → Thai hint.

### 3.1 Drag / resize interaction (web-only, pointer events)

Because RNW renders to `div`, we attach native pointer handlers in a web guard (RN gesture responder is awkward for pixel-accurate desktop drag):

- `onPointerDown` on the element body → begin MOVE: capture pointer (`setPointerCapture`), record start client X/Y and element xMm/yMm.
- `onPointerMove` → `deltaPx / (PX_PER_MM*zoom)` → new mm, snapped to 2mm grid (`Math.round(v/2)*2`), clamped to paper bounds by the screen, then `moveElement(id, x, y)`.
- Resize handles are small corner `View`s with their own `onPointerDown` → begin RESIZE, same math on `wMm/hMm` (min 2mm enforced by store).
- `onPointerUp`/`lostpointercapture` → end.

All pointer wiring is behind `if (Platform.OS === 'web')`. The props-object cast to the RNW DOM boundary is typed `as any` only at that boundary (documented), not spread through app logic, honoring "no `any` abuse".

### 3.2 Native fallback

`if (Platform.OS !== 'web')` the screen returns a `View` with a Thai read-only note: "การออกแบบรูปแบบบิลใช้งานได้บนเวอร์ชันเว็บเท่านั้น — การพิมพ์จะใช้รูปแบบกลางที่บันทึกไว้" plus a static preview rendered from the saved template (read-only `<ReceiptCanvas mode="preview" />`).

### 3.3 Components

`ReceiptCanvas` (shared edit/preview) lives in `src/components/receipt/ReceiptCanvas.tsx` so the native fallback and the designer both import it. It takes `{ template, data, mode, zoom, selectedId?, onSelect?, onMove?, onResize? }`. `mode==='preview'` disables pointer handlers and selection chrome. This is the React side of the shared renderer; `buildTemplateHtml` is the HTML side; both go through `layoutElement` + `resolveField` (switching on `ResolvedField.kind`).

---

## 4. Shop-info / basic fields & per-branch entry point — decisions

**Decision A: KEEP the shop-info, logo upload, copies, and `taxInvoiceEnabled` fields in the existing Settings → "ตั้งค่าบิล / ใบเสร็จ" screen; MOVE only the visual layout editing (the deleted `ReceiptLayoutBuilder` + the mm canvas + preview/print) into the new `receipt-designer` menu.**

Reasoning: the requirement states visual layout editing MUST live in the new menu, and shop-info are *values* the template binds to (they belong with store/document settings). Splitting values (settings) from layout (designer) matches the central-pricing analogy and avoids duplicating the logo-upload UI. The old `SettingReceiptScreen` keeps Sections 1–3 (หัวบิล / ข้อมูลร้าน / ข้อความบิล) and the save button; it LOSES the "จัดวางบิล" block builder, the block-list preview, and `openPrintPopup`. A small Thai note points users to "แก้ไขรูปแบบบิล" for layout.

**Decision B (finding 2) — remove the per-branch "บิล" entry point.** `WebSimpleScreens.tsx` currently has a per-branch **"บิล"** button in the branch-management list (`onPress={() => setReceiptBranchId(b.id)}`, line 675) that opens `SettingReceiptScreen` scoped to a branch id (early-return at lines 604–605; state declared line 524). Under the central-single-template model this button is a contradiction: it *looks* branch-scoped but would silently edit the one central config. **We REMOVE** the button (lines 672–680), the `receiptBranchId` early-return branch (lines 604–605), and the `receiptBranchId`/`setReceiptBranchId` state (line 524). The general Settings → บิล entry (`subView === 'receipt'`, line 3130) stays as the single place for shop-info values. This matches "central, no per-branch" with no confusing UX regression. (Recommended option a from the review; option b — a read-only branch note — was rejected as unnecessary surface area since central editing already lives in its own menu.)

---

## 5. Navigation, sidebar, permissions, and print paths — file changes

### `src/components/web/WebSidebar.tsx`
`NAV_ITEMS` currently ends `…, settings, superadmin` where `superadmin` is `adminOnly`. Insert the new item **between `settings` and `superadmin`** (finding 11) so the admin-only entry stays last:
```ts
{ route: 'receipt-designer', icon: 'create-outline', label: 'แก้ไขรูปแบบบิล' },
```
Icon `create-outline` (pencil-on-document) reads as "edit layout" and is distinct from `settings-outline`. Extend the `visibleItems` filter's `accessKey` ternary (≈ line 88) to map `'receipt-designer' → 'settings'`, mirroring the existing `suppliers`/`brands` → `products` pattern, so it gates on the settings permission.

### `src/navigation/WebNavigator.tsx`
- `PAGE_NAMES`: add `'receipt-designer': 'แก้ไขรูปแบบบิล'`.
- Import `WebReceiptDesignerScreen`.
- `switch (route)`: add `case 'receipt-designer': return <WebReceiptDesignerScreen />;`.
- **Permission gate (2 spots):** both `navigate()` and the top-level access guard compute an `accessKey`. Extend the existing `['documents','licenses','branches'] → 'settings'` mapping to also include `'receipt-designer'`. Net effect: `receipt-designer` is reachable exactly when the role can access `'settings'`. No new permission key; `rolePermissions.ts` `ALL_SCREENS` gets no new entry — consistent with how `documents`/`licenses`/`branches` already piggy-back on `settings`.

### `src/screens/web/WebSimpleScreens.tsx`
- DELETE `ReceiptLayoutBuilder`, `BLOCK_LABELS`, `ALIGN_OPTIONS`, `PREVIEW_DASH_BEFORE`, `renderPreviewBlock`, `PreviewFields`, the `sampleData: ReceiptSampleData` object (~line 2130), and the block-layout usage in `SettingReceiptScreen` (the "จัดวางบิล" section, Preview section, `openPrintPopup`, Capture section).
- Remove the `reorderLayout`/`toggleBlock`/`setBlockAlign` store selectors (lines 2089–2091). **Line 21 imports (finding 3):** that file has TWO import lines at 21 — `import { useReceiptStore, ReceiptBlockId, ReceiptBlockAlign } from '../../store/receiptStore'` and `import { getOrderedBlocks, buildReceiptHtml, ReceiptSampleData } from '../../utils/receiptLayout'`. DELETE the entire `../../utils/receiptLayout` import (all three names — `getOrderedBlocks`, `buildReceiptHtml`, AND `ReceiptSampleData`, which backs the deleted `sampleData` at ~line 2130) because `receiptLayout.ts` is deleted (§8). From the `receiptStore` import (module KEPT), drop `ReceiptBlockId`/`ReceiptBlockAlign` only if no remaining code references them after the builder deletion (verify — they were used only by the removed `ReceiptLayoutBuilder`/`ALIGN_OPTIONS`); keep `useReceiptStore`.
- Remove the per-branch receipt entry (Decision B): `receiptBranchId` state (L524), its early-return (L604–605), the "บิล" button (L672–680).
- Keep `SettingReceiptScreen` Sections 1–3 + save; add a Thai note linking to the designer menu.

### `src/screens/web/WebPOSScreen.tsx` (print parity — critical)
Refactor `printReceipt80mm` (the **sales/tax receipt**) to:
1. build a `ReceiptRenderData` from the real invoice — map `items` → `{name,qty,unitPrice,disc,lineTotal}` (rename `total`→`lineTotal`); compute `preVatAmount = grand/1.07` and `vat = grand - preVatAmount` HERE (moving today's in-function math to the caller); set `docTitle` from `billType`; fill buyer fields from `invoice.buyerInfo` (or '' ), `cashier`, `payMethod`, `cancelReason`;
2. call `buildTemplateHtml(useReceiptStore.getState().config.template ?? DEFAULT_TEMPLATE, data)` — the `?? DEFAULT_TEMPLATE` coercion guards the rare pre-hydration read where `config.template` is still `undefined` (finding 6); `buildTemplateHtml` ALSO coerces internally (`tpl = tpl ?? DEFAULT_TEMPLATE`) so no caller can hand it `undefined`;
3. retain today's exact popup sequence **verbatim** — `if (!w) return;` null-guard, then `w.document.write(html)` → `w.document.close()` → `w.focus()` → `setTimeout(() => { w.print(); }, 400)` (the 400ms defer lets fonts/layout settle; it is NOT changed — finding 5). The ONLY swap is the HTML source: from the inline string to `buildTemplateHtml(...)`.
The `paperSize` argument is superseded by `template.paper`.

> **Scope of the "single renderer" claim (finding 5 / 6):** `buildTemplateHtml` is the single source of truth for the **sales/tax receipt** only. Two other print paths exist and are explicitly OUT OF SCOPE (§11): (a) the **Wallet top-up slip** (`WebPOSScreen.tsx` ~L3450, its own inline `window.open` HTML — a different document, unchanged); (b) the **Customer Display** window (~L2869, not a receipt). The **member-info block** that today's `printReceipt80mm` prints is dropped from the central template (§1.1) — if it must survive, that is a follow-up, not covered here. The claim is therefore scoped: one renderer for the sales/tax receipt, not "all printed output."

---

## 6. Error handling & validation (concrete)

| Operation | Failure condition | Recoverable? | Caller receives / behavior | Logged |
|---|---|---|---|---|
| Save template (`setTemplate`) | Never throws (pure state set) | n/a | Toast "บันทึกรูปแบบบิลแล้ว ✓" for 2s | no |
| Custom paper input | width/height not a positive number, or width < 20mm / > 400mm, height (if fixed) < 20mm / > 2000mm | yes | Input shows Thai error "ขนาดกระดาษไม่ถูกต้อง (20–400 มม.)"; value not committed; last valid kept | no |
| Element numeric x/y/w/h (inspector) | NaN / negative / w,h < 2mm | yes | Clamp to valid (store floors w,h at 2mm; x,y at 0); field reflects clamped value | no |
| Drag/resize beyond paper | pointer past paper bounds | yes | Screen clamps to `[0, paperW - wMm]` etc. before calling store; no error | no |
| Open print popup | `window.open` returns null (popup blocked) | yes | Return silently (matches existing `printReceipt80mm` null-guard — no alert) | no |
| QR render | `qrPayload` empty/invalid | yes | Renders empty framed box (never throws); no QR drawn | no |
| Logo `<img>` | broken/empty `logoUri` | yes | Empty box (CSS `onerror` hidden); layout unaffected | no |
| Migration (`migrateLayoutToTemplate`) | persisted blob malformed / `saved` undefined | yes (fatal-safe) | Returns `DEFAULT_TEMPLATE`; never throws; existing `mergeLayout` already tolerates garbage | no (silent fallback — matches store's existing defensive merge) |
| Render with missing/undefined `template` (finding 6) | `config.template` read before hydration completes (POS or canvas) | yes (fatal-safe) | `buildTemplateHtml` and the POS caller coerce `config.template ?? DEFAULT_TEMPLATE`; never throws — renders the default central template | no (silent fallback) |

Validation rules for each external input:
- **Paper preset**: enum `PaperPresetId`; unknown → fallback `DEFAULT_PAPER`.
- **Custom width/height (mm)**: required when `preset==='custom'`; numeric; width 20–400, height 20–2000 or null(auto); on failure keep last valid, show inline Thai error.
- **Element text**: optional string; max 500 chars (truncate with Thai note); HTML-escaped in `buildTemplateHtml` (reuse the existing `esc()` approach so injected markup can't break print).
- **Field key**: enum `ReceiptFieldKey`; unknown → element treated as empty.
- **fontSize**: 6–72; clamp.
- **borderWidthMm / stroke**: 0.1–3mm; clamp.

Invariant ownership (restated): store owns id/z/min-size/non-negative; screen owns snap + paper-bounds clamp; renderer owns escaping + empty-field rules. Each invariant has exactly one owning layer.

---

## 7. Testability & verification gate

- **Unit (vitest + happy-dom)** — mirroring the existing `receiptLayout.test.ts`/`receiptStore.test.ts` style (mock `react-native` to `{Platform:{OS:'web'}}`):
  - `migrateLayoutToTemplate`: block list → elements (order preserved, visible-only, correct field mapping, `payment` dropped, align carried, paper seeded, garbage → DEFAULT_TEMPLATE).
  - **Migration idempotency (finding 7):** running `merge` twice yields an identical `template`; `merge` on an already-migrated v2 blob does not rebuild.
  - `resolveField` (the shared union resolver): each `ReceiptFieldKey` resolves to the correct `kind` per the §2.2.1 mapping table; `kind:'text'` empty-when rules (`''` → `value:null`); `kind:'items'` carries 5-column rows; `logo`→`image`, `qr`→`qr`; no `received`/`change` keys exist. Plus the demoted `resolveFieldValue` for the text/field cases only.
  - `buildTemplateHtml`: elements emitted sorted by z; `switch(kind)` branches match the preview's; mm values in `left/top/width/height`; `@page size` matches paper and `margin:0`; empty bordered `kind:'text'` → box with no text; `undefined` template → renders `DEFAULT_TEMPLATE` without throwing (finding 6); malicious text escaped.
  - Store actions: add/update/move/resize/remove/duplicate (id uniqueness, z monotonic, w/h floor, x/y clamp).
  - `layoutElement`: mm→px round-trips within tolerance (the shared helper proving preview↔print can't drift).
- **`src/store/__tests__/receiptStore.test.ts` disposition (finding 4):** KEEP the `mergeLayout`/`DEFAULT_LAYOUT`/persist-key tests and the "DEFAULT layout — 12 blocks in order" test (migration still uses these helpers; `config.layout` is deliberately RETAINED per §1.5, so that test keeps reading `config.layout`). REMOVE the `describe('receiptStore — setters')` block (`reorderLayout`/`toggleBlock`/`setBlockAlign`). The current `beforeEach` resets via the now-removed `setLayout(...)`; replace it with `setConfig`, which spreads into `config` and so can still reset `layout`:
  ```ts
  beforeEach(() => {
    useReceiptStore.getState().setConfig({ layout: DEFAULT_LAYOUT.map(b => ({ ...b })) });
  });
  ```
  `setConfig` is kept on the store and `layout` remains a `ReceiptConfig` field, so this compiles and the retained 12-blocks-in-order assertion still passes. This keeps `vitest run` green after the setter removal.
- **Preview↔print parity:** `layoutElement` is the one shared pure helper used by both `ReceiptCanvas` and `buildTemplateHtml`; testing it once is the structural anti-drift guarantee.
- **Integration / manual (web only):** drag/resize pointer flow, popup print, A4 vs 80mm `@page`. happy-dom lacks real pointer capture, so pointer DOM interaction is manual — called out as a gap.
- **Verification gate (findings 3 & 4):** the store-interface change, the `WebSimpleScreens.tsx` edit, and the `receiptStore.test.ts` edit ship together and must pass `npm run typecheck` AND `vitest run` before the commit is considered done.

New test files: `src/store/__tests__/receiptStore.migration.test.ts`, `src/utils/__tests__/receiptTemplate.test.ts`. Delete `src/utils/__tests__/receiptLayout.test.ts` with its source.

---

## 8. File-by-file change list

| File | Lines (approx) | Change |
|---|---|---|
| `src/store/receiptStore.ts` | — | ADD template types, `DEFAULT_PAPER`, `PAPER_PRESETS`, `genId`, `migrateLayoutToTemplate`, `DEFAULT_TEMPLATE`, `template` field, new actions. **REMOVE** `setLayout`/`reorderLayout`/`toggleBlock`/`setBlockAlign` from `ReceiptStoreState` + impl. Bump persist `version`→2, add idempotent `migrate`, extend `merge` (template-well-formedness keyed, retains `layout`). Keep block types/`mergeLayout`/`DEFAULT_LAYOUT`. |
| `src/utils/receiptTemplate.ts` | NEW | `ReceiptRenderData`, `ResolvedField`, `resolveField`, `resolveFieldValue` (demoted helper), `layoutElement`, `buildTemplateHtml` (coerces `undefined`→`DEFAULT_TEMPLATE`), `makeSampleData`, `PX_PER_MM`. |
| `src/utils/receiptLayout.ts` | — | DELETE (role replaced). |
| `src/utils/__tests__/receiptLayout.test.ts` | — | DELETE. |
| `src/components/receipt/ReceiptCanvas.tsx` | NEW | shared edit/preview canvas (React side of renderer). |
| `src/screens/web/WebReceiptDesignerScreen.tsx` | NEW | toolbar + canvas + inspector; web-only with native read-only fallback. |
| `src/navigation/WebNavigator.tsx` | — | ADD import, `PAGE_NAMES` entry, switch case, `receipt-designer`→`settings` access mapping (navigate + top-level guard = 2 spots). |
| `src/components/web/WebSidebar.tsx` | ~88 | ADD `NAV_ITEMS` entry between `settings` and `superadmin`; extend `accessKey` ternary → `settings`. |
| `src/screens/web/WebSimpleScreens.tsx` | 21, 524, 604–605, 672–680, 2089–2091, 2130, builder/preview/capture sections | REMOVE `ReceiptLayoutBuilder` + block-layout preview/print + `sampleData` object; DELETE the whole `../../utils/receiptLayout` import (`getOrderedBlocks`, `buildReceiptHtml`, **`ReceiptSampleData`** — finding 3); drop now-unused `ReceiptBlockId`/`ReceiptBlockAlign` from the kept `receiptStore` import; remove `reorderLayout`/`toggleBlock`/`setBlockAlign` selectors; REMOVE per-branch "บิล" button, `receiptBranchId` state + early-return (Decision B); keep shop-info/logo/text sections; add Thai note linking to designer. |
| `src/screens/web/WebPOSScreen.tsx` | ~378–530 | REFACTOR `printReceipt80mm` → build `ReceiptRenderData` (compute preVat/vat in caller) and render via `buildTemplateHtml(config.template, data)`. Wallet slip (~L3450) & Customer Display (~L2869) UNCHANGED. |
| `src/store/__tests__/receiptStore.test.ts` | — | REMOVE `setters` describe block; change `beforeEach` to `setConfig({ layout: DEFAULT_LAYOUT.map(b => ({ ...b })) })` (finding 4); KEEP mergeLayout/DEFAULT_LAYOUT/persist + 12-blocks tests. |
| `src/store/__tests__/receiptStore.migration.test.ts`, `src/utils/__tests__/receiptTemplate.test.ts` | NEW | migration (incl. idempotency) + renderer tests. |

---

## 9. Dependencies

No new dependency. `react-native-svg` 15.2.0 and `react-native-qrcode-svg` 6.3.2 are already in `package.json` and are the expected QR/vector primitives; both ship in this project and are compatible with Expo SDK 51 / RN 0.74.5 / RNW 0.19. `genId()` is self-rolled (no `nanoid` in deps). Drag/resize uses raw DOM pointer events on RNW-rendered divs — deliberately avoiding a heavy canvas/DnD library per the directive. For print, QR is emitted as inline SVG (or a pre-rendered data-URL from the same svg) so the popup needs no runtime JS.

---

## 10. Risks & unverified assumptions

1. **Single central layout for receipt + tax_short + tax_full (highest risk):** the template has no conditional/computed fields (Out of Scope). Tax-only lines (VAT, pre-VAT, buyer block) are expressed as placed elements that resolve EMPTY (render nothing per §2.3) on a plain receipt. ASSUMPTION: the business accepts one central layout where tax fields self-suppress when empty, rather than three distinct layouts. If false, `printReceipt80mm` would need a thin `billType` wrapper feeding the renderer — a follow-up. The **member-info block is dropped** from the central template (§1.1); if it must survive, that is also a follow-up.
2. **Pointer-event drag on react-native-web:** assumes RNW forwards `onPointerDown/Move/Up` and `setPointerCapture` works on the rendered div (true for current RNW, but NOT exercised anywhere in this repo). Fallback: attach listeners via a `ref` to the DOM node in a web-guarded `useEffect`. Not verified at runtime.
3. **Thermal auto-height print:** `@page { size: 80mm auto }` for roll printers — assumed supported; the existing code already uses `size: ${paper} auto`, so no regression vs today.
4. **mm→px fidelity:** `PX_PER_MM = 96/25.4` matches browser CSS mm; actual thermal dot pitch may differ. Preview is a design aid; authoritative output uses CSS mm in `@page`, so printer-side scaling is the browser/driver's job (same as today).
5. **Persist migration ordering (resolved, not just assumed):** `migrate` runs on version<2, then `merge` fills defaults; `merge` is idempotent and keyed solely on `template` well-formedness, so double-processing is impossible (§1.5). Covered by an idempotency unit test.
6. **Single central template:** no per-branch/tenant key, and the per-branch "บิล" entry point is removed (Decision B) — fully matches the "one central template, all branches" requirement.

---

## 11. Out of scope (stated, not designed)

Per-branch template assignment (and the removed per-branch "บิล" entry point); formula/computed/conditional fields; multi-section report bands; multi-page pagination; a hand-drawn column-editable items *table* (the `items` field is a simple auto-stacked 5-column list); mobile-native drag/resize (native shows read-only preview only); the **Wallet top-up slip** print path (`WebPOSScreen.tsx` ~L3450) and the **Customer Display** window (~L2869) — separate documents, unchanged; the **member-info block** on the receipt (dropped from the central template); a later `version: 3` persist cleanup that drops the now-dead `config.layout`.

---

## Responses to design-review findings (round 2)

- **#1 (MEDIUM) — `resolveFieldValue: string | null` contradicts items/logo/qr — ADDRESSED.** §2.2 now defines a discriminated `ResolvedField` union (`kind:'text'|'items'|'image'|'qr'`) returned by ONE shared `resolveField()` that BOTH `buildTemplateHtml` and `ReceiptCanvas` switch on with identical per-`kind` branch logic (spelled out as four bullets). `resolveFieldValue(): string|null` is retained but explicitly DEMOTED to an internal helper for the `kind:'text'` case only, never driving items/logo/qr. The parity claim is now honest.
- **#2 (MEDIUM) — ReceiptFieldKey → ReceiptRenderData mapping missing — ADDRESSED.** Added §2.2.1: a full per-key table (`key | source prop(s) | empty-when | ResolvedField.kind`) covering all ~26 keys, including the non-1:1 ones — `logo`→`logoUri`+`showLogo` (`image`), `qr`→`qrPayload` (`qr`), `items`→`items[]` (`items`) — and the empty-string-vs-null convention. Numeric amount keys documented as always-rendered.
- **#3 (NIT) — `ReceiptSampleData` import removal omitted — ADDRESSED.** §5 and §8 now delete the ENTIRE `../../utils/receiptLayout` import (`getOrderedBlocks`, `buildReceiptHtml`, AND `ReceiptSampleData`) plus the `sampleData` object at ~line 2130; clarified `ReceiptBlockId`/`ReceiptBlockAlign` come from the kept `receiptStore` module (only their usage is removed).
- **#4 (NIT) — `beforeEach` reset underspecified — ADDRESSED.** §7 now gives the exact replacement `beforeEach(() => useReceiptStore.getState().setConfig({ layout: DEFAULT_LAYOUT.map(b => ({ ...b })) }))` and confirms the retained "12 blocks in order" test still reads `config.layout` (layout retained per §1.5). §8 table updated.
- **#5 (NIT) — POS print 400ms defer glossed over — ADDRESSED.** §5 step 3 now states the refactor retains the `document.write` → `document.close` → `focus` → `setTimeout(() => { w.print(); }, 400)` sequence verbatim (verified in source), swapping ONLY the HTML source to `buildTemplateHtml(...)`.
- **#6 (NIT) — no fallback for undefined `config.template` at render — ADDRESSED.** Added an error-table row (§6); `buildTemplateHtml` signature now takes `ReceiptTemplate | undefined` and coerces `?? DEFAULT_TEMPLATE` internally, and the POS caller also coerces (§5 step 2). Never throws.

## Responses to design-review findings (round 1)

- **#1 (HIGH) — ReceiptRenderData vs real invoice — ADDRESSED.** `items` redefined to `{name,qty,unitPrice,disc,lineTotal}` with a specified 5-column in-box layout (§2.2). `received`/`change` REMOVED from `ReceiptFieldKey`, `ReceiptRenderData`, and the `payment` migration (POS has no tendered data). `subtotal`/`discount`/`preVatAmount`/`vat` stated as passed pre-computed; the `grand/1.07` math moves to the POS caller.
- **#2 (HIGH) — per-branch "บิล" entry point — ADDRESSED.** Decision B (§4): remove the button (L672–680), the `receiptBranchId` early-return (L604–605), and the state (L524). Added to §8 with exact lines.
- **#3 (HIGH) — receiptStore.test.ts breakage — ADDRESSED.** §7 + §8 disposition: keep mergeLayout/DEFAULT_LAYOUT/persist tests, remove the setter tests, change the `beforeEach` reset; suite stays green.
- **#4 (HIGH) — setter caller inventory / interim consistency — ADDRESSED.** §1.4 lists the verified callers (WebSimpleScreens `SettingReceiptScreen` + receiptStore.test.ts) and ships store+UI+test in one commit gated on typecheck + vitest run (§7).
- **#5 (MEDIUM) — "one source of truth" overstated / Wallet slip — ADDRESSED.** Claim scoped to the sales/tax receipt (§5); Wallet top-up slip and Customer Display added to §11 Out of Scope.
- **#6 (MEDIUM) — tax-invoice fields lost — ADDRESSED.** `ReceiptFieldKey`/`ReceiptRenderData` extended with `docTitle`, `cashier`, `payMethod`, `buyerName/Addr/TaxId/Branch`, `preVatAmount`, `cancelReason` (resolve empty when absent). Member block explicitly dropped and declared Out of Scope (option b), with the single-renderer claim scoped accordingly.
- **#7 (MEDIUM) — migrate/merge interaction + stale layout — ADDRESSED.** §1.5: `merge` keyed solely on `template` well-formedness (idempotent); `config.layout` retention made a deliberate documented state with a later `version:3` cleanup noted; idempotency unit test added (§7).
- **#8 (MEDIUM) — received/change + payment migration inconsistency — ADDRESSED.** Resolved with #1: fields removed, `payment` block drops (emits no element), lossless because old payment row only showed mock preview values.
- **#9 (NIT) — @page margin:0 intent — ADDRESSED.** §2.1 states `@page margin` is 0 and all paper margin is modeled by `PaperSpec.marginMm` as element inset, replacing today's 3mm/4mm.
- **#10 (NIT) — legacy 72mm inset — ADDRESSED.** §2.1 + §1.3: content width = `widthMm - 2*marginMm`; `marginMm` default 4 for 58/80mm keeps content ≈72mm/≈50mm for print-width parity.
- **#11 (NIT) — sidebar ordering — ADDRESSED.** §5: item inserted between `settings` and `superadmin`; `accessKey` ternary extended → `settings` (mirrors suppliers/brands → products).
