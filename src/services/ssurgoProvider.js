/**
 * ============================================================
 * Feldrix — USDA NRCS SSURGO Soil Provider (USA-5)
 *
 * Location-based soil REFERENCE for US farms, backed by the official USDA NRCS
 * Soil Data Access (SDA) service over the Soil Survey Geographic Database
 * (SSURGO). This is REFERENCE data — it is NEVER a substitute for, and NEVER
 * overwrites, the farmer's measured Ground Sampling / laboratory results.
 *
 * SOURCE (official, public):
 *   USDA NRCS Soil Data Access — https://sdmdataaccess.nrcs.usda.gov/
 *   SSURGO — https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo
 *
 * ARCHITECTURE
 *   farm point (lat, lon) → SDA SSURGO query → normalized Feldrix soil model → UI
 *   The SDA endpoint returns Access-Control-Allow-Origin: * (verified), so the
 *   browser can call it directly — NO Edge Function and NO secrets are needed.
 *   Raw SSURGO table/column structure is confined to THIS module; the UI only
 *   ever sees the normalized model below.
 *
 * DATA QUALITY
 *   Never invents values — any attribute USDA does not return stays null.
 *   SSURGO map units commonly contain MULTIPLE soil components; we surface the
 *   dominant component (highest comppct_r) and flag when others exist, without
 *   implying field-level laboratory precision.
 *
 * UNITS
 *   Emits CANONICAL values only (available water capacity in cm; pH unitless;
 *   EC in dS/m). The UI localizes via the USA-2 units layer. No conversion math
 *   lives here.
 * ============================================================
 */

const SDA_URL = "https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest";
const REQUEST_TIMEOUT_MS = 12000;

// Soil reference is essentially static per point — cache aggressively.
const TTL = { soil: 7 * 24 * 60 * 60 * 1000 }; // 7 days
const soilCache = new Map();

function cacheGet(key) {
  const e = soilCache.get(key);
  if (e && Date.now() - e.t < e.ttl) return e.data;
  if (e) soilCache.delete(key);
  return null;
}
function cacheSet(key, data, ttl) {
  soilCache.set(key, { data, t: Date.now(), ttl });
}
/** Clear the SSURGO cache (test/admin use). */
export function clearSsurgoCache() {
  soilCache.clear();
}

const round = (n, dp = 4) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
};

/** Numeric-or-null coercion for USDA string values (SDA returns strings). */
function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
/** Trimmed-string-or-null (SDA sometimes returns "No " with trailing space). */
function str(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/**
 * Build the SDA SSURGO point query. WKT point is "LON LAT" (X Y).
 * Joins map unit + legend (survey area) + muaggatt (map-unit aggregates:
 * drainage, flooding, available water capacity 0–100cm) + component (name,
 * percent, dominance, drainage, taxonomic order) + correlated surface-horizon
 * pH / EC. Ordered by component percent so the dominant component is first.
 */
function buildQuery(lat, lon) {
  return `
SELECT
  mu.mukey, mu.muname,
  l.areaname, l.areasymbol,
  ma.drclassdcd, ma.flodfreqdcd, ma.aws0100wta,
  c.cokey, c.compname, c.comppct_r, c.majcompflag, c.drainagecl, c.taxorder,
  (SELECT TOP 1 ch.ph1to1h2o_r FROM chorizon ch WHERE ch.cokey = c.cokey AND ch.hzdept_r = 0) AS surface_ph,
  (SELECT TOP 1 ch.ec_r FROM chorizon ch WHERE ch.cokey = c.cokey AND ch.hzdept_r = 0) AS surface_ec
FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lon} ${lat})') AS m
JOIN mapunit mu ON mu.mukey = m.mukey
JOIN legend l ON l.lkey = mu.lkey
LEFT JOIN muaggatt ma ON ma.mukey = mu.mukey
JOIN component c ON c.mukey = mu.mukey
ORDER BY c.comppct_r DESC`.trim();
}

/**
 * Convert SDA's "JSON+COLUMNNAME" response (a { Table: [[colnames], [row], ...] })
 * into an array of plain row objects. Returns [] for the no-coverage /
 * empty-result shape.
 */
function parseSdaTable(json) {
  const table = json?.Table;
  if (!Array.isArray(table) || table.length < 2) return [];
  const cols = table[0];
  return table.slice(1).map((row) => {
    const obj = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj;
  });
}

/**
 * Normalize SDA rows into the Feldrix soil-reference model. Rows share the same
 * map unit (single point) and are ordered by component percent DESC, so row[0]
 * is the dominant component. Missing attributes stay null (never invented).
 */
function normalize(rows, lat, lon) {
  if (!rows || rows.length === 0) {
    return {
      source: "USDA NRCS SSURGO",
      source_name: "USDA NRCS Soil Survey Geographic Database (SSURGO)",
      coverage_status: "no_coverage",
      latitude: round(lat),
      longitude: round(lon),
      retrieved_at: new Date().toISOString(),
      survey_area: null,
      map_unit: null,
      soil_series: null,
      dominant_component: null,
      components: [],
      multipleComponents: false,
      drainage_class: null,
      available_water_capacity_cm: null,
      reference_pH: null,
      electrical_conductivity: null,
      flooding_frequency: null,
    };
  }

  // Map-unit-level fields (muname/areaname/mukey/muaggatt) are identical across
  // all rows for a single point, so any row is fine as the map-unit "head".
  const head = rows[0];

  // Component list, then sort by percent DESC ourselves so the dominant
  // component is ALWAYS the highest comppct_r regardless of the order SDA
  // returns rows in (the SQL uses ORDER BY comppct_r DESC, but we do not rely
  // on server ordering — the dominant component must never be arbitrary).
  const components = rows
    .map((r) => ({
      name: str(r.compname),
      percent: num(r.comppct_r),
      isMajor: str(r.majcompflag) === "Yes",
      taxOrder: str(r.taxorder),
      drainage: str(r.drainagecl),
      surface_pH: num(r.surface_ph),
      electrical_conductivity: num(r.surface_ec),
    }))
    .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));

  const dominant = components[0] || null;

  return {
    source: "USDA NRCS SSURGO",
    source_name: "USDA NRCS Soil Survey Geographic Database (SSURGO)",
    coverage_status: "available",
    latitude: round(lat),
    longitude: round(lon),
    retrieved_at: new Date().toISOString(),

    // Survey area (legend) — where the map unit is surveyed.
    survey_area: str(head.areaname),
    survey_area_symbol: str(head.areasymbol),

    // Map unit (may contain multiple components).
    map_unit: str(head.muname),
    map_unit_key: str(head.mukey),

    // Dominant component summary (highest comppct_r).
    soil_series: dominant?.name || null,
    dominant_component: dominant,
    components,
    // Multiple components present → UI must not imply single-soil precision.
    multipleComponents: components.length > 1,

    // Map-unit aggregate attributes (muaggatt) — CANONICAL units.
    drainage_class: str(head.drclassdcd) || dominant?.drainage || null,
    available_water_capacity_cm: num(head.aws0100wta), // 0–100 cm, in cm
    flooding_frequency: str(head.flodfreqdcd),

    // Dominant-component surface attributes.
    reference_pH: dominant?.surface_pH ?? null,          // pH (unitless)
    electrical_conductivity: dominant?.electrical_conductivity ?? null, // dS/m
  };
}

/**
 * Fetch + normalize USDA SSURGO soil reference for a farm point.
 * Cached per rounded coordinate (7 days). Returns a normalized model with
 * coverage_status "available" | "no_coverage", or null on a transport/parse
 * error (caller renders a "temporarily unavailable" state — never fabricated).
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object|null>}
 */
export async function fetchSsurgoSoil(lat, lon) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;

  const key = `soil_${round(lat, 4)}_${round(lon, 4)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(SDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ format: "JSON+COLUMNNAME", query: buildQuery(lat, lon) }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null; // service/HTTP error → transient unavailable

    let json;
    try {
      json = await res.json();
    } catch {
      return null; // malformed / non-JSON (e.g. XML ServiceException) → unavailable
    }

    const rows = parseSdaTable(json);
    const model = normalize(rows, lat, lon);
    // Cache both "available" AND "no_coverage" so we don't re-poll a bare point.
    cacheSet(key, model, TTL.soil);
    return model;
  } catch {
    clearTimeout(timer);
    return null; // timeout / network / abort → transient unavailable
  }
}

/** Expose the normalizer for tests (pure, no network). */
export const __test__ = { parseSdaTable, normalize, buildQuery };
