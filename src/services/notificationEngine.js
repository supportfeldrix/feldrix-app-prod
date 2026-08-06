import { getPlannerNotifications } from "./notifications/plannerNotifications";
import { getLivestockNotifications } from "./notifications/livestockNotifications";
import { getCropNotifications } from "./notifications/cropNotifications";
import { getMachineryNotifications } from "./notifications/machineryNotifications";
import { getFinanceNotifications } from "./notifications/financeNotifications";
import { getWeatherNotifications } from "./notifications/weatherNotifications";
import { getAINotifications } from "./notifications/aiNotifications";

/**
 * FarmHand PRO — Notification Engine
 * Sprint 36
 *
 * Single source of truth for all application notifications.
 * Aggregates notifications from all farm modules and provides
 * filtering, priority sorting, and read/clear management.
 *
 * Notification Object Schema:
 * {
 *   id: string,
 *   type: string,
 *   priority: "Critical" | "High" | "Medium" | "Low" | "Info",
 *   title: string,
 *   message: string,
 *   module: "Planner" | "Livestock" | "Crops" | "Machinery" | "Finance" | "Weather" | "AI" | "System",
 *   route: string,
 *   read: boolean,
 *   createdAt: string (ISO)
 * }
 */

const PRIORITY_ORDER = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

/**
 * Sorts notifications by priority (Critical first) then by createdAt (newest first).
 */
/**
 * Removes duplicate notifications by id, keeping the first occurrence.
 */
function deduplicateById(notifications) {
  const seen = new Set();
  return notifications.filter((n) => {
    if (!n.id) return true;
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

/**
 * Sorts notifications by priority (Critical first) then by createdAt (newest first).
 */
function sortNotifications(notifications) {
  return notifications.sort((a, b) => {
    const priorityDiff =
      (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Generates all notifications from the supplied farm data.
 * Filters out dismissed notifications and marks previously read ones.
 *
 * @param {object} data - Farm data context (planner, livestock, crops, machinery, finance, weather)
 * @returns {Array} Sorted array of notification objects
 */
export function getNotifications(data = {}) {
  try {
    const notifications = [];

    notifications.push(...getPlannerNotifications(data));
    notifications.push(...getLivestockNotifications(data));
    notifications.push(...getCropNotifications(data));
    notifications.push(...getMachineryNotifications(data));
    notifications.push(...getFinanceNotifications(data));
    notifications.push(...getWeatherNotifications(data));
    notifications.push(...getAINotifications(data));

    // Deduplicate by id
    const deduplicated = deduplicateById(notifications);

    // Filter out dismissed notifications
    const dismissedIds = getDismissedIds();
    const readIds = getReadIds();

    const active = deduplicated
      .filter((n) => !n.id || !dismissedIds.has(n.id))
      .map((n) => ({
        ...n,
        read: n.read || (n.id ? readIds.has(n.id) : false),
      }));

    return sortNotifications(active);
  } catch {
    return [];
  }
}

/**
 * Returns only unread notifications, sorted by priority.
 *
 * @param {object} data - Farm data context
 * @returns {Array} Sorted array of unread notification objects
 */
export function getUnreadNotifications(data = {}) {
  try {
    const all = getNotifications(data);
    return all.filter((n) => n.read === false);
  } catch {
    return [];
  }
}

/**
 * Returns only Critical priority notifications, sorted by time.
 *
 * @param {object} data - Farm data context
 * @returns {Array} Array of critical notification objects
 */
export function getCriticalNotifications(data = {}) {
  try {
    const all = getNotifications(data);
    return all.filter((n) => n.priority === "Critical");
  } catch {
    return [];
  }
}

/**
 * Marks a notification as read by ID.
 * Persists the read state in localStorage so it survives page refreshes.
 *
 * @param {string} id - Notification ID to mark as read
 * @returns {boolean} Success status
 */
export function markAsRead(id) {
  if (!id) return false;
  try {
    const key = "fhp_read_notifications";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    if (!stored.includes(id)) {
      stored.push(id);
      localStorage.setItem(key, JSON.stringify(stored));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a notification from the active list by ID.
 * Persists the dismissed state in localStorage so the notification
 * will not reappear on page refresh.
 *
 * @param {string} id - Notification ID to clear/dismiss
 * @returns {boolean} Success status
 */
export function clearNotification(id) {
  if (!id) return false;
  try {
    const key = "fhp_dismissed_notifications";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    if (!stored.includes(id)) {
      stored.push(id);
      localStorage.setItem(key, JSON.stringify(stored));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the set of dismissed notification IDs from localStorage.
 */
export function getDismissedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem("fhp_dismissed_notifications") || "[]"));
  } catch {
    return new Set();
  }
}

/**
 * Returns the set of read notification IDs from localStorage.
 */
export function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem("fhp_read_notifications") || "[]"));
  } catch {
    return new Set();
  }
}
