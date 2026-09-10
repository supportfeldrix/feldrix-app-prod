import { supabase } from "../supabase";
import { inPeriod, zar } from "./_period";

/**
 * ============================================================
 * Animal Health Report — Phase 1
 *
 * ACTIVITY (counts) comes from animal_health, filtered by
 * treatment_date for the selected period.
 *
 * EXPENDITURE is NEVER summed from animal_health.cost. Finance is the
 * financial source of truth. autoFinanceService already mirrors every
 * health cost into finance_records (tagged [auto:health-*], mapped to
 * transaction_type Veterinary/Medication). Summing animal_health.cost
 * on top of finance would double-count, so we deliberately DO NOT.
 * The "health expenditure" line is derived from finance_records
 * (Veterinary + Medication expense types) in the same period.
 *
 * Data model note: one animal_health row = one animal. "Animals treated"
 * is therefore reported as the distinct animal_id count (least
 * misleading). We NEVER infer a batch quantity from a single row.
 * ============================================================
 */

const ACTIVITY_TYPES = ["Vaccination", "Deworming", "Medication", "Treatment", "Veterinary Visit"];

export async function generateHealthReport({ from, to, farmContext } = {}) {
  const ctx = farmContext || null;
  // Health activity — filter by treatment_date (business/event date).
  let healthQuery = supabase.from("animal_health").select("*");
  if (from) healthQuery = healthQuery.gte("treatment_date", from.split("T")[0]);
  if (to) healthQuery = healthQuery.lte("treatment_date", to.split("T")[0]);

  const { data: healthRows } = await healthQuery.order("treatment_date", { ascending: false });
  const records = healthRows || [];

  const counts = {};
  for (const t of ACTIVITY_TYPES) counts[t] = 0;
  const animalIds = new Set();

  for (const r of records) {
    const type = r.treatment_type || "Other";
    counts[type] = (counts[type] || 0) + 1;
    if (r.animal_id) animalIds.add(r.animal_id);
  }

  // Informational only: how many scheduled treatments were completed in the
  // period (completed_at). This READS the existing planner-completion columns;
  // it does NOT change any completion logic.
  const completedInPeriod = records.filter((r) => r.completed_at && inPeriod(r.completed_at, from, to)).length;

  // Health expenditure from Finance (source of truth) — Veterinary + Medication
  // expense transactions in the period. Never animal_health.cost.
  const healthSpend = await getHealthSpendFromFinance(from, to);

  const totalActivity = records.length;
  const animalsTreated = animalIds.size;

  return {
    title: "Animal Health Report",
    statistics: {
      totalActivity,
      vaccinations: counts["Vaccination"] || 0,
      dewormings: counts["Deworming"] || 0,
      treatments: (counts["Treatment"] || 0) + (counts["Medication"] || 0),
      animalsTreated,
      healthExpenditure: zar(healthSpend, ctx),
    },
    sections: [
      {
        title: "Health Activity (this period)",
        items: [
          { label: "Vaccinations", value: counts["Vaccination"] || 0 },
          { label: "Dewormings", value: counts["Deworming"] || 0 },
          { label: "Medication", value: counts["Medication"] || 0 },
          { label: "Treatments", value: counts["Treatment"] || 0 },
          { label: "Veterinary Visits", value: counts["Veterinary Visit"] || 0 },
          { label: "Total health activity", value: totalActivity },
          { label: "Animals treated (distinct)", value: animalsTreated },
          { label: "Scheduled treatments completed", value: completedInPeriod },
        ],
      },
      {
        title: "Health Expenditure (from Finance — source of truth)",
        items: [
          { label: "Veterinary + Medication spend", value: zar(healthSpend, ctx) },
        ],
      },
    ],
    // Structured data for the Farm Summary (avoids re-query / double counting).
    healthData: {
      totalActivity,
      animalsTreated,
      counts,
      completedInPeriod,
      healthSpend, // sourced from Finance
    },
    aiSummary:
      totalActivity > 0
        ? `${totalActivity} health activities recorded across ${animalsTreated} animal(s) this period.`
        : "No health activity recorded for this period.",
  };
}

/**
 * Health spend for the period, taken from finance_records (the financial
 * source of truth), limited to Veterinary + Medication expense types.
 * This intentionally does NOT read animal_health.cost to avoid the
 * double-count that autoFinanceService would otherwise create.
 */
async function getHealthSpendFromFinance(from, to) {
  let q = supabase
    .from("finance_records")
    .select("amount, category, transaction_type, transaction_date")
    .eq("category", "Expense")
    .in("transaction_type", ["Veterinary", "Medication"]);

  if (from) q = q.gte("transaction_date", from.split("T")[0]);
  if (to) q = q.lte("transaction_date", to.split("T")[0]);

  const { data } = await q;
  return (data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
}
