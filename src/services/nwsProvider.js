/**
 * Feldrix — NWS / NOAA Weather Provider (USA-3)
 *
 * Primary weather provider for US farms, backed by the official National
 * Weather Service API (https://api.weather.gov). Non-US farms continue to use
 * the existing OpenWeatherMap provider — the provider decision lives in the
 * service layer (weatherService.js), NOT in React components.
 *
 * DESIGN PRINCIPLES
 *   - CANONICAL, PROVIDER-NEUTRAL OUTPUT. This module maps raw NWS JSON into
 *     the EXACT canonical weather model the rest of Feldrix already consumes
 *     (see weatherService.getWeatherSummary). All values are METRIC
 *     (°C / km/h / mm / hPa / km); the units layer localizes at display time.
 *     We request `units=si` from NWS where possible and convert the few
 *     imperial fields via the central converters in utils/units.js — no
 *     bespoke conversion math lives here.
 *   - OFFICIAL ALERTS ARE DISTINCT. NWS active alerts (watches/warnings/
 *     advisories) are returned separately as `official` alerts tagged
 *     source:"nws". They are NOT Feldrix agricultural intelligence.
 *   - GRACEFUL DEGRADATION. Any single NWS endpoint failing (points, forecast,
 *     hourly, observation, alerts) must never blank the page. Missing fields
 *     are left null; the caller (weatherService) falls back to OWM if the core
 *     forecast cannot be built at all.
 *   - CENTRALIZED + CACHED. All NWS requests go through here with per-datatype
 *     TTL caching so React components never hit api.weather.gov directly and
 *     we respect NWS rate-limit guidance (especially for alerts).
 *
 * NWS API docs: https://www.weather.gov/documentation/services-web-api
 */

import { fToC, mphToKmh, milesToKm } from "../utils/units";
import { getSunTimes } from "../utils/sunTimes";

const NWS_BASE = "https://api.weather.gov";

// NWS requests a descriptive, contactable User-Agent. It is NOT a secret.
// (Browsers may drop the User-Agent header on cross-origin fetch; NWS still
// serves requests without it, so this is best-effort per NWS guidance.)
const USER_AGENT = "FeldrixFarmHandPRO (weather-support@feldrix.com)";

// ── Cache (in-memory, per-datatype TTL) ──────────────────────────────────────
// NWS explicitly warns against excessive polling — alerts especially. The
// office/grid mapping from /points is stable and cached long; forecasts and
// observations are cached moderately; alerts are cached short but never hammered.
const TTL = {
  points: 24 * 60 * 60 * 1000, // office/grid mapping rarely changes → 24h
  forecast: 30 * 60 * 1000,    // 30 min
  hourly: 30 * 60 * 1000,      // 30 min
  observation: 15 * 60 * 1000, // 15 min
  alerts: 5 * 60 * 1000,       // 5 min (short, but shared/cached — not per-render)
  stations: 24 * 60 * 60 * 1000,
};

const nwsCache = new Map();

function cacheGet(key) {
  const entry = nwsCache.get(key);
  if (entry && Date.now() - entry.t < entry.ttl) return entry.data;
  if (entry) nwsCache.delete(key);
  return null;
}
function cacheSet(key, data, ttl) {
  nwsCache.set(key, { data, t: Date.now(), ttl });
}

/** Clear all NWS cache entries (used by the shared clearWeatherCache path). */
export function clearNwsCache() {
  nwsCache.clear();
}

/**
 * Fetch + parse JSON from an NWS endpoint. Returns null on any failure so
 * callers can degrade gracefully. NWS uses GeoJSON with an application/geo+json
 * content type; we accept it explicitly.
 */
async function nwsFetch(url) {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/geo+json,application/json",
        "User-Agent": USER_AGENT,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Number helpers ────────────────────────────────────────────────────────────
const round = (n, dp = 0) => {
  if (n == null || Number.isNaN(Number(n))) return null;
  const f = Math.pow(10, dp);
  return Math.round(Number(n) * f) / f;
};

/**
 * NWS quantitative values arrive as { value, unitCode }. Convert to canonical
 * metric. Handles the unit codes NWS actually emits (wmoUnit:*), covering both
 * SI and the occasional imperial value.
 */
function toC(q) {
  if (!q || q.value == null) return null;
  const u = q.unitCode || "";
  if (u.includes("degF")) return fToC(q.value);
  return Number(q.value); // degC (SI)
}
function toKmh(q) {
  if (!q || q.value == null) return null;
  const u = q.unitCode || "";
  if (u.includes("mph") || u.includes("mi_h-1")) return mphToKmh(q.value);
  if (u.includes("m_s-1") || u.includes("m/s")) return Number(q.value) * 3.6; // m/s → km/h
  return Number(q.value); // km_h-1 (SI)
}
function toMm(q) {
  if (!q || q.value == null) return null;
  const u = q.unitCode || "";
  if (u.includes("inch") || u.includes("in")) return Number(q.value) * 25.4;
  return Number(q.value); // mm (SI)
}
function toHpa(q) {
  if (!q || q.value == null) return null;
  const u = q.unitCode || "";
  // NWS commonly reports barometricPressure in Pa (wmoUnit:Pa).
  if (u.includes("Pa") && !u.includes("hPa")) return Number(q.value) / 100;
  return Number(q.value); // hPa
}
function toKm(q) {
  if (!q || q.value == null) return null;
  const u = q.unitCode || "";
  if (u.includes("mi") || u.includes("mile")) return milesToKm(q.value);
  if (u.includes("m") && !u.includes("km")) return Number(q.value) / 1000; // metres → km
  return Number(q.value);
}
function toPercent(q) {
  if (!q || q.value == null) return null;
  return round(q.value, 0);
}

// ── Condition mapping ─────────────────────────────────────────────────────────
// Map an NWS shortForecast / textual condition to the SAME Feldrix vocabulary
// weatherService.mapCondition produces, so downstream (icons, atmosphere,
// intelligence) behaves identically regardless of provider.
function mapNwsCondition(shortForecast, isDaytime = true) {
  const s = (shortForecast || "").toLowerCase();
  const clearIcon = isDaytime ? "\u2600\uFE0F" : "\uD83C\uDF19"; // ☀️ / 🌙

  if (s.includes("tornado")) return { condition: "Tornado", icon: "\uD83C\uDF2A\uFE0F", description: shortForecast };
  if (s.includes("thunder") || s.includes("tstorm")) return { condition: "Thunderstorm", icon: "\u26C8\uFE0F", description: shortForecast };
  if (s.includes("snow") || s.includes("flurries") || s.includes("blizzard") || s.includes("sleet") || s.includes("wintry"))
    return { condition: "Snow", icon: "\u2744\uFE0F", description: shortForecast };
  if (s.includes("freezing")) return { condition: "Snow", icon: "\u2744\uFE0F", description: shortForecast };
  if (s.includes("heavy rain")) return { condition: "Heavy Rain", icon: "\uD83C\uDF27\uFE0F", description: shortForecast };
  if (s.includes("light rain") || s.includes("drizzle")) return { condition: "Light Rain", icon: "\uD83C\uDF26\uFE0F", description: shortForecast };
  if (s.includes("rain") || s.includes("showers")) return { condition: "Rain", icon: "\uD83C\uDF27\uFE0F", description: shortForecast };
  if (s.includes("fog")) return { condition: "Foggy", icon: "\uD83C\uDF2B\uFE0F", description: shortForecast };
  if (s.includes("mist")) return { condition: "Misty", icon: "\uD83C\uDF2B\uFE0F", description: shortForecast };
  if (s.includes("haze")) return { condition: "Hazy", icon: "\uD83C\uDF2B\uFE0F", description: shortForecast };
  if (s.includes("dust") || s.includes("sand")) return { condition: "Dusty", icon: "\uD83C\uDF2C\uFE0F", description: shortForecast };
  if (s.includes("mostly cloudy") || s.includes("broken")) return { condition: "Mostly Cloudy", icon: "\uD83C\uDF25\uFE0F", description: shortForecast };
  if (s.includes("partly") || s.includes("few clouds") || s.includes("scattered") || s.includes("partly sunny"))
    return { condition: "Partly Cloudy", icon: "\u26C5", description: shortForecast };
  if (s.includes("cloud") || s.includes("overcast")) return { condition: "Cloudy", icon: "\u2601\uFE0F", description: shortForecast };
  if (s.includes("clear") || s.includes("sunny") || s.includes("fair")) return { condition: "Clear", icon: clearIcon, description: shortForecast || "Clear" };
  return { condition: "Unknown", icon: "\uD83C\uDF24\uFE0F", description: shortForecast || "" };
}

/** NWS icon URLs encode a POP like ".../rain,60" — extract the max percentage. */
function popFromIcon(iconUrl) {
  if (!iconUrl) return null;
  const matches = String(iconUrl).match(/,(\d{1,3})/g);
  if (!matches) return null;
  const vals = matches.map((m) => parseInt(m.replace(",", ""), 10)).filter((n) => !Number.isNaN(n));
  return vals.length ? Math.max(...vals) : null;
}

// ── /points resolution (cached long) ──────────────────────────────────────────
/**
 * Resolve the NWS gridpoint metadata for a coordinate: forecast office, grid
 * X/Y, forecast + hourly URLs, observation-stations URL, and the IANA timezone.
 * Works for ANY valid US coordinate — no hard-coded office.
 * @returns {object|null} { forecastUrl, forecastHourlyUrl, stationsUrl, timeZone, gridId, gridX, gridY, city, state } or null
 */
export async function resolveNwsPoint(lat, lon) {
  const key = `points_${round(lat, 4)}_${round(lon, 4)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const data = await nwsFetch(`${NWS_BASE}/points/${round(lat, 4)},${round(lon, 4)}`);
  const p = data?.properties;
  if (!p?.forecast) return null; // not a US point / NWS has no grid here

  const rel = p.relativeLocation?.properties || {};
  const result = {
    forecastUrl: p.forecast,
    forecastHourlyUrl: p.forecastHourly || null,
    stationsUrl: p.observationStations || null,
    timeZone: p.timeZone || null, // authoritative IANA tz for the farm point
    gridId: p.gridId || null,
    gridX: p.gridX ?? null,
    gridY: p.gridY ?? null,
    city: rel.city || null,
    state: rel.state || null,
  };
  cacheSet(key, result, TTL.points);
  return result;
}

// ── Observation station + latest observation ──────────────────────────────────
async function resolveStationId(stationsUrl) {
  if (!stationsUrl) return null;
  const key = `stations_${stationsUrl}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await nwsFetch(stationsUrl);
  const id = data?.features?.[0]?.properties?.stationIdentifier
    || data?.observationStations?.[0]?.split("/").pop()
    || null;
  if (id) cacheSet(key, id, TTL.stations);
  return id;
}

/** Latest observation for a station → partial canonical `current` (or {} if unavailable). */
async function fetchLatestObservation(stationId) {
  if (!stationId) return {};
  const key = `obs_${stationId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const data = await nwsFetch(`${NWS_BASE}/stations/${stationId}/observations/latest`);
  const o = data?.properties;
  if (!o) return {};

  const obs = {
    temperature: round(toC(o.temperature), 0),
    feelsLike: round(toC(o.heatIndex) ?? toC(o.windChill) ?? toC(o.temperature), 0),
    humidity: toPercent(o.relativeHumidity),
    windSpeed: round(toKmh(o.windSpeed), 0),
    windGust: round(toKmh(o.windGust), 0),
    windDirection: windDegToDirection(o.windDirection?.value),
    pressure: round(toHpa(o.barometricPressure) ?? toHpa(o.seaLevelPressure), 0),
    visibility: round(toKm(o.visibility), 0),
    dewPoint: round(toC(o.dewpoint), 0),
    rainfall: round(toMm(o.precipitationLastHour), 1),
    observedAt: o.timestamp || null,
    observedShortForecast: o.textDescription || null,
  };
  cacheSet(key, obs, TTL.observation);
  return obs;
}

function windDegToDirection(deg) {
  if (deg == null) return null;
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(Number(deg) / 22.5) % 16];
}

// ── Forecast (daily) + Hourly ─────────────────────────────────────────────────
async function fetchForecast(forecastUrl) {
  if (!forecastUrl) return null;
  const key = `fc_${forecastUrl}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  // Request metric so temperatures come back as °C.
  const data = await nwsFetch(`${forecastUrl}?units=si`);
  const periods = data?.properties?.periods;
  if (!Array.isArray(periods) || periods.length === 0) return null;
  cacheSet(key, periods, TTL.forecast);
  return periods;
}

async function fetchHourly(hourlyUrl) {
  if (!hourlyUrl) return null;
  const key = `hr_${hourlyUrl}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await nwsFetch(`${hourlyUrl}?units=si`);
  const periods = data?.properties?.periods;
  if (!Array.isArray(periods) || periods.length === 0) return null;
  cacheSet(key, periods, TTL.hourly);
  return periods;
}

/** NWS temperatures with units=si are °C; guard for the occasional °F unit. */
function periodTempC(period) {
  if (period?.temperature == null) return null;
  const unit = (period.temperatureUnit || "").toUpperCase();
  return unit === "F" ? fToC(period.temperature) : Number(period.temperature);
}

/** windSpeed comes as a string like "10 mph" or "5 to 10 km/h" — take the max number + unit. */
function parseWindString(windSpeed) {
  if (!windSpeed) return null;
  const nums = String(windSpeed).match(/\d+(\.\d+)?/g);
  if (!nums) return null;
  const val = Math.max(...nums.map(Number));
  const isMph = /mph/i.test(windSpeed);
  return isMph ? mphToKmh(val) : val; // si → km/h already
}

function buildHourly(hourlyPeriods) {
  if (!hourlyPeriods) return [];
  return hourlyPeriods.slice(0, 48).map((p) => {
    const { condition, icon, description } = mapNwsCondition(p.shortForecast, p.isDaytime);
    return {
      time: p.startTime,
      timestamp: p.startTime ? Math.floor(new Date(p.startTime).getTime() / 1000) : null,
      temperature: round(periodTempC(p), 0),
      feelsLike: round(periodTempC(p), 0), // NWS hourly has no separate apparent temp
      condition,
      description,
      icon,
      windSpeed: round(parseWindString(p.windSpeed), 0),
      windDirection: p.windDirection || null,
      windGust: null,
      humidity: p.relativeHumidity?.value ?? null,
      rainfall: 0, // NWS hourly gives POP, not a rain amount
      cloudCover: null,
      pressure: null,
      pop: p.probabilityOfPrecipitation?.value ?? popFromIcon(p.icon),
    };
  });
}

function buildDaily(forecastPeriods) {
  if (!forecastPeriods) return [];
  // NWS daily forecast alternates day/night periods. Group by calendar date and
  // fold the day (high) + night (low) periods into one canonical daily entry.
  const byDate = {};
  for (const p of forecastPeriods) {
    const date = (p.startTime || "").split("T")[0];
    if (!date) continue;
    if (!byDate[date]) byDate[date] = { date, day: null, night: null, periods: [] };
    if (p.isDaytime) byDate[date].day = p; else byDate[date].night = p;
    byDate[date].periods.push(p);
  }

  return Object.values(byDate).slice(0, 7).map((d) => {
    const rep = d.day || d.periods[0];
    const { condition, icon, description } = mapNwsCondition(rep?.shortForecast, true);
    const dayTemp = periodTempC(d.day);
    const nightTemp = periodTempC(d.night);
    const temps = [dayTemp, nightTemp].filter((t) => t != null);
    return {
      date: d.date,
      temperature: round(dayTemp ?? (temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null), 0),
      temperatureMin: round(temps.length ? Math.min(...temps) : null, 0),
      temperatureMax: round(temps.length ? Math.max(...temps) : null, 0),
      condition,
      description,
      icon,
      windSpeed: round(parseWindString(rep?.windSpeed), 0),
      windAvg: round(parseWindString(rep?.windSpeed), 0),
      humidity: rep?.relativeHumidity?.value ?? null,
      rainfall: 0, // NWS daily provides POP, not a rain amount; farmer rainfall logs stay authoritative
      pop: rep?.probabilityOfPrecipitation?.value ?? popFromIcon(rep?.icon),
    };
  });
}

// ── Official NWS alerts ─────────────────────────────────────────────────────────
/**
 * Map NWS severity/urgency into the EXISTING Feldrix visual severity model
 * (Critical/High/Medium/Low) used by the intelligence alert cards.
 */
function mapNwsSeverity(severity, urgency) {
  const sev = (severity || "").toLowerCase();
  const urg = (urgency || "").toLowerCase();
  if (sev === "extreme" || urg === "immediate") return { priority: "Critical", color: "#DC2626" };
  if (sev === "severe" || urg === "expected") return { priority: "High", color: "#EA580C" };
  if (sev === "moderate") return { priority: "Medium", color: "#D97706" };
  if (sev === "minor") return { priority: "Low", color: "#CA8A04" };
  return { priority: "High", color: "#EA580C" }; // unknown → treat cautiously
}

function alertIcon(event) {
  const e = (event || "").toLowerCase();
  if (e.includes("tornado")) return "\uD83C\uDF2A\uFE0F";
  if (e.includes("thunder")) return "\u26C8\uFE0F";
  if (e.includes("flood")) return "\uD83C\uDF0A";
  if (e.includes("heat")) return "\uD83D\uDD25";
  if (e.includes("winter") || e.includes("snow") || e.includes("blizzard") || e.includes("ice") || e.includes("freeze") || e.includes("frost")) return "\u2744\uFE0F";
  if (e.includes("wind")) return "\uD83D\uDCA8";
  if (e.includes("fire") || e.includes("red flag")) return "\uD83D\uDD25";
  if (e.includes("fog")) return "\uD83C\uDF2B\uFE0F";
  return "\u26A0\uFE0F";
}

/**
 * Fetch active official NWS alerts for a point.
 * @returns {Array} official alert objects (source:"nws"), or [] on failure / none.
 */
export async function fetchNwsAlerts(lat, lon) {
  const key = `alerts_${round(lat, 3)}_${round(lon, 3)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const data = await nwsFetch(`${NWS_BASE}/alerts/active?point=${round(lat, 4)},${round(lon, 4)}`);
  const features = data?.features;
  if (!Array.isArray(features)) {
    cacheSet(key, [], TTL.alerts); // cache the empty result too (avoid re-polling)
    return [];
  }

  const alerts = features.map((f) => {
    const p = f.properties || {};
    const { priority, color } = mapNwsSeverity(p.severity, p.urgency);
    return {
      id: f.id || p.id || `nws-${p.event}-${p.onset}`,
      source: "nws",
      sourceLabel: p.senderName || "National Weather Service",
      type: (p.event || "ALERT").toUpperCase().replace(/\s+/g, "_"),
      event: p.event || "Weather Alert",
      title: p.event || "Weather Alert",
      headline: p.headline || null,
      message: p.headline || p.event || "Active weather alert",
      description: p.description || null,
      instruction: p.instruction || null,
      severity: p.severity || null,
      urgency: p.urgency || null,
      certainty: p.certainty || null,
      priority,
      color,
      icon: alertIcon(p.event),
      areaDesc: p.areaDesc || null,
      onset: p.onset || p.effective || null,
      expires: p.ends || p.expires || null,
    };
  });

  cacheSet(key, alerts, TTL.alerts);
  return alerts;
}

// ── Top-level: build the canonical summary for a US farm ──────────────────────
/**
 * Fetch NWS-backed weather for a US farm coordinate and map it into the EXACT
 * canonical weather-summary model consumed across Feldrix.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {object} [opts] - { locationName, timezone }
 * @returns {object|null} canonical summary (with `official` alerts + `timezone`)
 *   or null if the core forecast cannot be built (caller should fall back to OWM).
 */
export async function fetchNwsWeather(lat, lon, opts = {}) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;

  const point = await resolveNwsPoint(lat, lon);
  if (!point?.forecastUrl) return null; // not a US grid → let caller fall back

  // Fetch forecast (required), hourly + observation + alerts (best-effort, parallel).
  const [forecastPeriods, hourlyPeriods, alerts] = await Promise.all([
    fetchForecast(point.forecastUrl),
    fetchHourly(point.forecastHourlyUrl),
    fetchNwsAlerts(lat, lon).catch(() => []),
  ]);

  // If the core daily forecast is unavailable, we cannot build a usable model.
  if (!forecastPeriods) return null;

  const stationId = await resolveStationId(point.stationsUrl).catch(() => null);
  const obs = await fetchLatestObservation(stationId).catch(() => ({}));

  const forecast = buildDaily(forecastPeriods);
  const hourly = buildHourly(hourlyPeriods);

  // Sunrise/sunset from coordinates (NWS does not supply them) → drives day/night.
  const { sunrise, sunset } = getSunTimes(lat, lon);

  // Build `current` preferring the live observation, falling back to the first
  // forecast period / first hourly entry when a field is unavailable. Never
  // blank: whatever we can populate, we do; the rest stay null.
  const firstDaily = forecast[0] || {};
  const firstHour = hourly[0] || {};
  const repShort = obs.observedShortForecast || firstHour.description || firstDaily.description;
  const nowIsDay = (() => {
    const sr = sunrise ? new Date(sunrise).getTime() : null;
    const ss = sunset ? new Date(sunset).getTime() : null;
    if (!sr || !ss) return true;
    const n = Date.now();
    return n >= sr && n < ss;
  })();
  const cond = mapNwsCondition(repShort, nowIsDay);

  const current = {
    temperature: obs.temperature ?? firstHour.temperature ?? firstDaily.temperature ?? null,
    feelsLike: obs.feelsLike ?? obs.temperature ?? firstHour.temperature ?? null,
    condition: cond.condition,
    description: cond.description,
    windSpeed: obs.windSpeed ?? firstHour.windSpeed ?? firstDaily.windSpeed ?? null,
    windDirection: obs.windDirection ?? firstHour.windDirection ?? null,
    windGust: obs.windGust ?? null,
    humidity: obs.humidity ?? firstHour.humidity ?? null,
    rainfall: obs.rainfall ?? 0,
    pressure: obs.pressure ?? null,
    visibility: obs.visibility ?? null,
    uvIndex: null, // NWS does not provide a UV index
    dewPoint: obs.dewPoint ?? null,
    cloudCover: null,
    icon: cond.icon,
    updatedAt: obs.observedAt || new Date().toISOString(),
    locationError: false,
    source: "nws",
    sunrise,
    sunset,
    coordinates: { lat: Number(lat), lon: Number(lon) },
    locationName: opts.locationName || [point.city, point.state].filter(Boolean).join(", ") || null,
  };

  return {
    current,
    hourly,
    forecast,
    // `alerts` mirrors the existing provider-alert channel (kept for parity),
    // while `official` is the explicit NWS official-alert channel the UI reads.
    alerts: [],
    official: alerts,
    available: true,
    locationError: false,
    location: opts.locationName || null,
    locationName: current.locationName,
    coordinates: { lat: Number(lat), lon: Number(lon) },
    source: "nws",
    timezone: point.timeZone || opts.timezone || null,
    nwsMeta: { gridId: point.gridId, gridX: point.gridX, gridY: point.gridY, stationId },
    lastUpdated: new Date().toISOString(),
  };
}
