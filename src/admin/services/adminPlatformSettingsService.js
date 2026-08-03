/**
 * ============================================================
 * Feldrix Control Centre — Platform Settings Service
 * Sprint 53.0
 *
 * Reads/writes platform_settings table.
 * All methods null-safe.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

async function getSetting(key) {
  try {
    const { data } = await supabase.from("platform_settings").select("value").eq("key", key).single();
    return data?.value || null;
  } catch { return null; }
}

async function saveSetting(key, value, adminId) {
  try {
    await supabase.from("platform_settings").upsert({ key, value, updated_by: adminId, updated_at: new Date().toISOString() }, { onConflict: "key" });
  } catch (err) { console.warn("[Settings] Save failed:", err?.message); }
}

// ─── Grouped Getters ─────────────────────────────────────────

export async function getPlatformSettings() {
  return {
    platform: await getSetting("platform") || { name: "Feldrix", company: "Feldrix (Pty) Ltd", supportEmail: "support@feldrix.com", supportUrl: "https://feldrix.com", version: "1.0.0", environment: "production" },
    branding: await getSetting("branding") || { primaryColor: "#2E7D32", secondaryColor: "#66BB6A", theme: "green" },
    subscriptions: await getSetting("subscriptions") || { starterPrice: 0, proPrice: 99, currency: "ZAR", trialDays: 0, billingCycle: "monthly" },
    payfast: await getSetting("payfast") || { merchantId: "", sandbox: true, webhookStatus: "unknown", connected: false },
    ai: await getSetting("ai") || { enabled: true, briefings: true, recommendations: true, confidence: 70, autoRefresh: true },
    notifications: await getSetting("notifications") || { email: true, push: false, sms: false, maintenance: true, marketing: true, billing: true },
    weather: await getSetting("weather") || { apiKey: "configured", country: "ZA", refreshInterval: 30, connected: true },
    security: await getSetting("security") || { passwordMinLength: 6, sessionTimeout: 30, failedLoginLimit: 5, emailVerification: false, mfa: false },
    featureFlags: await getSetting("feature_flags") || { livestock: true, crops: true, planner: true, finance: true, machinery: true, reports: true, weather: true, ai: true, customerSuccess: true, analytics: true },
    system: await getSetting("system") || { maintenanceMode: false, version: "1.0.0", release: "Sprint 53" },
    backups: await getSetting("backups") || { lastBackup: null, health: "unknown", autoBackup: false },
    audit: await getSetting("audit") || { retentionDays: 90, level: "all", securityMonitoring: true },
  };
}

export async function savePlatformSection(section, value, adminId) {
  await saveSetting(section, value, adminId);
}

// ─── Audit-Specific Service Extension ────────────────────────

export async function getAuditMetrics() {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  async function safeAuditCount(filter) {
    try {
      let q = supabase.from("admin_audit_log").select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count || 0;
    } catch { return 0; }
  }

  const [total, today, critical, warning, security, billing] = await Promise.all([
    safeAuditCount(),
    safeAuditCount((q) => q.gte("created_at", todayStart)),
    safeAuditCount((q) => q.contains("details", { severity: "error" })),
    safeAuditCount((q) => q.contains("details", { severity: "warn" })),
    safeAuditCount((q) => q.contains("details", { severity: "security" })),
    safeAuditCount((q) => q.ilike("action", "%payment%")),
  ]);

  return { total, today, critical, warning, security, billing, failedLogins: 0, permissionChanges: security };
}

export async function getAuditEntries({ search = "", filter = "all", sortBy = "created_at", sortDir = "desc", limit = 25, offset = 0 } = {}) {
  try {
    let query = supabase
      .from("admin_audit_log")
      .select("*, profiles!admin_id(full_name, email, role)", { count: "exact" })
      .order(sortBy, { ascending: sortDir === "asc" })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`action.ilike.%${search}%,target_type.ilike.%${search}%`);
    }

    const now = new Date();
    switch (filter) {
      case "today": query = query.gte("created_at", new Date(now.setHours(0, 0, 0, 0)).toISOString()); break;
      case "yesterday": {
        const y = new Date(); y.setDate(y.getDate() - 1); y.setHours(0, 0, 0, 0);
        const yEnd = new Date(y); yEnd.setDate(yEnd.getDate() + 1);
        query = query.gte("created_at", y.toISOString()).lt("created_at", yEnd.toISOString()); break;
      }
      case "7days": query = query.gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()); break;
      case "30days": query = query.gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()); break;
      case "security": query = query.contains("details", { severity: "security" }); break;
      case "critical": query = query.contains("details", { severity: "error" }); break;
      case "warning": query = query.contains("details", { severity: "warn" }); break;
      default: break;
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { entries: data || [], total: count || 0 };
  } catch {
    return { entries: [], total: 0 };
  }
}
