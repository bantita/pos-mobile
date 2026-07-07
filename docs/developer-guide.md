# Developer Guide

## Requirements

- Node.js 22.13.x or newer compatible Node 22
- npm
- Expo SDK 57
- EAS CLI for cloud mobile builds

## Install

```bash
npm ci
```

## Run Locally

```bash
npm start
npm run start:web
```

Use `--clear` only when Metro cache is stale:

```bash
npm run start:web:clear
```

## Verification

```bash
npm run health:compiler
npm run verify
npm run export:web
```

`npm run verify` runs:

- icon mapping audit
- promotion engine tests
- TypeScript typecheck
- Expo lint
- Expo Doctor

## React Compiler

React Compiler is enabled in `app.json`:

```json
{
  "expo": {
    "experiments": {
      "reactCompiler": true
    }
  }
}
```

The project also installs `babel-plugin-react-compiler@beta` so CI and EAS builds use the same compiler setup.

Healthcheck:

```bash
npm run health:compiler
```

Latest local result: 282/282 components compiled, no incompatible libraries reported.

## Styling Rules

- Prefer Tailwind default colors over custom tokens.
- New UI should use classes like `bg-slate-50`, `text-slate-900`, `bg-rose-500`, `text-emerald-600`.
- Use `rose-500` as the main action color.
- Do not add `brand-*`, `pos-*`, custom color tokens, or arbitrary hex color utilities.
- Keep layout responsive with flex/grid constraints and explicit icon/logo dimensions.

## Typography

Sarabun is the default application font on Web, iOS, and Android. Font files and their license are stored in `assets/fonts`.

- `expo-font` embeds weights 400, 500, 600, 700, and 800 in native builds.
- `app/_layout.tsx` loads the same files for Web and Expo Go via `useFonts`.
- NativeWind `font-sans` resolves to `Sarabun`.

## Offline Storage

The app uses Zustand persist with `expo-sqlite/kv-store` on Web, iOS, and Android.

Data flow:

1. Zustand keeps active state in memory.
2. Zustand persist serializes each store to JSON.
3. `persistStorage` writes the JSON value into the device SQLite database.
4. The same adapter rehydrates state when the app starts offline.

Storage adapter:

```text
src/store/persistStorage.ts
```

This is a SQLite-backed key-value model, not a normalized relational schema. It preserves the current store flow with minimal runtime overhead. For a multi-device production backend, add server synchronization, conflict rules, encryption for sensitive data, backup/restore, and explicit data migrations.

SQLite Web requires WASM plus cross-origin isolation. `metro.config.js` enables WASM and sends COEP/COOP headers in development. The Expo Router plugin in `app.json` configures the same headers for EAS Hosting. Other web hosts must also return these headers:

```text
Cross-Origin-Embedder-Policy: credentialless
Cross-Origin-Opener-Policy: same-origin
```

When adding a new store that must work offline, use:

```ts
persist(
  (set, get) => ({
    // state and actions
  }),
  {
    name: 'pos-your-store',
    storage: createJSONStorage(() => persistStorage),
  },
)
```

## EAS Mobile Builds

Build profiles are in `eas.json`.

Preview builds:

```bash
npm run eas:build:android
npm run eas:build:ios
npm run eas:build:all
```

Production builds:

```bash
npm run eas:build:production
```

Before first EAS build:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

Then configure credentials:

```bash
npx eas-cli@latest credentials
```

## CI / CD

GitHub Actions:

```text
.github/workflows/ci.yml
```

EAS Workflow:

```text
.eas/workflows/mobile-build.yml
```

CI behavior:

- Pull requests run local verification and web export on GitHub Actions.
- EAS workflow can verify and build Android/iOS preview or production profiles.
- EAS workflow validates against the live Expo workflow schema.

## Bundle Speed Guidelines

- Do not use `--clear` unless cache is stale.
- Use `npm run export:web` for normal web bundle checks.
- Use `npm run export:web:clear` only after config/dependency changes.
- EAS workflow separates JS verification from native build jobs so failures stop before expensive mobile compiles.
- For repeated mobile build checks, prefer EAS preview builds and later add fingerprint/repack when native code stabilizes.

## Refactor Policy

This project still has many screens under broad folders. Do not restructure the whole tree in one patch.

Recommended order:

1. Auth
2. POS sale
3. Product
4. Inventory
5. Purchase
6. CRM
7. Reports
8. Sync

For each feature:

1. Move screens/components/types into `src/features/<feature>`.
2. Keep public imports through an `index.ts`.
3. Run `npm run verify`.
4. Run `npm run export:web`.
5. Only then remove legacy aliases.
