-- Schedule notification webhook trigger for live jamat_times updates.
-- Requires Vault secrets to be created in hosted environments:
--   select vault.create_secret('<project-url>', 'project_url');
--   select vault.create_secret('<database-webhook-secret>', 'database_webhook_secret');

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_vault_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.project_url()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.get_vault_secret('project_url');
$$;

CREATE OR REPLACE FUNCTION private.enqueue_schedule_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  webhook_secret TEXT;
  project_url TEXT;
BEGIN
  IF NEW.status <> 'live' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD.status IS NOT DISTINCT FROM NEW.status
    AND OLD.time IS NOT DISTINCT FROM NEW.time
    AND OLD.effective_date IS NOT DISTINCT FROM NEW.effective_date THEN
    RETURN NEW;
  END IF;

  webhook_secret := private.get_vault_secret('database_webhook_secret');
  project_url := private.project_url();

  IF webhook_secret IS NULL OR project_url IS NULL THEN
    RAISE LOG 'Skipping schedule-notifications webhook; missing Vault secrets';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/schedule-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'record', to_jsonb(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
    ),
    timeout_milliseconds := 2000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jamat_times_schedule_notifications ON public.jamat_times;
CREATE TRIGGER jamat_times_schedule_notifications
  AFTER INSERT OR UPDATE OF status, time, effective_date
  ON public.jamat_times
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_schedule_notifications();
