/**
 * FarmHand PRO — Notification Engine
 * Weather Notification Provider
 *
 * Converts weather data into standardized notifications.
 * Evaluates conditions against configurable thresholds for
 * frost, rain, wind, and temperature extremes.
 *
 * @module weatherNotifications
 */

// Configurable thresholds
const FROST_TEMP = 2;
const HEAVY_RAIN_MM = 20;
const STRONG_WIND_KMH = 40;
const HIGH_TEMP = 35;
const LOW_TEMP = 5;

/**
 * Generates weather notifications from current and forecast data.
 *
 * @param {object} data - Farm data context
 * @param {object} data.weather - Weather data
 * @param {object} data.weather.current - Current conditions
 * @param {Array} data.weather.forecast - Forecast array
 * @returns {Array} Array of notification objects
 */
export function getWeatherNotifications(data = {}) {
  try {
    const weather = data?.weather;

    if (!weather || !weather.available) {
      return [];
    }

    const current = weather.current || {};
    const forecast = Array.isArray(weather.forecast) ? weather.forecast : [];

    const notifications = [];

    // Critical: Frost risk
    if (isFrostRisk(current, forecast)) {
      notifications.push(buildNotification(
        "Critical",
        "Frost Warning",
        `Temperature expected to drop below ${FROST_TEMP}°C within 24 hours. Protect sensitive crops and check water troughs.`,
        "frost_warning"
      ));
    }

    // High: Heavy rain
    if (isHeavyRain(current, forecast)) {
      const rainfall = getMaxRainfall(current, forecast);
      notifications.push(buildNotification(
        "High",
        "Heavy Rain Expected",
        `Rainfall of ${rainfall} mm is forecast. Delay spraying and check field drainage.`,
        "heavy_rain"
      ));
    }

    // High: Strong wind
    if (isStrongWind(current, forecast)) {
      const wind = getMaxWind(current, forecast);
      notifications.push(buildNotification(
        "High",
        "Strong Wind Advisory",
        `Wind speeds of ${wind} km/h expected. Avoid spraying and secure loose equipment.`,
        "strong_wind"
      ));
    }

    // Medium: High temperature
    if (isHighTemperature(current, forecast)) {
      const temp = getMaxTemp(current, forecast);
      notifications.push(buildNotification(
        "Medium",
        "High Temperature Alert",
        `Temperatures of ${temp}°C expected. Ensure livestock have adequate water and shade.`,
        "high_temp"
      ));
    }

    // Medium: Low temperature (not frost, but cold)
    if (isLowTemperature(current, forecast) && !isFrostRisk(current, forecast)) {
      const temp = getMinTemp(current, forecast);
      notifications.push(buildNotification(
        "Medium",
        "Cold Weather Expected",
        `Temperature expected to drop to ${temp}°C. Monitor young livestock and exposed crops.`,
        "low_temp"
      ));
    }

    // Low: Light/moderate rain expected
    if (!isHeavyRain(current, forecast) && isRainExpected(current, forecast)) {
      notifications.push(buildNotification(
        "Low",
        "Rain Expected",
        "Light to moderate rain is forecast within 24 hours. Plan outdoor work accordingly.",
        "rain_expected"
      ));
    }

    return notifications;
  } catch {
    return [];
  }
}

// =====================================================
// Detection Helpers
// =====================================================

/**
 * Checks if frost is expected (temperature ≤ FROST_TEMP).
 */
function isFrostRisk(current, forecast) {
  if (current.temperature != null && current.temperature <= FROST_TEMP) return true;
  const next24h = forecast.slice(0, 1);
  return next24h.some((day) => {
    const minTemp = day.temperatureMin ?? day.temperature ?? null;
    return minTemp != null && minTemp <= FROST_TEMP;
  });
}

/**
 * Checks if heavy rain is expected (≥ HEAVY_RAIN_MM).
 */
function isHeavyRain(current, forecast) {
  if (current.rainfall && current.rainfall >= HEAVY_RAIN_MM) return true;
  return forecast.some((day) => day.rainfall && day.rainfall >= HEAVY_RAIN_MM);
}

/**
 * Checks if strong wind is expected (≥ STRONG_WIND_KMH).
 */
function isStrongWind(current, forecast) {
  if (current.windSpeed && current.windSpeed >= STRONG_WIND_KMH) return true;
  return forecast.some((day) => day.windSpeed && day.windSpeed >= STRONG_WIND_KMH);
}

/**
 * Checks if high temperature is expected (≥ HIGH_TEMP).
 */
function isHighTemperature(current, forecast) {
  if (current.temperature != null && current.temperature >= HIGH_TEMP) return true;
  return forecast.some((day) => {
    const maxTemp = day.temperatureMax ?? day.temperature ?? null;
    return maxTemp != null && maxTemp >= HIGH_TEMP;
  });
}

/**
 * Checks if low temperature is expected (≤ LOW_TEMP but above frost).
 */
function isLowTemperature(current, forecast) {
  if (current.temperature != null && current.temperature <= LOW_TEMP) return true;
  return forecast.some((day) => {
    const minTemp = day.temperatureMin ?? day.temperature ?? null;
    return minTemp != null && minTemp <= LOW_TEMP;
  });
}

/**
 * Checks if any rain is expected (light, moderate, or heavy).
 */
function isRainExpected(current, forecast) {
  if (current.rainfall && current.rainfall > 0) return true;
  if (current.condition === "Rain" || current.condition === "Drizzle") return true;
  return forecast.some((day) =>
    (day.rainfall && day.rainfall > 0) ||
    day.condition === "Rain" ||
    day.condition === "Drizzle"
  );
}

// =====================================================
// Value Extractors
// =====================================================

function getMaxRainfall(current, forecast) {
  const values = [current.rainfall || 0, ...forecast.map((d) => d.rainfall || 0)];
  return Math.round(Math.max(...values));
}

function getMaxWind(current, forecast) {
  const values = [current.windSpeed || 0, ...forecast.map((d) => d.windSpeed || 0)];
  return Math.round(Math.max(...values));
}

function getMaxTemp(current, forecast) {
  const values = [
    current.temperature ?? -Infinity,
    ...forecast.map((d) => d.temperatureMax ?? d.temperature ?? -Infinity),
  ];
  return Math.round(Math.max(...values));
}

function getMinTemp(current, forecast) {
  const values = [
    current.temperature ?? Infinity,
    ...forecast.map((d) => d.temperatureMin ?? d.temperature ?? Infinity),
  ];
  return Math.round(Math.min(...values));
}

// =====================================================
// Builder
// =====================================================

/**
 * Builds a standardized notification object for weather events.
 * ID is deterministic (one per weather type) so dismissed/read state persists.
 */
function buildNotification(priority, title, message, type) {
  return {
    id: `weather-${type}`,
    type: `weather_${type}`,
    priority,
    title,
    message,
    module: "Weather",
    route: "/dashboard",
    read: false,
    createdAt: new Date().toISOString(),
  };
}
