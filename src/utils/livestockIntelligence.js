/**
 * ============================================================
 * Feldrix — Livestock Intelligence (USA-6, shared ANALYSIS engine)
 *
 * Region-NEUTRAL analysis shared by ALL farms (US, SA, future EU). It computes:
 *   - per-animal weight TREND (increasing/stable/declining/insufficient) + days
 *     since last weight, from weight_history (canonical kg)
 *   - per-animal RECORD COMPLETENESS (Good / Needs attention / Incomplete),
 *     using the species profile so young/flock animals aren't punished unfairly
 *
 * SAFETY
 *   - No disease diagnosis, no medication, no vaccine schedules, no dosages.
 *   - Weight is CANONICAL kg internally; this module emits NO unit strings — the
 *     presentation layer localizes via units.formatMass. Trend uses relative %
 *     change, so it is unit-agnostic.
 *   - Never fabricates a trend: <2 datapoints → "insufficient".
 * ============================================================
 */

import { getLivestockProfile } from "../constants/usLivestockProfiles";

const STALE_WEIGHT_DAYS_DEFAULT = 120; // gentle "consider re-weighing" horizon
// Relative change bands for trend (unit-agnostic; canonical kg either way).
const TREND_STABLE_PCT = 3; // within ±3% of first reading → stable

function daysBetween(fromIso, now) {
  if (!fromIso) return null;
  const d = new Date(fromIso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((now - d) / 86400000));
}

/**
 * Weight trend for one animal from its weight_history rows (canonical kg).
 * @param {Array} records - weight_history rows (weight, recorded_at/created_at)
 * @param {Date} now
 * @returns {object} { trend, changePct, latestKg, previousKg, daysSinceLast, count }
 *   trend ∈ "increasing" | "declining" | "stable" | "insufficient"
 */
export function getWeightTrend(records, now = new Date()) {
  const rows = (Array.isArray(records) ? records : [])
    .map((r) => ({ w: Number(r.weight), t: new Date(r.recorded_at || r.created_at || r.date) }))
    .filter((r) => Number.isFinite(r.w) && r.w > 0 && !Number.isNaN(r.t.getTime()))
    .sort((a, b) => a.t - b.t); // oldest → newest

  if (rows.length < 2) {
    return {
      trend: "insufficient",
      changePct: null,
      latestKg: rows[0]?.w ?? null,
      previousKg: null,
      daysSinceLast: rows[0] ? daysBetween(rows[0].t.toISOString(), now) : null,
      count: rows.length,
    };
  }

  const first = rows[0].w;
  const latest = rows[rows.length - 1].w;
  const previous = rows[rows.length - 2].w;
  const changePct = first > 0 ? Math.round(((latest - first) / first) * 1000) / 10 : 0;

  let trend;
  if (Math.abs(changePct) <= TREND_STABLE_PCT) trend = "stable";
  else if (changePct > 0) trend = "increasing";
  else trend = "declining";

  return {
    trend,
    changePct,
    latestKg: latest,
    previousKg: previous,
    daysSinceLast: daysBetween(rows[rows.length - 1].t.toISOString(), now),
    count: rows.length,
  };
}

/**
 * Record completeness for one animal (DATA QUALITY — never a health claim).
 * Uses the species profile so poultry/flock animals aren't expected to have an
 * individual birth date, and young animals aren't unfairly penalised.
 *
 * @param {object} animal - livestock row
 * @param {object} opts - { hasHealthRecord, hasWeight, hasBreedingRecord, farmCtx }
 * @returns {object} { status, missing[], score }  status ∈ "good"|"needs_attention"|"incomplete"
 */
export function getRecordCompleteness(animal, opts = {}) {
  const { hasHealthRecord = false, hasWeight = false, hasBreedingRecord = false, farmCtx = null } = opts;
  const profile = getLivestockProfile(animal?.animal_type, farmCtx);
  const missing = [];

  // Core identification is always expected.
  if (!animal?.tag) missing.push("identifier (tag)");
  if (!animal?.breed) missing.push("breed");
  if (profile.expectsBirthDate && !(animal?.date_of_birth || animal?.dob)) missing.push("birth date");
  if (!animal?.gender) missing.push("sex");

  // Weight & health are "recency" expectations, not identity.
  if (!hasWeight && !(Number(animal?.weight) > 0)) missing.push("weight observation");
  if (!hasHealthRecord) missing.push("health record");

  // Breeding only expected for breeding-applicable species AND likely-adult
  // females; we do NOT flag missing breeding for young animals or non-breeding
  // species/males (avoids unfair penalties).
  // (Left to the caller to pass hasBreedingRecord; not counted as "missing" here
  //  unless clearly a breeding female — kept conservative in USA-6.)

  // Fair-to-young: a very recently created animal with only identity gaps is
  // "needs_attention" at worst, not "incomplete".
  const identityGaps = missing.filter((m) => ["identifier (tag)", "breed", "birth date", "sex"].includes(m)).length;
  const recencyGaps = missing.length - identityGaps;

  let status;
  if (missing.length === 0) status = "good";
  else if (identityGaps >= 2) status = "incomplete";
  else status = "needs_attention";

  const score = Math.max(0, 100 - identityGaps * 25 - recencyGaps * 10);
  return { status, missing, score, species: profile.species, region: profile.region };
}

/**
 * Herd-level summary of weight trends + record completeness. Region-neutral.
 * Returns counts + small example lists (tags) — NO unit strings.
 *
 * @param {object} params
 * @param {Array} params.animals
 * @param {Array} params.weightRecords - all weight_history rows
 * @param {Array} params.healthRecords
 * @param {Array} params.breedingRecords
 * @param {object} params.farmCtx
 * @param {Date}   params.now
 */
export function summarizeHerdIntelligence({ animals = [], weightRecords = [], healthRecords = [], breedingRecords = [], farmCtx = null, now = new Date() } = {}) {
  const byAnimalWeights = {};
  for (const r of weightRecords) {
    const id = r.animal_id || r.livestock_id;
    if (!id) continue;
    (byAnimalWeights[id] ||= []).push(r);
  }
  const healthByAnimal = new Set(healthRecords.map((r) => r.animal_id));
  const breedingByAnimal = new Set(
    breedingRecords.flatMap((r) => [r.female_id, r.male_id]).filter(Boolean)
  );

  const declining = [];
  const staleWeights = [];
  const incomplete = [];

  for (const a of animals) {
    if (a.status === "Sold" || a.status === "Deceased" || a.status === "Slaughtered" || a.status === "Archived") continue;

    const profile = getLivestockProfile(a.animal_type, farmCtx);

    // Weight intelligence only where individual-animal weight is meaningful.
    // Hive/flock species (bee, poultry-type) set weightApplies=false and are
    // never forced into a weight-driven model. Unknown "Other" species keep
    // weightApplies=true but only surface a trend when a record actually exists
    // (getWeightTrend returns "insufficient" with <2 points → no false signal).
    if (profile.weightApplies !== false) {
      const wt = getWeightTrend(byAnimalWeights[a.id] || [], now);
      if (wt.trend === "declining") declining.push(a.tag || "Unknown");
      const staleDays = profile.weightObservationDays ?? STALE_WEIGHT_DAYS_DEFAULT;
      if (staleDays != null && wt.daysSinceLast != null && wt.daysSinceLast > staleDays) {
        staleWeights.push(a.tag || "Unknown");
      }
    }

    const rc = getRecordCompleteness(a, {
      hasHealthRecord: healthByAnimal.has(a.id),
      hasWeight: !!(byAnimalWeights[a.id]?.length) || Number(a.weight) > 0,
      hasBreedingRecord: breedingByAnimal.has(a.id),
      farmCtx,
    });
    if (rc.status === "incomplete") incomplete.push(a.tag || "Unknown");
  }

  return {
    decliningWeightCount: declining.length,
    decliningExamples: declining.slice(0, 3),
    staleWeightCount: staleWeights.length,
    staleExamples: staleWeights.slice(0, 3),
    incompleteRecordCount: incomplete.length,
    incompleteExamples: incomplete.slice(0, 3),
  };
}

/**
 * Build concise Farm-Intelligence insight objects from the herd summary, for
 * the global engine. Region-neutral (US + SA). Deliberately limited (≤2) to
 * avoid dashboard flooding; NO diagnosis, NO medication, unit-free text.
 * Shape matches other providers: { id, priority, category, title, description,
 * action, route, source }.
 */
export function buildLivestockIntelligenceInsights(summary) {
  const out = [];
  if (!summary) return out;

  if (summary.decliningWeightCount > 0) {
    const ex = summary.decliningExamples.join(", ");
    out.push({
      id: "livestock-weight-declining",
      priority: "Medium",
      category: "Livestock",
      title: `${summary.decliningWeightCount} animal${summary.decliningWeightCount === 1 ? "" : "s"} with a declining weight trend`,
      description: `${ex}${summary.decliningWeightCount > 3 ? " and others" : ""} show a declining weight trend across recorded observations. Review management; consult your veterinarian if a health concern is suspected.`,
      action: "Review weights",
      route: "/livestock",
      source: "Livestock",
    });
  }

  if (summary.incompleteRecordCount > 0) {
    const ex = summary.incompleteExamples.join(", ");
    out.push({
      id: "livestock-records-incomplete",
      priority: "Low",
      category: "Livestock",
      title: `${summary.incompleteRecordCount} animal${summary.incompleteRecordCount === 1 ? "" : "s"} with incomplete records`,
      description: `${ex}${summary.incompleteRecordCount > 3 ? " and others" : ""} are missing core identification details (e.g. breed, birth date, sex). Completing records improves herd monitoring.`,
      action: "Review records",
      route: "/livestock",
      source: "Livestock",
    });
  }

  return out;
}
