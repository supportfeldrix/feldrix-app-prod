/**
 * ============================================================
 * Feldrix Control Centre — Executive Analytics Service
 * Sprint 50.0
 *
 * Business intelligence queries for the Executive Dashboard.
 * All methods null-safe — never throw to UI.
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

// ─── Executive KPIs ──────────────────────────────────────────

export async function getExecutiveMetrics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    totalFarmers, activeToday, activeWeek, activeMonth,
    newToday, newMonth, suspended,
  ] = await Promise.all([
    safeCount("profiles"),
    safeCount("profiles", (q) => q.gte("last_login", todayStart)),
    safeCount("profiles", (q) => q.gte("last_login", weekAgo)),
    safeCount("profiles", (q) => q.gte("last_login", thirtyDaysAgo)),
    safeCount("profiles", (q) => q.gte("created_at", todayStart)),
    safeCount("profiles", (q) => q.gte("created_at", monthStart)),
    safeCount("profiles", (q) => q.eq("suspended", true)),
  ]);

  // Revenue
  let mrr = 0, revenueMonth = 0;
  try {
    const { data } = await supabase
      .from("subscription_payments")
      .select("amount")
      .eq("status", "success")
      .gte("created_at", monthStart);
    revenueMonth = (data || []).reduce((s, r) => s + (r.amount || 0), 0);
    mrr = revenueMonth;
  } catch { /* table may not exist */ }

  // PRO subscribers
  let proCount = 0;
  try {
    const { count } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");
    proCount = count || 0;
  } catch { /* table may not exist */ }

  const activeFarmers = totalFarmers - suspended;
  const proConversion = totalFarmers > 0 ? Math.round((proCount / totalFarmers) * 100) : 0;
  const retention = totalFarmers > 0 ? Math.round((activeMonth / totalFarmers) * 100) : 0;
  const arpu = proCount > 0 ? Math.round(mrr / proCount) : 0;

  return {
    totalFarmers, activeToday, activeWeek, activeMonth,
    newToday, newMonth, suspended, activeFarmers,
    proCount, proConversion, mrr, arr: mrr * 12,
    retention, arpu, churn: 0, avgSession: 0,
    revenueMonth,
  };
}

// ─── Growth Metrics (monthly) ────────────────────────────────

export async function getGrowthMetrics(months = 6) {
  const results = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const label = d.toLocaleDateString("en-ZA", { month: "short" });
    const signups = await safeCount("profiles", (q) => q.gte("created_at", start).lt("created_at", end));
    results.push({ month: label, signups });
  }
  return results;
}

// ─── Platform Usage ──────────────────────────────────────────

export async function getPlatformUsage() {
  const [livestock, crops, tasks, finance, health, machinery] = await Promise.all([
    safeCount("livestock"),
    safeCount("crops"),
    safeCount("planner_tasks"),
    safeCount("finance_records"),
    safeCount("health_records"),
    safeCount("machinery"),
  ]);

  const modules = [
    { name: "Livestock", icon: "🐄", count: livestock },
    { name: "Crops", icon: "🌾", count: crops },
    { name: "Planner", icon: "📋", count: tasks },
    { name: "Finance", icon: "💳", count: finance },
    { name: "Health", icon: "❤️", count: health },
    { name: "Machinery", icon: "🚜", count: machinery },
  ].sort((a, b) => b.count - a.count);

  return { modules, mostUsed: modules[0], leastUsed: modules[modules.length - 1] };
}

// ─── Geographic Insights ─────────────────────────────────────

export async function getGeographicInsights() {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("province, country")
      .not("province", "is", null)
      .neq("province", "");

    if (!data) return { provinces: [], countries: [] };

    const provMap = {};
    const countryMap = {};
    data.forEach((p) => {
      if (p.province) provMap[p.province] = (provMap[p.province] || 0) + 1;
      if (p.country) countryMap[p.country] = (countryMap[p.country] || 0) + 1;
    });

    const provinces = Object.entries(provMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const countries = Object.entries(countryMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return { provinces, countries };
  } catch {
    return { provinces: [], countries: [] };
  }
}

// ─── Operational Insights ────────────────────────────────────

export async function getOperationalInsights() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Most active farms (by last_login recency)
  let topActive = [];
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, farm_name, last_login")
      .not("farm_name", "is", null)
      .order("last_login", { ascending: false, nullsFirst: false })
      .limit(10);
    topActive = data || [];
  } catch { /* */ }

  // Inactive 30+ days
  let inactive = 0;
  try {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or(`last_login.is.null,last_login.lt.${thirtyDaysAgo}`);
    inactive = count || 0;
  } catch { /* */ }

  return { topActive, inactiveCount: inactive };
}
