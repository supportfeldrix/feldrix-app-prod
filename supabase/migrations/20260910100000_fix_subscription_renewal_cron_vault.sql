-- ═══════════════════════════════════════════════════════════════════════════════
-- Fix subscription-renewal-daily cron authentication (Vault-based)
-- Migration: 20260910100000_fix_subscription_renewal_cron_vault.sql
--
-- PROBLEM (root cause):
--   The original cron (migration 20260811100000_subscription_renewal_cron.sql)
--   built its request from custom GUCs that were never created:
--       current_setting('app.settings.supabase_url')
--       current_setting('app.settings.service_role_key')
--   Postgres raised: ERROR: unrecognized configuration parameter
--   "app.settings.supabase_url" — so EVERY daily run failed before ever
--   calling net.http_post, and no expired subscriptions were reconciled.
--
-- FIX:
--   Update the EXISTING pg_cron job (jobname 'subscription-renewal-daily',
--   jobid 3 in production) IN PLACE via cron.alter_job(). No new/duplicate
--   cron job is created. Schedule is unchanged ('5 5 * * *'). The corrected
--   command:
--     • calls the existing subscription-renewal Edge Function,
--     • sends the existing {"mode":"process"} body,
--     • uses the PUBLIC production project URL (safe to inline — same value
--       as VITE_SUPABASE_URL in the frontend),
--     • reads the service-role key AT RUNTIME from Supabase Vault
--       (vault.decrypted_secrets) by NAME ONLY:
--           subscription_renewal_service_key
--
-- SECURITY:
--   • No secret is present in this migration or anywhere in Git.
--   • The Vault secret is referenced by name only and must be created
--     out-of-band (see the deployment notes / SQL provided separately).
--   • The Edge Function's own auth is unchanged; RLS/schema/business logic
--     and subscription rows are NOT touched by this migration.
--
-- PREREQUISITES (must exist before the cron can succeed at runtime):
--   • pg_cron + pg_net extensions enabled (already enabled by the original
--     migration; re-created here defensively).
--   • supabase_vault extension enabled.
--   • A Vault secret named 'subscription_renewal_service_key' containing the
--     production service-role key (created manually, NOT in Git).
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure required extensions exist (safe to run repeatedly).
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

DO $$
DECLARE
  v_jobid   bigint;
  v_command text;
BEGIN
  -- Corrected command. The URL is the PUBLIC production project URL.
  -- The service-role key is fetched from Vault by name at run time and is
  -- never stored in this file.
  v_command := $cmd$
    SELECT net.http_post(
      url     := 'https://jhpztctyyrfoonquuzes.supabase.co/functions/v1/subscription-renewal',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'subscription_renewal_service_key'
          LIMIT 1
        ),
        'Content-Type', 'application/json'
      ),
      body    := '{"mode":"process"}'::jsonb
    );
  $cmd$;

  -- Locate the EXISTING job by its unique name (do not assume a literal id;
  -- production reports jobid 3, but we resolve by name for portability).
  SELECT jobid INTO v_jobid
  FROM cron.job
  WHERE jobname = 'subscription-renewal-daily'
  LIMIT 1;

  IF v_jobid IS NULL THEN
    -- The job does not exist in this environment. Create it ONCE with the
    -- correct command (cron.schedule upserts by name — it will not create a
    -- duplicate if the name already exists). This keeps a single job only.
    PERFORM cron.schedule('subscription-renewal-daily', '5 5 * * *', v_command);
    RAISE NOTICE 'subscription-renewal-daily was missing; created with corrected command.';
  ELSE
    -- Update the EXISTING job in place: fix ONLY the command. Schedule,
    -- name, and jobid are preserved. No second cron job is created.
    PERFORM cron.alter_job(
      job_id   => v_jobid,
      schedule => '5 5 * * *',
      command  => v_command
    );
    RAISE NOTICE 'subscription-renewal-daily (jobid %) command updated to use Vault auth.', v_jobid;
  END IF;
END $$;
