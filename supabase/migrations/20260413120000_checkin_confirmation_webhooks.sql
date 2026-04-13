-- Webhook triggers for check_ins and mosque_confirmations (FR-008 / FR-008B).
-- Requires Vault secrets from 20260412124020_schedule_notifications_webhook.sql:
--   project_url, database_webhook_secret

CREATE OR REPLACE FUNCTION private.enqueue_on_checkin_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  webhook_secret TEXT;
  project_url TEXT;
BEGIN
  webhook_secret := private.get_vault_secret('database_webhook_secret');
  project_url := private.project_url();

  IF webhook_secret IS NULL OR project_url IS NULL THEN
    RAISE LOG 'Skipping on-checkin-insert webhook; missing Vault secrets';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/on-checkin-insert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'record', to_jsonb(NEW),
      'old_record', NULL
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.enqueue_on_confirmation_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  webhook_secret TEXT;
  project_url TEXT;
BEGIN
  webhook_secret := private.get_vault_secret('database_webhook_secret');
  project_url := private.project_url();

  IF webhook_secret IS NULL OR project_url IS NULL THEN
    RAISE LOG 'Skipping on-confirmation-insert webhook; missing Vault secrets';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/on-confirmation-insert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'record', to_jsonb(NEW),
      'old_record', NULL
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_ins_on_insert_webhook ON public.check_ins;
CREATE TRIGGER check_ins_on_insert_webhook
  AFTER INSERT ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_on_checkin_insert();

DROP TRIGGER IF EXISTS mosque_confirmations_on_insert_webhook ON public.mosque_confirmations;
CREATE TRIGGER mosque_confirmations_on_insert_webhook
  AFTER INSERT ON public.mosque_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_on_confirmation_insert();

-- Geofence helper: service_role only (Edge Functions with service key).
CREATE OR REPLACE FUNCTION public.mosque_within_meters(
  p_mosque_id uuid,
  p_lng double precision,
  p_lat double precision,
  p_meters double precision
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mosques m
    WHERE m.id = p_mosque_id
      AND ST_DWithin(
        m.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_meters
      )
  );
$$;

REVOKE ALL ON FUNCTION public.mosque_within_meters(uuid, double precision, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mosque_within_meters(uuid, double precision, double precision, double precision) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_mosque_confirmation_count(p_mosque_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.mosques
  SET
    confirmation_count = confirmation_count + 1,
    last_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_mosque_id
  RETURNING confirmation_count INTO n;

  IF n IS NULL THEN
    RAISE EXCEPTION 'mosque_not_found';
  END IF;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_mosque_confirmation_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_mosque_confirmation_count(uuid) TO service_role;
