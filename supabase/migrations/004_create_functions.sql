-- Masjidy: scheduled maintenance (FR-005 trust decay, FR-016 tier demotion) + pg_cron

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Trust decay: Monday 02:00 UTC via cron — -5/week, floor 10 (FR-005)
CREATE OR REPLACE FUNCTION public.decay_trust_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jamat_times
  SET
    trust_score = GREATEST(trust_score - 5, 10),
    last_verified_at = now()
  WHERE status = 'live'
    AND trust_score > 10;
END;
$$;

-- Inactive > 60 days: trusted → regular → new_user (FR-016); skip mosque_admin
CREATE OR REPLACE FUNCTION public.demote_inactive_contributors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    tier = CASE
      WHEN tier = 'trusted'::public.contributor_tier THEN 'regular'::public.contributor_tier
      WHEN tier = 'regular'::public.contributor_tier THEN 'new_user'::public.contributor_tier
      ELSE tier
    END,
    updated_at = now()
  WHERE tier_last_active_at < (now() - interval '60 days')
    AND tier IN ('trusted'::public.contributor_tier, 'regular'::public.contributor_tier);
END;
$$;

CREATE OR REPLACE FUNCTION public.run_masjidy_weekly_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.decay_trust_scores();
  PERFORM public.demote_inactive_contributors();
END;
$$;

REVOKE ALL ON FUNCTION public.decay_trust_scores() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.demote_inactive_contributors() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_masjidy_weekly_maintenance() FROM PUBLIC;

-- Idempotent schedule: remove prior job name if present
DO $$
DECLARE
  jid BIGINT;
BEGIN
  FOR jid IN
    SELECT j.jobid FROM cron.job j WHERE j.jobname = 'masjidy_weekly_maintenance'
  LOOP
    PERFORM cron.unschedule(jid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'masjidy_weekly_maintenance',
  '0 2 * * 1',
  $cron$SELECT public.run_masjidy_weekly_maintenance();$cron$
);
