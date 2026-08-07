/**
 * ============================================================
 * Feldrix — Livestock Growth Lifecycle Engine
 * Version 1.0
 *
 * Automatically determines an animal's biological growth stage
 * from species, gender, and date of birth.
 *
 * Works completely offline — no network calls required.
 *
 * Usage:
 *   const result = getLifecycleStage(animal);
 *   // { stage, ageMonths, ageDays, ageLabel, nextStage, nextStageDate }
 * ============================================================
 */

// ─── Lifecycle Definitions ──────────────────────────────────

const CATTLE_STAGES = {
  female: [
    { stage: "Calf", maxMonths: 6 },
    { stage: "Weaner", maxMonths: 12 },
    { stage: "Heifer", maxMonths: 24 },
    { stage: "Cow", maxMonths: Infinity },
  ],
  male: [
    { stage: "Calf", maxMonths: 6 },
    { stage: "Weaner", maxMonths: 12 },
    { stage: "Young Bull", maxMonths: 24 },
    { stage: "Breeding Bull", maxMonths: Infinity },
  ],
};

const SHEEP_STAGES = {
  female: [
    { stage: "Lamb", maxMonths: 6 },
    { stage: "Weaner", maxMonths: 12 },
    { stage: "Ewe", maxMonths: Infinity },
  ],
  male: [
    { stage: "Lamb", maxMonths: 6 },
    { stage: "Weaner", maxMonths: 12 },
    { stage: "Ram", maxMonths: Infinity },
  ],
};

const GOAT_STAGES = {
  female: [
    { stage: "Kid", maxMonths: 6 },
    { stage: "Young Goat", maxMonths: 12 },
    { stage: "Doe", maxMonths: Infinity },
  ],
  male: [
    { stage: "Kid", maxMonths: 6 },
    { stage: "Young Goat", maxMonths: 12 },
    { stage: "Buck", maxMonths: Infinity },
  ],
};

const PIG_STAGES = {
  female: [
    { stage: "Piglet", maxMonths: 3 },
    { stage: "Weaner", maxMonths: 5 },
    { stage: "Grower", maxMonths: 8 },
    { stage: "Sow", maxMonths: Infinity },
  ],
  male: [
    { stage: "Piglet", maxMonths: 3 },
    { stage: "Weaner", maxMonths: 5 },
    { stage: "Grower", maxMonths: 8 },
    { stage: "Boar", maxMonths: Infinity },
  ],
};

// ─── Gender Classification ──────────────────────────────────

const FEMALE_GENDERS = ["Cow", "Heifer", "Ewe", "Doe", "Sow", "Hen", "Female", "female"];
const MALE_GENDERS = ["Bull", "Ram", "Buck", "Boar", "Rooster", "Male", "male", "Steer", "Ox"];

function classifyGender(gender) {
  if (!gender) return "female";
  if (FEMALE_GENDERS.includes(gender)) return "female";
  if (MALE_GENDERS.includes(gender)) return "male";
  return "female"; // default
}

// ─── Species → Stage Map ────────────────────────────────────

function getStagesForSpecies(animalType) {
  switch (animalType) {
    case "Cattle": return CATTLE_STAGES;
    case "Sheep": return SHEEP_STAGES;
    case "Goats": return GOAT_STAGES;
    case "Pigs": return PIG_STAGES;
    default: return CATTLE_STAGES; // fallback for unknown species
  }
}

// ─── Age Calculation ────────────────────────────────────────

function calculateAgeMonths(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  const dayDiff = now.getDate() - dob.getDate();
  return dayDiff < 0 ? Math.max(0, months - 1) : months;
}

function calculateAgeDays(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return Math.floor((now - dob) / (1000 * 60 * 60 * 24));
}

function formatAge(months) {
  if (months === null) return "Unknown";
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years}y ${remainingMonths}m`;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Calculate the lifecycle stage for an animal.
 *
 * @param {object} animal - Must have: animal_type, gender, date_of_birth (or dob)
 * @returns {object} { stage, ageMonths, ageDays, ageLabel, nextStage, nextStageDate, stageIndex, totalStages }
 */
export function getLifecycleStage(animal) {
  const dob = animal.date_of_birth || animal.dob;

  if (!dob) {
    return {
      stage: null,
      ageMonths: null,
      ageDays: null,
      ageLabel: "Birth date not set",
      nextStage: null,
      nextStageDate: null,
      stageIndex: -1,
      totalStages: 0,
    };
  }

  const animalType = animal.animal_type || "Cattle";
  const genderClass = classifyGender(animal.gender);
  const stagesMap = getStagesForSpecies(animalType);
  const stages = stagesMap[genderClass] || stagesMap.female;

  const ageMonths = calculateAgeMonths(dob);
  const ageDays = calculateAgeDays(dob);
  const ageLabel = formatAge(ageMonths);

  // Determine current stage
  let currentStage = stages[stages.length - 1].stage;
  let stageIndex = stages.length - 1;

  for (let i = 0; i < stages.length; i++) {
    if (ageMonths < stages[i].maxMonths) {
      currentStage = stages[i].stage;
      stageIndex = i;
      break;
    }
  }

  // Determine next stage
  let nextStage = null;
  let nextStageDate = null;

  if (stageIndex < stages.length - 1) {
    nextStage = stages[stageIndex + 1].stage;
    // Calculate when next stage begins (current stage maxMonths)
    const monthsUntilNext = stages[stageIndex].maxMonths - ageMonths;
    if (monthsUntilNext > 0) {
      const next = new Date();
      next.setMonth(next.getMonth() + monthsUntilNext);
      nextStageDate = next.toISOString().split("T")[0];
    }
  }

  return {
    stage: currentStage,
    ageMonths,
    ageDays,
    ageLabel,
    nextStage,
    nextStageDate,
    stageIndex,
    totalStages: stages.length,
  };
}

/**
 * Get all lifecycle stages for a given species/gender combination.
 */
export function getStagesFor(animalType, gender) {
  const stagesMap = getStagesForSpecies(animalType || "Cattle");
  const genderClass = classifyGender(gender);
  return stagesMap[genderClass] || stagesMap.female;
}

/**
 * Get lifecycle distribution for a set of animals.
 * Returns { stage: count } map.
 */
export function getLifecycleDistribution(animals) {
  const distribution = {};

  for (const animal of animals) {
    const { stage } = getLifecycleStage(animal);
    const label = stage || "Unknown";
    distribution[label] = (distribution[label] || 0) + 1;
  }

  return distribution;
}

/**
 * Get animals transitioning to a new stage within the next N days.
 */
export function getUpcomingTransitions(animals, withinDays = 7) {
  const transitions = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 86400000);

  for (const animal of animals) {
    const { nextStage, nextStageDate } = getLifecycleStage(animal);
    if (!nextStage || !nextStageDate) continue;

    const transitionDate = new Date(nextStageDate);
    if (transitionDate <= cutoff) {
      transitions.push({
        animal,
        tag: animal.tag || animal.name || "Unknown",
        currentStage: getLifecycleStage(animal).stage,
        nextStage,
        transitionDate: nextStageDate,
        daysUntil: Math.max(0, Math.ceil((transitionDate - now) / 86400000)),
      });
    }
  }

  transitions.sort((a, b) => a.daysUntil - b.daysUntil);
  return transitions;
}

// ─── Stage Colors (for badges) ──────────────────────────────

const STAGE_COLORS = {
  // Cattle
  "Calf": { color: "#F59E0B", bg: "#FEF3C7" },
  "Weaner": { color: "#F97316", bg: "#FFF7ED" },
  "Heifer": { color: "#8B5CF6", bg: "#EDE9FE" },
  "Cow": { color: "#16A34A", bg: "#DCFCE7" },
  "Young Bull": { color: "#3B82F6", bg: "#DBEAFE" },
  "Breeding Bull": { color: "#1D4ED8", bg: "#DBEAFE" },
  // Sheep
  "Lamb": { color: "#F59E0B", bg: "#FEF3C7" },
  "Ewe": { color: "#16A34A", bg: "#DCFCE7" },
  "Ram": { color: "#1D4ED8", bg: "#DBEAFE" },
  // Goats
  "Kid": { color: "#F59E0B", bg: "#FEF3C7" },
  "Young Goat": { color: "#F97316", bg: "#FFF7ED" },
  "Doe": { color: "#16A34A", bg: "#DCFCE7" },
  "Buck": { color: "#1D4ED8", bg: "#DBEAFE" },
  // Pigs
  "Piglet": { color: "#F59E0B", bg: "#FEF3C7" },
  "Grower": { color: "#F97316", bg: "#FFF7ED" },
  "Sow": { color: "#16A34A", bg: "#DCFCE7" },
  "Boar": { color: "#1D4ED8", bg: "#DBEAFE" },
  // Default
  "Unknown": { color: "#94A3B8", bg: "#F8FAFC" },
};

export function getStageColor(stage) {
  return STAGE_COLORS[stage] || STAGE_COLORS["Unknown"];
}
