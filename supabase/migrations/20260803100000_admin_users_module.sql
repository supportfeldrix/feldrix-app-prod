-- ============================================================
-- Feldrix Control Centre — Users Management Module
-- Sprint 47.0
--
-- Adds: admin_notes table, user_timeline table
-- ============================================================

-- ─── Admin Notes (internal, never visible to farmers) ────────
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_user ON admin_notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notes_admin ON admin_notes(admin_id);

-- ─── User Timeline (chronological events per user) ───────────
CREATE TABLE IF NOT EXISTS user_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_user ON user_timeline(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON user_timeline(event_type);

-- ─── RLS for admin_notes ─────────────────────────────────────
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notes_read ON admin_notes;
CREATE POLICY notes_read ON admin_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

DROP POLICY IF EXISTS notes_insert ON admin_notes;
CREATE POLICY notes_insert ON admin_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

DROP POLICY IF EXISTS notes_update ON admin_notes;
CREATE POLICY notes_update ON admin_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

DROP POLICY IF EXISTS notes_delete ON admin_notes;
CREATE POLICY notes_delete ON admin_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ─── RLS for user_timeline ───────────────────────────────────
ALTER TABLE user_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS timeline_read ON user_timeline;
CREATE POLICY timeline_read ON user_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support', 'finance', 'readonly')
    )
  );

DROP POLICY IF EXISTS timeline_insert ON user_timeline;
CREATE POLICY timeline_insert ON user_timeline
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );
