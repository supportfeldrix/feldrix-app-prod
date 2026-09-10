import { supabase } from "../supabase";
import { inPeriod, zar } from "./_period";
import { formatQuantity, unitLabel, trimNumber } from "../../constants/financeUnits";

/**
 * ============================================================
 * Monthly Finance Report — Phase 1
 *
 * FINANCE IS THE SINGLE FINANCIAL SOURCE OF TRUTH.
 * Expense/income totals come EXCLUSIVELY from finance_records.
 * Auto-created rows (health/purchase, tagged [auto:health-*] /
 * [auto:purchase-*] in the description by autoFinanceService) ARE
 * finance rows, so they are already counted here exactly once.
 * No other module's cost field is ever added on top of these totals.
 *
 * Period filtering uses transaction_date (the business date), never
 * created_at — preserving the existing, correct behaviour.
 * ============================================================
 */

// Categories we surface explicitly in the monthly breakdown when present.
// These are existing standardised transaction_type values (no new data).
const KEY_EXPENSE_TYPES = [
  "Diesel",
  "Fuel",
  "Fertilizer",
  "Seed",
  "Feed",
  "Veterinary",
  "Medication",
  "Machinery Repair",
  "Machinery Service",
  "Equipment",
  "Labour",
  "Transport",
];

export async function generateFinanceReport({ from, to, farmContext } = {}) {
  const ctx = farmContext || null;
  let query = supabase.from("finance_records").select("*");

  if (from) query = query.gte("transaction_date", from.split("T")[0]);
  if (to) query = query.lte("transaction_date", to.split("T")[0]);

  const { data: records } = await query.order("transaction_date", { ascending: false });

  const data = records || [];

  const income = data
    .filter((r) => r.category === "Income")
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  const expenses = data
    .filter((r) => r.category === "Expense")
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  // Per-transaction_type breakdown (count + total amount) for the period.
  const expenseGroups = groupByType(data.filter((r) => r.category === "Expense"));
  const incomeGroups = groupByType(data.filter((r) => r.category === "Income"));

  // Ordered expense breakdown: key categories first (only if they exist),
  // then any remaining categories, all with count + amount.
  const expenseItems = buildOrderedItems(expenseGroups, KEY_EXPENSE_TYPES, ctx);
  const incomeItems = buildOrderedItems(incomeGroups, [], ctx);

  return {
    title: "Monthly Finance Report",
    statistics: {
      transactions: data.length,
      income: zar(income, ctx),
      expenses: zar(expenses, ctx),
      netPosition: zar(income - expenses, ctx),
      profitMargin: income > 0 ? (((income - expenses) / income) * 100).toFixed(1) + "%" : "0%",
    },
    sections: [
      { title: "Expenses by Category", items: expenseItems.length ? expenseItems : [{ label: "No expenses in period", value: "—" }] },
      { title: "Income by Category", items: incomeItems.length ? incomeItems : [{ label: "No income in period", value: "—" }] },
    ],
    // Structured data for the Farm Summary to reuse without re-querying.
    financeData: {
      income,
      expenses,
      net: income - expenses,
      expenseGroups,
      incomeGroups,
    },
    aiSummary:
      income > expenses
        ? "Farm is profitable for this period. Continue monitoring expenses."
        : "Expenses exceed income for this period. Review cost categories for savings.",
  };
}

/**
 * Groups records by transaction_type.
 * Returns { type: { count, amount, quantitiesByUnit, qtyRecordedCount } }.
 *
 * quantitiesByUnit sums quantities ONLY within the SAME stored unit, so
 * incompatible units (e.g. litre vs kg) are never combined. Units are never
 * auto-converted. qtyRecordedCount tracks how many transactions in the
 * category actually carried a quantity, so the report can say "recorded"
 * when the quantity data is only partial (and never fabricate the rest).
 */
function groupByType(records) {
  const grouped = {};
  for (const r of records) {
    const type = r.transaction_type || "Other";
    if (!grouped[type]) {
      grouped[type] = { count: 0, amount: 0, quantitiesByUnit: {}, qtyRecordedCount: 0 };
    }
    grouped[type].count += 1;
    grouped[type].amount += Number(r.amount || 0);

    // Only aggregate a quantity when BOTH a positive quantity and a unit
    // were recorded. Money (amount) is never derived from quantity.
    const qty = Number(r.quantity);
    if (Number.isFinite(qty) && qty > 0 && r.unit) {
      grouped[type].quantitiesByUnit[r.unit] = (grouped[type].quantitiesByUnit[r.unit] || 0) + qty;
      grouped[type].qtyRecordedCount += 1;
    }
  }
  return grouped;
}

/**
 * Builds display line(s) for a category's recorded quantities.
 * One line per distinct unit (mixed units are shown separately, never
 * combined). Appends "recorded" when only some transactions in the
 * category carried a quantity, so the total is not presented as complete.
 * Returns [] when no quantities were recorded.
 */
function quantityLines(group) {
  const units = Object.keys(group.quantitiesByUnit || {});
  if (units.length === 0) return [];

  const partial = group.qtyRecordedCount < group.count;
  const suffix = partial ? " recorded" : "";

  return units.map((u) => {
    const total = group.quantitiesByUnit[u];
    return `${trimNumber(total)} ${unitLabel(u)}${suffix}`;
  });
}

/**
 * Produces label/value items ordered by a preferred key list first,
 * then the remaining categories by amount descending. Each value shows
 * "N purchase(s) · R amount" so quantity-of-transactions is visible
 * WITHOUT inventing physical quantities (litres/kg are Phase 2).
 */
function buildOrderedItems(groups, preferredOrder, ctx) {
  const seen = new Set();
  const items = [];

  for (const key of preferredOrder) {
    if (groups[key]) {
      items.push(formatItem(key, groups[key], ctx));
      seen.add(key);
    }
  }

  const remaining = Object.entries(groups)
    .filter(([k]) => !seen.has(k))
    .sort((a, b) => b[1].amount - a[1].amount);

  for (const [key, g] of remaining) {
    items.push(formatItem(key, g, ctx));
  }

  return items;
}

function formatItem(label, group, ctx) {
  const txnWord = group.count === 1 ? "transaction" : "transactions";
  const parts = [`${group.count} ${txnWord}`];

  // Insert recorded quantity line(s) between count and amount, when present.
  for (const qLine of quantityLines(group)) parts.push(qLine);

  parts.push(zar(group.amount, ctx));

  return {
    label,
    value: parts.join(" · "),
    // Structured metadata for exporters (Excel columns) — optional; the
    // string `value` above remains the single source for PDF/preview.
    meta: {
      count: group.count,
      amount: group.amount,
      quantitiesByUnit: group.quantitiesByUnit,
      qtyPartial: group.qtyRecordedCount > 0 && group.qtyRecordedCount < group.count,
    },
  };
}
