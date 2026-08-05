/**
 * Report Export Service -- prepares structured export objects.
 * Does NOT generate files yet. Returns export-ready data for future PDF/Excel/CSV.
 */

export const EXPORT_FORMATS = [
  { id: "pdf", label: "PDF Document", ext: ".pdf", icon: "PictureAsPdf" },
  { id: "xlsx", label: "Excel Spreadsheet", ext: ".xlsx", icon: "TableChart" },
  { id: "csv", label: "CSV File", ext: ".csv", icon: "Description" },
  { id: "json", label: "JSON Data", ext: ".json", icon: "Code" },
  { id: "email", label: "Email Report", ext: null, icon: "Email" },
];

export function prepareExport(report, format) {
  if (!report) return null;
  return {
    ready: true,
    format,
    filename: `${report.title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}${EXPORT_FORMATS.find(f => f.id === format)?.ext || ""}`,
    title: report.title,
    generatedAt: new Date().toISOString(),
    generatedBy: report.generatedBy || "Admin",
    sections: report.sections || [],
    kpis: report.kpis || [],
    summary: report.summary || "",
    recommendations: report.recommendations || [],
    data: report,
  };
}

export function getAvailableFormats() { return EXPORT_FORMATS; }
