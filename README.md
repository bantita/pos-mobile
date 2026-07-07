# XCLNC POS

Universal point-of-sale application for web, Android, and iOS. The main repository is modernized on Expo SDK 57 with Feature-Driven Clean Architecture, NativeWind, Tailwind CSS, and Lucide icons.

## Stack

- Expo SDK 57, React Native 0.86, React 19, and Expo Router
- NativeWind 4, Tailwind CSS 3, and `react-native-css-interop`
- Zustand stores with AsyncStorage persistence
- Zod, React Hook Form, Axios, and date-fns
- Lucide React Native icons

## Requirements

- Node.js 22.13 or newer, as required by Expo SDK 57
- npm
- Android Studio or Xcode only when running a native simulator

## Quick Start

```bash
npm install
npm start
```

Use `w` for web, `a` for Android, or `i` for iOS from the Expo CLI. Direct commands are also available:

```bash
npm run web
npm run android
npm run ios
```

Demo accounts are `admin`, `manager`, and `cashier`. Their development password is `1234`.

## Quality Checks

```bash
npm run verify
npx expo export --platform web
```

`npm run verify` runs the promotion engine tests, TypeScript, ESLint, and Expo Doctor. The engine suite currently covers 39 promotion, discount, point, conflict, and audit assertions.

## Architecture

```text
src/
  app/            Expo Router entry and root layout
  features/       Feature modules split by domain/application/data/presentation
  shared/         Cross-feature UI, hooks, constants, infrastructure, icons, and utilities
  core/           Shared business engines such as POS promotion and point calculation
  assets/         Source-level assets used by Expo imports
```

The Expo Router root owns platform initialization. Each feature keeps its own presentation screens/navigation, application stores, data APIs/mocks, and domain types. Business engines that cut across features live in `src/core`.

## Styling

Tailwind CSS is configured in `src/global.css`, and NativeWind-enabled primitives are imported from `@/shared/tw`. Use `className` for static layout and design tokens. Keep `style` only for runtime-computed values such as animation, measured dimensions, or colors supplied through props.

```tsx
import { Text, View } from '@/shared/tw';

export function Summary() {
  return (
    <View className="rounded-lg border border-pos-border bg-pos-surface p-4">
      <Text className="font-semibold text-pos-text">ยอดขายวันนี้</Text>
    </View>
  );
}
```

## Migration Status

- Source code is organized under feature-driven clean architecture boundaries.
- NativeWind/Tailwind v4 runtime setup is complete.
- Legacy vector-icon imports are removed; icons render through Lucide.
- Shared design-system components are migrated to NativeWind.
- Screen-level lint cleanup remains in progress and is tracked in `Plan.md`.

See [Plan.md](./Plan.md) for the current architecture migration status and verification notes.

## Documentation

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Architecture documentation](./docs)
- [Migration plan](./Plan.md)

## License

MIT. See [LICENSE](./LICENSE).
