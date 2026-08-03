/**
 * ============================================================
 * Feldrix Control Centre — Analytics Service (Production)
 * Sprint 46.3
 *
 * Aggregation queries for executive dashboard and analytics page.
 * Pulls real data from all available tables.
 * Gracefully handles missing tables/columns.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

/**
 * Safe count query — returns 0 if table doesn't exist or query fails.
 */
async function safeCount(table, filter) {
  try {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) query = filter(query);
    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Get dashboard KPI metrics from real production data.
 */
export async function getDashboardMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Parallel queries — all wrapped in safeCount for resilience
  const [
    totalUsers,
    todaySignups,
    suspendedUsers,
    totalLivestock,
    totalCrops,
    totalTasks,
    totalFinanceRecords,
    totalMachinery,
    totalHealthRecords,
    totalBreedingRecords,
    recentActiveUsers,
    totalPayments,
    successfulPayments,
    pendingPayments,
  ] = await Promise.all([
    safeCount("profiles"),
    safeCount("profiles", (q) => q.gte("created_at", today.toISOString())),
    safeCount("profiles", (q) => q.eq("suspended", true)),
    safeCount("livestock"),
    safeCount("crops"),
    safeCount("planner_tasks"),
    safeCount("finance_records"),
    safeCount("machinery"),
    safeCount("health_records"),
    safeCount("breeding_records"),
    safeCount("profiles", (q) => q.gte("last_login", thirtyDaysAgo.toISOString())),
    safeCount("subscription_payments"),
    safeCount("subscription_payments", (q) => q.eq("status", "success")),
    safeCount("subscription_payments", (q) => q.eq("status", "pending")),
  ]);

  // Calculate onboarding completion from profiles with onboarding_state
  let avgOnboardingCompletion = 0;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_state")
      .not("onboarding_state", "is", null)
      .limit(100);

    if (data && data.length > 0) {
      const completedCount = data.filter(
        (p) => p.onboarding_state?.completed === true
      ).length;
      avgOnboardingCompletion = Math.round((completedCount / data.length) * 100);
    }
  } catch { /* non-blocking */ }

  // Revenue calculation from successful payments
  let monthlyRevenue = 0;
  try {
    const { data } = await supabase
      .from("subscription_payments")
      .select("amount")
      .eq("status", "success")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (data) {
      monthlyRevenue = data.reduce((sum, p) => sum + (p.amount || 0), 0);
    }
  } catch { /* non-blocking */ }

  // PRO subscriber count
  let proSubscribers = 0;
  try {
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("plan", "pro");

    proSubscribers = count || 0;
  } catch {
    // Table may not exist yet
  }

  return {
    totalUsers,
    activeUsers: totalUsers - suspendedUsers,
    todaySignups,
    suspendedUsers,
    recentActiveUsers,
    totalLivestock,
    totalCrops,
    totalTasks,
    totalFinanceRecords,
    totalMachinery,
    totalHealthRecords,
    totalBreedingRecords,
    proSubscribers,
    monthlyRevenue,
    pendingPayments,
    totalPayments,
    successfulPayments,
    avgOnboardingCompletion,
    // Future metrics — require more complex calculations
    avgFarmHealth: 0,
    mrr: monthlyRevenue,
    arr: monthlyRevenue * 12,
    churn: 0,
  };
}

/**
 * Get recent signups (last N days, per day).
 */
export async function getSignupTrend(days = 7) {
  const results = [];
  const promises = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const label = date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });

    promises.push(
      safeCount("profiles", (q) =>
        q.gte("created_at", date.toISOString()).lt("created_at", nextDate.toISOString())
      ).then((count) => ({ date: label, signups: count, index: days - 1 - i }))
    );
  }

  const resolved = await Promise.all(promises);
  resolved.sort((a, b) => a.index - b.index);
  return resolved.map(({ date, signups }) => ({ date, signups }));
}

/**
 * Get recent activity summary.
 */
export async function getRecentActivity() {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return (data || []).map((u) => ({
      type: "signup",
      description: `${u.full_name || u.email} joined Feldrix`,
      timestamp: u.created_at,
    }));
  } catch {
    return [];
  }
}
