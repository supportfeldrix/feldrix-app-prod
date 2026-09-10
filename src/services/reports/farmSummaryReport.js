import { generateFinanceReport } from "./financeReport";
import { generateLivestockReport } from "./livestockReport";
import { generateBreedingReport } from "./breedingReport";
import { generateHealthReport } from "./healthReport";
import { generateCropReport } from "./cropReport";
import { generateMachineryReport } from "./machineryReport";
import { generateRainfallReport } from "./rainfallReport";
import { zar } from "./_period";

/**
 * ============================================================
 * Monthly Farm Summary — Phase 1
 *
 * Composes the period-aware module reports into ONE coherent monthly
 * summary. The SELECTED DATE RANGE is passed to EVERY provider, so the
 * whole report describes the same period (no more September finance
 * mixed with lifetime health/crop/livestock).
 *
 * FINANCE IS THE SINGLE SOURCE OF TRUTH FOR MONEY. Total expenses come
 * only from the finance report (finance_records). Health/machinery
 * "expenditure" lines shown elsewhere are Finance-derived subsets of
 * that same total — they are NEVER added on top of it. animal_health.cost
 * and machinery_services.cost are never summed into the total. This is
 * the deterministic dedupe strategy.
 * ============================================================
 */

export async function generateFarmSummaryReport(options = {}) {
  const { from, to } = options;
  const period = { from, to };

  const [finance, livestock, breeding, health, crops, machinery, rainfall] = await Promise.all([
    generateFinanceReport(period).catch(() => null),
    generateLivestockReport(period).catch(() => null),
    generateBreedingReport(period).catch(() => null),
    generateHealthReport(period).catch(() => null),
    generateCropReport(period).catch(() => null),
    generateMachineryReport(period).catch(() => null),
    generateRainfallReport(period).catch(() => null),
  ]);

  const sections = [];

  // ── Financial Summary (source of truth) ────────────────────────
  if (finance?.financeData) {
    const f = finance.financeData;
    sections.push({
      title: "Financial Summary",
      items: [
        { label: "Total income", value: zar(f.income) },
        { label: "Total expenses", value: zar(f.expenses) },
        { label: "Net position", value: zar(f.net) },
      ],
    });

    // Expenses by category (reuse the finance report's own breakdown).
    const expenseSection = finance.sections?.find((s) => s.title === "Expenses by Category");
    if (expenseSection) {
      sections.push({ title: "Expenses by Category", items: expenseSection.items });
    }
  }

  // ── Animal Health ──────────────────────────────────────────────
  if (health?.healthData) {
    const h = health.healthData;
    sections.push({
      title: "Animal Health",
      items: [
        { label: "Vaccinations", value: h.counts?.["Vaccination"] || 0 },
        { label: "Dewormings", value: h.counts?.["Deworming"] || 0 },
        { label: "Treatments", value: (h.counts?.["Treatment"] || 0) + (h.counts?.["Medication"] || 0) },
        { label: "Veterinary visits", value: h.counts?.["Veterinary Visit"] || 0 },
        { label: "Animals treated (distinct)", value: h.animalsTreated },
        // From Finance — a subset of Total expenses, NOT added on top.
        { label: "Health expenditure (from Finance)", value: zar(h.healthSpend) },
      ],
    });
  }

  // ── Crops (period activity + snapshot) ─────────────────────────
  if (crops?.cropData) {
    const c = crops.cropData;
    sections.push({
      title: "Crops",
      items: [
        { label: "Planted this period", value: c.plantedThisPeriod },
        { label: "Area planted", value: `${Number(c.areaPlanted || 0).toFixed(1)} ha` },
        { label: "Harvests expected this period", value: c.harvestExpectedThisPeriod },
        { label: "Currently growing (snapshot)", value: c.currentlyGrowing },
      ],
    });
  }

  // ── Machinery ──────────────────────────────────────────────────
  if (machinery?.machineryData) {
    const m = machinery.machineryData;
    sections.push({
      title: "Machinery",
      items: [
        { label: "Services this period", value: m.servicesThisPeriod },
        // From Finance — a subset of Total expenses, NOT added on top.
        { label: "Machinery expenditure (from Finance)", value: zar(m.machinerySpend) },
        { label: "Active machines (snapshot)", value: m.activeMachines },
      ],
    });
  }

  // ── Livestock ──────────────────────────────────────────────────
  if (livestock?.livestockData) {
    const l = livestock.livestockData;
    sections.push({
      title: "Livestock",
      items: [
        { label: "Animals purchased this period", value: l.purchasedThisPeriod },
        { label: "Current herd size (snapshot)", value: l.currentHerdSize },
        { label: "Active (snapshot)", value: l.activeNow },
      ],
    });
  }

  // ── Breeding ───────────────────────────────────────────────────
  if (breeding?.breedingData) {
    const b = breeding.breedingData;
    sections.push({
      title: "Breeding",
      items: [
        { label: "Breedings this period", value: b.breedingsThisPeriod },
        { label: "Success rate (snapshot)", value: `${b.successRate}%` },
      ],
    });
  }

  // ── Weather / Rainfall ─────────────────────────────────────────
  if (rainfall?.rainfallData) {
    const r = rainfall.rainfallData;
    sections.push({
      title: "Weather",
      items: [
        { label: "Recorded rainfall", value: `${r.totalMm} mm` },
        { label: "Rainfall log entries", value: r.entries },
      ],
    });
  }

  // Top-level KPI cards — all Finance-sourced money figures.
  const statistics = {
    totalIncome: zar(finance?.financeData?.income || 0),
    totalExpenses: zar(finance?.financeData?.expenses || 0),
    netPosition: zar(finance?.financeData?.net || 0),
    rainfall: `${rainfall?.rainfallData?.totalMm || 0} mm`,
  };

  return {
    title: "Monthly Farm Summary",
    statistics,
    sections,
    aiSummary: buildSummaryText(finance, health, crops, rainfall),
  };
}

function buildSummaryText(finance, health, crops, rainfall) {
  const parts = [];
  if (finance?.financeData) {
    parts.push(finance.financeData.net >= 0 ? "The farm was profitable this period." : "Expenses exceeded income this period.");
  }
  if (health?.healthData?.totalActivity) {
    parts.push(`${health.healthData.totalActivity} health activities recorded.`);
  }
  if (crops?.cropData?.plantedThisPeriod) {
    parts.push(`${crops.cropData.plantedThisPeriod} crop planting(s).`);
  }
  if (rainfall?.rainfallData?.entries) {
    parts.push(`${rainfall.rainfallData.totalMm} mm rainfall recorded.`);
  }
  return parts.length ? parts.join(" ") : "No recorded activity for this period.";
}
