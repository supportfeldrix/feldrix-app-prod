-- ============================================================
-- Animal Health Completion Tracking
-- Additive, backward-compatible change.
--
-- Adds the ability to mark a scheduled animal_health treatment
-- (the source of a virtual Planner "Animal Health" task) as
-- completed WITHOUT deleting the record, changing its
-- treatment_date, or changing its next_due (original schedule).
--
-- - completed_at:     when the farmer actually completed the task.
-- - completed_source: how it was completed (manual Planner action
--                     or automatic match from a new health record).
--
-- Existing rows get NULL for both columns and behave exactly as
-- before. No RLS changes. No data loss. No column drops.
-- ============================================================

ALTER TABLE public.animal_health
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;

ALTER TABLE public.animal_health
  ADD COLUMN IF NOT EXISTS completed_source text NULL;

COMMENT ON COLUMN public.animal_health.completed_at IS
  'Timestamp the scheduled treatment/task was actually completed. NULL = still active/scheduled. Does not affect treatment_date or next_due.';

COMMENT ON COLUMN public.animal_health.completed_source IS
  'Origin of completion: planner_manual (farmer pressed Complete) or health_record_auto (auto-matched from a newly recorded treatment).';
