# Masjidy

**Your connection to your local mosque, everywhere you go.**

Masjidy is a React Native (Expo) app for mosque discovery and jamat time tracking, backed by Supabase. This repository is the mobile client; API and database contracts live in the docs below.

## Stack

- **Expo SDK 55** · React Native 0.83 · React 19 · TypeScript (strict)
- **Expo Router** (file-based routes under `app/`)
- **NativeWind v4** + **Tailwind CSS 3** · **Gluestack UI v3**
- **Supabase** (auth, Postgres/PostGIS, Edge Functions) — see spec for contracts

## Prerequisites

- Node.js 20 LTS (or newer LTS)
- npm 10+
- For **Android**: Android Studio (SDK, emulator or USB device). See [docs/QUICK_START.md](docs/QUICK_START.md).
- For **iOS** (macOS): Xcode and CocoaPods toolchain when using `npm run ios`.

## Setup

```bash
git clone <repository-url> masjidy
cd masjidy
npm install
cp .env.example .env
# Edit .env with your Supabase and other keys when integrating backend features.
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` / `npx expo start` | Dev server (QR for Expo Go, or press `a` / `i` / `w`) |
| `npm run android` | Development build on Android (Gradle + install + Metro) |
| `npm run ios` | Development build on iOS Simulator / device |
| `npm run web` | Run in the browser |
| `npm run android:metro` | Open Android with Metro only (e.g. Expo Go flow) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Jest |

Expo Go and tunnel mode are documented in [docs/QUICK_START.md](docs/QUICK_START.md#step-6--run-the-app).

## Project layout

| Path | Purpose |
| --- | --- |
| `app/` | Expo Router screens and layouts |
| `src/components/` | UI primitives, domain components, Gluestack provider |
| `src/hooks/`, `src/lib/`, `src/services/` | Hooks, pure logic, API clients |
| `src/theme/`, `src/i18n/` | Theming and translations |
| `supabase/` | Migrations and Edge Function stubs |
| `docs/` | Specification, design system, quick start |

## Documentation

| Document | Contents |
| --- | --- |
| [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md) | Full technical specification (API, schema, features) |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Themes, typography, components |
| [docs/QUICK_START.md](docs/QUICK_START.md) | Environment, Supabase, Firebase, run targets |

## License

Private project (`private: true` in `package.json`). Add a public license file if you open-source the repo.
