-- Masjidy: Row Level Security (PROJECT_SPEC §5.3 + mosque_confirmations)

-- ---------------------------------------------------------------------------
-- mosques: anyone reads, verified admin writes own
-- ---------------------------------------------------------------------------
ALTER TABLE public.mosques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mosques_select ON public.mosques;
CREATE POLICY mosques_select ON public.mosques FOR SELECT USING (true);

DROP POLICY IF EXISTS mosques_update_admin ON public.mosques;
CREATE POLICY mosques_update_admin ON public.mosques
  FOR UPDATE
  USING (verified_admin_id = auth.uid());

-- ---------------------------------------------------------------------------
-- jamat_times: anyone reads live, auth users insert
-- ---------------------------------------------------------------------------
ALTER TABLE public.jamat_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jamat_select_live ON public.jamat_times;
CREATE POLICY jamat_select_live ON public.jamat_times
  FOR SELECT
  USING (status = 'live');

DROP POLICY IF EXISTS jamat_insert_auth ON public.jamat_times;
CREATE POLICY jamat_insert_auth ON public.jamat_times
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- users: own row only
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_own ON public.users;
CREATE POLICY users_own ON public.users USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- check_ins: auth insert, public aggregate read
-- ---------------------------------------------------------------------------
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkins_insert_auth ON public.check_ins;
CREATE POLICY checkins_insert_auth ON public.check_ins
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS checkins_select ON public.check_ins;
CREATE POLICY checkins_select ON public.check_ins FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- follows: own rows only
-- ---------------------------------------------------------------------------
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS follows_own ON public.follows;
CREATE POLICY follows_own ON public.follows USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- contributor_log: own rows only (read)
-- ---------------------------------------------------------------------------
ALTER TABLE public.contributor_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contrib_own ON public.contributor_log;
CREATE POLICY contrib_own ON public.contributor_log
  FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- moderation_log: service role only
-- ---------------------------------------------------------------------------
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- notification_jobs: service role only
-- ---------------------------------------------------------------------------
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- mosque_confirmations: insert/select own rows
-- ---------------------------------------------------------------------------
ALTER TABLE public.mosque_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mosque_confirmations_insert_own ON public.mosque_confirmations;
CREATE POLICY mosque_confirmations_insert_own ON public.mosque_confirmations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mosque_confirmations_select_own ON public.mosque_confirmations;
CREATE POLICY mosque_confirmations_select_own ON public.mosque_confirmations
  FOR SELECT
  USING (user_id = auth.uid());
