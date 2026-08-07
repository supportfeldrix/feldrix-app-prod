-- ============================================================
-- Fix: Update handle_new_user trigger to capture full_name and
-- farm_name from raw_user_meta_data (passed via signUp options.data).
--
-- This eliminates the need for a client-side profiles INSERT
-- after registration, avoiding the RLS violation when no session
-- exists (MAILER_AUTOCONFIRM=false).
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
