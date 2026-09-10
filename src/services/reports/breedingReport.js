import { supabase } from "../supabase";
import { inPeriod } from "./_period";

/**
 * ============================================================
 * Breeding Performance Report — Phase 1
 *
 * Period activity uses breeding_date (the business/event date):
 * how many breedings were recorded in the selected range. Overall
 * status counts are reported as a clearly labelled current-state
 * snapshot. Existing fields only (status, breeding_method,
 * breeding_date). No new data.
 * ============================================================
 */

export async function generateBreedingReport({ from, to } = {}) {
  const { data } = await supabase.from("breeding_records").select("*");
  const records = data || [];

  // ── Period activity ────────────────────────────────────────────
  const bredInPeriod = records.filter((r) => r.breeding_date && inPeriod(r.breeding_date, from, to));

  // ── Current-state snapshot ─────────────────────────────────────
  const pregnant = records.filter((r) => r.status === "Pregnant" || r.status === "Confirmed").length;
  const completed = records.filter((r) => r.status === "Completed").length;
  const successRate = records.length > 0 ? Math.round(((pregnant + completed) / records.length) * 100) : 0;

  return {
    title: "Breeding Performance Report",
    statistics: {
      breedingsThisPeriod: bredInPeriod.length,
      totalRecords: records.length,
      pregnant,
      successRate: `${successRate}%`,
    },
    sections: [
      {
        title: "Breeding Activity (this period)",
        items: [{ label: "Breedings recorded", value: bredInPeriod.length }],
      },
      { title: "Breeding Status (snapshot)", items: summarizeByField(records, "status") },
      { title: "Methods Used (snapshot)", items: summarizeByField(records, "breeding_method") },
    ],
    breedingData: {
      breedingsThisPeriod: bredInPeriod.length,
      totalRecords: records.length,
      successRate,
    },
    aiSummary:
      successRate >= 70
        ? "Breeding programme performing well."
        : "Consider reviewing breeding timing and nutrition.",
  };
}

function summarizeByField(records, field) {
  const grouped = {};
  for (const r of records) {
    const k = r[field] || "Unknown";
    grouped[k] = (grouped[k] || 0) + 1;
  }
  return Object.entries(grouped).map(([label, value]) => ({ label, value }));
}
