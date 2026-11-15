-- ============================================================
-- SECURITY: tenant isolation for public.breeding_records
--
-- No migration ever enabled RLS or created policies on this table, so any
-- holder of the (public) anon key could read/modify every farm's breeding
-- records. This enables RLS with the same owner-scoped policies used by
-- livestock / crops / animal_health.
--
-- Before applying, check for rows without an owner (they would become
-- invisible to everyone except the service role):
--   SELECT count(*) FROM public.breeding_records WHERE user_id IS NULL;
-- The backfill below assigns them to the owner of the female animal.
-- ============================================================

-- Backfill missing owners from the female animal (no-op if none).
UPDATE public.breeding_records br
   SET user_id = l.user_id
  FROM public.livestock l
 WHERE br.user_id IS NULL
   AND l.id = br.female_id;

ALTER TABLE public.breeding_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breeding records" ON public.breeding_records;
CREATE POLICY "Users can view own breeding records"
  ON public.breeding_records FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Insert/update also require the female to belong to the caller, so a
-- record can't be attached to another farm's animal.
DROP POLICY IF EXISTS "Users can insert own breeding records" ON public.breeding_records;
CREATE POLICY "Users can insert own breeding records"
  ON public.breeding_records FOR INSERT TO public
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = female_id AND l.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own breeding records" ON public.breeding_records;
CREATE POLICY "Users can update own breeding records"
  ON public.breeding_records FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = female_id AND l.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own breeding records" ON public.breeding_records;
CREATE POLICY "Users can delete own breeding records"
  ON public.breeding_records FOR DELETE TO public
  USING (auth.uid() = user_id);
