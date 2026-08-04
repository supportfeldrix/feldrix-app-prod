/**
 * ============================================================
 * Feldrix Control Centre — Predictive Intelligence Engine
 * Version 2.3.0 — Phase 2
 *
 * Transforms historical dashboard data into forward-looking
 * predictions: revenue forecasts, growth projections, upgrade
 * likelihood, churn risk, and executive priorities.
 *
 * All predictions use existing dashboard data passed in —
 * NO additional API calls. Structured for future LLM replacement.
 * ============================================================
 */

/**
 * Master pipeline — runs all predictive analysis.
 * @param {Object} data - same IntelligenceInput shape from Phase 1
 */
export function runPredictiveAnalysis(data) {
  const revenueForecast = getRevenueForecast(data);
  const growthForecast = getGrowthForecast(data);
  const upgradePredictions = getUpgradePredictions(data);
  const churnPredictions = getChurnPredictions(data);
  const engagementForecast = getEngagementForecast(data);
  const executiveForecast = getExecutiveForecast(data, {
    revenueForecast, growthForecast, upgradePredictions, churnPredictions,
  });

  return {
    revenueForecast,
    growthForecast,
    upgradePredictions,
    churnPredictions,
    engagementForecast,
    executiveForecast,
  };
}

// ═══ REVENUE FORECAST ═══════════════════════════════════════

export function getRevenueForecast(data) {
  const { metrics, revenue, subBreakdown } = data;

  const currentMRR = metrics?.revenueMonth || 0;
  const proCount = metrics?.proSubscribers || 0;
  const totalCustomers = metrics?.totalUsers || 0;

  // Calculate trend from revenue history
  const recentRevenue = revenue.slice(-3);
  let monthlyGrowthRate = 0;
  if (recentRevenue.length >= 2) {
    const rates = [];
    for (let i = 1; i < recentRevenue.length; i++) {
      const prev = recentRevenue[i - 1]?.revenue || 0;
      const curr = recentRevenue[i]?.revenue || 0;
      if (prev > 0) rates.push((curr - prev) / prev);
    }
    monthlyGrowthRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
  }

  // Project forward 30 days
  const projectedMRR = Math.round(currentMRR * (1 + monthlyGrowthRate));
  const projectedARR = projectedMRR * 12;
  const revenueGrowthPct = currentMRR > 0 ? Math.round(monthlyGrowthRate * 100) : 0;

  // Confidence based on data availability
  let confidence = 40;
  if (revenue.length >= 3) confidence += 20;
  if (revenue.length >= 6) confidence += 15;
  if (proCount > 0) confidence += 15;
  if (currentMRR > 0) confidence += 10;
  confidence = Math.min(95, confidence);

  const trend = revenueGrowthPct > 5 ? "growing" : revenueGrowthPct < -5 ? "declining" : "stable";

  let recommendation;
  if (currentMRR === 0) {
    recommendation = "Revenue forecast unavailable — no recurring revenue established. First PRO conversion will enable predictive modelling.";
  } else if (trend === "declining") {
    recommendation = "Revenue trajectory is negative. Investigate churn causes and focus on retention before growth.";
  } else if (trend === "stable") {
    recommendation = "Revenue is flat. Growth requires new PRO conversions or expansion of existing accounts.";
  } else {
    recommendation = "Revenue is growing. Maintain current trajectory and explore upsell opportunities.";
  }

  return {
    currentMRR,
    projectedMRR,
    projectedARR,
    revenueGrowthPct,
    trend,
    confidence,
    recommendation,
  };
}

// ═══ GROWTH FORECAST ════════════════════════════════════════

export function getGrowthForecast(data) {
  const { metrics, growth } = data;

  const totalCustomers = metrics?.totalUsers || 0;
  const activeCustomers = metrics?.activeUsers || 0;

  // Average new customers per month from last 3 months
  const recentGrowth = growth.slice(-3);
  const avgNew = recentGrowth.length > 0
    ? Math.round(recentGrowth.reduce((s, g) => s + (g.newCustomers || 0), 0) / recentGrowth.length)
    : 0;

  const expectedNewCustomers = avgNew;
  const expectedTotalCustomers = totalCustomers + expectedNewCustomers;
  const expectedActiveCustomers = Math.round(activeCustomers * 1.02 + expectedNewCustomers * 0.7); // new users ~70% active

  // Growth trend
  let trend = "stable";
  if (growth.length >= 2) {
    const last = growth[growth.length - 1]?.newCustomers || 0;
    const prev = growth[growth.length - 2]?.newCustomers || 0;
    if (last > prev) trend = "accelerating";
    else if (last < prev) trend = "decelerating";
  }

  // Confidence
  let confidence = 35;
  if (growth.length >= 3) confidence += 20;
  if (growth.length >= 6) confidence += 15;
  if (avgNew > 0) confidence += 15;
  if (totalCustomers > 5) confidence += 10;
  confidence = Math.min(90, Math.max(20, confidence));

  let recommendation;
  if (expectedNewCustomers === 0) {
    recommendation = "No new customers projected based on current trajectory. Activate marketing channels and referral programmes immediately.";
  } else if (trend === "decelerating") {
    recommendation = `Growth is slowing — projecting ${expectedNewCustomers} new customer(s). Diversify acquisition channels to restore momentum.`;
  } else if (trend === "accelerating") {
    recommendation = `Growth is accelerating — projecting ${expectedNewCustomers} new customer(s). Ensure onboarding capacity scales accordingly.`;
  } else {
    recommendation = `Steady growth projected — ${expectedNewCustomers} new customer(s) expected. Continue current strategies.`;
  }

  return {
    expectedNewCustomers,
    expectedTotalCustomers,
    expectedActiveCustomers,
    trend,
    confidence,
    recommendation,
  };
}

// ═══ UPGRADE PREDICTIONS ════════════════════════════════════

export function getUpgradePredictions(data) {
  const { metrics, platformActivity, featureUsage, customerHealth } = data;

  const totalCustomers = metrics?.totalUsers || 0;
  const proCustomers = metrics?.proSubscribers || 0;
  const activeCustomers = metrics?.activeUsers || 0;
  const starterActive = Math.max(0, activeCustomers - proCustomers);

  // Simulate upgrade scores based on aggregate engagement signals
  // In production, this would score individual customers
  const avgLogins = platformActivity.length > 0
    ? platformActivity.reduce((s, d) => s + d.logins, 0) / platformActivity.length
    : 0;
  const totalRecords = featureUsage.reduce((s, f) => s + f.records, 0);
  const modulesUsed = featureUsage.filter(f => f.records > 0).length;

  // Estimate conversion likelihood from engagement signals
  let baseScore = 30;
  if (avgLogins > 3) baseScore += 20;
  if (avgLogins > 7) baseScore += 10;
  if (totalRecords > 20) baseScore += 15;
  if (modulesUsed >= 3) baseScore += 15;
  const upgradeScore = Math.min(95, baseScore);

  // Estimate how many are likely to convert
  const estimatedConversions = Math.max(0, Math.round(starterActive * (upgradeScore / 100) * 0.3));
  const potentialRevenue = estimatedConversions * 199; // PRO price assumption

  // Top candidates (aggregate-level since we don't have individual user data here)
  const candidates = [];
  if (starterActive > 0) {
    const tiers = [
      { label: "High engagement users", score: Math.min(95, upgradeScore + 10), count: Math.max(1, Math.round(starterActive * 0.2)) },
      { label: "Medium engagement users", score: upgradeScore, count: Math.max(1, Math.round(starterActive * 0.3)) },
      { label: "Low engagement users", score: Math.max(20, upgradeScore - 25), count: Math.max(1, Math.round(starterActive * 0.5)) },
    ];
    tiers.forEach(t => {
      if (t.count > 0) candidates.push(t);
    });
  }

  let recommendation;
  if (starterActive === 0) {
    recommendation = "No active Starter customers available for upgrade targeting. Focus on acquisition first.";
  } else if (upgradeScore >= 70) {
    recommendation = `${starterActive} active Starter customer(s) show strong engagement. Direct outreach with feature comparison will likely drive conversions.`;
  } else if (upgradeScore >= 50) {
    recommendation = "Moderate engagement detected. Introduce time-limited trials or feature previews to demonstrate PRO value.";
  } else {
    recommendation = "Engagement is low. Improve onboarding and feature adoption before targeting upgrades.";
  }

  return {
    starterActive,
    upgradeScore,
    estimatedConversions,
    potentialRevenue,
    candidates,
    confidence: Math.min(85, Math.max(25, upgradeScore - 10)),
    recommendation,
  };
}

// ═══ CHURN PREDICTIONS ══════════════════════════════════════

export function getChurnPredictions(data) {
  const { metrics, platformActivity, featureUsage, customerHealth } = data;

  const totalCustomers = metrics?.totalUsers || 0;
  const activeCustomers = metrics?.activeUsers || 0;
  const inactive = totalCustomers - activeCustomers;

  // Calculate churn risk signals
  const avgLogins = platformActivity.length > 0
    ? platformActivity.reduce((s, d) => s + d.logins, 0) / platformActivity.length
    : 0;
  const totalRecords = featureUsage.reduce((s, f) => s + f.records, 0);
  const healthyCount = customerHealth.filter(c => c.name === "Healthy").reduce((s, c) => s + c.value, 0);
  const totalHealth = customerHealth.reduce((s, c) => s + c.value, 0);
  const atRiskCount = totalHealth - healthyCount;

  // Risk score (higher = more churn likely)
  let riskScore = 20;
  if (inactive > activeCustomers && totalCustomers > 2) riskScore += 30;
  else if (inactive > 0) riskScore += 15;
  if (avgLogins < 2) riskScore += 20;
  if (totalRecords === 0 && totalCustomers > 0) riskScore += 20;
  if (atRiskCount > healthyCount) riskScore += 15;
  riskScore = Math.min(95, riskScore);

  // Build at-risk segments
  const segments = [];
  if (inactive > 0) {
    segments.push({
      segment: "Inactive customers",
      count: inactive,
      riskLevel: "high",
      reason: "No login activity in the last 30 days.",
      intervention: "Personal outreach email + phone call within 48 hours.",
    });
  }
  if (atRiskCount > 0) {
    segments.push({
      segment: "Declining engagement",
      count: atRiskCount,
      riskLevel: atRiskCount > 2 ? "high" : "medium",
      reason: "Feature usage and login frequency decreasing.",
      intervention: "Schedule product walkthrough and gather feedback on pain points.",
    });
  }
  if (totalRecords === 0 && totalCustomers > 0) {
    segments.push({
      segment: "Zero feature adoption",
      count: totalCustomers,
      riskLevel: "medium",
      reason: "No records created in any module — value not yet demonstrated.",
      intervention: "Guided onboarding session focusing on the highest-value module for their farm type.",
    });
  }

  // Estimated churn (customers likely to become permanently inactive)
  const estimatedChurn = Math.round(inactive * 0.4); // 40% of inactive likely to permanently churn

  let recommendation;
  if (riskScore >= 70) {
    recommendation = `High churn risk detected. ${inactive} inactive customer(s) require urgent intervention. Personal outreach should begin today.`;
  } else if (riskScore >= 45) {
    recommendation = "Moderate churn risk. Schedule proactive check-ins with less engaged customers this week.";
  } else if (inactive > 0) {
    recommendation = `Low churn risk overall, but ${inactive} customer(s) remain inactive. Monitor engagement trends.`;
  } else {
    recommendation = "No significant churn risk detected. All customers are actively engaged.";
  }

  return {
    riskScore,
    inactive,
    atRiskCount,
    estimatedChurn,
    segments,
    confidence: Math.min(80, Math.max(30, 50 + (totalCustomers > 5 ? 15 : 0) + (platformActivity.length >= 7 ? 10 : 0))),
    recommendation,
  };
}

// ═══ ENGAGEMENT FORECAST ════════════════════════════════════

export function getEngagementForecast(data) {
  const { platformActivity, featureUsage, metrics } = data;

  const totalLogins = platformActivity.reduce((s, d) => s + d.logins, 0);
  const avgDaily = platformActivity.length > 0 ? Math.round(totalLogins / platformActivity.length) : 0;

  // Weekly trend
  const firstHalf = platformActivity.slice(0, Math.ceil(platformActivity.length / 2));
  const secondHalf = platformActivity.slice(Math.ceil(platformActivity.length / 2));
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.logins, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.logins, 0) / secondHalf.length : 0;
  const weeklyTrend = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

  // Project next week
  const projectedDailyLogins = Math.max(0, Math.round(avgDaily * (1 + weeklyTrend / 100)));
  const projectedWeeklyLogins = projectedDailyLogins * 7;

  // Feature adoption forecast
  const totalRecords = featureUsage.reduce((s, f) => s + f.records, 0);
  const modulesUsed = featureUsage.filter(f => f.records > 0).length;
  const totalModules = featureUsage.length;
  const adoptionPct = totalModules > 0 ? Math.round((modulesUsed / totalModules) * 100) : 0;

  const trend = weeklyTrend > 10 ? "increasing" : weeklyTrend < -10 ? "decreasing" : "stable";

  let confidence = 40;
  if (platformActivity.length >= 7) confidence += 25;
  if (totalLogins > 10) confidence += 15;
  if (metrics?.totalUsers > 3) confidence += 10;
  confidence = Math.min(85, confidence);

  let recommendation;
  if (avgDaily === 0) {
    recommendation = "No engagement data available for forecasting. Focus on getting first daily active users.";
  } else if (trend === "decreasing") {
    recommendation = "Engagement declining. Send re-activation campaigns and investigate potential UX friction points.";
  } else if (trend === "increasing") {
    recommendation = "Engagement increasing — capitalise on momentum with new feature announcements and community building.";
  } else {
    recommendation = "Engagement is stable. Introduce gamification or progress milestones to drive daily return visits.";
  }

  return {
    avgDaily,
    projectedDailyLogins,
    projectedWeeklyLogins,
    weeklyTrend,
    trend,
    adoptionPct,
    modulesUsed,
    totalModules,
    confidence,
    recommendation,
  };
}

// ═══ EXECUTIVE FORECAST ═════════════════════════════════════

export function getExecutiveForecast(data, predictions) {
  const { metrics } = data;
  const { revenueForecast, growthForecast, upgradePredictions, churnPredictions } = predictions || {};

  const hour = new Date().getHours();

  // Next 30 days projection
  const expectedCustomers = growthForecast?.expectedTotalCustomers || (metrics?.totalUsers || 0);
  const expectedPRO = (metrics?.proSubscribers || 0) + (upgradePredictions?.estimatedConversions || 0);
  const expectedMRR = revenueForecast?.projectedMRR || (metrics?.revenueMonth || 0);
  const expectedChurn = churnPredictions?.estimatedChurn || 0;

  // Business health projection
  const currentHealth = _estimateHealthScore(data);
  let projectedHealth = currentHealth;
  if (growthForecast?.trend === "accelerating") projectedHealth += 5;
  if (revenueForecast?.trend === "growing") projectedHealth += 5;
  if (churnPredictions?.riskScore > 60) projectedHealth -= 10;
  if (upgradePredictions?.estimatedConversions > 0) projectedHealth += 3;
  projectedHealth = Math.min(100, Math.max(0, projectedHealth));

  // Confidence (average of sub-forecasts)
  const confidences = [
    revenueForecast?.confidence || 40,
    growthForecast?.confidence || 40,
    upgradePredictions?.confidence || 40,
    churnPredictions?.confidence || 40,
  ];
  const overallConfidence = Math.round(confidences.reduce((s, c) => s + c, 0) / confidences.length);

  // Executive priorities (top 5)
  const priorities = _generatePriorities(data, predictions);

  // Trend indicators for KPIs
  const trends = _generateTrendIndicators(data);

  // Executive timeline summary
  const timeline = _generateTimeline(data, predictions);

  // Three-horizon summary
  const summary = _generateThreeHorizonSummary(data, predictions);

  return {
    forecast: {
      expectedCustomers,
      expectedPRO,
      expectedMRR,
      expectedChurn,
      projectedHealth,
      confidence: overallConfidence,
    },
    priorities,
    trends,
    timeline,
    summary,
  };
}

// ═══ INTERNAL HELPERS ═══════════════════════════════════════

function _estimateHealthScore(data) {
  const { metrics, health, platformActivity, customerHealth } = data;
  let score = 50;
  if ((metrics?.activeUsers || 0) > 0) score += 15;
  if ((metrics?.revenueMonth || 0) > 0) score += 15;
  if (health) {
    const pct = Object.values(health.services).filter(s => s.status === "healthy").length / Object.values(health.services).length;
    score += Math.round(pct * 10);
  }
  const avgLogins = platformActivity.length > 0
    ? platformActivity.reduce((s, d) => s + d.logins, 0) / platformActivity.length : 0;
  if (avgLogins > 3) score += 10;
  return Math.min(100, score);
}

function _generatePriorities(data, predictions) {
  const { metrics } = data;
  const { revenueForecast, growthForecast, upgradePredictions, churnPredictions } = predictions || {};
  const priorities = [];

  // Critical churn risk
  if (churnPredictions?.riskScore >= 60) {
    priorities.push({
      priority: 1,
      title: "Address churn risk",
      description: churnPredictions.recommendation,
      impact: "high",
      effort: "medium",
      area: "Retention",
      outcome: `Prevent ${churnPredictions.estimatedChurn} potential lost customer(s).`,
    });
  }

  // Upgrade opportunity
  if (upgradePredictions?.starterActive > 0) {
    priorities.push({
      priority: 2,
      title: "Convert upgrade candidates",
      description: upgradePredictions.recommendation,
      impact: "high",
      effort: "low",
      area: "Revenue",
      outcome: `Potential R${upgradePredictions.potentialRevenue}/month additional MRR.`,
    });
  }

  // Growth action
  if (growthForecast?.expectedNewCustomers === 0) {
    priorities.push({
      priority: 3,
      title: "Activate acquisition channels",
      description: growthForecast.recommendation,
      impact: "high",
      effort: "high",
      area: "Growth",
      outcome: "Establish consistent customer pipeline.",
    });
  }

  // Revenue protection
  if ((metrics?.pendingPayments || 0) > 0) {
    priorities.push({
      priority: 4,
      title: "Resolve pending payments",
      description: `${metrics.pendingPayments} payment(s) outstanding. Follow up to protect MRR.`,
      impact: "medium",
      effort: "low",
      area: "Finance",
      outcome: "Maintain cash flow continuity.",
    });
  }

  // Engagement
  if (data.platformActivity.length > 0) {
    const avg = data.platformActivity.reduce((s, d) => s + d.logins, 0) / data.platformActivity.length;
    if (avg < 3 && (metrics?.totalUsers || 0) > 0) {
      priorities.push({
        priority: 5,
        title: "Improve daily engagement",
        description: "Average logins below 3/day. Send feature highlights and usage tips.",
        impact: "medium",
        effort: "low",
        area: "Engagement",
        outcome: "Increase daily active users and reduce churn risk.",
      });
    }
  }

  // Always have at least one priority
  if (priorities.length === 0) {
    priorities.push({
      priority: 1,
      title: "Monitor platform health",
      description: "No urgent actions required. Continue monitoring engagement and growth metrics.",
      impact: "low",
      effort: "low",
      area: "Operations",
      outcome: "Maintain operational excellence.",
    });
  }

  return priorities.slice(0, 5);
}

function _generateTrendIndicators(data) {
  const { metrics, growth, revenue, platformActivity } = data;

  // Customer trend
  const latestGrowth = growth.length > 0 ? growth[growth.length - 1] : null;
  const prevGrowth = growth.length > 1 ? growth[growth.length - 2] : null;
  const customerTrend = prevGrowth?.totalCustomers > 0
    ? Math.round(((latestGrowth?.totalCustomers - prevGrowth.totalCustomers) / prevGrowth.totalCustomers) * 100)
    : 0;

  // Revenue trend
  const latestRev = revenue.length > 0 ? revenue[revenue.length - 1]?.revenue || 0 : 0;
  const prevRev = revenue.length > 1 ? revenue[revenue.length - 2]?.revenue || 0 : 0;
  const revenueTrend = prevRev > 0 ? Math.round(((latestRev - prevRev) / prevRev) * 100) : 0;

  // Activity trend (compare first half vs second half of week)
  const firstHalf = platformActivity.slice(0, Math.ceil(platformActivity.length / 2));
  const secondHalf = platformActivity.slice(Math.ceil(platformActivity.length / 2));
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.logins, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.logins, 0) / secondHalf.length : 0;
  const activityTrend = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

  return {
    customers: { value: customerTrend, direction: customerTrend > 0 ? "up" : customerTrend < 0 ? "down" : "stable" },
    revenue: { value: revenueTrend, direction: revenueTrend > 0 ? "up" : revenueTrend < 0 ? "down" : "stable" },
    activity: { value: activityTrend, direction: activityTrend > 0 ? "up" : activityTrend < 0 ? "down" : "stable" },
    health: { value: 0, direction: "stable" }, // infrastructure doesn't trend in current data
  };
}

function _generateTimeline(data, predictions) {
  const { metrics, activity } = data;
  const events = [];

  // Use recent activity if available
  if (activity && activity.length > 0) {
    activity.slice(0, 5).forEach(item => {
      const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "--:--";
      events.push({
        time,
        type: item.type || "event",
        description: item.description || "Platform event",
        icon: item.type === "signup" ? "👤" : item.type === "payment" ? "💰" : "📋",
      });
    });
  }

  // Add intelligence events
  if (predictions?.churnPredictions?.riskScore >= 60) {
    events.push({ time: "Now", type: "risk", description: "Churn risk detected — intervention recommended", icon: "⚠️" });
  }
  if (predictions?.upgradePredictions?.estimatedConversions > 0) {
    events.push({ time: "Now", type: "opportunity", description: `${predictions.upgradePredictions.estimatedConversions} upgrade candidate(s) identified`, icon: "🚀" });
  }

  return events.slice(0, 7);
}

function _generateThreeHorizonSummary(data, predictions) {
  const { metrics, growth } = data;
  const { revenueForecast, growthForecast, upgradePredictions } = predictions || {};

  // Yesterday
  const yesterdayLines = [];
  const latestGrowth = growth.length > 0 ? growth[growth.length - 1] : null;
  if (latestGrowth?.newCustomers > 0) {
    yesterdayLines.push(`${latestGrowth.newCustomers} new customer(s) joined the platform.`);
  } else {
    yesterdayLines.push("No new registrations recorded in the latest period.");
  }
  if ((metrics?.revenueMonth || 0) > 0) {
    yesterdayLines.push("Revenue collection continued as expected.");
  }

  // Today
  const todayLines = [];
  todayLines.push(`Platform is operational with ${metrics?.activeUsers || 0} active customer(s).`);
  if (upgradePredictions?.starterActive > 0) {
    todayLines.push(`${upgradePredictions.starterActive} customer(s) showing upgrade potential.`);
  }
  if ((metrics?.pendingPayments || 0) > 0) {
    todayLines.push(`${metrics.pendingPayments} payment(s) require follow-up.`);
  }

  // Tomorrow (projection)
  const tomorrowLines = [];
  if (revenueForecast?.projectedMRR > (metrics?.revenueMonth || 0)) {
    tomorrowLines.push(`MRR projected to grow to R${revenueForecast.projectedMRR} if current trajectory holds.`);
  }
  if (upgradePredictions?.estimatedConversions > 0) {
    tomorrowLines.push(`${upgradePredictions.estimatedConversions} PRO conversion(s) expected — potential R${upgradePredictions.potentialRevenue}/month additional revenue.`);
  }
  if (growthForecast?.expectedNewCustomers > 0) {
    tomorrowLines.push(`${growthForecast.expectedNewCustomers} new customer(s) projected based on current acquisition rate.`);
  }
  if (tomorrowLines.length === 0) {
    tomorrowLines.push("Continue current operations. Growth will follow consistent execution.");
  }

  return {
    yesterday: yesterdayLines.join(" "),
    today: todayLines.join(" "),
    tomorrow: tomorrowLines.join(" "),
  };
}
