/**
 * ============================================================
 * Feldrix Control Centre — Executive Timeline Service
 * Version 2.3.2
 *
 * Permanent chronological business history of the platform.
 * Merges events from all modules into a unified timeline.
 * Structured for future AI (Feldrix Manager) consumption.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

// ─── Helpers ─────────────────────────────────────────────────

async function safeQuery(table, select, filter, options = {}) {
  try {
    let q = supabase.from(table).select(select);
    if (filter) q = filter(q);
    if (options.order) q = q.order(options.order, { ascending: options.ascending ?? false });
    if (options.limit) q = q.limit(options.limit);
    const { data } = await q;
    return data || [];
  } catch { return []; }
}

async function safeCount(table, filter) {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return count || 0;
  } catch { return 0; }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Event Collectors ────────────────────────────────────────

async function getCustomerEvents(since) {
  const data = await safeQuery(
    "profiles",
    "id, full_name, email, farm_name, country, province, created_at",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 50 }
  );
  return data.map(p => ({
    id: uid(),
    timestamp: p.created_at,
    category: "Customer",
    priority: "medium",
    title: "New customer registered",
    description: `${p.full_name || p.email || "Unknown"} joined Feldrix${p.farm_name ? ` — ${p.farm_name}` : ""}${p.country ? ` (${p.country})` : ""}`,
    icon: "👤",
    route: "/users",
    user: p.full_name || p.email || "Unknown",
    farm: p.farm_name || null,
    metadata: { userId: p.id, email: p.email, country: p.country, province: p.province },
  }));
}

async function getFarmEvents(since) {
  const data = await safeQuery(
    "farms",
    "id, farm_name, province, farm_type, created_at, profiles!owner_id(full_name)",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 40 }
  );
  return data.map(f => ({
    id: uid(),
    timestamp: f.created_at,
    category: "Farm",
    priority: "medium",
    title: "Farm created",
    description: `${f.farm_name || "New farm"} — ${f.farm_type || "Mixed Farm"}${f.province ? `, ${f.province}` : ""}`,
    icon: "🚜",
    route: "/farms",
    user: f.profiles?.full_name || null,
    farm: f.farm_name || null,
    metadata: { farmId: f.id, farmType: f.farm_type, province: f.province },
  }));
}

async function getLivestockEvents(since) {
  const data = await safeQuery(
    "livestock",
    "id, tag, breed, animal_type, created_at, profiles!user_id(full_name, farm_name)",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 30 }
  );
  return data.map(l => ({
    id: uid(),
    timestamp: l.created_at,
    category: "Farm",
    priority: "low",
    title: "Livestock record added",
    description: `${l.animal_type || "Animal"} — ${l.breed || "Unknown breed"} (Tag: ${l.tag || "—"})`,
    icon: "🐄",
    route: "/farms",
    user: l.profiles?.full_name || null,
    farm: l.profiles?.farm_name || null,
    metadata: { livestockId: l.id, animalType: l.animal_type, breed: l.breed },
  }));
}

async function getCropEvents(since) {
  const data = await safeQuery(
    "crops",
    "id, crop_name, variety, field_name, status, created_at, profiles!user_id(full_name, farm_name)",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 30 }
  );
  return data.map(c => ({
    id: uid(),
    timestamp: c.created_at,
    category: "Farm",
    priority: "low",
    title: "Crop record added",
    description: `${c.crop_name || "Crop"}${c.variety ? ` (${c.variety})` : ""} — ${c.field_name || "Field"} [${c.status || "Growing"}]`,
    icon: "🌾",
    route: "/farms",
    user: c.profiles?.full_name || null,
    farm: c.profiles?.farm_name || null,
    metadata: { cropId: c.id, cropName: c.crop_name, status: c.status },
  }));
}

async function getPlannerEvents(since) {
  const completed = await safeQuery(
    "planner_tasks",
    "id, title, category, priority, completed_at, profiles!user_id(full_name, farm_name)",
    q => q.eq("status", "Completed").gte("completed_at", since).order("completed_at", { ascending: false }),
    { limit: 20 }
  );
  return completed.map(t => ({
    id: uid(),
    timestamp: t.completed_at,
    category: "Operations",
    priority: "low",
    title: "Task completed",
    description: `${t.title} [${t.category || "General"}]`,
    icon: "✅",
    route: "/farms",
    user: t.profiles?.full_name || null,
    farm: t.profiles?.farm_name || null,
    metadata: { taskId: t.id, taskCategory: t.category, taskPriority: t.priority },
  }));
}

async function getPaymentEvents(since) {
  const data = await safeQuery(
    "subscription_payments",
    "id, amount, currency, status, provider, created_at, profiles!user_id(full_name, farm_name)",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 30 }
  );
  return data.map(p => {
    const isSuccess = p.status === "success";
    const isFailed = p.status === "failed";
    return {
      id: uid(),
      timestamp: p.created_at,
      category: "Finance",
      priority: isFailed ? "high" : "medium",
      title: isFailed ? "Payment failed" : isSuccess ? "Payment received" : "Payment pending",
      description: `R${p.amount || 0} ${p.currency || "ZAR"} via ${p.provider || "PayFast"} — ${p.profiles?.full_name || "Unknown"}`,
      icon: isFailed ? "❌" : isSuccess ? "💰" : "⏳",
      route: "/payments",
      user: p.profiles?.full_name || null,
      farm: p.profiles?.farm_name || null,
      metadata: { paymentId: p.id, amount: p.amount, status: p.status, provider: p.provider },
    };
  });
}

async function getSubscriptionEvents(since) {
  const data = await safeQuery(
    "subscriptions",
    "id, plan, status, billing_cycle, created_at, updated_at, profiles!user_id(full_name, farm_name)",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 20 }
  );
  return data.map(s => ({
    id: uid(),
    timestamp: s.created_at,
    category: "Subscription",
    priority: s.plan === "pro" ? "high" : "medium",
    title: s.plan === "pro" ? "PRO subscription activated" : "Subscription created",
    description: `${s.profiles?.full_name || "Customer"} — ${s.plan?.toUpperCase() || "STARTER"} (${s.billing_cycle || "monthly"})`,
    icon: s.plan === "pro" ? "⭐" : "📋",
    route: "/subscriptions",
    user: s.profiles?.full_name || null,
    farm: s.profiles?.farm_name || null,
    metadata: { subscriptionId: s.id, plan: s.plan, status: s.status, billingCycle: s.billing_cycle },
  }));
}

async function getHealthRecordEvents(since) {
  const data = await safeQuery(
    "animal_health",
    "id, treatment_type, medication, treatment_date, created_at, profiles!user_id(full_name, farm_name)",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 20 }
  );
  return data.map(h => ({
    id: uid(),
    timestamp: h.created_at,
    category: "Farm",
    priority: "low",
    title: "Health record added",
    description: `${h.treatment_type || "Treatment"}${h.medication ? ` — ${h.medication}` : ""}`,
    icon: "💊",
    route: "/farms",
    user: h.profiles?.full_name || null,
    farm: h.profiles?.farm_name || null,
    metadata: { healthId: h.id, treatmentType: h.treatment_type },
  }));
}

async function getAuditEvents(since) {
  const data = await safeQuery(
    "admin_audit_log",
    "id, action, target_type, target_id, details, created_at, profiles!admin_id(full_name)",
    q => q.gte("created_at", since).order("created_at", { ascending: false }),
    { limit: 20 }
  );
  return data.map(a => {
    const isSecurity = a.action?.includes("role") || a.action?.includes("suspend");
    return {
      id: uid(),
      timestamp: a.created_at,
      category: isSecurity ? "Security" : "Operations",
      priority: isSecurity ? "high" : "medium",
      title: formatAuditAction(a.action),
      description: `By ${a.profiles?.full_name || "Admin"} — Target: ${a.target_type || "—"}`,
      icon: isSecurity ? "🔒" : "📋",
      route: "/audit",
      user: a.profiles?.full_name || null,
      farm: null,
      metadata: { auditId: a.id, action: a.action, targetType: a.target_type, targetId: a.target_id, details: a.details },
    };
  });
}

function formatAuditAction(action) {
  if (!action) return "Admin action";
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Summary & Statistics ────────────────────────────────────

function computeSummary(events) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const todayEvents = events.filter(e => e.timestamp >= todayStart);

  const registrations = todayEvents.filter(e => e.category === "Customer").length;
  const revenue = todayEvents
    .filter(e => e.category === "Finance" && e.metadata?.status === "success")
    .reduce((s, e) => s + (e.metadata?.amount || 0), 0);
  const farmActivity = todayEvents.filter(e => e.category === "Farm").length;
  const platformAlerts = todayEvents.filter(e => e.category === "Platform" || e.category === "System").length;
  const supportCases = todayEvents.filter(e => e.category === "Support").length;
  const aiRecommendations = todayEvents.filter(e => e.category === "AI").length;

  return {
    registrations,
    revenue,
    farmActivity,
    platformAlerts,
    supportCases,
    aiRecommendations,
  };
}

function computeStatistics(events) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const eventsToday = events.filter(e => e.timestamp >= todayStart).length;
  const eventsWeek = events.filter(e => e.timestamp >= weekAgo).length;
  const eventsMonth = events.filter(e => e.timestamp >= monthStart).length;

  // Most active module
  const categoryCounts = {};
  events.forEach(e => { categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1; });
  const mostActiveModule = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Most active customer
  const userCounts = {};
  events.forEach(e => { if (e.user) userCounts[e.user] = (userCounts[e.user] || 0) + 1; });
  const mostActiveCustomer = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return {
    eventsToday,
    eventsWeek,
    eventsMonth,
    mostActiveModule,
    mostActiveCustomer,
  };
}

// ─── Master Function ─────────────────────────────────────────

export async function runExecutiveTimeline({ limit = 100 } = {}) {
  // Fetch events from the last 30 days
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    customerEvents,
    farmEvents,
    livestockEvents,
    cropEvents,
    plannerEvents,
    paymentEvents,
    subscriptionEvents,
    healthRecordEvents,
    auditEvents,
  ] = await Promise.all([
    getCustomerEvents(since),
    getFarmEvents(since),
    getLivestockEvents(since),
    getCropEvents(since),
    getPlannerEvents(since),
    getPaymentEvents(since),
    getSubscriptionEvents(since),
    getHealthRecordEvents(since),
    getAuditEvents(since),
  ]);

  // Merge and sort (newest first)
  const allEvents = [
    ...customerEvents,
    ...farmEvents,
    ...livestockEvents,
    ...cropEvents,
    ...plannerEvents,
    ...paymentEvents,
    ...subscriptionEvents,
    ...healthRecordEvents,
    ...auditEvents,
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Deduplicate by checking timestamp + category + user (within 1s window)
  const seen = new Set();
  const deduped = allEvents.filter(e => {
    const key = `${e.category}-${e.title}-${e.user}-${Math.floor(new Date(e.timestamp).getTime() / 1000)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const timeline = deduped.slice(0, limit);
  const summary = computeSummary(timeline);
  const statistics = computeStatistics(timeline);

  return { timeline, summary, statistics };
}
