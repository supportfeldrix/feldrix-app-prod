/**
 * ============================================================
 * Feldrix Control Centre — User Service
 * Sprint 46.2
 *
 * Admin queries for user management.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

/**
 * Get all users with profile data.
 */
export async function getUsers({ search = "", filter = "all", limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, farm_name, role, suspended, last_login, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,farm_name.ilike.%${search}%`);
  }

  if (filter === "active") query = query.eq("suspended", false);
  if (filter === "suspended") query = query.eq("suspended", true);
  if (filter === "pro") query = query.eq("role", "farmer"); // TODO: link to subscription status

  const { data, error, count } = await query;
  if (error) throw error;
  return { users: data || [], total: count || 0 };
}

/**
 * Get a single user's full profile.
 */
export async function getUserById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Suspend a user.
 */
export async function suspendUser(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({ suspended: true, suspended_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Reactivate a suspended user.
 */
export async function reactivateUser(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({ suspended: false, suspended_at: null })
    .eq("id", userId);

  if (error) throw error;
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
