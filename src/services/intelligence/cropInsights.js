/**
 * FarmHand PRO — Intelligence Engine
 * Crop Insights Provider
 *
 * Generates actionable insights from crop management data.
 * Covers harvest timing, overdue harvests, and weather-related harvest alerts.
 *
 * Expected data shape:
 * {
 *   crops: [],       // Array of crop objects with expected_harvest, status, name/crop_name
 *   weather: {       // Optional weather summary
 *     available: true,
 *     current: { rainfall, condition },
 *     forecast: [{ rainfall, condition }]
 *   }
 * }
 *
 * @param {object} data - Farm data context
 * @returns {Array} Array of insight objects
 */
// USA-4: region-aware crop timing (US farms only; SA-safe no-op otherwise).
import { generateRegionalCropTimingInsights } from "../../utils/cropIntelligence";
// Soil analysis (US + SA): concise soil findings from the latest measured sample.
import { analyzeSoil, buildSoilInsights } from "../soilAnalysisService";

export function generateCropInsights(data = {}) {
  try {
    const crops = Array.isArray(data.crops) ? data.crops : [];
    const weather = data.weather || null;
    const farmContext = data.farmContext || null;

    const insights = [];

    // USA-4: region-aware seasonal-timing insights (US farms only). Additive and
    // graceful — returns [] for SA / unsupported crops / insufficient data, so
    // existing SA crop insights are completely unaffected.
    try {
      const regional = generateRegionalCropTimingInsights(crops, farmContext, weather);
      if (Array.isArray(regional)) insights.push(...regional);
    } catch { /* never break the provider */ }

    // Soil analysis findings (US + SA, one engine). Concise — at most 2 — so the
    // dashboard is never flooded, and NOT a duplicate of the full Soil Analysis
    // panel. Only runs when a measured sample is present; no fabrication.
    try {
      const sample = data.latestSoilSample || null;
      if (sample) {
        const analysis = analyzeSoil({
          sample,
          crop: sample.crops?.crop_name || null,
          farmCtx: farmContext,
        });
        insights.push(...buildSoilInsights(analysis));
      }
    } catch { /* never break the provider */ }

    const activeCrops = crops.filter(
      (c) => c.status === "Growing" || c.status === "Planted"
    );

    if (activeCrops.length === 0) {
      insights.push(buildNoCropsInsight());
      return insights;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = getOverdueHarvests(activeCrops, today);
    const dueSoon = getHarvestsDueSoon(activeCrops, today);

    // Overdue harvests — Critical
    if (overdue.length > 0) {
      insights.push(buildOverdueHarvestInsight(overdue));
    }

    // Harvests due within 7 days — High
    if (dueSoon.length > 0) {
      insights.push(buildHarvestSoonInsight(dueSoon));
    }

    // Weather + harvest alert — Medium
    const weatherAlert = evaluateWeatherHarvestRisk(dueSoon, weather);
    if (weatherAlert) {
      insights.push(weatherAlert);
    }

    return insights;
  } catch {
    return [];
  }
}

// =====================================================
// Helpers
// =====================================================

/**
 * Returns crops whose harvest_date is in the past.
 */
function getOverdueHarvests(crops, today) {
  return crops.filter((crop) => {
    if (!crop.expected_harvest) return false;
    const harvestDate = new Date(crop.expected_harvest);
    harvestDate.setHours(0, 0, 0, 0);
    return harvestDate < today;
  });
}

/**
 * Returns crops whose harvest_date is within the next 7 days.
 */
function getHarvestsDueSoon(crops, today) {
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  return crops.filter((crop) => {
    if (!crop.expected_harvest) return false;
    const harvestDate = new Date(crop.expected_harvest);
    harvestDate.setHours(0, 0, 0, 0);
    return harvestDate >= today && harvestDate <= weekFromNow;
  });
}

/**
 * Builds the overdue harvest insight.
 */
function buildOverdueHarvestInsight(overdue) {
  const count = overdue.length;
  const names = overdue
    .slice(0, 3)
    .map((c) => c.name || c.crop_name || "Unnamed")
    .join(", ");

  return {
    id: "crops-overdue-harvest",
    priority: "Critical",
    category: "Crops",
    title: `${count} Crop${count === 1 ? "" : "s"} Past Harvest Date`,
    description: `${names}${count > 3 ? ` and ${count - 3} more` : ""} should have been harvested already. Delayed harvesting can reduce yield quality.`,
    action: "Review crop schedule",
    route: "/crops",
    source: "Crops",
  };
}

/**
 * Builds the harvest-due-soon insight.
 */
function buildHarvestSoonInsight(dueSoon) {
  const count = dueSoon.length;
  const names = dueSoon
    .slice(0, 3)
    .map((c) => c.name || c.crop_name || "Unnamed")
    .join(", ");

  return {
    id: "crops-harvest-soon",
    priority: "High",
    category: "Crops",
    title: `${count} Crop${count === 1 ? "" : "s"} Ready for Harvest`,
    description: `${names}${count > 3 ? ` and ${count - 3} more` : ""} ${count === 1 ? "is" : "are"} expected to be harvested within the next 7 days.`,
    action: "Plan harvest",
    route: "/crops",
    source: "Crops",
  };
}

/**
 * Evaluates weather risk against upcoming harvests.
 * Returns an insight if rain is expected before harvest.
 */
function evaluateWeatherHarvestRisk(dueSoon, weather) {
  if (!weather || !weather.available) return null;
  if (dueSoon.length === 0) return null;

  const hasRain = isRainExpected(weather);
  if (!hasRain) return null;

  return {
    id: "crops-weather-harvest-risk",
    priority: "Medium",
    category: "Crops",
    title: "Rain Before Harvest",
    description: "Rainfall is forecast while crops are approaching harvest. Consider harvesting early or preparing storage to avoid weather damage.",
    action: "Check forecast",
    route: "/crops",
    source: "Crops",
  };
}

/**
 * Checks whether rain is expected from current or forecast data.
 */
function isRainExpected(weather) {
  const current = weather.current || {};
  const forecast = weather.forecast || [];

  if (current.condition === "Rain" || current.condition === "Thunderstorm") {
    return true;
  }

  if (current.rainfall && current.rainfall > 5) {
    return true;
  }

  return forecast.some(
    (day) => day.condition === "Rain" || day.condition === "Thunderstorm" || (day.rainfall && day.rainfall > 5)
  );
}

/**
 * Builds the informational insight when no active crops exist.
 */
function buildNoCropsInsight() {
  return {
    id: "crops-none-active",
    priority: "Low",
    category: "Crops",
    title: "No Active Crops",
    description: "No crops are currently being managed. Consider planning your next planting season.",
    action: "Add a crop",
    route: "/crops",
    source: "Crops",
  };
}
