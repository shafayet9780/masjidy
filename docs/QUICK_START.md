# Masjidy — Developer Quick Start Guide

> Get from zero to running dev environment in under 30 minutes.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 LTS+ | `nvm install 20` |
| npm | 10+ | Comes with Node |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Supabase CLI | Latest | `npm install -g supabase` |
| Git | 2.40+ | System package manager |
| Xcode | 26+ (Mac only) | App Store (required for iOS builds with Expo SDK 55) |
| Android Studio | Latest | https://developer.android.com/studio |

**Recommended**: Use Cursor as your IDE with the Masjidy project files in context.

---

## Step 1 — Clone & Install

New app from template (SDK 55 — **use explicit template**; default `create-expo-app` may still target SDK 54 during transitions):

```bash
npx create-expo-app@latest masjidy --template default@sdk-55
cd masjidy
npm install
```

Existing clone:

```bash
git clone <repo-url> masjidy
cd masjidy
npm install
```

> **Expo Go**: SDK 55 may lag or differ in Expo Go. For full parity, use **development builds** (`expo run:ios` / `expo run:android` or EAS Build).

## Step 2 — Environment Variables

```bash
cp .env.example .env
```

Fill in your values:

```bash
# Get these from https://supabase.com/dashboard/project/<your-project>/settings/api
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Get from Supabase Dashboard → Settings → API → service_role (NEVER expose in client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Get from https://console.firebase.google.com/ → Project Settings
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# Get from https://console.upstash.com/redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Get from https://console.upstash.com/qstash
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```

## Step 3 — Supabase Setup

### Option A: Supabase Cloud (Recommended for solo dev)

1. Create a project at https://supabase.com/dashboard
2. Enable PostGIS: SQL Editor → `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Run migrations in order:

```bash
# From project root
supabase db push
# Or manually in SQL Editor: paste each file from supabase/migrations/
```

4. Deploy Edge Functions:

```bash
supabase functions deploy on-submission-insert
supabase functions deploy on-checkin-insert
supabase functions deploy on-confirmation-insert
supabase functions deploy schedule-notifications
supabase functions deploy deliver-notification
supabase functions deploy bootstrap-user-data
supabase functions deploy decay-trust-scores
supabase functions deploy update-contributor-tier
supabase functions deploy nearby-mosques
supabase functions deploy submit-time
supabase functions deploy check-in
supabase functions deploy confirm-mosque
supabase functions deploy register-token
```

5. Set Edge Function secrets:

```bash
supabase secrets set UPSTASH_REDIS_URL=... UPSTASH_REDIS_TOKEN=... QSTASH_TOKEN=... FIREBASE_SERVICE_ACCOUNT=...
```

### Option B: Local Supabase (for offline dev)

```bash
supabase init
supabase start
# Local URL will be shown, update .env accordingly
supabase db reset  # runs all migrations
```

## Step 4 — Firebase Setup (Push Notifications)

1. Go to https://console.firebase.google.com/
2. Create project → Add Android app (package: `com.masjidy.app`) → Download `google-services.json` → place in root
3. Add iOS app (bundle: `com.masjidy.app`) → Download `GoogleService-Info.plist` → place in root
4. Enable Cloud Messaging (FCM)
5. Generate a Firebase Admin SDK service account JSON → add as Supabase secret

## Step 5 — Auth Providers

In Supabase Dashboard → Authentication → Providers:

1. **Email**: Enable, set OTP as sign-in method
2. **Phone**: Enable, configure SMS provider (Twilio recommended)
3. **Google**: Enable, add OAuth credentials from Google Cloud Console
4. **Apple**: Enable, add Sign in with Apple credentials from Apple Developer

## Step 6 — Run the App

Masjidy uses native modules (notifications, location, secure store, SQLite, etc.). **Use a development build on device/emulator**, not only the browser.

### Android (recommended first)

1. Install [Android Studio](https://developer.android.com/studio) and open **SDK Manager** → install **Android SDK**, **Platform Tools**, and a **system image** for the emulator.
2. Create an AVD (Virtual Device) in **Device Manager**, or plug in a phone with **USB debugging** enabled.
3. From the project root:

```bash
# One-shot: generate android/ (gitignored), compile, install, start Metro
npm run android
# Same as: npx expo run:android
```

If Gradle or SDK paths fail, set `ANDROID_HOME` to your SDK path (e.g. `~/Library/Android/sdk` on macOS) and ensure `platform-tools` is on `PATH`.

Optional: regenerate native project only:

```bash
npm run prebuild:android
```

To open the emulator with **Expo Go** only (limited; may not match full native behavior):

```bash
npm run android:metro
# Then press a in the terminal, or: npx expo start --android
```

### iOS (Mac only, later)

```bash
npm run ios
# or: npx expo run:ios
```

### Web

```bash
npm run web
```

### Expo Go (physical phone — quick try)

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent).
2. Ensure **Expo Go’s SDK matches** your project (SDK **55**). If the store build is older, use a **development build** (`npm run android` / `npm run ios`) instead.
3. On your **computer**, same Wi‑Fi as the phone (or use tunnel — see below):

```bash
npx expo start
```

4. **Android**: In the terminal, press **`s`** to switch connection type if needed, then scan the QR code with **Expo Go** (in-app scanner or camera, depending on version).  
   **iOS**: Open the **Camera** app and tap the notification to open in Expo Go, or scan from inside Expo Go.

5. If the phone cannot reach your PC (corporate Wi‑Fi, etc.), start with a tunnel:

```bash
npx expo start --tunnel
```

(Requires an Expo account when using tunnel; follow the CLI prompts.)

**Limitations:** Expo Go only includes a **fixed set** of native modules. Masjidy may hit differences vs a full dev build (e.g. some notification or config behavior). For parity with production, prefer **`npm run android`** / **`npm run ios`**.

### Dev server only

```bash
npx expo start
# Then press a / i / w, or scan QR (Expo Go or dev build)
```

## Step 7 — Seed Test Data

```bash
# Edit scripts/seed-data/mosques.json with your pilot city mosques
npx tsx scripts/seed-mosques.ts
```

---

## Project Commands Cheat Sheet

| Command | What It Does |
|---|---|
| `npx expo start` | Start dev server (QR for Expo Go, or press a/i/w) |
| `npx expo start --tunnel` | Dev server with tunnel (Expo Go on another network) |
| `npm run android` | Dev build: prebuild if needed, run on Android emulator/device |
| `npm run ios` | Dev build: run on iOS Simulator (Mac) |
| `npx expo start --clear` | Start with cleared Metro cache |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `supabase functions serve` | Run Edge Functions locally |
| `supabase db reset` | Reset local DB and re-run migrations |
| `supabase gen types typescript --local > src/types/database.ts` | Regenerate DB types |
| `eas build --profile preview` | Build preview APK/IPA |
| `eas build --profile production` | Build production release |
| `eas submit` | Submit to App Store / Play Store |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `PostGIS not found` | Run `CREATE EXTENSION IF NOT EXISTS postgis;` in Supabase SQL Editor |
| Edge Function 500 | Check `supabase functions logs <name>` for stack trace |
| Push notifications not working | Verify FCM token is saved in users table; check Firebase console for delivery status |
| Expo build fails | Run `npx expo doctor` to check for version conflicts |
| NativeWind styles not applying | Clear Metro cache: `npx expo start --clear` |
| SQLite crash on Android | Ensure expo-sqlite version matches Expo SDK version |
| Location permission denied | Test city-search fallback; check Info.plist / AndroidManifest permissions |
| Apple Sign-In not appearing | Ensure `usesAppleSignIn: true` in app.json and Apple Developer portal is configured |
| `SDK location not found` / Android build fails | Set `ANDROID_HOME` (e.g. `export ANDROID_HOME=$HOME/Library/Android/sdk`) and add `$ANDROID_HOME/platform-tools` to `PATH` |
| Emulator not listed | Start an AVD from Android Studio Device Manager, then run `npm run android` again |
| Expo Go opens but errors / wrong SDK | Update Expo Go from the store, or match project SDK; otherwise use `npm run android` (dev build) |
| QR scan does not load | Same Wi‑Fi as PC, or run `npx expo start --tunnel`; disable VPN if it blocks LAN |

---

## File Reference

| File | Purpose |
|---|---|
| `PROJECT_SPEC.md` | Full technical specification — the implementation bible |
| `DESIGN_SYSTEM.md` | Colors, typography, components, patterns |
| `AI_AGENT_PROMPTS.md` | Ready-to-use prompts for Cursor/Claude Code plan mode |
| `Masjidy_SRS_v1_3.docx` | Original requirements document |

---

*Bismillah. Let's build something that serves the ummah well.*
