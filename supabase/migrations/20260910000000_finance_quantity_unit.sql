-- ============================================================
-- Finance Quantity + Unit + Supplier — Phase 2
-- Migration: 20260910000000_finance_quantity_unit.sql
--
-- Additive, backward-compatible change to public.finance_records.
-- Lets a farmer OPTIONALLY record the physical quantity/unit and the
-- supplier for an expense (e.g. Diesel — 500 litres — ABC Fuel), so the
-- monthly reports can surface "how much" was purchased alongside spend.
--
-- IMPORTANT:
--   - quantity/unit/supplier are all NULLABLE. Existing rows (which have
--     NULL for all three) remain valid and behave exactly as before.
--   - Money is unchanged: `amount` remains the authoritative financial
--     value. quantity is informational/operational ONLY. There is no
--     price-per-unit and no automatic amount = quantity * price logic.
--   - No existing column is dropped or renamed. No data is modified.
--   - No RLS change: the existing finance_records ownership policies
--     (auth.uid() = user_id) already cover these new columns.
--
-- Constraints (mirroring the project's additive, guarded style):
--   - quantity, when supplied, must be > 0 (NULL still allowed).
--   - unit, when supplied, must be one of the controlled Feldrix units
--     (NULL still allowed). Kept in sync with src/constants/financeUnits.js.
-- ============================================================

ALTER TABLE public.finance_records
  ADD COLUMN IF NOT EXISTS quantity numeric NULL;

ALTER TABLE public.finance_records
  ADD COLUMN IF NOT EXISTS unit text NULL;

ALTER TABLE public.finance_records
  ADD COLUMN IF NOT EXISTS supplier text NULL;

COMMENT ON COLUMN public.finance_records.quantity IS
  'Optional physical quantity purchased/sold (e.g. 500). NULL = not recorded. Informational only; never multiplied into amount.';
COMMENT ON COLUMN public.finance_records.unit IS
  'Optional controlled unit for quantity: litre|kg|tonne|unit|bag|bale|head|hour. NULL = not recorded. Units are never auto-converted.';
COMMENT ON COLUMN public.finance_records.supplier IS
  'Optional free-text supplier/vendor name. NULL = not recorded.';

-- quantity must be positive when present. Guarded so re-runs are safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'finance_records_quantity_positive'
  ) THEN
    ALTER TABLE public.finance_records
      ADD CONSTRAINT finance_records_quantity_positive
      CHECK (quantity IS NULL OR quantity > 0);
  END IF;
END $$;

-- unit must be one of the controlled values when present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'finance_records_unit_allowed'
  ) THEN
    ALTER TABLE public.finance_records
      ADD CONSTRAINT finance_records_unit_allowed
      CHECK (
        unit IS NULL OR unit IN (
          'litre', 'kg', 'tonne', 'unit', 'bag', 'bale', 'head', 'hour'
        )
      );
  END IF;
END $$;
