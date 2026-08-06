/**
 * ============================================================
 * Feldrix Control Centre — AI Executive Service
 * Sprint 51.0
 *
 * Deterministic rules engine that analyses platform data and
 * generates executive insights, recommendations, and predictions.
 *
 * Designed so an LLM can replace or enhance the rules engine
 * without changing the UI layer.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

async function safeCount(table, filter) {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return count || 0;
  } catch { return 0; }
}

// ─── Executive Briefing ──────────────────────────────────────

export async function getExecutiveBriefing() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [totalUsers, newToday, newWeek, newMonth, activeMonth, suspended, inactive] = await Promise.all([
    safeCount("profiles"),
    safeCount("profiles", (q) => q.gte("created_at", todayStart)),
    safeCount("profiles", (q) => q.gte("created_at", weekAgo)),
    safeCount("profiles", (q) => q.gte("created_at", monthStart)),
    safeCount("profiles", (q) => q.gte("last_login", thirtyDaysAgo)),
    safeCount("profiles", (q) => q.eq("suspended", true)),
    safeCount("profiles", (q) => q.or(`last_login.is.null,last_login.lt.${thirtyDaysAgo}`)),
  ]);

  let revenueMonth = 0, failedPayments = 0;
  try {
    const { data } = await supabase.from("subscription_payments").select("amount").eq("status", "success").gte("created_at", monthStart);
    revenueMonth = (data || []).reduce((s, r) => s + (r.amount || 0), 0);
  } catch {}
  failedPayments = await safeCount("subscription_payments", (q) => q.eq("status", "failed"));

  const retention = totalUsers > 0 ? Math.round((activeMonth / totalUsers) * 100) : 0;
  const healthStatus = failedPayments === 0 && suspended === 0 ? "excellent" : failedPayments > 2 ? "warning" : "good";

  const points = [];
  if (newWeek > 0) points.push({ text: `${newWeek} new farmer${newWeek !== 1 ? "s" : ""} joined this week.`, priority: "healthy" });
  if (revenueMonth > 0) points.push({ text: `Revenue this month: R${revenueMonth.toLocaleString()}.`, priority: "healthy" });
  if (failedPayments > 0) points.push({ text: `${failedPayments} failed payment${failedPayments !== 1 ? "s" : ""} require attention.`, priority: "warning" });
  if (inactive > 3) points.push({ text: `${inactive} farm${inactive !== 1 ? "s" : ""} inactive 30+ days.`, priority: "warning" });
  if (inactive === 0) points.push({ text: "All farmers recently active.", priority: "healthy" });
  points.push({ text: `Platform health: ${healthStatus}.`, priority: healthStatus === "excellent" ? "healthy" : "warning" });

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return {
    greeting,
    summary: `Today's platform summary:`,
    points,
    stats: { totalUsers, newToday, newWeek, newMonth, activeMonth, suspended, inactive, revenueMonth, failedPayments, retention, healthStatus },
  };
}

// ─── Recommendations ─────────────────────────────────────────

export async function getRecommendations() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [inactive, failedPayments, totalUsers] = await Promise.all([
    safeCount("profiles", (q) => q.or(`last_login.is.null,last_login.lt.${thirtyDaysAgo}`)),
    safeCount("subscription_payments", (q) => q.eq("status", "failed")),
    safeCount("profiles"),
  ]);

  let proCount = 0;
  try { const { count } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).ilike("status", "active").ilike("plan", "pro"); proCount = count || 0; } catch {}

  const starterUsers = totalUsers - proCount;
  const recommendations = [];

  if (failedPayments > 0) {
    recommendations.push({
      id: "failed-payments",
      priority: "critical",
      title: "Follow up on failed payments",
      reason: `${failedPayments} payment${failedPayments !== 1 ? "s" : ""} failed recently.`,
      action: "Review failed transactions in the Payments section and contact affected customers.",
      confidence: 95,
    });
  }

  if (starterUsers > 5) {
    recommendations.push({
      id: "upgrade-candidates",
      priority: "opportunity",
      title: "Encourage PRO upgrades",
      reason: `${starterUsers} Starter users could benefit from PRO features.`,
      action: "Identify active Starter users with high engagement and send upgrade recommendations.",
      confidence: 75,
    });
  }

  if (inactive > 3) {
    recommendations.push({
      id: "re-engage-inactive",
      priority: "warning",
      title: "Re-engage inactive farms",
      reason: `${inactive} farmers haven't logged in for 30+ days.`,
      action: "Send a re-engagement email or check if they need support.",
      confidence: 80,
    });
  }

  if (proCount > 0 && failedPayments === 0) {
    recommendations.push({
      id: "healthy-billing",
      priority: "healthy",
      title: "Billing is healthy",
      reason: "All active subscriptions are processing normally.",
      action: "No action required — continue monitoring.",
      confidence: 90,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "all-good",
      priority: "healthy",
      title: "Platform operating normally",
      reason: "No issues detected across the platform.",
      action: "Continue monitoring. Focus on growth initiatives.",
      confidence: 85,
    });
  }

  return recommendations;
}

// ─── Predictions ─────────────────────────────────────────────

export async function getPredictions() {
  const totalUsers = await safeCount("profiles");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const newMonth = await safeCount("profiles", (q) => q.gte("created_at", monthStart));

  const growthRate = totalUsers > 0 ? Math.round((newMonth / totalUsers) * 100) : 0;

  return [
    { id: "growth", label: "Platform Growth", value: `${growthRate}% this month`, trend: growthRate > 5 ? "up" : growthRate > 0 ? "stable" : "down", confidence: 70 },
    { id: "revenue", label: "Revenue Forecast", value: "Stable", trend: "stable", confidence: 60 },
    { id: "churn", label: "Churn Risk", value: "Low", trend: "stable", confidence: 55 },
    { id: "engagement", label: "Engagement Trend", value: growthRate > 3 ? "Increasing" : "Stable", trend: growthRate > 3 ? "up" : "stable", confidence: 65 },
  ];
}

// ─── Executive Alerts ────────────────────────────────────────

export async function getExecutiveAlerts() {
  const alerts = [];
  const failedPayments = await safeCount("subscription_payments", (q) => q.eq("status", "failed"));
  const suspended = await safeCount("profiles", (q) => q.eq("suspended", true));

  if (failedPayments > 0) {
    alerts.push({ id: "failed-payments", severity: "critical", title: "Failed payments detected", description: `${failedPayments} payment(s) require immediate attention.`, timestamp: new Date().toISOString() });
  }

  if (suspended > 0) {
    alerts.push({ id: "suspended-users", severity: "warning", title: "Suspended accounts", description: `${suspended} account(s) currently suspended.`, timestamp: new Date().toISOString() });
  }

  if (alerts.length === 0) {
    alerts.push({ id: "all-clear", severity: "success", title: "All systems operational", description: "No critical issues detected.", timestamp: new Date().toISOString() });
  }

  return alerts;
}

// ─── Opportunities ───────────────────────────────────────────

export async function getOpportunities() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [totalUsers, inactive, recentActive] = await Promise.all([
    safeCount("profiles"),
    safeCount("profiles", (q) => q.or(`last_login.is.null,last_login.lt.${thirtyDaysAgo}`)),
    safeCount("profiles", (q) => q.gte("last_login", weekAgo)),
  ]);

  let proCount = 0;
  try { const { count } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).ilike("status", "active").ilike("plan", "pro"); proCount = count || 0; } catch {}

  const starterUsers = totalUsers - proCount;

  return {
    upgradeTargets: Math.min(starterUsers, 10),
    atRisk: inactive,
    highEngagement: recentActive,
    totalOpportunities: Math.min(starterUsers, 10) + (inactive > 0 ? 1 : 0),
  };
}

// ─── Executive Timeline ──────────────────────────────────────

export async function getExecutiveTimeline({ limit = 15 } = {}) {
  const events = [];

  // Recent signups
  try {
    const { data } = await supabase.from("profiles").select("full_name, farm_name, created_at").order("created_at", { ascending: false }).limit(5);
    (data || []).forEach((u) => {
      events.push({ type: "signup", title: `${u.full_name || "New farmer"} joined`, subtitle: u.farm_name || "", timestamp: u.created_at });
    });
  } catch {}

  // Recent payments
  try {
    const { data } = await supabase.from("subscription_payments").select("amount, status, created_at, profiles!user_id(full_name)").order("created_at", { ascending: false }).limit(5);
    (data || []).forEach((p) => {
      events.push({ type: p.status === "success" ? "payment" : "alert", title: `Payment ${p.status}: R${p.amount || 0}`, subtitle: p.profiles?.full_name || "", timestamp: p.created_at });
    });
  } catch {}

  // Sort all by timestamp descending
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return events.slice(0, limit);
}
