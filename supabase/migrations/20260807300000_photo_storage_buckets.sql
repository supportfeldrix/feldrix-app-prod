-- ============================================================
-- Feldrix Photo Management Platform
-- Storage Buckets + RLS Policies
-- Version 1.0
--
-- Idempotent: safe to run multiple times.
-- Creates buckets and policies for photo storage.
--
-- File path convention: {user_id}/{module}/{record_id}/{filename}
-- This allows RLS to scope access by extracting the user_id
-- from the first folder segment of the object path.
-- ============================================================

-- ─── Create Storage Buckets ─────────────────────────────────
-- Supabase storage.buckets is the system table for bucket metadata.
-- INSERT ... ON CONFLICT ensures idempotency.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('livestock-photos', 'livestock-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('crop-photos', 'crop-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('machinery-photos', 'machinery-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('support-attachments', 'support-attachments', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('general-photos', 'general-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── Storage RLS Policies ───────────────────────────────────
-- Each policy uses the folder path convention: files are stored as
--   {user_id}/...
-- So (storage.foldername(name))[1] extracts the user_id folder.
--
-- DROP + CREATE pattern ensures idempotency (policies don't support
-- CREATE IF NOT EXISTS or ON CONFLICT).

-- ═══════════════════════════════════════════════════════════════
-- livestock-photos
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users upload own livestock photos" ON storage.objects;
CREATE POLICY "Users upload own livestock photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'livestock-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users view own livestock photos" ON storage.objects;
CREATE POLICY "Users view own livestock photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'livestock-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own livestock photos" ON storage.objects;
CREATE POLICY "Users delete own livestock photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'livestock-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- crop-photos
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users upload own crop photos" ON storage.objects;
CREATE POLICY "Users upload own crop photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'crop-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users view own crop photos" ON storage.objects;
CREATE POLICY "Users view own crop photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'crop-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own crop photos" ON storage.objects;
CREATE POLICY "Users delete own crop photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'crop-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- machinery-photos
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users upload own machinery photos" ON storage.objects;
CREATE POLICY "Users upload own machinery photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'machinery-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users view own machinery photos" ON storage.objects;
CREATE POLICY "Users view own machinery photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'machinery-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own machinery photos" ON storage.objects;
CREATE POLICY "Users delete own machinery photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'machinery-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- support-attachments
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users upload own support attachments" ON storage.objects;
CREATE POLICY "Users upload own support attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users view own support attachments" ON storage.objects;
CREATE POLICY "Users view own support attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own support attachments" ON storage.objects;
CREATE POLICY "Users delete own support attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- general-photos
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users upload own general photos" ON storage.objects;
CREATE POLICY "Users upload own general photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'general-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users view own general photos" ON storage.objects;
CREATE POLICY "Users view own general photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'general-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own general photos" ON storage.objects;
CREATE POLICY "Users delete own general photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'general-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- Administrator full access (all buckets)
-- Service role bypasses RLS automatically, but this explicit
-- policy ensures admin users via the dashboard can access all.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins manage all photos" ON storage.objects;
CREATE POLICY "Admins manage all photos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- Photos metadata table (idempotent)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  record_id text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  thumbnail_path text,
  filename text NOT NULL,
  original_filename text,
  mime_type text,
  file_size integer DEFAULT 0,
  width integer,
  height integer,
  caption text,
  category text,
  is_cover boolean DEFAULT false,
  uploaded_from text DEFAULT 'web',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ai_analysis_status text,
  ai_labels jsonb,
  ai_diagnosis text,
  CONSTRAINT photos_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_photos_user ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_module_record ON public.photos(module, record_id);
CREATE INDEX IF NOT EXISTS idx_photos_cover ON public.photos(module, record_id, is_cover) WHERE is_cover = true;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to ensure idempotency
DROP POLICY IF EXISTS "Users manage own photos" ON public.photos;
CREATE POLICY "Users manage own photos" ON public.photos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DONE
-- Run this once in the Supabase SQL Editor.
-- No manual Dashboard configuration required.
-- ============================================================
