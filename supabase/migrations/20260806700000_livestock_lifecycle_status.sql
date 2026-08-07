-- ============================================================
-- Livestock Lifecycle Status Management
-- Replaces deletion with status transitions.
-- Converts existing "Healthy"/"Sick" health-status values to
-- lifecycle statuses.
-- ============================================================

-- Ensure status column exists (it already does, just updating semantics)
-- Migrate existing values to new lifecycle statuses
UPDATE public.livestock SET status = 'Active' WHERE status = 'Healthy' OR status IS NULL;
UPDATE public.livestock SET status = 'Sick' WHERE status = 'Sick';
-- All other values (Active, Pregnant, Sold, etc.) remain as-is

-- Add lifecycle_status constraint (advisory — won't break existing data)
COMMENT ON COLUMN public.livestock.status IS 'Lifecycle status: Active, Pregnant, Sick, Sold, Slaughtered, Deceased, Archived';
