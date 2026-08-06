/**
 * FarmHand PRO — Notification Engine
 * Machinery Notification Provider
 *
 * Converts machinery records into standardized notifications.
 * Evaluates service urgency based on next service dates and machine status.
 *
 * @module machineryNotifications
 */

/**
 * Generates machinery notifications from machine data.
 *
 * @param {object} data - Farm data context
 * @param {object} data.machinery - Machinery data
 * @param {Array} data.machinery.machines - Array of machine objects
 * @returns {Array} Array of notification objects
 */
export function getMachineryNotifications(data = {}) {
  try {
    const machines = data?.machinery?.machines;

    if (!Array.isArray(machines) || machines.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];

    for (const machine of machines) {
      const name = machine.name || "Machine";
      const reg = machine.registration ? ` (${machine.registration})` : "";
      const isActive = machine.status === "Active";

      const nextServiceDate = machine.next_service_date || machine.nextServiceDate;

      // Service notifications (active machines with a next service date)
      if (isActive && nextServiceDate) {
        const serviceDate = new Date(nextServiceDate);
        serviceDate.setHours(0, 0, 0, 0);

        if (isOverdue(serviceDate, today)) {
          notifications.push(buildNotification(
            machine,
            "Critical",
            "Service Overdue",
            `"${name}"${reg} is overdue for service by ${formatDaysAgo(serviceDate, today)}.`,
            "service_overdue"
          ));
        } else if (isDueToday(serviceDate, today)) {
          notifications.push(buildNotification(
            machine,
            "High",
            "Service Due Today",
            `"${name}"${reg} is scheduled for service today.`,
            "service_today"
          ));
        } else if (isDueSoon(serviceDate, today)) {
          const daysUntil = getDaysDiff(today, serviceDate);
          notifications.push(buildNotification(
            machine,
            "Medium",
            "Service Coming Up",
            `"${name}"${reg} is due for service in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
            "service_soon"
          ));
        }
      }

      // Machine added today notification
      if (machine.created_at && isCreatedToday(machine.created_at, today)) {
        notifications.push(buildNotification(
          machine,
          "Low",
          "Machine Added",
          `"${name}"${reg} has been registered.`,
          "machine_added"
        ));
      }
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
 * Checks if a date is before today.
 */
function isOverdue(date, today) {
  return date < today;
}

/**
 * Checks if a date is today.
 */
function isDueToday(date, today) {
  return date.getTime() === today.getTime();
}

/**
 * Checks if a date is within the next 7 days (not today).
 */
function isDueSoon(date, today) {
  const sevenDays = new Date(today);
  sevenDays.setDate(sevenDays.getDate() + 7);
  return date > today && date <= sevenDays;
}

/**
 * Checks if a date string represents today.
 */
function isCreatedToday(dateStr, today) {
  const created = new Date(dateStr);
  created.setHours(0, 0, 0, 0);
  return created.getTime() === today.getTime();
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
function formatDaysAgo(date, today) {
  const days = getDaysDiff(date, today);
  if (days === 1) return "1 day";
  return `${days} days`;
}

/**
 * Builds a standardized notification object from a machine record.
 * ID is deterministic so dismissed/read state persists across page refreshes.
 */
function buildNotification(machine, priority, title, message, type) {
  return {
    id: `machinery-${type}-${machine.id}`,
    type: `machinery_${type}`,
    priority,
    title,
    message,
    module: "Machinery",
    route: "/machinery",
    read: false,
    createdAt: machine.next_service_date || machine.nextServiceDate || machine.created_at || new Date().toISOString(),
  };
}
