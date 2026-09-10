/**
 * ============================================================
 * Feldrix — Units & Formatting Layer (USA-2)
 *
 * Central, single-source conversion + display formatting so no component
 * scatters conversion formulas or assumes a measurement system.
 *
 * PRINCIPLE: store CANONICAL values, convert only at the DISPLAY boundary.
 *   Canonical: temperature °C, precipitation mm, wind km/h, area ha,
 *              mass kg, volume litres.
 *   Display:   driven by farmContext.measurementSystem ("metric" | "us_customary").
 *
 * These functions take a `ctx` (the object from getFarmContext()) OR a bare
 * measurement-system string, so callers can pass either. They NEVER mutate
 * stored data and NEVER touch intelligence thresholds (which stay canonical).
 * ============================================================
 */

// ─── Measurement system resolution ───────────────────────────

/** Extract the measurement system from a farmContext, a raw string, or null. */
export function resolveMeasurementSystem(ctxOrSystem) {
  if (!ctxOrSystem) return "metric";
  if (typeof ctxOrSystem === "string") {
    return ctxOrSystem === "us_customary" ? "us_customary" : "metric";
  }
  return ctxOrSystem.measurementSystem === "us_customary" ? "us_customary" : "metric";
}

export function isUsCustomary(ctxOrSystem) {
  return resolveMeasurementSystem(ctxOrSystem) === "us_customary";
}

// ─── Pure conversions (exact factors) ────────────────────────

export const CONVERSION = {
  MM_PER_INCH: 25.4,
  KMH_PER_MPH: 1.609344,
  ACRES_PER_HECTARE: 2.4710538147,
  LB_PER_KG: 2.2046226218,
  GALLONS_PER_LITRE: 0.2641720524, // US gallons
  KG_PER_TONNE: 1000,
  LB_PER_US_TON: 2000,
  HPA_PER_INHG: 33.8638866667, // 1 inHg = 33.8639 hPa
  KM_PER_MILE: 1.609344,
};

export const cToF = (c) => (Number(c) * 9) / 5 + 32;
export const fToC = (f) => ((Number(f) - 32) * 5) / 9;
export const mmToInches = (mm) => Number(mm) / CONVERSION.MM_PER_INCH;
export const inchesToMm = (inch) => Number(inch) * CONVERSION.MM_PER_INCH;
export const kmhToMph = (kmh) => Number(kmh) / CONVERSION.KMH_PER_MPH;
export const mphToKmh = (mph) => Number(mph) * CONVERSION.KMH_PER_MPH;
export const haToAcres = (ha) => Number(ha) * CONVERSION.ACRES_PER_HECTARE;
export const acresToHa = (ac) => Number(ac) / CONVERSION.ACRES_PER_HECTARE;
export const kgToLb = (kg) => Number(kg) * CONVERSION.LB_PER_KG;
export const lbToKg = (lb) => Number(lb) / CONVERSION.LB_PER_KG;
export const litresToGallons = (l) => Number(l) * CONVERSION.GALLONS_PER_LITRE;
export const gallonsToLitres = (g) => Number(g) / CONVERSION.GALLONS_PER_LITRE;
export const hpaToInHg = (hpa) => Number(hpa) / CONVERSION.HPA_PER_INHG;
export const inHgToHpa = (inhg) => Number(inhg) * CONVERSION.HPA_PER_INHG;
export const kmToMiles = (km) => Number(km) / CONVERSION.KM_PER_MILE;
export const milesToKm = (mi) => Number(mi) * CONVERSION.KM_PER_MILE;

// ─── Central display precision ───────────────────────────────

const PRECISION = {
  temperature: 0,
  precipitation: 2,
  wind: 0,
  area: 2,
  mass: 1,
  volume: 1,
  pressure: 2,
  distance: 1,
};

/** Round to n decimals, drop trailing zeros, keep as a Number. */
function round(value, decimals) {
  const f = Math.pow(10, decimals);
  return Math.round(Number(value) * f) / f;
}

/** Format a number for display: locale grouping, no trailing zeros. */
function num(value, decimals, locale = "en-US") {
  const n = round(value, decimals);
  return n.toLocaleString(locale, { maximumFractionDigits: decimals });
}

// ─── Unit labels per system ──────────────────────────────────

export const UNIT_LABELS = {
  metric: { temperature: "\u00B0C", precipitation: "mm", wind: "km/h", area: "ha", mass: "kg", volume: "L", pressure: "hPa", distance: "km" },
  us_customary: { temperature: "\u00B0F", precipitation: "in", wind: "mph", area: "acres", mass: "lb", volume: "gal", pressure: "inHg", distance: "mi" },
};

export function unitLabel(kind, ctxOrSystem) {
  const sys = resolveMeasurementSystem(ctxOrSystem);
  return UNIT_LABELS[sys]?.[kind] ?? "";
}

// ─── Display formatters (canonical value in → localized string out) ──
// Each accepts a canonical value and the farm context/system. NULL/invalid
// inputs render as an em-dash so nothing shows "0" or "NaN" spuriously.

function empty(value) {
  return value === null || value === undefined || value === "" || Number.isNaN(Number(value));
}

/** Temperature: canonical °C. */
export function formatTemperature(valueC, ctx, { withUnit = true } = {}) {
  if (empty(valueC)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? cToF(valueC) : Number(valueC);
  const s = num(v, PRECISION.temperature);
  return withUnit ? `${s}${us ? "\u00B0F" : "\u00B0C"}` : s;
}

/** Precipitation/rainfall: canonical mm. */
export function formatPrecipitation(valueMm, ctx, { withUnit = true } = {}) {
  if (empty(valueMm)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? mmToInches(valueMm) : Number(valueMm);
  const s = num(v, PRECISION.precipitation);
  return withUnit ? `${s} ${us ? "in" : "mm"}` : s;
}

/** Wind speed: canonical km/h. */
export function formatWindSpeed(valueKmh, ctx, { withUnit = true } = {}) {
  if (empty(valueKmh)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? kmhToMph(valueKmh) : Number(valueKmh);
  const s = num(v, PRECISION.wind);
  return withUnit ? `${s} ${us ? "mph" : "km/h"}` : s;
}

/** Area: canonical hectares. */
export function formatArea(valueHa, ctx, { withUnit = true } = {}) {
  if (empty(valueHa)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? haToAcres(valueHa) : Number(valueHa);
  const s = num(v, PRECISION.area);
  return withUnit ? `${s} ${us ? "acres" : "ha"}` : s;
}

/** Mass: canonical kilograms. */
export function formatMass(valueKg, ctx, { withUnit = true } = {}) {
  if (empty(valueKg)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? kgToLb(valueKg) : Number(valueKg);
  const s = num(v, PRECISION.mass);
  return withUnit ? `${s} ${us ? "lb" : "kg"}` : s;
}

/** Volume: canonical litres. */
export function formatVolume(valueL, ctx, { withUnit = true } = {}) {
  if (empty(valueL)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? litresToGallons(valueL) : Number(valueL);
  const s = num(v, PRECISION.volume);
  return withUnit ? `${s} ${us ? "gal" : "L"}` : s;
}

/** Atmospheric pressure: canonical hPa (millibars). US shows inHg. */
export function formatPressure(valueHpa, ctx, { withUnit = true } = {}) {
  if (empty(valueHpa)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? hpaToInHg(valueHpa) : Number(valueHpa);
  const s = num(v, us ? PRECISION.pressure : 0);
  return withUnit ? `${s} ${us ? "inHg" : "hPa"}` : s;
}

/** Distance/visibility: canonical km. US shows miles. */
export function formatDistance(valueKm, ctx, { withUnit = true } = {}) {
  if (empty(valueKm)) return "\u2014";
  const us = isUsCustomary(ctx);
  const v = us ? kmToMiles(valueKm) : Number(valueKm);
  const s = num(v, PRECISION.distance);
  return withUnit ? `${s} ${us ? "mi" : "km"}` : s;
}

/** The label to use for a farm-area field, e.g. "Farm Size (ha)" / "(acres)". */
export function areaFieldLabel(base, ctxOrSystem) {
  return `${base} (${unitLabel("area", ctxOrSystem)})`;
}

/**
 * Normalise a crop's stored area to CANONICAL hectares using its own
 * area_unit (crops.area_unit is authoritative — farmers choose ha|acres).
 * Use this BEFORE aggregating crop areas so a farm mixing units (or storing
 * acres) is summed correctly; then display the canonical total via
 * formatArea(). Stored crop values are never modified.
 */
export function cropAreaToHa(crop) {
  const raw = Number(crop?.area || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const unit = String(crop?.area_unit || "ha").trim().toLowerCase();
  return unit === "acres" || unit === "acre" ? acresToHa(raw) : raw; // canonical ha
}
