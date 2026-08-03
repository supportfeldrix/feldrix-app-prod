/**
 * ============================================================
 * Feldrix Control Centre — Formatters
 * Sprint 46.2
 * ============================================================
 */

/**
 * Format currency (ZAR).
 */
export function formatCurrency(amount, currency = "ZAR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(num) {
  if (num == null) return "—";
  return new Intl.NumberFormat("en-ZA").format(num);
}

/**
 * Format a date relative to now (e.g. "3 hours ago", "2 days ago").
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Format a date as DD MMM YYYY.
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a percentage.
 */
export function formatPercent(value, decimals = 0) {
  if (value == null) return "—";
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(str, max = 40) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}
