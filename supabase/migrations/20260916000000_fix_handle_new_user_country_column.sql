-- ============================================================
-- Fix: handle_new_user() trigger references a non-existent column
--
-- Root cause: the 20260807000000 migration redefined
-- handle_new_user() to INSERT a `country` column into
-- public.profiles. That column does not exist on the profiles
-- table (the table uses `province` / `region_state`, and later
-- migrations added `preferred_units`, `currency`,
-- `measurement_system`, etc. — but never `country`).
--
-- Effect: every auth signup fired the AFTER INSERT trigger on
-- auth.users, the INSERT into public.profiles failed with
-- "column \"country\" of relation \"profiles\" does not exist",
-- the auth.users insert rolled back, and Supabase Auth returned
-- HTTP 500 on /auth/v1/signup ("Database error saving new user").
--
-- Fix: redefine handle_new_user() to insert ONLY columns that
-- exist on public.profiles. Drop the invalid `country` column.
-- Keep `preferred_units` (it exists) and the notification prefs.
-- Idempotent and additive — safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    farm_name,
    farm_type,
    preferred_units,
    weather_alerts,
    ai_recommendations,
    weekly_summary,
    email_notifications,
    sms_notifications,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'farm_name', ''),
    'Mixed Farming',
    'Metric',
    true,
    true,
    true,
    true,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    farm_name = COALESCE(NULLIF(EXCLUDED.farm_name, ''), public.profiles.farm_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure the trigger is wired up (idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
