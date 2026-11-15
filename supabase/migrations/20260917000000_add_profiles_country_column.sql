-- ============================================================
-- Add the missing `country` column to public.profiles
--
-- Root cause: the frontend (farm setup form, admin farm/user
-- services, executive timeline, crop intelligence farm context)
-- reads and writes profiles.country, and the original
-- handle_new_user() trigger (migration 20260807000000) also
-- inserted it. But NO migration ever created the column — it
-- must have been added manually on the previous Supabase project.
-- On a clean rebuild the column is absent, so:
--   * signup trigger failed  → HTTP 500 on /auth/v1/signup
--   * farm save failed        → "Could not find the 'country'
--                                column of 'profiles' in the
--                                schema cache"
--
-- Fix: add the column (nullable, text, default 'South Africa' to
-- match the app's default), then restore handle_new_user() to
-- populate it again. Additive and idempotent.
-- ============================================================

-- 1. Add the column the app expects.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'South Africa';

-- 2. Restore handle_new_user() to populate country (now that it
--    exists), keeping every other column the table actually has.
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
    country,
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
    'South Africa',
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

-- 3. Ensure the trigger is wired up (idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
