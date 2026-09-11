/**
 * ============================================================
 * Feldrix — Soil Intelligence Service (USA-5)
 *
 * The single entry point the UI uses for location-based soil REFERENCE. It
 * centralizes the country/provider decision (US farms with valid coordinates →
 * USDA NRCS SSURGO; everyone else → a clean "unavailable" state) so no
 * USA-specific branching leaks into React components — mirroring the weather
 * service's shouldUseNws gate.
 *
 * This is REFERENCE ONLY. It never reads, writes, or interprets the farmer's
 * measured Ground Sampling data, and it produces NO agronomic recommendations
 * (USA-5 is the soil-data foundation; interpretation is a future phase).
 * ============================================================
 */

import { fetchSsurgoSoil, clearSsurgoCache } from "./ssurgoProvider";

// Clean, explicit UI states so components never guess.
export const SOIL_STATUS = {
  AVAILABLE: "available",
  NO_LOCATION: "unavailable_no_location", // US farm but no lat/lon set
  NOT_US: "not_us",                       // non-US farm → no USDA lookup at all
  NO_COVERAGE: "no_coverage",             // US point outside any soil survey
  ERROR: "error",                         // transient service/timeout/parse error
};

/**
 * Decide whether a farm should use the USDA SSURGO soil reference.
 * US farm + finite latitude/longitude only. Explicit null guard avoids
 * Number(null) === 0 sending a coordinate-less farm to (0,0).
 * @param {object} farmCtx - from getFarmContext()/useFarmContext()
 */
export function shouldUseSsurgo(farmCtx) {
  if (!farmCtx) return false;
  const country = String(farmCtx.country || "").toLowerCase();
  const isUs = country === "united states" || country === "us" || country === "usa";
  if (!isUs) return false;
  if (farmCtx.latitude == null || farmCtx.longitude == null) return false;
  return Number.isFinite(Number(farmCtx.latitude)) && Number.isFinite(Number(farmCtx.longitude));
}

// In-flight request de-duplication (multiple components mounting at once).
const pending = new Map();

/**
 * Get the location-based soil reference for a farm. NEVER throws — always
 * resolves to a { available, status, data } envelope so the UI can render a
 * clean state. SA / no-coordinate / non-US farms resolve WITHOUT any network
 * call (SA-safe, no USDA request).
 *
 * @param {object} farmCtx
 * @returns {Promise<{ available: boolean, status: string, data: object|null }>}
 */
export async function getSoilReference(farmCtx) {
  // Country gate first — non-US farms never trigger a USDA lookup.
  const country = String(farmCtx?.country || "").toLowerCase();
  const isUs = country === "united states" || country === "us" || country === "usa";
  if (!isUs) {
    return { available: false, status: SOIL_STATUS.NOT_US, data: null };
  }
  // US farm but no coordinates → cannot look up; ask the farmer to set location.
  if (!shouldUseSsurgo(farmCtx)) {
    return { available: false, status: SOIL_STATUS.NO_LOCATION, data: null };
  }

  const lat = Number(farmCtx.latitude);
  const lon = Number(farmCtx.longitude);
  const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`;

  if (pending.has(key)) return pending.get(key);

  const promise = (async () => {
    const model = await fetchSsurgoSoil(lat, lon);
    if (!model) {
      return { available: false, status: SOIL_STATUS.ERROR, data: null };
    }
    if (model.coverage_status === "no_coverage") {
      return { available: false, status: SOIL_STATUS.NO_COVERAGE, data: model };
    }
    return { available: true, status: SOIL_STATUS.AVAILABLE, data: model };
  })();

  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}

/** Clear cached soil references (delegates to the provider cache). */
export function clearSoilReferenceCache() {
  clearSsurgoCache();
}
