/**
 * ============================================================
 * Feldrix — Crop Intelligence (USA-4)
 *
 * Region-aware SEASONAL / TIMING intelligence for crops. This is NOT agronomy
 * prescription — it never recommends fertiliser/irrigation/chemical rates. It
 * answers timing questions:
 *   - Is the crop within / before / after the typical regional planting window?
 *   - Was it planted earlier or later than typical?
 *   - Is the typical harvest period approaching?
 *   - Which lifecycle stage is it in (via the EXISTING lifecycle engine)?
 *   - Is there freeze/frost risk for a frost-sensitive crop (from NWS weather)?
 *
 * ARCHITECTURE (design §2)
 *   Farm Context → Country/Region → Regional Crop Profile → EXISTING lifecycle
 *   engine → Weather → Crop Intelligence. There is NO separate SA/US logic:
 *   this layer simply resolves a US regional profile from the farm context. If
 *   no profile resolves (non-US farm, or unsupported crop), it returns
 *   `available:false` and the UI shows nothing new — SA behaviour is untouched.
 *
 * DATA QUALITY (design §15)
 *   Never invents precision. Missing profile → no regional timing. Missing
 *   planting date → no lifecycle stage. Missing weather → no frost info.
 *   Windows are TYPICAL/EXPECTED, phrased as such.
 *
 * UNITS
 *   This module deals in timing (dates/days) and CANONICAL weather (°C). It
 *   emits NO unit strings — the UI localises via USA-2 utils/units. Frost
 *   thresholds are canonical °C (aligned with weatherIntelligenceService).
 * ============================================================
 */

import { getCropLifecycle } from "./cropLifecycle";
import { getUsCropProfile } from "../constants/usCropProfiles";

// Canonical frost thresholds (°C), aligned with weatherIntelligenceService.
const FROST_C = 3;
const FREEZE_C = 0;

// ─── date-of-year helpers (timezone-neutral) ──────────────────────────────────
/** "MM-DD" → day-of-year index (1..366) using a fixed non-leap reference. */
function mdToDoy(md) {
  if (!md) return null;
  const [m, d] = md.split("-").map(Number);
  if (!m || !d) return null;
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let doy = d;
  for (let i = 0; i < m - 1; i++) doy += daysInMonth[i];
  return doy;
}

/** A Date → day-of-year (1..366). */
function dateToDoy(date) {
  const d = new Date(date);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
}

/**
 * Is `doy` inside [startDoy, endDoy], handling windows that wrap the new year
 * (e.g. winter wheat planted Sep–Nov, harvested next Jun)? Returns boolean.
 */
function doyInWindow(doy, startDoy, endDoy) {
  if (startDoy == null || endDoy == null || doy == null) return false;
  if (startDoy <= endDoy) return doy >= startDoy && doy <= endDoy;
  // wrapping window (spans Dec→Jan)
  return doy >= startDoy || doy <= endDoy;
}

/** Signed day distance from `doy` to a window edge, accounting for wrap. */
function daysUntilDoy(fromDoy, targetDoy) {
  if (fromDoy == null || targetDoy == null) return null;
  let diff = targetDoy - fromDoy;
  if (diff < -182) diff += 365;      // target is early next year
  if (diff > 182) diff -= 365;       // target was late last year
  return diff;
}

// ─── planting-window assessment ───────────────────────────────────────────────
/**
 * Assess where TODAY (and, if provided, the crop's planting date) sits relative
 * to the typical regional planting window. All qualitative — never prescriptive.
 * @returns {object} { status, label, message, windowStart, windowEnd }
 */
function assessPlantingWindow(profile, plantingDate, now) {
  const startDoy = mdToDoy(profile.plantingStart);
  const endDoy = mdToDoy(profile.plantingEnd);
  const nowDoy = dateToDoy(now);

  const base = { windowStart: profile.plantingStart, windowEnd: profile.plantingEnd };

  // If we know when it was actually planted, judge that against the window.
  if (plantingDate) {
    const plantDoy = dateToDoy(plantingDate);
    if (doyInWindow(plantDoy, startDoy, endDoy)) {
      return { ...base, status: "planted_in_window", label: "Planted in typical window",
        message: "Planted within the typical regional planting window." };
    }
    const toStart = daysUntilDoy(plantDoy, startDoy); // + means planted before start
    if (toStart != null && toStart > 0) {
      return { ...base, status: "planted_early", label: "Planted earlier than typical",
        message: "Planted earlier than the typical regional planting window." };
    }
    return { ...base, status: "planted_late", label: "Planted later than typical",
      message: "Planted later than the typical regional planting window." };
  }

  // No planting date yet → describe where the window is relative to today.
  if (doyInWindow(nowDoy, startDoy, endDoy)) {
    const toEnd = daysUntilDoy(nowDoy, endDoy);
    if (toEnd != null && toEnd <= 10) {
      return { ...base, status: "window_closing", label: "Planting window closing",
        message: "The typical regional planting window is closing soon." };
    }
    return { ...base, status: "in_window", label: "In typical planting window",
      message: "Currently within the typical regional planting window." };
  }
  const toStart = daysUntilDoy(nowDoy, startDoy);
  if (toStart != null && toStart > 0) {
    return { ...base, status: "before_window", label: "Before typical window",
      message: "The typical regional planting window has not opened yet." };
  }
  return { ...base, status: "after_window", label: "After typical window",
    message: "The typical regional planting window has passed for this season." };
}

// ─── harvest-timing assessment ────────────────────────────────────────────────
function assessHarvestTiming(profile, now) {
  const startDoy = mdToDoy(profile.harvestStart);
  const endDoy = mdToDoy(profile.harvestEnd);
  const nowDoy = dateToDoy(now);
  const base = { windowStart: profile.harvestStart, windowEnd: profile.harvestEnd };

  if (doyInWindow(nowDoy, startDoy, endDoy)) {
    return { ...base, status: "in_harvest_window", label: "Typical harvest period",
      message: "Currently within the typical regional harvest period." };
  }
  const toStart = daysUntilDoy(nowDoy, startDoy);
  if (toStart != null && toStart > 0 && toStart <= 21) {
    return { ...base, status: "harvest_approaching", label: "Harvest period approaching",
      message: "The typical regional harvest period is approaching." };
  }
  return { ...base, status: "outside_harvest_window", label: "Outside typical harvest period",
    message: null };
}

// ─── frost risk (canonical weather, frost-sensitive crops only) ───────────────
function assessFrostRisk(profile, weather) {
  if (!profile.frostSensitive) return null;
  if (!weather || !weather.available) return null; // no fabricated risk

  const current = weather.current || {};
  const forecast = Array.isArray(weather.forecast) ? weather.forecast : [];

  // Lowest upcoming temperature we can see from canonical (°C) data.
  const mins = [];
  if (Number.isFinite(Number(current.temperature))) mins.push(Number(current.temperature));
  for (const d of forecast.slice(0, 5)) {
    const v = Number(d.temperatureMin ?? d.temperature);
    if (Number.isFinite(v)) mins.push(v);
  }
  if (mins.length === 0) return null;
  const lowest = Math.min(...mins);

  if (lowest <= FREEZE_C) {
    return { status: "freeze", severity: "high", lowestC: lowest,
      message: "Freezing conditions expected — high risk for this frost-sensitive crop." };
  }
  if (lowest <= FROST_C) {
    return { status: "frost", severity: "medium", lowestC: lowest,
      message: "Cold conditions may present frost risk for this frost-sensitive crop." };
  }
  return null;
}

/**
 * Region-aware seasonal intelligence for a single crop.
 *
 * @param {object} crop - crop row (crop_name, planting_date, status, ...)
 * @param {object|null} farmCtx - farm context from getFarmContext/useFarmContext
 * @param {object|null} weather - canonical weather summary (optional)
 * @param {Date} [now=new Date()]
 * @returns {object} {
 *   available, crop, cropKey, region, profile,
 *   planting, harvest, frost,
 *   lifecycleStage, manualStatus, isManualHarvested,
 *   source
 * }
 */
export function getCropSeasonalIntelligence(crop, farmCtx, weather = null, now = new Date()) {
  const notAvailable = { available: false };

  // Region gating: only US farms have regional profiles. Non-US → nothing new.
  const country = String(farmCtx?.country || "").toLowerCase();
  const isUs = country === "united states" || country === "us" || country === "usa";
  if (!isUs || !crop) return notAvailable;

  const profile = getUsCropProfile(crop.crop_name || crop.name, farmCtx?.state);
  if (!profile) return notAvailable; // unsupported crop → no guessed timing

  // Manual "Harvested" status must win over any calculated stage (design §11).
  const isManualHarvested = crop.status === "Harvested";

  // Lifecycle via the EXISTING engine, fed the regional profile's season length
  // (only used when the farmer hasn't set explicit growing days / harvest date).
  const lifecycle = crop.planting_date ? getCropLifecycle(crop, profile) : null;

  const planting = assessPlantingWindow(profile, crop.planting_date || null, now);
  const harvest = assessHarvestTiming(profile, now);
  const frost = isManualHarvested ? null : assessFrostRisk(profile, weather);

  return {
    available: true,
    crop: crop.crop_name || crop.name || "Crop",
    cropKey: profile.crop,
    region: profile.region,
    profile: {
      plantingStart: profile.plantingStart,
      plantingEnd: profile.plantingEnd,
      harvestStart: profile.harvestStart,
      harvestEnd: profile.harvestEnd,
      growingDaysMin: profile.growingDaysMin,
      growingDaysMax: profile.growingDaysMax,
      frostSensitive: profile.frostSensitive,
      notes: profile.notes || null,
    },
    planting,
    harvest,
    frost,
    lifecycleStage: isManualHarvested ? "Harvested" : (lifecycle ? lifecycle.lifecycleStage : null),
    manualStatus: crop.status || null,
    isManualHarvested,
    source: profile.source,
  };
}

/**
 * Build region-aware crop-timing INSIGHT objects (matching the Farm Intelligence
 * insight shape: { id, priority, category, title, description, action, route,
 * source }) for the global intelligence engine. US farms only; returns [] for
 * SA/no-profile/insufficient data so it can be concatenated safely.
 *
 * Deliberately CONCISE — one planting-timing + one frost insight at most per
 * crop-key, deduped, to avoid flooding the dashboard (design §12).
 */
export function generateRegionalCropTimingInsights(crops, farmCtx, weather = null, now = new Date()) {
  const out = [];
  const country = String(farmCtx?.country || "").toLowerCase();
  const isUs = country === "united states" || country === "us" || country === "usa";
  if (!isUs || !Array.isArray(crops) || crops.length === 0) return out;

  const seenPlantingLate = new Set();
  const seenFrost = new Set();

  for (const crop of crops) {
    if (crop.status === "Harvested") continue;
    const intel = getCropSeasonalIntelligence(crop, farmCtx, weather, now);
    if (!intel.available) continue;

    const name = intel.crop;

    // Planted-late timing note (informational, not alarming).
    if (intel.planting?.status === "planted_late" && !seenPlantingLate.has(intel.cropKey)) {
      seenPlantingLate.add(intel.cropKey);
      out.push({
        id: `crops-regional-timing-${intel.cropKey}`,
        priority: "Low",
        category: "Crops",
        title: `${name}: planted later than typical`,
        description: `${name} was planted later than the typical planting window for your region (${intel.region.replace(/_/g, " ")}). This is a regional expectation, not a rule.`,
        action: "View crop timing",
        route: "/crops",
        source: "Crop + Region",
      });
    }

    // Frost risk for frost-sensitive crops (needs real weather).
    if (intel.frost && !seenFrost.has(intel.cropKey)) {
      seenFrost.add(intel.cropKey);
      out.push({
        id: `crops-regional-frost-${intel.cropKey}`,
        priority: intel.frost.severity === "high" ? "High" : "Medium",
        category: "Crops",
        title: `${name}: cold/frost risk`,
        description: intel.frost.message,
        action: "Check weather",
        route: "/weather",
        source: "Crop + Weather",
      });
    }
  }

  return out;
}
