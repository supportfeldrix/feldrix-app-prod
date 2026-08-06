/**
 * ============================================================
 * Feldrix Customer Success Centre — Support Service
 * Version 1.0
 *
 * Provides customer context panel data and activity timeline.
 * Aggregates information from multiple sources (profiles, livestock,
 * crops, finance, planner) to give agents a complete customer view.
 *
 * Uses mock data for v1.0 — future versions query Supabase.
 * ============================================================
 */

// ─── Mock Customer Context Data ─────────────────────────────

const MOCK_CUSTOMERS = {
  "usr-001": {
    id: "usr-001",
    full_name: "Jan van der Merwe",
    email: "jan.vandermerwe@gmail.com",
    farm_name: "Bosveld Boerdery",
    province: "Limpopo",
    subscription: "Pro",
    subscription_status: "active",
    member_since: "2026-03-15",
    last_login: "2026-08-06T07:30:00Z",
    weather_location: "Polokwane,ZA",
    livestock_count: 51,
    crop_count: 3,
    planner_tasks: 12,
    finance_records: 34,
    health_score: 82,
  },
  "usr-002": {
    id: "usr-002",
    full_name: "Maria Botha",
    email: "maria.botha@outlook.com",
    farm_name: "Ceres Valley Wines",
    province: "Western Cape",
    subscription: "Pro",
    subscription_status: "active",
    member_since: "2026-01-22",
    last_login: "2026-08-06T07:00:00Z",
    weather_location: "Ceres,ZA",
    livestock_count: 0,
    crop_count: 8,
    planner_tasks: 22,
    finance_records: 56,
    health_score: 71,
  },
  "usr-003": {
    id: "usr-003",
    full_name: "Pieter du Plessis",
    email: "pieter.du.plessis@farmmail.co.za",
    farm_name: "Du Plessis Dairy",
    province: "Free State",
    subscription: "Pro",
    subscription_status: "active",
    member_since: "2026-02-10",
    last_login: "2026-08-05T16:00:00Z",
    weather_location: "Bloemfontein,ZA",
    livestock_count: 120,
    crop_count: 2,
    planner_tasks: 8,
    finance_records: 89,
    health_score: 88,
  },
  "usr-004": {
    id: "usr-004",
    full_name: "Thandi Nkosi",
    email: "thandi.nkosi@icloud.com",
    farm_name: "Nkosi Poultry Farm",
    province: "KwaZulu-Natal",
    subscription: "Pro",
    subscription_status: "active",
    member_since: "2026-04-01",
    last_login: "2026-08-06T08:45:00Z",
    weather_location: "Pietermaritzburg,ZA",
    livestock_count: 2400,
    crop_count: 0,
    planner_tasks: 15,
    finance_records: 67,
    health_score: 75,
  },
  "usr-005": {
    id: "usr-005",
    full_name: "Henk Joubert",
    email: "henk.joubert@vodamail.co.za",
    farm_name: "Joubert Mixed Farm",
    province: "North West",
    subscription: "Starter",
    subscription_status: "active",
    member_since: "2026-06-20",
    last_login: "2026-08-05T10:30:00Z",
    weather_location: "Lichtenburg,ZA",
    livestock_count: 28,
    crop_count: 5,
    planner_tasks: 4,
    finance_records: 12,
    health_score: 55,
  },
  "usr-006": {
    id: "usr-006",
    full_name: "Willem Pretorius",
    email: "willem.pretorius@telkomsa.net",
    farm_name: "Pretorius Brahman Stud",
    province: "Mpumalanga",
    subscription: "Pro",
    subscription_status: "active",
    member_since: "2025-11-05",
    last_login: "2026-08-06T06:15:00Z",
    weather_location: "Ermelo,ZA",
    livestock_count: 85,
    crop_count: 0,
    planner_tasks: 6,
    finance_records: 42,
    health_score: 90,
  },
  "usr-007": {
    id: "usr-007",
    full_name: "Annemarie Venter",
    email: "annemarie.venter@gmail.com",
    farm_name: "Venter Crop Farm",
    province: "Gauteng",
    subscription: "Pro",
    subscription_status: "active",
    member_since: "2026-05-12",
    last_login: "2026-08-04T13:00:00Z",
    weather_location: "Johannesburg,ZA",
    livestock_count: 10,
    crop_count: 12,
    planner_tasks: 18,
    finance_records: 31,
    health_score: 78,
  },
};

// ─── Mock Customer Timeline ─────────────────────────────────

const MOCK_TIMELINES = {
  "usr-004": [
    { type: "email", title: "Customer sent email", subtitle: "App crashes when opening Reports", timestamp: "2026-08-06T09:05:00Z" },
    { type: "ticket", title: "Support ticket created", subtitle: "FDX-1001 — Reports page crashes", timestamp: "2026-08-06T09:10:00Z" },
    { type: "reply", title: "Admin replied", subtitle: "Investigating the issue, asked to clear cache", timestamp: "2026-08-06T10:30:00Z" },
    { type: "login", title: "Customer logged in", subtitle: "Chrome on Windows", timestamp: "2026-08-06T08:45:00Z" },
    { type: "activity", title: "Viewed livestock page", subtitle: "2,400 animals in registry", timestamp: "2026-08-06T08:50:00Z" },
  ],
  "usr-001": [
    { type: "email", title: "Customer sent email", subtitle: "Cannot add more than 50 animals", timestamp: "2026-08-06T08:15:00Z" },
    { type: "ticket", title: "Support ticket created", subtitle: "FDX-1002 — Animal limit on Pro plan", timestamp: "2026-08-06T08:20:00Z" },
    { type: "login", title: "Customer logged in", subtitle: "Chrome on MacOS", timestamp: "2026-08-06T07:30:00Z" },
    { type: "subscription", title: "Subscription renewed", subtitle: "Pro plan — R299/month", timestamp: "2026-08-01T00:00:00Z" },
  ],
  "usr-006": [
    { type: "email", title: "Customer sent email", subtitle: "Breeding records disappeared", timestamp: "2026-08-06T06:30:00Z" },
    { type: "ticket", title: "Support ticket created", subtitle: "FDX-1003 — Missing breeding records", timestamp: "2026-08-06T06:35:00Z" },
    { type: "login", title: "Customer logged in", subtitle: "Safari on iPad", timestamp: "2026-08-06T06:15:00Z" },
    { type: "activity", title: "Added breeding record", subtitle: "Brahman heifer — AI mating", timestamp: "2026-08-05T14:20:00Z" },
  ],
};

// ─── Public API ─────────────────────────────────────────────

/**
 * Get full customer context for the context panel.
 */
export async function getCustomerContext(customerId) {
  if (!customerId) return null;
  return MOCK_CUSTOMERS[customerId] || null;
}

/**
 * Get customer activity timeline.
 */
export async function getCustomerTimeline(customerId) {
  if (!customerId) return [];
  const timeline = MOCK_TIMELINES[customerId] || [];
  return timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Search customers by name or email.
 */
export async function searchCustomers(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return Object.values(MOCK_CUSTOMERS).filter(
    (c) =>
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.farm_name.toLowerCase().includes(q)
  );
}

/**
 * Get support overview metrics for the Customer Success dashboard.
 */
export async function getSupportMetrics() {
  return {
    openTickets: 2,
    avgResponseTime: "1.2h",
    resolvedToday: 1,
    customerSatisfaction: "94%",
    unreadEmails: 4,
    pendingAssignment: 2,
  };
}


// ─── Customer Matching by Email ─────────────────────────────

import { supabase } from "../../supabaseClient";

/**
 * Match a customer by their email address.
 * Looks up the profiles table in Supabase.
 * Returns context data or null if no match.
 */
export async function matchCustomerByEmail(email) {
  if (!email) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, farm_name, province, created_at, weather_location")
      .eq("email", email)
      .single();

    if (error || !data) return null;

    // Build a context object similar to mock data
    return {
      id: data.id,
      full_name: data.full_name || email.split("@")[0],
      email: data.email,
      farm_name: data.farm_name || "—",
      province: data.province || "—",
      subscription: "—",
      subscription_status: "—",
      member_since: data.created_at,
      last_login: null,
      weather_location: data.weather_location || "—",
      livestock_count: "—",
      crop_count: "—",
      planner_tasks: "—",
      finance_records: "—",
      health_score: "—",
    };
  } catch {
    return null;
  }
}
