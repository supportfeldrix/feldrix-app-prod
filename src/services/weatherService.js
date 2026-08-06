/**
 * FarmHand PRO — Weather Service
 * Sprint 25 – Weather Intelligence
 *
 * Provides current weather, forecast, and summary
 * for farm operational decisions.
 *
 * Configuration:
 *   Set VITE_WEATHER_API_KEY and VITE_WEATHER_LOCATION
 *   in your .env file when ready to connect a live provider.
 *
 * Until a live provider is configured, the service returns
 * safe default values so the rest of the app continues working.
 */

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "";
const DEFAULT_LOCATION = import.meta.env.VITE_WEATHER_LOCATION || "Johannesburg,ZA";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// =====================================================
// Safe Defaults
// =====================================================

function getDefaultCurrent() {
  return {
    temperature: null,
    condition: "Unknown",
    windSpeed: null,
    humidity: null,
    rainfall: null,
    icon: "🌤️",
    updatedAt: null,
    locationError: false,
  };
}

function getDefaultForecast() {
  return [];
}

// =====================================================
// Internal Helpers
// =====================================================

function mapCondition(weatherMain) {
  switch (weatherMain) {
    case "Clear":
      return { condition: "Clear", icon: "☀️" };
    case "Clouds":
      return { condition: "Cloudy", icon: "☁️" };
    case "Rain":
    case "Drizzle":
      return { condition: "Rain", icon: "🌧️" };
    case "Thunderstorm":
      return { condition: "Thunderstorm", icon: "⛈️" };
    case "Snow":
      return { condition: "Snow", icon: "❄️" };
    case "Mist":
    case "Fog":
    case "Haze":
      return { condition: "Misty", icon: "🌫️" };
    default:
      return { condition: weatherMain || "Unknown", icon: "🌤️" };
  }
}

function parseCurrent(data) {
  const weather = data.weather?.[0] || {};
  const { condition, icon } = mapCondition(weather.main);

  return {
    temperature: Math.round(data.main?.temp ?? 0),
    condition,
    windSpeed: Math.round(data.wind?.speed ?? 0),
    humidity: data.main?.humidity ?? null,
    rainfall: data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0,
    icon,
    updatedAt: new Date().toISOString(),
  };
}

function parseForecastDay(item) {
  const weather = item.weather?.[0] || {};
  const { condition, icon } = mapCondition(weather.main);

  return {
    date: item.dt_txt?.split(" ")[0] || "",
    temperature: Math.round(item.main?.temp ?? 0),
    temperatureMin: Math.round(item.main?.temp_min ?? 0),
    temperatureMax: Math.round(item.main?.temp_max ?? 0),
    condition,
    icon,
    windSpeed: Math.round(item.wind?.speed ?? 0),
    humidity: item.main?.humidity ?? null,
    rainfall: item.rain?.["3h"] ?? 0,
  };
}

// =====================================================
// Public API
// =====================================================

/**
 * Get current weather conditions.
 * Returns safe defaults if the API is unavailable or unconfigured.
 *
 * @param {string} [location] - Optional location override (e.g. "Stellenbosch,ZA")
 */
export async function getCurrentWeather(location) {
  if (!API_KEY) {
    return getDefaultCurrent();
  }

  const loc = location || DEFAULT_LOCATION;

  try {
    const url = `${BASE_URL}/weather?q=${encodeURIComponent(loc)}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      // 404 = city not found by OpenWeatherMap
      if (response.status === 404) {
        return { ...getDefaultCurrent(), locationError: true };
      }
      return getDefaultCurrent();
    }

    const data = await response.json();
    return parseCurrent(data);
  } catch (err) {
    console.error("[Weather] Fetch failed:", err);
    return getDefaultCurrent();
  }
}

/**
 * Get 5-day forecast (3-hour intervals).
 * Returns one entry per day (midday reading).
 *
 * @param {string} [location] - Optional location override
 */
export async function getForecast(location) {
  if (!API_KEY) {
    return getDefaultForecast();
  }

  const loc = location || DEFAULT_LOCATION;

  try {
    const response = await fetch(
      `${BASE_URL}/forecast?q=${encodeURIComponent(loc)}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      return getDefaultForecast();
    }

    const data = await response.json();
    const list = data.list || [];

    // Extract one reading per day (closest to midday)
    const dailyMap = {};
    for (const item of list) {
      const date = item.dt_txt?.split(" ")[0];
      const hour = parseInt(item.dt_txt?.split(" ")[1]?.split(":")[0] || "0", 10);

      if (!dailyMap[date] || Math.abs(hour - 12) < Math.abs(dailyMap[date].hour - 12)) {
        dailyMap[date] = { item, hour };
      }
    }

    return Object.values(dailyMap)
      .map(({ item }) => parseForecastDay(item))
      .slice(0, 5);
  } catch {
    return getDefaultForecast();
  }
}

/**
 * Get a complete weather summary (current + forecast).
 * Single call for components that need everything.
 *
 * @param {string} [location] - Optional location override (e.g. "Stellenbosch,ZA")
 */
export async function getWeatherSummary(location) {
  const [current, forecast] = await Promise.all([
    getCurrentWeather(location),
    getForecast(location),
  ]);

  return {
    current,
    forecast,
    available: current.updatedAt !== null,
    locationError: current.locationError || false,
    location: location || DEFAULT_LOCATION,
  };
}
