/**
 * Feldrix Report Generation Engine
 * Sprint 45
 *
 * Central report generator that routes to the correct provider
 * and returns a standardised report object.
 */

import { generateFinanceReport } from "./financeReport";
import { generateLivestockReport } from "./livestockReport";
import { generateBreedingReport } from "./breedingReport";
import { generateHealthReport } from "./healthReport";
import { generateCropReport } from "./cropReport";
import { generateMachineryReport } from "./machineryReport";
import { generateRainfallReport } from "./rainfallReport";
import { generateFarmSummaryReport } from "./farmSummaryReport";

const PROVIDERS = {
  "finance-monthly": generateFinanceReport,
  "livestock-perf": generateLivestockReport,
  "breeding-perf": generateBreedingReport,
  "health-summary": generateHealthReport,
  "crop-perf": generateCropReport,
  "machinery-cost": generateMachineryReport,
  "rainfall-summary": generateRainfallReport,
  "farm-summary": generateFarmSummaryReport,
};

/**
 * Generates a report using the appropriate provider.
 *
 * @param {string} reportId - Report template ID
 * @param {object} options - Generation options
 * @param {string} options.dateRange - "today"|"this-week"|"this-month"|"last-month"|"last-3-months"|"custom"
 * @param {string} [options.startDate] - Custom range start
 * @param {string} [options.endDate] - Custom range end
 * @param {string} options.format - "pdf"|"excel"|"both"
 * @param {boolean} options.includeCharts
 * @param {boolean} options.includeAiSummary
 * @param {boolean} options.includeBranding
 * @param {boolean} options.includeExecutiveSummary
 * @returns {Promise<object>} Generated report object
 */
export async function generateReport(reportId, options = {}) {
  const provider = PROVIDERS[reportId];

  if (!provider) {
    throw new Error(`Unknown report type: ${reportId}`);
  }

  const dateRange = resolveDateRange(options.dateRange, options.startDate, options.endDate);

  const report = await provider({ ...options, ...dateRange });

  return {
    ...report,
    id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reportId,
    generatedDate: new Date().toISOString(),
    period: { from: dateRange.from, to: dateRange.to, label: options.dateRange },
    format: options.format || "pdf",
    options: {
      includeCharts: options.includeCharts ?? true,
      includeAiSummary: options.includeAiSummary ?? true,
      includeBranding: options.includeBranding ?? true,
      includeExecutiveSummary: options.includeExecutiveSummary ?? false,
    },
    // Email-ready metadata (Phase 8)
    emailReady: true,
    emailSubject: `${report.title} - ${formatDateShort(dateRange.from)} to ${formatDateShort(dateRange.to)}`,
    emailFilename: `${report.title.replace(/\s+/g, "_")}_${formatFilenameDate(new Date())}`,
  };
}

/**
 * Returns all available report templates.
 */
export function getReportTemplates() {
  return Object.keys(PROVIDERS);
}

function resolveDateRange(range, startDate, endDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "today":
      return { from: today.toISOString(), to: now.toISOString() };
    case "this-week": {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay());
      return { from: start.toISOString(), to: now.toISOString() };
    }
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    case "last-3-months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    case "custom":
      return { from: startDate || today.toISOString(), to: endDate || now.toISOString() };
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: now.toISOString() };
  }
}

function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function formatFilenameDate(date) {
  return `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default generateReport;
