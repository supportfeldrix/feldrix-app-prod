/**
 * ============================================================
 * Feldrix Control Centre — Notification Service
 * Sprint 46.2
 *
 * Broadcast messages to users.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

/**
 * Create a broadcast notification.
 */
export async function createBroadcast({ adminId, type, title, body, target = "all" }) {
  const { data, error } = await supabase
    .from("admin_broadcasts")
    .insert({ admin_id: adminId, type, title, body, target })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get broadcast history.
 */
export async function getBroadcasts({ limit = 25, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from("admin_broadcasts")
    .select("*, profiles!admin_id(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { broadcasts: data || [], total: count || 0 };
}

/**
 * Deactivate a broadcast.
 */
export async function deactivateBroadcast(broadcastId) {
  const { error } = await supabase
    .from("admin_broadcasts")
    .update({ active: false })
    .eq("id", broadcastId);

  if (error) throw error;
}
