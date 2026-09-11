/**
 * ============================================================
 * Feldrix — Crop Soil Preferences & Interpretation Bands (KNOWLEDGE layer)
 *
 * The single, centralized soil-interpretation knowledge base used by the soil
 * analysis engine (soilAnalysisService). It is region-NEUTRAL: the SAME config
 * serves United States and South African farms — there are no separate US/SA
 * engines. Country only changes which crop synonyms map to a key and which
 * reference data (USDA vs none) is available; the interpretation science here
 * is shared.
 *
 * SAFETY / HONESTY
 *   - pH ranges are TYPICAL PREFERRED ranges per crop (general agronomic
 *     references). They describe a preferred band — NOT a hard rule and NOT a
 *     yield-loss claim.
 *   - N/P/K bands are GENERIC guide ranges in mg/kg (ppm). Laboratory results
 *     vary by EXTRACTION METHOD (e.g. Mehlich-3, Bray-1, Olsen, ammonium
 *     acetate), so these bands are explicitly approximate. The engine surfaces
 *     this uncertainty and never claims cross-method comparability.
 *   - No thresholds live in React components — everything is here.
 *   - No exact application rates anywhere (that is a future agronomy engine).
 * ============================================================
 */

// ─── Crop-name normalization (US + SA + British synonyms) ─────────────────────
// Broader than the USA-4 US-only alias map: includes SA/British crop names so
// the same interpretation applies to KoolKop (SA) and BigBear (US) alike.
const CROP_KEY_ALIASES = {
  // maize / corn
  maize: "maize", corn: "maize", mielies: "maize",
  // soybeans
  soybean: "soybeans", soybeans: "soybeans", soya: "soybeans", soja: "soybeans",
  // wheat
  wheat: "wheat", "winter wheat": "wheat", "spring wheat": "wheat",
  // small grains
  barley: "barley", oats: "oats", sorghum: "sorghum", milo: "sorghum",
  // oilseeds
  sunflower: "sunflower", sunflowers: "sunflower", canola: "canola", rapeseed: "canola",
  // fibre / speciality
  cotton: "cotton", rice: "rice",
  // legumes / nuts
  peanut: "peanuts", peanuts: "peanuts", groundnut: "peanuts", groundnuts: "peanuts",
  "dry beans": "dry_beans", beans: "dry_beans", bean: "dry_beans",
  lucerne: "lucerne", alfalfa: "lucerne",
  // roots / veg
  potato: "potatoes", potatoes: "potatoes",
  // SA perennials (broad)
  sugarcane: "sugarcane",
};

/** Normalise a free-text crop name to a soil-preference key, or null. */
export function normalizeSoilCropKey(cropName) {
  if (!cropName) return null;
  const raw = String(cropName).trim().toLowerCase();
  if (CROP_KEY_ALIASES[raw]) return CROP_KEY_ALIASES[raw];
  for (const [alias, key] of Object.entries(CROP_KEY_ALIASES)) {
    if (raw.includes(alias)) return key;
  }
  return null;
}

// ─── Crop-specific preferred pH ranges (water pH, ~1:1 / 1:2.5) ───────────────
// General preferred bands; used to describe below/within/above preferred.
const CROP_PH = {
  maize:     { min: 5.8, max: 7.0 },
  soybeans:  { min: 6.0, max: 7.0 },
  wheat:     { min: 6.0, max: 7.0 },
  barley:    { min: 6.0, max: 7.5 },
  oats:      { min: 5.5, max: 7.0 },
  sorghum:   { min: 5.8, max: 7.0 },
  sunflower: { min: 6.0, max: 7.5 },
  canola:    { min: 5.5, max: 7.0 },
  cotton:    { min: 5.8, max: 7.5 },
  rice:      { min: 5.5, max: 6.5 },
  peanuts:   { min: 5.8, max: 6.5 },
  dry_beans: { min: 6.0, max: 7.0 },
  lucerne:   { min: 6.5, max: 7.5 },
  potatoes:  { min: 5.0, max: 6.5 }, // slightly acid preferred (scab management)
  sugarcane: { min: 5.5, max: 7.5 },
};

// A cautious general-purpose preferred range when the crop is unknown/unsupported.
export const DEFAULT_PH_RANGE = { min: 6.0, max: 7.0 };

/**
 * Preferred pH range for a crop (by name). Returns { min, max, cropSpecific }.
 * When the crop is unknown, returns the default range flagged cropSpecific=false
 * so callers can phrase it as a general range, not a crop claim.
 */
export function getPreferredPhRange(cropName) {
  const key = normalizeSoilCropKey(cropName);
  if (key && CROP_PH[key]) return { ...CROP_PH[key], cropSpecific: true, cropKey: key };
  return { ...DEFAULT_PH_RANGE, cropSpecific: false, cropKey: null };
}

// ─── Generic N / P / K interpretation bands (mg/kg, method-approximate) ───────
// These are GUIDE bands only. Because lab extraction methods differ, the engine
// treats these as approximate and always states the method-uncertainty caveat.
// Bands are inclusive-lower / exclusive-upper.
export const NPK_BANDS = {
  // Soil nitrate/available N is highly transient & method-dependent; bands are
  // intentionally coarse and flagged low-confidence by the engine.
  nitrogen: [
    { status: "low", max: 10 },
    { status: "adequate", min: 10, max: 25 },
    { status: "elevated", min: 25, max: 50 },
    { status: "high", min: 50 },
  ],
  phosphorus: [
    { status: "low", max: 15 },
    { status: "adequate", min: 15, max: 30 },
    { status: "elevated", min: 30, max: 50 },
    { status: "high", min: 50 },
  ],
  potassium: [
    { status: "low", max: 80 },
    { status: "adequate", min: 80, max: 175 },
    { status: "elevated", min: 175, max: 300 },
    { status: "high", min: 300 },
  ],
};

/**
 * Classify a nutrient value (mg/kg) into a band status, or null when the value
 * is missing. NEVER treats missing as zero.
 * @returns {"low"|"adequate"|"elevated"|"high"|null}
 */
export function classifyNutrient(nutrient, value) {
  if (value === null || value === undefined || value === "") return null;
  const v = Number(value);
  if (!Number.isFinite(v) || v < 0) return null;
  const bands = NPK_BANDS[nutrient];
  if (!bands) return null;
  for (const b of bands) {
    const okMin = b.min == null || v >= b.min;
    const okMax = b.max == null || v < b.max;
    if (okMin && okMax) return b.status;
  }
  return null;
}

// ─── Organic matter bands (%) — general, defensible ───────────────────────────
export const OM_BANDS = [
  { status: "low", max: 2 },
  { status: "moderate", min: 2, max: 4 },
  { status: "favorable", min: 4, max: 6 },
  { status: "elevated", min: 6 },
];

/** Classify organic matter % into a band, or null when missing. */
export function classifyOrganicMatter(value) {
  if (value === null || value === undefined || value === "") return null;
  const v = Number(value);
  if (!Number.isFinite(v) || v < 0) return null;
  for (const b of OM_BANDS) {
    const okMin = b.min == null || v >= b.min;
    const okMax = b.max == null || v < b.max;
    if (okMin && okMax) return b.status;
  }
  return null;
}

/**
 * Whether a crop key is recognised (so the engine can note "general range used"
 * when a crop is unknown). Exported for tests.
 */
export function isSupportedSoilCrop(cropName) {
  const key = normalizeSoilCropKey(cropName);
  return !!(key && CROP_PH[key]);
}
