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
| Xcode | 15+ (Mac only) | App Store (for iOS simulator) |
| Android Studio | Latest | https://developer.android.com/studio |

**Recommended**: Use Cursor as your IDE with the Masjidy project files in context.

---

## Step 1 — Clone & Install

```bash
git clone <repo-url> masjidy
cd masjidy
npm install
```

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

```bash
# Start Expo dev server
npx expo start

# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Or scan QR code with Expo Go on physical device
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
| `npx expo start` | Start dev server |
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
