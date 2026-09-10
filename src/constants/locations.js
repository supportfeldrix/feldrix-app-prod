/**
 * ============================================================
 * Feldrix — Location / Country Configuration (USA-1)
 *
 * Single source of truth for country-aware farm context so the rest of
 * the app never needs scattered `if (country === "US")` checks. Drives:
 *   - the administrative-region label ("Province" vs "State")
 *   - the region option list (SA provinces / US states)
 *   - sensible DEFAULTS for currency + measurement system per country
 *
 * USA-1 scope: this only informs the Edit Farm UI and default resolution.
 * It does NOT convert units or currency (that is USA-2) and does NOT change
 * weather/crop/report behaviour.
 * ============================================================
 */

// Canonical country values stored in profiles.country. We accept a few
// historical spellings on read (normalizeCountry) but store these.
export const COUNTRIES = [
  { value: "South Africa", code: "ZA" },
  { value: "United States", code: "US" },
];

// South African provinces (preserves existing SA behaviour / familiarity).
export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

// US states + DC (standard names + USPS abbreviations).
export const US_STATES = [
  { name: "Alabama", abbr: "AL" }, { name: "Alaska", abbr: "AK" },
  { name: "Arizona", abbr: "AZ" }, { name: "Arkansas", abbr: "AR" },
  { name: "California", abbr: "CA" }, { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" }, { name: "Delaware", abbr: "DE" },
  { name: "District of Columbia", abbr: "DC" }, { name: "Florida", abbr: "FL" },
  { name: "Georgia", abbr: "GA" }, { name: "Hawaii", abbr: "HI" },
  { name: "Idaho", abbr: "ID" }, { name: "Illinois", abbr: "IL" },
  { name: "Indiana", abbr: "IN" }, { name: "Iowa", abbr: "IA" },
  { name: "Kansas", abbr: "KS" }, { name: "Kentucky", abbr: "KY" },
  { name: "Louisiana", abbr: "LA" }, { name: "Maine", abbr: "ME" },
  { name: "Maryland", abbr: "MD" }, { name: "Massachusetts", abbr: "MA" },
  { name: "Michigan", abbr: "MI" }, { name: "Minnesota", abbr: "MN" },
  { name: "Mississippi", abbr: "MS" }, { name: "Missouri", abbr: "MO" },
  { name: "Montana", abbr: "MT" }, { name: "Nebraska", abbr: "NE" },
  { name: "Nevada", abbr: "NV" }, { name: "New Hampshire", abbr: "NH" },
  { name: "New Jersey", abbr: "NJ" }, { name: "New Mexico", abbr: "NM" },
  { name: "New York", abbr: "NY" }, { name: "North Carolina", abbr: "NC" },
  { name: "North Dakota", abbr: "ND" }, { name: "Ohio", abbr: "OH" },
  { name: "Oklahoma", abbr: "OK" }, { name: "Oregon", abbr: "OR" },
  { name: "Pennsylvania", abbr: "PA" }, { name: "Rhode Island", abbr: "RI" },
  { name: "South Carolina", abbr: "SC" }, { name: "South Dakota", abbr: "SD" },
  { name: "Tennessee", abbr: "TN" }, { name: "Texas", abbr: "TX" },
  { name: "Utah", abbr: "UT" }, { name: "Vermont", abbr: "VT" },
  { name: "Virginia", abbr: "VA" }, { name: "Washington", abbr: "WA" },
  { name: "West Virginia", abbr: "WV" }, { name: "Wisconsin", abbr: "WI" },
  { name: "Wyoming", abbr: "WY" },
];

// Per-country configuration. Extend this array to add future countries
// instead of adding country conditionals throughout the codebase.
const COUNTRY_CONFIG = {
  "South Africa": {
    code: "ZA",
    regionLabel: "Province",
    regions: SA_PROVINCES,
    defaultCurrency: "ZAR",
    defaultMeasurementSystem: "metric",
    geocodeSuffix: "ZA",
    usesZip: false,
  },
  "United States": {
    code: "US",
    regionLabel: "State",
    regions: US_STATES.map((s) => s.name),
    defaultCurrency: "USD",
    defaultMeasurementSystem: "us_customary",
    geocodeSuffix: "US",
    usesZip: true,
  },
};

// Fallback for unknown/unset countries — keeps existing (metric/ZAR) behaviour.
const DEFAULT_CONFIG = {
  code: null,
  regionLabel: "Province / State",
  regions: [],
  defaultCurrency: "ZAR",
  defaultMeasurementSystem: "metric",
  geocodeSuffix: "",
  usesZip: false,
};

/** Normalise historical country spellings to a canonical stored value. */
export function normalizeCountry(country) {
  if (!country) return "";
  const c = String(country).trim().toLowerCase();
  if (["za", "south africa", "rsa"].includes(c)) return "South Africa";
  if (["us", "usa", "united states", "united states of america"].includes(c)) return "United States";
  return String(country).trim(); // leave unknown values as-entered
}

/** Get the config for a country (canonical or historical spelling). */
export function getCountryConfig(country) {
  const canonical = normalizeCountry(country);
  return COUNTRY_CONFIG[canonical] || DEFAULT_CONFIG;
}

export const MEASUREMENT_SYSTEMS = ["metric", "us_customary"];
