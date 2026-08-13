/**
 * Feldrix — Weather Provider Interface
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Defines the standard interface that all weather providers must implement.
 * Allows swapping between providers without changing the consuming code.
 *
 * Current Provider:
 *   - OpenWeatherMap (active)
 *
 * Future Providers (architecture ready):
 *   - South African Weather Service (SAWS)
 *   - WeatherAPI (weatherapi.com)
 *   - Tomorrow.io
 *   - Open-Meteo (free, no key required)
 *
 * Usage:
 *   import { getActiveProvider, registerProvider } from './weatherProviderInterface';
 *   const provider = getActiveProvider();
 *   const current = await provider.getCurrent(location);
 *
 * To add a new provider:
 *   1. Create a file implementing the WeatherProvider interface
 *   2. Register it with registerProvider()
 *   3. Set it as active with setActiveProvider()
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER INTERFACE — All providers must implement these methods
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {object} WeatherProvider
 * @property {string} id - Unique provider identifier (e.g. "openweathermap")
 * @property {string} name - Display name (e.g. "OpenWeatherMap")
 * @property {string} attribution - Attribution text (e.g. "Powered by OpenWeatherMap")
 * @property {boolean} active - Whether this provider is currently active
 * @property {boolean} available - Whether this provider is configured and reachable
 * @property {Function} getCurrent - Fetch current weather
 * @property {Function} getHourly - Fetch hourly forecast
 * @property {Function} getDaily - Fetch daily/7-day forecast
 * @property {Function} getAlerts - Fetch severe weather alerts
 * @property {Function} checkAvailability - Test if provider is reachable
 */

/**
 * Standard return format for getCurrent():
 * {
 *   temperature: number,
 *   feelsLike: number,
 *   condition: string,
 *   description: string,
 *   windSpeed: number (km/h),
 *   windDirection: string,
 *   windGust: number|null,
 *   humidity: number,
 *   rainfall: number (mm),
 *   pressure: number (hPa),
 *   visibility: number (km),
 *   uvIndex: number|null,
 *   dewPoint: number|null,
 *   cloudCover: number|null,
 *   icon: string (emoji),
 *   updatedAt: string (ISO),
 *   source: string,
 * }
 *
 * Standard return format for getHourly():
 * Array of {
 *   time: string (ISO),
 *   temperature: number,
 *   feelsLike: number,
 *   condition: string,
 *   icon: string,
 *   windSpeed: number,
 *   humidity: number,
 *   rainfall: number,
 *   pop: number (0-100),
 * }
 *
 * Standard return format for getDaily():
 * Array of {
 *   date: string (YYYY-MM-DD),
 *   temperatureMin: number,
 *   temperatureMax: number,
 *   condition: string,
 *   icon: string,
 *   windSpeed: number,
 *   humidity: number,
 *   rainfall: number,
 *   pop: number (0-100),
 * }
 *
 * Standard return format for getAlerts():
 * Array of {
 *   id: string,
 *   source: string,
 *   event: string,
 *   description: string,
 *   severity: string,
 *   start: string (ISO),
 *   end: string (ISO),
 * }
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

const providers = new Map();
let activeProviderId = "openweathermap";

/**
 * Register a weather provider.
 * @param {WeatherProvider} provider - Provider implementation
 */
export function registerProvider(provider) {
  if (!provider?.id) {
    console.error("[WeatherProvider] Cannot register provider without an id.");
    return;
  }
  providers.set(provider.id, provider);
}

/**
 * Get the currently active weather provider.
 * @returns {WeatherProvider|null}
 */
export function getActiveProvider() {
  return providers.get(activeProviderId) || null;
}

/**
 * Set the active weather provider by ID.
 * @param {string} providerId
 */
export function setActiveProvider(providerId) {
  if (!providers.has(providerId)) {
    console.warn(`[WeatherProvider] Provider "${providerId}" not registered.`);
    return false;
  }
  activeProviderId = providerId;
  return true;
}

/**
 * Get all registered providers.
 * @returns {Array<WeatherProvider>}
 */
export function getAllProviders() {
  return Array.from(providers.values());
}

/**
 * Get a provider by ID.
 * @param {string} id
 * @returns {WeatherProvider|null}
 */
export function getProvider(id) {
  return providers.get(id) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT PROVIDERS — Pre-registered
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * OpenWeatherMap Provider (currently active)
 * Implemented in weatherService.js — this is the registration entry.
 */
registerProvider({
  id: "openweathermap",
  name: "OpenWeatherMap",
  attribution: "Powered by OpenWeatherMap",
  active: true,
  available: true, // Assumes configured — weatherService handles unavailability gracefully
  capabilities: ["current", "hourly", "daily", "alerts", "geocoding"],
  // Methods delegated to weatherService.js (not duplicated here)
  getCurrent: null,
  getHourly: null,
  getDaily: null,
  getAlerts: null,
  checkAvailability: async () => {
    // Simple check — tries to access the API
    try {
      const key = import.meta.env.VITE_WEATHER_API_KEY;
      if (!key) return false;
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${key}`);
      return res.ok;
    } catch {
      return false;
    }
  },
});

/**
 * South African Weather Service (SAWS) — Future Provider
 * Architecture placeholder — will be connected when API access is granted.
 */
registerProvider({
  id: "saws",
  name: "South African Weather Service",
  attribution: "Powered by SAWS",
  active: false,
  available: false,
  capabilities: ["alerts", "warnings", "frost", "cold-fronts"],
  getCurrent: null,
  getHourly: null,
  getDaily: null,
  getAlerts: null,
  checkAvailability: async () => {
    const key = import.meta.env.VITE_SAWS_API_KEY;
    return !!key;
  },
});

/**
 * WeatherAPI.com — Future Provider
 */
registerProvider({
  id: "weatherapi",
  name: "WeatherAPI",
  attribution: "Powered by WeatherAPI.com",
  active: false,
  available: false,
  capabilities: ["current", "hourly", "daily", "alerts", "astronomy"],
  getCurrent: null,
  getHourly: null,
  getDaily: null,
  getAlerts: null,
  checkAvailability: async () => false,
});

/**
 * Tomorrow.io — Future Provider
 */
registerProvider({
  id: "tomorrow",
  name: "Tomorrow.io",
  attribution: "Powered by Tomorrow.io",
  active: false,
  available: false,
  capabilities: ["current", "hourly", "daily", "alerts", "air-quality"],
  getCurrent: null,
  getHourly: null,
  getDaily: null,
  getAlerts: null,
  checkAvailability: async () => false,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  registerProvider,
  getActiveProvider,
  setActiveProvider,
  getAllProviders,
  getProvider,
};
