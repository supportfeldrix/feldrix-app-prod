import { supabase } from "../supabase";

/**
 * ============================================================
 * Rainfall Report — Phase 1 (Weather section)
 *
 * Uses ONLY farmer-recorded rainfall_logs (amount_mm, rainfall_date).
 * Never uses weather-API estimates and makes no weather API calls.
 * Period filtering uses rainfall_date (the business date).
 *
 * Reuses the standard report shape so the existing PDF/Excel
 * generators render it without modification.
 * ============================================================
 */

export async function generateRainfallReport({ from, to } = {}) {
  let query = supabase
    .from("rainfall_logs")
    .select("amount_mm, rainfall_date, field_name, measurement_source");

  if (from) query = query.gte("rainfall_date", from.split("T")[0]);
  if (to) query = query.lte("rainfall_date", to.split("T")[0]);

  const { data } = await query.order("rainfall_date", { ascending: false });
  const logs = data || [];

  const entries = logs.length;
  const totalMm = logs.reduce((s, r) => s + (Number(r.amount_mm) || 0), 0);
  const round1 = (n) => Math.round(n * 10) / 10;
  const latestDate = logs[0]?.rainfall_date || null;

  // Per-field breakdown (field_name is free text, matching crops convention).
  const byField = {};
  for (const r of logs) {
    const f = r.field_name || "Unspecified";
    byField[f] = (byField[f] || 0) + (Number(r.amount_mm) || 0);
  }
  const fieldItems = Object.entries(byField)
    .sort((a, b) => b[1] - a[1])
    .map(([label, mm]) => ({ label, value: `${round1(mm)} mm` }));

  return {
    title: "Rainfall Report",
    statistics: {
      recordedRainfall: `${round1(totalMm)} mm`,
      logEntries: entries,
      latestReading: latestDate || "—",
    },
    sections: [
      {
        title: "Rainfall (this period)",
        items: [
          { label: "Total recorded rainfall", value: `${round1(totalMm)} mm` },
          { label: "Log entries", value: entries },
          { label: "Latest reading", value: latestDate || "—" },
        ],
      },
      {
        title: "Rainfall by Field",
        items: fieldItems.length ? fieldItems : [{ label: "No rainfall logged in period", value: "—" }],
      },
    ],
    rainfallData: {
      totalMm: round1(totalMm),
      entries,
      latestDate,
    },
    aiSummary:
      entries > 0
        ? `${round1(totalMm)} mm of rainfall recorded across ${entries} entr${entries === 1 ? "y" : "ies"} this period.`
        : "No farmer-recorded rainfall for this period.",
  };
}
