-- ============================================================
-- Feldrix Photo Management Platform
-- Version 1.0
--
-- Stores photo metadata. Images live in Supabase Storage buckets.
-- Supports: livestock, crops, machinery, support tickets.
-- Prepared for future AI Vision integration.
-- ============================================================

-- Photos metadata table
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
  -- Future AI fields (no redesign needed)
  ai_analysis_status text,
  ai_labels jsonb,
  ai_diagnosis text,
  CONSTRAINT photos_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photos_user ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_module_record ON public.photos(module, record_id);
CREATE INDEX IF NOT EXISTS idx_photos_cover ON public.photos(module, record_id, is_cover) WHERE is_cover = true;

-- RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Farmers manage their own photos
CREATE POLICY "Users manage own photos" ON public.photos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage Buckets (created via SQL — Supabase supports this)
-- Note: Buckets may need to be created via Dashboard if SQL
-- creation is not supported. The policies below assume they exist.
-- ============================================================

-- Storage policies are managed via the Supabase Dashboard:
-- Bucket: livestock-photos — private, authenticated only
-- Bucket: crop-photos — private, authenticated only
-- Bucket: machinery-photos — private, authenticated only
-- Bucket: support-attachments — private, authenticated only
-- Bucket: general-photos — private, authenticated only
--
-- Each bucket policy:
--   SELECT: auth.uid()::text = (storage.foldername(name))[1]
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
--   DELETE: auth.uid()::text = (storage.foldername(name))[1]
--
-- Files stored as: {user_id}/{module}/{record_id}/{filename}
