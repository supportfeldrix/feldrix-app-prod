import { supabase } from "../supabase";
import { inPeriod } from "./_period";
import { formatMass } from "../../utils/units";

/**
 * ============================================================
 * Livestock Performance Report — Phase 1
 *
 * The livestock schema is primarily current-state (status transitions
 * replace deletion: Active/Sold/Slaughtered/Deceased/Archived). We do
 * NOT fabricate monthly events the schema cannot support.
 *
 * PERIOD ACTIVITY that CAN be derived reliably:
 *   - Animals purchased in the period (purchase_date within range).
 * Everything else (herd composition, health status) is reported as a
 * clearly labelled CURRENT-STATE snapshot.
 *
 * No financial totals are produced here — purchase cost belongs to
 * Finance (autoFinanceService already mirrors purchase_price into
 * finance_records as [auto:purchase-*]); summing purchase_price here
 * would double-count, so we do not.
 * ============================================================
 */

export async function generateLivestockReport({ from, to, farmContext } = {}) {
  const ctx = farmContext || null;
  const { data: animals } = await supabase.from("livestock").select("*");
  const list = animals || [];

  // ── Period activity ────────────────────────────────────────────
  const purchasedInPeriod = list.filter((a) => a.purchase_date && inPeriod(a.purchase_date, from, to));

  // ── Current state (snapshot) ───────────────────────────────────
  const active = list.filter((a) => a.status === "Active" || a.status === "Healthy").length;
  const pregnant = list.filter((a) => a.status === "Pregnant").length;
  const sold = list.filter((a) => a.status === "Sold").length;
  const avgWeight = list.length > 0 ? Math.round(list.reduce((s, a) => s + Number(a.weight || 0), 0) / list.length) : 0;

  return {
    title: "Livestock Performance Report",
    statistics: {
      animalsPurchasedThisPeriod: purchasedInPeriod.length,
      currentHerdSize: list.length,
      activeNow: active,
      averageWeight: formatMass(avgWeight, ctx),
    },
    sections: [
      {
        title: "Livestock Activity (this period)",
        items: [
          { label: "Animals purchased", value: purchasedInPeriod.length },
        ],
      },
      {
        title: "Current State (snapshot)",
        items: [
          { label: "Current herd size", value: list.length },
          { label: "Active", value: active },
          { label: "Pregnant", value: pregnant },
          { label: "Sold (all-time)", value: sold },
          { label: "Average weight", value: formatMass(avgWeight, ctx) },
        ],
      },
    ],
    livestockData: {
      purchasedThisPeriod: purchasedInPeriod.length,
      currentHerdSize: list.length,
      activeNow: active,
    },
    aiSummary:
      purchasedInPeriod.length > 0
        ? `${purchasedInPeriod.length} animal(s) purchased this period. Current herd: ${list.length}.`
        : `No animal purchases this period. Current herd: ${list.length}.`,
  };
}
