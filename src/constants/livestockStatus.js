/**
 * Feldrix — Livestock Lifecycle Status Constants
 */

export const LIVESTOCK_STATUSES = [
  { value: "Active", label: "Active", color: "#16A34A", bg: "#DCFCE7" },
  { value: "Pregnant", label: "Pregnant", color: "#7C3AED", bg: "#EDE9FE" },
  { value: "Sick", label: "Sick", color: "#F59E0B", bg: "#FEF3C7" },
  { value: "Sold", label: "Sold", color: "#3B82F6", bg: "#DBEAFE" },
  { value: "Slaughtered", label: "Slaughtered", color: "#64748B", bg: "#F1F5F9" },
  { value: "Deceased", label: "Deceased", color: "#EF4444", bg: "#FEE2E2" },
  { value: "Archived", label: "Archived", color: "#94A3B8", bg: "#F8FAFC" },
];

/** Statuses that appear in the active herd */
export const ACTIVE_STATUSES = ["Active", "Pregnant", "Sick"];

/** Statuses that remove the animal from active herd view */
export const INACTIVE_STATUSES = ["Sold", "Slaughtered", "Deceased", "Archived"];

/**
 * Get the status config for a given value.
 */
export function getStatusConfig(status) {
  return LIVESTOCK_STATUSES.find((s) => s.value === status) || LIVESTOCK_STATUSES[0];
}
