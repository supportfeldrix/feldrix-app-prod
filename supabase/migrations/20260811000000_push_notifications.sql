-- ═══════════════════════════════════════════════════════════════════════════════
-- Feldrix v1.2 — Push Notification Tables
-- Migration: 20260811000000_push_notifications.sql
--
-- Tables:
--   push_subscriptions   — Browser push subscriptions per user/device
--   notification_history — Audit trail of all sent weather notifications
--
-- No third-party services. Uses Web Push API + Supabase only.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- PUSH SUBSCRIPTIONS
-- Stores Web Push API subscription objects per user per device.
-- The Edge Function uses these to send push notifications when weather is critical.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  subscription_json JSONB NOT NULL,
  device_name TEXT DEFAULT 'Unknown Device',
  browser TEXT DEFAULT 'Unknown',
  platform TEXT DEFAULT 'Unknown',
  notification_settings JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one subscription per user per endpoint
  CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint)
);

-- Index for Edge Function lookups (find all subscriptions for a user)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Index for cleanup (find stale subscriptions)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_seen ON push_subscriptions(last_seen);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATION HISTORY
-- Audit trail of every weather notification sent to farmers.
-- Tracks: sent, opened, dismissed status for analytics.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'dismissed')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  linked_alert_id TEXT,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user's notification history (most recent first)
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id, sent_at DESC);

-- Index for analytics (alert type performance)
CREATE INDEX IF NOT EXISTS idx_notification_history_alert_type ON notification_history(alert_type, status);

-- Index for Edge Function deduplication (prevent sending same alert twice)
CREATE INDEX IF NOT EXISTS idx_notification_history_dedup ON notification_history(user_id, alert_type, sent_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Users can only access their own subscriptions and history.
-- Edge Functions use service_role key to bypass RLS.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Push Subscriptions: Users manage their own
CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Notification History: Users can view/update their own
CREATE POLICY "Users can view own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification history"
  ON notification_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification history"
  ON notification_history FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CLEANUP FUNCTION
-- Removes stale subscriptions (not seen in 30 days) and old history (90 days).
-- Can be called by a Supabase Scheduled Function.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_push_notifications()
RETURNS void AS $$
BEGIN
  -- Remove subscriptions not seen in 30 days
  DELETE FROM push_subscriptions
  WHERE last_seen < now() - INTERVAL '30 days';

  -- Remove notification history older than 90 days
  DELETE FROM notification_history
  WHERE sent_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
