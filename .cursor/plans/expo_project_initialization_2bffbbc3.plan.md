---
name: Expo Project Initialization
overview: Initialize Expo SDK 55 project with TypeScript, NativeWind v4, Gluestack UI v3, Expo Router, all placeholder files, and update existing docs/rules to match.
todos:
  - id: update-docs
    content: Update docs and cursor rules to reflect SDK 55, Gluestack v3, RN 0.83, React 19.2 (PROJECT_SPEC.md, DESIGN_SYSTEM.md, QUICK_START.md, global.mdc, components.mdc)
    status: completed
  - id: scaffold
    content: Scaffold base Expo SDK 55 project (create-expo-app --template default@sdk-55 in temp dir, merge into workspace)
    status: completed
  - id: deps
    content: Install all dependencies (UI, backend, fonts, i18n, state, dev tools) with correct SDK 55 version pins
    status: completed
  - id: configs
    content: "Create/configure all root config files: tsconfig, tailwind, metro, babel, global.css, app.json, .env.example, eslint, prettier, jest, eas.json, nativewind-env.d.ts"
    status: completed
  - id: gluestack
    content: Initialize Gluestack UI v3 via CLI (npx gluestack-ui init)
    status: completed
  - id: screens
    content: Create all 16 screen placeholder files in app/ with Expo Router structure
    status: completed
  - id: components
    content: Create all 24 component placeholder files in src/components/ (ui, mosque, prayer, qibla, layout)
    status: completed
  - id: hooks-services-lib
    content: Create placeholder files for hooks (14), services (4), lib (6), theme (4), store (2), types (4), constants (3)
    status: completed
  - id: i18n
    content: Create i18n setup file and 4 language JSON placeholders (en, ar, bn, ur)
    status: completed
  - id: supabase
    content: "Create supabase directory: 5 migration SQL files, 10 edge function index.ts placeholders, config.toml"
    status: completed
  - id: assets-scripts
    content: Create assets directory structure (fonts, images, icons with SVG placeholders) and scripts directory
    status: completed
  - id: verify
    content: Run npx expo-doctor, TypeScript check, and npx expo start to verify the skeleton boots cleanly
    status: completed
isProject: false
---

# Masjidy Expo Project Initialization

## Key Version Decisions (Updated per Expert Advice)

- **Expo SDK 55** (latest stable, React Native 0.83, React 19.2) -- mandatory New Architecture, no legacy fallback
- **NativeWind v4.2.0+** (stable) -- Tailwind CSS v3.4.17, compatible with Reanimated v4 / RN 0.83. NativeWind v5 is preview-only with known issues, so we avoid it.
- **Tailwind CSS ^3.4.17** -- required by NativeWind v4
- **Gluestack UI v3** (CLI-based, `npx gluestack-ui init`) -- latest stable, copy-paste architecture. Components live in our codebase styled with NativeWind (single styling system). Will evolve toward custom as app matures.
- **Reanimated v4** -- ships with SDK 55, compatible with NativeWind 4.2.0+
- **React 19.2** -- ships with SDK 55
- **NOT installing**: `react-native-maps` (Phase 1.5), `@react-native-firebase/messaging` (deferred to notification implementation)

### SDK 55-Specific Considerations

- New Architecture is **mandatory** -- `newArchEnabled` config option removed
- `statusBar` field removed from app.json -- use `expo-status-bar` programmatically
- During transition period, `create-expo-app` defaults to SDK 54; must use `--template default@sdk-55`
- SDK 55 template includes a `/src` folder convention which aligns with our project structure

---

## Step 0: Update Existing Documents and Rules

Before writing code, update all references from SDK 54 / Gluestack v1 to SDK 55 / Gluestack v3. This keeps docs in sync from the start.

### [.cursor/rules/global.mdc](.cursor/rules/global.mdc)

- Line 13: `Expo SDK 54` --> `Expo SDK 55`
- Line 14: `Gluestack UI` --> `Gluestack UI v3 (copy-paste/CLI model)`
- Add note: `New Architecture mandatory (SDK 55+)`

### [.cursor/rules/components.mdc](.cursor/rules/components.mdc)

- Lines 42-45: Update Gluestack UI usage section to reflect v3 CLI model:
  - Components added via `npx gluestack-ui add <name>`, live in project
  - Styled with NativeWind classes (not gluestack-style props)
  - Customize by editing the copied component files directly

### [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md) -- Section 2 (Tech Stack)

- `"expo": "~52.x"` --> `"~55.x"`
- `"react": "18.x"` --> `"19.2.x"`
- `"react-native": "0.76.x"` --> `"0.83.x"`
- `"expo-router": "~4.x"` --> `"~5.x"` (SDK 55 ships expo-router 5)
- UI section: replace `"@gluestack-ui/themed": "latest"` with `"gluestack-ui": "^3.x"` (CLI package)
- `"react-native-reanimated": "~3.x"` --> `"~4.x"`
- Add note about mandatory New Architecture

### [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md) -- Section 4 (app.json)

- Remove any `statusBar` references
- Add `"newArchEnabled"` note (removed in SDK 55, always on)

### [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) -- Section 2 + 13

- Section 2: Update `react-native-reanimated` to `v4+`
- Section 13.3: Replace Gluestack config override example with v3 CLI approach note

### [docs/QUICK_START.md](docs/QUICK_START.md)

- Xcode version: `15+` --> `26+` (SDK 55 requires Xcode 26 for iOS builds)
- Template command note: `npx create-expo-app@latest --template default@sdk-55`
- Note about Expo Go: SDK 55 may not be available in Expo Go during transition; use development builds

---

## Step 1: Scaffold Base Expo SDK 55 Project

The workspace has existing docs, cursor rules, and prompts. To avoid conflicts:

1. `npx create-expo-app@latest /tmp/masjidy-scaffold --template default@sdk-55`
2. Copy into workspace: `package.json`, `babel.config.js`, `app.json`, `tsconfig.json`, `.gitignore` (merge with existing)
3. Remove temp dir
4. Run `npx expo install --fix` to align all dependency versions

---

## Step 2: Install All Dependencies

Using `npx expo install` for correct SDK 55 version pins:

**Core + Routing:**
```
expo-router expo-linking expo-constants expo-status-bar expo-splash-screen expo-system-ui
react-native-screens react-native-safe-area-context react-native-gesture-handler
```

**Styling + UI:**
```
nativewind@^4.2.0 react-native-reanimated react-native-svg phosphor-react-native expo-haptics
```

**Dev (npm install --save-dev):**
```
tailwindcss@^3.4.17 prettier-plugin-tailwindcss
jest jest-expo @testing-library/react-native
eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
eslint-plugin-react eslint-plugin-react-native eslint-plugin-react-hooks
prettier
```

**Backend + Data:**
```
@supabase/supabase-js expo-sqlite expo-secure-store @react-native-async-storage/async-storage
```

**Location + Sensors + Notifications:**
```
expo-location expo-sensors expo-notifications
```

**Fonts:**
```
expo-font @expo-google-fonts/inter @expo-google-fonts/noto-sans-arabic @expo-google-fonts/jetbrains-mono
```

**I18n + State:**
```
i18next react-i18next expo-localization zustand
```

---

## Step 3: Configure Project Files

### 3a. `tsconfig.json` -- Path aliases

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### 3b. `tailwind.config.js` -- All theme tokens from [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) Section 3

CSS variable approach with all 15 color tokens, font families, and border radius from the design system:

```javascript
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-soft": "var(--color-primary-soft)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        "surface-muted": "var(--color-surface-muted)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        border: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ["Inter"],
        arabic: ["NotoSansArabic"],
        mono: ["JetBrainsMono"],
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
```

### 3c. `metro.config.js` -- NativeWind wrapper

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

### 3d. `babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

Note: `"nativewind/babel"` preset added per NativeWind v4 docs (was missing in previous plan). `react-native-reanimated/plugin` must be last in plugins array.

### 3e. `global.css` -- Tailwind directives

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3f. `nativewind-env.d.ts` -- TypeScript types for NativeWind

```typescript
/// <reference types="nativewind/types" />
```

### 3g. `app.json` -- SDK 55 config from PROJECT_SPEC Section 4

```json
{
  "expo": {
    "name": "Masjidy",
    "slug": "masjidy",
    "scheme": "masjidy",
    "version": "1.0.0",
    "orientation": "portrait",
    "web": { "bundler": "metro" },
    "plugins": [
      "expo-router",
      "expo-localization",
      "expo-secure-store",
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Masjidy uses your location to find mosques near you and verify check-ins."
      }],
      ["expo-notifications", {
        "icon": "./assets/icons/notification-icon.png",
        "color": "#1B6B4A"
      }]
    ],
    "ios": {
      "bundleIdentifier": "com.masjidy.app",
      "usesAppleSignIn": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Masjidy uses your location to find mosques near you.",
        "NSMotionUsageDescription": "Masjidy uses device motion for the Qibla compass."
      }
    },
    "android": {
      "package": "com.masjidy.app",
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "VIBRATE"]
    }
  }
}
```

No `statusBar` field (removed in SDK 55). No `newArchEnabled` (mandatory, removed from config).

### 3h. `.env.example`

All variables from PROJECT_SPEC Section 4: Supabase, Firebase, Upstash Redis, Upstash QStash, Twilio. Google Maps commented out (Phase 1.5).

### 3i. `.eslintrc.js` + `.prettierrc`

ESLint: `@typescript-eslint`, `react`, `react-native`, `react-hooks` plugins. Strict no-any.
Prettier: single quotes, trailing commas, 100 print width, tailwindcss plugin.

### 3j. `jest.config.js` + `eas.json`

jest-expo preset. EAS with development, preview, production profiles.

---

## Step 4: Initialize Gluestack UI v3

```bash
npx gluestack-ui init
```

This scaffolds the Gluestack config for the NativeWind-integrated component system. Components are then added individually via `npx gluestack-ui add <component-name>` when needed during implementation. For the skeleton phase, we create simple placeholder files instead.

---

## Step 5: Create All Placeholder Files (~100 files)

Every file exports a named component (or default export for screens) that renders `<Text>{ComponentName}</Text>`.

### Screens (16 files in `app/`)

- `app/_layout.tsx` -- Root layout with font loading, ThemeProvider, splash screen, `import "../global.css"`
- `app/+not-found.tsx`
- `app/(tabs)/_layout.tsx` -- Tab navigator with 5 tabs (Phosphor icons)
- `app/(tabs)/index.tsx`, `my-mosques.tsx`, `prayer-times.tsx`, `qibla.tsx`, `profile.tsx`
- `app/mosque/[id].tsx`
- `app/auth/login.tsx`, `onboarding.tsx`
- `app/submit-time/[mosqueId].tsx`
- `app/settings/index.tsx`, `theme.tsx`, `notifications.tsx`, `language.tsx`

### Components (24 files in `src/components/`)

- `ui/`: Button, Card, Badge, Input, Skeleton, Toast, EmptyState, OfflineBanner
- `mosque/`: MosqueCard, MosqueCardSkeleton, PrayerTimeTable, PrayerTimeRow, TrustBadge, FacilityChip, CheckInButton, ConfirmMosqueButton, FollowButton, LiveCount, SubmissionForm
- `prayer/`: PrayerCountdown, PrayerTimeCard
- `qibla/`: QiblaCompass
- `layout/`: ScreenContainer, TabBar

### Hooks, Services, Lib, Theme, Store, Types, Constants (37 files)

- `src/hooks/`: 14 hook files (useAuth, useMosques, useMosqueProfile, useFollows, useCheckIn, useConfirmMosque, useSubmitTime, usePrayerTimes, useQibla, useLocation, useOffline, useBootstrap, useNotifications, useTheme)
- `src/services/`: supabase.ts, api.ts, notifications.ts, offline.ts
- `src/lib/`: prayerTimes.ts, qibla.ts, trustScore.ts, timeValidation.ts, distance.ts, formatters.ts
- `src/theme/`: ThemeProvider.tsx, themes.ts, tokens.ts, gluestack.config.ts
- `src/store/`: authStore.ts, appStore.ts
- `src/types/`: database.ts, mosque.ts, user.ts, navigation.ts
- `src/constants/`: prayers.ts, facilities.ts, config.ts

### I18n (5 files)

- `src/i18n/`: index.ts, en.json, ar.json, bn.json, ur.json

### Supabase (15 files)

- `supabase/migrations/`: 001 through 005 SQL files (empty with header comments)
- `supabase/functions/`: 10 edge function dirs, each with `index.ts` placeholder
- `supabase/config.toml` placeholder

### Assets + Scripts

- `assets/fonts/`, `assets/images/onboarding/`, `assets/images/empty-states/` (dirs with .gitkeep)
- `assets/images/mosque-placeholder.svg`, `assets/icons/*.svg` (minimal SVG placeholders)
- `scripts/`: seed-mosques.ts, generate-types.ts, test-notifications.ts

---

## Step 6: Verify

1. `npx expo-doctor` -- validate all dependency versions
2. `npx tsc --noEmit` -- TypeScript compiles clean
3. `npx expo start` -- app boots to the tab navigator without crashes

---

## Compatibility Notes

- NativeWind v4.2.0+ is required for Reanimated v4 compatibility. v5 is preview-only with dark mode issues -- avoid for production.
- Gluestack UI v3 overlay issues (modals, menus) with Reanimated v4 were fixed in PR #3204 (merged). The CLI pulls the fixed version.
- SDK 55 mandatory New Architecture means all dependencies must support it. The chosen stack (NativeWind v4, Gluestack v3, Supabase, Zustand) all do.
- `react-native-maps` explicitly excluded (Phase 1.5).
- `@react-native-firebase/messaging` deferred to notification implementation (requires native google-services files).
