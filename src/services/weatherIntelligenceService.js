/**
 * Feldrix — Weather Intelligence Engine
 * Version 1.1 Phase 1
 *
 * This is NOT a weather display service.
 * This engine transforms raw weather data into ACTIONABLE farm intelligence.
 *
 * The core question it answers:
 *   "What should I do BEFORE the weather affects my farm?"
 *
 * Functions:
 *   generateWeatherRisk()        — Farm Weather Risk Score (LOW/MODERATE/HIGH/EXTREME)
 *   generateWeatherAlerts()      — Severe weather alerts with priority levels
 *   generateWeatherRecommendations() — Combined recommendations for all farm areas
 *   generateWeatherNotifications()   — Push/notification-ready alert objects
 *   generateWeatherBanner()      — Hero banner contextual message
 *   generateWeatherInsight()     — Single-line weather intelligence summary
 *   generateLivestockAdvice()    — Livestock-specific preparation advice
 *   generateCropAdvice()         — Crop-specific weather recommendations
 *   generateMachineryAdvice()    — Machinery protection/operation advice
 *   generateChecklist()          — Actionable preparation checklist items
 *   generateEarlyWarnings()      — Countdown-based early warning system (72h/24h/6h/during/after)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// THRESHOLDS — South African farming conditions
// ═══════════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  // Temperature (Celsius)
  FREEZE: 0,
  FROST: 3,
  COLD: 5,
  HOT: 32,
  HEATWAVE: 35,
  EXTREME_HEAT: 40,

  // Wind (km/h)
  MODERATE_WIND: 25,
  STRONG_WIND: 40,
  DANGEROUS_WIND: 60,

  // Rain (mm)
  LIGHT_RAIN: 5,
  MODERATE_RAIN: 15,
  HEAVY_RAIN: 30,
  FLOOD_RISK: 50,

  // Humidity (%)
  HIGH_HUMIDITY: 80,
  DISEASE_RISK_HUMIDITY: 85,

  // UV Index
  HIGH_UV: 8,
  EXTREME_UV: 11,

  // Hail probability (%)
  HAIL_LIKELY: 50,

  // Lightning probability (%)
  LIGHTNING_LIKELY: 60,
};

// ═══════════════════════════════════════════════════════════════════════════════
// RISK LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

const RISK_LEVELS = {
  LOW: { level: "LOW", color: "#22C55E", emoji: "\uD83D\uDFE2", label: "Low Risk", score: 1 },
  MODERATE: { level: "MODERATE", color: "#EAB308", emoji: "\uD83D\uDFE1", label: "Moderate Risk", score: 2 },
  HIGH: { level: "HIGH", color: "#F97316", emoji: "\uD83D\uDFE0", label: "High Risk", score: 3 },
  EXTREME: { level: "EXTREME", color: "#EF4444", emoji: "\uD83D\uDD34", label: "Extreme Risk", score: 4 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EARLY WARNING STAGES
// ═══════════════════════════════════════════════════════════════════════════════

const WARNING_STAGES = {
  HOURS_72: { hours: 72, label: "72 Hours Before", phase: "monitor", urgency: "prepare" },
  HOURS_24: { hours: 24, label: "24 Hours Before", phase: "prepare", urgency: "action" },
  HOURS_6: { hours: 6, label: "6 Hours Before", phase: "immediate", urgency: "critical" },
  DURING: { hours: 0, label: "During Event", phase: "active", urgency: "shelter" },
  AFTER: { hours: -1, label: "After Event", phase: "recovery", urgency: "inspect" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate the Farm Weather Risk Score.
 *
 * Considers: Temperature, Feels Like, Freeze, Frost, Heat, Rain, Wind,
 *            Lightning, Storm, Flood, Hail, Humidity, UV
 *
 * @param {object} weather - Weather data from weatherService
 * @returns {object} { level, color, emoji, label, score, factors[], summary }
 */
export function generateWeatherRisk(weather) {
  if (!weather?.available || !weather.current) {
    return { ...RISK_LEVELS.LOW, factors: [], summary: "Weather data unavailable." };
  }

  const current = weather.current;
  const forecast = weather.forecast || [];
  const hourly = weather.hourly || [];

  const factors = [];
  let maxScore = 0;

  // --- Temperature Risks ---
  const minTemp = getMinTemperature(current, forecast, hourly);
  const maxTemp = getMaxTemperature(current, forecast, hourly);

  if (minTemp <= THRESHOLDS.FREEZE) {
    factors.push({ type: "freeze", severity: "extreme", message: `Freezing: ${minTemp}\u00B0C expected`, score: 4 });
    maxScore = Math.max(maxScore, 4);
  } else if (minTemp <= THRESHOLDS.FROST) {
    factors.push({ type: "frost", severity: "high", message: `Frost risk: ${minTemp}\u00B0C expected`, score: 3 });
    maxScore = Math.max(maxScore, 3);
  } else if (minTemp <= THRESHOLDS.COLD) {
    factors.push({ type: "cold", severity: "moderate", message: `Cold: ${minTemp}\u00B0C expected`, score: 2 });
    maxScore = Math.max(maxScore, 2);
  }

  if (maxTemp >= THRESHOLDS.EXTREME_HEAT) {
    factors.push({ type: "extreme_heat", severity: "extreme", message: `Extreme heat: ${maxTemp}\u00B0C`, score: 4 });
    maxScore = Math.max(maxScore, 4);
  } else if (maxTemp >= THRESHOLDS.HEATWAVE) {
    factors.push({ type: "heatwave", severity: "high", message: `Heatwave: ${maxTemp}\u00B0C`, score: 3 });
    maxScore = Math.max(maxScore, 3);
  } else if (maxTemp >= THRESHOLDS.HOT) {
    factors.push({ type: "hot", severity: "moderate", message: `Hot conditions: ${maxTemp}\u00B0C`, score: 2 });
    maxScore = Math.max(maxScore, 2);
  }

  // --- Wind Risks ---
  const maxWind = getMaxWind(current, forecast, hourly);

  if (maxWind >= THRESHOLDS.DANGEROUS_WIND) {
    factors.push({ type: "dangerous_wind", severity: "extreme", message: `Dangerous wind: ${maxWind} km/h`, score: 4 });
    maxScore = Math.max(maxScore, 4);
  } else if (maxWind >= THRESHOLDS.STRONG_WIND) {
    factors.push({ type: "strong_wind", severity: "high", message: `Strong wind: ${maxWind} km/h`, score: 3 });
    maxScore = Math.max(maxScore, 3);
  } else if (maxWind >= THRESHOLDS.MODERATE_WIND) {
    factors.push({ type: "moderate_wind", severity: "moderate", message: `Moderate wind: ${maxWind} km/h`, score: 2 });
    maxScore = Math.max(maxScore, 2);
  }

  // --- Rain Risks ---
  const maxRain = getMaxRainfall(current, forecast, hourly);

  if (maxRain >= THRESHOLDS.FLOOD_RISK) {
    factors.push({ type: "flood", severity: "extreme", message: `Flood risk: ${maxRain} mm`, score: 4 });
    maxScore = Math.max(maxScore, 4);
  } else if (maxRain >= THRESHOLDS.HEAVY_RAIN) {
    factors.push({ type: "heavy_rain", severity: "high", message: `Heavy rain: ${maxRain} mm`, score: 3 });
    maxScore = Math.max(maxScore, 3);
  } else if (maxRain >= THRESHOLDS.MODERATE_RAIN) {
    factors.push({ type: "moderate_rain", severity: "moderate", message: `Moderate rain: ${maxRain} mm`, score: 2 });
    maxScore = Math.max(maxScore, 2);
  }

  // --- Storm/Lightning ---
  const hasStorm = detectStorm(current, forecast, hourly);
  if (hasStorm) {
    factors.push({ type: "storm", severity: "high", message: "Thunderstorm expected", score: 3 });
    maxScore = Math.max(maxScore, 3);
  }

  const hasLightning = detectLightning(current, forecast, hourly);
  if (hasLightning && !hasStorm) {
    factors.push({ type: "lightning", severity: "high", message: "Lightning risk", score: 3 });
    maxScore = Math.max(maxScore, 3);
  }

  // --- Hail ---
  const hasHail = detectHail(current, forecast, hourly);
  if (hasHail) {
    factors.push({ type: "hail", severity: "extreme", message: "Hail expected", score: 4 });
    maxScore = Math.max(maxScore, 4);
  }

  // --- Humidity / Disease Pressure ---
  const maxHumidity = getMaxHumidity(current, forecast, hourly);
  if (maxHumidity >= THRESHOLDS.DISEASE_RISK_HUMIDITY && maxTemp > 20) {
    factors.push({ type: "disease_pressure", severity: "moderate", message: `High humidity: ${maxHumidity}%`, score: 2 });
    maxScore = Math.max(maxScore, 2);
  }

  // --- UV ---
  const uv = current.uv ?? current.uvIndex ?? null;
  if (uv && uv >= THRESHOLDS.EXTREME_UV) {
    factors.push({ type: "extreme_uv", severity: "high", message: `Extreme UV: ${uv}`, score: 3 });
    maxScore = Math.max(maxScore, 3);
  } else if (uv && uv >= THRESHOLDS.HIGH_UV) {
    factors.push({ type: "high_uv", severity: "moderate", message: `High UV: ${uv}`, score: 2 });
    maxScore = Math.max(maxScore, 2);
  }

  // Determine final risk level
  let riskLevel;
  if (maxScore >= 4) riskLevel = RISK_LEVELS.EXTREME;
  else if (maxScore >= 3) riskLevel = RISK_LEVELS.HIGH;
  else if (maxScore >= 2) riskLevel = RISK_LEVELS.MODERATE;
  else riskLevel = RISK_LEVELS.LOW;

  // Generate summary
  const summary = factors.length > 0
    ? factors.sort((a, b) => b.score - a.score).slice(0, 2).map((f) => f.message).join(". ") + "."
    : "No significant weather risks detected. Normal farm operations can continue.";

  return {
    ...riskLevel,
    factors,
    summary,
    maxScore,
    assessedAt: new Date().toISOString(),
  };
}

/**
 * Generate severe weather alerts for notification/display.
 *
 * @param {object} weather - Weather data from weatherService
 * @returns {Array} Array of alert objects: { id, type, priority, title, message, advice[], icon, color, expiresAt }
 */
export function generateWeatherAlerts(weather) {
  if (!weather?.available || !weather.current) return [];

  const current = weather.current;
  const forecast = weather.forecast || [];
  const hourly = weather.hourly || [];
  const alerts = [];

  const minTemp = getMinTemperature(current, forecast, hourly);
  const maxTemp = getMaxTemperature(current, forecast, hourly);
  const maxWind = getMaxWind(current, forecast, hourly);
  const maxRain = getMaxRainfall(current, forecast, hourly);

  // FREEZE ALERT
  if (minTemp <= THRESHOLDS.FREEZE) {
    alerts.push({
      id: "alert-freeze",
      type: "FREEZE",
      priority: "Critical",
      title: "Freeze Warning",
      message: `Temperature expected to drop to ${minTemp}\u00B0C. Protect livestock and crops immediately.`,
      icon: "\u2744\uFE0F",
      color: "#3B82F6",
      advice: [
        "Move calves and lambs indoors",
        "Increase bedding in shelters",
        "Increase evening feed",
        "Protect water supplies from freezing",
        "Protect newborn animals",
        "Cover sensitive seedlings",
      ],
      details: {
        expectedMin: minTemp,
        duration: estimateColdDuration(forecast, hourly, THRESHOLDS.FREEZE),
        riskLevel: "EXTREME",
      },
    });
  }

  // FROST ALERT
  if (minTemp > THRESHOLDS.FREEZE && minTemp <= THRESHOLDS.FROST) {
    alerts.push({
      id: "alert-frost",
      type: "FROST",
      priority: "High",
      title: "Frost Advisory",
      message: `Temperature expected to drop to ${minTemp}\u00B0C. Frost damage risk for crops.`,
      icon: "\uD83C\uDF28\uFE0F",
      color: "#60A5FA",
      advice: [
        "Protect seedlings and young plants",
        "Delay irrigation until after sunrise",
        "Inspect crops after sunrise for frost damage",
        "Monitor young livestock",
      ],
      details: {
        expectedMin: minTemp,
        duration: estimateColdDuration(forecast, hourly, THRESHOLDS.FROST),
        riskLevel: "HIGH",
      },
    });
  }

  // HEATWAVE ALERT
  if (maxTemp >= THRESHOLDS.HEATWAVE) {
    alerts.push({
      id: "alert-heatwave",
      type: "HEATWAVE",
      priority: maxTemp >= THRESHOLDS.EXTREME_HEAT ? "Critical" : "High",
      title: maxTemp >= THRESHOLDS.EXTREME_HEAT ? "Extreme Heat Warning" : "Heatwave Warning",
      message: `Temperature expected to reach ${maxTemp}\u00B0C. Heat stress risk for livestock.`,
      icon: "\uD83D\uDD25",
      color: "#EF4444",
      advice: [
        "Increase water supply for all livestock",
        "Provide additional shade structures",
        "Avoid transporting livestock during peak heat",
        "Reduce afternoon outdoor work",
        "Monitor animals for heat stress signs",
        "Consider early morning or evening feeding",
      ],
      details: {
        expectedMax: maxTemp,
        riskLevel: maxTemp >= THRESHOLDS.EXTREME_HEAT ? "EXTREME" : "HIGH",
      },
    });
  }

  // HEAVY RAIN / FLOOD ALERT
  if (maxRain >= THRESHOLDS.HEAVY_RAIN) {
    const isFlood = maxRain >= THRESHOLDS.FLOOD_RISK;
    alerts.push({
      id: isFlood ? "alert-flood" : "alert-heavy-rain",
      type: isFlood ? "FLOOD" : "HEAVY_RAIN",
      priority: isFlood ? "Critical" : "High",
      title: isFlood ? "Flood Warning" : "Heavy Rain Warning",
      message: `${maxRain} mm of rainfall expected. ${isFlood ? "Flooding possible in low-lying areas." : "Delay field operations."}`,
      icon: isFlood ? "\uD83C\uDF0A" : "\uD83C\uDF27\uFE0F",
      color: isFlood ? "#7C3AED" : "#3B82F6",
      advice: isFlood
        ? [
          "Move livestock from low-lying areas",
          "Secure all loose equipment",
          "Protect stored feed and supplies",
          "Inspect drainage systems",
          "Avoid crossing flooded areas",
          "Prepare emergency feed reserves",
        ]
        : [
          "Delay planting operations",
          "Delay fertilizer application",
          "Protect stored feed from moisture",
          "Inspect drainage channels",
          "Move exposed machinery under cover",
        ],
      details: {
        expectedRainfall: maxRain,
        riskLevel: isFlood ? "EXTREME" : "HIGH",
      },
    });
  }

  // STRONG WIND ALERT
  if (maxWind >= THRESHOLDS.STRONG_WIND) {
    const isDangerous = maxWind >= THRESHOLDS.DANGEROUS_WIND;
    alerts.push({
      id: "alert-wind",
      type: "HIGH_WIND",
      priority: isDangerous ? "Critical" : "High",
      title: isDangerous ? "Dangerous Wind Warning" : "Strong Wind Advisory",
      message: `Wind speeds of ${maxWind} km/h expected. ${isDangerous ? "Avoid all outdoor operations." : "Postpone spraying."}`,
      icon: "\uD83D\uDCA8",
      color: "#6B7280",
      advice: isDangerous
        ? [
          "Avoid all outdoor field operations",
          "Secure all loose structures and equipment",
          "Ensure irrigation pipes are anchored",
          "Keep livestock in sheltered areas",
          "Do not operate machinery near trees",
        ]
        : [
          "Delay all spraying operations",
          "Secure irrigation systems",
          "Secure loose equipment and structures",
          "Monitor roofing on shelters",
        ],
      details: {
        expectedWind: maxWind,
        riskLevel: isDangerous ? "EXTREME" : "HIGH",
      },
    });
  }

  // STORM ALERT
  if (detectStorm(current, forecast, hourly)) {
    alerts.push({
      id: "alert-storm",
      type: "STORM",
      priority: "High",
      title: "Thunderstorm Warning",
      message: "Thunderstorm activity expected. Lightning and strong gusts possible.",
      icon: "\u26C8\uFE0F",
      color: "#7C3AED",
      advice: [
        "Avoid open fields during storm",
        "Delay livestock movement",
        "Avoid operating machinery",
        "Ensure surge protection on equipment",
        "Secure loose structures",
      ],
      details: { riskLevel: "HIGH" },
    });
  }

  // LIGHTNING ALERT (standalone, without full storm)
  if (detectLightning(current, forecast, hourly) && !detectStorm(current, forecast, hourly)) {
    alerts.push({
      id: "alert-lightning",
      type: "LIGHTNING",
      priority: "High",
      title: "Lightning Risk",
      message: "Elevated lightning risk. Avoid open fields and tall structures.",
      icon: "\u26A1",
      color: "#F59E0B",
      advice: [
        "Avoid open fields",
        "Delay livestock movement",
        "Do not operate tall machinery",
        "Stay away from isolated trees",
      ],
      details: { riskLevel: "HIGH" },
    });
  }

  // HAIL ALERT
  if (detectHail(current, forecast, hourly)) {
    alerts.push({
      id: "alert-hail",
      type: "HAIL",
      priority: "Critical",
      title: "Hail Warning",
      message: "Hail expected. Protect vehicles, machinery, and vulnerable crops immediately.",
      icon: "\uD83E\uDDCA",
      color: "#64748B",
      advice: [
        "Move all machinery and vehicles under cover",
        "Protect vulnerable crops with netting if available",
        "Delay all outdoor work",
        "Keep livestock in sheltered areas",
        "Inspect property for damage after event",
      ],
      details: { riskLevel: "EXTREME" },
    });
  }

  return alerts.sort((a, b) => {
    const priorityMap = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (priorityMap[a.priority] ?? 4) - (priorityMap[b.priority] ?? 4);
  });
}

/**
 * Generate combined weather recommendations for all farm operations.
 *
 * @param {object} weather - Weather data
 * @returns {object} { livestock[], crops[], machinery[], general[], priority }
 */
export function generateWeatherRecommendations(weather) {
  const livestock = generateLivestockAdvice(weather);
  const crops = generateCropAdvice(weather);
  const machinery = generateMachineryAdvice(weather);
  const general = generateGeneralAdvice(weather);

  // Determine overall priority
  const all = [...livestock, ...crops, ...machinery, ...general];
  let priority = "normal";
  if (all.some((a) => a.urgency === "critical")) priority = "critical";
  else if (all.some((a) => a.urgency === "high")) priority = "high";
  else if (all.some((a) => a.urgency === "moderate")) priority = "moderate";

  return {
    livestock,
    crops,
    machinery,
    general,
    priority,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate notification-ready objects for the Notification Centre and Push.
 *
 * @param {object} weather - Weather data
 * @returns {Array} Notification objects compatible with notificationEngine
 */
export function generateWeatherNotifications(weather) {
  const alerts = generateWeatherAlerts(weather);

  return alerts.map((alert) => ({
    id: `weather-intel-${alert.type.toLowerCase()}`,
    type: `weather_${alert.type.toLowerCase()}`,
    priority: alert.priority,
    title: alert.title,
    message: alert.message,
    module: "Weather",
    route: "/weather",
    read: false,
    createdAt: new Date().toISOString(),
    icon: alert.icon,
    actionable: true,
    advice: alert.advice,
    pushEligible: alert.priority === "Critical",
  }));
}

/**
 * Generate dynamic Hero Banner message based on weather intelligence.
 *
 * @param {object} weather - Weather data
 * @param {string} userName - Farmer's name
 * @returns {object} { greeting, subtitle, priority, icon, action }
 */
export function generateWeatherBanner(weather, userName = "") {
  const name = userName ? `, ${userName}` : "";
  const timeGreeting = getTimeGreeting();

  if (!weather?.available) {
    return {
      greeting: `${timeGreeting}${name}`,
      subtitle: "Your farm is looking great today.",
      priority: "good",
      icon: null,
      action: null,
    };
  }

  const alerts = generateWeatherAlerts(weather);
  const risk = generateWeatherRisk(weather);

  // Critical alerts take priority
  if (alerts.length > 0 && alerts[0].priority === "Critical") {
    const alert = alerts[0];
    return {
      greeting: alert.title,
      subtitle: getBannerSubtitle(alert),
      priority: "critical",
      icon: alert.icon,
      action: getBannerAction(alert),
    };
  }

  // High-priority alerts
  if (alerts.length > 0 && alerts[0].priority === "High") {
    const alert = alerts[0];
    return {
      greeting: alert.title,
      subtitle: getBannerSubtitle(alert),
      priority: "warning",
      icon: alert.icon,
      action: getBannerAction(alert),
    };
  }

  // Weather-aware positive messages
  const current = weather.current;
  const condition = (current?.condition || "").toLowerCase();

  if (condition.includes("clear") || condition.includes("sunny")) {
    return {
      greeting: `${timeGreeting}${name}`,
      subtitle: "Excellent conditions for outdoor farm operations.",
      priority: "good",
      icon: "\u2600\uFE0F",
      action: null,
    };
  }

  if (condition.includes("cloud") && risk.level === "LOW") {
    return {
      greeting: `${timeGreeting}${name}`,
      subtitle: "Overcast but stable. Good day for field work.",
      priority: "good",
      icon: "\u2601\uFE0F",
      action: null,
    };
  }

  if (condition.includes("rain") && risk.level === "MODERATE") {
    return {
      greeting: "Rain Today",
      subtitle: "Delay spraying and fertilizer application. Indoor operations recommended.",
      priority: "warning",
      icon: "\uD83C\uDF27\uFE0F",
      action: "Plan indoor tasks",
    };
  }

  // Default: Use risk assessment
  if (risk.level === "MODERATE") {
    return {
      greeting: `${timeGreeting}${name}`,
      subtitle: risk.summary,
      priority: "warning",
      icon: "\u26A0\uFE0F",
      action: "Review weather",
    };
  }

  return {
    greeting: `${timeGreeting}${name}`,
    subtitle: "No severe weather expected. Normal operations can continue.",
    priority: "good",
    icon: null,
    action: null,
  };
}

/**
 * Generate a single-line weather intelligence summary.
 *
 * @param {object} weather - Weather data
 * @returns {string} One-line farm-relevant insight
 */
export function generateWeatherInsight(weather) {
  if (!weather?.available || !weather.current) {
    return "Weather data unavailable. Check your location settings.";
  }

  const alerts = generateWeatherAlerts(weather);

  if (alerts.length > 0) {
    const top = alerts[0];
    switch (top.type) {
      case "FREEZE": return `Freeze warning: ${top.details.expectedMin}\u00B0C expected. Protect livestock and crops.`;
      case "FROST": return `Frost risk tonight: ${top.details.expectedMin}\u00B0C. Protect seedlings.`;
      case "HEATWAVE": return `Heatwave: ${top.details.expectedMax}\u00B0C expected. Ensure livestock have water and shade.`;
      case "HEAVY_RAIN": return `Heavy rain: ${top.details.expectedRainfall}mm expected. Delay field work.`;
      case "FLOOD": return `Flood risk: ${top.details.expectedRainfall}mm. Move livestock from low areas.`;
      case "HIGH_WIND": return `Strong wind: ${top.details.expectedWind} km/h. Postpone spraying.`;
      case "STORM": return "Thunderstorm expected. Avoid open fields and delay operations.";
      case "LIGHTNING": return "Lightning risk. Keep workers and livestock away from open areas.";
      case "HAIL": return "Hail expected. Move machinery under cover immediately.";
      default: return top.message;
    }
  }

  const current = weather.current;
  const condition = (current.condition || "").toLowerCase();
  const temp = current.temperature;

  if (condition.includes("clear") || condition.includes("sunny")) {
    if (temp > 28) return "Clear and warm. Good for drying hay, ensure animals have water.";
    return "Clear skies. Ideal conditions for all outdoor farm operations.";
  }

  if (condition.includes("cloud")) {
    return "Overcast conditions. Good for transplanting and outdoor work without heat stress.";
  }

  if (condition.includes("rain")) {
    return "Wet conditions. Avoid spraying and delay fieldwork where possible.";
  }

  return "No severe weather expected. Normal farm operations can continue.";
}

/**
 * Generate livestock-specific weather advice.
 *
 * @param {object} weather - Weather data
 * @returns {Array} Array of { message, urgency, animalType, icon }
 */
export function generateLivestockAdvice(weather) {
  if (!weather?.available || !weather.current) return [];

  const current = weather.current;
  const forecast = weather.forecast || [];
  const hourly = weather.hourly || [];
  const advice = [];

  const minTemp = getMinTemperature(current, forecast, hourly);
  const maxTemp = getMaxTemperature(current, forecast, hourly);
  const maxWind = getMaxWind(current, forecast, hourly);
  const maxRain = getMaxRainfall(current, forecast, hourly);

  // FREEZE / FROST
  if (minTemp <= THRESHOLDS.FREEZE) {
    advice.push({ message: "Move newborn calves and lambs to sheltered areas", urgency: "critical", animalType: "young", icon: "\uD83D\uDC04" });
    advice.push({ message: "Increase bedding in all livestock shelters", urgency: "critical", animalType: "all", icon: "\uD83D\uDECF\uFE0F" });
    advice.push({ message: "Provide extra evening feed — animals burn more energy in cold", urgency: "high", animalType: "all", icon: "\uD83C\uDF3E" });
    advice.push({ message: "Check and protect water troughs from freezing", urgency: "high", animalType: "all", icon: "\uD83D\uDCA7" });
    advice.push({ message: "Monitor pregnant animals closely", urgency: "critical", animalType: "pregnant", icon: "\uD83E\uDE7A" });
  } else if (minTemp <= THRESHOLDS.FROST) {
    advice.push({ message: "Provide extra bedding for young animals", urgency: "high", animalType: "young", icon: "\uD83D\uDC04" });
    advice.push({ message: "Monitor calves and lambs for cold stress", urgency: "high", animalType: "young", icon: "\uD83D\uDC41\uFE0F" });
    advice.push({ message: "Ensure water supply remains accessible", urgency: "moderate", animalType: "all", icon: "\uD83D\uDCA7" });
  }

  // HEATWAVE
  if (maxTemp >= THRESHOLDS.HEATWAVE) {
    advice.push({ message: "Increase water supply — animals drink 50-100% more in extreme heat", urgency: "critical", animalType: "all", icon: "\uD83D\uDCA7" });
    advice.push({ message: "Provide additional shade structures", urgency: "critical", animalType: "all", icon: "\u26F1\uFE0F" });
    advice.push({ message: "Avoid transporting livestock during peak heat (10:00-16:00)", urgency: "critical", animalType: "all", icon: "\uD83D\uDE9A" });
    advice.push({ message: "Watch for heat stress: panting, drooling, reluctance to move", urgency: "high", animalType: "all", icon: "\u26A0\uFE0F" });
    advice.push({ message: "Consider night feeding to reduce daytime heat generation", urgency: "moderate", animalType: "all", icon: "\uD83C\uDF19" });
  } else if (maxTemp >= THRESHOLDS.HOT) {
    advice.push({ message: "Ensure adequate water availability for all livestock", urgency: "high", animalType: "all", icon: "\uD83D\uDCA7" });
    advice.push({ message: "Check shade structures are accessible", urgency: "moderate", animalType: "all", icon: "\u26F1\uFE0F" });
  }

  // STRONG WIND
  if (maxWind >= THRESHOLDS.STRONG_WIND) {
    advice.push({ message: "Keep livestock away from fences and loose structures", urgency: "high", animalType: "all", icon: "\uD83D\uDCA8" });
    advice.push({ message: "Delay any livestock transportation", urgency: "high", animalType: "all", icon: "\uD83D\uDE9A" });
  }

  // HEAVY RAIN / FLOOD
  if (maxRain >= THRESHOLDS.FLOOD_RISK) {
    advice.push({ message: "Move livestock from low-lying paddocks immediately", urgency: "critical", animalType: "all", icon: "\uD83C\uDF0A" });
    advice.push({ message: "Ensure high-ground shelters are accessible", urgency: "critical", animalType: "all", icon: "\uD83C\uDFD4\uFE0F" });
  } else if (maxRain >= THRESHOLDS.HEAVY_RAIN) {
    advice.push({ message: "Provide shelter access for all livestock", urgency: "high", animalType: "all", icon: "\uD83C\uDFE0" });
    advice.push({ message: "Monitor for hoof problems in wet conditions", urgency: "moderate", animalType: "all", icon: "\uD83D\uDC3E" });
  }

  // STORM / LIGHTNING
  if (detectStorm(current, forecast, hourly) || detectLightning(current, forecast, hourly)) {
    advice.push({ message: "Keep livestock away from open fields and hilltops", urgency: "critical", animalType: "all", icon: "\u26A1" });
    advice.push({ message: "Do not move livestock during lightning activity", urgency: "critical", animalType: "all", icon: "\uD83D\uDEAB" });
  }

  return advice;
}

/**
 * Generate crop-specific weather advice.
 *
 * @param {object} weather - Weather data
 * @returns {Array} Array of { message, urgency, cropStage, icon }
 */
export function generateCropAdvice(weather) {
  if (!weather?.available || !weather.current) return [];

  const current = weather.current;
  const forecast = weather.forecast || [];
  const hourly = weather.hourly || [];
  const advice = [];

  const minTemp = getMinTemperature(current, forecast, hourly);
  const maxTemp = getMaxTemperature(current, forecast, hourly);
  const maxWind = getMaxWind(current, forecast, hourly);
  const maxRain = getMaxRainfall(current, forecast, hourly);
  const humidity = getMaxHumidity(current, forecast, hourly);

  // FROST / FREEZE
  if (minTemp <= THRESHOLDS.FROST) {
    advice.push({ message: "Cover sensitive seedlings and young transplants", urgency: "critical", cropStage: "seedling", icon: "\uD83C\uDF31" });
    advice.push({ message: "Delay irrigation — wet plants are more susceptible to frost damage", urgency: "high", cropStage: "all", icon: "\uD83D\uDCA7" });
    advice.push({ message: "Inspect crops after sunrise for frost damage", urgency: "high", cropStage: "all", icon: "\uD83D\uDD0D" });
    if (minTemp <= THRESHOLDS.FREEZE) {
      advice.push({ message: "Protect fruit trees and flowering crops", urgency: "critical", cropStage: "flowering", icon: "\uD83C\uDF38" });
    }
  }

  // HEATWAVE
  if (maxTemp >= THRESHOLDS.HEATWAVE) {
    advice.push({ message: "Increase irrigation frequency — soil dries faster in extreme heat", urgency: "high", cropStage: "all", icon: "\uD83D\uDCA7" });
    advice.push({ message: "Apply mulch to retain soil moisture", urgency: "moderate", cropStage: "growing", icon: "\uD83C\uDF3F" });
    advice.push({ message: "Harvest mature crops early to prevent sun damage", urgency: "high", cropStage: "harvest", icon: "\uD83C\uDF3E" });
  }

  // HEAVY RAIN
  if (maxRain >= THRESHOLDS.HEAVY_RAIN) {
    advice.push({ message: "Delay all planting operations", urgency: "high", cropStage: "planting", icon: "\uD83C\uDF31" });
    advice.push({ message: "Delay fertilizer application — will wash away", urgency: "high", cropStage: "all", icon: "\u274C" });
    advice.push({ message: "Check and clear drainage channels", urgency: "high", cropStage: "all", icon: "\uD83D\uDEBF" });
    advice.push({ message: "Harvest ripe crops before rain if possible", urgency: "critical", cropStage: "harvest", icon: "\uD83C\uDF3E" });
  } else if (maxRain >= THRESHOLDS.MODERATE_RAIN) {
    advice.push({ message: "Delay spraying — rain will reduce effectiveness", urgency: "moderate", cropStage: "all", icon: "\uD83D\uDEAB" });
  }

  // STRONG WIND
  if (maxWind >= THRESHOLDS.STRONG_WIND) {
    advice.push({ message: "Do not spray — chemical drift risk too high", urgency: "critical", cropStage: "all", icon: "\uD83D\uDCA8" });
    advice.push({ message: "Secure irrigation pivots and sprinklers", urgency: "high", cropStage: "all", icon: "\uD83D\uDD27" });
    advice.push({ message: "Stake tall crops and protect polytunnels", urgency: "high", cropStage: "growing", icon: "\uD83C\uDF3F" });
  } else if (maxWind >= THRESHOLDS.MODERATE_WIND) {
    advice.push({ message: "Avoid spraying — wind speed too high for effective application", urgency: "high", cropStage: "all", icon: "\uD83D\uDCA8" });
  }

  // HIGH HUMIDITY + WARMTH = DISEASE
  if (humidity >= THRESHOLDS.DISEASE_RISK_HUMIDITY && maxTemp > 20) {
    advice.push({ message: "High disease pressure — monitor crops for fungal infections", urgency: "high", cropStage: "all", icon: "\uD83E\uDDA0" });
    advice.push({ message: "Consider preventive fungicide if window allows", urgency: "moderate", cropStage: "growing", icon: "\uD83E\uDDEA" });
  }

  // HAIL
  if (detectHail(current, forecast, hourly)) {
    advice.push({ message: "Deploy hail netting if available", urgency: "critical", cropStage: "all", icon: "\uD83E\uDDCA" });
    advice.push({ message: "Harvest any ripe crops immediately before hail arrives", urgency: "critical", cropStage: "harvest", icon: "\u23F0" });
  }

  return advice;
}

/**
 * Generate machinery-specific weather advice.
 *
 * @param {object} weather - Weather data
 * @returns {Array} Array of { message, urgency, icon }
 */
export function generateMachineryAdvice(weather) {
  if (!weather?.available || !weather.current) return [];

  const current = weather.current;
  const forecast = weather.forecast || [];
  const hourly = weather.hourly || [];
  const advice = [];

  const minTemp = getMinTemperature(current, forecast, hourly);
  const maxWind = getMaxWind(current, forecast, hourly);
  const maxRain = getMaxRainfall(current, forecast, hourly);

  // FREEZE
  if (minTemp <= THRESHOLDS.FREEZE) {
    advice.push({ message: "Drain exposed pipes and irrigation lines", urgency: "critical", icon: "\uD83D\uDD27" });
    advice.push({ message: "Check antifreeze levels in all vehicles", urgency: "high", icon: "\uD83D\uDE9C" });
    advice.push({ message: "Protect hydraulic systems from freezing", urgency: "high", icon: "\u2699\uFE0F" });
  }

  // STRONG WIND
  if (maxWind >= THRESHOLDS.STRONG_WIND) {
    advice.push({ message: "Secure all loose equipment and structures", urgency: "critical", icon: "\uD83D\uDD17" });
    advice.push({ message: "Delay field operations with tall machinery", urgency: "high", icon: "\uD83D\uDE9C" });
    advice.push({ message: "Anchor irrigation pivots and sprinklers", urgency: "high", icon: "\u2693" });
  }

  // HEAVY RAIN
  if (maxRain >= THRESHOLDS.HEAVY_RAIN) {
    advice.push({ message: "Move all machinery to covered storage", urgency: "high", icon: "\uD83C\uDFE0" });
    advice.push({ message: "Delay field operations — soil compaction risk", urgency: "high", icon: "\uD83D\uDEAB" });
    advice.push({ message: "Protect stored feed from moisture", urgency: "high", icon: "\uD83C\uDF3E" });
  }

  // HAIL
  if (detectHail(current, forecast, hourly)) {
    advice.push({ message: "Move all vehicles and machinery under cover IMMEDIATELY", urgency: "critical", icon: "\uD83D\uDEA8" });
    advice.push({ message: "Park tractors in sheds — hail damages cabs and electronics", urgency: "critical", icon: "\uD83D\uDE9C" });
  }

  // STORM / LIGHTNING
  if (detectStorm(current, forecast, hourly) || detectLightning(current, forecast, hourly)) {
    advice.push({ message: "Do not operate machinery during lightning", urgency: "critical", icon: "\u26A1" });
    advice.push({ message: "Disconnect sensitive electronics from power", urgency: "high", icon: "\uD83D\uDD0C" });
  }

  // FLOOD
  if (maxRain >= THRESHOLDS.FLOOD_RISK) {
    advice.push({ message: "Move machinery from low-lying storage areas", urgency: "critical", icon: "\uD83C\uDF0A" });
  }

  return advice;
}

/**
 * Generate actionable weather preparation checklists.
 *
 * @param {object} weather - Weather data
 * @returns {Array} Array of checklist objects: { id, title, icon, type, priority, items[] }
 */
export function generateChecklist(weather) {
  if (!weather?.available || !weather.current) return [];

  const current = weather.current;
  const forecast = weather.forecast || [];
  const hourly = weather.hourly || [];
  const checklists = [];

  const minTemp = getMinTemperature(current, forecast, hourly);
  const maxTemp = getMaxTemperature(current, forecast, hourly);
  const maxWind = getMaxWind(current, forecast, hourly);
  const maxRain = getMaxRainfall(current, forecast, hourly);

  // FREEZE CHECKLIST
  if (minTemp <= THRESHOLDS.FROST) {
    checklists.push({
      id: "checklist-freeze",
      title: minTemp <= THRESHOLDS.FREEZE ? "Freeze Preparation" : "Frost Preparation",
      icon: "\u2744\uFE0F",
      type: "freeze",
      priority: minTemp <= THRESHOLDS.FREEZE ? "Critical" : "High",
      items: [
        { id: "freeze-1", text: "Move calves and lambs to shelter", checked: false },
        { id: "freeze-2", text: "Add extra bedding to all shelters", checked: false },
        { id: "freeze-3", text: "Protect water troughs from freezing", checked: false },
        { id: "freeze-4", text: "Cover sensitive seedlings and plants", checked: false },
        { id: "freeze-5", text: "Check generators are fuelled and working", checked: false },
        { id: "freeze-6", text: "Drain exposed pipes and irrigation lines", checked: false },
        { id: "freeze-7", text: "Provide extra evening feed for livestock", checked: false },
        { id: "freeze-8", text: "Inspect shelters for drafts and leaks", checked: false },
      ],
    });
  }

  // STORM CHECKLIST
  if (detectStorm(current, forecast, hourly) || maxWind >= THRESHOLDS.STRONG_WIND) {
    checklists.push({
      id: "checklist-storm",
      title: "Storm Preparation",
      icon: "\u26C8\uFE0F",
      type: "storm",
      priority: "High",
      items: [
        { id: "storm-1", text: "Secure all loose machinery and equipment", checked: false },
        { id: "storm-2", text: "Protect stored feed from rain and wind", checked: false },
        { id: "storm-3", text: "Check perimeter fencing is secure", checked: false },
        { id: "storm-4", text: "Charge all communication devices", checked: false },
        { id: "storm-5", text: "Move vehicles to covered parking", checked: false },
        { id: "storm-6", text: "Ensure livestock have shelter access", checked: false },
        { id: "storm-7", text: "Clear drainage channels", checked: false },
        { id: "storm-8", text: "Secure irrigation pipes and sprinklers", checked: false },
      ],
    });
  }

  // HEAT CHECKLIST
  if (maxTemp >= THRESHOLDS.HEATWAVE) {
    checklists.push({
      id: "checklist-heat",
      title: "Heatwave Preparation",
      icon: "\uD83D\uDD25",
      type: "heat",
      priority: maxTemp >= THRESHOLDS.EXTREME_HEAT ? "Critical" : "High",
      items: [
        { id: "heat-1", text: "Fill all water troughs to maximum", checked: false },
        { id: "heat-2", text: "Set up additional shade structures", checked: false },
        { id: "heat-3", text: "Check irrigation system is operational", checked: false },
        { id: "heat-4", text: "Reschedule outdoor work to early morning", checked: false },
        { id: "heat-5", text: "Prepare electrolytes for stressed animals", checked: false },
        { id: "heat-6", text: "Apply mulch to retain soil moisture", checked: false },
        { id: "heat-7", text: "Cancel livestock transport bookings", checked: false },
        { id: "heat-8", text: "Brief farm workers on heat safety", checked: false },
      ],
    });
  }

  // FLOOD CHECKLIST
  if (maxRain >= THRESHOLDS.FLOOD_RISK) {
    checklists.push({
      id: "checklist-flood",
      title: "Flood Preparation",
      icon: "\uD83C\uDF0A",
      type: "flood",
      priority: "Critical",
      items: [
        { id: "flood-1", text: "Move livestock from low-lying areas", checked: false },
        { id: "flood-2", text: "Move machinery to high ground", checked: false },
        { id: "flood-3", text: "Protect stored feed and chemicals", checked: false },
        { id: "flood-4", text: "Clear all drainage channels", checked: false },
        { id: "flood-5", text: "Prepare emergency feed reserves on high ground", checked: false },
        { id: "flood-6", text: "Check river levels and dam spillways", checked: false },
        { id: "flood-7", text: "Ensure emergency equipment accessible", checked: false },
        { id: "flood-8", text: "Brief workers on evacuation routes", checked: false },
      ],
    });
  }

  // HAIL CHECKLIST
  if (detectHail(current, forecast, hourly)) {
    checklists.push({
      id: "checklist-hail",
      title: "Hail Preparation",
      icon: "\uD83E\uDDCA",
      type: "hail",
      priority: "Critical",
      items: [
        { id: "hail-1", text: "Move ALL vehicles under cover", checked: false },
        { id: "hail-2", text: "Park tractors in sheds", checked: false },
        { id: "hail-3", text: "Deploy hail netting over vulnerable crops", checked: false },
        { id: "hail-4", text: "Bring livestock into sheltered areas", checked: false },
        { id: "hail-5", text: "Protect solar panels and skylights", checked: false },
        { id: "hail-6", text: "Secure all outdoor items", checked: false },
      ],
    });
  }

  return checklists.sort((a, b) => {
    const priorityMap = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (priorityMap[a.priority] ?? 4) - (priorityMap[b.priority] ?? 4);
  });
}

/**
 * Generate Early Warning countdown system.
 *
 * Produces time-phased warnings: 72h → 24h → 6h → During → After
 *
 * @param {object} weather - Weather data
 * @param {object} options - { eventTime?: Date, eventType?: string }
 * @returns {Array} Array of early warning objects with countdown phases
 */
export function generateEarlyWarnings(weather) {
  if (!weather?.available || !weather.current) return [];

  const alerts = generateWeatherAlerts(weather);
  if (alerts.length === 0) return [];

  const warnings = [];

  for (const alert of alerts) {
    // Estimate time to event based on forecast data
    const hoursUntil = estimateHoursUntilEvent(weather, alert.type);

    let stage;
    let recommendations;

    if (hoursUntil === null || hoursUntil > 72) {
      continue; // Too far out to warn
    } else if (hoursUntil > 24) {
      stage = WARNING_STAGES.HOURS_72;
      recommendations = getPhase72Recommendations(alert.type);
    } else if (hoursUntil > 6) {
      stage = WARNING_STAGES.HOURS_24;
      recommendations = getPhase24Recommendations(alert.type);
    } else if (hoursUntil > 0) {
      stage = WARNING_STAGES.HOURS_6;
      recommendations = getPhase6Recommendations(alert.type);
    } else {
      stage = WARNING_STAGES.DURING;
      recommendations = getPhaseDuringRecommendations(alert.type);
    }

    warnings.push({
      id: `early-warning-${alert.type.toLowerCase()}`,
      alertType: alert.type,
      title: alert.title,
      icon: alert.icon,
      color: alert.color,
      priority: alert.priority,
      stage,
      hoursUntil: Math.max(0, hoursUntil ?? 0),
      countdown: formatCountdown(hoursUntil),
      recommendations,
      message: getWarningMessage(alert.type, stage),
    });
  }

  return warnings;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function getBannerSubtitle(alert) {
  switch (alert.type) {
    case "FREEZE": return "Protect livestock before sunset. Move calves indoors.";
    case "FROST": return "Cover seedlings and monitor young animals overnight.";
    case "HEATWAVE": return "Ensure all livestock have water and shade access.";
    case "HEAVY_RAIN": return "Delay fertilizer application. Protect stored feed.";
    case "FLOOD": return "Move livestock and machinery from low-lying areas NOW.";
    case "HIGH_WIND": return "Spraying not recommended. Secure loose equipment.";
    case "STORM": return "Keep workers and livestock away from open areas.";
    case "LIGHTNING": return "Do not operate machinery. Avoid open fields.";
    case "HAIL": return "Move vehicles and machinery under cover immediately.";
    default: return alert.message;
  }
}

function getBannerAction(alert) {
  switch (alert.type) {
    case "FREEZE": return "View freeze checklist";
    case "FROST": return "View frost protection";
    case "HEATWAVE": return "View heat preparation";
    case "HEAVY_RAIN": return "View rain preparation";
    case "FLOOD": return "View flood preparation";
    case "HIGH_WIND": return "View wind preparation";
    case "STORM": return "View storm checklist";
    case "LIGHTNING": return "View safety advice";
    case "HAIL": return "View hail checklist";
    default: return "View details";
  }
}

function generateGeneralAdvice(weather) {
  if (!weather?.available || !weather.current) return [];

  const current = weather.current;
  const forecast = weather.forecast || [];
  const hourly = weather.hourly || [];
  const advice = [];

  const maxWind = getMaxWind(current, forecast, hourly);
  const maxRain = getMaxRainfall(current, forecast, hourly);
  const maxTemp = getMaxTemperature(current, forecast, hourly);

  if (maxWind >= THRESHOLDS.MODERATE_WIND && maxWind < THRESHOLDS.STRONG_WIND) {
    advice.push({ message: "Moderate wind — consider postponing spray operations", urgency: "moderate", icon: "\uD83D\uDCA8" });
  }

  if (maxRain >= THRESHOLDS.LIGHT_RAIN && maxRain < THRESHOLDS.MODERATE_RAIN) {
    advice.push({ message: "Light rain expected — plan indoor tasks for this period", urgency: "low", icon: "\uD83C\uDF26\uFE0F" });
  }

  if (maxTemp >= THRESHOLDS.HOT && maxTemp < THRESHOLDS.HEATWAVE) {
    advice.push({ message: "Hot day ahead — schedule heavy work for early morning", urgency: "moderate", icon: "\u2600\uFE0F" });
  }

  // Ideal spray conditions check
  if (maxWind < THRESHOLDS.MODERATE_WIND && maxRain < THRESHOLDS.LIGHT_RAIN && !detectStorm(current, forecast, hourly)) {
    advice.push({ message: "Good spraying conditions today — low wind, no rain expected", urgency: "info", icon: "\u2705" });
  }

  return advice;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA EXTRACTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getMinTemperature(current, forecast, hourly) {
  const values = [];
  if (current.temperature != null) values.push(current.temperature);
  if (current.feelsLike != null) values.push(current.feelsLike);
  for (const day of forecast.slice(0, 2)) {
    if (day.temperatureMin != null) values.push(day.temperatureMin);
    if (day.temperature != null) values.push(day.temperature);
  }
  for (const hour of hourly.slice(0, 24)) {
    if (hour.temperature != null) values.push(hour.temperature);
    if (hour.feelsLike != null) values.push(hour.feelsLike);
  }
  return values.length > 0 ? Math.min(...values) : 15; // Safe default
}

function getMaxTemperature(current, forecast, hourly) {
  const values = [];
  if (current.temperature != null) values.push(current.temperature);
  for (const day of forecast.slice(0, 2)) {
    if (day.temperatureMax != null) values.push(day.temperatureMax);
    if (day.temperature != null) values.push(day.temperature);
  }
  for (const hour of hourly.slice(0, 24)) {
    if (hour.temperature != null) values.push(hour.temperature);
  }
  return values.length > 0 ? Math.max(...values) : 25; // Safe default
}

function getMaxWind(current, forecast, hourly) {
  const values = [current.windSpeed || 0];
  for (const day of forecast.slice(0, 2)) {
    if (day.windSpeed) values.push(day.windSpeed);
  }
  for (const hour of hourly.slice(0, 24)) {
    if (hour.windSpeed) values.push(hour.windSpeed);
    if (hour.windGust) values.push(hour.windGust);
  }
  return Math.max(...values);
}

function getMaxRainfall(current, forecast, hourly) {
  const values = [current.rainfall || 0];
  for (const day of forecast.slice(0, 2)) {
    if (day.rainfall) values.push(day.rainfall);
  }
  // Sum hourly rainfall for next 24h
  let hourlyTotal = 0;
  for (const hour of hourly.slice(0, 24)) {
    hourlyTotal += hour.rainfall || 0;
  }
  if (hourlyTotal > 0) values.push(hourlyTotal);
  return Math.max(...values);
}

function getMaxHumidity(current, forecast, hourly) {
  const values = [current.humidity || 0];
  for (const day of forecast.slice(0, 2)) {
    if (day.humidity) values.push(day.humidity);
  }
  for (const hour of hourly.slice(0, 12)) {
    if (hour.humidity) values.push(hour.humidity);
  }
  return Math.max(...values);
}

function detectStorm(current, forecast, hourly) {
  const condition = (current.condition || "").toLowerCase();
  if (condition.includes("thunder") || condition.includes("storm")) return true;
  for (const day of forecast.slice(0, 2)) {
    const c = (day.condition || "").toLowerCase();
    if (c.includes("thunder") || c.includes("storm")) return true;
  }
  for (const hour of hourly.slice(0, 24)) {
    const c = (hour.condition || "").toLowerCase();
    if (c.includes("thunder") || c.includes("storm")) return true;
  }
  return false;
}

function detectLightning(current, forecast, hourly) {
  // Lightning likely during storms or explicitly flagged
  if (detectStorm(current, forecast, hourly)) return true;
  // Check for explicit lightning indicators in hourly data
  for (const hour of hourly.slice(0, 24)) {
    if (hour.lightning || hour.lightningProbability >= THRESHOLDS.LIGHTNING_LIKELY) return true;
  }
  return false;
}

function detectHail(current, forecast, hourly) {
  const condition = (current.condition || "").toLowerCase();
  if (condition.includes("hail")) return true;
  for (const day of forecast.slice(0, 2)) {
    const c = (day.condition || "").toLowerCase();
    if (c.includes("hail")) return true;
    if (day.hailProbability && day.hailProbability >= THRESHOLDS.HAIL_LIKELY) return true;
  }
  for (const hour of hourly.slice(0, 24)) {
    const c = (hour.condition || "").toLowerCase();
    if (c.includes("hail")) return true;
    if (hour.hailProbability && hour.hailProbability >= THRESHOLDS.HAIL_LIKELY) return true;
  }
  return false;
}

function estimateColdDuration(forecast, hourly, threshold) {
  let hours = 0;
  for (const hour of hourly) {
    if (hour.temperature != null && hour.temperature <= threshold) hours++;
  }
  return hours || null; // null if can't determine
}

function estimateHoursUntilEvent(weather, alertType) {
  const hourly = weather.hourly || [];
  const forecast = weather.forecast || [];

  // If no hourly data, estimate from current and forecast
  if (hourly.length === 0) {
    // If the condition is already happening, return 0
    const current = weather.current;
    if (isEventActive(current, alertType)) return 0;
    // If in forecast, estimate within 24h
    if (forecast.length > 0) return 12; // Rough estimate
    return null;
  }

  // Find first hour where the event condition triggers
  for (let i = 0; i < hourly.length; i++) {
    if (matchesAlertCondition(hourly[i], alertType)) {
      return i;
    }
  }

  return null;
}

function isEventActive(current, alertType) {
  if (!current) return false;
  switch (alertType) {
    case "FREEZE": return (current.temperature ?? 99) <= THRESHOLDS.FREEZE;
    case "FROST": return (current.temperature ?? 99) <= THRESHOLDS.FROST;
    case "HEATWAVE": return (current.temperature ?? 0) >= THRESHOLDS.HEATWAVE;
    case "HEAVY_RAIN": return (current.rainfall ?? 0) >= THRESHOLDS.HEAVY_RAIN;
    case "FLOOD": return (current.rainfall ?? 0) >= THRESHOLDS.FLOOD_RISK;
    case "HIGH_WIND": return (current.windSpeed ?? 0) >= THRESHOLDS.STRONG_WIND;
    case "STORM": return (current.condition || "").toLowerCase().includes("storm");
    case "LIGHTNING": return (current.condition || "").toLowerCase().includes("thunder");
    case "HAIL": return (current.condition || "").toLowerCase().includes("hail");
    default: return false;
  }
}

function matchesAlertCondition(hourData, alertType) {
  if (!hourData) return false;
  switch (alertType) {
    case "FREEZE": return (hourData.temperature ?? 99) <= THRESHOLDS.FREEZE;
    case "FROST": return (hourData.temperature ?? 99) <= THRESHOLDS.FROST;
    case "HEATWAVE": return (hourData.temperature ?? 0) >= THRESHOLDS.HEATWAVE;
    case "HEAVY_RAIN": return (hourData.rainfall ?? 0) >= THRESHOLDS.HEAVY_RAIN;
    case "FLOOD": return (hourData.rainfall ?? 0) >= THRESHOLDS.FLOOD_RISK;
    case "HIGH_WIND": return (hourData.windSpeed ?? 0) >= THRESHOLDS.STRONG_WIND;
    case "STORM": return (hourData.condition || "").toLowerCase().includes("storm");
    case "LIGHTNING": return (hourData.condition || "").toLowerCase().includes("thunder");
    case "HAIL": return (hourData.condition || "").toLowerCase().includes("hail");
    default: return false;
  }
}

function formatCountdown(hours) {
  if (hours === null || hours === undefined) return "Unknown";
  if (hours <= 0) return "NOW";
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EARLY WARNING PHASE RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getPhase72Recommendations(alertType) {
  const base = {
    FREEZE: ["Monitor weather forecasts closely", "Review freeze preparation checklist", "Ensure shelter capacity is adequate", "Stock up on extra feed"],
    FROST: ["Monitor forecast for confirmation", "Identify vulnerable crops", "Prepare protective covers"],
    HEATWAVE: ["Fill all water storage tanks", "Check shade structures", "Brief workers on heat schedule"],
    HEAVY_RAIN: ["Clear drainage channels", "Check dam levels", "Prepare feed storage protection"],
    FLOOD: ["Monitor river levels", "Plan livestock evacuation routes", "Prepare emergency supplies"],
    HIGH_WIND: ["Secure loose structures", "Check fence integrity", "Plan indoor work schedule"],
    STORM: ["Charge all devices", "Review emergency procedures", "Check communication equipment"],
    LIGHTNING: ["Review safety procedures", "Identify safe shelter points"],
    HAIL: ["Check hail netting availability", "Plan vehicle storage", "Identify vulnerable crops"],
  };
  return base[alertType] || ["Monitor weather updates", "Review preparation checklist"];
}

function getPhase24Recommendations(alertType) {
  const base = {
    FREEZE: ["Prepare livestock shelters with extra bedding", "Move young/vulnerable animals to sheltered areas", "Protect water supply systems", "Cover sensitive crops"],
    FROST: ["Cover seedlings tonight", "Set up frost protection", "Delay morning irrigation"],
    HEATWAVE: ["Fill all water troughs now", "Set up additional shade", "Reschedule tomorrow's outdoor work"],
    HEAVY_RAIN: ["Complete drainage clearing", "Move exposed machinery under cover", "Harvest any ripe crops today"],
    FLOOD: ["Move livestock to high ground today", "Move machinery to elevated areas", "Secure chemical stores"],
    HIGH_WIND: ["Secure all irrigation equipment", "Anchor loose structures", "Cancel spray bookings"],
    STORM: ["Move all vehicles to covered areas", "Secure loose equipment", "Brief workers"],
    LIGHTNING: ["Plan to keep workers and livestock sheltered", "Avoid scheduling field work"],
    HAIL: ["Move all vehicles under cover NOW", "Deploy hail netting", "Harvest ripe crops today"],
  };
  return base[alertType] || ["Take preparation actions now", "Complete checklist items"];
}

function getPhase6Recommendations(alertType) {
  const base = {
    FREEZE: ["IMMEDIATE: Move calves and lambs NOW", "Close all shelter doors and vents", "Final feed before nightfall", "Drain all exposed water lines"],
    FROST: ["Cover all vulnerable plants NOW", "Close greenhouse vents", "Apply anti-frost treatment if available"],
    HEATWAVE: ["Final water trough check", "Confirm shade access for all animals", "Stop all non-essential outdoor work"],
    HEAVY_RAIN: ["Final check: all machinery covered", "Close all storage doors", "Move remaining items indoors"],
    FLOOD: ["FINAL EVACUATION: Move all animals to high ground", "Move vehicles to safety", "Activate emergency plan"],
    HIGH_WIND: ["Final securing of all equipment", "Move livestock to sheltered areas", "Stop all field operations"],
    STORM: ["All workers to safe areas", "Final equipment check", "Activate storm protocol"],
    LIGHTNING: ["Stop all outdoor operations", "Move workers to buildings", "Cease machinery operation"],
    HAIL: ["LAST CHANCE: Move vehicles under cover", "All workers inside", "Nothing left exposed"],
  };
  return base[alertType] || ["Immediate action required", "Complete all preparations NOW"];
}

function getPhaseDuringRecommendations(alertType) {
  const base = {
    FREEZE: ["Monitor animal shelter temperatures", "Check for distressed animals", "Do not open shelter doors unnecessarily"],
    FROST: ["Stay indoors", "Do not water crops", "Wait for sunrise to inspect"],
    HEATWAVE: ["Monitor livestock for heat stress", "Keep water flowing", "Workers take regular breaks"],
    HEAVY_RAIN: ["Stay alert for flooding", "Monitor dam levels", "Keep emergency equipment ready"],
    FLOOD: ["Stay on high ground", "Do not cross flooded areas", "Monitor water levels"],
    HIGH_WIND: ["Stay indoors", "Do not attempt repairs", "Monitor for structural damage"],
    STORM: ["Stay in safe structures", "Stay away from windows", "Do not go outside"],
    LIGHTNING: ["Stay inside buildings", "Avoid tall structures", "Do not use corded phones"],
    HAIL: ["Remain indoors", "Stay away from windows and skylights", "Wait for all-clear"],
  };
  return base[alertType] || ["Extreme weather in progress", "Remain in safe location"];
}

function getWarningMessage(alertType, stage) {
  const eventName = {
    FREEZE: "Freeze",
    FROST: "Frost",
    HEATWAVE: "Heatwave",
    HEAVY_RAIN: "Heavy Rain",
    FLOOD: "Flood",
    HIGH_WIND: "High Wind",
    STORM: "Thunderstorm",
    LIGHTNING: "Lightning",
    HAIL: "Hail",
  }[alertType] || "Severe Weather";

  switch (stage.phase) {
    case "monitor": return `${eventName} expected. Monitor weather and review preparation checklist.`;
    case "prepare": return `${eventName} expected tomorrow. Prepare livestock shelters, protect crops, check feed.`;
    case "immediate": return `${eventName} imminent. Immediate action required.`;
    case "active": return `Extreme Weather In Progress. Remain safe.`;
    case "recovery": return `Event passed. Begin inspection and damage assessment.`;
    default: return `${eventName} weather event. Stay prepared.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS — Constants for external use
// ═══════════════════════════════════════════════════════════════════════════════

export { THRESHOLDS, RISK_LEVELS, WARNING_STAGES };
