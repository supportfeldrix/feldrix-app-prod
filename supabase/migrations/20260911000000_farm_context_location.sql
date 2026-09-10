-- ═══════════════════════════════════════════════════════════════════════════════
-- USA-1 — Farm Context & Location Foundation
-- Migration: 20260911000000_farm_context_location.sql
--
-- Additive, backward-compatible. Adds nullable farm-context columns to
-- public.profiles (the table the app currently uses for farm context — one
-- farm per user). This is the smallest change that fits the current model.
--
-- GOALS (USA-1 only — storage foundation, no behaviour change):
--   Let Feldrix know WHERE a farm is and its regional context:
--     region_state, latitude, longitude, timezone, currency,
--     measurement_system, agricultural_region, hardiness_zone
--
-- SAFETY:
--   • Every new column is NULLABLE. Existing rows remain valid and unchanged.
--   • Existing columns (country, province, preferred_units, weather_location,
--     farm_type, farm_size) are NOT renamed, dropped, or modified.
--   • NO data backfill — we do not invent values for existing SA profiles.
--     Effective defaults (metric / ZAR / Africa/Johannesburg) are resolved at
--     read time by the application (getFarmContext), not written here.
--   • NO RLS changes — existing owner-scoped profile policies already cover
--     the new columns.
--   • NO changes to subscription/billing tables, farms table, or any other
--     table. No farm_settings table is created (deferred).
--
-- FUTURE (deferred, documented for later phases):
--   USA-2 uses measurement_system + currency for display conversion.
--   USA-3 uses latitude/longitude/timezone for weather.
--   USA-4 uses agricultural_region + hardiness_zone for crop intelligence.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region_state text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude numeric NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude numeric NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS measurement_system text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agricultural_region text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hardiness_zone text NULL;

COMMENT ON COLUMN public.profiles.region_state IS
  'Administrative region: US state (or other country subdivision). Complements the existing province column; not a rename.';
COMMENT ON COLUMN public.profiles.latitude IS
  'Farm latitude in decimal degrees (-90..90). NULL = not resolved. Resolved from the farm location via existing geocoding.';
COMMENT ON COLUMN public.profiles.longitude IS
  'Farm longitude in decimal degrees (-180..180). NULL = not resolved.';
COMMENT ON COLUMN public.profiles.timezone IS
  'IANA timezone (e.g. America/Chicago, Africa/Johannesburg). NULL when not reliably resolvable. Never store a UTC offset.';
COMMENT ON COLUMN public.profiles.currency IS
  'Farm OPERATING currency (ISO 4217, e.g. ZAR, USD). NOT the Feldrix subscription billing currency (which stays ZAR).';
COMMENT ON COLUMN public.profiles.measurement_system IS
  'metric | us_customary. USA-1 stores only; display conversion is USA-2.';
COMMENT ON COLUMN public.profiles.agricultural_region IS
  'Optional coarse agricultural region identifier. Preparation for USA-4 crop intelligence. No agronomic rules yet.';
COMMENT ON COLUMN public.profiles.hardiness_zone IS
  'Optional USDA-style hardiness zone (perennial suitability reference). Preparation for USA-4. NOT a crop calendar.';

-- Safe CHECK constraints (all allow NULL so existing rows pass). Guarded so
-- the migration is safe to re-run.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_latitude_range') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_latitude_range
      CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_longitude_range') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_longitude_range
      CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_measurement_system_allowed') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_measurement_system_allowed
      CHECK (measurement_system IS NULL OR measurement_system IN ('metric', 'us_customary'));
  END IF;
END $$;
