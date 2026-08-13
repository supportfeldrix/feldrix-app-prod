/**
 * Feldrix — Weather Context
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Global weather state provider with:
 *   - Automatic refresh every hour
 *   - Refresh on Dashboard open
 *   - Refresh on location change
 *   - Intelligent caching (reduces API calls)
 *   - Offline support (last known forecast)
 *   - Weather Intelligence Engine integration
 *   - Push notification dispatch for critical alerts
 *
 * Usage:
 *   Wrap your app with <WeatherProvider>
 *   Access weather data with useWeather() hook
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { getWeatherForIntelligence, recordWeatherHistory, clearWeatherCache } from "../services/weatherService";
import {
  generateWeatherRisk,
  generateWeatherAlerts,
  generateWeatherRecommendations,
  generateWeatherBanner,
  generateWeatherInsight,
  generateChecklist,
  generateEarlyWarnings,
  generateWeatherNotifications,
} from "../services/weatherIntelligenceService";
import { initializePushNotifications, processWeatherAlerts } from "../services/pushNotificationService";
import { getCurrentUser, getProfile } from "../services/profileService";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // Don't refresh more than once every 5 minutes
const LOCATION_STORAGE_KEY = "feldrix_weather_location";

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const WeatherContext = createContext({
  // Raw weather data
  weather: null,
  loading: true,
  error: null,

  // Intelligence engine outputs
  risk: null,
  alerts: [],
  recommendations: null,
  banner: null,
  insight: "",
  checklists: [],
  earlyWarnings: [],
  notifications: [],

  // Location management
  location: "",
  setLocation: () => {},

  // Actions
  refresh: () => {},
  forceRefresh: () => {},
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate forecast confidence based on data freshness and provider availability.
 */
function calculateConfidence(weather) {
  if (!weather?.available) {
    return { level: "Low", reason: "Weather data unavailable" };
  }

  const updatedAt = weather.current?.updatedAt || weather.lastUpdated;
  if (!updatedAt) {
    return { level: "Medium", reason: "Update time unknown" };
  }

  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const ageMinutes = Math.round(ageMs / 60000);

  if (ageMinutes <= 30) {
    return { level: "High", reason: `Last updated ${ageMinutes} minutes ago` };
  }
  if (ageMinutes <= 90) {
    return { level: "Medium", reason: `Last updated ${ageMinutes} minutes ago` };
  }
  return { level: "Low", reason: `Data is ${Math.round(ageMinutes / 60)} hours old` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function WeatherProvider({ children }) {
  // State
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocationState] = useState(() => {
    try {
      return localStorage.getItem(LOCATION_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  // Intelligence outputs (derived from weather)
  const [risk, setRisk] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [banner, setBanner] = useState(null);
  const [insight, setInsight] = useState("");
  const [checklists, setChecklists] = useState([]);
  const [earlyWarnings, setEarlyWarnings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Refs for interval management
  const intervalRef = useRef(null);
  const lastRefreshRef = useRef(0);
  const userNameRef = useRef("");

  // Farm info (loaded from profile for display)
  const [farmName, setFarmName] = useState("");
  const [locationLoaded, setLocationLoaded] = useState(false);

  // Refresh status & metadata (BUG 3-4-5-6-7)
  const [refreshStatus, setRefreshStatus] = useState("idle"); // "idle" | "refreshing" | "success" | "offline" | "error"
  const [lastUpdated, setLastUpdated] = useState(null); // ISO timestamp
  const [nextRefresh, setNextRefresh] = useState(null); // ISO timestamp
  const [provider, setProvider] = useState("OpenWeatherMap"); // Current weather provider name
  const [isOffline, setIsOffline] = useState(false); // Using cached data
  const [confidence, setConfidence] = useState({ level: "High", reason: "" }); // Forecast confidence

  /**
   * Set weather location and persist to localStorage.
   * Triggers an immediate refresh.
   */
  const setLocation = useCallback((newLocation) => {
    setLocationState(newLocation || "");
    try {
      if (newLocation) {
        localStorage.setItem(LOCATION_STORAGE_KEY, newLocation);
      } else {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    } catch { /* unavailable */ }
    // Force refresh on location change
    lastRefreshRef.current = 0;
  }, []);

  /**
   * Set user name for personalized banner greetings.
   */
  const setUserName = useCallback((name) => {
    userNameRef.current = name || "";
  }, []);

  /**
   * Core refresh function — fetches weather and runs intelligence engine.
   * Respects minimum refresh interval to avoid API abuse.
   */
  const refresh = useCallback(async (force = false) => {
    const now = Date.now();

    // Throttle: don't refresh more than once every 5 minutes unless forced
    if (!force && now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRefreshStatus("refreshing");

      // Fetch complete weather data
      const weatherData = await getWeatherForIntelligence(location || undefined);
      setWeather(weatherData);

      // Record for history (PRO analytics)
      if (weatherData?.current?.updatedAt) {
        recordWeatherHistory(weatherData.current);
      }

      // Update metadata
      const updateTime = new Date().toISOString();
      setLastUpdated(updateTime);
      setNextRefresh(new Date(Date.now() + REFRESH_INTERVAL_MS).toISOString());
      setProvider(weatherData?.source === "openweathermap-onecall" ? "OpenWeatherMap (OneCall)" : weatherData?.source === "openweathermap" ? "OpenWeatherMap" : "OpenWeatherMap");

      // Determine if using cached/offline data
      if (weatherData?.available) {
        setIsOffline(false);
        setRefreshStatus("success");

        // Calculate forecast confidence
        setConfidence(calculateConfidence(weatherData));

        // Run Intelligence Engine
        const riskResult = generateWeatherRisk(weatherData);
        const alertsResult = generateWeatherAlerts(weatherData);
        const recsResult = generateWeatherRecommendations(weatherData);
        const bannerResult = generateWeatherBanner(weatherData, userNameRef.current);
        const insightResult = generateWeatherInsight(weatherData);
        const checklistResult = generateChecklist(weatherData);
        const warningsResult = generateEarlyWarnings(weatherData);
        const notifsResult = generateWeatherNotifications(weatherData);

        setRisk(riskResult);
        setAlerts(alertsResult);
        setRecommendations(recsResult);
        setBanner(bannerResult);
        setInsight(insightResult);
        setChecklists(checklistResult);
        setEarlyWarnings(warningsResult);
        setNotifications(notifsResult);

        // Dispatch push notifications for critical weather alerts
        processWeatherAlerts(notifsResult, { farmName });
      } else {
        // Using cached/offline data or truly unavailable
        setIsOffline(true);
        setRefreshStatus("offline");
        setConfidence({ level: "Low", reason: "Weather data unavailable" });

        // Clear intelligence when weather unavailable
        setRisk(null);
        setAlerts([]);
        setRecommendations(null);
        setBanner(null);
        setInsight("Weather data unavailable. Check your location settings.");
        setChecklists([]);
        setEarlyWarnings([]);
        setNotifications([]);
      }

      lastRefreshRef.current = now;

      // Auto-clear "success" status after 5 seconds
      setTimeout(() => setRefreshStatus((prev) => prev === "success" ? "idle" : prev), 5000);
    } catch (err) {
      console.error("[WeatherContext] Refresh failed:", err);
      setError(err.message || "Failed to load weather data");
      setRefreshStatus("error");
      setIsOffline(true);
      setConfidence({ level: "Low", reason: "Refresh failed — using cached forecast" });

      // Auto-clear error status after 8 seconds
      setTimeout(() => setRefreshStatus((prev) => prev === "error" ? "idle" : prev), 8000);
    } finally {
      setLoading(false);
    }
  }, [location]);

  /**
   * Force refresh — bypasses throttle.
   * Use when user explicitly requests a refresh or changes location.
   */
  const forceRefresh = useCallback(() => {
    lastRefreshRef.current = 0;
    return refresh(true);
  }, [refresh]);

  // ─── Initial load ───────────────────────────────────────────────────────────
  // Load profile weather_location FIRST, then fetch weather using that location.
  // This ensures all weather data uses the farmer's saved location (not a default).
  useEffect(() => {
    async function loadProfileAndRefresh() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getProfile().catch(() => null);
          const profileLocation = profile?.weather_location || "";
          const profileFarmName = profile?.farm_name || "";
          const profileUserName = profile?.full_name?.split(" ")[0]
            || user.user_metadata?.full_name?.split(" ")[0]
            || user.user_metadata?.name?.split(" ")[0]
            || "";

          if (profileLocation && profileLocation !== location) {
            setLocationState(profileLocation);
            try { localStorage.setItem(LOCATION_STORAGE_KEY, profileLocation); } catch {}
          }
          if (profileFarmName) setFarmName(profileFarmName);
          if (profileUserName) userNameRef.current = profileUserName;
        }
      } catch {
        // Non-blocking — will use cached location or empty
      }
      setLocationLoaded(true);
    }

    loadProfileAndRefresh();
    initializePushNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch weather once location is loaded from profile ─────────────────────
  useEffect(() => {
    if (locationLoaded) {
      refresh(true);
    }
  }, [locationLoaded, refresh]);

  // ─── Auto-refresh every hour ───────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh]);

  // ─── Refresh when location changes ─────────────────────────────────────────
  // ─── Refresh when location changes (user explicitly changes location) ───────
  useEffect(() => {
    if (locationLoaded && location !== undefined) {
      forceRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // ─── Refresh on tab visibility (when user returns to the app) ──────────────
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refresh(); // Throttled — won't fire if within 5min
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refresh]);

  // ─── Memoized context value ─────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      // Raw weather data
      weather,
      loading,
      error,

      // Intelligence engine outputs
      risk,
      alerts,
      recommendations,
      banner,
      insight,
      checklists,
      earlyWarnings,
      notifications,

      // Location & farm info
      location,
      farmName,
      setLocation,
      setUserName,

      // Status & metadata (BUG 3-4-5-6-7)
      refreshStatus,
      lastUpdated,
      nextRefresh,
      provider,
      isOffline,
      confidence,

      // Actions
      refresh,
      forceRefresh,
      clearCache: clearWeatherCache,
    }),
    [
      weather, loading, error,
      risk, alerts, recommendations, banner, insight, checklists, earlyWarnings, notifications,
      location, farmName, setLocation, setUserName,
      refreshStatus, lastUpdated, nextRefresh, provider, isOffline, confidence,
      refresh, forceRefresh,
    ]
  );

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Access the full weather context.
 * Provides weather data, intelligence outputs, and actions.
 *
 * @example
 * const { weather, risk, alerts, checklists, refresh } = useWeather();
 */
export function useWeather() {
  return useContext(WeatherContext);
}

/**
 * Access only the weather risk score.
 * Lightweight hook for components that only need the risk level.
 *
 * @example
 * const { level, color, emoji, factors } = useWeatherRisk();
 */
export function useWeatherRisk() {
  const { risk } = useContext(WeatherContext);
  return risk || { level: "LOW", color: "#22C55E", emoji: "\uD83D\uDFE2", label: "Low Risk", factors: [], summary: "" };
}

/**
 * Access weather alerts for notification integration.
 *
 * @example
 * const alerts = useWeatherAlerts();
 * // alerts = [{ id, type, priority, title, message, advice[], icon, color }]
 */
export function useWeatherAlerts() {
  const { alerts } = useContext(WeatherContext);
  return alerts || [];
}

/**
 * Access the dynamic hero banner content.
 *
 * @example
 * const { greeting, subtitle, priority, icon, action } = useWeatherBanner();
 */
export function useWeatherBanner() {
  const { banner } = useContext(WeatherContext);
  return banner || { greeting: "", subtitle: "", priority: "good", icon: null, action: null };
}

/**
 * Access weather checklists for the preparation UI.
 *
 * @example
 * const checklists = useWeatherChecklists();
 * // checklists = [{ id, title, icon, type, priority, items[] }]
 */
export function useWeatherChecklists() {
  const { checklists } = useContext(WeatherContext);
  return checklists || [];
}

/**
 * Access early warning countdown data.
 *
 * @example
 * const warnings = useEarlyWarnings();
 * // warnings = [{ id, alertType, title, stage, hoursUntil, countdown, recommendations }]
 */
export function useEarlyWarnings() {
  const { earlyWarnings } = useContext(WeatherContext);
  return earlyWarnings || [];
}

/**
 * Access weather notifications for the notification engine.
 *
 * @example
 * const weatherNotifs = useWeatherNotifications();
 */
export function useWeatherNotifications() {
  const { notifications } = useContext(WeatherContext);
  return notifications || [];
}
