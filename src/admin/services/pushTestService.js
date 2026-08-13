/**
 * Feldrix v1.2.1 — Push Notification Test Service
 * Admin-only service for testing the Weather Push Notification Platform.
 *
 * Provides:
 *   - Send test notifications (locally + via Edge Function)
 *   - Device registration status check
 *   - VAPID configuration verification
 *   - Edge Function health check
 *   - Notification history log retrieval
 *
 * NO third-party services. Uses Supabase + Web Push API only.
 */

import { supabase } from "../../supabaseClient";
import {
  isPushSupported,
  getPermissionStatus,
  getSettings,
  sendWeatherNotification,
  getNotificationHistory,
} from "../../services/pushNotificationService";

// ═══════════════════════════════════════════════════════════════════════════════
// TEST NOTIFICATION TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const TEST_ALERTS = {
  test: {
    id: "test-push-notification",
    type: "TEST",
    alertType: "TEST",
    priority: "High",
    title: "FELDRIX TEST",
    message: "This is a Weather Push Notification test.\nYour Push Notification system is working correctly.\nTap to open Weather Intelligence.",
    icon: "🚨",
    color: "#3B82F6",
    advice: ["Push notification delivered successfully.", "Deep link to Weather page is working."],
    details: {},
    farmName: "",
  },
  freeze: {
    id: "test-freeze-alert",
    type: "FREEZE",
    alertType: "FREEZE",
    priority: "Critical",
    title: "Freeze Warning (TEST)",
    message: "Temperature expected to drop to -3°C. Protect livestock and crops immediately.",
    icon: "❄️",
    color: "#3B82F6",
    advice: ["Move calves and lambs indoors", "Increase bedding in shelters", "Protect water supplies from freezing"],
    details: { expectedMin: -3, riskLevel: "EXTREME" },
    farmName: "",
  },
  frost: {
    id: "test-frost-alert",
    type: "FROST",
    alertType: "FROST",
    priority: "High",
    title: "Frost Advisory (TEST)",
    message: "Temperature expected to drop to 2°C. Frost damage risk for crops.",
    icon: "🌨️",
    color: "#60A5FA",
    advice: ["Protect seedlings and young plants", "Delay irrigation until after sunrise"],
    details: { expectedMin: 2, riskLevel: "HIGH" },
    farmName: "",
  },
  storm: {
    id: "test-storm-alert",
    type: "STORM",
    alertType: "STORM",
    priority: "High",
    title: "Thunderstorm Warning (TEST)",
    message: "Thunderstorm activity expected. Lightning and strong gusts possible.",
    icon: "⛈️",
    color: "#7C3AED",
    advice: ["Avoid open fields during storm", "Delay livestock movement", "Secure loose structures"],
    details: { riskLevel: "HIGH" },
    farmName: "",
  },
  wind: {
    id: "test-wind-alert",
    type: "HIGH_WIND",
    alertType: "HIGH_WIND",
    priority: "High",
    title: "Strong Wind Advisory (TEST)",
    message: "Wind speeds of 55 km/h expected. Postpone spraying.",
    icon: "💨",
    color: "#6B7280",
    advice: ["Delay all spraying operations", "Secure irrigation systems", "Secure loose equipment"],
    details: { expectedWind: 55, riskLevel: "HIGH" },
    farmName: "",
  },
  heatwave: {
    id: "test-heatwave-alert",
    type: "HEATWAVE",
    alertType: "HEATWAVE",
    priority: "Critical",
    title: "Extreme Heat Warning (TEST)",
    message: "Temperature expected to reach 42°C. Heat stress risk for livestock.",
    icon: "🔥",
    color: "#EF4444",
    advice: ["Increase water supply for all livestock", "Provide additional shade", "Avoid transporting livestock"],
    details: { expectedMax: 42, riskLevel: "EXTREME" },
    farmName: "",
  },
  flood: {
    id: "test-flood-alert",
    type: "FLOOD",
    alertType: "FLOOD",
    priority: "Critical",
    title: "Flood Warning (TEST)",
    message: "60mm of rainfall expected. Flooding possible in low-lying areas.",
    icon: "🌊",
    color: "#7C3AED",
    advice: ["Move livestock from low-lying areas", "Secure all loose equipment", "Prepare emergency feed reserves"],
    details: { expectedRainfall: 60, riskLevel: "EXTREME" },
    farmName: "",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST NOTIFICATION DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a local test notification immediately.
 * Bypasses cooldown for testing purposes.
 *
 * @param {string} alertType - One of: test, freeze, frost, storm, wind, heatwave, flood
 * @param {string} farmName - Farm name to include in notification
 * @returns {{ success: boolean, message: string }}
 */
export function sendTestNotification(alertType, farmName = "") {
  const template = TEST_ALERTS[alertType];
  if (!template) {
    return { success: false, message: `Unknown alert type: ${alertType}` };
  }

  if (!isPushSupported()) {
    return { success: false, message: "Push notifications not supported in this browser." };
  }

  if (getPermissionStatus() !== "granted") {
    return { success: false, message: "Notification permission not granted. Please enable notifications first." };
  }

  const alert = { ...template, farmName: farmName || template.farmName };

  // Send directly (bypasses cooldown for testing)
  try {
    const title = `🚨 ${alert.title}`;
    const body = farmName ? `Farm: ${farmName}\n${alert.message}` : alert.message;

    const options = {
      body,
      icon: "/Branding/app-icon-192.png",
      badge: "/Branding/app-icon-192.png",
      tag: `feldrix-test-${alertType}`,
      renotify: true,
      requireInteraction: alert.priority === "Critical",
      vibrate: [200, 100, 200, 100, 200],
      data: {
        url: "/weather#alerts",
        alertType: alert.type,
        farmName,
        timestamp: Date.now(),
      },
      actions: [
        { action: "view", title: "View Details" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
    } else {
      new Notification(title, options);
    }

    return { success: true, message: `Test notification sent: ${alert.title}` };
  } catch (err) {
    return { success: false, message: `Failed: ${err.message}` };
  }
}

/**
 * Trigger the Edge Function for a specific user (admin testing).
 * Calls the weather-push Edge Function with a test payload.
 * This uses the REAL production Web Push pipeline (VAPID JWT + AES-128-GCM encryption).
 *
 * @param {string} alertType - Optional specific alert type to test
 * @returns {{ success: boolean, message: string, data?: any }}
 */
export async function triggerEdgeFunctionTest(alertType = null) {
  try {
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Auth might not be available in admin context
    }

    const body = {
      type: "test",
      alertType: alertType || null,
      userId,
    };

    const { data, error } = await supabase.functions.invoke("weather-push", { body });

    if (error) {
      const message = error.message?.includes("not found") || error.message?.includes("404")
        ? "Edge Function not deployed. Run: supabase functions deploy weather-push"
        : `Edge Function error: ${error.message}`;
      return { success: false, message };
    }

    if (data?.sent > 0) {
      return { success: true, message: `Production push sent to ${data.sent} device(s). Check your notification tray.`, data };
    } else if (data?.failed > 0) {
      return { success: false, message: `Push failed for ${data.failed} device(s): ${data.errors?.[0] || "Unknown error"}`, data };
    } else {
      return { success: true, message: "Edge Function executed. No subscriptions found to push to.", data };
    }
  } catch (err) {
    return { success: false, message: `Failed to invoke Edge Function: ${err.message || "Network error"}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE & REGISTRATION STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get complete device registration status for the current user.
 * Gracefully handles missing tables (migration not yet run).
 */
export async function getDeviceStatus() {
  const status = {
    pushSupported: isPushSupported(),
    permissionStatus: getPermissionStatus(),
    subscriptionActive: false,
    deviceName: getDeviceName(),
    browser: getBrowserName(),
    platform: getPlatformName(),
    serviceWorkerActive: false,
    lastPush: null,
    subscriptionCount: 0,
    registeredDevices: [],
    error: null,
  };

  // Check service worker
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration("/sw-weather.js");
      status.serviceWorkerActive = !!reg?.active;
    }
  } catch { /* non-blocking */ }

  // Check subscription in browser
  if (isPushSupported() && navigator.serviceWorker) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      status.subscriptionActive = !!sub;
    } catch { /* unavailable */ }
  }

  // Check Supabase for user's subscriptions (table may not exist yet)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Query push_subscriptions — may 404 if table doesn't exist
      try {
        const { data: subs, error: subsError } = await supabase
          .from("push_subscriptions")
          .select("id, device_name, browser, platform, last_seen, created_at")
          .eq("user_id", user.id)
          .order("last_seen", { ascending: false });

        if (!subsError && subs) {
          status.subscriptionCount = subs.length;
          status.registeredDevices = subs;
        }
      } catch {
        // Table doesn't exist yet — that's OK
      }

      // Query notification_history — may 404 if table doesn't exist
      try {
        const { data: lastPush, error: histError } = await supabase
          .from("notification_history")
          .select("sent_at, title, status")
          .eq("user_id", user.id)
          .order("sent_at", { ascending: false })
          .limit(1);

        if (!histError && lastPush && lastPush.length > 0) {
          status.lastPush = lastPush[0];
        }
      } catch {
        // Table doesn't exist yet — that's OK
      }
    }
  } catch (err) {
    status.error = "Could not fetch user data.";
  }

  return status;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAPID STATUS CHECK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check VAPID key configuration status.
 */
export function getVapidStatus() {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

  return {
    configured: !!publicKey,
    publicKeyPresent: !!publicKey,
    publicKeyPreview: publicKey ? `${publicKey.substring(0, 12)}...${publicKey.substring(publicKey.length - 8)}` : "NOT SET",
    message: publicKey
      ? "VAPID keys configured. Push subscriptions can be created."
      : "Weather Push is not configured. Missing VAPID Keys. Set VITE_VAPID_PUBLIC_KEY in your .env file.",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if the weather-push Edge Function is reachable and responding.
 * Returns offline status if the function is not deployed yet.
 */
export async function checkEdgeFunctionHealth() {
  try {
    const startTime = Date.now();

    const { data, error } = await supabase.functions.invoke("weather-push", {
      body: { type: "health_check" },
    });

    const responseTime = Date.now() - startTime;

    if (error) {
      // Edge Function not deployed or unreachable
      const message = error.message?.includes("not found") || error.message?.includes("404")
        ? "Edge Function not deployed yet. Run: supabase functions deploy weather-push"
        : `Edge Function error: ${error.message}`;
      return {
        online: false,
        message,
        responseTime: null,
        lastRun: null,
      };
    }

    return {
      online: true,
      message: "Weather Push Service is online.",
      responseTime,
      data,
      lastRun: data?.timestamp || null,
      version: data?.version || "unknown",
      vapidConfigured: data?.vapidConfigured || false,
    };
  } catch (err) {
    return {
      online: false,
      message: `Cannot reach Edge Function: ${err.message || "Network error"}`,
      responseTime: null,
      lastRun: null,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION HISTORY LOG (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get notification history for all users (admin view).
 * Returns empty array if table doesn't exist yet (migration not run).
 * @param {number} limit - Max entries to return
 */
export async function getAdminNotificationLog(limit = 50) {
  try {
    const { data, error } = await supabase
      .from("notification_history")
      .select(`
        id,
        user_id,
        notification_id,
        alert_type,
        title,
        message,
        priority,
        status,
        sent_at,
        opened_at,
        dismissed_at,
        device_name
      `)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) {
      // Table doesn't exist (404) or permission denied (400/406)
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.code === "PGRST116") {
        console.info("[PushTest] notification_history table not created yet. Run the migration.");
        return [];
      }
      console.error("[PushTest] Failed to fetch log:", error.message);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

/**
 * Get notification stats summary.
 * Returns zero counts if table doesn't exist yet.
 */
export async function getNotificationStats() {
  try {
    const { data, error } = await supabase
      .from("notification_history")
      .select("status");

    if (error || !data) return { total: 0, sent: 0, opened: 0, dismissed: 0 };

    return {
      total: data.length,
      sent: data.filter((n) => n.status === "sent").length,
      opened: data.filter((n) => n.status === "opened").length,
      dismissed: data.filter((n) => n.status === "dismissed").length,
    };
  } catch {
    return { total: 0, sent: 0, opened: 0, dismissed: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getDeviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown Device";
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (/Edg/.test(ua)) return "Edge";
  if (/Chrome/.test(ua)) return "Chrome";
  if (/Firefox/.test(ua)) return "Firefox";
  if (/Safari/.test(ua)) return "Safari";
  return "Unknown";
}

function getPlatformName() {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return "iOS";
  if (/Android/.test(navigator.userAgent)) return "Android";
  if (/Win/.test(navigator.platform)) return "Windows";
  if (/Mac/.test(navigator.platform)) return "macOS";
  if (/Linux/.test(navigator.platform)) return "Linux";
  return "Unknown";
}

/**
 * Get all available test alert types for the UI.
 */
export function getTestAlertTypes() {
  return [
    { id: "test", label: "Send Test Notification", icon: "🚨", color: "#3B82F6" },
    { id: "freeze", label: "Send Freeze Alert", icon: "❄️", color: "#3B82F6" },
    { id: "frost", label: "Send Frost Alert", icon: "🌨️", color: "#60A5FA" },
    { id: "storm", label: "Send Storm Alert", icon: "⛈️", color: "#7C3AED" },
    { id: "wind", label: "Send Wind Alert", icon: "💨", color: "#6B7280" },
    { id: "heatwave", label: "Send Heatwave Alert", icon: "🔥", color: "#EF4444" },
    { id: "flood", label: "Send Flood Alert", icon: "🌊", color: "#7C3AED" },
    { id: "lightning", label: "Send Lightning Alert", icon: "⚡", color: "#F59E0B" },
  ];
}
