/**
 * FarmHand PRO — Breeding Analytics Engine
 * Sprint 43.3
 *
 * SINGLE SOURCE OF TRUTH for all Breeding statistics.
 *
 * ============================================================
 * METRIC DEFINITIONS
 * ============================================================
 *
 * breedingScore (0-100)
 *   Composite score based on pregnancy rate, birth success,
 *   record completeness, and monitoring activity.
 *
 * pregnantAnimals
 *   Records with status "Pregnant" or "Confirmed".
 *
 * expectedBirths
 *   Pregnant records with expected_birth within the next 30 days.
 *
 * readyForBreeding
 *   Records with status "Ready" or completed records from 60+ days ago.
 *
 * breedingSuccessRate
 *   Percentage of records that reached "Pregnant" or "Completed" status.
 *
 * birthsThisMonth
 *   Records with status "Completed" and a completion date this month.
 *
 * pregnancyChecksDue
 *   Pregnant records where breeding_date was 30+ days ago (time for check).
 *
 * ============================================================
 */

export function generateBreedingAnalytics({ breedingRecords = [] } = {}) {
  if (breedingRecords.length === 0) {
    return {
      available: false,
      breedingScore: 0,
      breedingStatus: "No Data",
      totalRecords: 0,
      pregnantAnimals: 0,
      expectedBirths: 0,
      readyForBreeding: 0,
      breedingSuccessRate: 0,
      birthsThisMonth: 0,
      pregnancyChecksDue: 0,
      overdueBirths: 0,
      insights: [],
      timeline: [],
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // ---------------------------------------------------------------
  const totalRecords = breedingRecords.length;

  // PREGNANT ANIMALS
  const pregnantRecords = breedingRecords.filter(
    (r) => r.status === "Pregnant" || r.status === "Confirmed"
  );
  const pregnantAnimals = pregnantRecords.length;

  // EXPECTED BIRTHS (within 30 days)
  const expectedBirthRecords = pregnantRecords.filter((r) => {
    if (!r.expected_birth) return false;
    const eb = new Date(r.expected_birth);
    eb.setHours(0, 0, 0, 0);
    return eb >= today && eb <= thirtyDaysFromNow;
  });
  const expectedBirths = expectedBirthRecords.length;

  // OVERDUE BIRTHS
  const overdueBirthRecords = pregnantRecords.filter((r) => {
    if (!r.expected_birth) return false;
    const eb = new Date(r.expected_birth);
    eb.setHours(0, 0, 0, 0);
    return eb < today;
  });
  const overdueBirths = overdueBirthRecords.length;

  // READY FOR BREEDING
  const readyRecords = breedingRecords.filter(
    (r) => r.status === "Ready" || r.status === "Heat Detected"
  );
  const readyForBreeding = readyRecords.length;

  // BREEDING SUCCESS RATE
  const successfulRecords = breedingRecords.filter(
    (r) => r.status === "Pregnant" || r.status === "Confirmed" || r.status === "Completed"
  );
  const breedingSuccessRate = totalRecords > 0
    ? Math.round((successfulRecords.length / totalRecords) * 100)
    : 0;

  // BIRTHS THIS MONTH
  const birthsThisMonth = breedingRecords.filter((r) => {
    if (r.status !== "Completed") return false;
    const d = new Date(r.birth_date || r.updated_at || r.breeding_date);
    return d >= monthStart;
  }).length;

  // PREGNANCY CHECKS DUE (pregnant for 30+ days, needs check)
  const pregnancyChecksDue = pregnantRecords.filter((r) => {
    if (r.pregnancy_check_date) return false; // already checked
    if (!r.breeding_date) return false;
    const bd = new Date(r.breeding_date);
    return bd <= thirtyDaysAgo;
  }).length;

  // SCORE
  const breedingScore = calculateScore({
    totalRecords,
    pregnantAnimals,
    overdueBirths,
    breedingSuccessRate,
    pregnancyChecksDue,
    readyForBreeding,
  });

  const breedingStatus = getStatus(breedingScore);

  // INSIGHTS
  const insights = generateInsights({
    pregnantAnimals,
    expectedBirths,
    expectedBirthRecords,
    overdueBirths,
    overdueBirthRecords,
    readyForBreeding,
    readyRecords,
    pregnancyChecksDue,
    breedingSuccessRate,
    birthsThisMonth,
  });

  // TIMELINE EVENTS
  const timeline = buildTimeline(breedingRecords, today, thirtyDaysFromNow);

  return {
    available: true,
    breedingScore,
    breedingStatus,
    totalRecords,
    pregnantAnimals,
    expectedBirths,
    readyForBreeding,
    breedingSuccessRate,
    birthsThisMonth,
    pregnancyChecksDue,
    overdueBirths,
    insights,
    timeline,
  };
}

function calculateScore({ totalRecords, pregnantAnimals, overdueBirths, breedingSuccessRate, pregnancyChecksDue, readyForBreeding }) {
  if (totalRecords === 0) return 0;

  let score = 50;

  // Success rate contribution (+20 max)
  score += Math.round((breedingSuccessRate / 100) * 20);

  // Active pregnancies (+10)
  if (pregnantAnimals > 0) score += 10;

  // Overdue births penalty (-10 per, capped at -25)
  score -= Math.min(overdueBirths * 10, 25);

  // Pregnancy checks overdue (-5 per, capped at -15)
  score -= Math.min(pregnancyChecksDue * 5, 15);

  // Ready for breeding (positive activity +5)
  if (readyForBreeding > 0) score += 5;

  // Records baseline
  if (totalRecords >= 5) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getStatus(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

function generateInsights({ pregnantAnimals, expectedBirths, expectedBirthRecords, overdueBirths, overdueBirthRecords, readyForBreeding, readyRecords, pregnancyChecksDue, breedingSuccessRate, birthsThisMonth }) {
  const insights = [];

  // Overdue births
  if (overdueBirths > 0) {
    const examples = overdueBirthRecords.slice(0, 3).map((r) => r.female?.tag || "Unknown");
    const remaining = overdueBirths - examples.length;
    let msg = `${overdueBirths} expected birth${overdueBirths === 1 ? " has" : "s have"} passed ${overdueBirths === 1 ? "its" : "their"} due date. Monitor these animals closely for signs of labour or complications.`;
    if (examples.length > 0) {
      msg += ` Animals: ${examples.join(", ")}`;
      if (remaining > 0) msg += ` + ${remaining} more`;
      msg += ".";
    }
    insights.push({ message: msg, severity: "high", type: "overdue_birth" });
  }

  // Expected births this week
  const birthsThisWeek = expectedBirthRecords.filter((r) => {
    const eb = new Date(r.expected_birth);
    const week = new Date();
    week.setDate(week.getDate() + 7);
    return eb <= week;
  });
  if (birthsThisWeek.length > 0) {
    insights.push({
      message: `${birthsThisWeek.length} birth${birthsThisWeek.length === 1 ? " is" : "s are"} expected within the next 7 days. Prepare calving facilities, increase monitoring frequency, and review birthing supplies to ensure a safe delivery.`,
      severity: "medium",
      type: "births_soon",
    });
  }

  // Pregnancy checks due
  if (pregnancyChecksDue > 0) {
    insights.push({
      message: `${pregnancyChecksDue} pregnancy check${pregnancyChecksDue === 1 ? " is" : "s are"} due. Schedule examinations to confirm healthy development and allow accurate birth planning.`,
      severity: "medium",
      type: "checks_due",
    });
  }

  // Ready for breeding
  if (readyForBreeding > 0) {
    const examples = readyRecords.slice(0, 3).map((r) => r.female?.tag || "Unknown");
    const remaining = readyForBreeding - examples.length;
    let msg = `${readyForBreeding} animal${readyForBreeding === 1 ? " is" : "s are"} ready for breeding. Timely breeding improves conception rates and calving intervals.`;
    if (examples.length > 0) {
      msg += ` Animals: ${examples.join(", ")}`;
      if (remaining > 0) msg += ` + ${remaining} more`;
      msg += ".";
    }
    insights.push({ message: msg, severity: "low", type: "ready_breeding" });
  }

  // Success rate feedback
  if (breedingSuccessRate >= 70) {
    insights.push({
      message: `Breeding success rate is ${breedingSuccessRate}%. The programme is performing well. Continue monitoring for optimal results.`,
      severity: "low",
      type: "success_rate",
    });
  } else if (breedingSuccessRate > 0 && breedingSuccessRate < 50) {
    insights.push({
      message: `Breeding success rate is ${breedingSuccessRate}%. Consider reviewing nutrition, timing, and sire selection to improve conception rates.`,
      severity: "medium",
      type: "low_success",
    });
  }

  // All good
  if (insights.length === 0) {
    insights.push({
      message: "The breeding programme is currently up to date. No immediate actions required.",
      severity: "low",
      type: "all_good",
    });
  }

  return insights;
}

function buildTimeline(records, today, thirtyDaysFromNow) {
  const events = [];

  for (const record of records) {
    if (!record.expected_birth) continue;
    if (record.status === "Completed") continue;

    const eb = new Date(record.expected_birth);
    eb.setHours(0, 0, 0, 0);

    if (eb > thirtyDaysFromNow) continue;

    const diffDays = Math.round((eb - today) / (1000 * 60 * 60 * 24));

    events.push({
      id: record.id,
      animalId: record.female_id || null,
      animalTag: record.female?.tag || "Unknown",
      animalBreed: record.female?.breed || "",
      eventType: diffDays < 0 ? "Overdue Birth" : "Expected Birth",
      date: record.expected_birth,
      diffDays,
    });
  }

  // Add pregnancy checks
  for (const record of records) {
    if (record.status !== "Pregnant" && record.status !== "Confirmed") continue;
    if (record.pregnancy_check_date) continue; // already checked
    if (!record.breeding_date) continue;

    const bd = new Date(record.breeding_date);
    const checkDate = new Date(bd);
    checkDate.setDate(checkDate.getDate() + 30);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate > thirtyDaysFromNow) continue;

    const diffDays = Math.round((checkDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) continue; // Only show checks due soon

    events.push({
      id: `check-${record.id}`,
      animalId: record.female_id || null,
      animalTag: record.female?.tag || "Unknown",
      animalBreed: record.female?.breed || "",
      eventType: "Pregnancy Check",
      date: checkDate.toISOString(),
      diffDays,
    });
  }

  events.sort((a, b) => a.diffDays - b.diffDays);

  return events;
}
