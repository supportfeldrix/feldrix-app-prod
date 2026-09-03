/**
 * FarmHand PRO — Daily Farm Briefing Engine
 * Sprint 37
 *
 * Generates a personalized daily briefing for the Dashboard Hero Banner.
 * Combines data from all farm modules into a concise operational summary.
 *
 * @module dailyBriefing
 */

/**
 * Generates the daily farm briefing.
 *
 * @param {object} data - Farm data context
 * @param {object} data.planner - Planner data with overdue, today, upcoming, tasks
 * @param {object} data.livestock - Livestock data with animals, healthRecords
 * @param {object} data.crops - Crops data with crops array
 * @param {object} data.machinery - Machinery data with machines, maintenancePlans
 * @param {object} data.finance - Finance data with records
 * @param {object} data.weather - Weather data with current, forecast, available
 * @param {object} data.intelligence - Intelligence data with insights
 * @param {Array} data.notifications - Notification array from engine
 * @returns {object} Daily briefing object
 */
export function getDailyFarmBriefing(data = {}) {
  try {
    const greeting = generateGreeting();
    const priority = determinePriority(data);
    const summary = generateSummary(priority, data);
    const highlights = generateHighlights(data);
    const recommendation = generateRecommendation(data);
    const weatherSummary = generateWeatherSummary(data.weather);

    return {
      greeting,
      summary,
      highlights,
      recommendation,
      weatherSummary,
      priority,
    };
  } catch {
    return {
      greeting: generateGreeting(),
      summary: "Welcome to FarmHand PRO.",
      highlights: [],
      recommendation: null,
      weatherSummary: null,
      priority: "good",
    };
  }
}

// =====================================================
// Greeting
// =====================================================

/**
 * Generates a time-based greeting.
 */
function generateGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 23) return "Good Evening";
  return "Welcome Back";
}

// =====================================================
// Priority
// =====================================================

/**
 * Determines the overall farm priority based on available data.
 */
function determinePriority(data) {
  const notifications = Array.isArray(data.notifications) ? data.notifications : [];
  const insights = data.intelligence?.insights || [];

  const hasCritical =
    notifications.some((n) => n.priority === "Critical") ||
    insights.some((i) => i.priority === "Critical");

  const hasHigh =
    notifications.some((n) => n.priority === "High") ||
    insights.some((i) => i.priority === "High");

  const overdueCount = data.planner?.overdue?.length || 0;

  if (hasCritical || overdueCount >= 5) return "critical";
  if (hasHigh || overdueCount >= 2) return "warning";
  return "good";
}

// =====================================================
// Summary
// =====================================================

/**
 * Generates a one-line summary of farm status.
 */
function generateSummary(priority, data) {
  const overdueCount = data.planner?.overdue?.length || 0;
  const notifications = Array.isArray(data.notifications) ? data.notifications : [];
  const criticalCount = notifications.filter((n) => n.priority === "Critical").length;

  if (priority === "critical") {
    if (criticalCount > 0) {
      return `There are ${criticalCount} critical item${criticalCount === 1 ? "" : "s"} requiring immediate attention.`;
    }
    return "There are several important items requiring attention.";
  }

  if (priority === "warning") {
    if (overdueCount > 0) {
      return `You have ${overdueCount} overdue task${overdueCount === 1 ? "" : "s"} to review today.`;
    }
    return "A few items need your attention today.";
  }

  return "Your farm is running smoothly today.";
}

// =====================================================
// Highlights
// =====================================================

/**
 * Generates up to 5 concise highlight bullets from all modules.
 */
function generateHighlights(data) {
  const highlights = [];
  const seen = new Set();

  function add(text) {
    if (seen.has(text) || highlights.length >= 5) return;
    seen.add(text);
    highlights.push(text);
  }

  // Planner
  const overdueCount = data.planner?.overdue?.length || 0;
  const todayCount = data.planner?.today?.length || 0;

  if (overdueCount > 0) {
    add(`${overdueCount} overdue planner task${overdueCount === 1 ? "" : "s"}.`);
  }
  if (todayCount > 0) {
    add(`${todayCount} task${todayCount === 1 ? "" : "s"} scheduled for today.`);
  }

  // Livestock
  const animals = data.livestock?.animals || [];
  const healthRecords = data.livestock?.healthRecords || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const healthDue = healthRecords.filter((r) => {
    // Completion is tracked via completed_at (next_due is preserved).
    if (r.completed_at) return false;
    if (!r.next_due) return false;
    const d = new Date(r.next_due);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  }).length;

  if (healthDue > 0) {
    add(`${healthDue} livestock treatment${healthDue === 1 ? "" : "s"} due.`);
  } else if (animals.length > 0) {
    add("All livestock healthy.");
  }

  // Crops
  const crops = data.crops?.crops || [];
  const harvestOverdue = crops.filter((c) => {
    if (c.status === "Harvested" || !c.harvest_date) return false;
    const d = new Date(c.harvest_date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }).length;

  if (harvestOverdue > 0) {
    add(`${harvestOverdue} harvest${harvestOverdue === 1 ? "" : "s"} overdue.`);
  }

  // Machinery
  const machines = data.machinery?.machines || [];
  const plans = data.machinery?.maintenancePlans || [];
  let serviceOverdue = 0;

  for (const plan of plans) {
    const machine = machines.find((m) => m.id === plan.machine_id);
    if (!machine) continue;
    if (Number(machine.hour_meter || 0) >= Number(plan.next_due_hours || 0)) {
      serviceOverdue++;
    }
  }

  if (serviceOverdue > 0) {
    add(`${serviceOverdue} machine${serviceOverdue === 1 ? "" : "s"} overdue for service.`);
  }

  // Weather
  const weather = data.weather;
  if (weather?.available) {
    const condition = weather.current?.condition || "";
    const temp = weather.current?.temperature;
    const rainfall = weather.current?.rainfall || 0;

    if (rainfall > 20) {
      add("Heavy rain expected today.");
    } else if (condition === "Rain" || condition === "Thunderstorm") {
      add("Rain expected today.");
    } else if (temp !== null && temp <= 2) {
      add("Frost risk detected.");
    } else if (temp !== null && temp >= 35) {
      add("High temperatures expected.");
    }
  }

  // Finance
  const records = data.finance?.records || [];
  if (records.length > 0) {
    const income = records
      .filter((r) => (r.type || "").toLowerCase() === "income")
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const expenses = records
      .filter((r) => (r.type || "").toLowerCase() === "expense")
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    if (income > expenses) {
      add("Finance remains profitable.");
    } else if (expenses > income) {
      add("Expenses currently exceed income.");
    }
  }

  return highlights;
}

// =====================================================
// Recommendation
// =====================================================

/**
 * Returns the single highest-priority recommendation.
 */
function generateRecommendation(data) {
  const overdueCount = data.planner?.overdue?.length || 0;
  const notifications = Array.isArray(data.notifications) ? data.notifications : [];
  const insights = data.intelligence?.insights || [];

  // Check for critical intelligence insights first
  const criticalInsight = insights.find((i) => i.priority === "Critical");
  if (criticalInsight) {
    return criticalInsight.description || criticalInsight.title;
  }

  // Check critical notifications
  const criticalNotif = notifications.find((n) => n.priority === "Critical");
  if (criticalNotif) {
    return criticalNotif.message || criticalNotif.title;
  }

  // Planner overdue
  if (overdueCount > 0) {
    return "Complete overdue planner tasks to improve your Farm Health Score.";
  }

  // Weather-based
  const weather = data.weather;
  if (weather?.available) {
    const rainfall = weather.current?.rainfall || 0;
    const condition = weather.current?.condition || "";

    if (rainfall > 20 || condition === "Thunderstorm") {
      return "Prepare machinery before rain arrives.";
    }
    if (weather.current?.temperature <= 2) {
      return "Protect sensitive crops from overnight frost.";
    }
  }

  // Crops overdue
  const crops = data.crops?.crops || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const harvestOverdue = crops.some((c) => {
    if (c.status === "Harvested" || !c.harvest_date) return false;
    const d = new Date(c.harvest_date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  });

  if (harvestOverdue) {
    return "Harvest overdue fields today to preserve yield quality.";
  }

  // Finance
  const records = data.finance?.records || [];
  if (records.length > 0) {
    const income = records
      .filter((r) => (r.type || "").toLowerCase() === "income")
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const expenses = records
      .filter((r) => (r.type || "").toLowerCase() === "expense")
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    if (expenses > income) {
      return "Review outstanding finance items to restore profitability.";
    }
  }

  return null;
}

// =====================================================
// Weather Summary
// =====================================================

/**
 * Generates a compact weather phrase for the Hero Banner.
 */
function generateWeatherSummary(weather) {
  if (!weather || !weather.available) return null;

  const current = weather.current || {};
  const temp = current.temperature;
  const condition = current.condition || "";
  const rainfall = current.rainfall || 0;

  if (temp !== null && temp <= 2) {
    return `Frost risk • ${temp}°C`;
  }

  if (rainfall > 20) {
    return `Heavy rain • ${temp}°C`;
  }

  if (condition === "Rain" || condition === "Drizzle") {
    return `Rain expected • ${temp}°C`;
  }

  if (condition) {
    return `${condition} • ${temp}°C`;
  }

  return `${temp}°C`;
}
