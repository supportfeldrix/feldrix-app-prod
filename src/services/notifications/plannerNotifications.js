/**
 * FarmHand PRO — Notification Engine
 * Planner Notification Provider
 *
 * Converts planner tasks into standardized notifications.
 * Evaluates task urgency based on due dates and completion status.
 *
 * @module plannerNotifications
 */

/**
 * Generates planner notifications from task data.
 *
 * @param {object} data - Farm data context
 * @param {object} data.planner - Planner data
 * @param {Array} data.planner.tasks - Array of planner task objects
 * @returns {Array} Array of notification objects
 */
export function getPlannerNotifications(data = {}) {
  try {
    const tasks = data?.planner?.tasks;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];

    for (const task of tasks) {
      if (task.completed === true || task.status === "Completed") continue;

      const dueDate = task.due_date || task.originalDate;
      if (!dueDate) continue;

      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);

      if (isOverdue(due, today)) {
        notifications.push(buildNotification(task, "Critical", "Task Overdue", `"${task.title}" was due ${formatDaysAgo(due, today)}.`));
      } else if (isDueToday(due, today)) {
        notifications.push(buildNotification(task, "High", "Task Due Today", `"${task.title}" is due today.`));
      } else if (isDueSoon(due, today)) {
        const daysUntil = getDaysDiff(today, due);
        notifications.push(buildNotification(task, "Medium", "Task Due Soon", `"${task.title}" is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`));
      } else if (isRecurring(task)) {
        const createdAt = task.created_at || task.last_generated;
        if (createdAt && isCreatedToday(createdAt, today)) {
          notifications.push(buildNotification(task, "Low", "Recurring Task Created", `"${task.title}" has been scheduled.`));
        }
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
 * Checks if a task's due date is before today.
 */
function isOverdue(dueDate, today) {
  return dueDate < today;
}

/**
 * Checks if a task's due date is today.
 */
function isDueToday(dueDate, today) {
  return dueDate.getTime() === today.getTime();
}

/**
 * Checks if a task's due date is within the next 3 days (not today).
 */
function isDueSoon(dueDate, today) {
  const threeDays = new Date(today);
  threeDays.setDate(threeDays.getDate() + 3);
  return dueDate > today && dueDate <= threeDays;
}

/**
 * Checks if a task is recurring.
 */
function isRecurring(task) {
  return task.repeat_type && task.repeat_type !== "None";
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
function formatDaysAgo(dueDate, today) {
  const days = getDaysDiff(dueDate, today);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * Builds a standardized notification object from a planner task.
 * ID is deterministic so dismissed/read state persists across page refreshes.
 */
function buildNotification(task, priority, title, message) {
  return {
    id: `planner-${task.id || task.sourceId}`,
    type: "planner_task",
    priority,
    title,
    message,
    module: "Planner",
    route: "/planner",
    read: false,
    createdAt: task.due_date || task.originalDate || task.created_at || new Date().toISOString(),
  };
}
