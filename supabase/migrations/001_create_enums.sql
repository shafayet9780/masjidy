-- Masjidy: enum types (PROJECT_SPEC §5.1) — idempotent

DO $$
BEGIN
  CREATE TYPE public.prayer_type AS ENUM ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.submission_status AS ENUM ('pending', 'live', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.contributor_tier AS ENUM ('new_user', 'regular', 'trusted', 'mosque_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.notification_job_status AS ENUM ('queued', 'delivered', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.action_type AS ENUM (
    'submission',
    'checkin',
    'endorsement',
    'confirmation',
    'seasonal_prompt'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
