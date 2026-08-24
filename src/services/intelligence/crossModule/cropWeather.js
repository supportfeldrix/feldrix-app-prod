/**
 * FarmHand PRO — Cross-Module Intelligence
 * Crop + Weather Provider
 *
 * Combines crop management data with weather forecasts to generate
 * harvest timing, frost protection, spraying, and irrigation recommendations.
 *
 * Expected data shape:
 * {
 *   crops: [],       // Array of crop objects with status, harvest_date, name/crop_name
 *   weather: {
 *     available: true,
 *     current: { temperature, windSpeed, rainfall, condition },
 *     forecast: [{ temperature, temperatureMin, temperatureMax, windSpeed, rainfall, condition }]
 *   }
 * }
 *
 * @param {object} data - Farm data context
 * @returns {Array} Array of insight objects
 */
export function generateCropWeatherInsights(data = {}) {
  try {
    const crops = Array.isArray(data.crops) ? data.crops : [];
    const weather = data.weather || null;

    if (!weather || !weather.available) return [];

    const activeCrops = getActiveCrops(crops);
    if (activeCrops.length === 0) return [];

    const current = weather.current || {};
    const forecast = Array.isArray(weather.forecast) ? weather.forecast : [];

    const insights = [];

    // Frost + active crops — Critical
    if (isFrostExpected(current, forecast)) {
      insights.push(buildFrostCropInsight(activeCrops));
    }

    // Heavy rain + irrigation/spraying — High
    if (isHeavyRainExpected(current, forecast)) {
      insights.push(buildRainIrrigationInsight(activeCrops));
    }

    // High winds + spraying — High
    if (isHighWindExpected(current, forecast)) {
      insights.push(buildWindSprayInsight(activeCrops));
    }

    // Extreme heat + growing crops — Medium
    if (isExtremeHeatExpected(current, forecast)) {
      insights.push(buildHeatCropInsight(activeCrops));
    }

    // Heavy rain + near-harvest crops — Medium
    const harvestSoon = getCropsNearHarvest(crops);
    if (harvestSoon.length > 0 && isHeavyRainExpected(current, forecast)) {
      insights.push(buildRainHarvestInsight(harvestSoon));
    }

    return insights;
  } catch {
    return [];
  }
}

// =====================================================
// Crop Helpers
// =====================================================

function getActiveCrops(crops) {
  return crops.filter(
    (c) => c.status === "Growing" || c.status === "Planted"
  );
}

function getCropsNearHarvest(crops) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDays = new Date(today);
  sevenDays.setDate(sevenDays.getDate() + 7);

  return crops.filter((crop) => {
    if (!crop.expected_harvest) return false;
    if (crop.status === "Harvested") return false;
    const harvestDate = new Date(crop.expected_harvest);
    harvestDate.setHours(0, 0, 0, 0);
    return harvestDate >= today && harvestDate <= sevenDays;
  });
}

function formatCropNames(crops, max = 3) {
  const names = crops
    .slice(0, max)
    .map((c) => c.name || c.crop_name || "Unnamed");
  const suffix = crops.length > max ? ` and ${crops.length - max} more` : "";
  return names.join(", ") + suffix;
}

// =====================================================
// Weather Detection Helpers
// =====================================================

function isFrostExpected(current, forecast) {
  if (current.temperature !== null && current.temperature !== undefined && current.temperature <= 2) {
    return true;
  }
  const next48h = forecast.slice(0, 2);
  return next48h.some((day) => {
    const minTemp = day.temperatureMin ?? day.temperature ?? null;
    return minTemp !== null && minTemp <= 2;
  });
}

function isHeavyRainExpected(current, forecast) {
  if (current.rainfall && current.rainfall > 20) return true;
  return forecast.some((day) => day.rainfall && day.rainfall > 20);
}

function isHighWindExpected(current, forecast) {
  if (current.windSpeed && current.windSpeed > 40) return true;
  return forecast.some((day) => day.windSpeed && day.windSpeed > 40);
}

function isExtremeHeatExpected(current, forecast) {
  if (current.temperature !== null && current.temperature !== undefined && current.temperature > 35) {
    return true;
  }
  return forecast.some((day) => {
    const maxTemp = day.temperatureMax ?? day.temperature ?? null;
    return maxTemp !== null && maxTemp > 35;
  });
}

// =====================================================
// Insight Builders
// =====================================================

function buildFrostCropInsight(activeCrops) {
  return {
    id: "cross-crop-frost",
    priority: "Critical",
    category: "Crops",
    title: "Frost Risk for Active Crops",
    description: `Frost is forecast within 48 hours while ${formatCropNames(activeCrops)} ${activeCrops.length === 1 ? "is" : "are"} actively growing. Apply frost protection measures immediately.`,
    action: "View crops",
    route: "/crops",
    source: "Crop + Weather",
  };
}

function buildRainIrrigationInsight(activeCrops) {
  return {
    id: "cross-crop-rain-irrigation",
    priority: "High",
    category: "Crops",
    title: "Heavy Rain — Skip Irrigation",
    description: `Heavy rainfall (>20 mm) is forecast. Suspend irrigation for ${formatCropNames(activeCrops)} to avoid waterlogging and reduce costs.`,
    action: "View planner",
    route: "/planner",
    source: "Crop + Weather",
  };
}

function buildWindSprayInsight(activeCrops) {
  return {
    id: "cross-crop-wind-spray",
    priority: "High",
    category: "Crops",
    title: "High Wind — Delay Spraying",
    description: `Winds exceeding 40 km/h are forecast. Postpone chemical spraying on ${formatCropNames(activeCrops)} to prevent drift and ensure efficacy.`,
    action: "View planner",
    route: "/planner",
    source: "Crop + Weather",
  };
}

function buildHeatCropInsight(activeCrops) {
  return {
    id: "cross-crop-heat",
    priority: "Medium",
    category: "Crops",
    title: "Extreme Heat — Crop Stress Risk",
    description: `Temperatures above 35°C are forecast while ${formatCropNames(activeCrops)} ${activeCrops.length === 1 ? "is" : "are"} growing. Consider additional irrigation and avoid mid-day fieldwork.`,
    action: "View crops",
    route: "/crops",
    source: "Crop + Weather",
  };
}

function buildRainHarvestInsight(harvestSoon) {
  return {
    id: "cross-crop-rain-harvest",
    priority: "Medium",
    category: "Crops",
    title: "Rain Before Harvest",
    description: `Heavy rainfall is expected while ${formatCropNames(harvestSoon)} ${harvestSoon.length === 1 ? "is" : "are"} due for harvest. Consider harvesting early to avoid quality loss.`,
    action: "Plan harvest",
    route: "/crops",
    source: "Crop + Weather",
  };
}
