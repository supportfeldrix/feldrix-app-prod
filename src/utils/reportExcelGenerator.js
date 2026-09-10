import * as XLSX from "xlsx";

/**
 * ============================================================
 * Report Excel Generator
 * Sprint 45 — Phase 7
 *
 * Generates a formatted XLSX workbook from a generated report object.
 * ============================================================
 */

function formatDate(iso) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Generates and downloads an Excel workbook for the given report.
 *
 * @param {object} report - Generated report object from reportGenerator.js
 */
export function generateReportExcel(report) {
  if (!report) throw new Error("No report data provided.");

  const wb = XLSX.utils.book_new();

  // --- Summary Sheet ---
  const summaryRows = [
    [report.title || "Farm Report"],
    [`Period: ${formatDate(report.period?.from)} \u2014 ${formatDate(report.period?.to)}`],
    [`Generated: ${formatDate(report.generatedDate)}`],
    [],
    ["KEY METRICS"],
  ];

  if (report.statistics) {
    for (const [key, value] of Object.entries(report.statistics)) {
      summaryRows.push([key.replace(/([A-Z])/g, " $1").trim(), String(value)]);
    }
  }

  if (report.aiSummary && report.options?.includeAiSummary) {
    summaryRows.push([], ["AI SUMMARY"], [report.aiSummary]);
  }

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs["!cols"] = [{ wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // --- Section Sheets ---
  if (report.sections?.length > 0) {
    for (const section of report.sections) {
      // If any item in this section carries structured quantity metadata
      // (Phase 2 finance breakdowns), render explicit columns:
      // Category | Purchases | Quantity | Unit | Amount. Mixed units are
      // written on separate rows so incompatible units are never combined.
      // Otherwise fall back to the original generic Label | Value layout,
      // keeping every existing report unchanged.
      const hasMeta = (section.items || []).some((it) => it && it.meta);

      let sectionRows;
      let cols;

      if (hasMeta) {
        sectionRows = [[section.title], ["Category", "Purchases", "Quantity", "Unit", "Amount"]];
        for (const item of section.items) {
          const m = item.meta || {};
          const amount = m.amount != null ? m.amount : "";
          const units = Object.keys(m.quantitiesByUnit || {});
          if (units.length === 0) {
            sectionRows.push([item.label, m.count ?? "", "", "", amount]);
          } else {
            // One row per unit; amount + purchases only on the first row to
            // avoid double-counting money across unit rows.
            units.forEach((u, idx) => {
              sectionRows.push([
                idx === 0 ? item.label : "",
                idx === 0 ? (m.count ?? "") : "",
                Number(m.quantitiesByUnit[u]),
                u,
                idx === 0 ? amount : "",
              ]);
            });
          }
        }
        cols = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 16 }];
      } else {
        sectionRows = [[section.title], ["Label", "Value"]];
        if (section.items?.length > 0) {
          for (const item of section.items) {
            sectionRows.push([item.label, String(item.value)]);
          }
        }
        cols = [{ wch: 30 }, { wch: 25 }];
      }

      const sheetName = section.title.slice(0, 31); // Excel sheet name max 31 chars
      const ws = XLSX.utils.aoa_to_sheet(sectionRows);
      ws["!cols"] = cols;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  }

  // --- Download ---
  const filename = report.emailFilename ? `${report.emailFilename}.xlsx` : `${report.title?.replace(/\s+/g, "_") || "Report"}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export default generateReportExcel;
