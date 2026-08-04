/**
 * ============================================================
 * Feldrix Control Centre — AI Operations Service
 * Version 2.4.0 — Phase 1
 *
 * Generates a prioritised operations queue, revenue opportunities,
 * urgent items, business impact estimates, and recommended actions.
 *
 * All analysis uses existing dashboard data — NO additional API calls.
 * Structured for future AI agent replacement.
 * ============================================================
 */

/**
 * Master pipeline — runs all operations analysis.
 * @param {Object} data - same IntelligenceInput shape
 * @param {Object} intelligence - output from runIntelligenceAnalysis
 * @param {Object} predictions - output from runPredictiveAnalysis
 */
export function runOperationsAnalysis(data, intelligence, predictions) {
  const queue = getOperationsQueue(data, intelligence, predictions);
  const actions = getRecommendedActions(data, intelligence, predictions);
  const impact = getBusinessImpact(data, intelligence, predictions);
  const urgent = getUrgentItems(data, intelligence, predictions);
  const revenueOps = getRevenueOpportunities(data, intelligence, predictions);
  const summary = getOperationalSummary(data, intelligence, predictions);

  return { queue, actions, impact, urgent, revenueOps, summary };
}

// ═══ OPERATIONS QUEUE ═══════════════════════════════════════

export function getOperationsQueue(data, intelligence, predictions) {
  const { metrics } = data;
  const items = [];
  let priority = 0;

  // 1. Urgent payment follow-ups
  const pending = metrics?.pendingPayments || 0;
  if (pending > 0) {
    priority++;
    items.push({
      priority,
      title: `Resolve ${pending} pending payment(s)`,
      reason: "Outstanding payments directly impact MRR and cash flow projections.",
      area: "Finance",
      impact: "high",
      effort: "15 minutes",
      action: "Review payment status and contact customers if needed.",
      route: "/payments",
      status: "pending",
      icon: "💳",
      estimatedRevenue: null,
    });
  }

  // 2. Upgrade candidates
  const upgradeCandidates = predictions?.upgradePredictions?.starterActive || 0;
  const potentialMRR = predictions?.upgradePredictions?.potentialRevenue || 0;
  if (upgradeCandidates > 0) {
    priority++;
    items.push({
      priority,
      title: `Contact ${upgradeCandidates} PRO-ready customer(s)`,
      reason: "Active Starter customers showing high engagement — strong upgrade signals.",
      area: "Revenue",
      impact: "high",
      effort: `${upgradeCandidates * 15} minutes`,
      action: "Schedule upgrade discussions with feature comparison.",
      route: "/users",
      status: "actionable",
      icon: "⭐",
      estimatedRevenue: potentialMRR,
      confidence: predictions?.upgradePredictions?.confidence || 50,
    });
  }

  // 3. Churn intervention
  const churnRisk = predictions?.churnPredictions?.riskScore || 0;
  const inactive = predictions?.churnPredictions?.inactive || 0;
  if (churnRisk >= 45 && inactive > 0) {
    priority++;
    items.push({
      priority,
      title: `Re-engage ${inactive} inactive customer(s)`,
      reason: "Customers at risk of permanent churn without intervention.",
      area: "Retention",
      impact: churnRisk >= 60 ? "high" : "medium",
      effort: `${inactive * 20} minutes`,
      action: "Personal outreach — phone call or personalised email.",
      route: "/users",
      status: "urgent",
      icon: "⚠️",
      estimatedRevenue: null,
    });
  }

  // 4. Feature adoption campaign
  const sortedFeatures = [...(data.featureUsage || [])].sort((a, b) => b.records - a.records);
  const underused = sortedFeatures.filter(f => f.records === 0);
  if (underused.length > 0 && (metrics?.totalUsers || 0) > 0) {
    priority++;
    items.push({
      priority,
      title: `Promote ${underused.length} unused module(s)`,
      reason: `${underused.map(f => f.name).join(", ")} have zero adoption — missed value opportunity.`,
      area: "Engagement",
      impact: "medium",
      effort: "30 minutes",
      action: "Create in-app guidance or email campaign highlighting benefits.",
      route: "/analytics",
      status: "planned",
      icon: "📊",
      estimatedRevenue: null,
    });
  }

  // 5. Onboarding follow-up (new customers not yet active)
  const total = metrics?.totalUsers || 0;
  const active = metrics?.activeUsers || 0;
  const newInactive = total - active;
  if (newInactive > 0 && total > 1) {
    priority++;
    items.push({
      priority,
      title: `Complete onboarding for ${newInactive} customer(s)`,
      reason: "Registered but not yet active — onboarding incomplete.",
      area: "Onboarding",
      impact: "medium",
      effort: `${newInactive * 10} minutes`,
      action: "Send welcome sequence and schedule guided tour.",
      route: "/notifications",
      status: "planned",
      icon: "🎓",
      estimatedRevenue: null,
    });
  }

  // 6. Platform health check
  if (data.health) {
    const degraded = Object.entries(data.health.services).filter(([, s]) => s.status !== "healthy");
    if (degraded.length > 0) {
      priority++;
      items.push({
        priority,
        title: `Investigate ${degraded.length} degraded service(s)`,
        reason: `${degraded.map(([n]) => n).join(", ")} not reporting healthy.`,
        area: "Infrastructure",
        impact: degraded.length > 2 ? "high" : "medium",
        effort: "10 minutes",
        action: "Check service status and restart if necessary.",
        route: "/settings",
        status: "urgent",
        icon: "🔧",
        estimatedRevenue: null,
      });
    }
  }

  // 7. Growth action if stagnant
  if (predictions?.growthForecast?.expectedNewCustomers === 0 && total > 0) {
    priority++;
    items.push({
      priority,
      title: "Activate acquisition channels",
      reason: "Zero new customers projected — pipeline is empty.",
      area: "Growth",
      impact: "high",
      effort: "60 minutes",
      action: "Launch marketing campaign or referral programme.",
      route: "/analytics",
      status: "planned",
      icon: "📈",
      estimatedRevenue: null,
    });
  }

  return { items: items.slice(0, 7), total: items.length };
}

// ═══ RECOMMENDED ACTIONS ════════════════════════════════════

export function getRecommendedActions(data, intelligence, predictions) {
  const queue = getOperationsQueue(data, intelligence, predictions);
  const topAction = queue.items[0] || null;

  // Generate natural language recommendation
  let narrative = "No urgent actions required. Continue monitoring platform health.";
  if (topAction) {
    const revenueStr = topAction.estimatedRevenue ? ` Estimated additional MRR: R${topAction.estimatedRevenue}/month.` : "";
    narrative = `Today's highest-value action is: ${topAction.title.toLowerCase()}.${revenueStr} Expected effort: ${topAction.effort}. ${topAction.confidence ? `Confidence: ${topAction.confidence}%.` : ""}`;
  }

  return {
    topAction,
    narrative,
    totalActions: queue.total,
    highImpact: queue.items.filter(i => i.impact === "high").length,
    mediumImpact: queue.items.filter(i => i.impact === "medium").length,
  };
}

// ═══ BUSINESS IMPACT ════════════════════════════════════════

export function getBusinessImpact(data, intelligence, predictions) {
  const { metrics } = data;

  // Revenue gain potential
  const upgradePotential = predictions?.upgradePredictions?.potentialRevenue || 0;
  const revenueGain = upgradePotential;

  // Revenue at risk (from churn)
  const proCustomers = metrics?.proSubscribers || 0;
  const churnRisk = predictions?.churnPredictions?.riskScore || 0;
  const estimatedChurn = predictions?.churnPredictions?.estimatedChurn || 0;
  const revenueAtRisk = estimatedChurn * 199; // Assume PRO price per churned customer

  // Customers affected
  const inactive = predictions?.churnPredictions?.inactive || 0;
  const upgradeCandidates = predictions?.upgradePredictions?.starterActive || 0;
  const customersAffected = inactive + upgradeCandidates;

  // Health improvement if actions taken
  const currentHealth = intelligence?.overview?.healthScore || 50;
  const potentialHealth = Math.min(100, currentHealth + (churnRisk >= 50 ? 10 : 5) + (upgradePotential > 0 ? 5 : 0));
  const healthImprovement = potentialHealth - currentHealth;

  // Time estimate
  const queue = getOperationsQueue(data, intelligence, predictions);
  const totalMinutes = queue.items.reduce((s, item) => {
    const match = item.effort.match(/(\d+)/);
    return s + (match ? parseInt(match[1], 10) : 15);
  }, 0);

  return {
    revenueGain: { value: revenueGain, level: revenueGain >= 500 ? "high" : revenueGain > 0 ? "medium" : "low" },
    revenueAtRisk: { value: revenueAtRisk, level: revenueAtRisk >= 500 ? "high" : revenueAtRisk > 0 ? "medium" : "low" },
    customersAffected: { value: customersAffected, level: customersAffected >= 5 ? "high" : customersAffected > 0 ? "medium" : "low" },
    healthImprovement: { value: healthImprovement, level: healthImprovement >= 10 ? "high" : healthImprovement > 0 ? "medium" : "low" },
    timeToComplete: { minutes: totalMinutes, formatted: totalMinutes >= 60 ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m` },
  };
}

// ═══ URGENT ITEMS ═══════════════════════════════════════════

export function getUrgentItems(data, intelligence, predictions) {
  const { metrics } = data;
  const items = [];

  // Payment failures
  if ((metrics?.pendingPayments || 0) > 0) {
    items.push({ severity: "critical", category: "Payment", title: `${metrics.pendingPayments} pending payment(s)`, description: "Unresolved payments impact MRR.", route: "/payments" });
  }

  // High churn risk
  if ((predictions?.churnPredictions?.riskScore || 0) >= 60) {
    items.push({ severity: "critical", category: "Retention", title: "High churn risk detected", description: predictions.churnPredictions.recommendation, route: "/users" });
  }

  // Infrastructure issues
  if (data.health) {
    const degraded = Object.entries(data.health.services).filter(([, s]) => s.status !== "healthy");
    if (degraded.length > 0) {
      items.push({ severity: degraded.length > 2 ? "critical" : "high", category: "Infrastructure", title: `${degraded.length} service(s) degraded`, description: `Affected: ${degraded.map(([n]) => n).join(", ")}`, route: "/settings" });
    }
  }

  // Inactive customers
  const inactive = (metrics?.totalUsers || 0) - (metrics?.activeUsers || 0);
  if (inactive > 0 && (metrics?.totalUsers || 0) > 2) {
    items.push({ severity: inactive > (metrics?.activeUsers || 0) ? "high" : "medium", category: "Engagement", title: `${inactive} inactive customer(s)`, description: "Customers not logging in — intervention recommended.", route: "/users" });
  }

  // Zero growth
  if (predictions?.growthForecast?.expectedNewCustomers === 0 && (metrics?.totalUsers || 0) > 0) {
    items.push({ severity: "medium", category: "Growth", title: "No growth projected", description: "Acquisition pipeline is empty.", route: "/analytics" });
  }

  // Sort by severity
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  return {
    items: items.slice(0, 5),
    critical: items.filter(i => i.severity === "critical").length,
    high: items.filter(i => i.severity === "high").length,
    medium: items.filter(i => i.severity === "medium").length,
    total: items.length,
  };
}

// ═══ REVENUE OPPORTUNITIES ══════════════════════════════════

export function getRevenueOpportunities(data, intelligence, predictions) {
  const { metrics, featureUsage } = data;

  const upgradeRevenue = predictions?.upgradePredictions?.potentialRevenue || 0;
  const upgradeCount = predictions?.upgradePredictions?.estimatedConversions || 0;
  const upgradeConfidence = predictions?.upgradePredictions?.confidence || 30;
  const starterActive = predictions?.upgradePredictions?.starterActive || 0;

  // Cross-module adoption (more modules = stickier = higher LTV)
  const modulesUsed = featureUsage.filter(f => f.records > 0).length;
  const totalModules = featureUsage.length;
  const crossModuleOpportunity = totalModules > modulesUsed && (metrics?.totalUsers || 0) > 0;

  // Estimated MRR/ARR
  const currentMRR = metrics?.revenueMonth || 0;
  const potentialMRR = currentMRR + upgradeRevenue;
  const potentialARR = potentialMRR * 12;

  let topCandidate = null;
  if (starterActive > 0) {
    topCandidate = {
      segment: "High-engagement Starter customers",
      count: Math.max(1, Math.round(starterActive * 0.3)),
      upgradeScore: predictions?.upgradePredictions?.upgradeScore || 50,
      action: "Direct outreach with feature comparison and ROI demonstration.",
    };
  }

  return {
    potentialMRR,
    potentialARR,
    upgradeRevenue,
    upgradeCount,
    upgradeConfidence,
    crossModuleOpportunity,
    topCandidate,
    summary: upgradeRevenue > 0
      ? `R${upgradeRevenue}/month in identified upgrade revenue. ${upgradeCount} conversion(s) expected at ${upgradeConfidence}% confidence.`
      : "No immediate revenue opportunities identified. Focus on customer acquisition and activation.",
  };
}

// ═══ OPERATIONAL SUMMARY ════════════════════════════════════

export function getOperationalSummary(data, intelligence, predictions) {
  const { metrics } = data;

  // Today's wins
  const wins = [];
  if ((metrics?.activeUsers || 0) > 0) wins.push(`${metrics.activeUsers} active customer(s) engaged.`);
  if ((metrics?.revenueMonth || 0) > 0) wins.push(`R${metrics.revenueMonth} MRR collected.`);
  if (intelligence?.overview?.status === "excellent" || intelligence?.overview?.status === "healthy") wins.push("Platform health is strong.");
  if (wins.length === 0) wins.push("Platform is operational and monitoring is active.");

  // Today's risks
  const risks = [];
  if (intelligence?.risks?.topRisk) risks.push(intelligence.risks.topRisk.title);
  if ((predictions?.churnPredictions?.riskScore || 0) >= 50) risks.push("Elevated churn risk.");
  if ((metrics?.pendingPayments || 0) > 0) risks.push("Pending payments.");
  if (risks.length === 0) risks.push("No significant risks detected.");

  // Today's opportunities
  const opportunities = [];
  if (intelligence?.opportunities?.topOpportunity) opportunities.push(intelligence.opportunities.topOpportunity.title);
  if ((predictions?.upgradePredictions?.potentialRevenue || 0) > 0) opportunities.push(`R${predictions.upgradePredictions.potentialRevenue}/month upgrade potential.`);
  if (opportunities.length === 0) opportunities.push("Continue building engagement for future opportunities.");

  // Today's targets
  const targets = [];
  const queue = getOperationsQueue(data, intelligence, predictions);
  queue.items.slice(0, 3).forEach(item => targets.push(item.title));
  if (targets.length === 0) targets.push("Monitor platform health and engagement.");

  return { wins, risks, opportunities, targets };
}
