-- ============================================================
-- Add lifecycle_stage column to livestock table.
-- This is a computed/cached value — the source of truth is the
-- livestockLifecycle.js engine which calculates from
-- animal_type + gender + date_of_birth.
-- ============================================================

ALTER TABLE public.livestock ADD COLUMN IF NOT EXISTS lifecycle_stage text;

-- Ensure date_of_birth column exists (should already from initial schema)
ALTER TABLE public.livestock ADD COLUMN IF NOT EXISTS date_of_birth date;
