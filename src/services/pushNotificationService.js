/**
 * Feldrix — Push Notification Service
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Provides Web Push API integration for critical weather alerts.
 * Sends native device notifications for:
 *   - Freeze Warning
 *   - Storm Warning
 *   - Flood Warning
 *   - Heatwave Warning
 *   - Lightning Alert
 *   - Hail Warning
 *   - High Wind Warning
 *
 * Example push:
 *   🚨 Freeze Expected Tonight
 *   Protect vulnerable livestock before 21:00.
 *   Tap to view preparation checklist.
 *
 * Architecture:
 *   1. Request notification permission on first login
 *   2. Register service worker for background notifications
 *   3. Weather Intelligence Engine marks notifications as pushEligible
 *   4. This service dispatches them as native push notifications
 *   5. Clicking notification opens the Weather Intelligence page
 *
 * Requirements:
 *   - HTTPS (required for Push API)
 *   - Service Worker registered (vite-plugin-pwa handles this)
 *   - User grants notification permission
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const PUSH_STORAGE_KEY = "feldrix_push_settings";
const SENT_NOTIFICATIONS_KEY = "feldrix_push_sent";
const MAX_SENT_HISTORY = 50;
const COOLDOWN_MS = 60 * 60 * 1000; // Don't resend same alert type within 1 hour

// App icon for notifications
const NOTIFICATION_ICON = "/Branding/app-icon-1024.png";
const NOTIFICATION_BADGE = "/Branding/app-icon-1024.png";

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if the browser supports push notifications.
 * @returns {boolean}
 */
export function isPushSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator
  );
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
 * Request notification permission from the user.
 * Shows the browser's native permission dialog.
 *
 * @returns {Promise<"granted" | "denied" | "default">}
 */
export async function requestPermission() {
  if (!isPushSupported()) {
    console.warn("[Push] Notifications not supported in this browser.");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    console.warn("[Push] Notifications previously denied by user.");
    return "denied";
  }

  try {
    const result = await Notification.requestPermission();
    savePushSettings({ permissionRequested: true, permissionResult: result, requestedAt: new Date().toISOString() });
    return result;
  } catch (err) {
    console.error("[Push] Permission request failed:", err);
    return "default";
  }
}

/**
 * Check if push notifications are enabled (permission granted + user hasn't disabled).
 * @returns {boolean}
 */
export function isPushEnabled() {
  if (!isPushSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const settings = getPushSettings();
  return settings.enabled !== false; // Default to enabled if not explicitly disabled
}

/**
 * Enable or disable push notifications (user preference toggle).
 * @param {boolean} enabled
 */
export function setPushEnabled(enabled) {
  const settings = getPushSettings();
  settings.enabled = enabled;
  savePushSettings(settings);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a push notification for a critical weather alert.
 * Respects cooldown period to avoid spamming the same alert.
 *
 * @param {object} notification - Weather notification object (from weatherNotifications.js)
 * @param {string} notification.title - Alert title
 * @param {string} notification.message - Alert body
 * @param {string} notification.icon - Emoji icon
 * @param {string} notification.alertType - Alert type identifier (for cooldown tracking)
 * @param {boolean} notification.pushEligible - Must be true
 * @returns {boolean} Whether the notification was actually sent
 */
export function sendPushNotification(notification) {
  if (!isPushEnabled()) return false;
  if (!notification.pushEligible) return false;

  // Check cooldown — don't resend same type within 1 hour
  const alertType = notification.alertType || notification.type || "unknown";
  if (isInCooldown(alertType)) return false;

  try {
    const title = `\uD83D\uDEA8 ${notification.title}`;
    const options = {
      body: formatPushBody(notification),
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      tag: `feldrix-weather-${alertType}`, // Replaces existing notification of same tag
      renotify: true,
      requireInteraction: true, // Don't auto-dismiss critical alerts
      vibrate: [200, 100, 200, 100, 200], // Vibration pattern for urgency
      data: {
        url: "/weather",
        alertType,
        timestamp: Date.now(),
      },
      actions: [
        { action: "view", title: "View Checklist" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    // Try Service Worker notification first (works in background)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } else {
      // Fallback to basic Notification API (only works when tab is open)
      new Notification(title, options);
    }

    // Record that we sent this alert type
    recordSentNotification(alertType);
    return true;
  } catch (err) {
    console.error("[Push] Failed to send notification:", err);
    return false;
  }
}

/**
 * Process an array of weather notifications and send push for eligible ones.
 * Called by WeatherContext after each refresh.
 *
 * @param {Array} notifications - Array of notification objects from the intelligence engine
 * @returns {number} Number of notifications actually sent
 */
export function processWeatherPushNotifications(notifications) {
  if (!isPushEnabled()) return 0;
  if (!Array.isArray(notifications)) return 0;

  let sent = 0;
  for (const notification of notifications) {
    if (notification.pushEligible && sendPushNotification(notification)) {
      sent++;
    }
  }
  return sent;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register the service worker for push notifications.
 * vite-plugin-pwa typically handles this, but we ensure it's ready.
 *
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("[Push] Service Worker not supported.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.info("[Push] Service Worker ready for push notifications.");
    return registration;
  } catch (err) {
    console.error("[Push] Service Worker registration failed:", err);
    return null;
  }
}

/**
 * Set up the notification click handler for the service worker.
 * Navigates to /weather when a weather notification is clicked.
 */
export function setupNotificationClickHandler() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "NOTIFICATION_CLICK") {
      const url = event.data.url || "/weather";
      window.location.href = url;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format the push notification body text.
 * Adds the first recommendation as an actionable line.
 */
function formatPushBody(notification) {
  let body = notification.message || "";

  // Add first advice item if available
  if (notification.advice && notification.advice.length > 0) {
    body += `\n${notification.advice[0]}`;
  }

  body += "\nTap to view preparation checklist.";
  return body;
}

/**
 * Check if an alert type is in cooldown period.
 * @param {string} alertType
 * @returns {boolean}
 */
function isInCooldown(alertType) {
  const sent = getSentNotifications();
  const lastSent = sent.find((s) => s.alertType === alertType);

  if (!lastSent) return false;
  return Date.now() - lastSent.timestamp < COOLDOWN_MS;
}

/**
 * Record a sent notification for cooldown tracking.
 * @param {string} alertType
 */
function recordSentNotification(alertType) {
  const sent = getSentNotifications();
  sent.push({ alertType, timestamp: Date.now() });

  // Keep only recent entries
  while (sent.length > MAX_SENT_HISTORY) {
    sent.shift();
  }

  try {
    localStorage.setItem(SENT_NOTIFICATIONS_KEY, JSON.stringify(sent));
  } catch { /* unavailable */ }
}

/**
 * Get the history of sent push notifications.
 * @returns {Array}
 */
function getSentNotifications() {
  try {
    return JSON.parse(localStorage.getItem(SENT_NOTIFICATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

function getPushSettings() {
  try {
    return JSON.parse(localStorage.getItem(PUSH_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePushSettings(settings) {
  try {
    const current = getPushSettings();
    localStorage.setItem(PUSH_STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
  } catch { /* unavailable */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize push notification system.
 * Call this once on app startup (e.g., in App.jsx or WeatherContext).
 *
 * - Registers service worker
 * - Sets up click handlers
 * - Does NOT request permission (that should be user-initiated)
 */
export async function initializePushNotifications() {
  if (!isPushSupported()) {
    console.info("[Push] Push notifications not supported in this environment.");
    return;
  }

  await registerServiceWorker();
  setupNotificationClickHandler();

  console.info("[Push] Push notification system initialized. Permission:", Notification.permission);
}
