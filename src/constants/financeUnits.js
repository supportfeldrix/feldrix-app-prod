/**
 * ============================================================
 * Finance Units — Phase 2 (controlled unit system)
 *
 * Single source of truth for the supported Finance quantity units.
 * Stored value is the canonical `value`; the `label` is only for UI.
 * Kept in sync with the DB CHECK constraint in
 * supabase/migrations/20260910000000_finance_quantity_unit.sql.
 *
 * Units are NEVER auto-converted (1 tonne is stored as 1 tonne, not
 * 1000 kg). Aggregation only ever sums quantities that share the same
 * stored unit value.
 * ============================================================
 */

export const FINANCE_UNITS = [
  { value: "litre", label: "Litres" },
  { value: "kg", label: "Kilograms" },
  { value: "tonne", label: "Tonnes" },
  { value: "unit", label: "Units" },
  { value: "bag", label: "Bags" },
  { value: "bale", label: "Bales" },
  { value: "head", label: "Head" },
  { value: "hour", label: "Hours" },
];

export const FINANCE_UNIT_VALUES = FINANCE_UNITS.map((u) => u.value);

const LABEL_BY_VALUE = FINANCE_UNITS.reduce((acc, u) => {
  acc[u.value] = u.label;
  return acc;
}, {});

/** Canonical stored value if valid, otherwise null. */
export function normalizeUnit(unit) {
  if (!unit) return null;
  const v = String(unit).trim().toLowerCase();
  return FINANCE_UNIT_VALUES.includes(v) ? v : null;
}

/** Human-friendly label for a stored unit value (falls back to the raw value). */
export function unitLabel(unit) {
  if (!unit) return "";
  return LABEL_BY_VALUE[unit] || String(unit);
}

/**
 * Suggested default unit for a transaction_type. Purely a UI convenience —
 * the farmer can always change it, and quantity/unit remain optional.
 */
export function suggestedUnitForType(transactionType) {
  switch (transactionType) {
    case "Diesel":
    case "Fuel":
      return "litre";
    case "Fertilizer":
    case "Seed":
    case "Feed":
      return "kg";
    case "Hay":
    case "Silage":
      return "bale";
    case "Labour":
    case "Machinery Service":
    case "Machinery Repair":
      return "hour";
    default:
      return "";
  }
}

/**
 * Format a quantity + unit for display without floating-point noise.
 * Trims trailing zeros: 500 -> "500", 500.5 -> "500.5", 1.50 -> "1.5".
 * Returns "" when there is nothing meaningful to show.
 */
export function formatQuantity(quantity, unit) {
  const n = Number(quantity);
  if (!Number.isFinite(n) || n <= 0) return "";
  const num = trimNumber(n);
  const label = unitLabel(unit);
  return label ? `${num} ${label}` : `${num}`;
}

/**
 * Number formatting for QUANTITIES: comma thousands separators, dot decimal,
 * up to 2 decimals, no trailing zeros. Deterministic (locale-independent) so
 * quantities read unambiguously in reports/exports (e.g. "2,000" and "1.5")
 * and never show the "1,5"/"2 000" ambiguity or floating-point noise.
 * Currency continues to use the app's existing en-ZA `zar()` formatting.
 */
export function trimNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  // Round to at most 2 decimals, drop trailing zeros.
  const rounded = Math.round(num * 100) / 100;
  const [intPart, decPart] = String(rounded).split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${withThousands}.${decPart}` : withThousands;
}
