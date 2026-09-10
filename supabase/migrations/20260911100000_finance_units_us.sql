-- ═══════════════════════════════════════════════════════════════════════════════
-- USA-2 — Widen finance_records.unit to allow US customary units
-- Migration: 20260911100000_finance_units_us.sql
--
-- Additive, backward-compatible. The Phase-2 CHECK constraint
-- (finance_records_unit_allowed, from 20260910000000_finance_quantity_unit.sql)
-- restricted `unit` to 8 metric/universal values. USA-2 lets US farms record
-- gallons/lb/ton/acre/inch, so we WIDEN the allowed set.
--
-- SAFETY:
--   • Only the CHECK constraint changes; no data is modified or converted.
--     Existing rows use the original values, which remain allowed.
--   • unit stays NULLABLE. No other column/table/RLS/billing change.
--   • Units are stored as chosen and never auto-converted (a litre stays a
--     litre; a gallon stays a gallon). Display conversion is app-side only.
--   • Kept in sync with src/constants/financeUnits.js (ALL_FINANCE_UNITS).
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Drop the old constraint if present, then add the widened one.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_records_unit_allowed') THEN
    ALTER TABLE public.finance_records DROP CONSTRAINT finance_records_unit_allowed;
  END IF;

  ALTER TABLE public.finance_records
    ADD CONSTRAINT finance_records_unit_allowed
    CHECK (
      unit IS NULL OR unit IN (
        -- Metric / universal (original Phase 2 set)
        'litre', 'kg', 'tonne', 'unit', 'bag', 'bale', 'head', 'hour',
        -- US customary (USA-2)
        'gallon', 'lb', 'ton', 'acre', 'inch'
      )
    );
END $$;
