/**
 * ============================================================
 * Feldrix Control Centre — Business Intelligence Service
 * Version 2.2 Phase 1
 *
 * Executive analytics: growth, revenue, customer health,
 * platform activity, feature usage. All null-safe.
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

// ─── Customer Growth (monthly, last 6 months) ────────────────

export async function getCustomerGrowth(months = 6) {
  const results = [];
  const promises = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const label = d.toLocaleDateString("en-ZA", { month: "short" });
    promises.push(
      safeCount("profiles", (q) => q.gte("created_at", start).lt("created_at", end))
        .then((count) => ({ month: label, newCustomers: count, idx: months - 1 - i }))
    );
  }
  const resolved = await Promise.all(promises);
  resolved.sort((a, b) => a.idx - b.idx);

  // Calculate cumulative
  let cumulative = 0;
  // Get total before window
  const windowStart = new Date(); windowStart.setMonth(windowStart.getMonth() - months);
  const priorCount = await safeCount("profiles", (q) => q.lt("created_at", new Date(windowStart.getFullYear(), windowStart.getMonth(), 1).toISOString()));
  cumulative = priorCount;

  return resolved.map(({ month, newCustomers }) => {
    cumulative += newCustomers;
    return { month, newCustomers, totalCustomers: cumulative };
  });
}

// ─── Revenue (monthly, last 6 months) ────────────────────────

export async function getRevenueGrowth(months = 6) {
  const results = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const label = d.toLocaleDateString("en-ZA", { month: "short" });

    let revenue = 0;
    try {
      const { data } = await supabase.from("subscription_payments").select("amount").eq("status", "success").gte("created_at", start).lt("created_at", end);
      revenue = (data || []).reduce((s, r) => s + (r.amount || 0), 0);
    } catch {}

    results.push({ month: label, revenue });
  }
  return results;
}

// ─── Subscription Breakdown ──────────────────────────────────

export async function getSubscriptionBreakdown() {
  const total = await safeCount("profiles");
  let pro = 0;
  try { const { count } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"); pro = count || 0; } catch {}
  const cancelled = await safeCount("subscription_payments", (q) => q.eq("status", "cancelled"));

  return [
    { name: "Starter", value: Math.max(0, total - pro), color: "#3B82F6" },
    { name: "PRO", value: pro, color: "#8B5CF6" },
    { name: "Cancelled", value: cancelled, color: "#94A3B8" },
  ];
}

// ─── Platform Activity (daily, last 7 days) ──────────────────

export async function getPlatformActivity(days = 7) {
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
    const label = d.toLocaleDateString("en-ZA", { weekday: "short" });

    const logins = await safeCount("profiles", (q) => q.gte("last_login", start).lt("last_login", end));
    results.push({ day: label, logins });
  }
  return results;
}

// ─── Feature Usage ───────────────────────────────────────────

export async function getFeatureUsage() {
  const [livestock, crops, tasks, finance, health, machinery] = await Promise.all([
    safeCount("livestock"),
    safeCount("crops"),
    safeCount("planner_tasks"),
    safeCount("finance_records"),
    safeCount("health_records"),
    safeCount("machinery"),
  ]);
  return [
    { name: "Livestock", records: livestock, color: "#16A34A" },
    { name: "Planner", records: tasks, color: "#3B82F6" },
    { name: "Finance", records: finance, color: "#F59E0B" },
    { name: "Crops", records: crops, color: "#22C55E" },
    { name: "Health", records: health, color: "#EF4444" },
    { name: "Machinery", records: machinery, color: "#8B5CF6" },
  ].sort((a, b) => b.records - a.records);
}

// ─── Customer Health Distribution ────────────────────────────

export async function getCustomerHealthDistribution() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [total, activeWeek, activeTwoWeeks, inactive] = await Promise.all([
    safeCount("profiles"),
    safeCount("profiles", (q) => q.gte("last_login", sevenDaysAgo)),
    safeCount("profiles", (q) => q.gte("last_login", fourteenDaysAgo).lt("last_login", sevenDaysAgo)),
    safeCount("profiles", (q) => q.or(`last_login.is.null,last_login.lt.${thirtyDaysAgo}`)),
  ]);

  const needsAttention = Math.max(0, total - activeWeek - activeTwoWeeks - inactive);

  return [
    { name: "Healthy", value: activeWeek, color: "#16A34A" },
    { name: "Moderate", value: activeTwoWeeks, color: "#F59E0B" },
    { name: "Attention", value: needsAttention, color: "#F97316" },
    { name: "Inactive", value: inactive, color: "#EF4444" },
  ];
}

// ─── Executive Insights Cards ────────────────────────────────

export async function getExecutiveInsights() {
  const usage = await getFeatureUsage();
  const mostUsed = usage[0] || { name: "—", records: 0 };
  const leastUsed = usage[usage.length - 1] || { name: "—", records: 0 };

  return {
    bestModule: mostUsed.name,
    bestModuleRecords: mostUsed.records,
    lowestModule: leastUsed.name,
    lowestModuleRecords: leastUsed.records,
  };
}
