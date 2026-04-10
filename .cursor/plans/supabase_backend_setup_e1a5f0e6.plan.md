---
name: Supabase Backend Setup
overview: Replace all placeholder stubs with production-ready Supabase client initialization, SQL migrations (enums, tables, RLS, pg_cron trust decay), a type generation script, and TypeScript interfaces matching PROJECT_SPEC Section 5 exactly.
todos:
  - id: supabase-client
    content: Replace src/services/supabase.ts placeholder with typed Supabase client using expo-secure-store
    status: completed
  - id: delete-old-migrations
    content: Delete the 5 existing stub migration files
    status: completed
  - id: migration-enums
    content: Create 001_create_enums.sql with all 5 enum types (idempotent)
    status: completed
  - id: migration-tables
    content: Create 002_create_tables.sql with PostGIS extension and all 9 tables, constraints, indexes
    status: completed
  - id: migration-rls
    content: Create 003_create_rls_policies.sql with all RLS policies per spec + mosque_confirmations
    status: completed
  - id: migration-functions
    content: Create 004_create_functions.sql with pg_cron trust decay and updated_at trigger
    status: completed
  - id: generate-types-script
    content: Replace scripts/generate-types.ts with runnable Supabase type generation script
    status: completed
  - id: types-mosque
    content: Replace src/types/mosque.ts with full interfaces for Mosque, JamatTime, Follow, etc.
    status: completed
  - id: types-user
    content: Replace src/types/user.ts with full interfaces for User, CheckIn, NotificationJob, etc.
    status: completed
  - id: lint-check
    content: Run linter on all edited TypeScript files and fix any issues
    status: completed
isProject: false
---

# Supabase Backend and Type System Setup

## Current State

All target files exist as empty stubs:
- [`src/services/supabase.ts`](src/services/supabase.ts) -- placeholder `null` export
- [`supabase/migrations/`](supabase/migrations/) -- 5 stub SQL files (wrong order/names, 1-2 line comments only)
- [`scripts/generate-types.ts`](scripts/generate-types.ts) -- empty export
- [`src/types/mosque.ts`](src/types/mosque.ts), [`src/types/user.ts`](src/types/user.ts) -- placeholder interfaces

Dependencies already installed: `@supabase/supabase-js ^2.49.1`, `expo-secure-store ~55.0.12`.

---

## 1. Supabase Client -- `src/services/supabase.ts`

Replace the placeholder with the exact pattern from [PROJECT_SPEC Section 6](docs/PROJECT_SPEC.md) (lines 626-645):

```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

Key details:
- Typed with `Database` generic from generated types
- Named export `supabase` (not default, per project rules)
- Uses `EXPO_PUBLIC_` env vars from `.env.example`

---

## 2. Database Migrations

Delete the 5 existing stub files and create 4 new ones. Migration naming uses `001_`/`002_`/etc. format matching the user's requested convention.

### 2a. `supabase/migrations/001_create_enums.sql`

All 5 enums from [Section 5.1](docs/PROJECT_SPEC.md) (lines 403-408):
- `prayer_type`, `submission_status`, `contributor_tier`, `notification_job_status`, `action_type`
- Each wrapped with `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` for idempotency (Postgres does not support `CREATE TYPE IF NOT EXISTS`).

### 2b. `supabase/migrations/002_create_tables.sql`

Starts with:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Then all 9 tables from [Section 5.2](docs/PROJECT_SPEC.md) (lines 413-573) copied verbatim with `CREATE TABLE IF NOT EXISTS`:

| Table | Key Notes |
|---|---|
| `mosques` | `GEOGRAPHY(POINT, 4326)`, GIST index, partial index on `verified_admin_id` |
| `jamat_times` | FK cascade, `trust_score` CHECK 0-100, unique dedup index on `(submitted_by, mosque_id, prayer, created_at::date)` |
| `users` | PK references `auth.users(id)` cascade, CHECK constraints on `prayer_calc_method` and `notification_lead_minutes` |
| `check_ins` | Unique dedup index on `(user_id, mosque_id, prayer, arrived_at::date)` |
| `mosque_confirmations` | Unique dedup index on `(user_id, mosque_id, date_trunc('month', confirmed_at))` |
| `follows` | Composite PK `(user_id, mosque_id)`, index on `mosque_id` for fan-out |
| `contributor_log` | Index on `(user_id, action_type)` |
| `moderation_log` | FK to `jamat_times(id)` |
| `notification_jobs` | Dedup index on `(mosque_id, prayer, date, user_id)` |

All indexes are created with `IF NOT EXISTS` (via `CREATE INDEX IF NOT EXISTS`). Unique indexes use `CREATE UNIQUE INDEX IF NOT EXISTS`.

An `updated_at` trigger function is included for tables with `updated_at` columns (`mosques`, `users`, `notification_jobs`):

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
```

### 2c. `supabase/migrations/003_create_rls_policies.sql`

All policies from [Section 5.3](docs/PROJECT_SPEC.md) (lines 575-610) copied verbatim:
- `mosques`: SELECT public, UPDATE admin-only
- `jamat_times`: SELECT live only, INSERT authenticated
- `users`: all ops own-row (`id = auth.uid()`)
- `check_ins`: INSERT authenticated, SELECT public
- `follows`: all ops own-row (`user_id = auth.uid()`)
- `contributor_log`: SELECT own-row
- `moderation_log`: RLS enabled, no client policies (service-role only)
- `notification_jobs`: RLS enabled, no client policies (service-role only)
- `mosque_confirmations`: RLS enabled; INSERT for authenticated users, SELECT own-row (not in spec but needed for completeness)

Each `CREATE POLICY` wrapped with `DROP POLICY IF EXISTS ... ; CREATE POLICY ...` for idempotency.

### 2d. `supabase/migrations/004_create_functions.sql`

- Enable `pg_cron` extension: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
- Trust decay function per [FR-005](docs/PROJECT_SPEC.md) (line 841): decrements `jamat_times.trust_score` by 5, floor 10, for rows with `status = 'live'`
- Schedule with `cron.schedule`: every Monday 02:00 UTC (`0 2 * * 1`)
- Contributor tier activity window check per [FR-016](docs/PROJECT_SPEC.md) (line 915): demote users inactive >60 days

```sql
CREATE OR REPLACE FUNCTION decay_trust_scores()
RETURNS void AS $$ BEGIN
  UPDATE jamat_times
  SET trust_score = GREATEST(trust_score - 5, 10),
      last_verified_at = now()
  WHERE status = 'live'
    AND trust_score > 10;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule(
  'weekly-trust-decay',
  '0 2 * * 1',
  $$SELECT decay_trust_scores()$$
);
```

---

## 3. Type Generation Script -- `scripts/generate-types.ts`

Replace the stub with a runnable script using `child_process.execSync`:
- Detects `--local` flag or reads `EXPO_PUBLIC_SUPABASE_URL` from `.env`
- Runs `npx supabase gen types typescript --local` (for local dev) or `--project-id` (for cloud)
- Writes output to `src/types/database.ts`
- Uses Node.js `fs` and `child_process` (no extra deps)

---

## 4. TypeScript Interfaces

### 4a. `src/types/mosque.ts`

Interfaces mapping to `mosques`, `jamat_times`, `mosque_confirmations`, and `follows` tables:

```typescript
interface Mosque {
  id: string;
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
  contact_phone: string | null;
  photo_url: string | null;
  madhab: string | null;
  khutbah_language: string | null;
  facilities: MosqueFacilities;
  verified_admin_id: string | null;
  last_confirmed_at: string | null;
  confirmation_count: number;
  created_at: string;
  updated_at: string;
}
```

Plus: `JamatTime`, `MosqueConfirmation`, `Follow`, `MosqueFacilities`, and the `as const` maps for `PrayerType`, `SubmissionStatus`.

### 4b. `src/types/user.ts`

Interfaces mapping to `users`, `check_ins`, `contributor_log`, `notification_jobs`, `moderation_log`:

```typescript
interface User {
  id: string;
  display_name: string;
  tier: ContributorTier;
  tier_last_active_at: string;
  language: string;
  prayer_calc_method: PrayerCalcMethod;
  notification_lead_minutes: NotificationLeadMinutes;
  fcm_token: string | null;
  apns_token: string | null;
  created_at: string;
  updated_at: string;
}
```

Plus: `CheckIn`, `ContributorLogEntry`, `NotificationJob`, `ModerationLogEntry`, and `as const` maps for `ContributorTier`, `NotificationJobStatus`, `ActionType`.

---

## Files Modified (summary)

| Action | File |
|---|---|
| Replace | `src/services/supabase.ts` |
| Delete | `supabase/migrations/001_create_tables.sql` (old stub) |
| Delete | `supabase/migrations/002_create_rls_policies.sql` (old stub) |
| Delete | `supabase/migrations/003_create_indexes.sql` (old stub) |
| Delete | `supabase/migrations/004_create_enums.sql` (old stub) |
| Delete | `supabase/migrations/005_seed_data.sql` (old stub) |
| Create | `supabase/migrations/001_create_enums.sql` |
| Create | `supabase/migrations/002_create_tables.sql` |
| Create | `supabase/migrations/003_create_rls_policies.sql` |
| Create | `supabase/migrations/004_create_functions.sql` |
| Replace | `scripts/generate-types.ts` |
| Replace | `src/types/mosque.ts` |
| Replace | `src/types/user.ts` |

---

## Decision: `mosque_confirmations` RLS

The spec (Section 5.3) does not list RLS for `mosque_confirmations`. The plan adds: RLS enabled, INSERT for authenticated users with `WITH CHECK (auth.uid() = user_id)`, SELECT own-row with `USING (user_id = auth.uid())`. This prevents users from confirming on behalf of others and limits visibility to own confirmations.

## Decision: Migration Naming

Using the `001_`/`002_` prefix format as requested and matching existing project convention. Supabase CLI's `db push` sorts migrations alphabetically, so numeric prefixes order correctly. If you later use `supabase migration new`, it will create timestamp-prefixed files -- both conventions coexist fine.

## Decision: `005_seed_data.sql`

The old stub is deleted. Seed data is a separate concern handled by `scripts/seed-mosques.ts` per QUICK_START.md and is not part of this task.
