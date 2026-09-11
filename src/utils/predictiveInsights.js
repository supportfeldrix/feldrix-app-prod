/**
 * FarmHand PRO — Predictive Intelligence Engine
 * Sprint 26
 *
 * Generates forward-looking predictions from farm data.
 * Structured as independent providers that can be extended.
 *
 * Each provider returns an array of prediction objects:
 * { priority, category, title, prediction, confidence, daysUntil, icon }
 *
 * The engine merges, deduplicates, sorts by urgency,
 * and returns a maximum of 5 predictions.
 */

const MAX_PREDICTIONS = 5;
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// =====================================================
// Providers
// =====================================================

/**
 * Machinery Predictions
 *
 * Estimates service timing using:
 * - Current hour meter
 * - Service interval (from maintenance plan)
 * - Average daily usage (calculated from service history)
 *
 * @param {object} params
 * @param {Array} params.machines - Machine records with hour_meter
 * @param {Array} params.maintenancePlans - Active maintenance plans
 * @param {Array} params.serviceHistory - Service records for daily usage estimation
 */
function generateMachineryPredictions({ machines = [], maintenancePlans = [], serviceHistory = [] } = {}) {
  const predictions = [];

  for (const plan of maintenancePlans) {
    const machine = machines.find((m) => m.id === plan.machine_id);
    if (!machine) continue;

    const currentHours = Number(machine.hour_meter || 0);
    const nextDue = Number(plan.next_due_hours || 0);
    const remaining = nextDue - currentHours;

    if (remaining <= 0) continue;

    // Estimate daily usage from service history
    const machineServices = serviceHistory
      .filter((s) => s.machine_id === machine.id)
      .sort((a, b) => new Date(b.service_date) - new Date(a.service_date));

    if (machineServices.length < 2) continue;

    const newest = machineServices[0];
    const oldest = machineServices[machineServices.length - 1];
    const daysBetween = Math.max(
      1,
      (new Date(newest.service_date) - new Date(oldest.service_date)) / (1000 * 60 * 60 * 24)
    );
    const hoursBetween = Math.max(1, Number(newest.hour_meter || 0) - Number(oldest.hour_meter || 0));
    const avgDailyHours = hoursBetween / daysBetween;

    if (avgDailyHours <= 0) continue;

    const daysUntilService = Math.round(remaining / avgDailyHours);
    const confidence = Math.min(95, Math.round(70 + (machineServices.length * 5)));

    if (daysUntilService <= 30) {
      predictions.push({
        priority: daysUntilService <= 7 ? "high" : "medium",
        category: "machinery",
        title: `${machine.name || "Machine"} Service Forecast`,
        prediction: `Estimated service required within ${daysUntilService} day${daysUntilService === 1 ? "" : "s"}.`,
        confidence,
        daysUntil: daysUntilService,
        icon: "🚜",
      });
    }
  }

  return predictions;
}

/**
 * Breeding Predictions
 *
 * Predicts calving preparation and expected births.
 *
 * @param {object} params
 * @param {Array} params.breedingRecords - Records with expected_birth and status
 */
function generateBreedingPredictions({ breedingRecords = [] } = {}) {
  const predictions = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const record of breedingRecords) {
    if (record.status !== "Pregnant" || !record.expected_birth) continue;

    const birthDate = new Date(record.expected_birth);
    birthDate.setHours(0, 0, 0, 0);

    const daysUntil = Math.round((birthDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0 || daysUntil > 60) continue;

    const animalTag = record.female?.tag || "Unknown";

    if (daysUntil <= 14) {
      predictions.push({
        priority: "high",
        category: "breeding",
        title: `Calving Preparation — ${animalTag}`,
        prediction: `Expected birth in ${daysUntil} day${daysUntil === 1 ? "" : "s"}. Prepare birth pen.`,
        confidence: 90,
        daysUntil,
        icon: "🍼",
      });
    } else {
      predictions.push({
        priority: "medium",
        category: "breeding",
        title: `Expected Birth — ${animalTag}`,
        prediction: `Birth expected in approximately ${daysUntil} days.`,
        confidence: 85,
        daysUntil,
        icon: "🐄",
      });
    }
  }

  return predictions;
}

/**
 * Crop Predictions
 *
 * Predicts harvest windows and planting reminders.
 *
 * @param {object} params
 * @param {Array} params.crops - Crop records with planting_date and harvest_date
 */
function generateCropPredictions({ crops = [] } = {}) {
  const predictions = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const crop of crops) {
    const name = crop.name || crop.crop_name || "Crop";

    // Harvest prediction.
    // BUGFIX: crops use `expected_harvest`, not `harvest_date`; skip Harvested.
    if (crop.status !== "Harvested" && crop.expected_harvest) {
      const harvestDate = new Date(crop.expected_harvest);
      harvestDate.setHours(0, 0, 0, 0);

      const daysUntil = Math.round((harvestDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil <= 21) {
        predictions.push({
          priority: daysUntil <= 7 ? "high" : "medium",
          category: "crops",
          title: `Harvest Window — ${name}`,
          prediction: `Harvest expected in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
          confidence: 92,
          daysUntil,
          icon: "🌾",
        });
      }
    }

    // Planting reminder (if planting_date is in the future)
    if (crop.planting_date) {
      const plantDate = new Date(crop.planting_date);
      plantDate.setHours(0, 0, 0, 0);

      const daysUntil = Math.round((plantDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil > 0 && daysUntil <= 14) {
        predictions.push({
          priority: "medium",
          category: "crops",
          title: `Planting Reminder — ${name}`,
          prediction: `Planned planting in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
          confidence: 95,
          daysUntil,
          icon: "🌱",
        });
      }
    }
  }

  return predictions;
}

/**
 * Planner Predictions
 *
 * Predicts upcoming workload based on scheduled tasks.
 *
 * @param {object} params
 * @param {number} params.upcomingCount - Number of tasks due within 7 days
 * @param {number} params.overdueCount - Number of overdue tasks
 */
function generatePlannerPredictions({ upcomingCount = 0, overdueCount = 0 } = {}) {
  const predictions = [];
  const totalWorkload = upcomingCount + overdueCount;

  if (totalWorkload >= 10) {
    predictions.push({
      priority: "high",
      category: "planner",
      title: "High Workload Forecast",
      prediction: `${totalWorkload} tasks scheduled or overdue. Consider delegating or rescheduling.`,
      confidence: 95,
      daysUntil: 0,
      icon: "📋",
    });
  } else if (totalWorkload >= 5) {
    predictions.push({
      priority: "medium",
      category: "planner",
      title: "Moderate Workload Ahead",
      prediction: `${totalWorkload} tasks expected this week. Plan your time accordingly.`,
      confidence: 90,
      daysUntil: 7,
      icon: "📋",
    });
  }

  return predictions;
}

/**
 * Finance Predictions
 *
 * Placeholder for future profitability forecasting.
 * Returns empty predictions until financial modelling is implemented.
 *
 * @param {object} params
 */
function generateFinancePredictions(/* params */) {
  return [];
}

// =====================================================
// Engine
// =====================================================

function sortByUrgency(predictions) {
  return predictions.sort((a, b) => {
    // Priority first
    const priorityDiff = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by days until (sooner = higher)
    return (a.daysUntil ?? 999) - (b.daysUntil ?? 999);
  });
}

function deduplicate(predictions) {
  const seen = new Set();
  return predictions.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

// =====================================================
// Public API
// =====================================================

/**
 * Generate predictive insights from farm data.
 *
 * @param {object} params
 * @param {object} params.machinery - { machines, maintenancePlans, serviceHistory }
 * @param {object} params.breeding - { breedingRecords }
 * @param {object} params.crops - { crops }
 * @param {object} params.planner - { upcomingCount, overdueCount }
 * @param {object} params.finance - Reserved for future use
 *
 * @returns {Array} Maximum 5 predictions sorted by urgency
 */
export function generatePredictiveInsights({
  machinery = {},
  breeding = {},
  crops = {},
  planner = {},
  finance = {},
} = {}) {
  const all = [
    ...generateMachineryPredictions(machinery),
    ...generateBreedingPredictions(breeding),
    ...generateCropPredictions(crops),
    ...generatePlannerPredictions(planner),
    ...generateFinancePredictions(finance),
  ];

  return sortByUrgency(deduplicate(all)).slice(0, MAX_PREDICTIONS);
}
