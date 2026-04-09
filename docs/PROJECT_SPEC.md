# Masjidy — Full Project Specification

> This document is the single source of truth for development. It translates the SRS v1.3 into implementable technical specifications. Every AI agent session should have this file in context.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Structure](#3-project-structure)
4. [Environment & Configuration](#4-environment--configuration)
5. [Database Schema](#5-database-schema)
6. [Authentication](#6-authentication)
7. [API Contracts — Edge Functions](#7-api-contracts--edge-functions)
8. [Feature Specifications — Real MVP](#8-feature-specifications--real-mvp)
9. [Feature Specifications — Phase 1.5](#9-feature-specifications--phase-15)
10. [Feature Specifications — Phase 2](#10-feature-specifications--phase-2)
11. [Notification System Architecture](#11-notification-system-architecture)
12. [Caching Strategy](#12-caching-strategy)
13. [Offline Architecture](#13-offline-architecture)
14. [Testing Strategy](#14-testing-strategy)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Performance Budgets](#16-performance-budgets)
17. [Security Checklist](#17-security-checklist)
18. [RTL & Internationalization](#18-rtl--internationalization)
19. [Error Handling Standards](#19-error-handling-standards)
20. [Deployment Checklist](#20-deployment-checklist)

---

## 1. Project Overview

**App Name**: Masjidy
**Tagline**: Your Connection to Your Local Mosque, Everywhere You Go
**Platform**: iOS + Android (single codebase)
**Architecture**: React Native (Expo) + Supabase BaaS
**Primary Dev Tool**: Cursor (AI-assisted)

### Phase Timeline

| Phase | Days | Focus |
|---|---|---|
| Real MVP | 1–45 | Mosque list, jamat times, follow, notifications, check-in, offline |
| Phase 1.5 | 46–90 | Map, delay indicator, trust tiers, moderation, seasonal detection, admin SMS |
| Phase 2 | Months 4–9 | Admin panel, announcements, gamification, Ramadan, AI moderation |
| Phase 3 | Months 10+ | Global scale, Eid finder, API, partnerships |

---

## 2. Tech Stack & Dependencies

### Core

```json
{
  "expo": "~52.x",
  "react": "18.x",
  "react-native": "0.76.x",
  "typescript": "~5.x"
}
```

### Navigation

```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "@react-navigation/native-stack": "^6.x",
  "expo-router": "~4.x"
}
```

> **Decision**: Use Expo Router (file-based routing) for simplicity and AI-agent compatibility. Each screen is a file — easy for agents to create and modify.

### UI & Styling

```json
{
  "@gluestack-ui/themed": "latest",
  "nativewind": "^4.x",
  "tailwindcss": "^3.4.x",
  "phosphor-react-native": "latest",
  "react-native-reanimated": "~3.x",
  "expo-haptics": "latest"
}
```

### Backend & Data

```json
{
  "@supabase/supabase-js": "^2.x",
  "expo-sqlite": "latest",
  "expo-secure-store": "latest",
  "@react-native-async-storage/async-storage": "latest"
}
```

### Maps & Location

```json
{
  "expo-location": "latest",
  "expo-sensors": "latest"
}
```

> **Note**: `react-native-maps` added in Phase 1.5 only. Not installed for MVP.

### Notifications

```json
{
  "expo-notifications": "latest",
  "@react-native-firebase/messaging": "latest"
}
```

### Fonts

```json
{
  "expo-font": "latest",
  "@expo-google-fonts/inter": "latest",
  "@expo-google-fonts/noto-sans-arabic": "latest",
  "@expo-google-fonts/jetbrains-mono": "latest"
}
```

### Dev & Testing

```json
{
  "jest": "^29.x",
  "jest-expo": "latest",
  "@testing-library/react-native": "latest",
  "eslint": "^8.x",
  "prettier": "^3.x",
  "typescript": "~5.x"
}
```

---

## 3. Project Structure

```
masjidy/
├── app/                          # Expo Router — file-based routes
│   ├── (tabs)/                   # Bottom tab layout
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Mosques tab (home / list)
│   │   ├── my-mosques.tsx        # My Mosques tab
│   │   ├── prayer-times.tsx      # Prayer Times tab
│   │   ├── qibla.tsx             # Qibla tab
│   │   └── profile.tsx           # Profile tab
│   ├── mosque/
│   │   └── [id].tsx              # Mosque profile (dynamic route)
│   ├── auth/
│   │   ├── login.tsx             # Login screen
│   │   └── onboarding.tsx        # First login — name, language, calc method
│   ├── submit-time/
│   │   └── [mosqueId].tsx        # Time submission form
│   ├── settings/
│   │   ├── index.tsx             # Settings main
│   │   ├── theme.tsx             # Theme picker
│   │   ├── notifications.tsx     # Global notification settings
│   │   └── language.tsx          # Language picker
│   ├── _layout.tsx               # Root layout (providers, auth guard)
│   └── +not-found.tsx            # 404 screen
│
├── src/
│   ├── components/
│   │   ├── ui/                   # Generic reusable (wrappers over Gluestack)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── OfflineBanner.tsx
│   │   ├── mosque/               # Mosque-specific components
│   │   │   ├── MosqueCard.tsx
│   │   │   ├── MosqueCardSkeleton.tsx
│   │   │   ├── PrayerTimeTable.tsx
│   │   │   ├── PrayerTimeRow.tsx
│   │   │   ├── TrustBadge.tsx
│   │   │   ├── FacilityChip.tsx
│   │   │   ├── CheckInButton.tsx
│   │   │   ├── ConfirmMosqueButton.tsx
│   │   │   ├── FollowButton.tsx
│   │   │   ├── LiveCount.tsx
│   │   │   └── SubmissionForm.tsx
│   │   ├── prayer/               # Prayer-specific components
│   │   │   ├── PrayerCountdown.tsx
│   │   │   └── PrayerTimeCard.tsx
│   │   ├── qibla/
│   │   │   └── QiblaCompass.tsx
│   │   └── layout/
│   │       ├── ScreenContainer.tsx
│   │       └── TabBar.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Auth state, login, logout
│   │   ├── useMosques.ts         # Fetch mosque list by proximity
│   │   ├── useMosqueProfile.ts   # Fetch single mosque + schedule
│   │   ├── useFollows.ts         # Follow/unfollow + My Mosques
│   │   ├── useCheckIn.ts         # Check-in logic + live count subscription
│   │   ├── useConfirmMosque.ts   # Lightweight confirmation
│   │   ├── useSubmitTime.ts      # Time submission with validation
│   │   ├── usePrayerTimes.ts     # Client-side prayer time calculation
│   │   ├── useQibla.ts           # Qibla bearing + compass heading
│   │   ├── useLocation.ts        # GPS permission + current location
│   │   ├── useOffline.ts         # Network state + SQLite cache
│   │   ├── useBootstrap.ts       # Bootstrap API call + cache hydration
│   │   ├── useNotifications.ts   # Push permission + token registration
│   │   └── useTheme.ts           # Theme + color mode
│   │
│   ├── services/                 # External API clients
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── api.ts                # Edge Function HTTP calls
│   │   ├── notifications.ts      # FCM token management
│   │   └── offline.ts            # SQLite read/write operations
│   │
│   ├── lib/                      # Pure utility functions (no React)
│   │   ├── prayerTimes.ts        # Adhan calculation (MWL, ISNA, Karachi, UmQ)
│   │   ├── qibla.ts              # Qibla bearing from lat/lng
│   │   ├── trustScore.ts         # Trust score calculation (mirror of server logic)
│   │   ├── timeValidation.ts     # Plausible range validation per prayer
│   │   ├── distance.ts           # Haversine distance calculation
│   │   └── formatters.ts         # Time, distance, relative date formatters
│   │
│   ├── theme/                    # Theming system
│   │   ├── ThemeProvider.tsx      # React context provider
│   │   ├── themes.ts             # All 4 themes × 2 modes = 8 color maps
│   │   ├── tokens.ts             # Semantic tokens, spacing, radius
│   │   └── gluestack.config.ts   # Gluestack UI config override
│   │
│   ├── store/                    # Global state (lightweight)
│   │   ├── authStore.ts          # Zustand — user session, profile
│   │   └── appStore.ts           # Zustand — location, network, settings
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── database.ts           # Supabase generated types
│   │   ├── mosque.ts             # Mosque, JamatTime, CheckIn types
│   │   ├── user.ts               # User, ContributorTier types
│   │   └── navigation.ts         # Route param types
│   │
│   ├── constants/                # App-wide constants
│   │   ├── prayers.ts            # Prayer names, ranges, order
│   │   ├── facilities.ts         # Facility list with icons
│   │   └── config.ts             # API URLs, limits, timeouts
│   │
│   └── i18n/                     # Internationalization
│       ├── index.ts              # i18n setup (expo-localization + i18next)
│       ├── en.json               # English strings
│       ├── ar.json               # Arabic strings
│       ├── bn.json               # Bengali strings
│       └── ur.json               # Urdu strings
│
├── supabase/                     # Supabase project config
│   ├── migrations/               # SQL migration files
│   │   ├── 001_create_tables.sql
│   │   ├── 002_create_rls_policies.sql
│   │   ├── 003_create_indexes.sql
│   │   ├── 004_create_enums.sql
│   │   └── 005_seed_data.sql
│   ├── functions/                # Edge Functions (Deno/TypeScript)
│   │   ├── on-submission-insert/
│   │   │   └── index.ts
│   │   ├── on-checkin-insert/
│   │   │   └── index.ts
│   │   ├── on-confirmation-insert/
│   │   │   └── index.ts
│   │   ├── schedule-notifications/
│   │   │   └── index.ts
│   │   ├── deliver-notification/
│   │   │   └── index.ts
│   │   ├── bootstrap-user-data/
│   │   │   └── index.ts
│   │   ├── decay-trust-scores/
│   │   │   └── index.ts
│   │   ├── update-contributor-tier/
│   │   │   └── index.ts
│   │   ├── seasonal-check/           # Phase 1.5
│   │   │   └── index.ts
│   │   └── admin-quick-update/       # Phase 1.5
│   │       └── index.ts
│   └── config.toml               # Supabase local dev config
│
├── assets/                       # Static assets
│   ├── fonts/
│   ├── images/
│   │   ├── onboarding/
│   │   ├── empty-states/
│   │   └── mosque-placeholder.svg
│   └── icons/                    # Custom SVG icons not in Phosphor
│       ├── qibla-compass.svg
│       ├── prayer-mat.svg
│       ├── minaret.svg
│       └── trust-shield.svg
│
├── scripts/                      # Utility scripts
│   ├── seed-mosques.ts           # Pre-launch mosque seeding script
│   ├── generate-types.ts         # Supabase type generation
│   └── test-notifications.ts    # Notification pipeline smoke test
│
├── tailwind.config.js
├── tsconfig.json
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
└── README.md
```

---

## 4. Environment & Configuration

### .env Variables

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Firebase (for FCM push notifications)
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# Upstash Redis
UPSTASH_REDIS_URL=https://xxxx.upstash.io
UPSTASH_REDIS_TOKEN=

# Upstash QStash
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Twilio (Phase 1.5 — Admin Quick-Update)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Maps (Phase 1.5 only)
# GOOGLE_MAPS_API_KEY=
```

### app.json Key Config

```json
{
  "expo": {
    "name": "Masjidy",
    "slug": "masjidy",
    "scheme": "masjidy",
    "version": "1.0.0",
    "orientation": "portrait",
    "plugins": [
      "expo-router",
      "expo-localization",
      "expo-secure-store",
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Masjidy uses your location to find mosques near you and verify check-ins." }],
      ["expo-notifications", { "icon": "./assets/icons/notification-icon.png", "color": "#1B6B4A" }]
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

---

## 5. Database Schema

### 5.1 Enums

```sql
CREATE TYPE prayer_type AS ENUM ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah');
CREATE TYPE submission_status AS ENUM ('pending', 'live', 'rejected');
CREATE TYPE contributor_tier AS ENUM ('new_user', 'regular', 'trusted', 'mosque_admin');
CREATE TYPE notification_job_status AS ENUM ('queued', 'delivered', 'failed');
CREATE TYPE action_type AS ENUM ('submission', 'checkin', 'endorsement', 'confirmation', 'seasonal_prompt');
```

### 5.2 Tables

#### mosques

```sql
CREATE TABLE mosques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  contact_phone TEXT,
  photo_url TEXT,
  madhab TEXT,
  khutbah_language TEXT,
  facilities JSONB DEFAULT '{}',
  -- e.g. {"wudu": true, "parking": true, "womens_section": true, "wheelchair": false, "children_friendly": true}
  verified_admin_id UUID REFERENCES auth.users(id),
  last_confirmed_at TIMESTAMPTZ,
  confirmation_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mosques_location ON mosques USING GIST (location);
CREATE INDEX idx_mosques_admin ON mosques (verified_admin_id) WHERE verified_admin_id IS NOT NULL;
```

#### jamat_times

```sql
CREATE TABLE jamat_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  prayer prayer_type NOT NULL,
  time TIMETZ NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  trust_score INT NOT NULL DEFAULT 40 CHECK (trust_score >= 0 AND trust_score <= 100),
  status submission_status NOT NULL DEFAULT 'pending',
  note TEXT CHECK (char_length(note) <= 120),
  last_verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jamat_times_mosque_prayer ON jamat_times (mosque_id, prayer, status) WHERE status = 'live';
CREATE INDEX idx_jamat_times_submitter ON jamat_times (submitted_by);
-- Prevent duplicate submissions within 24h
CREATE UNIQUE INDEX idx_jamat_times_dedup ON jamat_times (submitted_by, mosque_id, prayer, (created_at::date));
```

#### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  tier contributor_tier NOT NULL DEFAULT 'new_user',
  tier_last_active_at TIMESTAMPTZ DEFAULT now(),
  language TEXT DEFAULT 'en',
  prayer_calc_method TEXT DEFAULT 'mwl' CHECK (prayer_calc_method IN ('mwl', 'isna', 'karachi', 'umm_al_qura')),
  notification_lead_minutes INT DEFAULT 15 CHECK (notification_lead_minutes IN (10, 15, 30)),
  fcm_token TEXT,
  apns_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### check_ins

```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  mosque_id UUID NOT NULL REFERENCES mosques(id),
  prayer prayer_type NOT NULL,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ, -- when prayer actually started (optional user input)
  delta_minutes NUMERIC(5,1), -- computed: started_at - posted_jamat_time
  geofence_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_checkins_dedup ON check_ins (user_id, mosque_id, prayer, (arrived_at::date));
CREATE INDEX idx_checkins_mosque_prayer ON check_ins (mosque_id, prayer, arrived_at);
```

#### mosque_confirmations

```sql
CREATE TABLE mosque_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  mosque_id UUID NOT NULL REFERENCES mosques(id),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Max 1 per user per mosque per 30 days
CREATE UNIQUE INDEX idx_confirmations_dedup ON mosque_confirmations (user_id, mosque_id, (date_trunc('month', confirmed_at)));
```

#### follows

```sql
CREATE TABLE follows (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  notification_prefs JSONB DEFAULT '{}',
  -- Phase 1.5: {"fajr": {"enabled": true, "lead_minutes": 15}, ...}
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, mosque_id)
);

CREATE INDEX idx_follows_mosque ON follows (mosque_id); -- for notification fan-out
```

#### contributor_log

```sql
CREATE TABLE contributor_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type action_type NOT NULL,
  mosque_id UUID REFERENCES mosques(id),
  accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contributor_log_user ON contributor_log (user_id, action_type);
```

#### moderation_log

```sql
CREATE TABLE moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES jamat_times(id),
  rule_triggered TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### notification_jobs

```sql
CREATE TABLE notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qstash_message_id TEXT,
  mosque_id UUID NOT NULL REFERENCES mosques(id),
  prayer prayer_type NOT NULL,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status notification_job_status NOT NULL DEFAULT 'queued',
  attempts INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_jobs_dedup ON notification_jobs (mosque_id, prayer, date, user_id);
```

### 5.3 Row Level Security (RLS)

```sql
-- mosques: anyone reads, verified admin writes own
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mosques_select" ON mosques FOR SELECT USING (true);
CREATE POLICY "mosques_update_admin" ON mosques FOR UPDATE USING (verified_admin_id = auth.uid());

-- jamat_times: anyone reads live, auth users insert
ALTER TABLE jamat_times ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jamat_select_live" ON jamat_times FOR SELECT USING (status = 'live');
CREATE POLICY "jamat_insert_auth" ON jamat_times FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- users: own row only
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own" ON users USING (id = auth.uid());

-- check_ins: auth insert, public aggregate read
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_insert_auth" ON check_ins FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "checkins_select" ON check_ins FOR SELECT USING (true);

-- follows: own rows only, mosque admins cannot see followers
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_own" ON follows USING (user_id = auth.uid());

-- contributor_log: own rows only
ALTER TABLE contributor_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrib_own" ON contributor_log FOR SELECT USING (user_id = auth.uid());

-- moderation_log: admin only (via service role in Edge Functions)
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- notification_jobs: system only (via service role)
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;
```

---

## 6. Authentication

### Flow

1. User opens app → check Supabase session in SecureStore
2. If no session → show auth screen
3. Auth options: Email OTP, Phone OTP, Google OAuth, Apple Sign-In
4. On first login → redirect to onboarding: display_name, language, prayer_calc_method
5. On success → write to `users` table, store session, navigate to home

### Implementation

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

---

## 7. API Contracts — Edge Functions

### 7.1 Bootstrap User Data

```
GET /functions/v1/bootstrap-user-data
Authorization: Bearer <jwt>

Response 200:
{
  "mosques": [
    {
      "id": "uuid",
      "name": "Masjid Al-Falah",
      "address": "123 Main St",
      "latitude": 23.8103,
      "longitude": 90.4125,
      "contact_phone": "+880...",
      "madhab": "hanafi",
      "khutbah_language": "bengali",
      "facilities": { "wudu": true, "parking": true },
      "jamat_times": [
        { "prayer": "fajr", "time": "05:15:00+06", "trust_score": 85, "status": "live", "last_verified_at": "2026-04-08T..." }
      ],
      "last_confirmed_at": "2026-04-07T...",
      "confirmation_count": 12
    }
  ],
  "cached_at": "2026-04-09T12:00:00Z"
}

Max payload: 50KB gzipped for up to 5 mosques.
Cache: Upstash Redis, key=bootstrap:{user_id}, TTL=15min.
```

### 7.2 Mosque List by Proximity

```
GET /functions/v1/nearby-mosques?lat=23.8103&lng=90.4125&radius_km=10&limit=20
Authorization: Bearer <jwt>

Response 200:
{
  "mosques": [
    {
      "id": "uuid",
      "name": "Masjid Al-Falah",
      "distance_km": 0.4,
      "next_prayer": "asr",
      "next_jamat_time": "16:30:00+06",
      "next_trust_score": 85,
      "facilities": { "wudu": true, "parking": true }
    }
  ]
}

Query: SELECT *, ST_Distance(location, ST_Point(lng, lat)::geography) AS distance
       FROM mosques
       WHERE ST_DWithin(location, ST_Point(lng, lat)::geography, radius_km * 1000)
       ORDER BY distance
       LIMIT 20;
```

### 7.3 Submit Jamat Time

```
POST /functions/v1/submit-time
Authorization: Bearer <jwt>
Body:
{
  "mosque_id": "uuid",
  "prayer": "fajr",
  "time": "05:15",
  "effective_date": "2026-04-09",
  "note": "Confirmed with imam"  // optional, max 120 chars
}

Response 201: { "id": "uuid", "status": "live" | "pending", "trust_score": 55 }
Response 400: { "error": "TIME_OUT_OF_RANGE", "message": "Fajr time must be between 03:00 and 07:30" }
Response 422: { "error": "RULE_VELOCITY", "message": "You've submitted for too many mosques recently" }
Response 429: { "error": "FREQUENCY_CAP", "message": "Maximum 5 submissions per day reached" }
```

### 7.4 Check In

```
POST /functions/v1/check-in
Authorization: Bearer <jwt>
Body:
{
  "mosque_id": "uuid",
  "prayer": "asr",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "started_at": "2026-04-09T16:35:00+06"  // optional
}

Response 201: { "id": "uuid", "live_count": 14 }
Response 400: { "error": "OUTSIDE_GEOFENCE", "message": "You appear to be too far from this mosque" }
Response 400: { "error": "VELOCITY_LIMIT", "message": "You checked in recently elsewhere" }
Response 400: { "error": "OUTSIDE_WINDOW", "message": "Check-in window for this prayer has closed" }
Response 409: { "error": "DUPLICATE", "message": "You've already checked in for this prayer today" }
```

### 7.5 Confirm Mosque

```
POST /functions/v1/confirm-mosque
Authorization: Bearer <jwt>
Body:
{
  "mosque_id": "uuid",
  "latitude": 23.8103,
  "longitude": 90.4125
}

Response 201: { "confirmation_count": 13 }
Response 400: { "error": "OUTSIDE_GEOFENCE", "message": "You need to be near the mosque" }
Response 409: { "error": "COOLDOWN", "message": "You've already confirmed this mosque recently" }
```

### 7.6 Register Device Token

```
POST /functions/v1/register-token
Authorization: Bearer <jwt>
Body:
{
  "platform": "android" | "ios",
  "token": "fcm_or_apns_token"
}

Response 200: { "ok": true }
```

### 7.7 Deliver Notification (QStash Callback — Internal)

```
POST /functions/v1/deliver-notification
Headers: Upstash-Signature: <signature>
Body: (from QStash message)
{
  "user_id": "uuid",
  "mosque_name": "Masjid Al-Falah",
  "prayer": "asr",
  "jamat_time": "16:30",
  "lead_minutes": 15
}

→ Looks up user's FCM/APNs token
→ Sends push via Firebase Admin SDK / APNs
→ Updates notification_jobs status
```

---

## 8. Feature Specifications — Real MVP

### FR-001: Authentication
- **Supabase Auth**: Email OTP, Phone OTP, Google OAuth, Apple Sign-In
- **Onboarding**: display_name, language (en/ar/bn/ur), prayer_calc_method (mwl/isna/karachi/umm_al_qura)
- **Session**: Persisted in SecureStore, auto-refresh
- **Auth guard**: Root layout checks session, redirects to /auth/login if missing
- **AC**: User can register, log in, and remain authenticated across app restarts

### FR-002: Mosque List View
- **Screen**: `app/(tabs)/index.tsx`
- **Data**: Edge Function `nearby-mosques` with PostGIS
- **UI**: FlatList of MosqueCard components, sorted by distance
- **Search**: Client-side filter on fetched results by mosque name
- **Pull-to-refresh**: Re-fetch with current location
- **Empty state**: "No mosques found nearby" + expand radius prompt
- **Fallback**: City/area text search without GPS permission
- **AC**: User opens app, grants location, sees mosque list within 3 seconds

### FR-003: Mosque Profile
- **Screen**: `app/mosque/[id].tsx`
- **Data**: Direct Supabase query (mosque + jamat_times where status='live')
- **UI**: Photo, name, address, phone, schedule table, facility chips, check-in button
- **Trust badges**: Calculated from trust_score on each jamat_time row
- **AC**: User views complete jamat schedule in under 2 taps from home

### FR-004: Community Time Submission
- **Screen**: `app/submit-time/[mosqueId].tsx` (bottom sheet)
- **Validation**: Client-side range check (immediate feedback) + server-side (authoritative)
- **Ranges**: Fajr 03:00–07:30, Dhuhr 11:30–14:30, Asr 14:00–18:30, Maghrib 17:00–21:00, Isha 18:00–23:59, Jumuah 11:30–14:30
- **AC**: Valid time accepted; implausible rejected with message; pending labelled

### FR-005: Trust Score
- **Computation**: Edge Function on submission/check-in insert
- **Display**: TrustBadge component with green/amber/grey/red variants
- **Decay**: pg_cron Monday 02:00 UTC, -5/week, floor 10
- **AC**: Score computed, badges correct, decay works

### FR-006: Follow System
- **Data**: `follows` table with RLS
- **UI**: FollowButton (heart toggle) on mosque profile; My Mosques tab
- **Local cache**: Follow state in AsyncStorage for instant UI
- **Limit**: 50 follows max (server-enforced)
- **AC**: Follow/unfollow works, persists, shows in My Mosques

### FR-007: Notifications (Queue-Based)
- See [Section 11: Notification System Architecture](#11-notification-system-architecture)
- **AC**: Notification at correct lead time; time update reschedules; queue processes within 60s

### FR-008: Check-In
- **Window**: 30min before to 15min after posted jamat time
- **Geofence**: 300m via PostGIS ST_DWithin (server-side)
- **Velocity**: Reject if 2 different mosques within 20min
- **Live count**: Supabase Realtime subscription, 60s polling fallback
- **AC**: Within-range succeeds; duplicates/velocity rejected; count visible

### FR-008B: Lightweight Confirmation
- **No prayer window**: Available any time
- **Geofence**: 500m
- **Cooldown**: 1 per user per mosque per 30 days
- **Trust boost**: +2 to mosque-level score, capped at +10
- **AC**: Confirmation recorded; count visible on profile

### FR-009: Offline Caching
- **Bootstrap**: Single HTTP call → Expo SQLite
- **Payload budget**: Max 50KB gzipped (no photos)
- **Cache cap**: 5 followed mosques
- **Offline indicator**: "Last updated [timestamp]" banner
- **AC**: Offline user sees followed mosque times; Qibla and prayer times work

### FR-010: Prayer Times
- **Library**: `adhan-js` or custom implementation of standard algorithms
- **Methods**: MWL (default), ISNA, Karachi, Umm Al-Qura
- **Display**: 5 prayer times + countdown to next
- **Integration**: Show mosque jamat time alongside calculated time for followed mosques
- **AC**: Correct times for GPS location across all 4 methods

### FR-011: Qibla Finder
- **Sensors**: `expo-sensors` (magnetometer) + `expo-location` (GPS)
- **Calculation**: Great circle bearing from user GPS to Kaaba (21.4225°N, 39.8262°E)
- **UI**: Animated compass with Qibla needle
- **Offline**: Uses last-known GPS from AsyncStorage
- **AC**: Correct bearing, updates on rotation, works offline

---

## 9. Feature Specifications — Phase 1.5

### FR-012: Map View
- **Library**: `react-native-maps` with Google Maps SDK
- **UI**: Toggle between list/map; clustered pins; summary card on tap
- **Filter**: Distance, facilities, madhab

### FR-013: Delay Indicator
- **Threshold**: Minimum 5 check-ins in 30 days for mosque/prayer
- **Calculation**: Mean of delta_minutes, excluding outliers (>30min or <-10min)
- **Cache**: Upstash Redis, key=delay:{mosque_id}:{prayer}, TTL=1hr
- **Display**: "Usually starts X minutes late/early/on time"

### FR-014: Next Prayer Suggestion
- **Logic**: For mosques within 5km, filter where (now + distance/40kmh) < jamat_time
- **Display**: Top 3 cards with name, distance, time, minutes remaining

### FR-015: Per-Mosque Notifications
- **Data**: `follows.notification_prefs` JSONB
- **UI**: Per-prayer toggle + lead time on mosque profile

### FR-016: Trust Tiers with Activity Window
- **Tiers**: New (0–4), Regular (5–19), Trusted (20+), Admin
- **Activity window**: 60 days; checked by pg_cron; demotion reversible
- **Warning**: Push 7 days before demotion

### FR-017: Rule-Based Moderation
- **5 rules**: Time range, velocity, duplicate, frequency cap, admin lock
- **All server-side**: Edge Function, logged to moderation_log

### FR-024: Seasonal Detection
- **Trigger**: 45+ days since update AND 15+ min sunrise/sunset shift
- **Prompt**: Push to admin + last 3 submitters + top 3 check-in users

### FR-025: Admin Quick-Update
- **Channel**: Twilio SMS/WhatsApp
- **Flow**: Daily prompt → admin replies with time → Edge Function parses and writes

---

## 10. Feature Specifications — Phase 2

*(AC to be defined in Phase 2 SRS. High-level scope only.)*

- Mosque admin claiming and verified profiles
- Structured announcements (Janazah, time changes, Eid, events)
- Community reactions on announcements (no open comments)
- Gamification — stewardship badges and contribution history
- Ramadan Mode — auto-activate, Tarawih/Iftar prompts
- AI moderation via OpenAI API
- Multilingual support: Arabic, Urdu, Bengali, Turkish
- Mosque analytics dashboard
- Full Best Mosque Finder with confidence ranking

---

## 11. Notification System Architecture

### Pipeline Overview

```
jamat_times status → live
       │
       ▼
 schedule-notifications (Edge Function)
       │
       ├── Query follows table for mosque followers
       ├── For each follower: compute scheduled_time = jamat_time - lead_minutes
       ├── Batch enqueue to QStash (50 per batch)
       ├── Tag each message: {mosque_id}:{prayer}:{date}
       ├── Dedup key: {mosque_id}:{prayer}:{date}:{user_id}
       └── Write to notification_jobs table
       
 ... time passes ...
       
 QStash delivers at scheduled_time
       │
       ▼
 deliver-notification (Edge Function)
       │
       ├── Verify QStash signature
       ├── Look up user FCM/APNs token
       ├── Send push via Firebase Admin SDK
       ├── Update notification_jobs.status
       └── On failure: QStash retries (30s, 120s, 480s)
```

### Cancellation on Time Update

When a jamat_time is updated (new submission goes live for same mosque/prayer/date):

1. Cancel all QStash messages with tag `{mosque_id}:{prayer}:{date}`
2. Delete corresponding `notification_jobs` rows with status='queued'
3. Re-run schedule-notifications with the new time

### Monitoring

- Log enqueue count, delivery success, retry count to moderation_log
- Dashboard query: `SELECT status, COUNT(*) FROM notification_jobs WHERE date = CURRENT_DATE GROUP BY status`

---

## 12. Caching Strategy

| Layer | Tool | What | TTL | Invalidation |
|---|---|---|---|---|
| Server | Upstash Redis | Bootstrap data per user | 15 min | On follow/unfollow or jamat_time update |
| Server | Upstash Redis | Delay indicator per mosque/prayer | 1 hour | On new check-in |
| Server | Upstash Redis | Check-in count per mosque/prayer/date | 24 hours | Increment on insert |
| Server | Upstash Redis | Rate limit counters | 1 hour | Auto-expire |
| Client | Expo SQLite | Followed mosque data | Until refresh | Refreshed on bootstrap call |
| Client | AsyncStorage | Last-known GPS | Indefinite | Updated on each location fix |
| Client | AsyncStorage | User preferences (theme, calc method) | Indefinite | Updated on change |
| Client | AsyncStorage | Follow state (IDs only) | Indefinite | Synced with server on launch |

---

## 13. Offline Architecture

```
App Launch
    │
    ├── Internet available?
    │       │
    │       YES → Call bootstrap endpoint → Update SQLite → Show fresh data
    │       │
    │       NO  → Read SQLite → Show cached data + offline banner
    │
    ├── Qibla: Always client-side (last GPS from AsyncStorage)
    ├── Prayer times: Always client-side (last GPS)
    ├── Check-in: Requires internet (geofence validation server-side) → Show "Requires internet" message
    ├── Submission: Requires internet → Queue locally, submit when online
    └── Follow/unfollow: Optimistic UI → Sync when online
```

---

## 14. Testing Strategy

### Unit Tests (Jest)

| Module | Tests |
|---|---|
| `lib/prayerTimes.ts` | All 4 calc methods × 10 known cities = 40 test cases |
| `lib/qibla.ts` | 10 known city→Kaaba bearings |
| `lib/trustScore.ts` | Score composition, decay, cap, conflict |
| `lib/timeValidation.ts` | All prayer ranges, edge cases, rejection |
| `lib/distance.ts` | Haversine against known distances |

### Integration Tests

| Flow | Tests |
|---|---|
| Auth | Register → Onboard → Session persist → Logout |
| Submission | Submit valid → Submit invalid → Duplicate → Rate limit |
| Check-in | In-range → Out-of-range → Velocity → Duplicate |
| Follow | Follow → My Mosques shows → Unfollow → Gone |
| Offline | Bootstrap → Kill network → SQLite serves data |

### E2E Tests (Detox or Maestro)

| Critical Path | Steps |
|---|---|
| First-time user | Open → Auth → Onboard → Grant location → See mosques |
| Core loop | Find mosque → View profile → Check in → Follow |
| Submission | Open profile → Submit time → See pending badge |

---

## 15. CI/CD Pipeline

### Tools

- **Build**: EAS Build (Expo Application Services)
- **Preview**: EAS Update (OTA updates for JS-only changes)
- **Store**: EAS Submit (App Store + Play Store)

### Pipeline

```
Push to main
    │
    ├── Lint + Type Check (eslint + tsc)
    ├── Unit Tests (jest)
    ├── Build Preview (EAS Build — internal distribution)
    │
    └── On tag v*.*.*:
        ├── Production Build (EAS Build — store)
        └── Submit (EAS Submit → App Store Connect + Google Play Console)
```

---

## 16. Performance Budgets

| Metric | Target | How to Measure |
|---|---|---|
| JS bundle size | < 2MB (compressed) | `npx expo export --dump-sourcemap` |
| Cold start (mid-range Android) | < 4s | Manual timing on Moto G Play or equivalent |
| Mosque list load | < 2s | Supabase dashboard → Edge Function logs |
| Bootstrap (cache hit) | < 1s | Upstash Redis latency |
| Bootstrap (cache miss) | < 3s | Supabase Edge Function duration |
| SQLite read | < 500ms | In-app performance logging |
| Memory (idle) | < 150MB | Android Profiler / Xcode Instruments |
| FlatList render (20 items) | < 16ms per frame | React DevTools Profiler |

---

## 17. Security Checklist

- [ ] Supabase Anon Key is public (safe) — no service role key in client
- [ ] All write operations go through Edge Functions (not direct table insert)
- [ ] RLS enabled on every table
- [ ] Geofence validation is server-side only (PostGIS in Edge Function)
- [ ] GPS coordinates discarded after geofence check (not stored)
- [ ] JWT refresh rotation enabled
- [ ] Rate limiting on all public Edge Functions (100 req/min/IP)
- [ ] QStash webhook signature verified in deliver-notification
- [ ] Twilio webhook signature verified in admin-quick-update
- [ ] No sensitive data in AsyncStorage (use SecureStore for tokens)
- [ ] HTTPS enforced (Supabase default)
- [ ] Deep link validation (no open redirects)

---

## 18. RTL & Internationalization

### Setup

```typescript
// src/i18n/index.ts
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

// Force RTL for Arabic and Urdu
const rtlLanguages = ['ar', 'ur'];
const isRTL = rtlLanguages.includes(i18n.language);
I18nManager.forceRTL(isRTL);
```

### Language Support

| Phase | Languages |
|---|---|
| MVP | English (default), Arabic (RTL), Bengali |
| Phase 1.5 | + Urdu (RTL) |
| Phase 2 | + Turkish, Bahasa, French |

### String Key Conventions

```json
{
  "mosques.list.title": "Mosques Near You",
  "mosques.list.empty": "No mosques found nearby",
  "mosque.profile.schedule": "Jamat Schedule",
  "prayer.fajr": "Fajr",
  "badge.verified": "Verified",
  "checkin.button": "Check In",
  "checkin.live_count": "{{count}} people checked in",
  "error.outside_geofence": "You appear to be too far from this mosque"
}
```

---

## 19. Error Handling Standards

### Client-Side

```typescript
// Every API call wrapped in try/catch with typed error handling
try {
  const result = await api.submitTime(data);
  toast.success('Time submitted!');
} catch (error) {
  if (error.code === 'TIME_OUT_OF_RANGE') {
    toast.error(t(`error.${error.code}`)); // Human-readable from i18n
  } else if (error.code === 'NETWORK_ERROR') {
    toast.error(t('error.offline'));
  } else {
    toast.error(t('error.generic'));
    captureException(error); // Crash reporting
  }
}
```

### Server-Side (Edge Functions)

All Edge Functions return structured errors:

```typescript
return new Response(
  JSON.stringify({
    error: 'RULE_CODE',        // Machine-readable
    message: 'Human message',   // For direct display
    details: {}                 // Optional debug info (never sent in prod)
  }),
  { status: 400 | 409 | 422 | 429 }
);
```

### Error Code Registry

| Code | HTTP | User Message |
|---|---|---|
| `TIME_OUT_OF_RANGE` | 400 | "This time seems unusual for [Prayer] prayer" |
| `OUTSIDE_GEOFENCE` | 400 | "You appear to be too far from this mosque to check in" |
| `VELOCITY_LIMIT` | 400 | "You checked in recently elsewhere — please wait" |
| `OUTSIDE_WINDOW` | 400 | "Check-in window for this prayer has closed" |
| `DUPLICATE` | 409 | "You've already done this today" |
| `RULE_VELOCITY` | 422 | "You've submitted for too many mosques recently" |
| `FREQUENCY_CAP` | 429 | "Maximum 5 submissions per day reached" |
| `ADMIN_PARSE_ERROR` | 422 | "Sorry, I didn't understand. Reply with a time like 5:30" |
| `COOLDOWN` | 409 | "You've already confirmed this mosque recently" |

---

## 20. Deployment Checklist

### Pre-Launch (Week before soft launch)

- [ ] 50+ mosques seeded in database with Admin trust scores
- [ ] 10+ mosque admin accounts invited and onboarded
- [ ] 20+ contributor volunteers registered with Trusted status
- [ ] Supabase upgraded to Pro plan ($25/month)
- [ ] Firebase project created, FCM configured
- [ ] Upstash Redis and QStash accounts provisioned
- [ ] Apple Developer account + App Store Connect listing created
- [ ] Google Play Console listing created
- [ ] Privacy policy published (GDPR compliant)
- [ ] App Store review submitted (allow 3–7 day review window)
- [ ] Play Store review submitted (allow 1–3 day review window)
- [ ] Crash reporting configured (Sentry or equivalent)
- [ ] pg_cron job for trust decay scheduled (Monday 02:00 UTC)
- [ ] QStash webhook endpoint tested end-to-end
- [ ] All Edge Functions deployed and smoke-tested
- [ ] Performance tested on mid-range Android device (cold start < 4s)
- [ ] RTL layout verified for Arabic

### Launch Day (Friday — Jumu'ah)

- [ ] App Store and Play Store listings go live
- [ ] Partner mosques mention app in Friday announcement
- [ ] Social media posts scheduled
- [ ] Monitoring dashboard open (Supabase, Upstash, Firebase)
- [ ] Support channel ready (email or WhatsApp group)

---

*This specification is versioned with the app. Update it when requirements change. Every AI agent session should reference this file for implementation decisions.*
