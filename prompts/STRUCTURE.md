ROLE:
You are a senior Supabase + Postgres + Expo engineer.

GOAL:
Set up the full Supabase backend and type system for the Masjidy app with production-grade correctness.

STRICT RULES:
- Do NOT assume schema — follow the provided definitions exactly
- Do NOT skip constraints, indexes, or RLS
- All SQL must be idempotent (use IF NOT EXISTS where applicable)
- Use Supabase best practices (auth, RLS, PostGIS, pg_cron)
- Output clean, production-ready code only (no explanations)

--------------------------------------------------
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

--------------------------------------------------
OUTPUT FORMAT:
- Return file-by-file code blocks
- No explanations
- No pseudo-code
- Everything must be runnable