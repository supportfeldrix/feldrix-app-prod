import { getPlannerTasks } from "./plannerService";
import { getHealthRecords } from "./healthService";
import { getBreedingRecords } from "./breedingService";
import { getCrops } from "./cropService";
import { getFinanceRecords } from "./financeService";

/**
 * =====================================================
 * FarmHand PRO
 * Notification Service
 * Sprint 19.1
 * =====================================================
 *
 * Central notification engine.
 *
 * This service collects notifications from all modules
 * and prepares them for the Dashboard.
 *
 * Current Sources
 * ------------------------
 * ✅ Planner
 * ✅ Animal Health
 * ✅ Breeding
 * ✅ Crops
 * ✅ Finance
 *
 * =====================================================
 */

export async function getNotifications() {
  const [planner, healthRecords, breedingRecords, cropRecords, financeRecords] =
    await Promise.all([
      getPlannerTasks(),
      getHealthRecordsSafe(),
      getBreedingRecordsSafe(),
      getCropsSafe(),
      getFinanceRecordsSafe(),
    ]);

  // Planner summary
  const overdue = planner.overdue.length;

  const today = planner.today.length;

  const upcoming = planner.upcoming.filter((task) => {
    if (!task.originalDate) return false;

    const due = new Date(task.originalDate);
    const now = new Date();

    const diff =
      (due - now) /
      (1000 * 60 * 60 * 24);

    return diff <= 7;
  }).length;

  // Module counts
  const healthDue = countHealthDue(healthRecords);
  const birthsDue = countBreedingDue(breedingRecords);
  const cropTasks = countCropTasks(cropRecords);
  const financeDue = countFinanceDue(financeRecords);

  // Action Center
  const actionCenter = buildActionCenter(
    planner,
    healthRecords,
    breedingRecords,
    cropRecords,
    financeRecords
  );

  return {
    summary: {
      overdue,
      today,
      upcoming,
      total:
        overdue +
        today +
        upcoming,
    },

    planner,

    modules: {
      health: healthDue,
      breeding: birthsDue,
      crops: cropTasks,
      finance: financeDue,
    },

    actionCenter,
  };
}

// =====================================================
// Action Center Builder
// =====================================================

/**
 * Builds a prioritised list of up to 5 action items
 * from all modules. Priority order:
 * 1. Planner Overdue
 * 2. Planner Due Today
 * 3. Animal Health Due Today
 * 4. Breeding Due Within 7 Days
 * 5. Crop Tasks Due Within 7 Days
 * 6. Finance Due
 */
function buildActionCenter(planner, healthRecords, breedingRecords, cropRecords, financeRecords) {
  const items = [];

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(todayDate);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // 1. Planner Overdue (highest priority)
  for (const task of planner.overdue) {
    items.push({
      id: task.id,
      title: task.title,
      module: task.module || "General",
      priority: task.priority || "High",
      due_date: task.originalDate || null,
      source: "planner",
    });
  }

  // 2. Planner Due Today
  for (const task of planner.today) {
    items.push({
      id: task.id,
      title: task.title,
      module: task.module || "General",
      priority: task.priority || "Medium",
      due_date: task.originalDate || null,
      source: "planner",
    });
  }

  // 3. Animal Health Due Today
  for (const record of healthRecords) {
    if (!record.next_due) continue;
    const dueDate = new Date(record.next_due);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate > todayDate) continue;

    items.push({
      id: record.id,
      title: record.treatment_type || record.treatment || "Health Treatment",
      module: "Animal Health",
      priority: "High",
      due_date: record.next_due,
      source: "health",
    });
  }

  // 4. Breeding Due Within 7 Days
  for (const record of breedingRecords) {
    if (record.status !== "Pregnant") continue;
    if (!record.expected_birth) continue;

    const birthDate = new Date(record.expected_birth);
    birthDate.setHours(0, 0, 0, 0);
    if (birthDate < todayDate || birthDate > sevenDaysLater) continue;

    items.push({
      id: record.id,
      title: `Expected Birth - ${record.female?.tag || "Unknown"}`,
      module: "Breeding",
      priority: "High",
      due_date: record.expected_birth,
      source: "breeding",
    });
  }

  // 5. Crop Tasks Due Within 7 Days
  for (const crop of cropRecords) {
    // BUGFIX: crops use `expected_harvest`, not `harvest_date` (no such column).
    if (crop.status === "Harvested" || !crop.expected_harvest) continue;

    const harvestDate = new Date(crop.expected_harvest);
    harvestDate.setHours(0, 0, 0, 0);
    if (harvestDate < todayDate || harvestDate > sevenDaysLater) continue;

    items.push({
      id: crop.id,
      title: crop.crop_name || crop.name || "Crop Harvest",
      module: "Crops",
      priority: "Medium",
      due_date: crop.expected_harvest,
      source: "crops",
    });
  }

  // 6. Finance Due (lowest priority)
  for (const record of financeRecords) {
    if (!record.due_date) continue;

    const dueDate = new Date(record.due_date);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate > todayDate) continue;

    items.push({
      id: record.id,
      title: record.description || record.category || "Finance Payment",
      module: "Finance",
      priority: "Medium",
      due_date: record.due_date,
      source: "finance",
    });
  }

  // Return top 5 (already in priority order)
  return items.slice(0, 5);
}

// =====================================================
// Safe data loaders (never throw)
// =====================================================

async function getHealthRecordsSafe() {
  try {
    return await getHealthRecords();
  } catch {
    return [];
  }
}

async function getBreedingRecordsSafe() {
  try {
    return await getBreedingRecords();
  } catch {
    return [];
  }
}

async function getCropsSafe() {
  try {
    return await getCrops();
  } catch {
    return [];
  }
}

async function getFinanceRecordsSafe() {
  try {
    return await getFinanceRecords();
  } catch {
    return [];
  }
}

// =====================================================
// Module count helpers (reuse loaded data)
// =====================================================

function countHealthDue(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (records || []).filter((record) => {
    if (!record.next_due) return false;
    const dueDate = new Date(record.next_due);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  }).length;
}

function countBreedingDue(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  return (records || []).filter((record) => {
    if (record.status !== "Pregnant") return false;
    if (!record.expected_birth) return false;

    const birthDate = new Date(record.expected_birth);
    birthDate.setHours(0, 0, 0, 0);

    return birthDate >= today && birthDate <= sevenDaysLater;
  }).length;
}

function countCropTasks(crops) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  return (crops || []).filter((crop) => {
    // BUGFIX: crops use `expected_harvest`, not `harvest_date`.
    if (crop.status === "Harvested" || !crop.expected_harvest) return false;

    const harvestDate = new Date(crop.expected_harvest);
    harvestDate.setHours(0, 0, 0, 0);

    return harvestDate >= today && harvestDate <= sevenDaysLater;
  }).length;
}

function countFinanceDue(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (records || []).filter((record) => {
    if (!record.due_date) return false;

    const dueDate = new Date(record.due_date);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate <= today;
  }).length;
}
