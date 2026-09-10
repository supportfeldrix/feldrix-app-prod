import { supabase } from "../supabase";
import { inPeriod, area } from "./_period";
import { acresToHa } from "../../utils/units";

/**
 * Normalise a crop's stored area to canonical HECTARES using its OWN
 * area_unit (crops.area_unit is authoritative — the farmer chooses ha|acres
 * in CropForm; default 'ha'). This must run BEFORE any farm-display
 * conversion so an acres-stored crop is not mis-converted. Stored crop
 * values are never modified.
 */
function cropAreaHa(crop) {
  const raw = Number(crop?.area || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const unit = String(crop?.area_unit || "ha").trim().toLowerCase();
  return unit === "acres" || unit === "acre" ? acresToHa(raw) : raw; // canonical ha
}

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

export async function generateCropReport({ from, to, farmContext } = {}) {
  const ctx = farmContext || null;
  const { data } = await supabase.from("crops").select("*");
  const crops = data || [];

  // ── Period activity (business dates within range) ──────────────
  const plantedInPeriod = crops.filter((c) => c.planting_date && inPeriod(c.planting_date, from, to));
  const harvestExpectedInPeriod = crops.filter((c) => c.expected_harvest && inPeriod(c.expected_harvest, from, to));
  const harvestedInPeriod = crops.filter(
    (c) => c.status === "Harvested" && c.expected_harvest && inPeriod(c.expected_harvest, from, to)
  );

  // Sum in canonical hectares (each crop normalized from its own area_unit),
  // then display-convert once via area(...) — never sum mixed units.
  const areaPlanted = plantedInPeriod.reduce((s, c) => s + cropAreaHa(c), 0);

  // ── Current state (snapshot, NOT period activity) ──────────────
  const growingNow = crops.filter((c) => c.status === "Growing").length;
  const harvestedTotal = crops.filter((c) => c.status === "Harvested").length;
  const totalAreaNow = crops.reduce((s, c) => s + cropAreaHa(c), 0);

  return {
    title: "Crop Performance Report",
    statistics: {
      plantedThisPeriod: plantedInPeriod.length,
      harvestExpectedThisPeriod: harvestExpectedInPeriod.length,
      areaPlantedThisPeriod: area(areaPlanted, ctx),
      currentlyGrowing: growingNow,
    },
    sections: [
      {
        title: "Crop Activity (this period)",
        items: [
          { label: "Crops planted", value: plantedInPeriod.length },
          { label: "Area planted", value: area(areaPlanted, ctx) },
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
          { label: "Total area on record", value: area(totalAreaNow, ctx) },
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
