/**
 * ============================================================
 * Feldrix — Crop Growth Lifecycle Engine
 * Version 1.0
 *
 * Automatically calculates a crop's biological growth stage
 * from crop type and planting date.
 *
 * Works completely offline — pure date math, no network calls.
 *
 * Usage:
 *   const result = getCropLifecycle(crop);
 *   // { ageDays, lifecycleStage, nextStage, nextTransitionDate,
 *   //   estimatedHarvestDate, daysRemaining, progressPercent }
 * ============================================================
 */

// ─── Growing Periods (days) ─────────────────────────────────

const GROWING_PERIODS = {
  "Maize": 120,
  "Wheat": 120,
  "Soybeans": 110,
  "Soybean": 110,
  "Sunflower": 110,
  "Potatoes": 90,
  "Potato": 90,
  "Tomatoes": 90,
  "Tomato": 90,
  "Onions": 120,
  "Onion": 120,
  "Lucerne": 45,
  "Barley": 100,
  "Sorghum": 110,
  "Cotton": 150,
  "Sugarcane": 270,
  "Rice": 120,
  "Canola": 130,
  "Groundnuts": 120,
  "Groundnut": 120,
  "Beans": 80,
  "Bean": 80,
  "Peas": 70,
  "Cabbage": 80,
  "Carrots": 75,
  "Carrot": 75,
  "Lettuce": 60,
  "Pumpkin": 100,
  "Spinach": 45,
  "Grapes": 180,
  "Citrus": 270,
};

const DEFAULT_GROWING_DAYS = 120;

// ─── Lifecycle Stages ───────────────────────────────────────

const STAGES = [
  { stage: "Planted", percentStart: 0, percentEnd: 10 },
  { stage: "Emergence", percentStart: 10, percentEnd: 30 },
  { stage: "Vegetative", percentStart: 30, percentEnd: 50 },
  { stage: "Rapid Growth", percentStart: 50, percentEnd: 70 },
  { stage: "Flowering", percentStart: 70, percentEnd: 85 },
  { stage: "Fruit / Grain Development", percentStart: 85, percentEnd: 100 },
  { stage: "Harvest Ready", percentStart: 100, percentEnd: Infinity },
];

// ─── Stage Colors ───────────────────────────────────────────

const STAGE_COLORS = {
  "Planted": { color: "#92400E", bg: "#FEF3C7" },
  "Emergence": { color: "#65A30D", bg: "#ECFCCB" },
  "Vegetative": { color: "#16A34A", bg: "#DCFCE7" },
  "Rapid Growth": { color: "#15803D", bg: "#BBF7D0" },
  "Flowering": { color: "#CA8A04", bg: "#FEF9C3" },
  "Fruit / Grain Development": { color: "#EA580C", bg: "#FFF7ED" },
  "Harvest Ready": { color: "#B45309", bg: "#FDE68A" },
  "Harvested": { color: "#64748B", bg: "#F1F5F9" },
};

// ─── Public API ─────────────────────────────────────────────

/**
 * Calculate crop lifecycle from crop data.
 *
 * @param {object} crop - Must have: crop_name, planting_date. Optional: expected_harvest, expected_growing_days
 * @returns {object} Lifecycle result
 */
export function getCropLifecycle(crop) {
  if (!crop) return getEmptyResult();

  const plantingDate = crop.planting_date;
  if (!plantingDate) return getEmptyResult();

  // If manually marked as Harvested, return harvested state
  if (crop.status === "Harvested") {
    const ageDays = calculateAgeDays(plantingDate);
    return {
      ageDays,
      ageLabel: formatAge(ageDays),
      lifecycleStage: "Harvested",
      nextStage: null,
      nextTransitionDate: null,
      estimatedHarvestDate: crop.expected_harvest || null,
      daysRemaining: 0,
      progressPercent: 100,
      stageIndex: 7,
      totalStages: 8,
    };
  }

  const growingDays = getGrowingDays(crop);
  const ageDays = calculateAgeDays(plantingDate);
  const progressPercent = Math.min(100, Math.round((ageDays / growingDays) * 100));

  // Determine stage
  let currentStage = STAGES[STAGES.length - 1];
  let stageIndex = STAGES.length - 1;

  for (let i = 0; i < STAGES.length; i++) {
    if (progressPercent < STAGES[i].percentEnd) {
      currentStage = STAGES[i];
      stageIndex = i;
      break;
    }
  }

  // Next stage
  let nextStage = null;
  let nextTransitionDate = null;

  if (stageIndex < STAGES.length - 1) {
    nextStage = STAGES[stageIndex + 1].stage;
    const nextPercent = STAGES[stageIndex].percentEnd;
    const daysToNext = Math.max(0, Math.round((nextPercent / 100) * growingDays) - ageDays);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToNext);
    nextTransitionDate = nextDate.toISOString().split("T")[0];
  }

  // Estimated harvest
  const plantDate = new Date(plantingDate);
  const harvestDate = new Date(plantDate);
  harvestDate.setDate(harvestDate.getDate() + growingDays);
  const estimatedHarvestDate = crop.expected_harvest || harvestDate.toISOString().split("T")[0];

  const daysRemaining = Math.max(0, Math.ceil((new Date(estimatedHarvestDate) - new Date()) / 86400000));

  return {
    ageDays,
    ageLabel: formatAge(ageDays),
    lifecycleStage: currentStage.stage,
    nextStage,
    nextTransitionDate,
    estimatedHarvestDate,
    daysRemaining,
    progressPercent,
    stageIndex,
    totalStages: 8,
  };
}

/**
 * Get the expected growing period for a crop type.
 */
export function getGrowingDays(crop) {
  if (crop.expected_growing_days) return Number(crop.expected_growing_days);
  if (crop.expected_harvest && crop.planting_date) {
    const diff = Math.ceil((new Date(crop.expected_harvest) - new Date(crop.planting_date)) / 86400000);
    if (diff > 0) return diff;
  }
  const name = (crop.crop_name || crop.name || "").trim();
  // Try exact match first, then partial match
  if (GROWING_PERIODS[name]) return GROWING_PERIODS[name];
  const lower = name.toLowerCase();
  for (const [key, days] of Object.entries(GROWING_PERIODS)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase())) return days;
  }
  return DEFAULT_GROWING_DAYS;
}

/**
 * Get lifecycle distribution for a set of crops.
 */
export function getCropLifecycleDistribution(crops) {
  const dist = {};
  for (const crop of crops) {
    const { lifecycleStage } = getCropLifecycle(crop);
    const label = lifecycleStage || "Unknown";
    dist[label] = (dist[label] || 0) + 1;
  }
  return dist;
}

/**
 * Get crops transitioning to a new stage within N days.
 */
export function getUpcomingCropTransitions(crops, withinDays = 7) {
  const transitions = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 86400000);

  for (const crop of crops) {
    const lc = getCropLifecycle(crop);
    if (!lc.nextStage || !lc.nextTransitionDate) continue;

    const transDate = new Date(lc.nextTransitionDate);
    if (transDate <= cutoff) {
      transitions.push({
        crop,
        name: crop.crop_name || crop.name || "Unknown",
        field: crop.field_name || "",
        currentStage: lc.lifecycleStage,
        nextStage: lc.nextStage,
        transitionDate: lc.nextTransitionDate,
        daysUntil: Math.max(0, Math.ceil((transDate - now) / 86400000)),
      });
    }
  }

  transitions.sort((a, b) => a.daysUntil - b.daysUntil);
  return transitions;
}

/**
 * Get crops that are harvest-ready.
 */
export function getHarvestReadyCrops(crops) {
  return crops.filter((crop) => {
    const { lifecycleStage } = getCropLifecycle(crop);
    return lifecycleStage === "Harvest Ready";
  });
}

/**
 * Get the color config for a lifecycle stage.
 */
export function getCropStageColor(stage) {
  return STAGE_COLORS[stage] || { color: "#94A3B8", bg: "#F8FAFC" };
}

/**
 * Get all supported crop types with their growing periods.
 */
export function getSupportedCropTypes() {
  return Object.entries(GROWING_PERIODS).map(([name, days]) => ({ name, days }));
}

// ─── Helpers ────────────────────────────────────────────────

function calculateAgeDays(plantingDate) {
  const planted = new Date(plantingDate);
  const now = new Date();
  return Math.max(0, Math.floor((now - planted) / 86400000));
}

function formatAge(days) {
  if (days < 1) return "Just planted";
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""}`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""}`;
  return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
}

function getEmptyResult() {
  return {
    ageDays: null,
    ageLabel: "No planting date",
    lifecycleStage: null,
    nextStage: null,
    nextTransitionDate: null,
    estimatedHarvestDate: null,
    daysRemaining: null,
    progressPercent: 0,
    stageIndex: -1,
    totalStages: 8,
  };
}
