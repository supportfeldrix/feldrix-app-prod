/**
 * Feldrix — Weather Service
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Multi-source weather data provider with intelligent caching,
 * automatic fallback, hourly & 7-day forecasts, and offline support.
 *
 * Data Sources (priority order):
 *   1. SAWS (South African Weather Service) — Severe warnings, cold fronts, frost, freeze, storms
 *   2. OpenWeatherMap — Current, hourly, daily forecast, wind, rain, humidity, UV
 *   3. Feldrix Intelligence Engine (weatherIntelligenceService.js) — Transforms into farm advice
 *
 * Configuration (.env):
 *   VITE_WEATHER_API_KEY       — OpenWeatherMap API key (required for live data)
 *   VITE_WEATHER_LOCATION      — Default location (e.g. "Stellenbosch,ZA")
 *   VITE_SAWS_API_KEY          — SAWS API key (optional, for severe warnings)
 *   VITE_WEATHER_CACHE_MINUTES — Cache duration in minutes (default: 30)
 *
 * Fallback Strategy:
 *   If primary provider fails → try secondary → use cached data → use safe defaults
 *   Weather is NEVER blank.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "";
const SAWS_API_KEY = import.meta.env.VITE_SAWS_API_KEY || "";
const DEFAULT_LOCATION = import.meta.env.VITE_WEATHER_LOCATION || "";
const CACHE_MINUTES = parseInt(import.meta.env.VITE_WEATHER_CACHE_MINUTES || "30", 10);

const OWM_BASE = "https://api.openweathermap.org/data/2.5";
const OWM_ONECALL = "https://api.openweathermap.org/data/3.0/onecall";

// SAWS API placeholder — will be connected when API access is granted
const SAWS_BASE = "https://api.weathersa.co.za/v1";

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE — Intelligent in-memory + localStorage persistence
// ═══════════════════════════════════════════════════════════════════════════════

const CACHE_KEY_PREFIX = "feldrix_weather_";
const cache = new Map();

// Request deduplication — prevents duplicate API calls when multiple components
// request weather data simultaneously (BUG 14 performance fix)
const pendingRequests = new Map();

/**
 * Get cached data if still valid.
 * @param {string} key - Cache key
 * @returns {object|null} Cached data or null
 */
function getCached(key) {
  const fullKey = CACHE_KEY_PREFIX + key;

  // Try memory first
  if (cache.has(fullKey)) {
    const entry = cache.get(fullKey);
    if (Date.now() - entry.timestamp < CACHE_MINUTES * 60 * 1000) {
      return entry.data;
    }
    cache.delete(fullKey);
  }

  // Try localStorage (offline support)
  try {
    const stored = localStorage.getItem(fullKey);
    if (stored) {
      const entry = JSON.parse(stored);
      if (Date.now() - entry.timestamp < CACHE_MINUTES * 60 * 1000) {
        cache.set(fullKey, entry); // Promote to memory
        return entry.data;
      }
    }
  } catch { /* localStorage unavailable */ }

  return null;
}

/**
 * Store data in cache (memory + localStorage).
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 */
function setCache(key, data) {
  const fullKey = CACHE_KEY_PREFIX + key;
  const entry = { data, timestamp: Date.now() };

  cache.set(fullKey, entry);

  try {
    localStorage.setItem(fullKey, JSON.stringify(entry));
  } catch { /* localStorage full or unavailable */ }
}

/**
 * Get the last known weather data regardless of cache expiry.
 * Used for offline fallback — better to show stale data than nothing.
 * @param {string} key - Cache key
 * @returns {object|null}
 */
function getLastKnown(key) {
  const fullKey = CACHE_KEY_PREFIX + key;

  // Memory
  if (cache.has(fullKey)) {
    return cache.get(fullKey).data;
  }

  // localStorage
  try {
    const stored = localStorage.getItem(fullKey);
    if (stored) {
      return JSON.parse(stored).data;
    }
  } catch { /* unavailable */ }

  return null;
}

/**
 * Clear all weather cache entries.
 */
export function clearWeatherCache() {
  // Clear memory
  for (const key of cache.keys()) {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      cache.delete(key);
    }
  }
  // Clear localStorage
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch { /* unavailable */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE DEFAULTS — Weather is NEVER blank
// ═══════════════════════════════════════════════════════════════════════════════

function getDefaultCurrent() {
  return {
    temperature: null,
    feelsLike: null,
    condition: "Unknown",
    description: "",
    windSpeed: null,
    windDirection: null,
    windGust: null,
    humidity: null,
    rainfall: null,
    pressure: null,
    visibility: null,
    uvIndex: null,
    dewPoint: null,
    cloudCover: null,
    icon: "\uD83C\uDF24\uFE0F",
    updatedAt: null,
    locationError: false,
    source: "default",
  };
}

function getDefaultHourly() {
  return [];
}

function getDefaultForecast() {
  return [];
}

function getDefaultAlerts() {
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITION MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

function mapCondition(weatherMain, weatherDescription) {
  const desc = (weatherDescription || "").toLowerCase();

  switch (weatherMain) {
    case "Clear":
      return { condition: "Clear", icon: "\u2600\uFE0F", description: "Clear sky" };
    case "Clouds":
      if (desc.includes("few")) return { condition: "Partly Cloudy", icon: "\u26C5", description: "Few clouds" };
      if (desc.includes("scattered")) return { condition: "Partly Cloudy", icon: "\uD83C\uDF24\uFE0F", description: "Scattered clouds" };
      if (desc.includes("broken")) return { condition: "Mostly Cloudy", icon: "\uD83C\uDF25\uFE0F", description: "Broken clouds" };
      return { condition: "Cloudy", icon: "\u2601\uFE0F", description: "Overcast" };
    case "Rain":
      if (desc.includes("heavy")) return { condition: "Heavy Rain", icon: "\uD83C\uDF27\uFE0F", description: "Heavy rain" };
      if (desc.includes("light")) return { condition: "Light Rain", icon: "\uD83C\uDF26\uFE0F", description: "Light rain" };
      return { condition: "Rain", icon: "\uD83C\uDF27\uFE0F", description: "Rain" };
    case "Drizzle":
      return { condition: "Drizzle", icon: "\uD83C\uDF26\uFE0F", description: "Drizzle" };
    case "Thunderstorm":
      return { condition: "Thunderstorm", icon: "\u26C8\uFE0F", description: "Thunderstorm" };
    case "Snow":
      return { condition: "Snow", icon: "\u2744\uFE0F", description: "Snow" };
    case "Mist":
      return { condition: "Misty", icon: "\uD83C\uDF2B\uFE0F", description: "Mist" };
    case "Fog":
      return { condition: "Foggy", icon: "\uD83C\uDF2B\uFE0F", description: "Fog" };
    case "Haze":
      return { condition: "Hazy", icon: "\uD83C\uDF2B\uFE0F", description: "Haze" };
    case "Dust":
    case "Sand":
      return { condition: "Dusty", icon: "\uD83C\uDF2C\uFE0F", description: "Dust" };
    case "Tornado":
      return { condition: "Tornado", icon: "\uD83C\uDF2A\uFE0F", description: "Tornado" };
    default:
      return { condition: weatherMain || "Unknown", icon: "\uD83C\uDF24\uFE0F", description: weatherMain || "" };
  }
}

/**
 * Convert wind degrees to compass direction.
 */
function windDegToDirection(deg) {
  if (deg == null) return null;
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(deg / 22.5) % 16];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSERS — Transform API responses into Feldrix format
// ═══════════════════════════════════════════════════════════════════════════════

function parseCurrentOWM(data) {
  const weather = data.weather?.[0] || {};
  const { condition, icon, description } = mapCondition(weather.main, weather.description);

  return {
    temperature: Math.round(data.main?.temp ?? 0),
    feelsLike: Math.round(data.main?.feels_like ?? data.main?.temp ?? 0),
    condition,
    description,
    windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6), // m/s → km/h
    windDirection: windDegToDirection(data.wind?.deg),
    windGust: data.wind?.gust ? Math.round(data.wind.gust * 3.6) : null,
    humidity: data.main?.humidity ?? null,
    rainfall: data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0,
    pressure: data.main?.pressure ?? null,
    visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // m → km
    uvIndex: null, // Not available in basic current endpoint
    dewPoint: null,
    cloudCover: data.clouds?.all ?? null,
    icon,
    updatedAt: new Date().toISOString(),
    locationError: false,
    source: "openweathermap",
    sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toISOString() : null,
    sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toISOString() : null,
    coordinates: data.coord ? { lat: data.coord.lat, lon: data.coord.lon } : null,
    locationName: data.name || null,
  };
}

function parseHourlyOWM(list) {
  return list.map((item) => {
    const weather = item.weather?.[0] || {};
    const { condition, icon, description } = mapCondition(weather.main, weather.description);

    return {
      time: item.dt_txt || new Date(item.dt * 1000).toISOString(),
      timestamp: item.dt,
      temperature: Math.round(item.main?.temp ?? 0),
      feelsLike: Math.round(item.main?.feels_like ?? item.main?.temp ?? 0),
      condition,
      description,
      icon,
      windSpeed: Math.round((item.wind?.speed ?? 0) * 3.6),
      windDirection: windDegToDirection(item.wind?.deg),
      windGust: item.wind?.gust ? Math.round(item.wind.gust * 3.6) : null,
      humidity: item.main?.humidity ?? null,
      rainfall: item.rain?.["3h"] ?? item.rain?.["1h"] ?? 0,
      cloudCover: item.clouds?.all ?? null,
      pressure: item.main?.pressure ?? null,
      pop: item.pop != null ? Math.round(item.pop * 100) : null, // Probability of precipitation %
    };
  });
}

function parseDailyFromHourly(hourlyList) {
  // Group by date and extract daily min/max/dominant condition
  const dailyMap = {};

  for (const item of hourlyList) {
    const dateStr = (item.dt_txt || new Date(item.dt * 1000).toISOString()).split("T")[0].split(" ")[0];

    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = {
        date: dateStr,
        temps: [],
        conditions: [],
        winds: [],
        humidity: [],
        rainfall: 0,
        pop: [],
        items: [],
      };
    }

    const day = dailyMap[dateStr];
    day.temps.push(item.main?.temp ?? 0);
    day.conditions.push(item.weather?.[0]?.main || "Clear");
    day.winds.push((item.wind?.speed ?? 0) * 3.6);
    day.humidity.push(item.main?.humidity ?? 0);
    day.rainfall += item.rain?.["3h"] ?? item.rain?.["1h"] ?? 0;
    day.pop.push(item.pop ?? 0);
    day.items.push(item);
  }

  return Object.values(dailyMap).map((day) => {
    // Find dominant condition (most frequent)
    const conditionCounts = {};
    for (const c of day.conditions) {
      conditionCounts[c] = (conditionCounts[c] || 0) + 1;
    }
    const dominantCondition = Object.entries(conditionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Clear";

    const { condition, icon, description } = mapCondition(dominantCondition, "");

    // Get midday reading for representative temperature
    const middayItem = day.items.find((item) => {
      const hour = parseInt((item.dt_txt || "").split(" ")[1]?.split(":")[0] || "0", 10);
      return hour >= 11 && hour <= 14;
    }) || day.items[Math.floor(day.items.length / 2)];

    return {
      date: day.date,
      temperature: Math.round(middayItem?.main?.temp ?? (Math.max(...day.temps) + Math.min(...day.temps)) / 2),
      temperatureMin: Math.round(Math.min(...day.temps)),
      temperatureMax: Math.round(Math.max(...day.temps)),
      condition,
      description,
      icon,
      windSpeed: Math.round(Math.max(...day.winds)),
      windAvg: Math.round(day.winds.reduce((a, b) => a + b, 0) / day.winds.length),
      humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      rainfall: Math.round(day.rainfall * 10) / 10,
      pop: Math.round(Math.max(...day.pop) * 100), // Max probability of precipitation
    };
  }).slice(0, 7); // Up to 7 days
}

/**
 * Parse OneCall API response (if available — provides hourly + daily + alerts).
 */
function parseOneCallOWM(data) {
  const current = data.current || {};
  const weather = current.weather?.[0] || {};
  const { condition, icon, description } = mapCondition(weather.main, weather.description);

  const parsedCurrent = {
    temperature: Math.round(current.temp ?? 0),
    feelsLike: Math.round(current.feels_like ?? current.temp ?? 0),
    condition,
    description,
    windSpeed: Math.round((current.wind_speed ?? 0) * 3.6),
    windDirection: windDegToDirection(current.wind_deg),
    windGust: current.wind_gust ? Math.round(current.wind_gust * 3.6) : null,
    humidity: current.humidity ?? null,
    rainfall: current.rain?.["1h"] ?? 0,
    pressure: current.pressure ?? null,
    visibility: current.visibility ? Math.round(current.visibility / 1000) : null,
    uvIndex: current.uvi ?? null,
    dewPoint: current.dew_point != null ? Math.round(current.dew_point) : null,
    cloudCover: current.clouds ?? null,
    icon,
    updatedAt: new Date().toISOString(),
    locationError: false,
    source: "openweathermap-onecall",
    sunrise: current.sunrise ? new Date(current.sunrise * 1000).toISOString() : null,
    sunset: current.sunset ? new Date(current.sunset * 1000).toISOString() : null,
  };

  const parsedHourly = (data.hourly || []).slice(0, 48).map((hour) => {
    const hw = hour.weather?.[0] || {};
    const hm = mapCondition(hw.main, hw.description);
    return {
      time: new Date(hour.dt * 1000).toISOString(),
      timestamp: hour.dt,
      temperature: Math.round(hour.temp ?? 0),
      feelsLike: Math.round(hour.feels_like ?? hour.temp ?? 0),
      condition: hm.condition,
      description: hm.description,
      icon: hm.icon,
      windSpeed: Math.round((hour.wind_speed ?? 0) * 3.6),
      windDirection: windDegToDirection(hour.wind_deg),
      windGust: hour.wind_gust ? Math.round(hour.wind_gust * 3.6) : null,
      humidity: hour.humidity ?? null,
      rainfall: hour.rain?.["1h"] ?? 0,
      cloudCover: hour.clouds ?? null,
      pressure: hour.pressure ?? null,
      pop: hour.pop != null ? Math.round(hour.pop * 100) : null,
      uvIndex: hour.uvi ?? null,
    };
  });

  const parsedDaily = (data.daily || []).slice(0, 7).map((day) => {
    const dw = day.weather?.[0] || {};
    const dm = mapCondition(dw.main, dw.description);
    return {
      date: new Date(day.dt * 1000).toISOString().split("T")[0],
      temperature: Math.round(day.temp?.day ?? 0),
      temperatureMin: Math.round(day.temp?.min ?? 0),
      temperatureMax: Math.round(day.temp?.max ?? 0),
      temperatureMorn: Math.round(day.temp?.morn ?? 0),
      temperatureEve: Math.round(day.temp?.eve ?? 0),
      temperatureNight: Math.round(day.temp?.night ?? 0),
      condition: dm.condition,
      description: dm.description,
      icon: dm.icon,
      windSpeed: Math.round((day.wind_speed ?? 0) * 3.6),
      windGust: day.wind_gust ? Math.round(day.wind_gust * 3.6) : null,
      windAvg: Math.round((day.wind_speed ?? 0) * 3.6),
      humidity: day.humidity ?? null,
      rainfall: (day.rain ?? 0),
      pop: day.pop != null ? Math.round(day.pop * 100) : null,
      uvIndex: day.uvi ?? null,
      sunrise: new Date(day.sunrise * 1000).toISOString(),
      sunset: new Date(day.sunset * 1000).toISOString(),
    };
  });

  // Provider alerts (OWM severe weather)
  const parsedAlerts = (data.alerts || []).map((alert) => ({
    id: `owm-${alert.event?.replace(/\s+/g, "-").toLowerCase()}-${alert.start}`,
    source: alert.sender_name || "OpenWeatherMap",
    event: alert.event || "Weather Alert",
    description: alert.description || "",
    start: new Date(alert.start * 1000).toISOString(),
    end: new Date(alert.end * 1000).toISOString(),
    tags: alert.tags || [],
  }));

  return {
    current: parsedCurrent,
    hourly: parsedHourly,
    forecast: parsedDaily,
    alerts: parsedAlerts,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAWS INTEGRATION (Architecture prepared — awaits API access)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch severe weather warnings from South African Weather Service.
 * Currently returns empty array — will be connected when SAWS API access is granted.
 *
 * Expected warnings: Cold Fronts, Frost, Freeze, Storms, Floods, Heatwave
 *
 * @param {string} province - SA province code (e.g. "GP", "WC", "KZN", "FS")
 * @returns {Array} Array of SAWS alert objects
 */
export async function getSAWSWarnings(province = "GP") {
  if (!SAWS_API_KEY) {
    return getDefaultAlerts();
  }

  const cacheKey = `saws_warnings_${province}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${SAWS_BASE}/warnings?province=${province}`,
      {
        headers: {
          "Authorization": `Bearer ${SAWS_API_KEY}`,
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn("[Weather] SAWS API unavailable, using fallback.");
      return getDefaultAlerts();
    }

    const data = await response.json();
    const alerts = (data.warnings || data.alerts || []).map((warning) => ({
      id: `saws-${warning.id || warning.type}`,
      source: "SAWS",
      event: warning.title || warning.type || "Weather Warning",
      description: warning.description || warning.message || "",
      severity: warning.severity || "moderate",
      start: warning.valid_from || warning.start || new Date().toISOString(),
      end: warning.valid_to || warning.end || null,
      province: warning.province || province,
      type: warning.type, // FROST, FREEZE, STORM, FLOOD, HEAT, WIND, etc.
    }));

    setCache(cacheKey, alerts);
    return alerts;
  } catch (err) {
    console.warn("[Weather] SAWS fetch failed:", err.message);
    return getLastKnown(cacheKey) || getDefaultAlerts();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOCODING — Resolve location name to coordinates for OneCall API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Geocode a location name to lat/lon.
 * Required for OneCall API which needs coordinates.
 */
async function geocodeLocation(location) {
  const cacheKey = `geocode_${location}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    const result = { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
    setCache(cacheKey, result);
    return result;
  } catch {
    return getLastKnown(cacheKey) || null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — Enhanced with caching, fallback, and new data types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get current weather conditions.
 * Returns safe defaults if the API is unavailable or unconfigured.
 *
 * Enhanced in v1.1:
 *   - Added feelsLike, windDirection, windGust, pressure, visibility, uvIndex, dewPoint, cloudCover
 *   - Added sunrise/sunset times
 *   - Added intelligent caching
 *   - Added offline fallback (last known data)
 *
 * @param {string} [location] - Optional location override (e.g. "Stellenbosch,ZA")
 * @returns {object} Current weather data
 */
export async function getCurrentWeather(location) {
  const loc = location || DEFAULT_LOCATION;
  const cacheKey = `current_${loc}`;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!API_KEY) {
    return getDefaultCurrent();
  }

  try {
    const url = `${OWM_BASE}/weather?q=${encodeURIComponent(loc)}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return { ...getDefaultCurrent(), locationError: true };
      }
      // Fallback to last known
      return getLastKnown(cacheKey) || getDefaultCurrent();
    }

    const data = await response.json();
    const result = parseCurrentOWM(data);
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[Weather] Current fetch failed:", err);
    return getLastKnown(cacheKey) || getDefaultCurrent();
  }
}

/**
 * Get hourly forecast (up to 48 hours).
 *
 * New in v1.1.
 * Provides 3-hour interval data from the free tier, or hourly from OneCall.
 *
 * @param {string} [location] - Optional location override
 * @returns {Array} Array of hourly weather objects
 */
export async function getHourlyForecast(location) {
  const loc = location || DEFAULT_LOCATION;
  const cacheKey = `hourly_${loc}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!API_KEY) {
    return getDefaultHourly();
  }

  // Try OneCall API first (provides true hourly data)
  const coords = await geocodeLocation(loc);
  if (coords) {
    try {
      const url = `${OWM_ONECALL}?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely&units=metric&appid=${API_KEY}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const parsed = parseOneCallOWM(data);
        setCache(cacheKey, parsed.hourly);
        return parsed.hourly;
      }
    } catch {
      // Fall through to forecast/5 endpoint
    }
  }

  // Fallback: Use 5-day/3-hour forecast endpoint (free tier)
  try {
    const response = await fetch(
      `${OWM_BASE}/forecast?q=${encodeURIComponent(loc)}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      return getLastKnown(cacheKey) || getDefaultHourly();
    }

    const data = await response.json();
    const hourly = parseHourlyOWM(data.list || []);
    setCache(cacheKey, hourly);
    return hourly;
  } catch {
    return getLastKnown(cacheKey) || getDefaultHourly();
  }
}

/**
 * Get 7-day daily forecast.
 *
 * Enhanced in v1.1:
 *   - Extended from 5 days to 7 days (when OneCall available)
 *   - Added min/max/morning/evening/night temperatures
 *   - Added probability of precipitation
 *   - Added UV index per day
 *   - Added sunrise/sunset per day
 *
 * @param {string} [location] - Optional location override
 * @returns {Array} Array of daily forecast objects (up to 7 days)
 */
export async function getForecast(location) {
  const loc = location || DEFAULT_LOCATION;
  const cacheKey = `forecast_${loc}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!API_KEY) {
    return getDefaultForecast();
  }

  // Try OneCall API first (provides 7-day daily)
  const coords = await geocodeLocation(loc);
  if (coords) {
    try {
      const url = `${OWM_ONECALL}?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely&units=metric&appid=${API_KEY}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const parsed = parseOneCallOWM(data);
        setCache(cacheKey, parsed.forecast);
        return parsed.forecast;
      }
    } catch {
      // Fall through to forecast/5 endpoint
    }
  }

  // Fallback: Use 5-day/3-hour forecast endpoint (free tier) and derive daily
  try {
    const response = await fetch(
      `${OWM_BASE}/forecast?q=${encodeURIComponent(loc)}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      return getLastKnown(cacheKey) || getDefaultForecast();
    }

    const data = await response.json();
    const daily = parseDailyFromHourly(data.list || []);
    setCache(cacheKey, daily);
    return daily;
  } catch {
    return getLastKnown(cacheKey) || getDefaultForecast();
  }
}

/**
 * Get a complete weather summary (current + hourly + forecast + alerts).
 * Single call for components that need everything.
 *
 * Enhanced in v1.1:
 *   - Added hourly forecast data
 *   - Added provider alerts (OWM + SAWS)
 *   - Added weather history reference
 *   - Multi-source fallback
 *   - Intelligent caching reduces API calls
 *
 * @param {string} [location] - Optional location override (e.g. "Stellenbosch,ZA")
 * @returns {object} Complete weather summary
 */
export async function getWeatherSummary(location) {
  const loc = location || DEFAULT_LOCATION;
  const cacheKey = `summary_${loc}`;

  // Check full summary cache first (reduces API calls)
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Request deduplication — if this exact request is already in flight, await it
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = _fetchWeatherSummary(loc, cacheKey);
  pendingRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

/** Internal: actual fetch logic for getWeatherSummary (separated for deduplication) */
async function _fetchWeatherSummary(loc, cacheKey) {

  // Try OneCall API first (single request for everything)
  if (API_KEY) {
    const coords = await geocodeLocation(loc);
    if (coords) {
      try {
        const url = `${OWM_ONECALL}?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely&units=metric&appid=${API_KEY}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          const parsed = parseOneCallOWM(data);

          // Also try SAWS warnings
          const sawsAlerts = await getSAWSWarnings().catch(() => []);

          const result = {
            current: parsed.current,
            hourly: parsed.hourly,
            forecast: parsed.forecast,
            alerts: [...parsed.alerts, ...sawsAlerts],
            available: true,
            locationError: false,
            location: loc,
            locationName: coords.name || loc,
            coordinates: coords,
            source: "openweathermap-onecall",
            lastUpdated: new Date().toISOString(),
          };

          setCache(cacheKey, result);
          // Also cache individual components
          setCache(`current_${loc}`, result.current);
          setCache(`hourly_${loc}`, result.hourly);
          setCache(`forecast_${loc}`, result.forecast);

          return result;
        }
      } catch {
        // Fall through to individual endpoints
      }
    }
  }

  // Fallback: Individual API calls (free tier)
  const [current, hourly, forecast, sawsAlerts] = await Promise.all([
    getCurrentWeather(loc),
    getHourlyForecast(loc),
    getForecast(loc),
    getSAWSWarnings().catch(() => []),
  ]);

  const result = {
    current,
    hourly,
    forecast,
    alerts: sawsAlerts,
    available: current.updatedAt !== null,
    locationError: current.locationError || false,
    location: loc,
    locationName: current.locationName || loc,
    coordinates: current.coordinates || null,
    source: current.source || "default",
    lastUpdated: current.updatedAt || null,
  };

  if (result.available) {
    setCache(cacheKey, result);
  }

  return result;
}

/**
 * Get full weather data optimised for the Weather Intelligence Engine.
 * Same as getWeatherSummary but ensures hourly data is present for risk calculations.
 *
 * @param {string} [location] - Optional location override
 * @returns {object} Complete weather data ready for intelligence engine
 */
export async function getWeatherForIntelligence(location) {
  const summary = await getWeatherSummary(location);

  // Ensure hourly data exists (even if empty, the engine handles it gracefully)
  if (!summary.hourly) {
    summary.hourly = [];
  }

  return summary;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEATHER HISTORY — Store for future analytics (PRO feature)
// ═══════════════════════════════════════════════════════════════════════════════

const HISTORY_KEY = "feldrix_weather_history";
const MAX_HISTORY_ENTRIES = 168; // 7 days of hourly readings

/**
 * Record a weather snapshot for historical tracking.
 * Stores rainfall, temperature, wind, humidity over time.
 *
 * @param {object} current - Current weather data
 */
export function recordWeatherHistory(current) {
  if (!current || !current.updatedAt) return;

  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

    history.push({
      timestamp: current.updatedAt,
      temperature: current.temperature,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
      rainfall: current.rainfall,
      condition: current.condition,
    });

    // Keep only the latest entries
    while (history.length > MAX_HISTORY_ENTRIES) {
      history.shift();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* storage unavailable */ }
}

/**
 * Get stored weather history for analytics.
 *
 * @returns {Array} Array of historical weather snapshots
 */
export function getWeatherHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Get weather history summary (min/max/avg over stored period).
 *
 * @returns {object} { avgTemp, minTemp, maxTemp, totalRainfall, avgHumidity, avgWind, entries, periodDays }
 */
export function getWeatherHistorySummary() {
  const history = getWeatherHistory();
  if (history.length === 0) {
    return { avgTemp: null, minTemp: null, maxTemp: null, totalRainfall: 0, avgHumidity: null, avgWind: null, entries: 0, periodDays: 0 };
  }

  const temps = history.filter((h) => h.temperature != null).map((h) => h.temperature);
  const humidities = history.filter((h) => h.humidity != null).map((h) => h.humidity);
  const winds = history.filter((h) => h.windSpeed != null).map((h) => h.windSpeed);
  const rainfall = history.reduce((sum, h) => sum + (h.rainfall || 0), 0);

  const first = new Date(history[0].timestamp);
  const last = new Date(history[history.length - 1].timestamp);
  const periodDays = Math.max(1, Math.round((last - first) / (1000 * 60 * 60 * 24)));

  return {
    avgTemp: temps.length > 0 ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null,
    minTemp: temps.length > 0 ? Math.min(...temps) : null,
    maxTemp: temps.length > 0 ? Math.max(...temps) : null,
    totalRainfall: Math.round(rainfall * 10) / 10,
    avgHumidity: humidities.length > 0 ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length) : null,
    avgWind: winds.length > 0 ? Math.round(winds.reduce((a, b) => a + b, 0) / winds.length) : null,
    entries: history.length,
    periodDays,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY WEATHER REPORTS — Architecture prepared for v2
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Submit a community weather report.
 * Architecture placeholder — will be connected to Supabase in v2.
 *
 * @param {object} report - { type: "hail"|"frost"|"flood"|"fire"|"wind"|"lightning", coordinates: {lat, lon}, description?, severity? }
 * @returns {object} { success, id }
 */
export async function submitCommunityReport(report) {
  // v2: Store in Supabase, notify nearby farmers
  console.info("[Weather] Community report prepared (v2 feature):", report.type);
  return { success: false, message: "Community reports coming in Version 2" };
}

/**
 * Get nearby community weather reports.
 * Architecture placeholder — will be connected to Supabase in v2.
 *
 * @param {object} coordinates - { lat, lon }
 * @param {number} radiusKm - Search radius in km
 * @returns {Array} Community reports
 */
export async function getNearbyCommunityReports(coordinates, radiusKm = 50) {
  // v2: Query Supabase for reports within radius
  return [];
}
