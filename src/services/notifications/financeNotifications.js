/**
 * FarmHand PRO — Notification Engine
 * Finance Notification Provider
 *
 * Converts finance records into standardized notifications.
 * Evaluates payment urgency, large expenses, and income events.
 *
 * @module financeNotifications
 */

// Configurable thresholds
const LARGE_EXPENSE_THRESHOLD = 10000;
const LARGE_INCOME_THRESHOLD = 10000;

/**
 * Generates finance notifications from transaction data.
 *
 * @param {object} data - Farm data context
 * @param {object} data.finance - Finance data
 * @param {Array} data.finance.records - Array of finance record objects
 * @returns {Array} Array of notification objects
 */
export function getFinanceNotifications(data = {}) {
  try {
    const records = data?.finance?.records;

    if (!Array.isArray(records) || records.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];

    for (const record of records) {
      const amount = Number(record.amount || 0);
      const type = (record.type || record.category || "").toLowerCase();
      const description = record.description || record.category || "Transaction";
      const isPaid = record.status === "Paid" || record.paid === true;
      const dueDate = record.due_date || record.date;

      // Critical: Large expense
      if (type === "expense" && isLargeExpense(amount)) {
        const recordDate = record.date || record.created_at;
        if (recordDate && isCreatedToday(recordDate, today)) {
          notifications.push(buildNotification(
            record,
            "Critical",
            "Large Expense Recorded",
            `R${amount.toLocaleString()} expense for "${description}".`,
            "large_expense"
          ));
        }
      }

      // Payment due notifications (skip paid records)
      if (!isPaid && dueDate) {
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        if (isDueToday(due, today)) {
          notifications.push(buildNotification(
            record,
            "High",
            "Payment Due Today",
            `R${amount.toLocaleString()} payment for "${description}" is due today.`,
            "payment_today"
          ));
        } else if (isDueSoon(due, today)) {
          const daysUntil = getDaysDiff(today, due);
          notifications.push(buildNotification(
            record,
            "Medium",
            "Payment Coming Up",
            `R${amount.toLocaleString()} payment for "${description}" is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
            "payment_soon"
          ));
        }
      }

      // Low: Large income received today
      if (type === "income" && isLargeIncome(amount)) {
        const recordDate = record.date || record.created_at;
        if (recordDate && isCreatedToday(recordDate, today)) {
          notifications.push(buildNotification(
            record,
            "Low",
            "Large Income Received",
            `R${amount.toLocaleString()} income from "${description}".`,
            "large_income"
          ));
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
 * Checks if an expense exceeds the large expense threshold.
 */
function isLargeExpense(amount) {
  return amount >= LARGE_EXPENSE_THRESHOLD;
}

/**
 * Checks if an income exceeds the large income threshold.
 */
function isLargeIncome(amount) {
  return amount >= LARGE_INCOME_THRESHOLD;
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
 * Builds a standardized notification object from a finance record.
 * ID is deterministic so dismissed/read state persists across page refreshes.
 */
function buildNotification(record, priority, title, message, type) {
  return {
    id: `finance-${type}-${record.id}`,
    type: `finance_${type}`,
    priority,
    title,
    message,
    module: "Finance",
    route: "/finance",
    read: false,
    createdAt: record.due_date || record.date || record.created_at || new Date().toISOString(),
  };
}
