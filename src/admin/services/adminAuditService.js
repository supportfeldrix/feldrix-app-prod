/**
 * ============================================================
 * Feldrix Control Centre — Audit Service
 * Sprint 46.2
 *
 * Logs and retrieves admin actions for accountability.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";
import { AUDIT_SEVERITY } from "../utils/adminConstants";

/**
 * Log an admin action.
 */
export async function logAuditEvent({
  adminId,
  action,
  targetType = null,
  targetId = null,
  details = {},
  severity = AUDIT_SEVERITY.INFO,
}) {
  try {
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: { ...details, severity },
    });
  } catch (err) {
    console.warn("[Audit] Failed to log event:", err?.message);
  }
}

/**
 * Get audit log entries.
 */
export async function getAuditLog({ limit = 50, offset = 0, severity = null } = {}) {
  let query = supabase
    .from("admin_audit_log")
    .select("*, profiles!admin_id(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (severity) {
    query = query.eq("details->>severity", severity);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { entries: data || [], total: count || 0 };
}
