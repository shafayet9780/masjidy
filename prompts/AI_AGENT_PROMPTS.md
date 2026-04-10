# Masjidy — AI Agent Prompt List for Cursor (Plan Mode)

> **How to use this file**: Each prompt below is designed to be given to Cursor in **Plan Mode** (or Claude Code with `/plan`). Give the agent the `PROJECT_SPEC.md` and `DESIGN_SYSTEM.md` files as context first, then feed prompts one at a time in order. Wait for the plan to be generated, review it, then execute.

> **Context files to always include**:
> - `PROJECT_SPEC.md` (this is the primary reference)
> - `DESIGN_SYSTEM.md` (for any UI work)
> - The relevant section of `Masjidy_SRS_v1_3.docx` if clarification needed

---

## Phase 0 — Project Setup & Foundation

### Prompt 0.1 — Initialize Project

```
I'm building "Masjidy" — an Islamic community app for mosque discovery and jamat time tracking. 

Initialize a new Expo project with the following:
- Expo SDK 55 with TypeScript
- Expo Router (file-based routing) 
- NativeWind v4 with Tailwind CSS
- The exact folder structure defined in PROJECT_SPEC.md Section 3

Set up:
1. tsconfig.json with path aliases (@/ for src/)
2. tailwind.config.js with the theme tokens from DESIGN_SYSTEM.md Section 3 (CSS variable approach)
3. .eslintrc.js and .prettierrc with standard React Native config
4. app.json with all iOS/Android permissions listed in PROJECT_SPEC.md Section 4
5. .env.example with all variables from PROJECT_SPEC.md Section 4 (no real values)

Create placeholder files for every screen and component listed in the folder structure — just empty exported components with the component name as text. This establishes the skeleton.

Do NOT install react-native-maps yet (Phase 1.5 only).
```

### Prompt 0.2 — Theme System

```
Implement the complete theme system for Masjidy based on DESIGN_SYSTEM.md:

1. Create src/theme/themes.ts with all 4 themes (Emerald Oasis, Desert Sand, Midnight Minaret, Ocean Breeze) × 2 modes (light/dark) = 8 color maps. Use the exact hex values from the design system.

2. Create src/theme/tokens.ts with spacing scale, border radius, and semantic color token mappings.

3. Create src/theme/ThemeProvider.tsx:
   - React Context with activeTheme, colorMode, resolvedColorMode
   - colorMode 'system' should follow device appearance via useColorScheme()
   - Persist theme selection in AsyncStorage
   - Expose setTheme() and setColorMode()
   - Apply CSS variables that NativeWind classes resolve to

4. Create src/theme/gluestack.config.ts that maps Gluestack UI tokens to our CSS variables.

5. Create src/hooks/useTheme.ts hook that provides typed access to current colors.

6. Update tailwind.config.js to use CSS variable references for all custom colors.

7. Update app/_layout.tsx to wrap everything in ThemeProvider + GluestackUIProvider.

Default theme: Emerald Oasis, color mode: system.
```

### Prompt 0.3 — Font & Icon Setup

```
Set up fonts and icons for Masjidy:

1. Install and configure expo-font with:
   - Inter (400, 500, 600, 700)
   - Noto Sans Arabic (400)
   - JetBrains Mono (400, 500)

2. Create a font loading component that shows a splash screen until fonts are ready.

3. Install phosphor-react-native. Verify it works by creating a test component that renders 5 different icons in different weights.

4. Create src/components/ui/ base components that wrap Gluestack primitives with our theme tokens:
   - Button.tsx (Primary, Secondary, Ghost, Danger, Accent variants)
   - Card.tsx (elevated surface with radius-md, shadow-card)
   - Badge.tsx (trust badge variants: verified/community/unverified/stale with icon + color + text)
   - Input.tsx (with label, error state, RTL-aware)
   - Skeleton.tsx (shimmer animation using reanimated)

Each component should use NativeWind classes that resolve to our theme CSS variables. No hardcoded colors.
```

### Prompt 0.4 — Supabase Setup

```
Set up the Supabase backend for Masjidy:

1. Create src/services/supabase.ts:
   - Initialize Supabase client with expo-secure-store for session persistence
   - Use environment variables from .env
   - Configure auto-refresh and persist session

2. Create ALL database migration files in supabase/migrations/ based on PROJECT_SPEC.md Section 5:
   - 001_create_enums.sql — all enum types
   - 002_create_tables.sql — all tables with exact column definitions, types, constraints, indexes
   - 003_create_rls_policies.sql — all RLS policies
   - 004_create_functions.sql — pg_cron job for trust decay (Monday 02:00 UTC)

3. Create scripts/generate-types.ts that runs `supabase gen types typescript` and outputs to src/types/database.ts.

4. Create src/types/mosque.ts, src/types/user.ts with TypeScript interfaces that map to the database tables.

Make sure every table has the PostGIS extension for the mosques.location column. Include the CREATE EXTENSION IF NOT EXISTS postgis; statement.
```

### Prompt 0.5 — Navigation Shell

```
Build the navigation shell for Masjidy using Expo Router:

1. app/_layout.tsx — Root layout:
   - Auth guard: check Supabase session, redirect to /auth/login if not authenticated
   - Wrap in ThemeProvider, GluestackUIProvider, SafeAreaProvider
   - Handle font loading
   - Show splash screen while loading

2. app/(tabs)/_layout.tsx — Bottom tab navigator:
   - 5 tabs as defined in DESIGN_SYSTEM.md Section 8.1:
     - Mosques (MosqueStraight icon), My Mosques (Heart), Prayer Times (Clock), Qibla (Compass), Profile (User)
   - Active tab: Bold weight icon + primary color
   - Inactive tab: Regular weight icon + text-secondary color
   - Tab bar height: 56px + safe area
   - Tab bar background: surface-elevated color

3. Set up stack navigation within the Mosques tab:
   - index.tsx → mosque/[id].tsx → submit-time/[mosqueId].tsx

4. Style the tab bar using NativeWind classes with theme-aware colors. No hardcoded colors.
```

---

## Phase 1 — Real MVP Features

### Prompt 1.1 — Authentication Flow

```
Implement the complete authentication flow for Masjidy based on FR-001 in PROJECT_SPEC.md:

1. app/auth/login.tsx:
   - Clean login screen with Masjidy logo at top
   - 4 auth methods: Email OTP, Phone OTP, Google Sign-In, Apple Sign-In
   - Use Supabase Auth for all methods
   - Email OTP: input email → call supabase.auth.signInWithOtp → show OTP input → verify
   - Phone OTP: input phone (with country code picker) → signInWithOtp → verify
   - Google: supabase.auth.signInWithOAuth({ provider: 'google' })
   - Apple: supabase.auth.signInWithOAuth({ provider: 'apple' })
   - Loading states, error handling with user-friendly messages

2. app/auth/onboarding.tsx:
   - Shown only on first login (check if users row exists)
   - Fields: display_name (required), language (picker: English/Arabic/Bengali/Urdu), prayer_calc_method (picker: MWL/ISNA/Karachi/Umm Al-Qura with pilot-city default)
   - On submit: INSERT into users table, navigate to home

3. src/hooks/useAuth.ts:
   - Supabase auth state listener
   - session, user, isLoading, isAuthenticated
   - signOut function
   - Profile data from users table

4. Auth guard in root layout: redirect to login if no session, to onboarding if session exists but no users row.
```

### Prompt 1.2 — Mosque List & Discovery

```
Implement mosque discovery (FR-002) for Masjidy:

1. src/hooks/useLocation.ts:
   - Request location permission with clear explanation
   - Get current GPS coordinates
   - Store last-known location in AsyncStorage for offline fallback
   - Handle permission denied gracefully (show city search fallback)

2. supabase/functions/nearby-mosques/index.ts — Edge Function:
   - Accept query params: lat, lng, radius_km (default 10), limit (default 20)
   - PostGIS query: ST_DWithin for proximity, ST_Distance for sorting
   - Join with jamat_times (status='live') to get next prayer time
   - Return: id, name, distance_km, next_prayer, next_jamat_time, next_trust_score, facilities
   - Validate JWT auth

3. src/hooks/useMosques.ts:
   - Call nearby-mosques Edge Function with current location
   - Return data, loading, error, refetch
   - Client-side search filter by mosque name

4. app/(tabs)/index.tsx — Mosque List Screen:
   - FlatList of MosqueCard components
   - Pull-to-refresh
   - Search bar at top (client-side filter)
   - Empty state component when no mosques found
   - Skeleton loading state (MosqueCardSkeleton × 5)
   - "Near You · X mosques found" header

5. src/components/mosque/MosqueCard.tsx:
   - Layout as defined in DESIGN_SYSTEM.md Section 7.3
   - Mosque name, distance, next prayer + time, trust badge, facility chips
   - Follow button (heart) on right side
   - Tap navigates to mosque/[id]
   - Use NativeWind classes, theme-aware colors
```

### Prompt 1.3 — Mosque Profile

```
Implement the mosque profile screen (FR-003):

1. src/hooks/useMosqueProfile.ts:
   - Fetch mosque by ID from Supabase (direct query, not Edge Function)
   - Join jamat_times WHERE status='live', ordered by prayer enum
   - Include trust_score and last_verified_at per prayer
   - Return mosque, jamatTimes, isLoading, error

2. app/mosque/[id].tsx — Mosque Profile Screen:
   - Full layout as shown in DESIGN_SYSTEM.md Section 11.2
   - Photo at top (or placeholder SVG)
   - Name, address, tap-to-call phone, madhab, khutbah language
   - PrayerTimeTable component with all 6 prayers (5 daily + Jumuah)
   - FacilityChip row
   - CheckInButton (large, prominent)
   - ConfirmMosqueButton ("I've Been Here" secondary)
   - "Submit a Time" CTA at bottom
   - FollowButton in header

3. src/components/mosque/PrayerTimeTable.tsx:
   - Table layout: Prayer Name | Time | TrustBadge
   - Each row is a PrayerTimeRow
   - Empty time shows "-- : --" with grey badge and "Be the first to add this time" CTA
   - Stale time (trust < 10) shown in red with "Verify Now" button

4. src/components/mosque/TrustBadge.tsx:
   - 4 variants: verified (green, shield-check), community (amber, users), unverified (grey, question), stale (red, warning)
   - Always shows icon + color + text label (color-blind safe)
   - Size variants: sm (inline with time), md (standalone)

5. src/components/mosque/FacilityChip.tsx:
   - Small chip with Phosphor icon + label
   - Facilities: Wudu (Drop), Parking (Car), Women's Section (GenderFemale), Wheelchair (WheelchairMotion), Children (Baby)
```

### Prompt 1.4 — Time Submission

```
Implement community time submission (FR-004):

1. supabase/functions/submit-time/index.ts — Edge Function:
   - Validate JWT
   - Parse body: mosque_id, prayer, time, effective_date, note
   - Server-side validation:
     - Prayer range check (Fajr 03:00-07:30, etc.)
     - Duplicate check (same user+mosque+prayer within 24h)
     - Frequency cap (max 5/day for user)
     - Velocity check (3+ different mosques in 60min)
   - Determine status based on user tier (new_user → pending, others → live)
   - Calculate initial trust_score based on tier
   - INSERT into jamat_times
   - Write to contributor_log
   - Return { id, status, trust_score }
   - On rejection: return specific error code + human message

2. src/hooks/useSubmitTime.ts:
   - Client-side pre-validation (range check for instant feedback)
   - Call submit-time Edge Function
   - Handle all error codes with i18n messages

3. src/components/mosque/SubmissionForm.tsx:
   - Bottom sheet (Gluestack Actionsheet)
   - Prayer picker (Select component with all 6 prayers)
   - Time input (hours:minutes with AM/PM)
   - Date picker (default today)
   - Note field (optional, max 120 chars with counter)
   - Submit button with loading state
   - Client-side validation errors shown inline
   - Success toast on completion

4. app/submit-time/[mosqueId].tsx:
   - Wrapper that loads mosque name for header
   - Renders SubmissionForm
```

### Prompt 1.5 — Trust Score System

```
Implement the trust score system (FR-005):

1. src/lib/trustScore.ts — Pure utility (mirrors server logic):
   - calculateTrustScore(submission, checkins, tier) → number
   - Base score by tier: admin=100, trusted=70, regular=55, new_user=40
   - Check-in boost: +5 per confirming check-in, capped at +25
   - Confirmation boost: +2 per mosque confirmation, capped at +10
   - Conflict penalty: -10 when same-tier disagreement
   - getBadgeForScore(score) → { label, color, icon, variant }
   - Thresholds: 80-100=verified, 50-79=community, 10-49=unverified, <10=stale

2. Update supabase/functions/on-submission-insert/index.ts — Edge Function:
   - Triggered AFTER INSERT on jamat_times
   - Run 5 moderation rules (from FR-017 spec)
   - Calculate trust score
   - Update submission status (pending/live/rejected)
   - Write to contributor_log
   - Call update-contributor-tier if submission accepted

3. supabase/functions/decay-trust-scores/index.ts:
   - Called by pg_cron every Monday 02:00 UTC
   - Apply -5 to all jamat_times not verified in past 7 days
   - Floor at 10
   - Also check contributor activity windows (FR-016):
     - Query users WHERE tier IN ('regular', 'trusted') AND tier_last_active_at < now() - interval '60 days'
     - Demote: trusted → regular, regular → new_user
     - Send 7-day warning notification for users at 53 days inactive
```

### Prompt 1.6 — Follow System

```
Implement the follow system (FR-006):

1. src/hooks/useFollows.ts:
   - followMosque(mosqueId) — INSERT into follows
   - unfollowMosque(mosqueId) — DELETE from follows
   - isFollowing(mosqueId) — check local state
   - followedMosques — list for My Mosques tab
   - Optimistic UI: update local state immediately, revert on error
   - Cache follow IDs in AsyncStorage for instant UI on app launch

2. src/components/mosque/FollowButton.tsx:
   - Heart icon toggle (Heart regular → Heart fill)
   - Animated transition (scale bounce, 200ms)
   - Haptic feedback on follow
   - Uses useFollows hook

3. app/(tabs)/my-mosques.tsx — My Mosques Screen:
   - FlatList of followed mosques using MosqueCard
   - Sorted by next jamat time
   - Empty state: "Follow mosques to see them here" with illustration + CTA to browse
   - Pull-to-refresh
```

### Prompt 1.7 — Notification System

```
Implement the queue-based notification system (FR-007) as specified in PROJECT_SPEC.md Section 11:

1. src/hooks/useNotifications.ts:
   - Request push notification permission
   - Get FCM/APNs device token
   - Register token with Supabase via register-token Edge Function
   - Handle notification received (foreground + background)
   - Handle notification tapped (navigate to mosque profile)

2. supabase/functions/register-token/index.ts:
   - Accept platform + token
   - Update users.fcm_token or users.apns_token
   - Validate JWT

3. supabase/functions/schedule-notifications/index.ts:
   - Triggered when jamat_time status changes to 'live'
   - Query follows table for all followers of that mosque
   - For each follower:
     - Compute scheduled_time = jamat_time - user's lead_minutes
     - Skip if scheduled_time is in the past
   - Batch enqueue to QStash (50 per batch):
     - URL: deliver-notification endpoint
     - Delay: until scheduled_time
     - Tag: {mosque_id}:{prayer}:{date}
     - Dedup key: {mosque_id}:{prayer}:{date}:{user_id}
   - On time UPDATE (same mosque/prayer/date):
     - Cancel all QStash messages with matching tag
     - Delete notification_jobs with status='queued'
     - Re-enqueue with new time
   - Write to notification_jobs table

4. supabase/functions/deliver-notification/index.ts:
   - QStash callback endpoint
   - Verify QStash signature (Upstash-Signature header)
   - Look up user's FCM/APNs token from users table
   - Send push: "[Mosque Name] — [Prayer] in [X] minutes"
   - Update notification_jobs.status to 'delivered'
   - On failure: let QStash retry (3x exponential backoff)
   - On final failure: update status to 'failed', log error

5. Global notification settings screen (app/settings/notifications.tsx):
   - Lead time picker: 10, 15, or 30 minutes
   - Saves to users.notification_lead_minutes
```

### Prompt 1.8 — Check-In System

```
Implement both check-in types (FR-008 + FR-008B):

1. supabase/functions/check-in/index.ts — Edge Function:
   - Validate JWT
   - Parse: mosque_id, prayer, latitude, longitude, started_at (optional)
   - Geofence: ST_DWithin(mosque.location, user_point, 300) — reject if false
   - Window: posted jamat_time - 30min to + 15min — reject if outside
   - Velocity: check if user has check-in at different mosque within 20min
   - Duplicate: unique constraint on (user_id, mosque_id, prayer, date)
   - On success:
     - INSERT check_in
     - Calculate delta_minutes if started_at provided
     - Call trust score recalculation for winning submission
     - Update user's tier_last_active_at
   - Return { id, live_count }

2. supabase/functions/confirm-mosque/index.ts — Edge Function:
   - Validate JWT
   - Geofence: ST_DWithin 500m
   - Cooldown: 1 per user per mosque per 30 days
   - On success:
     - INSERT mosque_confirmation
     - UPDATE mosque: confirmation_count + 1, last_confirmed_at = now()
     - Add +2 to mosque trust (capped at +10 from confirmations)
   - Return { confirmation_count }

3. src/hooks/useCheckIn.ts:
   - checkIn(mosqueId, prayer, location, startedAt?) → result
   - Handle all error codes
   - Live count subscription via Supabase Realtime:
     - Subscribe to check_ins table changes for mosque_id + prayer + today
     - Count inserts
   - Polling fallback: 60s interval if Realtime disconnects

4. src/components/mosque/CheckInButton.tsx:
   - Large tap target (full width, 56px height)
   - States: available, loading, success (animated), unavailable (outside window), disabled (already checked in)
   - Success animation: scale bounce + green check + haptic
   - Shows live count: "X people checked in for [Prayer]"

5. src/components/mosque/ConfirmMosqueButton.tsx:
   - Secondary style button: "📍 I've Been Here"
   - Shows last confirmed date and count
   - Disabled if within 30-day cooldown
   - Success toast on completion

6. src/components/mosque/LiveCount.tsx:
   - Animated number display
   - Pulse animation when count increases
   - "[N] people checked in" text
```

### Prompt 1.9 — Offline Caching

```
Implement offline-first caching (FR-009):

1. supabase/functions/bootstrap-user-data/index.ts:
   - Validate JWT
   - Check Upstash Redis cache: key=bootstrap:{user_id}, TTL=15min
   - On cache miss:
     - Query follows for user's followed mosques (max 5)
     - For each mosque: fetch profile + jamat_times (status='live')
     - NO photos in payload — only structured data
     - Ensure total payload < 50KB gzipped
   - Return JSON with mosques array + cached_at timestamp

2. src/services/offline.ts:
   - SQLite operations using expo-sqlite:
     - initDatabase() — create tables mirroring mosque and jamat_times structure
     - saveMosqueData(mosques) — bulk upsert from bootstrap response
     - getMosqueData() — read all cached mosques
     - getMosqueById(id) — read single mosque with jamat times
     - clearCache() — wipe on logout
     - getLastSyncTimestamp() — for "Last updated" display

3. src/hooks/useBootstrap.ts:
   - On app launch with internet: call bootstrap → save to SQLite
   - On app launch without internet: read from SQLite
   - Return { mosques, isOffline, lastSynced, refresh }

4. src/hooks/useOffline.ts:
   - Monitor network state via @react-native-community/netinfo
   - Return { isOnline, isOffline }

5. src/components/ui/OfflineBanner.tsx:
   - Sticky banner at top of screen when offline
   - "Offline — showing cached data from [relative time]"
   - Yellow/amber background, dismissible but re-appears on navigation
   - Animated slide-down entrance (300ms)

6. Update My Mosques tab to read from SQLite when offline.
7. Update Mosque Profile to fall back to SQLite when offline.
```

### Prompt 1.10 — Prayer Times & Qibla

```
Implement prayer times (FR-010) and Qibla (FR-011):

1. src/lib/prayerTimes.ts:
   - Implement prayer time calculation for 4 methods:
     - Muslim World League (MWL): Fajr 18°, Isha 17°
     - ISNA: Fajr 15°, Isha 15°
     - University of Karachi: Fajr 18°, Isha 18°
     - Umm Al-Qura: Fajr 18.5°, Isha 90min after Maghrib
   - Input: latitude, longitude, date, method
   - Output: { fajr, sunrise, dhuhr, asr, maghrib, isha } as Date objects
   - Use standard astronomical calculations (solar position, equation of time)
   - Consider using adhan-js library if available, otherwise implement from scratch

2. src/lib/qibla.ts:
   - calculateQiblaBearing(lat, lng) → degrees from North
   - Kaaba coordinates: 21.4225°N, 39.8262°E
   - Great circle formula

3. src/hooks/usePrayerTimes.ts:
   - Get user's location (or last-known from AsyncStorage)
   - Get user's preferred calculation method from profile
   - Calculate today's times
   - Determine current/next prayer
   - Countdown timer (updates every second)
   - If user follows a mosque, include jamat time alongside calculated time

4. src/hooks/useQibla.ts:
   - Get GPS for bearing calculation
   - Subscribe to magnetometer for compass heading
   - Combine: qibla_direction = qibla_bearing - compass_heading
   - Handle compass calibration alert
   - Works offline using AsyncStorage GPS

5. app/(tabs)/prayer-times.tsx:
   - Today's date and location
   - 5 prayer time cards (calculated time, and jamat time if following a mosque)
   - Countdown to next prayer (circular progress + digital)
   - Current prayer highlighted with primary color
   - Past prayers dimmed

6. app/(tabs)/qibla.tsx:
   - Full-screen compass
   - Animated needle pointing to Qibla (smooth rotation using reanimated)
   - Degrees displayed: "Qibla is X° from North"
   - Calibration prompt when accuracy is low
   - Works fully offline

7. src/components/prayer/PrayerCountdown.tsx:
   - Circular progress ring
   - Hours:minutes:seconds in JetBrains Mono font
   - Prayer name and calculated time below
```

### Prompt 1.11 — Pre-Launch Seeding

```
Create the pre-launch mosque seeding infrastructure:

1. scripts/seed-mosques.ts:
   - TypeScript script runnable via `npx tsx scripts/seed-mosques.ts`
   - Reads from a JSON file: scripts/seed-data/mosques.json
   - JSON format:
     {
       "mosques": [
         {
           "name": "Masjid Al-Falah",
           "address": "123 Main St, Dhaka",
           "latitude": 23.8103,
           "longitude": 90.4125,
           "contact_phone": "+8801XXXXXXXXX",
           "madhab": "hanafi",
           "khutbah_language": "bengali",
           "facilities": { "wudu": true, "parking": true, "womens_section": true },
           "jamat_times": {
             "fajr": "05:15", "dhuhr": "13:15", "asr": "16:30",
             "maghrib": "18:45", "isha": "20:30", "jumuah": "13:30"
           }
         }
       ]
     }
   - For each mosque:
     - INSERT mosque with PostGIS point from lat/lng
     - INSERT jamat_times for all prayers with trust_score=100, status='live'
   - Uses Supabase service role key (from .env)
   - Outputs: summary of inserted mosques + times

2. scripts/seed-data/mosques.json — Template with 3 example mosques (user will fill in real data)

3. Add to scripts/README.md with usage instructions
```

---

## Phase 1.5 Prompts

### Prompt 1.5.1 — Map View

```
Implement the mosque map view (FR-012):

1. Install react-native-maps and configure Google Maps SDK:
   - Add GOOGLE_MAPS_API_KEY to .env
   - Configure for both iOS (Info.plist) and Android (AndroidManifest.xml)

2. Update app/(tabs)/index.tsx:
   - Add list/map toggle button in header
   - When map mode: show MapView with mosque pins
   - When list mode: show existing FlatList

3. Create src/components/mosque/MosqueMap.tsx:
   - Google Maps with user location marker
   - Custom pin markers for each mosque
   - Cluster pins at low zoom (use react-native-map-clustering)
   - Pin tap shows summary card (name, distance, next prayer, trust badge)
   - Card tap navigates to full mosque profile

4. Add filter panel:
   - Bottom sheet with filters: distance slider, facility toggles, madhab picker
   - Filters apply to both list and map views
   - Filter state managed in hook, persisted in AsyncStorage
```

### Prompt 1.5.2 — Delay Indicator

```
Implement the smart delay indicator (FR-013):

1. supabase/functions/recalculate-delay/index.ts:
   - Called after each check-in with started_at
   - Fetch last 30 days of delta_minutes for mosque/prayer
   - Filter outliers: exclude > 30min or < -10min
   - If count < 5: store null in Redis
   - If count >= 5: calculate mean, store in Redis
   - Cache key: delay:{mosque_id}:{prayer}, TTL=1hr

2. Update mosque profile to show delay indicator:
   - Fetch from Redis via Edge Function endpoint
   - Display: "Usually starts X minutes late" / "on time" / "X minutes early"
   - Below 5 data points: "Not enough data yet" with check-in CTA
   - Position: below each prayer time row in schedule

3. Update check-in flow to optionally capture started_at:
   - After check-in success, show optional prompt: "Did the prayer start on time?"
   - Quick options: "On time", "X minutes late", "X minutes early", "Skip"
```

### Prompt 1.5.3 — Trust Tiers with Activity Window

```
Implement the full trust tier system with activity window (FR-016):

1. Update supabase/functions/update-contributor-tier/index.ts:
   - Count accepted submissions for user
   - Thresholds: 0-4=new_user, 5-19=regular, 20+=trusted
   - On tier upgrade: update users.tier and tier_last_active_at
   - Recalculate base score for all user's historical submissions

2. Update decay-trust-scores Edge Function to include activity window:
   - Query users WHERE tier IN ('regular', 'trusted') AND tier_last_active_at < now() - interval '53 days'
   - Send warning push: "Your [Tier] status expires in 7 days — submit or check in to keep it"
   - Query users WHERE tier IN ('regular', 'trusted') AND tier_last_active_at < now() - interval '60 days'
   - Demote: trusted → regular, regular → new_user
   - Recalculate all their submission trust scores with new base

3. Demotion recovery:
   - When demoted user submits or checks in:
     - If historical accepted count >= 20: restore to trusted
     - If >= 5: restore to regular
   - Update tier_last_active_at

4. User profile screen:
   - Show current tier badge
   - Show "Active until [date]" based on tier_last_active_at + 60 days
   - Show submission count and history
```

### Prompt 1.5.4 — Rule-Based Moderation

```
Implement rule-based moderation (FR-017):

Update supabase/functions/on-submission-insert/index.ts to apply these 5 rules in order:

Rule 1 — Time Range: Reject if time is outside the plausible window for the prayer type (ranges defined in FR-004).

Rule 2 — Velocity: Reject if user has submitted for 3+ different mosques within the last 60 minutes. Query jamat_times by submitted_by + created_at > now() - interval '60 minutes'.

Rule 3 — Duplicate: Reject if identical time already exists for same mosque/prayer from any source within 7 days.

Rule 4 — Frequency Cap: Reject if user has 5+ submissions today across all mosques. Use Upstash Redis counter: rate:{user_id}:submissions with 1hr TTL.

Rule 5 — Admin Lock: If mosque has verified_admin_id AND admin has submitted a live time for this prayer, flag community submission for review (status='pending') instead of auto-rejecting.

For each rejection:
- Write to moderation_log with rule_triggered and reason
- Return specific error code to client
- Do NOT write to jamat_times

All rules must pass before the submission is written.
```

### Prompt 1.5.5 — Seasonal Detection & Admin Quick-Update

```
Implement seasonal time-change detection (FR-024) and admin quick-update (FR-025):

1. supabase/functions/seasonal-check/index.ts:
   - Triggered by pg_cron on first Monday of each month
   - For each mosque:
     - Get last effective_date from its jamat_times
     - Calculate sunrise/sunset for mosque GPS on that date vs today
     - If delta > 15 minutes AND last update > 45 days ago:
       - Send push to: verified admin, last 3 submitters, top 3 check-in users
       - Notification: "[Mosque Name]'s Fajr time hasn't been updated since [date] — the season has changed. Can you verify?"
       - Tapping opens submit-time pre-filled with mosque and prayer
     - Track in contributor_log with action_type='seasonal_prompt'
     - Max 1 prompt per mosque per 30 days

2. supabase/functions/admin-quick-update/index.ts:
   - Twilio webhook handler (POST with SMS/WhatsApp inbound)
   - Verify Twilio signature
   - Identify admin by phone number (match against users table)
   - Parse reply:
     - Single time: "5:30" → update next unconfirmed prayer
     - Confirm: "OK" or "Confirm" → refresh last_verified_at, reset decay
     - Multi-prayer: "Fajr 5:30 Dhuhr 1:15 Asr 5:00 Maghrib 7:45 Isha 9:30" → update all
   - Validate times against FR-004 ranges
   - Write to jamat_times with trust_score=100, status=live
   - Reply: "Updated! [Prayer] is now set to [time]."
   - On parse failure: "Sorry, I didn't understand. Reply with a time like 5:30 or OK to confirm."

3. Set up Twilio webhook configuration (document in README):
   - Twilio phone number → webhook URL → Supabase Edge Function
   - WhatsApp Business number (optional, same endpoint)
```

### Prompt 1.5.6 — Per-Mosque Notification Controls

```
Implement per-mosque per-prayer notification controls (FR-015):

1. Update follows table notification_prefs JSONB schema:
   {
     "fajr": { "enabled": true, "lead_minutes": 15 },
     "dhuhr": { "enabled": true, "lead_minutes": 10 },
     "asr": { "enabled": false },
     "maghrib": { "enabled": true, "lead_minutes": 30 },
     "isha": { "enabled": true, "lead_minutes": 15 },
     "jumuah": { "enabled": true, "lead_minutes": 30 }
   }

2. src/components/mosque/NotificationPrefsPanel.tsx:
   - Grid layout: 6 rows (one per prayer)
   - Each row: prayer name, enabled toggle, lead time picker (10/15/30)
   - Global mute toggle at top
   - "Notify on time changes" toggle
   - Saves to follows.notification_prefs on change

3. Update schedule-notifications Edge Function:
   - Read per-prayer lead time from follows.notification_prefs
   - If prayer is disabled for that user, skip
   - If notification_prefs is empty, fall back to global lead_minutes from users table

4. Add notification prefs panel to mosque profile screen (shown for followed mosques only)
```

---

## Phase 2 Prompts (High-Level — Detail in Phase 2 SRS)

### Prompt 2.1 — Mosque Admin Panel

```
Plan and implement the mosque admin claiming and management system:

1. Admin claiming flow:
   - "Claim this mosque" button on mosque profile
   - Requires: submit mosque admin email + phone + proof (document upload to Supabase Storage)
   - Manual review process (initially by developer, later by moderation team)
   - On approval: set mosques.verified_admin_id, upgrade user tier to mosque_admin

2. Admin dashboard (on mosque profile, visible to admin only):
   - Update jamat times directly (instant trust_score=100)
   - Edit mosque info (name, address, facilities, photo)
   - See follower count (not identities)
   - Post announcements (FR-019)

Reference PROJECT_SPEC.md Section 10 for Phase 2 features list.
```

### Prompt 2.2 — Announcements System

```
Plan the structured announcements system (FR-019):

1. Announcement types: Janazah, Time Change, Eid, General Event
2. Only verified mosque admins can post
3. Push notification to all followers of that mosque
4. Announcement card on mosque profile with type badge
5. Janazah: subdued UI, no animations, urgent flag
6. Community reactions (Phase 2): emoji reactions, no open comments
7. Auto-expiry: events expire after their date, Janazah after 48hrs
```

### Prompt 2.3 — Ramadan Mode

```
Plan Ramadan Mode (FR-021):

1. Auto-detection: activate when date falls within Ramadan (support multiple start dates for different communities)
2. Tarawih time field added to mosque profile
3. Iftar time countdown (= Maghrib time, prominently displayed)
4. Suhoor reminder notification (before Fajr)
5. Seasonal prompts for Tarawih time submissions
6. Ramadan-themed UI accent (optional, subtle)
```

### Prompt 2.4 — Gamification

```
Plan the gamification system (FR-020):

1. Stewardship badges (never imply divine reward):
   - "Data Guardian" — 50+ accepted submissions
   - "Community Pillar" — 100+ check-ins
   - "Mosque Champion" — Most submissions for a single mosque
   - "Accuracy Hero" — 10+ submissions that reached Verified status
2. Contribution history on profile
3. Monthly community leaderboard (optional, opt-in)
4. Badge display on user profile and next to submissions
```

### Prompt 2.5 — AI Moderation

```
Plan AI moderation (FR-022) to replace rule-based system:

1. OpenAI API integration for submission quality scoring
2. Pattern detection: coordinated manipulation, bot-like submission patterns
3. Content quality scoring for announcement text
4. Escalation to human moderator for edge cases
5. Training data: use moderation_log from Phase 1.5 rule-based system
6. Maintain rule-based system as fallback if AI is unavailable
```

---

## Utility Prompts (Use As Needed)

### Prompt U.1 — Add a New Screen

```
Add a new screen to Masjidy:
- Screen name: [SCREEN_NAME]
- Route: app/[PATH].tsx
- Purpose: [DESCRIPTION]
- Data: [WHAT DATA IT NEEDS]
- Navigation: [HOW USER GETS HERE AND WHERE THEY GO NEXT]

Follow the existing patterns:
- Use ScreenContainer wrapper
- NativeWind classes with theme variables
- Skeleton loading state
- Empty state
- Error state
- useTranslation for all strings
```

### Prompt U.2 — Add a New Edge Function

```
Create a new Supabase Edge Function:
- Name: [FUNCTION_NAME]
- Trigger: [HTTP endpoint / database trigger / pg_cron]
- Input: [PARAMETERS]
- Logic: [WHAT IT DOES]
- Output: [RESPONSE FORMAT]
- Errors: [ERROR CODES AND MESSAGES]

Follow the existing patterns:
- Validate JWT (for HTTP endpoints)
- Verify webhook signature (for QStash/Twilio callbacks)
- Use service role for writes
- Return structured error JSON: { error: "CODE", message: "Human message" }
- Log to moderation_log where appropriate
```

### Prompt U.3 — Performance Audit

```
Run a performance audit on the current Masjidy build:

1. Measure JS bundle size: npx expo export --dump-sourcemap
2. Check for unnecessary dependencies
3. Review FlatList performance (should be < 16ms per frame for 20 items)
4. Check for memory leaks in Realtime subscriptions
5. Verify SQLite queries complete within 500ms
6. Test cold start time on mid-range Android (target: < 4s)
7. Check image sizes and lazy loading
8. Review Edge Function cold start times
9. Report findings and optimization recommendations
```

### Prompt U.4 — Testing Sprint

```
Write comprehensive tests for Masjidy:

1. Unit tests for all src/lib/ modules:
   - prayerTimes.ts: 4 methods × 10 known cities
   - qibla.ts: 10 known bearings
   - trustScore.ts: all score combinations, decay, caps
   - timeValidation.ts: all prayer ranges + edge cases
   - distance.ts: known Haversine results

2. Integration tests for hooks:
   - useAuth: login flow, session persist, logout
   - useCheckIn: success, geofence fail, velocity fail
   - useFollows: follow, unfollow, persistence

3. Edge Function tests:
   - submit-time: all 5 moderation rules
   - check-in: geofence, velocity, window, duplicate
   - bootstrap: cache hit vs miss, payload size

Target: 80%+ code coverage on src/lib/ and supabase/functions/
```

---

*Each prompt is self-contained. Execute them in order within a phase. Review the generated plan before executing. Adjust as you go.*
