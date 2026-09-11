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
 *   - The species LIST itself is GLOBAL (constants/livestockSpecies.js). This
 *     file is the regional CAPABILITY layer: it maps global species keys to
 *     capability flags + regional context. It does not define the selector.
 * ============================================================
 */

// The species registry + normalization live in the GLOBAL catalog so US, SA and
// future EU providers share one list (no country-specific species filtering).
import { normalizeSpeciesKey as catalogNormalizeSpeciesKey, OTHER_SPECIES } from "./livestockSpecies";

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

// ─── Species normalization ────────────────────────────────────────────────────
// Delegates to the global catalog so there is a SINGLE source of truth for the
// species list + aliases. Re-exported for existing callers/tests.
export function normalizeSpeciesKey(animalType) {
  return catalogNormalizeSpeciesKey(animalType);
}

// ─── Species profiles ─────────────────────────────────────────────────────────
// Capabilities + which fields matter for RECORD COMPLETENESS (data quality only).
//   breedingApplies       — does breeding/pregnancy tracking make sense?
//   expectsBirthDate      — is an individual birth date meaningful?
//   expectsIndividualId   — is the animal individually tagged (vs flock/colony)?
//   weightApplies         — is individual-animal weight tracking meaningful?
//   weightObservationDays — gentle "consider re-weighing" horizon (canonical days),
//                           or null to disable the stale-weight nudge.
// No gestation periods, growth curves, or vet protocols are encoded here.
const SPECIES_PROFILES = {
  cattle:        { label: "Cattle",         breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 120 },
  horse:         { label: "Horse / Equine", breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 180 },
  bison:         { label: "Bison",          breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 180 },
  sheep:         { label: "Sheep",          breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 120 },
  goats:         { label: "Goat",           breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 120 },
  pigs:          { label: "Pig / Swine",    breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 90 },
  water_buffalo: { label: "Water Buffalo",  breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 180 },
  camelid:       { label: "Camelid",        breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 180 },
  cervid:        { label: "Cervid",         breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 180 },
  rabbit:        { label: "Rabbit",         breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 60 },
  donkey:        { label: "Donkey",         breedingApplies: true,  expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 180 },
  mule:          { label: "Mule",           breedingApplies: false, expectsBirthDate: true,  expectsIndividualId: true,  weightApplies: true,  weightObservationDays: 180 },

  // Flock/colony poultry-type species: typically managed as groups, not
  // individually — do not punish missing individual birth dates / breeding.
  poultry:       { label: "Poultry",        breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },
  turkey:        { label: "Turkey",         breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },
  duck:          { label: "Duck",           breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },
  goose:         { label: "Goose",          breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },
  guinea_fowl:   { label: "Guinea Fowl",    breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },
  quail:         { label: "Quail",          breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },
  pigeon:        { label: "Pigeon",         breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },

  // Hive-managed — individual-animal weight/birth/breeding are not meaningful.
  bee:           { label: "Bee / Honey Bees", breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: false, weightObservationDays: null },

  // Explicit "Other" sentinel → conservative generic behaviour (see DEFAULT).
  other:         { label: OTHER_SPECIES,    breedingApplies: false, expectsBirthDate: false, expectsIndividualId: false, weightApplies: true,  weightObservationDays: null },
};

// Conservative fallback for unknown/unrecognised species: do NOT assume breeding
// or birth date (so completeness never unfairly penalises), but allow weight
// analysis if a weight record actually exists (weightApplies true, no nudge).
const DEFAULT_PROFILE = {
  label: "Livestock",
  breedingApplies: false,
  expectsBirthDate: false,
  expectsIndividualId: false,
  weightApplies: true,
  weightObservationDays: null,
};

/**
 * Resolve the livestock profile for an animal + farm context. Region-neutral:
 * the SAME species profiles serve US and SA; only `region` (US-derived) and the
 * measurement system differ, and those are handled by the units layer.
 * @returns {object} { species, label, breedingApplies, expectsBirthDate,
 *   expectsIndividualId, weightApplies, weightObservationDays, region }
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
