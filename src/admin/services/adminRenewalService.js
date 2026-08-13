/**
 * Feldrix Sprint 49 — Admin Renewal Automation Service
 * Invokes the subscription-renewal Edge Function and manages renewal history.
 */

import { supabase } from "../../supabaseClient";

/**
 * Run the subscription renewal engine (full processing).
 */
export async function runRenewalNow() {
  try {
    const { data, error } = await supabase.functions.invoke("subscription-renewal", {
      body: { mode: "process" },
    });
    if (error) return { success: false, message: `Edge Function error: ${error.message}` };
    return { success: true, ...data };
  } catch (err) {
    return { success: false, message: `Failed: ${err.message}` };
  }
}

/**
 * Simulate renewal processing (dry run — no changes made).
 */
export async function simulateRenewal() {
  try {
    const { data, error } = await supabase.functions.invoke("subscription-renewal", {
      body: { mode: "simulate" },
    });
    if (error) return { success: false, message: `Edge Function error: ${error.message}` };
    return { success: true, ...data };
  } catch (err) {
    return { success: false, message: `Failed: ${err.message}` };
  }
}

/**
 * Retry failed renewals only.
 */
export async function retryFailedRenewals() {
  try {
    const { data, error } = await supabase.functions.invoke("subscription-renewal", {
      body: { mode: "retry" },
    });
    if (error) return { success: false, message: `Edge Function error: ${error.message}` };
    return { success: true, ...data };
  } catch (err) {
    return { success: false, message: `Failed: ${err.message}` };
  }
}

/**
 * Check renewal engine health.
 */
export async function checkRenewalHealth() {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke("subscription-renewal", {
      body: { mode: "health" },
    });
    const responseTime = Date.now() - startTime;
    if (error) return { online: false, message: error.message, responseTime };
    return { online: true, responseTime, ...data };
  } catch (err) {
    return { online: false, message: err.message };
  }
}

/**
 * Get renewal audit history from admin_audit_log.
 */
export async function getRenewalHistory(limit = 50) {
  try {
    const { data, error } = await supabase
      .from("admin_audit_log")
      .select("id, action, target_id, details, created_at")
      .eq("action", "subscription_renewal_processing")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Get count of subscriptions currently pending cancellation past their renewal date.
 */
export async function getPendingRenewals() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan, renewal_date")
      .eq("status", "Pending Cancellation")
      .lte("renewal_date", today);

    if (error) return { count: 0, items: [] };
    return { count: data?.length || 0, items: data || [] };
  } catch {
    return { count: 0, items: [] };
  }
}

/**
 * Get renewal statistics (processed today, total, failures).
 */
export async function getRenewalStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("admin_audit_log")
      .select("details, created_at")
      .eq("action", "subscription_renewal_processing");

    if (error || !data) return { total: 0, today: 0, succeeded: 0, failed: 0 };

    const today = data.filter((r) => new Date(r.created_at) >= todayStart);
    const succeeded = data.filter((r) => r.details?.outcome === "SUCCESS");
    const failed = data.filter((r) => r.details?.outcome !== "SUCCESS");

    return {
      total: data.length,
      today: today.length,
      succeeded: succeeded.length,
      failed: failed.length,
    };
  } catch {
    return { total: 0, today: 0, succeeded: 0, failed: 0 };
  }
}
