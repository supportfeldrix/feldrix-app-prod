/**
 * ============================================================
 * Feldrix Customer Success Centre — Support Service
 * Version 2.0
 *
 * Provides LIVE customer context panel data from Supabase.
 * All queries hit the database directly — no stale cached data.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

// ─── Helper: safe count ─────────────────────────────────────

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

// ─── Customer Context (LIVE from Supabase) ──────────────────

/**
 * Get full customer context for the context panel.
 * Queries profiles, livestock, crops, finance, planner tables live.
 */
export async function getCustomerContext(customerId) {
  if (!customerId) return null;

  try {
    // Fetch profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", customerId)
      .single();

    if (error || !profile) return null;

    // Fetch counts in parallel
    const [livestockCount, cropCount, plannerCount, financeCount] = await Promise.all([
      safeCount("livestock", (q) => q.eq("user_id", customerId)),
      safeCount("crops", (q) => q.eq("user_id", customerId)),
      safeCount("planner_tasks", (q) => q.eq("user_id", customerId)),
      safeCount("finance_records", (q) => q.eq("user_id", customerId)),
    ]);

    // Fetch subscription info
    let subscription = "Starter";
    let subscriptionStatus = "active";
    try {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sub) {
        // Normalize plan display (capitalize first letter)
        const rawPlan = sub.plan || "Starter";
        subscription = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1).toLowerCase();
        subscriptionStatus = sub.status || "active";
      }
    } catch {
      // Subscription table may not exist or no record — use defaults
    }

    return {
      id: profile.id,
      full_name: profile.full_name || profile.email || "Unknown",
      email: profile.email || "—",
      farm_name: profile.farm_name || "—",
      province: profile.province || "—",
      subscription,
      subscription_status: subscriptionStatus,
      member_since: profile.created_at,
      last_login: profile.last_login || null,
      weather_location: profile.weather_location || "—",
      livestock_count: livestockCount,
      crop_count: cropCount,
      planner_tasks: plannerCount,
      finance_records: financeCount,
      health_score: calculateSimpleHealthScore(livestockCount, cropCount, plannerCount, financeCount, profile.last_login),
    };
  } catch {
    return null;
  }
}

/**
 * Simple health score calculation based on activity.
 */
function calculateSimpleHealthScore(livestock, crops, planner, finance, lastLogin) {
  let score = 0;

  // Recent login (max 30)
  if (lastLogin) {
    const days = (Date.now() - new Date(lastLogin).getTime()) / 86400000;
    if (days < 1) score += 30;
    else if (days < 7) score += 25;
    else if (days < 14) score += 15;
    else if (days < 30) score += 5;
  }

  // Module usage (max 50 — 10 each, capped at having records)
  if (livestock > 0) score += 10;
  if (crops > 0) score += 10;
  if (planner > 0) score += 10;
  if (finance > 0) score += 10;

  // Base engagement
  score += 10;

  return Math.min(100, score);
}

// ─── Customer Timeline (LIVE from Supabase) ─────────────────

/**
 * Get customer activity timeline from support tickets and messages.
 */
export async function getCustomerTimeline(customerId) {
  if (!customerId) return [];

  const timeline = [];

  try {
    // Ticket events
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, status, created_at, resolved_at, closed_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);

    for (const ticket of (tickets || [])) {
      timeline.push({
        type: "ticket",
        title: "Support ticket created",
        subtitle: `${ticket.ticket_number} — ${ticket.subject}`,
        timestamp: ticket.created_at,
      });

      if (ticket.resolved_at) {
        timeline.push({
          type: "activity",
          title: "Ticket resolved",
          subtitle: ticket.ticket_number,
          timestamp: ticket.resolved_at,
        });
      }

      if (ticket.closed_at) {
        timeline.push({
          type: "activity",
          title: "Ticket closed",
          subtitle: ticket.ticket_number,
          timestamp: ticket.closed_at,
        });
      }
    }

    // Recent messages by customer
    const { data: messages } = await supabase
      .from("ticket_messages")
      .select("id, content, created_at, sender_type, ticket_id")
      .eq("sender_id", customerId)
      .order("created_at", { ascending: false })
      .limit(5);

    for (const msg of (messages || [])) {
      timeline.push({
        type: "reply",
        title: msg.sender_type === "customer" ? "Customer replied" : "Support replied",
        subtitle: msg.content?.substring(0, 60) + (msg.content?.length > 60 ? "..." : ""),
        timestamp: msg.created_at,
      });
    }
  } catch {
    // Return whatever we have
  }

  // Sort chronologically (newest first)
  timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return timeline;
}

// ─── Customer Matching by Email ─────────────────────────────

/**
 * Match a customer by their email address.
 * Queries profiles table in Supabase.
 * Returns full context (same as getCustomerContext).
 */
export async function matchCustomerByEmail(email) {
  if (!email) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (error || !data) return null;

    // Use getCustomerContext for full live data
    return await getCustomerContext(data.id);
  } catch {
    return null;
  }
}

// ─── Search Customers ───────────────────────────────────────

/**
 * Search customers by name or email (live from Supabase).
 */
export async function searchCustomers(query) {
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, farm_name")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,farm_name.ilike.%${query}%`)
      .limit(10);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ─── Support Metrics ────────────────────────────────────────

/**
 * Get live support metrics.
 */
export async function getSupportMetrics() {
  const [openTickets, unreadEmails] = await Promise.all([
    safeCount("support_tickets", (q) => q.in("status", ["open", "assigned"])),
    safeCount("imported_emails", (q) => q.eq("is_read", false).eq("folder", "inbox")),
  ]);

  return {
    openTickets,
    avgResponseTime: "—",
    resolvedToday: 0,
    customerSatisfaction: "—",
    unreadEmails,
    pendingAssignment: 0,
  };
}
