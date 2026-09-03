/**
 * FarmHand PRO — Notification Engine
 * Livestock Notification Provider
 *
 * Converts livestock health records and lifecycle transitions
 * into standardized notifications.
 *
 * @module livestockNotifications
 */

import { getUpcomingTransitions } from "../livestockLifecycle";

/**
 * Generates livestock notifications from health record data.
 *
 * @param {object} data - Farm data context
 * @param {object} data.livestock - Livestock data
 * @param {Array} data.livestock.healthRecords - Array of health record objects
 * @returns {Array} Array of notification objects
 */
export function getLivestockNotifications(data = {}) {
  try {
    const healthRecords = data?.livestock?.healthRecords;

    if (!Array.isArray(healthRecords) || healthRecords.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];

    for (const record of healthRecords) {
      // Completion is tracked via completed_at (next_due is preserved).
      if (record.completed_at) continue;

      const scheduledDate = record.next_due || record.scheduled_date;
      if (!scheduledDate) continue;

      const due = new Date(scheduledDate);
      due.setHours(0, 0, 0, 0);

      const animalTag = record.livestock?.tag || record.animal_tag || "";
      const treatmentName = record.treatment_type || record.treatment || "Health Treatment";

      if (isOverdue(due, today)) {
        notifications.push(buildNotification(
          record,
          "Critical",
          "Treatment Overdue",
          `"${treatmentName}"${animalTag ? ` for ${animalTag}` : ""} was due ${formatDaysAgo(due, today)}.`
        ));
      } else if (isDueToday(due, today)) {
        notifications.push(buildNotification(
          record,
          "High",
          "Treatment Due Today",
          `"${treatmentName}"${animalTag ? ` for ${animalTag}` : ""} is scheduled for today.`
        ));
      } else if (isDueSoon(due, today)) {
        const daysUntil = getDaysDiff(today, due);
        notifications.push(buildNotification(
          record,
          "Medium",
          "Treatment Coming Up",
          `"${treatmentName}"${animalTag ? ` for ${animalTag}` : ""} is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`
        ));
      }
    }

    // Lifecycle transition notifications
    try {
      const animals = data?.livestock?.animals || [];
      const transitions = getUpcomingTransitions(animals, 7);
      for (const t of transitions) {
        notifications.push({
          id: `lifecycle-transition-${t.animal.id}`,
          type: "lifecycle_transition",
          priority: t.daysUntil <= 2 ? "High" : "Medium",
          title: "Lifecycle Transition",
          message: `${t.tag} transitions from ${t.currentStage} to ${t.nextStage} in ${t.daysUntil} day${t.daysUntil !== 1 ? "s" : ""}.`,
          module: "Livestock",
          route: `/animals/${t.animal.id}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // Lifecycle calculation failed — non-blocking
    }

    return notifications;
  } catch {
    return [];
  }
}

// =====================================================
// Helpers
// =====================================================

/**
 * Checks if a scheduled date is before today.
 */
function isOverdue(scheduledDate, today) {
  return scheduledDate < today;
}

/**
 * Checks if a scheduled date is today.
 */
function isDueToday(scheduledDate, today) {
  return scheduledDate.getTime() === today.getTime();
}

/**
 * Checks if a scheduled date is within the next 7 days (not today).
 */
function isDueSoon(scheduledDate, today) {
  const sevenDays = new Date(today);
  sevenDays.setDate(sevenDays.getDate() + 7);
  return scheduledDate > today && scheduledDate <= sevenDays;
}

/**
 * Returns the number of days between two dates.
 */
function getDaysDiff(from, to) {
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

/**
 * Formats how many days ago a date was.
 */
function formatDaysAgo(scheduledDate, today) {
  const days = getDaysDiff(scheduledDate, today);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * Builds a standardized notification object from a health record.
 * ID is deterministic so dismissed/read state persists across page refreshes.
 */
function buildNotification(record, priority, title, message) {
  return {
    id: `livestock-health-${record.id}`,
    type: "health_treatment",
    priority,
    title,
    message,
    module: "Livestock",
    route: "/health",
    read: false,
    createdAt: record.next_due || record.scheduled_date || record.created_at || new Date().toISOString(),
  };
}
