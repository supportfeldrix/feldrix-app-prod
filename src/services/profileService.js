import { supabase } from "../supabaseClient";
import { getCountryConfig, normalizeCountry } from "../constants/locations";

/**
 * Returns the currently authenticated user.
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  return user;
}

/**
 * Returns the logged-in user's profile.
 */
export async function getProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

/**
 * Creates a profile if one doesn't already exist.
 */
export async function createProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const profile = await getProfile();

  if (profile) {
    return profile;
  }

  const newProfile = {
    id: user.id,
    full_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "",
    email: user.email,
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Updates the user's profile.
 */
export async function updateProfile(values) {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/*
|--------------------------------------------------------------------------
| Farm Context (USA-1)
|--------------------------------------------------------------------------
| A small reusable representation of WHERE a farm is and its regional
| context, derived from the existing profiles row. This prevents future
| USA-2/3/4 work from repeatedly reading scattered profile fields.
|
| Effective defaults (metric / ZAR / Africa/Johannesburg) are resolved HERE
| at read time — they are NOT written into the database for existing rows,
| so no existing data is overwritten. USA-1 stores settings only; it does
| not convert units/currency or change weather/crop/report behaviour.
*/

const IANA_TIMEZONE_RE = /^[A-Za-z]+\/[A-Za-z0-9_+\-/]+$/;
const CURRENCY_RE = /^[A-Za-z]{3}$/;

/** Coerce a value to a finite number within [min, max], else null. */
function numOrNull(value, min, max) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (typeof min === "number" && n < min) return null;
  if (typeof max === "number" && n > max) return null;
  return n;
}

function strOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

/**
 * Normalise farm-context fields before persisting. Empty → null; numbers
 * range-validated; currency upper-cased; measurement_system constrained;
 * timezone accepted only if it looks like an IANA name (else null, never
 * invented). Unknown keys are passed through untouched so other profile
 * updates keep working.
 */
export function normalizeFarmContextValues(values = {}) {
  const out = { ...values };

  if ("country" in out) out.country = strOrNull(normalizeCountry(out.country)) || out.country || null;
  if ("region_state" in out) out.region_state = strOrNull(out.region_state);
  if ("province" in out) out.province = strOrNull(out.province);
  if ("latitude" in out) out.latitude = numOrNull(out.latitude, -90, 90);
  if ("longitude" in out) out.longitude = numOrNull(out.longitude, -180, 180);
  if ("agricultural_region" in out) out.agricultural_region = strOrNull(out.agricultural_region);
  if ("hardiness_zone" in out) out.hardiness_zone = strOrNull(out.hardiness_zone);

  if ("timezone" in out) {
    const tz = strOrNull(out.timezone);
    out.timezone = tz && IANA_TIMEZONE_RE.test(tz) ? tz : null; // never invent
  }

  if ("currency" in out) {
    const cur = strOrNull(out.currency);
    out.currency = cur && CURRENCY_RE.test(cur) ? cur.toUpperCase() : null;
  }

  if ("measurement_system" in out) {
    const ms = strOrNull(out.measurement_system);
    out.measurement_system = ms === "us_customary" || ms === "metric" ? ms : null;
  }

  return out;
}

/**
 * Update the profile with normalized farm-context values. Thin wrapper over
 * updateProfile so callers cannot accidentally persist "" or out-of-range
 * coordinates. Non-context keys pass through unchanged.
 */
export async function updateFarmContext(values) {
  return updateProfile(normalizeFarmContextValues(values));
}

/**
 * Build the reusable farm-context object from a profile row (or the current
 * profile if none passed). Resolves EFFECTIVE defaults without mutating the DB:
 *   - measurementSystem: stored value → country default → "metric"
 *   - currency:          stored value → country default → "ZAR"
 *   - timezone:          stored value → "Africa/Johannesburg" for SA → null
 * SA farms therefore continue to behave exactly as before.
 */
export async function getFarmContext(profileArg) {
  const profile = profileArg || (await getProfile());
  if (!profile) return null;

  const country = normalizeCountry(profile.country) || profile.country || null;
  const config = getCountryConfig(country);

  const measurementSystem =
    profile.measurement_system || config.defaultMeasurementSystem || "metric";
  const currency = profile.currency || config.defaultCurrency || "ZAR";

  let timezone = profile.timezone || null;
  if (!timezone && config.code === "ZA") {
    timezone = "Africa/Johannesburg"; // safe, derived (not written to DB)
  }

  return {
    country,
    // The administrative region: prefer the new region_state, fall back to
    // the existing province so nothing breaks for current SA users.
    state: profile.region_state || null,
    province: profile.province || null,
    region: profile.region_state || profile.province || null,
    regionLabel: config.regionLabel,
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    timezone,
    currency,
    measurementSystem,
    agriculturalRegion: profile.agricultural_region || null,
    hardinessZone: profile.hardiness_zone || null,
    weatherLocation: profile.weather_location || null,
    farmName: profile.farm_name || null,
    farmSize: profile.farm_size ?? null,
  };
}
