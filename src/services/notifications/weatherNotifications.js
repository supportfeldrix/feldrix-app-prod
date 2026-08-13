/**
 * Feldrix — Weather Notification Provider
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Converts weather data into standardized notifications using the
 * Weather Intelligence Engine. Replaces basic threshold checks with
 * comprehensive farm-aware alerts including:
 *   - Freeze / Frost warnings
 *   - Heatwave alerts
 *   - Heavy rain / Flood warnings
 *   - Strong wind advisories
 *   - Storm / Lightning / Hail alerts
 *   - Early warning countdown notifications
 *   - Farm-specific action recommendations
 *
 * Integrates with notificationEngine.js — produces notification objects
 * that match the standard schema: { id, type, priority, title, message,
 * module, route, read, createdAt }
 *
 * @module weatherNotifications
 */

import {
  generateWeatherAlerts,
  generateWeatherRisk,
  generateEarlyWarnings,
  generateWeatherInsight,
  RISK_LEVELS,
} from "../weatherIntelligenceService";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — Called by notificationEngine.js
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generates weather notifications from the supplied farm data context.
 * Uses the Weather Intelligence Engine for comprehensive alert generation.
 *
 * @param {object} data - Farm data context
 * @param {object} data.weather - Weather data (from weatherService.getWeatherSummary)
 * @param {object} data.weather.current - Current conditions
 * @param {Array} data.weather.forecast - Forecast array
 * @param {Array} data.weather.hourly - Hourly forecast (new in v1.1)
 * @returns {Array} Array of notification objects sorted by priority
 */
export function getWeatherNotifications(data = {}) {
  try {
    const weather = data?.weather;

    if (!weather || !weather.available) {
      return [];
    }

    const notifications = [];

    // ─── Critical & High Priority Alerts ──────────────────────────────────────
    const alerts = generateWeatherAlerts(weather);

    for (const alert of alerts) {
      notifications.push({
        id: `weather-intel-${alert.type.toLowerCase()}`,
        type: `weather_${alert.type.toLowerCase()}`,
        priority: alert.priority,
        title: alert.title,
        message: alert.message,
        module: "Weather",
        route: "/weather#alerts",
        read: false,
        createdAt: new Date().toISOString(),
        // Extended fields for Weather Intelligence
        icon: alert.icon,
        color: alert.color,
        actionable: true,
        advice: alert.advice || [],
        alertType: alert.type,
        pushEligible: alert.priority === "Critical",
      });
    }

    // ─── Early Warning Countdown Notifications ────────────────────────────────
    const earlyWarnings = generateEarlyWarnings(weather);

    for (const warning of earlyWarnings) {
      // Only add countdown notification if no direct alert already exists for this type
      const hasDirectAlert = alerts.some((a) => a.type === warning.alertType);
      if (hasDirectAlert) continue;

      notifications.push({
        id: `weather-early-${warning.alertType.toLowerCase()}-${warning.stage.phase}`,
        type: `weather_early_warning_${warning.alertType.toLowerCase()}`,
        priority: warning.stage.phase === "immediate" ? "High" : "Medium",
        title: `${warning.icon} ${warning.title} — ${warning.countdown}`,
        message: warning.message,
        module: "Weather",
        route: "/weather",
        read: false,
        createdAt: new Date().toISOString(),
        // Extended fields
        icon: warning.icon,
        color: warning.color,
        actionable: true,
        advice: warning.recommendations || [],
        alertType: warning.alertType,
        earlyWarning: true,
        hoursUntil: warning.hoursUntil,
        stage: warning.stage,
        pushEligible: warning.stage.phase === "immediate",
      });
    }

    // ─── Weather Risk Level Notification ──────────────────────────────────────
    const risk = generateWeatherRisk(weather);

    if (risk.level === "EXTREME") {
      // Only add if not already covered by specific alerts
      if (alerts.length === 0) {
        notifications.push({
          id: "weather-risk-extreme",
          type: "weather_risk_extreme",
          priority: "Critical",
          title: "Extreme Weather Risk",
          message: risk.summary,
          module: "Weather",
          route: "/weather",
          read: false,
          createdAt: new Date().toISOString(),
          icon: RISK_LEVELS.EXTREME.emoji,
          color: RISK_LEVELS.EXTREME.color,
          actionable: true,
          pushEligible: true,
        });
      }
    } else if (risk.level === "HIGH") {
      if (alerts.length === 0) {
        notifications.push({
          id: "weather-risk-high",
          type: "weather_risk_high",
          priority: "High",
          title: "High Weather Risk",
          message: risk.summary,
          module: "Weather",
          route: "/weather",
          read: false,
          createdAt: new Date().toISOString(),
          icon: RISK_LEVELS.HIGH.emoji,
          color: RISK_LEVELS.HIGH.color,
          actionable: true,
          pushEligible: false,
        });
      }
    }

    // ─── Moderate Weather Info (Low priority) ─────────────────────────────────
    if (risk.level === "MODERATE" && alerts.length === 0) {
      const insight = generateWeatherInsight(weather);
      notifications.push({
        id: "weather-moderate-info",
        type: "weather_moderate",
        priority: "Low",
        title: "Weather Advisory",
        message: insight,
        module: "Weather",
        route: "/weather",
        read: false,
        createdAt: new Date().toISOString(),
        icon: RISK_LEVELS.MODERATE.emoji,
        color: RISK_LEVELS.MODERATE.color,
        actionable: false,
        pushEligible: false,
      });
    }

    // ─── Good Weather — Spray Window Opportunity (Info level) ─────────────────
    if (risk.level === "LOW" && isGoodSprayWindow(weather)) {
      notifications.push({
        id: "weather-spray-window",
        type: "weather_spray_window",
        priority: "Info",
        title: "Good Spray Conditions",
        message: "Low wind, no rain expected. Good window for chemical application today.",
        module: "Weather",
        route: "/weather",
        read: false,
        createdAt: new Date().toISOString(),
        icon: "\u2705",
        actionable: false,
        pushEligible: false,
      });
    }

    return notifications;
  } catch (err) {
    console.error("[WeatherNotifications] Generation failed:", err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if current conditions represent a good spray window.
 * Requirements: wind < 15 km/h, no rain, not during storm.
 */
function isGoodSprayWindow(weather) {
  const current = weather?.current;
  if (!current) return false;

  const wind = current.windSpeed ?? 0;
  const rain = current.rainfall ?? 0;
  const condition = (current.condition || "").toLowerCase();

  return (
    wind < 15 &&
    rain === 0 &&
    !condition.includes("rain") &&
    !condition.includes("storm") &&
    !condition.includes("thunder") &&
    !condition.includes("drizzle")
  );
}
