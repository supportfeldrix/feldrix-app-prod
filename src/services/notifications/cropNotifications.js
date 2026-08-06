/**
 * FarmHand PRO — Notification Engine
 * Crop Notification Provider
 *
 * Converts crop records into standardized notifications.
 * Evaluates harvest urgency and planting reminders based on dates and status.
 *
 * @module cropNotifications
 */

/**
 * Generates crop notifications from crop data.
 *
 * @param {object} data - Farm data context
 * @param {object} data.crops - Crops data
 * @param {Array} data.crops.crops - Array of crop objects
 * @returns {Array} Array of notification objects
 */
export function getCropNotifications(data = {}) {
  try {
    const crops = data?.crops?.crops;

    if (!Array.isArray(crops) || crops.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];

    for (const crop of crops) {
      const name = crop.name || crop.crop_name || "Crop";
      const isHarvested = crop.status === "Harvested";

      // Harvest notifications (skip harvested crops)
      if (!isHarvested && crop.harvest_date) {
        const harvestDate = new Date(crop.harvest_date);
        harvestDate.setHours(0, 0, 0, 0);

        if (isOverdue(harvestDate, today)) {
          notifications.push(buildNotification(
            crop,
            "Critical",
            "Harvest Overdue",
            `"${name}" should have been harvested ${formatDaysAgo(harvestDate, today)}.`,
            "harvest_overdue"
          ));
        } else if (isDueToday(harvestDate, today)) {
          notifications.push(buildNotification(
            crop,
            "High",
            "Harvest Day",
            `"${name}" is ready for harvest today.`,
            "harvest_today"
          ));
        } else if (isDueSoon(harvestDate, today)) {
          const daysUntil = getDaysDiff(today, harvestDate);
          notifications.push(buildNotification(
            crop,
            "Medium",
            "Harvest Approaching",
            `"${name}" is due for harvest in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
            "harvest_soon"
          ));
        }
      }

      // Planting notification
      if (crop.planting_date && isPlantingToday(crop.planting_date, today)) {
        notifications.push(buildNotification(
          crop,
          "Low",
          "Planting Day",
          `"${name}" is scheduled for planting today.`,
          "planting_today"
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
 * Checks if a planting date is today.
 */
function isPlantingToday(plantingDate, today) {
  const planting = new Date(plantingDate);
  planting.setHours(0, 0, 0, 0);
  return planting.getTime() === today.getTime();
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
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * Builds a standardized notification object from a crop record.
 * ID is deterministic so dismissed/read state persists across page refreshes.
 */
function buildNotification(crop, priority, title, message, type) {
  return {
    id: `crop-${type}-${crop.id}`,
    type: `crop_${type}`,
    priority,
    title,
    message,
    module: "Crops",
    route: "/crops",
    read: false,
    createdAt: crop.harvest_date || crop.planting_date || crop.created_at || new Date().toISOString(),
  };
}
