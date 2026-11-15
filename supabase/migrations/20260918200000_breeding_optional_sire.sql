-- ============================================================
-- Breeding: optional sire + sire details
--
-- Artificial insemination, an outside bull, or an animal bought already
-- pregnant have no sire registered on the farm, so male_id can no longer
-- be required. sire_details holds free text instead (e.g. AI straw code /
-- bull name, or "Neighbour's bull").
--
-- Additive and safe: existing rows keep their male_id; nothing is deleted.
-- ============================================================
ALTER TABLE public.breeding_records
  ALTER COLUMN male_id DROP NOT NULL;

ALTER TABLE public.breeding_records
  ADD COLUMN IF NOT EXISTS sire_details text;

COMMENT ON COLUMN public.breeding_records.male_id IS 'Registered sire on this farm. NULL for AI, outside bulls, or unknown sire.';
COMMENT ON COLUMN public.breeding_records.sire_details IS 'Free-text sire info when not a registered animal (e.g. AI straw code / bull name).';
