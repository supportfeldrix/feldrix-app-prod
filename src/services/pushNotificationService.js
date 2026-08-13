/**
 * Feldrix — Push Notification Service
 * Version 1.2 — Weather Push Notification Platform
 *
 * Production-ready push notification system using ONLY:
 *   - Browser Push API (Notification + Service Worker)
 *   - Supabase (subscription storage + notification history)
 *   - Existing Weather Intelligence Engine
 *
 * NO third-party services: No Firebase, OneSignal, Pusher, AWS SNS.
 *
 * Responsibilities:
 *   1. Request browser notification permission
 *   2. Register push subscription (stored in Supabase)
 *   3. Send browser push notifications for critical weather
 *   4. Handle notification click → deep link to Weather page
 *   5. Prevent duplicate notifications (cooldown logic)
 *   6. Track notification history (sent/opened/dismissed)
 *   7. Respect per-alert-type user settings
 *
 * Device Support:
 *   - Desktop browsers (Chrome, Edge, Firefox, Safari 16+)
 *   - Android Browser & installed PWA
 *   - iPhone Browser & installed PWA (iOS 16.4+)
 *   - Smart watches receive notifications via paired phone OS
 */

import { supabase } from "../supabaseClient";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const PERMISSION_STORAGE_KEY = "feldrix_push_permission_state";
const SETTINGS_STORAGE_KEY = "feldrix_push_settings";
const COOLDOWN_STORAGE_KEY = "feldrix_push_cooldowns";
const HISTORY_STORAGE_KEY = "feldrix_push_history";

// Cooldown: don't resend same alert type within this period
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

// Maximum history entries stored locally
const MAX_LOCAL_HISTORY = 100;

// App branding
const APP_ICON = "/Branding/app-icon-192.png";
const APP_BADGE = "/Branding/app-icon-192.png";

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT NOTIFICATION SETTINGS — Per alert type
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS = {
  // Critical weather
  freeze: true,
  frost: true,
  storm: true,
  heavy_rain: true,
  lightning: true,
  heatwave: true,
  wind: true,
  fire_danger: true,
  flood: true,
  hail: true,

  // Farm-specific
  livestock_alerts: true,
  crop_alerts: true,
  machinery_alerts: false,

  // Scheduled
  morning_brief: true,
  morning_brief_time: "07:00",

  // Global
  enabled: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if the browser supports push notifications.
 */
export function isPushSupported() {
  return "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Get current notification permission status.
 * @returns {"granted" | "denied" | "default" | "unsupported"}
 */
export function getPermissionStatus() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Check if permission has been requested before (regardless of outcome).
 * Used to avoid re-prompting the farmer.
 */
export function hasPermissionBeenRequested() {
  try {
    const state = JSON.parse(localStorage.getItem(PERMISSION_STORAGE_KEY) || "{}");
    return state.requested === true;
  } catch {
    return false;
  }
}

/**
 * Check if the user chose "Remind Me Later" and how long ago.
 * Returns true if we should show the prompt again (after 7 days).
 */
export function shouldShowPermissionPrompt() {
  if (!isPushSupported()) return false;
  if (Notification.permission === "granted") return false;
  if (Notification.permission === "denied") return false;

  try {
    const state = JSON.parse(localStorage.getItem(PERMISSION_STORAGE_KEY) || "{}");

    // Never asked before
    if (!state.requested) return true;

    // Was dismissed with "remind later" — show again after 7 days
    if (state.remindLater) {
      const elapsed = Date.now() - (state.remindLaterAt || 0);
      return elapsed > 7 * 24 * 60 * 60 * 1000;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Record that the user chose "Remind Me Later".
 */
export function setRemindLater() {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify({
      requested: true,
      remindLater: true,
      remindLaterAt: Date.now(),
    }));
  } catch { /* unavailable */ }
}

/**
 * Request notification permission from the user.
 * Records the decision so we don't re-prompt.
 *
 * @returns {Promise<"granted" | "denied" | "default">}
 */
export async function requestPermission() {
  if (!isPushSupported()) return "unsupported";

  if (Notification.permission === "granted") {
    recordPermissionState("granted");
    return "granted";
  }

  if (Notification.permission === "denied") {
    recordPermissionState("denied");
    return "denied";
  }

  try {
    const result = await Notification.requestPermission();
    recordPermissionState(result);

    // If granted, register the subscription
    if (result === "granted") {
      await registerSubscription();
    }

    return result;
  } catch (err) {
    console.error("[Push] Permission request failed:", err);
    return "default";
  }
}

function recordPermissionState(result) {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify({
      requested: true,
      result,
      remindLater: false,
      grantedAt: result === "granted" ? Date.now() : undefined,
      deniedAt: result === "denied" ? Date.now() : undefined,
    }));
  } catch { /* unavailable */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT — Stored in Supabase
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register the push subscription in Supabase.
 * Stores device info so the Edge Function can send targeted notifications.
 */
export async function registerSubscription() {
  if (!isPushSupported()) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Get or create push subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Generate VAPID public key from env (required for push subscription)
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("[Push] VITE_VAPID_PUBLIC_KEY not set. Push subscription requires VAPID keys.");
        // Fallback: use local-only notifications (no server push)
        return null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    // Store in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return subscription;

    const subscriptionData = {
      user_id: user.id,
      subscription_json: JSON.stringify(subscription.toJSON()),
      device_name: getDeviceName(),
      browser: getBrowserName(),
      platform: getPlatformName(),
      last_seen: new Date().toISOString(),
    };

    // Upsert — update if same user+endpoint exists, insert otherwise
    const endpoint = subscription.endpoint;
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { ...subscriptionData, endpoint },
        { onConflict: "user_id,endpoint" }
      );

    if (error) {
      console.error("[Push] Failed to save subscription:", error.message);
    } else {
      console.info("[Push] Subscription registered successfully.");
    }

    return subscription;
  } catch (err) {
    console.error("[Push] Subscription registration failed:", err);
    return null;
  }
}

/**
 * Unregister push subscription (when user disables notifications).
 */
export async function unregisterSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }
    }
  } catch (err) {
    console.error("[Push] Unsubscribe failed:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION DISPATCH — Client-side (immediate)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a local push notification for a weather alert.
 * Used when the app is open and detects critical weather.
 * The Supabase Edge Function handles background push when the app is closed.
 *
 * @param {object} alert - Weather alert from Intelligence Engine
 * @returns {boolean} Whether notification was sent
 */
export function sendWeatherNotification(alert) {
  if (!canSendNotification(alert)) return false;

  const settings = getSettings();
  if (!settings.enabled) return false;

  // Check per-type setting
  if (!isAlertTypeEnabled(alert.type || alert.alertType, settings)) return false;

  // Check cooldown
  if (isInCooldown(alert.type || alert.alertType)) return false;

  try {
    const { title, body, tag } = formatNotification(alert);

    const options = {
      body,
      icon: APP_ICON,
      badge: APP_BADGE,
      tag, // Replaces existing notification of same type
      renotify: true,
      requireInteraction: alert.priority === "Critical",
      vibrate: alert.priority === "Critical" ? [200, 100, 200, 100, 200] : [200, 100, 200],
      data: {
        url: "/weather#alerts",
        alertType: alert.type || alert.alertType,
        alertId: alert.id,
        timestamp: Date.now(),
        farmName: alert.farmName || "",
      },
      actions: [
        { action: "view", title: "View Details" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    // Use Service Worker for background support
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } else {
      // Fallback to Notification API (foreground only)
      new Notification(title, options);
    }

    // Record cooldown and history
    recordCooldown(alert.type || alert.alertType);
    recordNotificationSent(alert);

    return true;
  } catch (err) {
    console.error("[Push] Failed to send notification:", err);
    return false;
  }
}

/**
 * Process an array of weather notifications from the Intelligence Engine.
 * Sends push for Critical and High priority alerts that are enabled.
 *
 * @param {Array} notifications - From generateWeatherNotifications()
 * @param {object} context - { farmName }
 * @returns {number} Number of notifications sent
 */
export function processWeatherAlerts(notifications, context = {}) {
  if (!Array.isArray(notifications) || notifications.length === 0) return 0;
  if (Notification.permission !== "granted") return 0;

  const settings = getSettings();
  if (!settings.enabled) return 0;

  let sent = 0;

  for (const notification of notifications) {
    // Only push Critical and High priority
    if (notification.priority !== "Critical" && notification.priority !== "High") continue;

    const enriched = { ...notification, farmName: context.farmName || "" };
    if (sendWeatherNotification(enriched)) {
      sent++;
    }
  }

  return sent;
}

/**
 * Send the Morning Farm Brief notification.
 * Called by the scheduled check or manually from settings.
 *
 * @param {object} briefData - { riskLevel, temperature, condition, recommendations }
 */
export function sendMorningBrief(briefData) {
  const settings = getSettings();
  if (!settings.enabled || !settings.morning_brief) return false;

  if (Notification.permission !== "granted") return false;
  if (isInCooldown("morning_brief")) return false;

  const title = "☀️ Good Morning — Farm Brief";
  const body = [
    `Today's Risk: ${briefData.riskLevel || "LOW"}`,
    `Weather: ${briefData.temperature || "—"}°C, ${briefData.condition || "Clear"}`,
    briefData.recommendations?.[0] || "No severe weather expected.",
  ].join("\n");

  try {
    const options = {
      body,
      icon: APP_ICON,
      badge: APP_BADGE,
      tag: "feldrix-morning-brief",
      renotify: false,
      data: { url: "/weather", alertType: "morning_brief", timestamp: Date.now() },
      actions: [
        { action: "view", title: "Open Dashboard" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
    } else {
      new Notification(title, options);
    }

    recordCooldown("morning_brief");
    recordNotificationSent({ type: "morning_brief", title, priority: "Info", message: body });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION FORMATTING — Smart, farm-aware messages
// ═══════════════════════════════════════════════════════════════════════════════

function formatNotification(alert) {
  const type = alert.type || alert.alertType || "weather";
  const farmName = alert.farmName || "";
  const farmPrefix = farmName ? `${farmName} — ` : "";

  // Priority-based emoji prefix
  const priorityEmoji = alert.priority === "Critical" ? "🚨" : "⚠️";

  const title = `${priorityEmoji} ${alert.title || "Weather Alert"}`;

  // Build rich body with farm context
  const bodyParts = [];

  if (farmName) bodyParts.push(`Farm: ${farmName}`);

  // Add specific details based on alert type
  if (alert.details?.expectedMin != null) {
    bodyParts.push(`Expected: ${alert.details.expectedMin}°C`);
  }
  if (alert.details?.expectedMax != null) {
    bodyParts.push(`Expected: ${alert.details.expectedMax}°C`);
  }
  if (alert.details?.expectedRainfall != null) {
    bodyParts.push(`Rainfall: ${alert.details.expectedRainfall}mm`);
  }
  if (alert.details?.expectedWind != null) {
    bodyParts.push(`Wind: ${alert.details.expectedWind} km/h`);
  }

  // First recommendation
  if (alert.advice && alert.advice.length > 0) {
    bodyParts.push(`\n${alert.advice[0]}`);
  } else if (alert.message) {
    bodyParts.push(alert.message);
  }

  const body = bodyParts.join("\n") || alert.message || "Tap to view details.";
  const tag = `feldrix-${type.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return { title, body, tag };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COOLDOWN LOGIC — Prevent duplicate notifications
// ═══════════════════════════════════════════════════════════════════════════════

function isInCooldown(alertType) {
  try {
    const cooldowns = JSON.parse(localStorage.getItem(COOLDOWN_STORAGE_KEY) || "{}");
    const lastSent = cooldowns[alertType];
    if (!lastSent) return false;
    return Date.now() - lastSent < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function recordCooldown(alertType) {
  try {
    const cooldowns = JSON.parse(localStorage.getItem(COOLDOWN_STORAGE_KEY) || "{}");
    cooldowns[alertType] = Date.now();

    // Clean old entries (older than 24h)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const key of Object.keys(cooldowns)) {
      if (cooldowns[key] < cutoff) delete cooldowns[key];
    }

    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cooldowns));
  } catch { /* unavailable */ }
}

/**
 * Clear all cooldowns (e.g., for testing or when farmer explicitly requests).
 */
export function clearCooldowns() {
  try {
    localStorage.removeItem(COOLDOWN_STORAGE_KEY);
  } catch { /* unavailable */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS — Per alert type
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get notification settings (merged with defaults).
 */
export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save notification settings.
 * @param {object} settings - Partial settings to merge
 */
export function saveSettings(settings) {
  try {
    const current = getSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));

    // Sync to Supabase for Edge Function access
    syncSettingsToSupabase(merged);

    return merged;
  } catch {
    return getSettings();
  }
}

/**
 * Check if a specific alert type is enabled in settings.
 */
function isAlertTypeEnabled(alertType, settings) {
  const typeMap = {
    FREEZE: "freeze",
    FROST: "frost",
    STORM: "storm",
    HEAVY_RAIN: "heavy_rain",
    LIGHTNING: "lightning",
    HEATWAVE: "heatwave",
    HIGH_WIND: "wind",
    FLOOD: "flood",
    HAIL: "hail",
    FIRE_DANGER: "fire_danger",
    // Mapped alert types from intelligence engine
    weather_freeze: "freeze",
    weather_frost: "frost",
    weather_storm: "storm",
    weather_heavy_rain: "heavy_rain",
    weather_lightning: "lightning",
    weather_heatwave: "heatwave",
    weather_high_wind: "wind",
    weather_flood: "flood",
    weather_hail: "hail",
  };

  const settingKey = typeMap[alertType] || typeMap[alertType?.toUpperCase()];
  if (!settingKey) return true; // Unknown types default to enabled
  return settings[settingKey] !== false;
}

/**
 * Sync settings to Supabase so Edge Function can respect preferences.
 */
async function syncSettingsToSupabase(settings) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("push_subscriptions")
      .update({ notification_settings: settings, last_seen: new Date().toISOString() })
      .eq("user_id", user.id);
  } catch {
    // Non-blocking — local settings still work
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION HISTORY — Stored locally + synced to Supabase
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record that a notification was sent.
 */
function recordNotificationSent(alert) {
  const entry = {
    id: `${alert.type || alert.alertType}-${Date.now()}`,
    alertType: alert.type || alert.alertType,
    title: alert.title || "Weather Alert",
    message: alert.message || "",
    priority: alert.priority || "High",
    status: "sent",
    sentAt: new Date().toISOString(),
    openedAt: null,
    dismissedAt: null,
  };

  // Store locally
  const history = getLocalHistory();
  history.unshift(entry);
  while (history.length > MAX_LOCAL_HISTORY) history.pop();
  saveLocalHistory(history);

  // Store in Supabase (non-blocking)
  storeHistoryInSupabase(entry);
}

/**
 * Record that a notification was opened (clicked).
 */
export function recordNotificationOpened(alertType) {
  const history = getLocalHistory();
  const entry = history.find((h) => h.alertType === alertType && h.status === "sent");
  if (entry) {
    entry.status = "opened";
    entry.openedAt = new Date().toISOString();
    saveLocalHistory(history);
    updateHistoryInSupabase(entry.id, "opened");
  }
}

/**
 * Record that a notification was dismissed.
 */
export function recordNotificationDismissed(alertType) {
  const history = getLocalHistory();
  const entry = history.find((h) => h.alertType === alertType && h.status === "sent");
  if (entry) {
    entry.status = "dismissed";
    entry.dismissedAt = new Date().toISOString();
    saveLocalHistory(history);
    updateHistoryInSupabase(entry.id, "dismissed");
  }
}

/**
 * Get notification history (local).
 */
export function getNotificationHistory() {
  return getLocalHistory();
}

function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalHistory(history) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch { /* unavailable */ }
}

async function storeHistoryInSupabase(entry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_history").insert({
      user_id: user.id,
      notification_id: entry.id,
      alert_type: entry.alertType,
      title: entry.title,
      message: entry.message,
      priority: entry.priority,
      status: entry.status,
      sent_at: entry.sentAt,
    });
  } catch {
    // Non-blocking
  }
}

async function updateHistoryInSupabase(notificationId, status) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updateData = { status };
    if (status === "opened") updateData.opened_at = new Date().toISOString();
    if (status === "dismissed") updateData.dismissed_at = new Date().toISOString();

    await supabase
      .from("notification_history")
      .update(updateData)
      .eq("notification_id", notificationId)
      .eq("user_id", user.id);
  } catch {
    // Non-blocking
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the push notification system.
 * Call once on app startup.
 *
 * - Ensures service worker is ready
 * - Sets up message listener for notification clicks
 * - Re-registers subscription if permission was previously granted
 */
export async function initializePushNotifications() {
  if (!isPushSupported()) {
    console.info("[Push] Push notifications not supported in this environment.");
    return;
  }

  // Set up click handler (service worker sends message on notification click)
  setupNotificationClickHandler();

  // If permission was previously granted, ensure subscription is active
  if (Notification.permission === "granted") {
    await registerSubscription();
  }

  console.info("[Push] Push notification system initialized. Permission:", Notification.permission);
}

/**
 * Listen for messages from the service worker (notification clicks).
 */
function setupNotificationClickHandler() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data;

    if (data?.type === "NOTIFICATION_CLICK") {
      // Record as opened
      if (data.alertType) {
        recordNotificationOpened(data.alertType);
      }

      // Navigate to the weather page with alert section
      const url = data.url || "/weather#alerts";
      if (window.location.pathname !== "/weather") {
        window.location.href = url;
      } else {
        // Already on weather page — scroll to alerts
        const el = document.getElementById("weather-alerts");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    if (data?.type === "NOTIFICATION_DISMISS") {
      if (data.alertType) {
        recordNotificationDismissed(data.alertType);
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function canSendNotification(alert) {
  if (!isPushSupported()) return false;
  if (Notification.permission !== "granted") return false;
  if (!alert) return false;
  return true;
}

/**
 * Convert a URL-safe base64 string to a Uint8Array (for VAPID key).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
