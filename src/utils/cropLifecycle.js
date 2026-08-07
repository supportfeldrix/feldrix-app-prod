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

// ─── Growing Periods (days) — South African Commercial Defaults ──

const GROWING_PERIODS = {
  // ── Grain & Oilseed Crops ─────────────────────────────────
  "Maize": 150,              // SA dryland maize: Oct plant → Mar harvest (140-160d)
  "Mielies": 150,            // Afrikaans alias
  "Wheat": 140,              // SA winter wheat: May plant → Nov harvest (130-150d)
  "Soybeans": 130,           // SA summer: Nov plant → Apr harvest (120-140d)
  "Soybean": 130,
  "Sunflower": 120,          // SA Free State/NW: Nov plant → Mar harvest (110-130d)
  "Sorghum": 130,            // SA dryland: Nov plant → Apr harvest (120-140d)
  "Canola": 150,             // SA Western Cape winter: Apr plant → Oct harvest (140-160d)
  "Barley": 120,             // SA Western Cape winter: May plant → Oct harvest (110-130d)
  "Groundnuts": 140,         // SA Limpopo/NW: Nov plant → Apr harvest (130-150d)
  "Groundnut": 140,
  "Dry Beans": 100,          // SA summer: Nov plant → Feb harvest (90-110d)
  "Beans": 100,
  "Bean": 100,
  "Cotton": 180,             // SA Limpopo: Oct plant → Apr harvest (170-190d)
  "Rice": 150,               // SA KZN irrigated: Oct plant → Mar harvest

  // ── Vegetables ────────────────────────────────────────────
  "Potatoes": 110,           // SA Limpopo/Sandveld: 100-120d depending on cultivar
  "Potato": 110,
  "Tomatoes": 100,           // SA open-field: transplant → harvest (90-110d)
  "Tomato": 100,
  "Onions": 150,             // SA long-day cultivars: Apr plant → Sep harvest (140-160d)
  "Onion": 150,
  "Cabbage": 90,             // SA all-year production (80-100d)
  "Carrots": 85,             // SA Ceres/Graaff-Reinet (75-95d)
  "Carrot": 85,
  "Lettuce": 55,             // SA intensive: 50-60d
  "Pumpkin": 110,            // SA summer: Nov plant → Feb harvest (100-120d)
  "Butternut": 100,          // SA summer (90-110d)
  "Spinach": 40,             // SA quick crop (35-45d)
  "Sweet Potato": 140,       // SA Limpopo: Oct plant → Mar harvest (130-150d)
  "Peppers": 90,             // SA open-field (80-100d)
  "Pepper": 90,
  "Beetroot": 70,            // SA (60-80d)
  "Peas": 75,                // SA winter: May plant → Aug harvest (65-85d)
  "Green Beans": 60,         // SA fresh market (55-65d)
  "Watermelon": 90,          // SA Limpopo summer (80-100d)

  // ── Pastures & Fodder ─────────────────────────────────────
  "Lucerne": 35,             // SA irrigated: cut every 28-42 days
  "Eragrostis": 120,         // SA hay crop: Oct plant → Feb first cut
  "Teff": 60,                // SA quick summer grass (50-70d per cut)

  // ── Perennial Crops (planting to first commercial harvest) ─
  "Sugarcane": 420,          // SA KZN: plant → first harvest 14-18 months (ratoon 12m)
  "Citrus": 1095,            // SA: 3 years to first commercial fruit
  "Grapes": 1095,            // SA Western Cape: 3 years to commercial harvest
  "Table Grapes": 1095,
  "Wine Grapes": 1095,
  "Avocados": 1460,          // SA Limpopo/Mpumalanga: 4 years to first fruit
  "Avocado": 1460,
  "Macadamias": 1825,        // SA: 5 years to first commercial harvest
  "Macadamia": 1825,
  "Mangoes": 1460,           // SA Limpopo: 4 years to first fruit
  "Mango": 1460,
  "Pecan Nuts": 2190,        // SA: 6 years to first commercial crop
  "Pecan": 2190,
  "Blueberries": 730,        // SA: 2 years to full production
  "Blueberry": 730,
  "Olives": 1460,            // SA: 4 years to first harvest
  "Olive": 1460,
  "Litchis": 1825,           // SA Limpopo: 5 years
  "Litchi": 1825,
  "Bananas": 365,            // SA KZN/Mpumalanga: 12 months plant → bunch
  "Banana": 365,
  "Pineapple": 540,          // SA KZN: 18 months to first fruit

  // ── Other ─────────────────────────────────────────────────
  "Tobacco": 120,            // SA Limpopo: Nov plant → Mar harvest
  "Hemp": 110,               // SA trial crops (100-120d)
  "Rooibos": 540,            // SA Cederberg: 18 months to first harvest
};

const DEFAULT_GROWING_DAYS = 130; // SA average for summer grain crops

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
