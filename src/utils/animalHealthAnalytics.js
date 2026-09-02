/**
 * FarmHand PRO — Animal Health Analytics Engine
 * Sprint 43.2.1 — Final Polish
 *
 * SINGLE SOURCE OF TRUTH for all Animal Health statistics.
 * Reuses patterns from livestockAnalytics.js.
 *
 * ============================================================
 * METRIC DEFINITIONS
 * ============================================================
 *
 * healthScore (0-100)
 *   Composite score based on:
 *   • Vaccination coverage (animals with recent vaccinations)
 *   • Treatment completion (no overdue follow-ups)
 *   • Record freshness (recent health activity)
 *   • Outstanding alerts (overdue items penalty)
 *   • Recent health activity
 *
 * animalsUpToDate
 *   Unique animals with at least one health record in the last 60 days
 *   AND no overdue follow-ups (next_due not past).
 *   Note: This represents "health record compliance" not overall animal health.
 *
 * activeTreatments
 *   Health records created in the last 14 days with type Treatment/Medication.
 *
 * vaccinationsDue
 *   Records where next_due is within the next 7 days (vaccination type).
 *
 * overdueTreatments
 *   Records where next_due is in the past (any type).
 *
 * followUpsDue
 *   Records where next_due is within the next 14 days (non-vaccination).
 *
 * diseaseCases
 *   Records with treatment_type "Disease" or "Illness" in last 30 days.
 *
 * ============================================================
 */

/**
 * @param {object} params
 * @param {Array} params.healthRecords - animal_health records (with livestock join)
 * @param {Array} params.animals - livestock records (for total animal count)
 * @returns {object} Unified analytics object
 */
export function generateAnimalHealthAnalytics({
  healthRecords = [],
  animals = [],
} = {}) {
  if (healthRecords.length === 0 && animals.length === 0) {
    return {
      available: false,
      healthScore: 0,
      healthStatus: "No Data",
      totalRecords: 0,
      animalsUpToDate: 0,
      activeTreatments: 0,
      vaccinationsDue: 0,
      overdueTreatments: 0,
      followUpsDue: 0,
      diseaseCases: 0,
      insights: [],
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const fourteenDaysFromNow = new Date(today);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // ---------------------------------------------------------------
  // TOTAL RECORDS
  // ---------------------------------------------------------------
  const totalRecords = healthRecords.length;

  // ---------------------------------------------------------------
  // OVERDUE TREATMENTS (next_due is in the past)
  // ---------------------------------------------------------------
  const overdueRecords = healthRecords.filter((r) => {
    if (!r.next_due) return false;
    // Completed treatments are never overdue (next_due is preserved).
    if (r.completed_at) return false;
    const due = new Date(r.next_due);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });
  const overdueTreatments = overdueRecords.length;

  // ---------------------------------------------------------------
  // VACCINATIONS DUE (next_due within 7 days, vaccination type)
  // ---------------------------------------------------------------
  const vaccinationsDue = healthRecords.filter((r) => {
    if (!r.next_due) return false;
    if (r.completed_at) return false;
    if (r.treatment_type !== "Vaccination") return false;
    const due = new Date(r.next_due);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= sevenDaysFromNow;
  }).length;

  // ---------------------------------------------------------------
  // FOLLOW-UPS DUE (next_due within 14 days, non-vaccination)
  // ---------------------------------------------------------------
  const followUpsDue = healthRecords.filter((r) => {
    if (!r.next_due) return false;
    if (r.completed_at) return false;
    if (r.treatment_type === "Vaccination") return false;
    const due = new Date(r.next_due);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= fourteenDaysFromNow;
  }).length;

  // ---------------------------------------------------------------
  // ACTIVE TREATMENTS (last 14 days, Treatment/Medication type)
  // ---------------------------------------------------------------
  const activeTreatments = healthRecords.filter((r) => {
    const d = new Date(r.treatment_date || r.created_at);
    return d >= fourteenDaysAgo && (
      r.treatment_type === "Treatment" ||
      r.treatment_type === "Medication"
    );
  }).length;

  // ---------------------------------------------------------------
  // DISEASE CASES (last 30 days)
  // ---------------------------------------------------------------
  const diseaseCases = healthRecords.filter((r) => {
    const d = new Date(r.treatment_date || r.created_at);
    return d >= thirtyDaysAgo && (
      r.treatment_type === "Disease" ||
      r.treatment_type === "Illness"
    );
  }).length;

  // ---------------------------------------------------------------
  // ANIMALS UP TO DATE
  // Animals with a record in last 60 days AND no overdue items
  // ---------------------------------------------------------------
  const overdueAnimalIds = new Set(overdueRecords.map((r) => r.animal_id));
  const animalsWithRecentRecord = new Set(
    healthRecords
      .filter((r) => new Date(r.treatment_date || r.created_at) >= sixtyDaysAgo)
      .map((r) => r.animal_id)
  );
  const animalsUpToDate = [...animalsWithRecentRecord].filter(
    (id) => !overdueAnimalIds.has(id)
  ).length;

  // ---------------------------------------------------------------
  // HEALTH SCORE
  // ---------------------------------------------------------------
  const totalAnimals = animals.length || animalsWithRecentRecord.size || 1;
  const healthScore = calculateScore({
    totalAnimals,
    animalsUpToDate,
    overdueTreatments,
    activeTreatments,
    vaccinationsDue,
    totalRecords,
  });

  const healthStatus = getStatus(healthScore);

  // ---------------------------------------------------------------
  // AI INSIGHTS
  // ---------------------------------------------------------------
  const insights = generateInsights({
    healthRecords,
    overdueRecords,
    vaccinationsDue,
    followUpsDue,
    diseaseCases,
    activeTreatments,
    animalsUpToDate,
    totalAnimals,
    animalsWithRecentRecord,
  });

  return {
    available: true,
    healthScore,
    healthStatus,
    totalRecords,
    animalsUpToDate,
    activeTreatments,
    vaccinationsDue,
    overdueTreatments,
    followUpsDue,
    diseaseCases,
    insights,
  };
}

// ============================================================
// SCORE CALCULATION
// ============================================================

function calculateScore({ totalAnimals, animalsUpToDate, overdueTreatments, activeTreatments, vaccinationsDue, totalRecords }) {
  let score = 50;

  // Health record coverage (+20 max)
  const coverageRate = totalAnimals > 0 ? animalsUpToDate / totalAnimals : 0;
  score += Math.round(coverageRate * 20);

  // Has records at all (+10)
  if (totalRecords > 0) score += 10;

  // Active treatments being tracked (+5)
  if (activeTreatments > 0) score += 5;

  // Overdue penalty (-8 per overdue, capped at -30)
  score -= Math.min(overdueTreatments * 8, 30);

  // Vaccinations due soon (mild penalty -3 per)
  score -= Math.min(vaccinationsDue * 3, 10);

  // Comprehensive records bonus
  if (totalRecords >= 10) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getStatus(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

// ============================================================
// INSIGHT GENERATION
// ============================================================

function generateInsights({
  healthRecords,
  overdueRecords,
  vaccinationsDue,
  followUpsDue,
  diseaseCases,
  activeTreatments,
  animalsUpToDate,
  totalAnimals,
  animalsWithRecentRecord,
}) {
  const insights = [];

  // Overdue treatments
  if (overdueRecords.length > 0) {
    const uniqueAnimals = [...new Set(overdueRecords.map((r) => r.livestock?.tag).filter(Boolean))];
    const examples = uniqueAnimals.slice(0, 3);
    const remaining = uniqueAnimals.length - examples.length;
    let msg = `${overdueRecords.length} scheduled treatment${overdueRecords.length === 1 ? " has" : "s have"} passed ${overdueRecords.length === 1 ? "its" : "their"} due date. Completing overdue treatments on time prevents disease spread and maintains herd immunity.`;
    if (examples.length > 0) {
      msg += ` Animals affected: ${examples.join(", ")}`;
      if (remaining > 0) msg += ` + ${remaining} more`;
      msg += ".";
    }
    insights.push({ message: msg, severity: "high", type: "overdue" });
  }

  // Vaccinations due this week
  if (vaccinationsDue > 0) {
    insights.push({
      message: `${vaccinationsDue} vaccination${vaccinationsDue === 1 ? " is" : "s are"} scheduled for this week. Administering vaccinations on schedule ensures consistent herd protection and avoids coverage gaps.`,
      severity: "medium",
      type: "vaccinations_due",
    });
  }

  // Follow-ups due
  if (followUpsDue > 0) {
    insights.push({
      message: `${followUpsDue} follow-up treatment${followUpsDue === 1 ? " is" : "s are"} due within the next 2 weeks. Completing follow-ups on time ensures treatment effectiveness and prevents relapse.`,
      severity: "medium",
      type: "followups_due",
    });
  }

  // Active disease cases
  if (diseaseCases > 0) {
    insights.push({
      message: `${diseaseCases} disease case${diseaseCases === 1 ? " has" : "s have"} been recorded in the last 30 days. Continue monitoring affected animals closely and maintain isolation protocols where necessary.`,
      severity: "high",
      type: "disease_cases",
    });
  }

  // Animals without recent health records
  const animalsWithoutRecent = totalAnimals - animalsWithRecentRecord.size;
  if (animalsWithoutRecent > 0 && totalAnimals > 0 && animalsWithoutRecent / totalAnimals > 0.3) {
    insights.push({
      message: `${animalsWithoutRecent} animal${animalsWithoutRecent === 1 ? " has" : "s have"} not received a recorded health check during the last 60 days. Regular health monitoring improves early disease detection and treatment planning.`,
      severity: "low",
      type: "no_recent_records",
    });
  }

  // Active treatments (informational)
  if (activeTreatments > 0 && insights.length < 4) {
    insights.push({
      message: `${activeTreatments} treatment${activeTreatments === 1 ? " is" : "s are"} currently active. Monitor recovery progress and ensure medication schedules are followed consistently.`,
      severity: "low",
      type: "active_treatments",
    });
  }

  // All good
  if (insights.length === 0) {
    insights.push({
      message: "All animal health records are up to date. No immediate health actions are required today.",
      severity: "low",
      type: "all_good",
    });
  }

  return insights;
}
