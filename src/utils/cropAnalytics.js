/**
 * FarmHand PRO — Crop Analytics Engine
 * Sprint 43.0
 *
 * Generates crop health score and analytics from crop data.
 */

/**
 * Calculates crop health score and analytics.
 *
 * @param {object} params
 * @param {Array} params.crops - Crop records from Supabase
 * @param {object} params.weather - Optional weather data
 * @returns {object} Analytics object
 */
export function generateCropAnalytics({ crops = [], weather = null } = {}) {
  if (crops.length === 0) {
    return {
      available: false,
      score: 0,
      status: "No Crops",
      activeCrops: 0,
      harvestReady: 0,
      needsIrrigation: 0,
      totalArea: 0,
      upcomingHarvests: 0,
      insights: [],
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const twoWeeksFromNow = new Date(today);
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  // Basic counts
  const activeCrops = crops.filter(
    (c) => c.status === "Growing" || c.status === "Planted"
  );

  const harvestReady = activeCrops.filter((c) => {
    if (!c.expected_harvest) return false;
    const hd = new Date(c.expected_harvest);
    hd.setHours(0, 0, 0, 0);
    return hd <= weekFromNow;
  });

  const overdue = activeCrops.filter((c) => {
    if (!c.expected_harvest) return false;
    const hd = new Date(c.expected_harvest);
    hd.setHours(0, 0, 0, 0);
    return hd < today;
  });

  const upcomingHarvests = activeCrops.filter((c) => {
    if (!c.expected_harvest) return false;
    const hd = new Date(c.expected_harvest);
    hd.setHours(0, 0, 0, 0);
    return hd >= today && hd <= twoWeeksFromNow;
  });

  // Irrigation risk — based on weather conditions only.
  // The DB schema does not track irrigation_status or last_irrigated,
  // so we can only flag irrigation risk when weather data shows hot/dry conditions.
  const needsIrrigation = (() => {
    if (!weather || !weather.available) return [];
    const current = weather.current || {};
    const forecast = Array.isArray(weather.forecast) ? weather.forecast : [];

    const isHot = (current.temperature || 0) > 30;
    const noRainExpected = !forecast.some(
      (d) => d.condition === "Rain" || (d.rainfall && d.rainfall > 5)
    );
    const noCurrentRain = !(current.condition === "Rain" || (current.rainfall && current.rainfall > 5));

    if (isHot && noRainExpected && noCurrentRain && activeCrops.length > 0) {
      return activeCrops;
    }
    return [];
  })();

  const totalArea = crops.reduce(
    (sum, c) => sum + Number(c.area || 0), 0
  );

  const harvested = crops.filter((c) => c.status === "Harvested");

  // Calculate health score
  const score = calculateCropHealthScore({
    total: crops.length,
    active: activeCrops.length,
    harvestReady: harvestReady.length,
    overdue: overdue.length,
    needsIrrigation: needsIrrigation.length,
    weather,
  });

  // Generate insights
  const insights = generateInsights({
    activeCrops,
    harvestReady,
    overdue,
    needsIrrigation,
    weather,
    upcomingHarvests,
  });

  return {
    available: true,
    score,
    status: getStatus(score),
    activeCrops: activeCrops.length,
    harvestReady: harvestReady.length,
    needsIrrigation: needsIrrigation.length,
    totalArea,
    upcomingHarvests: upcomingHarvests.length,
    overdue: overdue.length,
    harvested: harvested.length,
    insights,
  };
}

function calculateCropHealthScore({ total, active, harvestReady, overdue, needsIrrigation, weather }) {
  if (total === 0) return 0;

  let score = 60;

  // Active crops being managed (+20)
  if (active > 0) score += 15;
  if (active >= 3) score += 5;

  // Harvest ready is positive (+5)
  if (harvestReady > 0) score += 5;

  // Overdue is negative (-10 per overdue, capped)
  score -= Math.min(overdue * 10, 25);

  // Irrigation issues (-8 per crop)
  score -= Math.min(needsIrrigation * 8, 20);

  // Weather risk
  if (weather && weather.available) {
    const forecast = weather.forecast || [];
    const hasStorm = forecast.some(
      (d) => d.condition === "Thunderstorm" || (d.rainfall && d.rainfall > 20)
    );
    if (hasStorm) score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getStatus(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

function generateInsights({ activeCrops, harvestReady, overdue, needsIrrigation, weather, upcomingHarvests }) {
  const insights = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedCrops = activeCrops.filter((c) => c.status === "Harvested" || c.status === "Completed");

  // ─── CRITICAL: Overdue Harvest ───
  if (overdue.length > 0) {
    const names = overdue.slice(0, 2).map((c) => c.crop_name || c.name || "Unnamed").join(", ");
    insights.push({
      message: `${overdue.length} crop${overdue.length === 1 ? "" : "s"} past harvest date. Harvest immediately to prevent quality degradation and yield loss.`,
      reason: `${names} ${overdue.length === 1 ? "has" : "have"} exceeded the expected harvest date.`,
      action: "Harvest now",
      severity: "high",
      type: "harvest_overdue",
      taskData: { title: `Harvest overdue crops: ${names}`, category: "Crops", priority: "High" },
    });
  }

  // ─── HIGH: Harvest Ready This Week ───
  if (harvestReady.length > 0 && overdue.length === 0) {
    const names = harvestReady.slice(0, 2).map((c) => c.crop_name || c.name || "Unnamed").join(", ");
    insights.push({
      message: `${harvestReady.length} crop${harvestReady.length === 1 ? " is" : "s are"} ready for harvest this week. Plan harvesting operations.`,
      reason: `Expected harvest date within the next 7 days for ${names}.`,
      action: "Schedule harvest",
      severity: "medium",
      type: "harvest_ready",
      taskData: { title: `Harvest: ${names}`, category: "Crops", priority: "High" },
    });
  }

  // ─── HIGH: Weather + Harvest Storm Risk ───
  if (weather && weather.available) {
    const forecast = weather.forecast || [];
    const current = weather.current || {};

    const stormDay = forecast.find(
      (d) => d.condition === "Thunderstorm" || (d.rainfall && d.rainfall > 20)
    );
    if (stormDay && harvestReady.length > 0) {
      insights.push({
        message: "Heavy weather forecast while crops are harvest-ready. Consider early harvesting to protect yield.",
        reason: "Storms or heavy rain expected which may damage mature crops.",
        action: "Harvest early",
        severity: "high",
        type: "weather_storm",
        taskData: { title: "Emergency harvest before storm", category: "Crops", priority: "High" },
      });
    }

    // ─── MEDIUM: Irrigation risk — hot/dry conditions ───
    const rainExpected = forecast.some(
      (d) => d.condition === "Rain" || (d.rainfall && d.rainfall > 5)
    );
    const tempHigh = (current.temperature || 0) > 30;

    if (needsIrrigation.length > 0 && !rainExpected) {
      insights.push({
        message: `${needsIrrigation.length} active crop${needsIrrigation.length === 1 ? "" : "s"} may need irrigation. High temperatures and no rain forecast — review irrigation schedule.`,
        reason: "High temperature and no rainfall expected in the coming days.",
        action: "Review irrigation",
        severity: "medium",
        type: "irrigation_needed",
        taskData: { title: "Review irrigation for active crops", category: "Crops", priority: "Medium" },
      });
    } else if (needsIrrigation.length > 0 && rainExpected) {
      insights.push({
        message: "Rain is expected soon — consider skipping irrigation to avoid waterlogging and save water.",
        reason: "Rainfall forecast will likely provide sufficient moisture.",
        action: "Skip irrigation",
        severity: "low",
        type: "weather_rain",
        taskData: null,
      });
    }

    // ─── MEDIUM: Strong winds — delay spraying ───
    const windSpeed = current.windSpeed || 0;
    if (windSpeed > 25) {
      insights.push({
        message: "Strong winds detected. Delay any chemical spraying to prevent drift and ensure application effectiveness.",
        reason: `Current wind speed is ${windSpeed} km/h. Recommended limit for spraying is 15-20 km/h.`,
        action: "Delay spraying",
        severity: "medium",
        type: "weather_wind",
        taskData: { title: "Reschedule spraying — high wind", category: "Crops", priority: "Medium" },
      });
    }

    // ─── MEDIUM: Heatwave — increase irrigation ───
    if (tempHigh && !rainExpected && needsIrrigation.length === 0) {
      insights.push({
        message: "High temperatures forecast. Increase irrigation frequency to prevent heat stress on growing crops.",
        reason: `Temperature is ${current.temperature}°C with no rain expected.`,
        action: "Increase irrigation",
        severity: "medium",
        type: "weather_heat",
        taskData: { title: "Increase irrigation — heatwave conditions", category: "Crops", priority: "Medium" },
      });
    }
  }

  // ─── MEDIUM: Flowering crops need inspection ───
  const floweringCrops = activeCrops.filter(
    (c) => c.growth_stage === "Flowering" || c.growth_stage === "flowering"
  );
  if (floweringCrops.length > 0) {
    const names = floweringCrops.slice(0, 2).map((c) => c.crop_name || c.name || "Unnamed").join(", ");
    insights.push({
      message: `${floweringCrops.length} crop${floweringCrops.length === 1 ? " is" : "s are"} flowering. Inspect for pollination success and pest damage.`,
      reason: "Flowering stage is critical for yield determination.",
      action: "Inspect crops",
      severity: "medium",
      type: "crop_inspection",
      taskData: { title: `Inspect flowering crops: ${names}`, category: "Crops", priority: "Medium" },
    });
  }

  // ─── LOW: Fertiliser reminder (30 days since planting) ───
  const needsFertiliser = activeCrops.filter((c) => {
    if (!c.planting_date) return false;
    const planted = new Date(c.planting_date);
    const daysSincePlanting = Math.floor((today - planted) / 86400000);
    return daysSincePlanting >= 28 && daysSincePlanting <= 35 && c.growth_stage !== "Harvest Ready";
  });
  if (needsFertiliser.length > 0) {
    insights.push({
      message: `${needsFertiliser.length} crop${needsFertiliser.length === 1 ? "" : "s"} planted ~30 days ago. Consider applying fertiliser for optimal growth.`,
      reason: "Most crops benefit from top-dressing 4-5 weeks after planting.",
      action: "Apply fertiliser",
      severity: "low",
      type: "fertiliser_reminder",
      taskData: { title: "Apply fertiliser to 30-day crops", category: "Crops", priority: "Low" },
    });
  }

  // ─── LOW: Empty fields / completed crops ───
  const completedFields = activeCrops.length === 0 && completedCrops.length > 0;
  // Check for harvested crops that could be replanted
  const harvestedRecently = (activeCrops.length === 0 && overdue.length === 0 && harvestReady.length === 0);
  if (harvestedRecently && upcomingHarvests.length === 0 && activeCrops.length === 0) {
    insights.push({
      message: "No active crops. Consider planning your next planting season to keep fields productive.",
      reason: "Idle fields generate no revenue and may develop weed issues.",
      action: "Plan planting",
      severity: "low",
      type: "empty_fields",
      taskData: { title: "Plan next crop rotation", category: "Crops", priority: "Low" },
    });
  }

  // ─── LOW: Upcoming harvests ───
  if (upcomingHarvests.length > 0 && overdue.length === 0 && harvestReady.length === 0) {
    insights.push({
      message: `${upcomingHarvests.length} harvest${upcomingHarvests.length === 1 ? "" : "s"} approaching in the next 2 weeks. Prepare equipment and storage.`,
      reason: "Planning ahead ensures smooth harvest operations.",
      action: "Prepare for harvest",
      severity: "low",
      type: "upcoming_harvest",
      taskData: { title: "Prepare harvest equipment and storage", category: "Crops", priority: "Low" },
    });
  }

  // ─── ALL GOOD ───
  if (activeCrops.length > 0 && insights.length === 0) {
    insights.push({
      message: "All crops are on track. No issues detected.",
      reason: "No weather risks, no overdue harvests, no irrigation issues.",
      action: null,
      severity: "low",
      type: "all_good",
      taskData: null,
    });
  }

  return insights;
}
