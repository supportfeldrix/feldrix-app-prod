/**
 * ============================================================
 * Feldrix Control Centre — Executive Intelligence Engine
 * Version 2.3.0 — Phase 1
 *
 * Transforms raw dashboard metrics into executive-grade insights,
 * risk assessments, opportunity identification, and actionable
 * recommendations.
 *
 * All analysis uses existing dashboard data passed in —
 * NO additional API calls are made by this service.
 *
 * Structured so an LLM can later replace the rule engine
 * without changing the consuming UI contract.
 * ============================================================
 */

/**
 * @typedef {Object} ExecutiveOverview
 * @property {number} healthScore - 0–100
 * @property {'excellent'|'healthy'|'attention'|'critical'} status
 * @property {string} summary
 * @property {Object} breakdown - per-dimension scores
 */

/**
 * @typedef {Object} IntelligenceInput
 * @property {Object} metrics - from getDashboardMetrics()
 * @property {Object} health - from getSystemHealth()
 * @property {Array} growth - from getCustomerGrowth()
 * @property {Array} revenue - from getRevenueGrowth()
 * @property {Array} subBreakdown - from getSubscriptionBreakdown()
 * @property {Array} platformActivity - from getPlatformActivity()
 * @property {Array} featureUsage - from getFeatureUsage()
 * @property {Array} customerHealth - from getCustomerHealthDistribution()
 */

// ═══ MAIN EXPORT ════════════════════════════════════════════

/**
 * Runs the full intelligence analysis pipeline.
 * Call once with all dashboard data — returns structured intelligence.
 */
export function runIntelligenceAnalysis(data) {
  const overview = getExecutiveOverview(data);
  const growth = getGrowthAnalysis(data);
  const revenue = getRevenueAnalysis(data);
  const customer = getCustomerAnalysis(data);
  const platform = getPlatformAnalysis(data);
  const risks = getRiskAnalysis(data);
  const opportunities = getOpportunityAnalysis(data);
  const summary = getExecutiveSummary(data, { overview, growth, revenue, risks, opportunities });

  return { overview, growth, revenue, customer, platform, risks, opportunities, summary };
}

// ═══ EXECUTIVE OVERVIEW ═════════════════════════════════════

export function getExecutiveOverview(data) {
  const { metrics, health, growth, revenue, platformActivity, customerHealth } = data;

  // Score each dimension (0–100)
  const growthScore = _scoreGrowth(metrics, growth);
  const revenueScore = _scoreRevenue(metrics, revenue);
  const usageScore = _scoreUsage(platformActivity);
  const healthScore = _scoreCustomerHealth(customerHealth);
  const infraScore = _scoreInfrastructure(health);

  // Weighted composite
  const composite = Math.round(
    growthScore * 0.25 +
    revenueScore * 0.25 +
    usageScore * 0.2 +
    healthScore * 0.2 +
    infraScore * 0.1
  );

  const status = composite >= 80 ? "excellent" : composite >= 60 ? "healthy" : composite >= 40 ? "attention" : "critical";

  const summaryMap = {
    excellent: "Feldrix is performing exceptionally across all dimensions.",
    healthy: "Feldrix is operating well with room for optimisation.",
    attention: "Several areas require attention to maintain growth trajectory.",
    critical: "Immediate action required — multiple dimensions are underperforming.",
  };

  return {
    healthScore: composite,
    status,
    summary: summaryMap[status],
    breakdown: {
      growth: { score: growthScore, label: "Customer Growth" },
      revenue: { score: revenueScore, label: "Revenue" },
      usage: { score: usageScore, label: "Platform Usage" },
      customerHealth: { score: healthScore, label: "Customer Health" },
      infrastructure: { score: infraScore, label: "Infrastructure" },
    },
  };
}

// ═══ GROWTH ANALYSIS ════════════════════════════════════════

export function getGrowthAnalysis(data) {
  const { metrics, growth } = data;

  const totalCustomers = metrics?.totalUsers || 0;
  const latest = growth.length > 0 ? growth[growth.length - 1] : null;
  const previous = growth.length > 1 ? growth[growth.length - 2] : null;
  const newThisMonth = latest?.newCustomers || 0;
  const prevNew = previous?.newCustomers || 0;

  const growthPct = previous?.totalCustomers > 0
    ? Math.round(((latest?.totalCustomers - previous.totalCustomers) / previous.totalCustomers) * 100)
    : 0;

  const acceleration = prevNew > 0
    ? Math.round(((newThisMonth - prevNew) / prevNew) * 100)
    : 0;

  const momentum = acceleration > 10 ? "accelerating" : acceleration > -10 ? "stable" : "decelerating";

  let recommendation;
  if (momentum === "decelerating") {
    recommendation = "Customer acquisition has slowed. Marketing campaigns and referral incentives should become the next priority.";
  } else if (momentum === "stable" && newThisMonth === 0) {
    recommendation = "No new customers this month. Focus on outreach, content marketing, and activation of existing leads.";
  } else if (momentum === "accelerating") {
    recommendation = "Growth is accelerating. Ensure onboarding capacity can handle increased sign-ups and maintain quality.";
  } else {
    recommendation = "Growth is steady. Continue current acquisition strategies and monitor for emerging channels.";
  }

  return {
    totalCustomers,
    newThisMonth,
    growthPct,
    acceleration,
    momentum,
    recommendation,
    monthlyTrend: growth.map(g => ({ month: g.month, new: g.newCustomers, total: g.totalCustomers })),
  };
}

// ═══ REVENUE ANALYSIS ═══════════════════════════════════════

export function getRevenueAnalysis(data) {
  const { metrics, revenue, subBreakdown } = data;

  const mrr = metrics?.revenueMonth || 0;
  const arr = mrr * 12;
  const totalCustomers = metrics?.totalUsers || 0;
  const proCustomers = metrics?.proSubscribers || 0;
  const arpc = totalCustomers > 0 ? Math.round((mrr / Math.max(totalCustomers, 1)) * 100) / 100 : 0;
  const conversionRate = totalCustomers > 0 ? Math.round((proCustomers / totalCustomers) * 100) : 0;
  const outstanding = metrics?.pendingPayments || 0;

  const latestRev = revenue.length > 0 ? revenue[revenue.length - 1]?.revenue || 0 : 0;
  const prevRev = revenue.length > 1 ? revenue[revenue.length - 2]?.revenue || 0 : 0;
  const revGrowth = prevRev > 0 ? Math.round(((latestRev - prevRev) / prevRev) * 100) : 0;

  let recommendation;
  if (mrr === 0) {
    recommendation = "No revenue yet. Converting the first PRO subscriber is the highest-priority objective — it validates pricing and establishes the revenue baseline.";
  } else if (outstanding > 0) {
    recommendation = `${outstanding} payment(s) outstanding. Resolve immediately to protect cash flow and MRR projections.`;
  } else if (conversionRate < 10) {
    recommendation = "PRO conversion rate is below 10%. Consider introducing a trial period, feature gating, or targeted upgrade campaigns.";
  } else if (revGrowth < 0) {
    recommendation = "Revenue declined this period. Investigate churn, failed payments, and subscription downgrades.";
  } else {
    recommendation = "Revenue trajectory is positive. Focus on expansion revenue through upsells and reducing voluntary churn.";
  }

  return { mrr, arr, arpc, conversionRate, outstanding, revGrowth, recommendation };
}

// ═══ CUSTOMER ANALYSIS ══════════════════════════════════════

export function getCustomerAnalysis(data) {
  const { metrics, customerHealth, subBreakdown } = data;

  const total = metrics?.totalUsers || 0;
  const active = metrics?.activeUsers || 0;
  const inactive = total - active;
  const pro = metrics?.proSubscribers || 0;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  const proPct = total > 0 ? Math.round((pro / total) * 100) : 0;

  const healthyCount = customerHealth.filter(c => c.name === "Healthy").reduce((s, c) => s + c.value, 0);
  const totalHealth = customerHealth.reduce((s, c) => s + c.value, 0);
  const healthyPct = totalHealth > 0 ? Math.round((healthyCount / totalHealth) * 100) : 0;
  const atRisk = totalHealth - healthyCount;

  let recommendation;
  if (inactive > active && total > 2) {
    recommendation = `${inactive} customers are inactive — more than half the base. Prioritise re-engagement campaigns and personal outreach.`;
  } else if (proPct === 0 && total > 0) {
    recommendation = "No PRO subscribers yet. Identify the most active Starter customers and target them with upgrade messaging.";
  } else if (atRisk > 0) {
    recommendation = `${atRisk} customer(s) in at-risk segments. Proactive outreach can prevent churn — schedule check-ins this week.`;
  } else {
    recommendation = "Customer base is healthy and engaged. Continue monitoring engagement signals for early warning signs.";
  }

  return {
    total, active, inactive, pro,
    activePct, proPct, healthyPct, atRisk,
    recommendation,
    segments: customerHealth,
  };
}

// ═══ PLATFORM ANALYSIS ══════════════════════════════════════

export function getPlatformAnalysis(data) {
  const { platformActivity, featureUsage, health } = data;

  const totalLogins = platformActivity.reduce((s, d) => s + d.logins, 0);
  const avgDaily = platformActivity.length > 0 ? Math.round(totalLogins / platformActivity.length) : 0;
  const peakDay = platformActivity.length > 0
    ? platformActivity.reduce((max, d) => d.logins > max.logins ? d : max, platformActivity[0])
    : null;

  const sortedFeatures = [...featureUsage].sort((a, b) => b.records - a.records);
  const mostUsed = sortedFeatures[0] || null;
  const leastUsed = sortedFeatures[sortedFeatures.length - 1] || null;
  const activeModules = sortedFeatures.filter(f => f.records > 0).length;
  const totalModules = sortedFeatures.length;
  const adoptionPct = totalModules > 0 ? Math.round((activeModules / totalModules) * 100) : 0;

  const healthPct = health
    ? Math.round((Object.values(health.services).filter(s => s.status === "healthy").length / Object.values(health.services).length) * 100)
    : 0;

  let recommendation;
  if (avgDaily === 0) {
    recommendation = "No login activity recorded. Verify platform accessibility and consider activation campaigns.";
  } else if (adoptionPct < 50) {
    recommendation = `Only ${adoptionPct}% of modules are being used. ${leastUsed?.name ? `Promote ${leastUsed.name} through in-app guidance and feature education.` : "Introduce feature discovery flows."}`;
  } else if (healthPct < 80) {
    recommendation = "Platform health is below 80%. Investigate degraded services before they impact user experience.";
  } else {
    recommendation = `Platform is healthy. ${mostUsed?.name || "Core features"} leads adoption — consider deepening this module's capabilities.`;
  }

  return {
    totalLogins, avgDaily, peakDay,
    mostUsed, leastUsed,
    activeModules, totalModules, adoptionPct,
    healthPct,
    recommendation,
  };
}

// ═══ RISK ANALYSIS ══════════════════════════════════════════

export function getRiskAnalysis(data) {
  const { metrics, growth, revenue, platformActivity, customerHealth, health } = data;
  const risks = [];

  // Falling growth
  if (growth.length > 1) {
    const latest = growth[growth.length - 1];
    const prev = growth[growth.length - 2];
    if (latest?.newCustomers < prev?.newCustomers) {
      risks.push({
        priority: "warning",
        category: "Growth",
        title: "Customer acquisition declining",
        detail: `New customers dropped from ${prev.newCustomers} to ${latest.newCustomers} month-over-month.`,
        action: "Increase marketing spend or activate referral programmes.",
      });
    }
  }

  // No growth at all
  if (growth.length > 0 && (growth[growth.length - 1]?.newCustomers || 0) === 0) {
    risks.push({
      priority: "critical",
      category: "Growth",
      title: "Zero new customers this month",
      detail: "No new registrations recorded in the current period.",
      action: "Urgent: review acquisition channels and remove sign-up friction.",
    });
  }

  // High inactivity
  const total = metrics?.totalUsers || 0;
  const active = metrics?.activeUsers || 0;
  if (total > 2 && active < total * 0.5) {
    risks.push({
      priority: "warning",
      category: "Engagement",
      title: "High customer inactivity",
      detail: `${total - active} of ${total} customers are inactive (${Math.round(((total - active) / total) * 100)}%).`,
      action: "Launch re-engagement email campaign and personal outreach to dormant accounts.",
    });
  }

  // Low PRO conversion
  const pro = metrics?.proSubscribers || 0;
  if (total > 3 && pro === 0) {
    risks.push({
      priority: "warning",
      category: "Revenue",
      title: "Zero PRO conversions",
      detail: "No customers have upgraded to a paid plan.",
      action: "Introduce trial periods, feature-gated experiences, or direct sales outreach.",
    });
  }

  // Revenue decline
  if (revenue.length > 1) {
    const latestRev = revenue[revenue.length - 1]?.revenue || 0;
    const prevRev = revenue[revenue.length - 2]?.revenue || 0;
    if (latestRev < prevRev && prevRev > 0) {
      risks.push({
        priority: "critical",
        category: "Revenue",
        title: "Revenue declining",
        detail: `MRR dropped from R${prevRev} to R${latestRev}.`,
        action: "Investigate churn, failed payments, and subscription cancellations immediately.",
      });
    }
  }

  // Service degradation
  if (health) {
    const degraded = Object.entries(health.services).filter(([, s]) => s.status !== "healthy");
    if (degraded.length > 0) {
      risks.push({
        priority: degraded.length > 2 ? "critical" : "warning",
        category: "Infrastructure",
        title: `${degraded.length} service(s) degraded`,
        detail: `Affected: ${degraded.map(([n]) => n).join(", ")}.`,
        action: "Investigate service health and restore before user-facing impact.",
      });
    }
  }

  // Low platform activity
  const avgLogins = platformActivity.length > 0
    ? platformActivity.reduce((s, d) => s + d.logins, 0) / platformActivity.length
    : 0;
  if (avgLogins === 0 && total > 0) {
    risks.push({
      priority: "critical",
      category: "Engagement",
      title: "No platform activity",
      detail: "Zero logins recorded in the last 7 days.",
      action: "Verify platform accessibility. Send activation emails to all registered customers.",
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, warning: 1, information: 2 };
  risks.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  return { risks, topRisk: risks[0] || null, count: risks.length };
}

// ═══ OPPORTUNITY ANALYSIS ═══════════════════════════════════

export function getOpportunityAnalysis(data) {
  const { metrics, featureUsage, customerHealth, subBreakdown, platformActivity } = data;
  const opportunities = [];

  // Upgrade candidates (active Starter users)
  const total = metrics?.totalUsers || 0;
  const pro = metrics?.proSubscribers || 0;
  const active = metrics?.activeUsers || 0;
  const starterActive = active - pro; // approximation
  if (starterActive > 0) {
    opportunities.push({
      category: "Conversion",
      title: `${starterActive} active customer(s) ready to upgrade`,
      detail: "These customers are actively using the platform on a free plan — they've demonstrated value realisation.",
      potential: starterActive > 3 ? "high" : "medium",
      action: "Send targeted upgrade campaigns with feature comparison and ROI messaging.",
    });
  }

  // Feature adoption opportunity
  const sortedFeatures = [...featureUsage].sort((a, b) => b.records - a.records);
  const underused = sortedFeatures.filter(f => f.records === 0);
  if (underused.length > 0) {
    opportunities.push({
      category: "Adoption",
      title: `${underused.length} module(s) with zero adoption`,
      detail: `${underused.map(f => f.name).join(", ")} have not been used. Feature education could increase platform stickiness.`,
      potential: "medium",
      action: "Create in-app tooltips, onboarding flows, or email campaigns highlighting unused features.",
    });
  }

  // Top module deepening
  const topModule = sortedFeatures[0];
  if (topModule && topModule.records > 0) {
    opportunities.push({
      category: "Product",
      title: `${topModule.name} is the highest-adoption module`,
      detail: `${topModule.records} records created. Deepening this module's capabilities will increase perceived value.`,
      potential: "high",
      action: `Invest in advanced ${topModule.name.toLowerCase()} features — this is where customers find the most value.`,
    });
  }

  // Re-engagement opportunity
  const inactive = total - active;
  if (inactive > 0) {
    opportunities.push({
      category: "Retention",
      title: `${inactive} inactive customer(s) to re-engage`,
      detail: "Dormant customers represent potential revenue if reactivated before permanent churn.",
      potential: inactive > 3 ? "high" : "low",
      action: "Schedule personal check-ins or automated win-back email sequences.",
    });
  }

  // Revenue from conversion
  if (pro === 0 && total > 0) {
    const potentialMRR = total * 199; // Assumed PRO price
    opportunities.push({
      category: "Revenue",
      title: "First PRO conversion unlocks recurring revenue",
      detail: `${total} Starter customers represent up to R${potentialMRR}/month in potential MRR if fully converted.`,
      potential: "high",
      action: "Focus on converting the single most active customer first — use as a case study for others.",
    });
  }

  return {
    opportunities,
    topOpportunity: opportunities.find(o => o.potential === "high") || opportunities[0] || null,
    count: opportunities.length,
  };
}

// ═══ EXECUTIVE SUMMARY ══════════════════════════════════════

export function getExecutiveSummary(data, analysis) {
  const { metrics } = data;
  const { overview, growth, revenue, risks, opportunities } = analysis || {};
  const hour = new Date().getHours();

  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const lines = [];

  // Health status
  if (overview) {
    lines.push(`Business health is ${overview.status} (score: ${overview.healthScore}/100).`);
  }

  // Growth insight
  if (growth) {
    if (growth.newThisMonth > 0) {
      lines.push(`${growth.newThisMonth} new customer(s) acquired this month — momentum is ${growth.momentum}.`);
    } else {
      lines.push("No new customers this month. Acquisition should be the primary focus.");
    }
  }

  // Revenue insight
  if (revenue) {
    if (revenue.mrr > 0) {
      lines.push(`Revenue is R${revenue.mrr}/month (projected ARR: R${revenue.arr}).`);
    } else {
      lines.push("No revenue recorded yet. PRO conversion is the path to monetisation.");
    }
  }

  // Risk highlight
  if (risks?.topRisk) {
    lines.push(`Top risk: ${risks.topRisk.title}.`);
  }

  // Opportunity highlight
  if (opportunities?.topOpportunity) {
    lines.push(`Top opportunity: ${opportunities.topOpportunity.title}.`);
  }

  // Today's focus
  let todaysFocus;
  if (risks?.topRisk?.priority === "critical") {
    todaysFocus = risks.topRisk.action;
  } else if (opportunities?.topOpportunity) {
    todaysFocus = opportunities.topOpportunity.action;
  } else if (growth?.recommendation) {
    todaysFocus = growth.recommendation;
  } else {
    todaysFocus = "Monitor platform health and customer engagement.";
  }

  return {
    greeting,
    period,
    briefing: lines.join(" "),
    todaysFocus,
    topRisk: risks?.topRisk || null,
    topOpportunity: opportunities?.topOpportunity || null,
    recommendation: todaysFocus,
  };
}

// ═══ INTERNAL SCORING FUNCTIONS ═════════════════════════════

function _scoreGrowth(metrics, growth) {
  if (!metrics || !growth || growth.length === 0) return 30;
  const total = metrics.totalUsers || 0;
  if (total === 0) return 10;
  const latest = growth[growth.length - 1];
  const newThisMonth = latest?.newCustomers || 0;
  if (newThisMonth === 0) return 30;
  // Score based on growth rate relative to base
  const rate = total > 0 ? (newThisMonth / total) * 100 : 0;
  if (rate >= 20) return 95;
  if (rate >= 10) return 80;
  if (rate >= 5) return 65;
  return 50;
}

function _scoreRevenue(metrics, revenue) {
  if (!metrics) return 20;
  const mrr = metrics.revenueMonth || 0;
  const pending = metrics.pendingPayments || 0;
  if (mrr === 0 && (metrics.totalUsers || 0) === 0) return 50; // no users yet = neutral
  if (mrr === 0) return 20; // users but no revenue
  let score = 70;
  if (pending > 0) score -= 15;
  // Revenue growth bonus
  if (revenue.length > 1) {
    const latest = revenue[revenue.length - 1]?.revenue || 0;
    const prev = revenue[revenue.length - 2]?.revenue || 0;
    if (latest > prev) score += 15;
    else if (latest < prev) score -= 15;
  }
  return Math.min(100, Math.max(0, score));
}

function _scoreUsage(platformActivity) {
  if (!platformActivity || platformActivity.length === 0) return 30;
  const total = platformActivity.reduce((s, d) => s + d.logins, 0);
  if (total === 0) return 15;
  const avg = total / platformActivity.length;
  if (avg >= 20) return 95;
  if (avg >= 10) return 80;
  if (avg >= 5) return 65;
  if (avg >= 1) return 50;
  return 30;
}

function _scoreCustomerHealth(customerHealth) {
  if (!customerHealth || customerHealth.length === 0) return 50;
  const total = customerHealth.reduce((s, c) => s + c.value, 0);
  if (total === 0) return 50;
  const healthy = customerHealth.filter(c => c.name === "Healthy").reduce((s, c) => s + c.value, 0);
  const pct = (healthy / total) * 100;
  if (pct >= 80) return 90;
  if (pct >= 60) return 70;
  if (pct >= 40) return 50;
  return 30;
}

function _scoreInfrastructure(health) {
  if (!health) return 50;
  const services = Object.values(health.services);
  if (services.length === 0) return 50;
  const healthy = services.filter(s => s.status === "healthy").length;
  return Math.round((healthy / services.length) * 100);
}
