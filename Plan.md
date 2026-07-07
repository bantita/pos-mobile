# Plan: Feature-Driven Clean Architecture Migration

> Updated by Squirrel on 2026-07-03

## Goal

Refactor the Expo SDK 57 POS app into a Feature-Driven Clean Architecture while preserving existing behavior, improving the responsive mobile shell, and keeping the web app design intact except for typography balance.

## Architecture

**Stack:** Expo SDK 57, Expo Router 57, React Native 0.86, React 19.2.3, TypeScript 6, NativeWind 4, Zustand.

**Source layout:**

- `src/app`: Expo Router entrypoints only.
- `src/features/<feature>/domain`: feature entities, contracts, and type models.
- `src/features/<feature>/application`: feature stores, state orchestration, and app logic.
- `src/features/<feature>/data`: API clients and mock data for that feature.
- `src/features/<feature>/presentation`: screens, components, and navigation for that feature.
- `src/shared`: cross-feature UI, hooks, constants, config, infrastructure, icons, and utilities.
- `src/core/pos-engine`: shared calculation and promotion engine with tests.

## Task Breakdown

- [x] Audit project structure, Expo SDK 57 compatibility, scripts, tests, and existing lint state.
- [x] Move source files from layer-based folders (`screens`, `stores`, `types`, `services`, `components`, `utils`, `engine`) into feature/domain/application/data/presentation boundaries.
- [x] Rewrite imports to the new architecture aliases and remove stale root-level source imports.
- [x] Update icon audit and test scripts for new `shared` and `core` paths.
- [x] Refresh mobile app shell with safe-area-aware tab bar sizing, compact icon-only mode, keyboard-aware tab hiding, and larger touch targets.
- [x] Balance web typography through global font sizing without redesigning web page layouts.
- [x] Align shared UI controls with tighter app-style radii and consistent touch heights.
- [x] Verify with tests, TypeScript, lint, and Expo web export.
- [x] Improve cross-platform shell stability: web drawer sidebar now shows labels on mobile, desktop sidebar auto-expands on wide screens, overlay drawer closes reliably, top bar touch targets are larger, and native bottom tabs use icon-only compact mode earlier to prevent Thai labels from colliding.
- [x] Remove 106 re-export-only `.screen.tsx` wrapper files and point navigation imports directly at implementation screens. Remaining `.screen.tsx` files contain real screen logic.

## Verification

- `npm test`: passed, 39/39 engine and icon checks.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 241 warnings, all non-blocking and mostly pre-existing unused variables / hook dependency warnings.
- `npm run export:web`: passed, exported to `dist`.

## Known Follow-Up

- Lint still reports warnings across legacy screens and stores. They do not block build, but the next cleanup pass should remove unused variables, replace remaining `require()` calls where practical, and tighten hook dependency arrays.
- Remaining `.screen.tsx` files have been renamed to PascalCase `.tsx` and the `.screen` prefix is now eliminated across the project.

## Task Breakdown — Native-First Responsive POS Polish (2026-07-03)

- [x] Audit Expo SDK 57 docs, package compatibility, native sale flow, responsive layout risks, and current lint/test state.
- [x] Replace fixed `Dimensions.get()` sizing in native `POSSaleScreen` with `useWindowDimensions` and safe-area-aware bottom actions.
- [x] Rework mobile sale header into compact rows with horizontally scrollable quick actions so phone widths do not crush labels.
- [x] Add tablet-native selling workflow with persistent bill/cart rail, inline quantity controls, and checkout CTA to reduce screen switching.
- [x] Honor configured split-view scanner on landscape tablets while keeping phone UX as a simple grid/scan toggle.
- [x] Add Reanimated entrance/layout feedback, scan feedback fade, and grid skeleton loading state so native and web feel less static.
- [x] Fix quick-add logic to use the cart store quantity contract instead of generating fake product ids.
- [x] Add missing SDK-compatible `expo-file-system` dependency used by report export.
- [x] Fix Expo Doctor icon schema issue by padding app icon and adaptive foreground artwork to square dimensions without cropping.
- [x] Fix lint error in shared NativeWind switch wrapper by assigning a display name.

### Verification result

- `npm test`: passed, 39/39 engine and audit checks.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 223 legacy warnings and no errors.
- `npm run export:web`: passed and generated `dist`.
- `npm run doctor`: passed 20/20 checks.
- `depcheck`: no missing dependency remains; still reports probable-unused Expo/config dependencies that require build-profile confirmation before removal.
- `npm audit`: 12 moderate advisories in Expo transitive packages; suggested fixes would downgrade/major-change Expo packages and should not be applied blindly to SDK 57.

## Task Breakdown — Responsive UX/UI Overhaul (2026-07-03)

- [x] 🟢 Audit Expo SDK 57 compatibility, current navigation shell, typography setup, responsive breakpoints, tests, and existing uncommitted work.
- [x] 🟢 Remove the web POS invalid text child that triggers `Unexpected text node` and verify the close-shift flow against the browser console.
- [x] 🟡 Rework the web top bar and sidebar into a consistent responsive application shell with compact desktop, tablet, and drawer states.
- [x] 🔴 Recompose `POSScreen` for desktop/tablet/mobile selling workflows while preserving cart, shift, discount, invoice, and payment behavior.
- [x] 🟡 Refresh dashboard, products, reports, and settings surfaces with shared spacing, hierarchy, cards, filters, and mobile-safe layouts.
- [x] 🟡 Make Sarabun weights deterministic on web, Android, and iOS using Expo SDK 57 runtime loading, native config-plugin embedding, and explicit weight mapping.
- [x] 🟡 Verify tests, TypeScript, lint, Expo Doctor, web export, browser console, and representative responsive breakpoints.

### Files expected to change

- `src/features/web/presentation/components/Layout.tsx`
- `src/features/web/presentation/components/Sidebar.tsx`
- `src/features/web/presentation/components/TopBar.tsx`
- `src/features/web/presentation/screens/POSScreen.tsx`
- Selected high-traffic web screens where shared shell styling is insufficient
- `src/shared/lib/font.ts`, `src/shared/tw/index.tsx`, `src/global.css`, and `src/app/_layout.tsx`
- `Plan.md` and focused source checks/scripts if needed

### Risks and done criteria

- Preserve all POS calculations and modal workflows; this pass changes presentation and layout, not business rules.
- Do not overwrite the six pre-existing modified mobile sale/inventory/shared UI files.
- Done means the POS flow renders without invalid text-child warnings, remains usable at phone/tablet/desktop widths, Sarabun renders with correct weights on web/native, and all project verification commands pass or any pre-existing warning is documented.

### Verification result

- `npm test`: passed, 39/39 checks.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 232 non-blocking legacy warnings and no errors; focused lint on changed files also has no errors.
- `npm run export:web`: passed and generated `dist`.
- Browser verification: passed at 390×844, 820×1024, and desktop; the close-shift modal added no new invalid text-node log.
- `npm run doctor`: 19/20 checks passed. The remaining pre-existing packaging issue is that `assets/app-icon.png` and `assets/adaptive-foreground.png` are 471×529 instead of square; brand artwork was left unchanged because cropping/replacing it is outside this UI task.

## Task Breakdown — Prefix Cleanup and Full UI System (2026-07-03)

- [x] 🟢 Inventory all screen files, platform prefixes, exported symbols, import paths, collision risks, navigation shells, and shared-component adoption.
- [x] 🟡 Rename all 37 `Web*` TypeScript/TSX modules to context-based names and update every import/export/reference without compatibility wrappers.
- [x] 🟡 Replace `webColors`/`WebColors` with the platform-neutral `palette`/`Palette` name and remove the unused web badge module.
- [x] 🔴 Rebuild the shared color, typography, radius, shadow, input, card, modal, table, empty-state, and responsive screen primitives so all 112 screens inherit the same visual system.
- [x] 🔴 Refresh mobile navigation stacks/tabs and web navigation surfaces for consistent hierarchy, safe areas, touch targets, responsive widths, and loading/empty/error states.
- [x] 🟡 Apply the new screen surface and spacing rules across auth, dashboard, sale, product, inventory, member, promotion, purchase, reports, settings, sync, kiosk, and web features without changing business behavior.
- [x] 🟡 Add repository checks preventing the removed `Web` filename/export prefix from returning.
- [x] 🟡 Verify renamed modules, tests, TypeScript, lint, Expo Doctor, production web export, and representative web/mobile visual flows.

### Naming contract

- Platform or folder context belongs in the path, not the basename: `features/web/.../DashboardScreen.tsx`, not `DashboardScreen.tsx`.
- Keep domain terms that disambiguate behavior (`POS`, `CustomerDisplay`, `Kiosk`, `OTP`, `CRM`).
- Keep the existing PascalCase file convention because the repository explicitly migrated to it; this task removes redundant prefixes rather than introducing a second naming migration.
- No re-export wrappers for old names: stale imports must fail during typecheck instead of preserving duplicate naming.

### Risk controls and done criteria

- Check target paths before every rename and stop on any collision.
- Preserve the existing modified mobile sale/inventory/shared-button work and avoid mechanical style rewrites inside its business logic.
- Done means no source basename or exported declaration starts with redundant `Web`, every screen receives the refreshed system through shared tokens/navigation/surfaces, and build/runtime checks pass with only documented pre-existing issues.

### Verification result

- Naming audit passes: no source filename or declaration begins with redundant `Web`.
- Font audit passes: presentation code no longer imports raw `Text` or `TextInput` from React Native; browser computed styles report `Sarabun` at weights 600, 700, and 800, and public TTF assets return HTTP 200.
- `npm test`: passed, 39/39 engine checks plus icon and naming audits.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 233 non-blocking legacy warnings and no errors.
- `npm run export:web`: passed and generated `dist`.
- Browser smoke test: login and responsive dashboard render successfully with no invalid text-child error.
- Expo Doctor: 19/20 checks passed; the existing 471×529 non-square app icon and Android adaptive foreground remain the only packaging issue.
