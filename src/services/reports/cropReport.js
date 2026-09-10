import { supabase } from "../supabase";
import { inPeriod } from "./_period";

/**
 * ============================================================
 * Crop Performance Report — Phase 1
 *
 * Cleanly separates PERIOD ACTIVITY from CURRENT STATE:
 *  - Period activity uses business dates (planting_date,
 *    expected_harvest) that fall inside the selected range.
 *  - Current crop status is a snapshot and is labelled as such so it
 *    is never mistaken for monthly activity.
 *
 * Uses existing crops fields only (status, area, planting_date,
 * expected_harvest). No new data, no quantity inference.
 * ============================================================
 */

export async function generateCropReport({ from, to } = {}) {
  const { data } = await supabase.from("crops").select("*");
  const crops = data || [];

  // ── Period activity (business dates within range) ──────────────
  const plantedInPeriod = crops.filter((c) => c.planting_date && inPeriod(c.planting_date, from, to));
  const harvestExpectedInPeriod = crops.filter((c) => c.expected_harvest && inPeriod(c.expected_harvest, from, to));
  const harvestedInPeriod = crops.filter(
    (c) => c.status === "Harvested" && c.expected_harvest && inPeriod(c.expected_harvest, from, to)
  );

  const areaPlanted = plantedInPeriod.reduce((s, c) => s + Number(c.area || 0), 0);

  // ── Current state (snapshot, NOT period activity) ──────────────
  const growingNow = crops.filter((c) => c.status === "Growing").length;
  const harvestedTotal = crops.filter((c) => c.status === "Harvested").length;
  const totalAreaNow = crops.reduce((s, c) => s + Number(c.area || 0), 0);

  return {
    title: "Crop Performance Report",
    statistics: {
      plantedThisPeriod: plantedInPeriod.length,
      harvestExpectedThisPeriod: harvestExpectedInPeriod.length,
      areaPlantedThisPeriod: `${areaPlanted.toFixed(1)} ha`,
      currentlyGrowing: growingNow,
    },
    sections: [
      {
        title: "Crop Activity (this period)",
        items: [
          { label: "Crops planted", value: plantedInPeriod.length },
          { label: "Area planted", value: `${areaPlanted.toFixed(1)} ha` },
          { label: "Harvests expected", value: harvestExpectedInPeriod.length },
          { label: "Harvested (expected date in period)", value: harvestedInPeriod.length },
        ],
      },
      {
        title: "Current State (snapshot)",
        items: [
          { label: "Total crops on record", value: crops.length },
          { label: "Currently growing", value: growingNow },
          { label: "Harvested (all-time)", value: harvestedTotal },
          { label: "Total area on record", value: `${totalAreaNow.toFixed(1)} ha` },
        ],
      },
    ],
    cropData: {
      plantedThisPeriod: plantedInPeriod.length,
      harvestExpectedThisPeriod: harvestExpectedInPeriod.length,
      areaPlanted,
      currentlyGrowing: growingNow,
    },
    aiSummary:
      plantedInPeriod.length > 0
        ? `${plantedInPeriod.length} crop(s) planted this period (${areaPlanted.toFixed(1)} ha).`
        : "No new plantings recorded for this period.",
  };
}
