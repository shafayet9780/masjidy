# Scheduled job: `decay-trust-scores` (future setup)

This document is for **when you are ready** to enable the weekly Edge Function that logs **tier inactivity warnings** (FR-016). You can ship without it; trust decay and tier demotion still run via SQL in [`supabase/migrations/004_create_functions.sql`](../supabase/migrations/004_create_functions.sql) (Monday 02:00 UTC).

## What this job does

| Layer | Responsibility |
|-------|------------------|
| **SQL (`004`)** | `decay_trust_scores()` (−5 trust / week, floor 10) and `demote_inactive_contributors()` (60-day inactivity). |
| **Edge `decay-trust-scores`** | Finds `regular` / `trusted` users in the **53–60 day** inactive window, inserts `contributor_log` rows with `action_type = 'seasonal_prompt'` (idempotent for 30 days per user), for future push via `deliver-notification`. |

Until something **HTTP POSTs** the function on a schedule with the correct secret, **warning rows are not created**; SQL maintenance still runs.

## Prerequisites

1. **Deploy** `decay-trust-scores` (see [SUPABASE_EDGE_SETUP.md](./SUPABASE_EDGE_SETUP.md)).
2. **Edge secret** `CRON_SECRET` — generate a long random string, set in **Project → Edge Functions → Secrets** (same as [`SUPABASE_EDGE_SETUP.md`](./SUPABASE_EDGE_SETUP.md)).
3. **`verify_jwt = false`** for `decay-trust-scores` on the hosted project (matches [`supabase/config.toml`](../supabase/config.toml)); otherwise cron/webhook calls without a user JWT will fail.
4. **URL**: `https://<PROJECT_REF>.supabase.co/functions/v1/decay-trust-scores`  
   Replace `<PROJECT_REF>` with your project reference (Dashboard → Settings → API → Project URL).

## Option A — `pg_cron` + `pg_net` (Supabase Postgres)

**Extensions:** `pg_cron` (already used in `004`) and `pg_net` (see [`006_pg_net_extension.sql`](../supabase/migrations/006_pg_net_extension.sql)). Confirm both are enabled under **Database → Extensions** on hosted projects where you need HTTP from SQL.

### 1. One-off manual test (SQL Editor)

Replace URL and secret, run once:

```sql
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/decay-trust-scores',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', 'YOUR_CRON_SECRET_PLAINTEXT'
  ),
  body := '{}'::text
);
```

Check **Edge Functions → decay-trust-scores → Logs** and optionally:

```sql
SELECT id, user_id, action_type, created_at
FROM public.contributor_log
WHERE action_type = 'seasonal_prompt'
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Weekly schedule (Monday 02:05 UTC)

Runs shortly after the SQL job in `004` (02:00 UTC) so decay/demotion completes first.

**Remove an old job with the same name** (idempotent re-run):

```sql
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'masjidy_tier_warnings';
```

**Schedule:**

```sql
SELECT cron.schedule(
  'masjidy_tier_warnings',
  '5 2 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/decay-trust-scores',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'YOUR_CRON_SECRET_PLAINTEXT'
    ),
    body := '{}'::text
  );
  $$
);
```

**Security note:** Plaintext `CRON_SECRET` in SQL is visible to anyone with database SQL access. For production teams, prefer storing the secret in **Supabase Vault** and reading it inside the job (see [Vault docs](https://supabase.com/docs/guides/database/vault)).

### 3. Cron expression reference

| Field | `5 2 * * 1` meaning |
|-------|---------------------|
| minute | `5` |
| hour | `2` (UTC) |
| day of month | `*` |
| month | `*` |
| weekday | `1` = Monday |

Adjust if you want a different window; keep UTC in mind.

---

## Option B — GitHub Actions

Useful if you do **not** want secrets inside Postgres.

1. Repository **Settings → Secrets and variables → Actions**: add `DECAY_TRUST_SCORES_URL` (full function URL) and `CRON_SECRET` (same value as Edge secret).

2. Workflow (example — create `.github/workflows/decay-trust-scores.yml` when ready):

```yaml
name: decay-trust-scores
on:
  schedule:
    - cron: '5 2 * * 1' # Monday 02:05 UTC
  workflow_dispatch: {}

jobs:
  invoke:
    runs-on: ubuntu-latest
    steps:
      - name: POST decay-trust-scores
        run: |
          curl -sS -f -X POST "$DECAY_TRUST_SCORES_URL" \
            -H "Content-Type: application/json" \
            -H "x-cron-secret: $CRON_SECRET" \
            -d '{}'
        env:
          DECAY_TRUST_SCORES_URL: ${{ secrets.DECAY_TRUST_SCORES_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

---

## Option C — External scheduler

Any service that can send **HTTPS POST** on a schedule (e.g. cron-job.org, EasyCron, AWS EventBridge + Lambda):

- **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/decay-trust-scores`
- **Method:** POST
- **Header:** `x-cron-secret: <same value as Edge secret CRON_SECRET>`
- **Body:** `{}` with `Content-Type: application/json`

---

## Verification checklist

- [ ] `CRON_SECRET` set in Supabase Edge secrets.
- [ ] POST without header → **401** (expected).
- [ ] POST with wrong secret → **401**.
- [ ] POST with correct secret → **200** and JSON like `{ "warned": N, ... }`.
- [ ] After a run with eligible users, new `contributor_log` rows with `seasonal_prompt` (subject to idempotency rules in the function).

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| 401 Unauthorized | `CRON_SECRET` in request header matches Edge secret exactly; no extra spaces. |
| 404 / wrong host | Project ref and path `/functions/v1/decay-trust-scores` correct. |
| Function not invoked | Scheduler timezone (GitHub Actions `cron` is UTC); pg_cron runs in DB UTC. |
| `net.http_post` errors | `pg_net` enabled; URL reachable from Supabase infrastructure (rare blocks). |
| `warned: 0` always | No users in the 53–60 day inactive window, or they already had a `seasonal_prompt` in the last 30 days. |

---

## Related docs

- [SUPABASE_EDGE_SETUP.md](./SUPABASE_EDGE_SETUP.md) — secrets, webhook, JWT, deploy commands.
