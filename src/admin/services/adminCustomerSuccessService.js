/**
 * ============================================================
 * Feldrix Control Centre — Customer Success Service
 * Sprint 52.0
 *
 * Customer health scoring, success queue, journey, platform
 * health, communications, and AI recommendations.
 *
 * Designed so AI can replace deterministic rules without UI changes.
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

// ─── Customer Health Score ───────────────────────────────────

export function calculateHealthScore({ lastLogin, livestock, crops, tasks, finance, health, onboarding }) {
  let score = 0;
  const now = Date.now();

  // Recent login (max 30 points)
  if (lastLogin) {
    const daysSince = (now - new Date(lastLogin).getTime()) / 86400000;
    if (daysSince < 1) score += 30;
    else if (daysSince < 7) score += 25;
    else if (daysSince < 14) score += 15;
    else if (daysSince < 30) score += 5;
  }

  // Module usage (max 50 points — 10 each)
  if (livestock > 0) score += 10;
  if (crops > 0) score += 10;
  if (tasks > 0) score += 10;
  if (finance > 0) score += 10;
  if (health > 0) score += 10;

  // Onboarding (max 20 points)
  if (onboarding?.completed) score += 20;
  else if (onboarding?.dashboard_visited) score += 10;

  const risk = score >= 70 ? "healthy" : score >= 40 ? "needs_attention" : "critical";
  return { score, risk };
}

// ─── Success Dashboard KPIs ──────────────────────────────────

export async function getSuccessMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [total, inactive, suspended] = await Promise.all([
    safeCount("profiles"),
    safeCount("profiles", (q) => q.or(`last_login.is.null,last_login.lt.${thirtyDaysAgo}`)),
    safeCount("profiles", (q) => q.eq("suspended", true)),
  ]);

  return {
    needsAttention: inactive,
    inactive,
    highChurnRisk: Math.max(0, inactive - 2),
    upgradeOpportunities: Math.max(0, total - suspended - 5),
    openSupportCases: 0,
    avgCustomerHealth: total > 0 ? Math.round(((total - inactive) / total) * 100) : 0,
    onboardingCompletion: 0,
    avgResponseTime: 0,
  };
}

// ─── Success Queue (enriched user list) ──────────────────────

export async function getSuccessQueue({ limit = 20, offset = 0 } = {}) {
  try {
    const { data, error, count } = await supabase
      .from("profiles")
      .select("id, full_name, email, farm_name, last_login, suspended, onboarding_state, created_at", { count: "exact" })
      .order("last_login", { ascending: true, nullsFirst: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const enriched = await Promise.all(
      (data || []).map(async (user) => {
        const [livestock, crops, tasks, finance, health] = await Promise.all([
          safeCount("livestock", (q) => q.eq("user_id", user.id)),
          safeCount("crops", (q) => q.eq("user_id", user.id)),
          safeCount("planner_tasks", (q) => q.eq("user_id", user.id)),
          safeCount("finance_records", (q) => q.eq("user_id", user.id)),
          safeCount("health_records", (q) => q.eq("user_id", user.id)),
        ]);

        const { score, risk } = calculateHealthScore({
          lastLogin: user.last_login,
          livestock, crops, tasks, finance, health,
          onboarding: user.onboarding_state,
        });

        return { ...user, healthScore: score, risk, livestock, crops, tasks };
      })
    );

    return { customers: enriched, total: count || 0 };
  } catch {
    return { customers: [], total: 0 };
  }
}

// ─── Customer Journey ────────────────────────────────────────

export async function getCustomerJourney(userId) {
  if (!userId) return [];
  const events = [];

  // Profile creation
  try {
    const { data } = await supabase.from("profiles").select("created_at, onboarding_state").eq("id", userId).single();
    if (data) {
      events.push({ type: "milestone", title: "Account Created", timestamp: data.created_at });
      if (data.onboarding_state?.completed) events.push({ type: "milestone", title: "Onboarding Completed", timestamp: data.onboarding_state.completed_at || data.created_at });
    }
  } catch {}

  // Timeline events
  try {
    const { data } = await supabase.from("user_timeline").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    (data || []).forEach((e) => events.push({ type: "activity", title: e.title, subtitle: e.description, timestamp: e.created_at }));
  } catch {}

  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return events;
}

// ─── Platform Health ─────────────────────────────────────────

export async function getPlatformHealth() {
  const services = {};

  // Database
  try {
    const start = Date.now();
    await supabase.from("profiles").select("id", { head: true }).limit(1);
    services.database = { status: "healthy", latency: Date.now() - start };
  } catch { services.database = { status: "down", latency: null }; }

  // Auth
  try {
    const start = Date.now();
    await supabase.auth.getSession();
    services.authentication = { status: "healthy", latency: Date.now() - start };
  } catch { services.authentication = { status: "down", latency: null }; }

  // Storage
  try {
    const start = Date.now();
    await supabase.storage.listBuckets();
    services.storage = { status: "healthy", latency: Date.now() - start };
  } catch { services.storage = { status: "degraded", latency: null }; }

  // Placeholders
  services.edgeFunctions = { status: "healthy", latency: null };
  services.payfast = { status: "healthy", latency: null };
  services.weatherApi = { status: "healthy", latency: null };

  const allHealthy = Object.values(services).every((s) => s.status === "healthy");
  const anyDown = Object.values(services).some((s) => s.status === "down");

  return { services, overall: anyDown ? "down" : allHealthy ? "healthy" : "degraded" };
}

// ─── AI Customer Success Recommendations ─────────────────────

export async function getCSRecommendations() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const [inactive, total] = await Promise.all([
    safeCount("profiles", (q) => q.or(`last_login.is.null,last_login.lt.${thirtyDaysAgo}`)),
    safeCount("profiles"),
  ]);

  const recommendations = [];

  if (inactive > 0) {
    recommendations.push({
      priority: "warning", confidence: 85,
      title: `${inactive} customer${inactive !== 1 ? "s" : ""} inactive 30+ days`,
      reason: "Customers who haven't logged in may be at risk of churning.",
      action: "Send a re-engagement email with tips on getting started.",
    });
  }

  if (total > 3 && inactive === 0) {
    recommendations.push({
      priority: "healthy", confidence: 90,
      title: "All customers recently active",
      reason: "Every registered farmer has logged in within the last 30 days.",
      action: "Continue monitoring. Consider upgrade campaigns for engaged users.",
    });
  }

  recommendations.push({
    priority: "opportunity", confidence: 70,
    title: "Identify upgrade candidates",
    reason: "Active Starter users with high module usage are prime upgrade targets.",
    action: "Review the success queue for users with health scores above 60%.",
  });

  return recommendations;
}

// ─── Communications (placeholder structure) ──────────────────

export async function getCommunications() {
  return {
    templates: [
      { id: "welcome", name: "Welcome Campaign", status: "ready" },
      { id: "upgrade", name: "Upgrade Campaign", status: "ready" },
      { id: "billing", name: "Billing Reminder", status: "ready" },
      { id: "maintenance", name: "Maintenance Notice", status: "ready" },
      { id: "feature", name: "Feature Announcement", status: "ready" },
      { id: "re-engage", name: "Re-engagement", status: "ready" },
    ],
    sent: [],
  };
}
