/**
 * ============================================================
 * Feldrix Control Centre — System Health Service
 * Sprint 46.2
 *
 * Checks platform service health.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

/**
 * Check Supabase database connectivity.
 */
async function checkDatabase() {
  try {
    const start = Date.now();
    const { error } = await supabase.from("profiles").select("id", { head: true }).limit(1);
    const latency = Date.now() - start;
    return { status: error ? "degraded" : "healthy", latency };
  } catch {
    return { status: "down", latency: null };
  }
}

/**
 * Check Supabase Auth.
 */
async function checkAuth() {
  try {
    const start = Date.now();
    await supabase.auth.getSession();
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch {
    return { status: "down", latency: null };
  }
}

/**
 * Check Supabase Storage.
 */
async function checkStorage() {
  try {
    const start = Date.now();
    await supabase.storage.listBuckets();
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch {
    return { status: "degraded", latency: null };
  }
}

/**
 * Get full system health report.
 */
export async function getSystemHealth() {
  const [database, auth, storage] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkStorage(),
  ]);

  const services = {
    supabase: database,
    auth,
    storage,
    edge: { status: "healthy", latency: null }, // placeholder
    payments: { status: "healthy", latency: null }, // placeholder
  };

  const allHealthy = Object.values(services).every((s) => s.status === "healthy");
  const anyDown = Object.values(services).some((s) => s.status === "down");

  return {
    services,
    overall: anyDown ? "down" : allHealthy ? "healthy" : "degraded",
  };
}
