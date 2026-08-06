/**
 * FarmHand PRO — Notification Engine
 * AI & System Notification Provider
 *
 * Converts intelligence insights and system events into standardized notifications.
 * AI notifications inherit priority from the intelligence engine.
 * System notifications use Info priority for operational events.
 *
 * @module aiNotifications
 */

const VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"];

/**
 * Generates AI and System notifications from intelligence insights and system events.
 *
 * @param {object} data - Farm data context
 * @param {object} data.intelligence - Intelligence data
 * @param {Array} data.intelligence.insights - Array of insight objects from the intelligence engine
 * @param {object} data.system - System data
 * @param {Array} data.system.events - Array of system event objects
 * @returns {Array} Array of notification objects
 */
export function getAINotifications(data = {}) {
  try {
    const insights = data?.intelligence?.insights;
    const events = data?.system?.events;

    const notifications = [];

    // AI notifications from intelligence insights
    if (Array.isArray(insights) && insights.length > 0) {
      for (const insight of insights) {
        if (!insight || !insight.title) continue;

        notifications.push(buildInsightNotification(insight));
      }
    }

    // System notifications from system events
    if (Array.isArray(events) && events.length > 0) {
      for (const event of events) {
        if (!event || !event.title) continue;

        notifications.push(buildSystemNotification(event));
      }
    }

    // Deduplicate by id
    return deduplicateById(notifications);
  } catch {
    return [];
  }
}

// =====================================================
// Helpers
// =====================================================

/**
 * Maps an intelligence insight priority to a valid notification priority.
 */
function mapPriority(insightPriority) {
  if (VALID_PRIORITIES.includes(insightPriority)) {
    return insightPriority;
  }
  return "Medium";
}

/**
 * Removes duplicate notifications by id, keeping the first occurrence.
 */
function deduplicateById(notifications) {
  const seen = new Set();
  return notifications.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

/**
 * Builds a notification from an intelligence insight.
 * ID is deterministic so dismissed/read state persists across page refreshes.
 */
function buildInsightNotification(insight) {
  return {
    id: `ai-insight-${insight.id || insight.title?.replace(/\s+/g, "-").toLowerCase().slice(0, 40)}`,
    type: "ai_insight",
    priority: mapPriority(insight.priority),
    title: insight.title,
    message: insight.description || "",
    module: "AI",
    route: insight.route || "/dashboard",
    read: false,
    createdAt: insight.createdAt || new Date().toISOString(),
  };
}

/**
 * Builds a notification from a system event.
 * ID is deterministic so dismissed/read state persists across page refreshes.
 */
function buildSystemNotification(event) {
  return {
    id: `system-${event.id || event.type || event.title?.replace(/\s+/g, "-").toLowerCase().slice(0, 40)}`,
    type: "system_event",
    priority: "Info",
    title: event.title,
    message: event.message || event.description || "",
    module: "System",
    route: event.route || "/account",
    read: false,
    createdAt: event.createdAt || new Date().toISOString(),
  };
}
