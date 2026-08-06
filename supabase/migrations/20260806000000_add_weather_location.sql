-- Add weather_location column to profiles for user-specific weather forecasts.
-- Stores a location string (e.g. "Stellenbosch,ZA") used by the weather API.
-- Falls back to the VITE_WEATHER_LOCATION env default if not set.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weather_location text;
