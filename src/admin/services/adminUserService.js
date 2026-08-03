/**
 * ============================================================
 * Feldrix Control Centre — User Service (Enterprise)
 * Sprint 47.0
 *
 * Full CRUD, timeline, notes, role management, audit logging.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";
import { logAuditEvent } from "./adminAuditService";
import { AUDIT_SEVERITY } from "../utils/adminConstants";

// ─── User Queries ────────────────────────────────────────────

/**
 * Get users with filtering, search, sorting, and pagination.
 */
export async function getUsers({
  search = "",
  filter = "all",
  sortBy = "created_at",
  sortDir = "desc",
  limit = 25,
  offset = 0,
} = {}) {
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, email, farm_name, role, suspended, last_login, created_at, country, province, onboarding_state",
      { count: "exact" }
    )
    .order(sortBy, { ascending: sortDir === "asc" })
    .range(offset, offset + limit - 1);

  // Search
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,farm_name.ilike.%${search}%`
    );
  }

  // Filters
  switch (filter) {
    case "active":
      query = query.eq("suspended", false);
      break;
    case "suspended":
      query = query.eq("suspended", true);
      break;
    case "pro":
      // Will refine with subscriptions table when available
      query = query.eq("suspended", false);
      break;
    case "starter":
      query = query.eq("suspended", false);
      break;
    case "admin":
      query = query.eq("role", "admin");
      break;
    case "support":
      query = query.eq("role", "support");
      break;
    case "finance":
      query = query.eq("role", "finance");
      break;
    case "readonly":
      query = query.eq("role", "readonly");
      break;
    case "new_this_week": {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte("created_at", weekAgo.toISOString());
      break;
    }
    case "inactive": {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.or(`last_login.is.null,last_login.lt.${thirtyDaysAgo.toISOString()}`);
      break;
    }
    default:
      break;
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { users: data || [], total: count || 0 };
}

/**
 * Get a single user's full profile with related counts.
 */
export async function getUserDetail(userId) {
  if (!userId) return { profile: null, counts: {} };

  const profileRes = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (profileRes.error) throw profileRes.error;

  // Count queries — each wrapped individually so one table missing doesn't crash all
  const [livestockRes, cropsRes, tasksRes, financeRes] = await Promise.all([
    supabase.from("livestock").select("*", { count: "exact", head: true }).eq("user_id", userId).then(r => r).catch(() => ({ count: 0 })),
    supabase.from("crops").select("*", { count: "exact", head: true }).eq("user_id", userId).then(r => r).catch(() => ({ count: 0 })),
    supabase.from("planner_tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).then(r => r).catch(() => ({ count: 0 })),
    supabase.from("finance_records").select("*", { count: "exact", head: true }).eq("user_id", userId).then(r => r).catch(() => ({ count: 0 })),
  ]);

  return {
    profile: profileRes.data || {},
    counts: {
      livestock: livestockRes.count || 0,
      crops: cropsRes.count || 0,
      tasks: tasksRes.count || 0,
      finance: financeRes.count || 0,
    },
  };
}

/**
 * Get total user count.
 */
export async function getUserCount() {
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

/**
 * Get today's signups count.
 */
export async function getTodaySignups() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());
  if (error) throw error;
  return count || 0;
}

// ─── User Actions ────────────────────────────────────────────

/**
 * Suspend a user.
 */
export async function suspendUser(userId, adminId) {
  const { error } = await supabase
    .from("profiles")
    .update({ suspended: true, suspended_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;

  await logAuditEvent({
    adminId,
    action: "user_suspended",
    targetType: "user",
    targetId: userId,
    severity: AUDIT_SEVERITY.WARN,
  });

  await addTimelineEvent(userId, "admin_action", "Account Suspended", "Account was suspended by an administrator.");
}

/**
 * Reactivate a suspended user.
 */
export async function reactivateUser(userId, adminId) {
  const { error } = await supabase
    .from("profiles")
    .update({ suspended: false, suspended_at: null })
    .eq("id", userId);
  if (error) throw error;

  await logAuditEvent({
    adminId,
    action: "user_reactivated",
    targetType: "user",
    targetId: userId,
    severity: AUDIT_SEVERITY.INFO,
  });

  await addTimelineEvent(userId, "admin_action", "Account Reactivated", "Account was reactivated by an administrator.");
}

/**
 * Change a user's role.
 */
export async function changeUserRole(userId, newRole, adminId) {
  const { data: prev } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (error) throw error;

  await logAuditEvent({
    adminId,
    action: "user_role_changed",
    targetType: "user",
    targetId: userId,
    details: { previousRole: prev?.role, newRole },
    severity: AUDIT_SEVERITY.SECURITY,
  });

  await addTimelineEvent(userId, "role_change", "Role Changed", `Role changed from ${prev?.role || "unknown"} to ${newRole}.`);
}

/**
 * Restart a user's onboarding.
 */
export async function restartOnboarding(userId, adminId) {
  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_state: { dismissed: false, completed: false, completed_at: null, dashboard_visited: false, last_seen: null, version: 1 },
    })
    .eq("id", userId);
  if (error) throw error;

  await logAuditEvent({
    adminId,
    action: "onboarding_restarted",
    targetType: "user",
    targetId: userId,
    severity: AUDIT_SEVERITY.INFO,
  });

  await addTimelineEvent(userId, "admin_action", "Onboarding Restarted", "Onboarding was restarted by an administrator.");
}

// ─── Timeline ────────────────────────────────────────────────

/**
 * Get user timeline events.
 */
export async function getUserTimeline(userId, { limit = 30 } = {}) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("user_timeline")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Add a timeline event.
 */
export async function addTimelineEvent(userId, eventType, title, description = null, metadata = {}) {
  try {
    await supabase.from("user_timeline").insert({
      user_id: userId,
      event_type: eventType,
      title,
      description,
      metadata,
    });
  } catch {
    // Non-blocking — timeline is supplementary
  }
}

// ─── Notes ───────────────────────────────────────────────────

/**
 * Get admin notes for a user.
 */
export async function getUserNotes(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("admin_notes")
      .select("*, profiles!admin_id(full_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Add an admin note.
 */
export async function addUserNote(userId, adminId, content) {
  if (!userId || !adminId || !content) return null;
  try {
    const { data, error } = await supabase
      .from("admin_notes")
      .insert({ user_id: userId, admin_id: adminId, content })
      .select("*, profiles!admin_id(full_name)")
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Delete an admin note.
 */
export async function deleteUserNote(noteId) {
  const { error } = await supabase
    .from("admin_notes")
    .delete()
    .eq("id", noteId);

  if (error) throw error;
}
