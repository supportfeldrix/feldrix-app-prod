-- ═══════════════════════════════════════════════════════════════════════════════
-- Feldrix Sprint 49 — Subscription Renewal Automation Cron Job
-- Migration: 20260811100000_subscription_renewal_cron.sql
--
-- Schedules a daily pg_cron job at 07:05 SAST (05:05 UTC) that invokes
-- the subscription-renewal Edge Function to process expired subscriptions.
--
-- Prerequisites:
--   - pg_cron extension enabled (Supabase Dashboard → Extensions)
--   - pg_net extension enabled (for net.http_post)
--   - subscription-renewal Edge Function deployed
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─────────────────────────────────────────────────────────────────────────────
-- Daily Subscription Renewal Processing
-- Runs every day at 05:05 UTC (07:05 SAST)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'subscription-renewal-daily',
  '5 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/subscription-renewal',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"mode":"process"}'::jsonb
  )
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: If the above uses current_setting() and those aren't configured,
-- use the direct approach below instead (replace with your actual values):
--
-- SELECT cron.schedule(
--   'subscription-renewal-daily',
--   '5 5 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/subscription-renewal',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--       'Content-Type', 'application/json'
--     ),
--     body := '{"mode":"process"}'::jsonb
--   )
--   $$
-- );
-- ─────────────────────────────────────────────────────────────────────────────
