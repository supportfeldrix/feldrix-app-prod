-- ============================================================
-- Add expected_growing_days column to crops table
-- Used by the Crop Lifecycle Engine when farmers want to
-- override the default South African growing period.
-- Nullable — when NULL, the SA default profile is used.
-- ============================================================

ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS expected_growing_days integer;

-- Backfill from existing data where possible:
-- If both planting_date and expected_harvest exist, calculate the difference
UPDATE public.crops
SET expected_growing_days = (expected_harvest - planting_date)
WHERE planting_date IS NOT NULL
  AND expected_harvest IS NOT NULL
  AND expected_growing_days IS NULL
  AND (expected_harvest - planting_date) > 0;
