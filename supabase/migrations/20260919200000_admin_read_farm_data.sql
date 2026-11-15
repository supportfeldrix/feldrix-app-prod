-- ============================================================
-- OPTIONAL — Admin portal: read-only access to farm data
--
-- Lets staff whose role may view farms in the admin portal
-- ('admin', 'support', 'readonly' — see PERMISSION_MATRIX.canViewFarms)
-- READ every farm's operational records, so admin farm counts, health
-- scores and analytics show real numbers instead of 0.
--
-- READ ONLY: no insert/update/delete is granted. Farmers' own policies are
-- unchanged. Apply only if your privacy policy / terms allow staff to view
-- customer farm data.
--
-- Tables that don't exist are skipped.
--
-- WARNING: many farmer-app queries rely on RLS for scoping (no user_id
-- filter). A staff account that ALSO uses the farmer app would see every
-- farm's animals, flocks and finance there. Use separate accounts for
-- staff and for farming, or add user_id filters to the farmer services
-- before applying this.
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_view_farm_data()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'support', 'readonly')
  );
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'livestock', 'livestock_flocks', 'flock_daily_logs', 'flock_mortality',
    'breeding_records', 'animal_health', 'weight_history',
    'crops', 'crop_harvests', 'finance_records', 'planner_tasks', 'machinery'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff can view all ' || t, t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_view_farm_data())',
        'Staff can view all ' || t, t);
    END IF;
  END LOOP;
END $$;
