/**
 * ============================================================
 * Feldrix — Global Livestock Species Catalog (shared, region-neutral)
 *
 * ARCHITECTURE
 *   Global Animal Species (this file)
 *        ↓
 *   Regional Livestock Profile (usLivestockProfiles.js / future euLivestockProfiles.js)
 *        ↓
 *   Capabilities (breedingApplies / expectsBirthDate / weightApplies / ...)
 *        ↓
 *   Shared Livestock Engine (utils/livestockIntelligence.js)
 *
 *   The species REGISTRY is global and country-agnostic — a South African, US,
 *   or future European farmer sees the SAME list. There is NO country-specific
 *   species filtering. Regional providers add CAPABILITIES + regional context on
 *   top of these global keys; they never redefine the list.
 *
 * STORAGE (no migration)
 *   - livestock.animal_type holds the selected species label (e.g. "Cattle",
 *     "Horse", or the sentinel "Other").
 *   - When animal_type === "Other", the farmer's free-text species is stored in
 *     the existing (previously unused) livestock.category column — structured,
 *     never "Other - Yak". Display resolves category as the real name.
 *
 * SAFETY
 *   - This file is metadata only (labels/icons/aliases/grouping). No biological
 *     benchmarks, gestation periods, vet protocols, or growth curves. Those are
 *     never invented; unknown species fall back to generic behaviour downstream.
 *   - The list is broad but NOT claimed exhaustive — "Other" always exists.
 * ============================================================
 */

/** Sentinel species value meaning "use the custom free-text species". */
export const OTHER_SPECIES = "Other";

/**
 * Global species entries. `key` is the canonical profile key consumed by the
 * regional capability layer; `label` is the stored + displayed value; `icon` is
 * a display glyph; `aliases` feed free-text normalization (existing records,
 * plural/synonym spellings, regional names).
 *
 * NOTE: existing stored values ("Cattle", "Sheep", "Goats", "Pigs", "Poultry")
 * are preserved exactly as labels so no existing record changes meaning.
 */
const SPECIES = [
  // ── Common farm livestock ─────────────────────────────────
  { key: "cattle",       label: "Cattle",            icon: "🐄", group: "Common Livestock", aliases: ["cow", "cows", "beef", "dairy", "bovine", "calf", "heifer", "steer", "ox", "bull"] },
  { key: "horse",        label: "Horse / Equine",    icon: "🐎", group: "Common Livestock", aliases: ["horse", "equine", "mare", "stallion", "foal", "pony", "gelding", "colt", "filly"] },
  { key: "bison",        label: "Bison",             icon: "🦬", group: "Common Livestock", aliases: ["bison", "buffalo (american)", "american buffalo"] },
  { key: "sheep",        label: "Sheep",             icon: "🐑", group: "Common Livestock", aliases: ["lamb", "ewe", "ram", "ovine", "wether"] },
  { key: "goats",        label: "Goat",              icon: "🐐", group: "Common Livestock", aliases: ["goat", "goats", "caprine", "kid", "doe", "buck", "wether (goat)"] },
  { key: "pigs",         label: "Pig / Swine",       icon: "🐖", group: "Common Livestock", aliases: ["pig", "pigs", "hog", "swine", "porcine", "boar", "sow", "piglet", "gilt", "barrow"] },
  { key: "poultry",      label: "Poultry",           icon: "🐔", group: "Common Livestock", aliases: ["chicken", "chickens", "hen", "broiler", "layer", "rooster", "cockerel", "pullet", "fowl"] },

  // ── Specialty / other agricultural animals ────────────────
  { key: "water_buffalo", label: "Water Buffalo",    icon: "🐃", group: "Specialty / Other", aliases: ["water buffalo", "carabao", "bubalus"] },
  { key: "camelid",      label: "Camelid",           icon: "🦙", group: "Specialty / Other", aliases: ["camelid", "alpaca", "alpacas", "llama", "llamas", "camel", "vicuna", "guanaco"] },
  { key: "cervid",       label: "Cervid",            icon: "🦌", group: "Specialty / Other", aliases: ["cervid", "deer", "elk", "red deer", "fallow deer", "reindeer", "caribou"] },
  { key: "rabbit",       label: "Rabbit",            icon: "🐇", group: "Specialty / Other", aliases: ["rabbit", "rabbits", "doe (rabbit)", "buck (rabbit)", "kit"] },
  { key: "turkey",       label: "Turkey",            icon: "🦃", group: "Specialty / Other", aliases: ["turkey", "turkeys", "poult", "tom"] },
  { key: "duck",         label: "Duck",              icon: "🦆", group: "Specialty / Other", aliases: ["duck", "ducks", "drake", "duckling"] },
  { key: "goose",        label: "Goose",             icon: "🪿", group: "Specialty / Other", aliases: ["goose", "geese", "gander", "gosling"] },
  { key: "guinea_fowl",  label: "Guinea Fowl",       icon: "🐦", group: "Specialty / Other", aliases: ["guinea fowl", "guineafowl", "guinea"] },
  { key: "quail",        label: "Quail",             icon: "🐦", group: "Specialty / Other", aliases: ["quail", "quails"] },
  { key: "pigeon",       label: "Pigeon",            icon: "🕊️", group: "Specialty / Other", aliases: ["pigeon", "pigeons", "squab", "dove"] },
  { key: "bee",          label: "Bee / Honey Bees",  icon: "🐝", group: "Specialty / Other", aliases: ["bee", "bees", "honey bee", "honey bees", "honeybee", "honeybees", "hive", "apiary", "colony"] },
  { key: "donkey",       label: "Donkey",            icon: "🫏", group: "Specialty / Other", aliases: ["donkey", "donkeys", "ass", "jenny", "jack (donkey)", "burro"] },
  { key: "mule",         label: "Mule",              icon: "🐴", group: "Specialty / Other", aliases: ["mule", "mules", "hinny"] },

  // ── Catch-all ─────────────────────────────────────────────
  { key: "other",        label: OTHER_SPECIES,       icon: "🐾", group: "Specialty / Other", aliases: [] },
];

/** Fast lookups. */
const BY_LABEL = Object.freeze(Object.fromEntries(SPECIES.map((s) => [s.label.toLowerCase(), s])));
const BY_KEY = Object.freeze(Object.fromEntries(SPECIES.map((s) => [s.key, s])));
const BY_ALIAS = (() => {
  const map = {};
  for (const s of SPECIES) {
    map[s.label.toLowerCase()] = s.key;
    map[s.key] = s.key;
    for (const a of s.aliases) map[a.toLowerCase()] = s.key;
  }
  return Object.freeze(map);
})();

/**
 * Ordered groups for a grouped MUI Select. Shape:
 *   [{ group, options: [{ value, label, icon }] }]
 * value === label (what is stored in animal_type).
 */
export const SPECIES_CATALOG_GROUPS = (() => {
  const order = ["Common Livestock", "Specialty / Other"];
  const groups = new Map(order.map((g) => [g, []]));
  for (const s of SPECIES) {
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group).push({ value: s.label, label: s.label, icon: s.icon });
  }
  return order.map((g) => ({ group: g, options: groups.get(g) }));
})();

/** All species labels (flat), for tests/introspection. Not exhaustive of reality. */
export function getAllSpeciesLabels() {
  return SPECIES.map((s) => s.label);
}

/**
 * Normalise any free-text / stored species to a canonical catalog KEY, or null
 * if unrecognised. Handles existing values, plurals, synonyms and partial text.
 * "Other" maps to the "other" key.
 */
export function normalizeSpeciesKey(animalType) {
  if (!animalType) return null;
  const raw = String(animalType).trim().toLowerCase();
  if (BY_ALIAS[raw]) return BY_ALIAS[raw];
  // Substring pass (e.g. "beef cattle", "laying hen") — longest alias first so
  // "water buffalo" isn't shadowed by "buffalo"-like partials.
  const aliasEntries = Object.entries(BY_ALIAS).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, key] of aliasEntries) {
    if (alias.length >= 3 && raw.includes(alias)) return key;
  }
  return null;
}

/** True if the given animal_type is the "Other" sentinel. */
export function isOtherSpecies(animalType) {
  return String(animalType || "").trim().toLowerCase() === OTHER_SPECIES.toLowerCase();
}

/**
 * The human-facing species label for an animal record. For "Other" animals this
 * returns the custom species stored in `category` (e.g. "Yak"), so the farmer
 * never sees a bare "Other". Falls back gracefully.
 * @param {object} animal - livestock row ({ animal_type, category })
 */
export function getSpeciesDisplayLabel(animal) {
  if (!animal) return "—";
  const type = animal.animal_type;
  if (isOtherSpecies(type)) {
    const custom = (animal.category || "").trim();
    return custom || "Other";
  }
  // Known catalog label passes through; unknown free-text passes through as-is.
  return (type && String(type)) || "—";
}

/**
 * Display icon for an animal record. Resolves via the catalog; custom/unknown
 * species use the neutral paw glyph. Never throws.
 * @param {object|string} animalOrType - an animal row or a raw type string
 */
export function getSpeciesIcon(animalOrType) {
  const type = typeof animalOrType === "string" ? animalOrType : animalOrType?.animal_type;
  if (!type) return "🐾";
  const byLabel = BY_LABEL[String(type).trim().toLowerCase()];
  if (byLabel) return byLabel.icon;
  const key = normalizeSpeciesKey(type);
  if (key && BY_KEY[key]) return BY_KEY[key].icon;
  return "🐾";
}
