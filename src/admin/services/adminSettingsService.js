/**
 * ============================================================
 * Feldrix Control Centre — Settings Service
 * Sprint 46.2
 *
 * Platform-wide configuration stored in platform_settings table.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

/**
 * Get a setting by key.
 */
export async function getSetting(key) {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data?.value || null;
}

/**
 * Get all settings.
 */
export async function getAllSettings() {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value, updated_at")
    .order("key");

  if (error) throw error;
  return data || [];
}

/**
 * Upsert a setting.
 */
export async function saveSetting(key, value, adminId) {
  const { error } = await supabase
    .from("platform_settings")
    .upsert(
      { key, value, updated_by: adminId, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) throw error;
}

/**
 * Check if maintenance mode is active.
 */
export async function isMaintenanceMode() {
  const setting = await getSetting("maintenance_mode");
  return setting?.enabled === true;
}
