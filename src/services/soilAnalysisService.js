/**
 * ============================================================
 * Feldrix — Soil Analysis Engine (ANALYSIS layer)
 *
 * ONE common engine for BOTH United States and South African farms. It
 * interprets the farmer's MEASURED Ground Sampling / laboratory data (which
 * stays authoritative and is never overwritten) against the centralized crop
 * soil-preference knowledge base, optionally with a location-based soil
 * REFERENCE (USDA/SSURGO for US farms) shown ONLY as context — never merged.
 *
 * SAFETY RULES (enforced here):
 *   - Never fabricate a value; missing data is never treated as zero.
 *   - Never output an exact fertilizer/lime application rate. Recommendations
 *     point to the farmer's agronomist / soil laboratory.
 *   - Measured vs reference are presented separately; reference is never called
 *     "more accurate" than the farmer's sample.
 *   - Always expose confidence + limitations; never hide uncertainty.
 *
 * SEPARATION: this module returns a STRUCTURED model (statuses, short neutral
 * explanations) — no MUI/JSX. The presentation layer renders it.
 * ============================================================
 */

import {
  getPreferredPhRange,
  classifyNutrient,
  classifyOrganicMatter,
  isSupportedSoilCrop,
} from "../constants/cropSoilPreferences";

const NUTRIENT_METHOD_CAVEAT =
  "Nutrient interpretation is approximate: laboratory extraction methods and units vary and were not recorded, so treat N/P/K classifications as a general guide.";

const AGRONOMIST_DISCLAIMER =
  "Guidance based on recorded soil information; it does not replace a qualified agronomist or soil laboratory recommendation.";

// Sample-age threshold (months) beyond which we qualify the analysis. This is a
// gentle qualification, not an imposed retest interval.
const OLD_SAMPLE_MONTHS = 9;

function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function monthsBetween(fromIso, now) {
  if (!fromIso) return null;
  const d = new Date(fromIso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((now - d) / (1000 * 60 * 60 * 24 * 30.44)));
}

// ─── pH interpretation (crop-aware) ──────────────────────────────────────────
function analyzePh(sample, cropName, findings, recommendations, nutrientStatus) {
  const ph = numOrNull(sample.ph);
  if (ph === null) return; // no fabrication

  const range = getPreferredPhRange(cropName);
  const cropLabel = range.cropSpecific ? cropName : "general crop";
  let status;
  let detail;

  if (ph < range.min) {
    status = "below_preferred";
    detail = `Measured pH ${ph} is below the preferred range (${range.min}–${range.max}) for ${cropLabel}.`;
    recommendations.push({
      id: "ph-low",
      severity: "attention",
      text: `Soil pH is below the preferred range for ${cropLabel}. Consider a liming program and confirm the appropriate rate with your soil laboratory or agronomist.`,
      basis: `Measured pH ${ph} < preferred ${range.min}.`,
    });
  } else if (ph > range.max) {
    status = "above_preferred";
    detail = `Measured pH ${ph} is above the preferred range (${range.min}–${range.max}) for ${cropLabel}.`;
    recommendations.push({
      id: "ph-high",
      severity: "attention",
      text: `Soil pH is above the preferred range for ${cropLabel}. Alkaline conditions can affect nutrient availability — review with your agronomist if this is unexpected.`,
      basis: `Measured pH ${ph} > preferred ${range.max}.`,
    });
  } else {
    status = "within_preferred";
    detail = `Measured pH ${ph} is within the preferred range (${range.min}–${range.max}) for ${cropLabel}.`;
  }

  nutrientStatus.pH = { value: ph, status, preferred: { min: range.min, max: range.max }, cropSpecific: range.cropSpecific };
  findings.push({
    key: "pH",
    label: "pH",
    status: status === "within_preferred" ? "ok" : "attention",
    summary: status === "within_preferred" ? "Within preferred range" : (status === "below_preferred" ? "Below preferred range" : "Above preferred range"),
    detail,
  });
}

// ─── N / P / K interpretation (only when a value exists) ─────────────────────
const NUTRIENT_LABELS = { nitrogen: "Nitrogen", phosphorus: "Phosphorus", potassium: "Potassium" };

function analyzeNutrient(nutrient, sample, findings, recommendations, nutrientStatus, limitationsFlags) {
  const raw = sample[nutrient];
  const value = numOrNull(raw);
  const label = NUTRIENT_LABELS[nutrient];

  if (value === null) {
    // Missing → explicitly "unavailable for interpretation" (never assume zero).
    nutrientStatus[nutrient] = { value: null, status: "unavailable" };
    findings.push({ key: nutrient, label, status: "unknown", summary: "Not recorded", detail: `${label} was not recorded in this sample, so it cannot be interpreted.` });
    return;
  }

  const cls = classifyNutrient(nutrient, value); // low | adequate | elevated | high | null
  limitationsFlags.usedNutrientBands = true;
  nutrientStatus[nutrient] = { value, status: cls || "unclassified", unit: "mg/kg" };

  if (cls === "low") {
    findings.push({ key: nutrient, label, status: "attention", summary: "Low (approx.)", detail: `Measured ${label.toLowerCase()} (${value} mg/kg) is low relative to the general interpretation range.` });
    recommendations.push({
      id: `${nutrient}-low`,
      severity: "attention",
      text: `${label} appears low relative to the configured interpretation range. Consider reviewing your ${label.toLowerCase()} management plan with your agronomist. ${NUTRIENT_METHOD_CAVEAT}`,
      basis: `Measured ${label.toLowerCase()} ${value} mg/kg classified "low".`,
    });
  } else if (cls === "high" || cls === "elevated") {
    findings.push({ key: nutrient, label, status: "note", summary: cls === "high" ? "High (approx.)" : "Elevated (approx.)", detail: `Measured ${label.toLowerCase()} (${value} mg/kg) is ${cls} relative to the general interpretation range.` });
    if (nutrient === "potassium") {
      recommendations.push({
        id: "potassium-elevated",
        severity: "note",
        text: `Potassium is already ${cls} in this sample. Avoid assuming additional potassium is required without further agronomic justification. ${NUTRIENT_METHOD_CAVEAT}`,
        basis: `Measured potassium ${value} mg/kg classified "${cls}".`,
      });
    }
  } else if (cls === "adequate") {
    findings.push({ key: nutrient, label, status: "ok", summary: "Adequate (approx.)", detail: `Measured ${label.toLowerCase()} (${value} mg/kg) is within the general adequate range.` });
  } else {
    findings.push({ key: nutrient, label, status: "note", summary: "Recorded", detail: `Measured ${label.toLowerCase()} is ${value} mg/kg.` });
  }
}

// ─── Organic matter ──────────────────────────────────────────────────────────
function analyzeOrganicMatter(sample, findings, recommendations, soilConditions) {
  const om = numOrNull(sample.organic_matter);
  if (om === null) return;

  const cls = classifyOrganicMatter(om); // low | moderate | favorable | elevated
  soilConditions.organicMatter = { value: om, status: cls || "recorded", unit: "%" };

  if (cls === "low") {
    findings.push({ key: "organic_matter", label: "Organic Matter", status: "attention", summary: "Low", detail: `Measured organic matter (${om}%) is relatively low.` });
    recommendations.push({
      id: "om-low",
      severity: "note",
      text: "Organic matter is relatively low. Consider management practices that build soil organic matter over time (e.g. residue retention, cover crops) — review options with your agronomist.",
      basis: `Measured organic matter ${om}% classified "low".`,
    });
  } else if (cls) {
    findings.push({ key: "organic_matter", label: "Organic Matter", status: cls === "elevated" ? "note" : "ok", summary: cls.charAt(0).toUpperCase() + cls.slice(1), detail: `Measured organic matter is ${om}% (${cls}).` });
  } else {
    findings.push({ key: "organic_matter", label: "Organic Matter", status: "note", summary: "Recorded", detail: `Measured organic matter is ${om}%.` });
  }
}

// ─── Measured vs soil reference (context only, never merged) ─────────────────
function compareToReference(sample, soilReference, soilConditions, limitations) {
  // soilReference is the normalized model from soilIntelligenceService (US only).
  if (!soilReference || !soilReference.available || !soilReference.data) return;
  const refPh = numOrNull(soilReference.data.reference_pH);
  const measuredPh = numOrNull(sample.ph);
  if (refPh === null || measuredPh === null) return;

  const delta = Math.round((measuredPh - refPh) * 10) / 10;
  let phrase;
  if (Math.abs(delta) < 0.3) {
    phrase = `Your measured pH (${measuredPh}) is close to the USDA reference pH (${refPh}) for this mapped soil.`;
  } else if (delta < 0) {
    phrase = `Your measured pH (${measuredPh}) is below the USDA reference pH (${refPh}) for this mapped soil. Your laboratory sample remains the authoritative value for your field.`;
  } else {
    phrase = `Your measured pH (${measuredPh}) is above the USDA reference pH (${refPh}) for this mapped soil. Your laboratory sample remains the authoritative value for your field.`;
  }
  soilConditions.referenceComparison = {
    measuredPh, referencePh: refPh, deltaPh: delta,
    note: phrase,
    // Explicitly NOT a claim that either is "more accurate".
  };
}

// ─── Historical trend (latest is primary; no causation) ──────────────────────
function analyzeHistory(history, soilConditions) {
  if (!Array.isArray(history) || history.length < 2) return;
  // history is expected newest-first (as returned by getGroundSamples).
  const phSeries = history
    .map((s) => numOrNull(s.ph))
    .filter((v) => v !== null);
  if (phSeries.length >= 2) {
    // Compare oldest→newest direction using first (newest) vs last (oldest).
    const newest = phSeries[0];
    const oldest = phSeries[phSeries.length - 1];
    const diff = Math.round((newest - oldest) * 10) / 10;
    if (Math.abs(diff) >= 0.3) {
      soilConditions.phTrend = {
        direction: diff < 0 ? "declined" : "rose",
        deltaPh: diff,
        samples: phSeries.length,
        note: `Measured soil pH has ${diff < 0 ? "declined" : "risen"} across the recorded samples (${phSeries.length} readings).`,
      };
    }
  }
}

// ─── Overall status + confidence ─────────────────────────────────────────────
function deriveOverall(findings) {
  const hasAttention = findings.some((f) => f.status === "attention");
  if (hasAttention) return "review_recommended";
  const hasNote = findings.some((f) => f.status === "note" || f.status === "unknown");
  return hasNote ? "attention" : "good";
}

/**
 * Analyze a single measured soil sample. Common to US + SA.
 *
 * @param {object} params
 * @param {object} params.sample - latest ground_samples row (measured; authoritative)
 * @param {string} [params.crop] - crop name (for crop-aware pH); optional
 * @param {object} [params.farmCtx] - farm context (country/units); optional
 * @param {object} [params.soilReference] - soilIntelligenceService envelope (US); optional
 * @param {Array}  [params.history] - all samples newest-first (for trend); optional
 * @param {Date}   [params.now]
 * @returns {object} structured analysis model (no UI strings/JSX)
 */
export function analyzeSoil({ sample, crop = null, farmCtx = null, soilReference = null, history = null, now = new Date() } = {}) {
  // R. No sample → clean no-data model (never invents analysis).
  if (!sample) {
    return {
      available: false,
      reason: "no_sample",
      crop: crop || null,
      sampleDate: null,
      overall: null,
      findings: [],
      nutrientStatus: {},
      soilConditions: {},
      recommendations: [],
      confidence: "none",
      limitations: ["No measured soil sample available yet."],
      disclaimer: AGRONOMIST_DISCLAIMER,
    };
  }

  const cropName = crop || sample.crops?.crop_name || null;
  const findings = [];
  const recommendations = [];
  const nutrientStatus = {};
  const soilConditions = {};
  const limitations = [];
  const limitationsFlags = { usedNutrientBands: false };

  // pH (crop-aware)
  analyzePh(sample, cropName, findings, recommendations, nutrientStatus);

  // N / P / K — only interpreted when present
  analyzeNutrient("nitrogen", sample, findings, recommendations, nutrientStatus, limitationsFlags);
  analyzeNutrient("phosphorus", sample, findings, recommendations, nutrientStatus, limitationsFlags);
  analyzeNutrient("potassium", sample, findings, recommendations, nutrientStatus, limitationsFlags);

  // Organic matter
  analyzeOrganicMatter(sample, findings, recommendations, soilConditions);

  // Reference comparison (context only, US farms with USDA reference)
  compareToReference(sample, soilReference, soilConditions, limitations);

  // Historical trend
  analyzeHistory(history, soilConditions);

  // ── Limitations & confidence ───────────────────────────────
  if (!cropName) limitations.push("Crop is not set, so crop-specific pH interpretation used a general range.");
  else if (!isSupportedSoilCrop(cropName)) limitations.push(`No crop-specific soil preference is configured for "${cropName}"; a general pH range was used.`);

  if (limitationsFlags.usedNutrientBands) limitations.push(NUTRIENT_METHOD_CAVEAT);
  if (!sample.laboratory) limitations.push("Laboratory / extraction method was not recorded, which limits nutrient interpretation confidence.");

  const ageMonths = monthsBetween(sample.sample_date, now);
  if (ageMonths != null && ageMonths >= OLD_SAMPLE_MONTHS) {
    limitations.push(`Latest measured sample is about ${ageMonths} months old. Consider retesting if soil conditions or management have changed.`);
  }

  // Confidence: recent + crop known + method recorded + some nutrients present.
  const hasNutrients = ["nitrogen", "phosphorus", "potassium"].some((n) => numOrNull(sample[n]) !== null);
  let confidence = "high";
  if (!cropName || !isSupportedSoilCrop(cropName) || !hasNutrients || !sample.laboratory) confidence = "medium";
  if ((ageMonths != null && ageMonths >= OLD_SAMPLE_MONTHS) || (!hasNutrients && numOrNull(sample.ph) === null)) confidence = "low";

  return {
    available: true,
    reason: null,
    crop: cropName,
    sampleDate: sample.sample_date || null,
    sampleAgeMonths: ageMonths,
    depth: sample.sampling_depth || null,
    laboratory: sample.laboratory || null,
    overall: deriveOverall(findings),
    findings,
    nutrientStatus,
    soilConditions,
    recommendations,
    confidence,
    limitations,
    disclaimer: AGRONOMIST_DISCLAIMER,
  };
}

/**
 * Build concise Farm-Intelligence insight objects from a soil analysis, for the
 * global intelligence engine. Deliberately limited (≤2) to avoid dashboard
 * flooding and NOT a duplicate of the full panel. US + SA (region-neutral).
 * Shape matches other crop insights: { id, priority, category, title,
 * description, action, route, source }.
 */
export function buildSoilInsights(analysis) {
  const out = [];
  if (!analysis || !analysis.available) return out;

  const phLow = analysis.findings.find((f) => f.key === "pH" && f.summary === "Below preferred range");
  if (phLow) {
    out.push({
      id: "soil-ph-low",
      priority: "Medium",
      category: "Crops",
      title: "Latest soil sample indicates low pH",
      description: `${phLow.detail} Consider reviewing soil management with your laboratory/agronomist.`,
      action: "View soil analysis",
      route: "/crops",
      source: "Soil",
    });
  }

  const nLow = analysis.findings.find((f) => f.key === "nitrogen" && f.status === "attention");
  if (nLow) {
    out.push({
      id: "soil-nitrogen-low",
      priority: "Low",
      category: "Crops",
      title: "Latest soil sample indicates potentially low nitrogen",
      description: `${nLow.detail} Consider reviewing your nitrogen management plan.`,
      action: "View soil analysis",
      route: "/crops",
      source: "Soil",
    });
  }

  return out;
}
