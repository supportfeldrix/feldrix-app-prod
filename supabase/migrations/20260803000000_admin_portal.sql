-- ============================================================
-- Feldrix Control Centre — Database Migration
-- Sprint 46.2
--
-- Adds: role system, admin audit log, platform settings,
-- admin broadcasts, and supporting RLS policies.
-- ============================================================

-- ─── Profile Extensions ─────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'farmer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended);

-- ─── Admin Audit Log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);

-- ─── Platform Settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Admin Broadcasts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT DEFAULT 'all',
  active BOOLEAN DEFAULT true,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_active ON admin_broadcasts(active, created_at DESC);

-- ─── Onboarding State (from Sprint 45.1) ────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_state JSONB DEFAULT '{}';

-- ─── RLS Policies ───────────────────────────────────────────

-- Admin audit log: admins can read, only full admins can write
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_read ON admin_audit_log;
CREATE POLICY admin_audit_read ON admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support', 'finance', 'readonly')
    )
  );

DROP POLICY IF EXISTS admin_audit_insert ON admin_audit_log;
CREATE POLICY admin_audit_insert ON admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

-- Platform settings: all admin roles can read, only full admin can write
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS settings_read ON platform_settings;
CREATE POLICY settings_read ON platform_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support', 'finance', 'readonly')
    )
  );

DROP POLICY IF EXISTS settings_write ON platform_settings;
CREATE POLICY settings_write ON platform_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS settings_update ON platform_settings;
CREATE POLICY settings_update ON platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin broadcasts: admin roles can read, admin+support can write
ALTER TABLE admin_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS broadcasts_read ON admin_broadcasts;
CREATE POLICY broadcasts_read ON admin_broadcasts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support', 'finance', 'readonly')
    )
  );

DROP POLICY IF EXISTS broadcasts_insert ON admin_broadcasts;
CREATE POLICY broadcasts_insert ON admin_broadcasts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

DROP POLICY IF EXISTS broadcasts_update ON admin_broadcasts;
CREATE POLICY broadcasts_update ON admin_broadcasts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

-- ─── Seed: Set your own user as admin ───────────────────────
-- IMPORTANT: Replace the email below with your actual admin email.
-- Run this manually after migration:
--
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
--

-- ─── Default Platform Settings ──────────────────────────────
INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}'::jsonb),
  ('feature_flags', '{"ai_insights": true, "breeding_module": true, "machinery_module": true}'::jsonb),
  ('support_links', '{"email": "support@feldrix.com", "docs": "https://docs.feldrix.com"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
