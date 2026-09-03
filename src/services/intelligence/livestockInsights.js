/**
 * FarmHand PRO — Intelligence Engine
 * Livestock Insights Provider
 *
 * Generates actionable insights from livestock, health, breeding, and weight data.
 * Covers overdue treatments, upcoming births, weight monitoring gaps, and herd status.
 *
 * Expected data shape:
 * {
 *   livestock: {
 *     animals: [],         // Array of animal objects with tag, name, id
 *     healthRecords: [],   // Array of health records with next_due, livestock.tag
 *     breedingRecords: [], // Array of breeding records with expected_birth, status, female.tag
 *     weightRecords: []    // Array of weight records with animal_id, date/created_at
 *   }
 * }
 *
 * @param {object} data - Farm data context
 * @returns {Array} Array of insight objects
 */
export function generateLivestockInsights(data = {}) {
  try {
    const livestock = data.livestock || {};
    const animals = Array.isArray(livestock.animals) ? livestock.animals : [];
    const healthRecords = Array.isArray(livestock.healthRecords) ? livestock.healthRecords : [];
    const breedingRecords = Array.isArray(livestock.breedingRecords) ? livestock.breedingRecords : [];
    const weightRecords = Array.isArray(livestock.weightRecords) ? livestock.weightRecords : [];

    const insights = [];

    if (animals.length === 0) {
      insights.push(buildNoLivestockInsight());
      return insights;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Overdue treatments — Critical
    if (healthRecords.length > 0) {
      const overdue = getOverdueTreatments(healthRecords, today);
      if (overdue.length > 0) {
        insights.push(buildOverdueTreatmentInsight(overdue));
      }
    }

    // Pregnancies due within 30 days — High
    if (breedingRecords.length > 0) {
      const dueSoon = getUpcomingBirths(breedingRecords, today);
      if (dueSoon.length > 0) {
        insights.push(buildUpcomingBirthInsight(dueSoon));
      }
    }

    // Animals without weight for 90+ days — Medium
    if (weightRecords.length > 0) {
      const stale = getAnimalsWithStaleWeights(animals, weightRecords, today);
      if (stale.length > 0) {
        insights.push(buildStaleWeightInsight(stale));
      }
    }

    return insights;
  } catch {
    return [];
  }
}

// =====================================================
// Helpers
// =====================================================

/**
 * Returns health records where next_due is in the past.
 */
function getOverdueTreatments(healthRecords, today) {
  return healthRecords.filter((record) => {
    // Completed treatments are never overdue. next_due is preserved for
    // history/audit, so completion must be determined by completed_at.
    if (record.completed_at) return false;
    if (!record.next_due) return false;
    const dueDate = new Date(record.next_due);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
}

/**
 * Returns pregnant breeding records with expected_birth within 30 days.
 */
function getUpcomingBirths(breedingRecords, today) {
  const thirtyDays = new Date(today);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  return breedingRecords.filter((record) => {
    if (record.status !== "Pregnant") return false;
    if (!record.expected_birth) return false;
    const birthDate = new Date(record.expected_birth);
    birthDate.setHours(0, 0, 0, 0);
    return birthDate >= today && birthDate <= thirtyDays;
  });
}

/**
 * Returns animals whose most recent weight entry is older than 90 days.
 */
function getAnimalsWithStaleWeights(animals, weightRecords, today) {
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Find latest weight date per animal
  const latestWeight = {};
  for (const record of weightRecords) {
    const animalId = record.animal_id || record.livestock_id;
    if (!animalId) continue;
    const dateStr = record.date || record.created_at;
    if (!dateStr) continue;
    const recordDate = new Date(dateStr);
    if (!latestWeight[animalId] || recordDate > latestWeight[animalId]) {
      latestWeight[animalId] = recordDate;
    }
  }

  return animals.filter((animal) => {
    const lastDate = latestWeight[animal.id];
    if (!lastDate) return true; // Never weighed
    return lastDate < ninetyDaysAgo;
  });
}

/**
 * Builds the overdue treatment insight.
 */
function buildOverdueTreatmentInsight(overdue) {
  const count = overdue.length;
  const names = overdue
    .slice(0, 3)
    .map((r) => r.livestock?.tag || r.animal_tag || "Unknown")
    .join(", ");

  return {
    id: "livestock-overdue-treatment",
    priority: "Critical",
    category: "Livestock",
    title: `${count} Overdue Treatment${count === 1 ? "" : "s"}`,
    description: `${names}${count > 3 ? ` and ${count - 3} more` : ""} ha${count === 1 ? "s" : "ve"} overdue health treatments. Timely vaccinations protect herd health.`,
    action: "Review treatments",
    route: "/health",
    source: "Livestock",
  };
}

/**
 * Builds the upcoming births insight.
 */
function buildUpcomingBirthInsight(dueSoon) {
  const count = dueSoon.length;
  const names = dueSoon
    .slice(0, 3)
    .map((r) => r.female?.tag || "Unknown")
    .join(", ");

  return {
    id: "livestock-upcoming-births",
    priority: "High",
    category: "Livestock",
    title: `${count} Birth${count === 1 ? "" : "s"} Expected Soon`,
    description: `${names}${count > 3 ? ` and ${count - 3} more` : ""} ${count === 1 ? "is" : "are"} expected to give birth within 30 days. Prepare birth pens and monitor closely.`,
    action: "View breeding",
    route: "/breeding",
    source: "Livestock",
  };
}

/**
 * Builds the stale weight insight.
 */
function buildStaleWeightInsight(stale) {
  const count = stale.length;
  const names = stale
    .slice(0, 3)
    .map((a) => a.tag || a.name || "Unknown")
    .join(", ");

  return {
    id: "livestock-stale-weights",
    priority: "Medium",
    category: "Livestock",
    title: `${count} Animal${count === 1 ? "" : "s"} Need Weighing`,
    description: `${names}${count > 3 ? ` and ${count - 3} more` : ""} ha${count === 1 ? "s" : "ve"} not been weighed in over 90 days. Regular weighing helps track growth and detect health issues early.`,
    action: "Record weights",
    route: "/livestock",
    source: "Livestock",
  };
}

/**
 * Builds the informational insight when no livestock exists.
 */
function buildNoLivestockInsight() {
  return {
    id: "livestock-none",
    priority: "Low",
    category: "Livestock",
    title: "No Livestock Registered",
    description: "No animals have been added yet. Register your herd to enable health tracking, breeding management, and weight monitoring.",
    action: "Add animal",
    route: "/livestock",
    source: "Livestock",
  };
}
