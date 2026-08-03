/**
 * ============================================================
 * Feldrix Control Centre — Farm Service (Enterprise)
 * Sprint 48.0
 *
 * Queries for the Farms Operations Centre.
 * All methods are null-safe and never throw to the UI.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

// ─── Safe count helper ───────────────────────────────────────

async function safeCount(table, filter) {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return count || 0;
  } catch {
    return 0;
  }
}

// ─── Farm Metrics (KPI Dashboard) ────────────────────────────

export async function getFarmMetrics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [totalFarms, activeFarms, newThisMonth, activeToday] = await Promise.all([
    safeCount("profiles", (q) => q.not("farm_name", "is", null).neq("farm_name", "")),
    safeCount("profiles", (q) => q.not("farm_name", "is", null).neq("farm_name", "").eq("suspended", false)),
    safeCount("profiles", (q) => q.not("farm_name", "is", null).neq("farm_name", "").gte("created_at", monthStart)),
    safeCount("profiles", (q) => q.not("farm_name", "is", null).neq("farm_name", "").gte("last_login", todayStart)),
  ]);

  return {
    totalFarms,
    activeFarms,
    proFarms: 0,       // Placeholder — requires subscriptions table
    starterFarms: totalFarms,
    newThisMonth,
    activeToday,
  };
}

// ─── Farm List (Table) ───────────────────────────────────────

export async function getFarms({
  search = "",
  filter = "all",
  sortBy = "created_at",
  sortDir = "desc",
  limit = 25,
  offset = 0,
} = {}) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, farm_name, farm_type, province, country, role, suspended, last_login, created_at, onboarding_state", { count: "exact" })
    .not("farm_name", "is", null)
    .neq("farm_name", "")
    .order(sortBy, { ascending: sortDir === "asc" })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`farm_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,province.ilike.%${search}%,country.ilike.%${search}%`);
  }

  switch (filter) {
    case "active":
      query = query.eq("suspended", false);
      break;
    case "inactive":
      query = query.eq("suspended", true);
      break;
    case "pro":
      // Placeholder — refine with subscriptions
      query = query.eq("suspended", false);
      break;
    case "starter":
      query = query.eq("suspended", false);
      break;
    case "new_this_month": {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      query = query.gte("created_at", monthStart);
      break;
    }
    case "recently_active": {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte("last_login", weekAgo.toISOString());
      break;
    }
    case "south_africa":
      query = query.eq("country", "South Africa");
      break;
    default:
      break;
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // Enrich with counts (parallel, per-farm)
  const farms = await Promise.all(
    (data || []).map(async (farm) => {
      const [livestock, crops, tasks] = await Promise.all([
        safeCount("livestock", (q) => q.eq("user_id", farm.id)),
        safeCount("crops", (q) => q.eq("user_id", farm.id)),
        safeCount("planner_tasks", (q) => q.eq("user_id", farm.id)),
      ]);
      return { ...farm, livestock, crops, tasks };
    })
  );

  return { farms, total: count || 0 };
}

// ─── Single Farm Detail ──────────────────────────────────────

export async function getFarmDetail(farmId) {
  if (!farmId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", farmId)
    .single();

  if (error) return null;

  const [livestock, crops, tasks, finance, health, machinery] = await Promise.all([
    safeCount("livestock", (q) => q.eq("user_id", farmId)),
    safeCount("crops", (q) => q.eq("user_id", farmId)),
    safeCount("planner_tasks", (q) => q.eq("user_id", farmId)),
    safeCount("finance_records", (q) => q.eq("user_id", farmId)),
    safeCount("health_records", (q) => q.eq("user_id", farmId)),
    safeCount("machinery", (q) => q.eq("user_id", farmId)),
  ]);

  return {
    profile: profile || {},
    counts: { livestock, crops, tasks, finance, health, machinery },
  };
}

// ─── Farm Activity ───────────────────────────────────────────

export async function getFarmActivity(farmId, { limit = 15 } = {}) {
  if (!farmId) return [];
  try {
    const { data } = await supabase
      .from("user_timeline")
      .select("*")
      .eq("user_id", farmId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

// ─── Farm Health (simplified score) ──────────────────────────

export async function getFarmHealth(farmId) {
  if (!farmId) return { score: 0, status: "unknown" };

  const [livestock, crops, tasks, finance] = await Promise.all([
    safeCount("livestock", (q) => q.eq("user_id", farmId)),
    safeCount("crops", (q) => q.eq("user_id", farmId)),
    safeCount("planner_tasks", (q) => q.eq("user_id", farmId)),
    safeCount("finance_records", (q) => q.eq("user_id", farmId)),
  ]);

  // Score: each module with data adds 20 points, max 100
  let score = 0;
  if (livestock > 0) score += 25;
  if (crops > 0) score += 25;
  if (tasks > 0) score += 25;
  if (finance > 0) score += 25;

  const status = score >= 75 ? "healthy" : score >= 50 ? "warning" : score >= 25 ? "warning" : "critical";

  return { score, status, livestock, crops, tasks, finance };
}
