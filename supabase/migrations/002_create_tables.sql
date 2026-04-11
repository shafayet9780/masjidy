-- Masjidy: PostGIS + core tables (PROJECT_SPEC §5.2)

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- mosques
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mosques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  contact_phone TEXT,
  photo_url TEXT,
  madhab TEXT,
  khutbah_language TEXT,
  facilities JSONB DEFAULT '{}'::jsonb,
  verified_admin_id UUID REFERENCES auth.users (id),
  last_confirmed_at TIMESTAMPTZ,
  confirmation_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mosques_location ON public.mosques USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_mosques_admin ON public.mosques (verified_admin_id)
  WHERE verified_admin_id IS NOT NULL;

DROP TRIGGER IF EXISTS mosques_updated_at ON public.mosques;
CREATE TRIGGER mosques_updated_at
  BEFORE UPDATE ON public.mosques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- jamat_times
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jamat_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques (id) ON DELETE CASCADE,
  prayer public.prayer_type NOT NULL,
  time TIMETZ NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by UUID NOT NULL REFERENCES auth.users (id),
  trust_score INT NOT NULL DEFAULT 40 CHECK (trust_score >= 0 AND trust_score <= 100),
  status public.submission_status NOT NULL DEFAULT 'pending',
  note TEXT CHECK (char_length(note) <= 120),
  last_verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jamat_times_mosque_prayer ON public.jamat_times (mosque_id, prayer, status)
  WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_jamat_times_submitter ON public.jamat_times (submitted_by);
-- UTC calendar day (timestamptz::date is STABLE; not valid in indexes on PG 15+)
CREATE UNIQUE INDEX IF NOT EXISTS idx_jamat_times_dedup ON public.jamat_times (
  submitted_by,
  mosque_id,
  prayer,
  ((created_at AT TIME ZONE 'UTC')::date)
);

-- ---------------------------------------------------------------------------
-- users (profile; mirrors auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  tier public.contributor_tier NOT NULL DEFAULT 'new_user',
  tier_last_active_at TIMESTAMPTZ DEFAULT now(),
  language TEXT DEFAULT 'en',
  prayer_calc_method TEXT DEFAULT 'mwl' CHECK (
    prayer_calc_method IN ('mwl', 'isna', 'karachi', 'umm_al_qura')
  ),
  notification_lead_minutes INT DEFAULT 15 CHECK (notification_lead_minutes IN (10, 15, 30)),
  fcm_token TEXT,
  apns_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- check_ins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id),
  mosque_id UUID NOT NULL REFERENCES public.mosques (id),
  prayer public.prayer_type NOT NULL,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  delta_minutes NUMERIC(5, 1),
  geofence_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_dedup ON public.check_ins (
  user_id,
  mosque_id,
  prayer,
  ((arrived_at AT TIME ZONE 'UTC')::date)
);
CREATE INDEX IF NOT EXISTS idx_checkins_mosque_prayer ON public.check_ins (mosque_id, prayer, arrived_at);

-- ---------------------------------------------------------------------------
-- mosque_confirmations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mosque_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id),
  mosque_id UUID NOT NULL REFERENCES public.mosques (id),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Month bucket in UTC (date_trunc on timestamptz is STABLE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_confirmations_dedup ON public.mosque_confirmations (
  user_id,
  mosque_id,
  (date_trunc('month', confirmed_at AT TIME ZONE 'UTC'))
);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mosque_id UUID NOT NULL REFERENCES public.mosques (id) ON DELETE CASCADE,
  notification_prefs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, mosque_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_mosque ON public.follows (mosque_id);

-- ---------------------------------------------------------------------------
-- contributor_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contributor_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id),
  action_type public.action_type NOT NULL,
  mosque_id UUID REFERENCES public.mosques (id),
  accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributor_log_user ON public.contributor_log (user_id, action_type);

-- ---------------------------------------------------------------------------
-- moderation_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.jamat_times (id),
  rule_triggered TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- notification_jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qstash_message_id TEXT,
  mosque_id UUID NOT NULL REFERENCES public.mosques (id),
  prayer public.prayer_type NOT NULL,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users (id),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status public.notification_job_status NOT NULL DEFAULT 'queued',
  attempts INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_jobs_dedup ON public.notification_jobs (
  mosque_id,
  prayer,
  date,
  user_id
);

DROP TRIGGER IF EXISTS notification_jobs_updated_at ON public.notification_jobs;
CREATE TRIGGER notification_jobs_updated_at
  BEFORE UPDATE ON public.notification_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
