-- ============================================================
-- Offspring link: calves/lambs/kids registered from a recorded birth
--
-- dam_id            → the mother (livestock row)
-- breeding_record_id → the breeding/birth they came from
--
-- Both nullable and ON DELETE SET NULL, so deleting a mother or a
-- breeding record never deletes the offspring. Additive only.
-- ============================================================
ALTER TABLE public.livestock
  ADD COLUMN IF NOT EXISTS dam_id uuid REFERENCES public.livestock(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS breeding_record_id uuid REFERENCES public.breeding_records(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_livestock_dam ON public.livestock USING btree (dam_id);
CREATE INDEX IF NOT EXISTS idx_livestock_breeding_record ON public.livestock USING btree (breeding_record_id);

COMMENT ON COLUMN public.livestock.dam_id IS 'Mother of this animal, when born on the farm and registered from a birth record.';
COMMENT ON COLUMN public.livestock.breeding_record_id IS 'Breeding record (birth) this animal was registered from.';
