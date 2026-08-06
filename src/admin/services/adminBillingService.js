/**
 * ============================================================
 * Feldrix Control Centre — Billing Service (Enterprise)
 * Sprint 49.0
 *
 * Queries for Payments & Subscription Centre.
 * All methods null-safe — never throw to UI.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

// ─── Safe helpers ────────────────────────────────────────────

async function safeCount(table, filter) {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return count || 0;
  } catch { return 0; }
}

async function safeSum(table, column, filter) {
  try {
    let q = supabase.from(table).select(column);
    if (filter) q = filter(q);
    const { data } = await q;
    if (!data) return 0;
    return data.reduce((sum, row) => sum + (row[column] || 0), 0);
  } catch { return 0; }
}

// ─── Billing Metrics (KPI Dashboard) ─────────────────────────

export async function getBillingMetrics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000).toISOString();

  const [
    totalPayments,
    successfulPayments,
    failedPayments,
    pendingPayments,
    cancelledPayments,
    revenueThisMonth,
    revenueToday,
    totalProfiles,
  ] = await Promise.all([
    safeCount("subscription_payments"),
    safeCount("subscription_payments", (q) => q.eq("status", "success")),
    safeCount("subscription_payments", (q) => q.eq("status", "failed")),
    safeCount("subscription_payments", (q) => q.eq("status", "pending")),
    safeCount("subscription_payments", (q) => q.eq("status", "cancelled")),
    safeSum("subscription_payments", "amount", (q) => q.eq("status", "success").gte("created_at", monthStart)),
    safeSum("subscription_payments", "amount", (q) => q.eq("status", "success").gte("created_at", todayStart)),
    safeCount("profiles"),
  ]);

  // PRO subscribers (from subscriptions table if exists)
  let proSubscribers = 0;
  let pendingRenewals = 0;
  try {
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .ilike("status", "active")
      .ilike("plan", "pro");
    proSubscribers = count || 0;
  } catch { /* table may not exist */ }

  try {
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .ilike("status", "active")
      .not("renewal_date", "is", null)
      .lte("renewal_date", weekFromNow);
    pendingRenewals = count || 0;
  } catch { /* table may not exist */ }

  const starterUsers = Math.max(0, totalProfiles - proSubscribers);
  const mrr = revenueThisMonth;
  const arr = mrr * 12;

  return {
    mrr,
    arr,
    revenueThisMonth,
    revenueToday,
    proSubscribers,
    starterUsers,
    pendingRenewals,
    failedPayments,
    cancelledPayments,
    pendingPayments,
    totalPayments,
    successfulPayments,
  };
}

// ─── Payments List ───────────────────────────────────────────

export async function getPayments({
  search = "",
  filter = "all",
  sortBy = "created_at",
  sortDir = "desc",
  limit = 25,
  offset = 0,
} = {}) {
  try {
    let query = supabase
      .from("subscription_payments")
      .select("*, profiles!user_id(full_name, email, farm_name)", { count: "exact" })
      .order(sortBy, { ascending: sortDir === "asc" })
      .range(offset, offset + limit - 1);

    if (search) {
      // Search on joined profile fields requires a different approach
      // For now search on payment reference
      query = query.ilike("reference", `%${search}%`);
    }

    switch (filter) {
      case "successful": query = query.eq("status", "success"); break;
      case "pending": query = query.eq("status", "pending"); break;
      case "failed": query = query.eq("status", "failed"); break;
      case "cancelled": query = query.eq("status", "cancelled"); break;
      case "refunded": query = query.eq("status", "refunded"); break;
      default: break;
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { payments: data || [], total: count || 0 };
  } catch (err) {
    // If subscription_payments table doesn't exist, return empty
    console.warn("[Billing] getPayments failed:", err?.message);
    return { payments: [], total: 0 };
  }
}

// ─── Subscription Detail ─────────────────────────────────────

export async function getSubscriptionDetail(userId) {
  if (!userId) return null;

  try {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return data || null;
  } catch {
    return null;
  }
}

// ─── Payment History for a user ──────────────────────────────

export async function getPaymentHistory(userId, { limit = 20 } = {}) {
  if (!userId) return [];

  try {
    const { data } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  } catch {
    return [];
  }
}

// ─── Revenue Analytics ───────────────────────────────────────

export async function getRevenueByMonth(months = 6) {
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();
    const label = date.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });

    const revenue = await safeSum("subscription_payments", "amount", (q) =>
      q.eq("status", "success").gte("created_at", start).lt("created_at", end)
    );

    results.push({ month: label, revenue });
  }

  return results;
}
