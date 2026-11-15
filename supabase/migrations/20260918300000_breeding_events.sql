-- ============================================================
-- Breeding events: heat detection, pregnancy check, birth
--
-- One breeding_records row follows a female through the cycle:
--   Heat Detected -> Bred -> Pregnant -> Completed (birth) / Failed
-- These columns store the details of each step on that row.
--
-- breeding_date becomes nullable: a heat-detection row exists before the
-- animal is bred. It is filled in when breeding starts.
--
-- Additive: existing rows are untouched.
-- ============================================================
ALTER TABLE public.breeding_records
  ALTER COLUMN breeding_date DROP NOT NULL;

ALTER TABLE public.breeding_records
  ADD COLUMN IF NOT EXISTS heat_date date,
  ADD COLUMN IF NOT EXISTS pregnancy_check_date date,
  ADD COLUMN IF NOT EXISTS pregnancy_check_result text,
  ADD COLUMN IF NOT EXISTS pregnancy_check_method text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS offspring_alive integer,
  ADD COLUMN IF NOT EXISTS offspring_dead integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'breeding_records_check_result_allowed') THEN
    ALTER TABLE public.breeding_records
      ADD CONSTRAINT breeding_records_check_result_allowed
      CHECK (pregnancy_check_result IS NULL OR pregnancy_check_result IN ('Pregnant', 'Not pregnant'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'breeding_records_offspring_nonneg') THEN
    ALTER TABLE public.breeding_records
      ADD CONSTRAINT breeding_records_offspring_nonneg
      CHECK ((offspring_alive IS NULL OR offspring_alive >= 0) AND (offspring_dead IS NULL OR offspring_dead >= 0));
  END IF;
END $$;

COMMENT ON COLUMN public.breeding_records.heat_date IS 'Date heat (oestrus) was observed.';
COMMENT ON COLUMN public.breeding_records.pregnancy_check_result IS 'Pregnant | Not pregnant. Not pregnant sets status Failed.';
COMMENT ON COLUMN public.breeding_records.birth_date IS 'Actual birth date. Recording a birth sets status Completed.';
COMMENT ON COLUMN public.breeding_records.offspring_alive IS 'Number of offspring born alive.';
COMMENT ON COLUMN public.breeding_records.offspring_dead IS 'Number of offspring stillborn / died at birth.';
