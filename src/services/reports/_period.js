/**
 * ============================================================
 * Report Period Helpers — Phase 1 (Intelligent Monthly Report)
 *
 * Small, shared, dependency-free helpers so every report provider
 * filters on the SAME date semantics. Additive only — no schema,
 * no service changes.
 *
 * Business dates in Feldrix are stored as plain DATE columns
 * (transaction_date, treatment_date, rainfall_date, service_date,
 * planting_date, expected_harvest, purchase_date). We therefore
 * compare on the calendar day (YYYY-MM-DD) to avoid UTC/local drift.
 *
 * `from`/`to` arrive as ISO strings from reportGenerator.resolveDateRange.
 * We reduce them to their date-only (YYYY-MM-DD) prefix, exactly like
 * the existing financeReport already did (`from.split("T")[0]`), so we
 * do not introduce a timezone regression.
 * ============================================================
 */

/** Reduce an ISO/date string to its YYYY-MM-DD prefix (local-day safe). */
export function toDateOnly(value) {
  if (!value) return null;
  const s = String(value);
  // Already a plain date or an ISO timestamp — take the calendar-day part.
  return s.split("T")[0];
}

/**
 * True when a record's business date (a DATE column value) falls within
 * [from, to] inclusive. All comparisons are string comparisons on the
 * YYYY-MM-DD prefix, which is safe and stable for ISO date strings.
 */
export function inPeriod(recordDate, from, to) {
  const d = toDateOnly(recordDate);
  if (!d) return false;
  const f = toDateOnly(from);
  const t = toDateOnly(to);
  if (f && d < f) return false;
  if (t && d > t) return false;
  return true;
}

import { formatCurrency } from "../../utils/currency";
import { formatArea as fmtArea } from "../../utils/units";

/**
 * Farm-aware monetary formatting for reports.
 *   zar(amount)        → ZAR / en-ZA (unchanged legacy behaviour, SA-safe)
 *   zar(amount, ctx)   → farm operating currency/locale from getFarmContext()
 * Named `zar` for backward compatibility with existing call-sites; when a
 * farm context is passed it delegates to the central formatCurrency.
 */
export function zar(amount, ctx) {
  if (ctx) return formatCurrency(amount, ctx);
  // Legacy default: exact previous SA output.
  return `R ${Number(amount || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}

/**
 * Farm-aware area formatting for reports. Canonical value is hectares.
 *   area(ha)        → "X ha" (metric default, SA-safe)
 *   area(ha, ctx)   → hectares or acres per farm measurement system
 */
export function area(valueHa, ctx) {
  if (ctx) return fmtArea(valueHa, ctx);
  const n = Number(valueHa || 0);
  return `${(Math.round(n * 100) / 100).toLocaleString("en-ZA", { maximumFractionDigits: 2 })} ha`;
}

/**
 * Normalise a plan/category/type string for tolerant comparison
 * (existing data is standardised but casing can vary).
 */
export function norm(value) {
  return String(value ?? "").trim().toLowerCase();
}
