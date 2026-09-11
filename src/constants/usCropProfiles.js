/**
 * ============================================================
 * Feldrix — US Regional Crop Profiles (USA-4)
 *
 * A CONFIGURATION/DATA layer (no database) describing TYPICAL, EXPECTED
 * planting and harvest windows, growing-season length and frost sensitivity
 * for the major US field crops Feldrix supports.
 *
 * SOURCE / BASIS
 *   Windows are based on the USDA NASS handbook "Usual Planting and Harvesting
 *   Dates for U.S. Field Crops" (public domain) and standard USDA regional
 *   agronomic references. They are TYPICAL / EXPECTED ranges — NOT rules.
 *   Content was summarised for compliance with licensing restrictions.
 *
 * PRECISION HONESTY (USA-4 §15)
 *   These are broad REGION / national-typical windows, never county-level
 *   precision. UI must phrase them as "typical", "expected", "estimated",
 *   "regional expectation" — never "must plant on".
 *
 * EXTENSIBILITY
 *   Resolution is by broad agricultural region (derived from the farm's
 *   region_state) with a national-typical fallback per crop. This is designed
 *   to be extended later with finer (county-level) profiles without changing
 *   the consuming code.
 *
 * MODEL (per crop, per region — see design §4):
 *   {
 *     plantingStart: "MM-DD", plantingEnd: "MM-DD",
 *     harvestStart:  "MM-DD", harvestEnd:  "MM-DD",
 *     growingDaysMin: number, growingDaysMax: number,
 *     frostSensitive: boolean,
 *     notes?: string
 *   }
 *   Dates are month-day (no year) because windows recur annually. All timing
 *   math treats them as day-of-year and is timezone-neutral.
 * ============================================================
 */

// ─── Broad US agricultural regions ────────────────────────────────────────────
// Coarse but defensible groupings used to pick a region-appropriate profile.
export const US_REGIONS = {
  MIDWEST: "midwest",             // Corn Belt + Upper Midwest
  NORTHERN_PLAINS: "northern_plains",
  SOUTHERN_PLAINS: "southern_plains",
  SOUTHEAST: "southeast",
  SOUTHWEST: "southwest",
  NORTHEAST: "northeast",
  PACIFIC: "pacific",
  NATIONAL: "national",           // fallback when the state/region is unknown
};

// State (name or USPS abbr) → broad region. Lower-cased on lookup.
const STATE_TO_REGION = {
  // Midwest / Corn Belt
  iowa: "midwest", ia: "midwest", illinois: "midwest", il: "midwest",
  indiana: "midwest", in: "midwest", ohio: "midwest", oh: "midwest",
  missouri: "midwest", mo: "midwest", minnesota: "midwest", mn: "midwest",
  wisconsin: "midwest", wi: "midwest", michigan: "midwest", mi: "midwest",
  // Northern Plains
  "north dakota": "northern_plains", nd: "northern_plains",
  "south dakota": "northern_plains", sd: "northern_plains",
  nebraska: "northern_plains", ne: "northern_plains",
  kansas: "northern_plains", ks: "northern_plains",
  montana: "northern_plains", mt: "northern_plains",
  wyoming: "northern_plains", wy: "northern_plains",
  // Southern Plains
  texas: "southern_plains", tx: "southern_plains",
  oklahoma: "southern_plains", ok: "southern_plains",
  // Southeast
  georgia: "southeast", ga: "southeast", alabama: "southeast", al: "southeast",
  mississippi: "southeast", ms: "southeast", florida: "southeast", fl: "southeast",
  "south carolina": "southeast", sc: "southeast",
  "north carolina": "southeast", nc: "southeast",
  tennessee: "southeast", tn: "southeast", arkansas: "southeast", ar: "southeast",
  louisiana: "southeast", la: "southeast", kentucky: "southeast", ky: "southeast",
  virginia: "southeast", va: "southeast",
  // Southwest
  arizona: "southwest", az: "southwest", "new mexico": "southwest", nm: "southwest",
  nevada: "southwest", nv: "southwest", utah: "southwest", ut: "southwest",
  // Pacific
  california: "pacific", ca: "pacific", oregon: "pacific", or: "pacific",
  washington: "pacific", wa: "pacific", idaho: "pacific", id: "pacific",
  // Northeast
  "new york": "northeast", ny: "northeast", pennsylvania: "northeast", pa: "northeast",
  maine: "northeast", me: "northeast", vermont: "northeast", vt: "northeast",
  "new hampshire": "northeast", nh: "northeast", massachusetts: "northeast", ma: "northeast",
  connecticut: "northeast", ct: "northeast", "rhode island": "northeast", ri: "northeast",
  "new jersey": "northeast", nj: "northeast", delaware: "northeast", de: "northeast",
  maryland: "northeast", md: "northeast", "west virginia": "northeast", wv: "northeast",
};

/**
 * Resolve a broad US agricultural region from a farm's region_state.
 * Returns US_REGIONS.NATIONAL when the state is unknown/blank.
 */
export function resolveUsRegion(regionState) {
  if (!regionState) return US_REGIONS.NATIONAL;
  const key = String(regionState).trim().toLowerCase();
  return STATE_TO_REGION[key] || US_REGIONS.NATIONAL;
}

// ─── Crop-name normalisation ──────────────────────────────────────────────────
// Feldrix uses SA/British crop names (free-text field). Map both SA canonical
// names and common US synonyms to a single profile key.
const CROP_ALIASES = {
  corn: "maize", maize: "maize", mielies: "maize",
  soybean: "soybeans", soybeans: "soybeans", soya: "soybeans", soja: "soybeans",
  wheat: "wheat", "winter wheat": "wheat", "spring wheat": "wheat",
  cotton: "cotton",
  sorghum: "sorghum", milo: "sorghum",
  sunflower: "sunflower", sunflowers: "sunflower",
  canola: "canola", rapeseed: "canola",
  rice: "rice",
  peanut: "peanuts", peanuts: "peanuts", groundnut: "peanuts", groundnuts: "peanuts",
  potato: "potatoes", potatoes: "potatoes",
};

/** Normalise a free-text crop name to a US profile key, or null if unsupported. */
export function normalizeUsCropKey(cropName) {
  if (!cropName) return null;
  const raw = String(cropName).trim().toLowerCase();
  if (CROP_ALIASES[raw]) return CROP_ALIASES[raw];
  // Partial/contains match (e.g. "yellow maize", "hard red winter wheat").
  for (const [alias, key] of Object.entries(CROP_ALIASES)) {
    if (raw.includes(alias)) return key;
  }
  return null;
}

// ─── Regional crop profiles ───────────────────────────────────────────────────
// Structure: PROFILES[cropKey][regionKey] = profile. Every crop has a
// `national` entry used as the fallback when a region-specific one is absent.
// Windows are TYPICAL ranges (USDA NASS basis). growingDays reflect common
// season length; frostSensitive flags warm-season/tender crops.
const PROFILES = {
  maize: {
    national:        { plantingStart: "04-15", plantingEnd: "05-31", harvestStart: "09-15", harvestEnd: "11-15", growingDaysMin: 90, growingDaysMax: 130, frostSensitive: true },
    midwest:         { plantingStart: "04-20", plantingEnd: "05-25", harvestStart: "09-25", harvestEnd: "11-10", growingDaysMin: 100, growingDaysMax: 130, frostSensitive: true, notes: "Corn Belt: planting peaks late April–mid May." },
    northern_plains: { plantingStart: "04-25", plantingEnd: "05-31", harvestStart: "10-01", harvestEnd: "11-15", growingDaysMin: 95, growingDaysMax: 120, frostSensitive: true },
    southern_plains: { plantingStart: "03-15", plantingEnd: "05-10", harvestStart: "08-01", harvestEnd: "10-15", growingDaysMin: 100, growingDaysMax: 130, frostSensitive: true },
    southeast:       { plantingStart: "03-15", plantingEnd: "05-01", harvestStart: "08-01", harvestEnd: "10-01", growingDaysMin: 95, growingDaysMax: 125, frostSensitive: true },
  },
  soybeans: {
    national:        { plantingStart: "05-01", plantingEnd: "06-20", harvestStart: "09-20", harvestEnd: "11-10", growingDaysMin: 100, growingDaysMax: 140, frostSensitive: true },
    midwest:         { plantingStart: "05-01", plantingEnd: "06-10", harvestStart: "09-25", harvestEnd: "10-31", growingDaysMin: 110, growingDaysMax: 140, frostSensitive: true, notes: "Corn Belt: often planted alongside/after corn." },
    northern_plains: { plantingStart: "05-10", plantingEnd: "06-15", harvestStart: "09-25", harvestEnd: "10-31", growingDaysMin: 100, growingDaysMax: 130, frostSensitive: true },
    southern_plains: { plantingStart: "05-01", plantingEnd: "06-30", harvestStart: "09-15", harvestEnd: "11-15", growingDaysMin: 100, growingDaysMax: 140, frostSensitive: true },
    southeast:       { plantingStart: "05-01", plantingEnd: "07-01", harvestStart: "10-01", harvestEnd: "11-20", growingDaysMin: 100, growingDaysMax: 140, frostSensitive: true },
  },
  wheat: {
    // Winter wheat is the dominant US type: planted autumn, harvested early summer.
    national:        { plantingStart: "09-15", plantingEnd: "11-01", harvestStart: "06-01", harvestEnd: "07-31", growingDaysMin: 240, growingDaysMax: 300, frostSensitive: false, notes: "Winter wheat: autumn planted, early-summer harvest." },
    southern_plains: { plantingStart: "09-15", plantingEnd: "10-31", harvestStart: "05-25", harvestEnd: "07-01", growingDaysMin: 230, growingDaysMax: 290, frostSensitive: false, notes: "Hard red winter wheat belt (KS/OK/TX)." },
    northern_plains: { plantingStart: "04-01", plantingEnd: "05-20", harvestStart: "07-25", harvestEnd: "09-10", growingDaysMin: 90, growingDaysMax: 120, frostSensitive: false, notes: "Spring wheat: spring planted, late-summer harvest." },
    pacific:         { plantingStart: "09-15", plantingEnd: "11-01", harvestStart: "07-01", harvestEnd: "08-31", growingDaysMin: 250, growingDaysMax: 300, frostSensitive: false },
  },
  cotton: {
    national:        { plantingStart: "04-01", plantingEnd: "06-01", harvestStart: "09-15", harvestEnd: "12-15", growingDaysMin: 150, growingDaysMax: 200, frostSensitive: true },
    southern_plains: { plantingStart: "05-01", plantingEnd: "06-20", harvestStart: "10-01", harvestEnd: "12-31", growingDaysMin: 150, growingDaysMax: 190, frostSensitive: true, notes: "Texas High Plains: later planting window." },
    southeast:       { plantingStart: "04-15", plantingEnd: "05-31", harvestStart: "09-15", harvestEnd: "11-30", growingDaysMin: 150, growingDaysMax: 190, frostSensitive: true },
    southwest:       { plantingStart: "03-15", plantingEnd: "05-01", harvestStart: "09-01", harvestEnd: "11-30", growingDaysMin: 160, growingDaysMax: 200, frostSensitive: true },
  },
  sorghum: {
    national:        { plantingStart: "04-15", plantingEnd: "06-30", harvestStart: "09-01", harvestEnd: "11-30", growingDaysMin: 100, growingDaysMax: 140, frostSensitive: true },
    southern_plains: { plantingStart: "03-15", plantingEnd: "06-30", harvestStart: "08-15", harvestEnd: "11-30", growingDaysMin: 100, growingDaysMax: 130, frostSensitive: true, notes: "KS/TX are leading grain-sorghum states." },
    northern_plains: { plantingStart: "05-15", plantingEnd: "06-20", harvestStart: "09-25", harvestEnd: "11-01", growingDaysMin: 95, growingDaysMax: 120, frostSensitive: true },
  },
  sunflower: {
    national:        { plantingStart: "05-01", plantingEnd: "06-20", harvestStart: "09-15", harvestEnd: "11-01", growingDaysMin: 90, growingDaysMax: 130, frostSensitive: true },
    northern_plains: { plantingStart: "05-15", plantingEnd: "06-20", harvestStart: "09-20", harvestEnd: "10-31", growingDaysMin: 90, growingDaysMax: 120, frostSensitive: true, notes: "ND/SD lead US sunflower production." },
  },
  canola: {
    national:        { plantingStart: "04-15", plantingEnd: "05-31", harvestStart: "08-01", harvestEnd: "09-15", growingDaysMin: 85, growingDaysMax: 120, frostSensitive: false },
    northern_plains: { plantingStart: "04-20", plantingEnd: "05-31", harvestStart: "08-01", harvestEnd: "09-10", growingDaysMin: 85, growingDaysMax: 115, frostSensitive: false, notes: "Spring canola; ND dominates US acreage." },
    pacific:         { plantingStart: "09-01", plantingEnd: "10-15", harvestStart: "06-15", harvestEnd: "07-31", growingDaysMin: 250, growingDaysMax: 300, frostSensitive: false, notes: "Winter canola in the PNW." },
  },
  rice: {
    national:        { plantingStart: "03-15", plantingEnd: "05-31", harvestStart: "08-15", harvestEnd: "10-31", growingDaysMin: 105, growingDaysMax: 150, frostSensitive: true },
    southeast:       { plantingStart: "03-15", plantingEnd: "05-20", harvestStart: "08-15", harvestEnd: "10-31", growingDaysMin: 105, growingDaysMax: 150, frostSensitive: true, notes: "Arkansas Grand Prairie / Mississippi Delta." },
    pacific:         { plantingStart: "04-15", plantingEnd: "05-31", harvestStart: "09-15", harvestEnd: "10-31", growingDaysMin: 120, growingDaysMax: 165, frostSensitive: true, notes: "Sacramento Valley (CA)." },
  },
  peanuts: {
    national:        { plantingStart: "04-15", plantingEnd: "06-10", harvestStart: "09-15", harvestEnd: "11-15", growingDaysMin: 120, growingDaysMax: 160, frostSensitive: true },
    southeast:       { plantingStart: "04-20", plantingEnd: "05-31", harvestStart: "09-20", harvestEnd: "11-10", growingDaysMin: 120, growingDaysMax: 160, frostSensitive: true, notes: "GA leads US peanut production." },
    southern_plains: { plantingStart: "05-01", plantingEnd: "06-10", harvestStart: "10-01", harvestEnd: "11-15", growingDaysMin: 130, growingDaysMax: 160, frostSensitive: true },
  },
  potatoes: {
    national:        { plantingStart: "03-15", plantingEnd: "05-31", harvestStart: "08-01", harvestEnd: "10-15", growingDaysMin: 90, growingDaysMax: 135, frostSensitive: true },
    pacific:         { plantingStart: "04-01", plantingEnd: "05-15", harvestStart: "09-01", harvestEnd: "10-31", growingDaysMin: 100, growingDaysMax: 135, frostSensitive: true, notes: "Idaho/Columbia Basin." },
    northern_plains: { plantingStart: "04-20", plantingEnd: "05-31", harvestStart: "09-01", harvestEnd: "10-10", growingDaysMin: 90, growingDaysMax: 120, frostSensitive: true },
    northeast:       { plantingStart: "04-15", plantingEnd: "05-31", harvestStart: "08-15", harvestEnd: "10-15", growingDaysMin: 90, growingDaysMax: 120, frostSensitive: true, notes: "Maine." },
  },
};

/**
 * Look up the TYPICAL regional crop profile for a crop + farm region.
 * Falls back to the crop's national-typical window, then null if the crop is
 * not a supported US field crop (caller then shows NO regional timing — never
 * a guess). Return object is augmented with { crop, region, source }.
 *
 * @param {string} cropName - free-text crop name (SA or US synonym)
 * @param {string} regionState - farm's region_state (state name or abbr)
 * @returns {object|null}
 */
export function getUsCropProfile(cropName, regionState) {
  const key = normalizeUsCropKey(cropName);
  if (!key || !PROFILES[key]) return null;

  const region = resolveUsRegion(regionState);
  const byCrop = PROFILES[key];
  const profile = byCrop[region] || byCrop.national;
  if (!profile) return null;

  return {
    ...profile,
    crop: key,
    region: byCrop[region] ? region : US_REGIONS.NATIONAL,
    source: "USDA NASS (typical regional windows)",
  };
}

/** List of supported US crop profile keys (for tests/introspection). */
export function getSupportedUsCrops() {
  return Object.keys(PROFILES);
}
