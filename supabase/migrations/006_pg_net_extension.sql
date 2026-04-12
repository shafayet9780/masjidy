-- pg_net: HTTP from Postgres (optional cron → Edge Functions). Idempotent.
-- See docs/SUPABASE_EDGE_SETUP.md for wiring Database Webhooks and scheduled HTTP calls.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
