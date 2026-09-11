/**
 * ============================================================
 * Feldrix — US Livestock Regional Profiles (USA-6, KNOWLEDGE layer)
 *
 * Centralized, region-aware livestock KNOWLEDGE (no vet protocols). It provides:
 *   - species capability flags (does breeding apply? is a birth date meaningful?)
 *   - record-completeness EXPECTATIONS per species (which fields matter)
 *   - a broad US agricultural-region resolver from the farm's state
 *
 * ARCHITECTURE (Europe-ready)
 *   This is the US regional provider. A future `euLivestockProfiles.js` can
 *   expose the SAME shape; the shared livestock intelligence engine
 *   (utils/livestockIntelligence.js) consumes whichever provider the farm
 *   context selects. There is NO `if (country === "US")` in components — the
 *   region decision is centralized here + in the engine.
 *
 * SAFETY
 *   - No vaccination schedules, medication, dosages, withdrawal periods, disease
 *     protocols, or regulatory/compliance claims. Identification completeness is
 *     a DATA-QUALITY concept, never a legal-requirement claim.
 *   - Species map to the EXISTING schema only: livestock.animal_type (species),
 *     livestock.gender (sex), livestock.date_of_birth (birth), livestock.tag
 *     (identifier). There are no location/movement/RFID columns — see
 *     LIVESTOCK_TRACEABILITY_GAPS.
 * ============================================================
 */

// ─── Broad US agricultural regions (reused concept from crops/soil) ───────────
const STATE_TO_REGION = {
  iowa: "Midwest", il: "Midwest", illinois: "Midwest", indiana: "Midwest", in: "Midwest",
  ohio: "Midwest", oh: "Midwest", missouri: "Midwest", mo: "Midwest", minnesota: "Midwest", mn: "Midwest",
  wisconsin: "Midwest", wi: "Midwest", michigan: "Midwest", mi: "Midwest", ia: "Midwest",
  "north dakota": "Northern Plains", nd: "Northern Plains", "south dakota": "Northern Plains", sd: "Northern Plains",
  nebraska: "Northern Plains", ne: "Northern Plains", montana: "Northern Plains", mt: "Northern Plains", wyoming: "Northern Plains", wy: "Northern Plains",
  kansas: "Southern Plains", ks: "Southern Plains", oklahoma: "Southern Plains", ok: "Southern Plains",
  texas: "Southern Plains", tx: "Southern Plains",
  georgia: "Southeast", ga: "Southeast", alabama: "Southeast", al: "Southeast", mississippi: "Southeast", ms: "Southeast",
  florida: "Southeast", fl: "Southeast", "south carolina": "Southeast", sc: "Southeast", "north carolina": "Southeast", nc: "Southeast",
  tennessee: "Southeast", tn: "Southeast", arkansas: "Southeast", ar: "Southeast", louisiana: "Southeast", la: "Southeast",
  kentucky: "Southeast", ky: "Southeast", virginia: "Southeast", va: "Southeast",
  arizona: "Southwest", az: "Southwest", "new mexico": "Southwest", nm: "Southwest", nevada: "Southwest", nv: "Southwest", utah: "Southwest", ut: "Southwest",
  california: "Pacific", ca: "Pacific", oregon: "Pacific", or: "Pacific", washington: "Pacific", wa: "Pacific", idaho: "Pacific", id: "Pacific",
};

/** Broad US agricultural region from a state, or "United States" fallback. */
export function resolveUsLivestockRegion(regionState) {
  if (!regionState) return "United States";
  return STATE_TO_REGION[String(regionState).trim().toLowerCase()] || "United States";
}

// ─── Species normalization (maps free-text animal_type to a profile key) ──────
const SPECIES_ALIASES = {
  cattle: "cattle", cow: "cattle", cows: "cattle", beef: "cattle", dairy: "cattle", bovine: "cattle",
  sheep: "sheep", lamb: "sheep", ewe: "sheep", ram: "sheep", ovine: "sheep",
  goat: "goats", goats: "goats", caprine: "goats",
  pig: "pigs", pigs: "pigs", hog: "pigs", swine: "pigs", porcine: "pigs",
  poultry: "poultry", chicken: "poultry", chickens: "poultry", hen: "poultry", broiler: "poultry", layer: "poultry",
};

/** Normalise a free-text species to a supported profile key, or null. */
export function normalizeSpeciesKey(animalType) {
  if (!animalType) return null;
  const raw = String(animalType).trim().toLowerCase();
  if (SPECIES_ALIASES[raw]) return SPECIES_ALIASES[raw];
  for (const [alias, key] of Object.entries(SPECIES_ALIASES)) {
    if (raw.includes(alias)) return key;
  }
  return null;
}

// ─── Species profiles ─────────────────────────────────────────────────────────
// capabilities + which fields matter for RECORD COMPLETENESS (data quality only).
// weightObservationDays: a gentle "consider re-weighing" horizon (canonical days).
const SPECIES_PROFILES = {
  cattle: {
    label: "Cattle",
    breedingApplies: true,
    expectsBirthDate: true,
    expectsIndividualId: true, // individually tagged
    weightObservationDays: 120,
  },
  sheep: {
    label: "Sheep",
    breedingApplies: true,
    expectsBirthDate: true,
    expectsIndividualId: true,
    weightObservationDays: 120,
  },
  goats: {
    label: "Goats",
    breedingApplies: true,
    expectsBirthDate: true,
    expectsIndividualId: true,
    weightObservationDays: 120,
  },
  pigs: {
    label: "Pigs",
    breedingApplies: true,
    expectsBirthDate: true,
    expectsIndividualId: true,
    weightObservationDays: 90,
  },
  poultry: {
    label: "Poultry",
    // Poultry are typically managed as flocks, not individually — do not punish
    // missing individual birth dates / breeding records.
    breedingApplies: false,
    expectsBirthDate: false,
    expectsIndividualId: false,
    weightObservationDays: null,
  },
};

const DEFAULT_PROFILE = {
  label: "Livestock",
  breedingApplies: true,
  expectsBirthDate: true,
  expectsIndividualId: true,
  weightObservationDays: 120,
};

/**
 * Resolve the livestock profile for an animal + farm context. Region-neutral:
 * the SAME species profiles serve US and SA; only `region` (US-derived) and the
 * measurement system differ, and those are handled by the units layer.
 * @returns {object} { species, label, breedingApplies, expectsBirthDate,
 *   expectsIndividualId, weightObservationDays, region }
 */
export function getLivestockProfile(animalType, farmCtx = null) {
  const key = normalizeSpeciesKey(animalType);
  const base = (key && SPECIES_PROFILES[key]) || DEFAULT_PROFILE;
  const country = String(farmCtx?.country || "").toLowerCase();
  const isUs = country === "united states" || country === "us" || country === "usa";
  return {
    species: key,
    ...base,
    region: isUs ? resolveUsLivestockRegion(farmCtx?.state) : (farmCtx?.region || null),
  };
}

/** Supported species keys (for tests/introspection). */
export function getSupportedSpecies() {
  return Object.keys(SPECIES_PROFILES);
}

/**
 * Documented traceability GAPS (no migration added in USA-6). The existing
 * livestock schema supports species (animal_type), sex (gender), birth
 * (date_of_birth) and a single identifier (tag) only. There are NO columns for
 * RFID/electronic ID, premises/location, or movement history. A future phase
 * would add these; USA-6 deliberately does not, to avoid unnecessary schema
 * changes or implying regulatory/compliance capability.
 */
export const LIVESTOCK_TRACEABILITY_GAPS = Object.freeze({
  hasRfidField: false,
  hasPremisesField: false,
  hasMovementHistory: false,
  note: "Feldrix records a single animal tag today. Electronic ID (RFID), premises/location identifiers, and movement history are not tracked and are not a regulatory-compliance feature.",
});
