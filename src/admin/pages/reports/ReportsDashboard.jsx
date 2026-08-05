/**
 * ============================================================
 * Feldrix Control Centre -- Enterprise Reports & Export Centre
 * Sprint 54.5 -- Real export engine wired
 * ============================================================
 */

import { useState } from "react";
import { Box, Typography, Stack, Grid, Dialog, Slide } from "@mui/material";
import { forwardRef } from "react";
import { FxStatCard, semantic, typography as typo, radius, shadows, transitions } from "../../../shared/design";
import { PictureAsPdf, TableChart, Description, Code, Email } from "@mui/icons-material";
import { getAllTemplates } from "../../services/reportTemplateService";
import { generateReport } from "../../services/reportService";
import { executeExport, EXPORT_FORMATS } from "../../services/reportExportService";
import ReportCard from "./ReportCard";
import ReportPreview from "./ReportPreview";
import ReportFilters from "./ReportFilters";
import ReportHistory from "./ReportHistory";

const SlideUp = forwardRef(function SlideUp(props, ref) { return <Slide direction="up" ref={ref} {...props} />; });
const FORMAT_ICONS = { PictureAsPdf, TableChart, Description, Code, Email };

export default function ReportsDashboard() {
  const templates = getAllTemplates();
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [exportDialog, setExportDialog] = useState(null); // holds report to export
  const [exporting, setExporting] = useState(false);

  const filtered = filter === "All" ? templates : templates.filter(t =>
    t.title.toLowerCase().includes(filter.toLowerCase())
  );

  function handleGenerate(templateId) {
    const report = generateReport(templateId, {}, "Admin");
    if (report) {
      setHistory(prev => [{ ...report, format: null }, ...prev].slice(0, 20));
      setPreview(report);
    }
  }

  function handlePreview(templateId) {
    const report = generateReport(templateId, {}, "Admin");
    if (report) setPreview(report);
  }

  function handleExportClick(report) {
    setExportDialog(report);
  }

  function handleExportFormat(format) {
    if (!exportDialog || exporting) return;
    setExporting(true);
    try {
      const result = executeExport(exportDialog, format);
      if (result.success) {
        setHistory(prev => [{ ...exportDialog, format, exportedAt: new Date().toISOString() }, ...prev.filter(h => h.id !== exportDialog.id)].slice(0, 20));
      }
    } catch { /* graceful */ }
    setExporting(false);
    setExportDialog(null);
  }

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Reports & Export Centre</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>Generate, preview, and export enterprise reports.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ px: 1.5, py: 0.4, borderRadius: radius.pill, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textTertiary }}>{templates.length} templates</Typography>
          </Box>
          <Box sx={{ px: 1.5, py: 0.4, borderRadius: radius.pill, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textTertiary }}>{history.length} generated</Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Summary cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} sm={3}><FxStatCard icon="assessment" label="Available" value={templates.length} color={semantic.info} /></Grid>
        <Grid item xs={6} sm={3}><FxStatCard icon="description" label="Generated" value={history.length} color={semantic.success} /></Grid>
      </Grid>

      {/* Filters */}
      <ReportFilters active={filter} onChange={setFilter} />

      {/* Report cards grid */}
      <Grid container spacing={2.5}>
        {filtered.map(t => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <ReportCard template={t} onGenerate={() => handleGenerate(t.id)} onPreview={() => handlePreview(t.id)} onExport={() => { const r = generateReport(t.id, {}, "Admin"); if (r) handleExportClick(r); }} />
          </Grid>
        ))}
      </Grid>

      {/* History */}
      <Box>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}>Report History</Typography>
        <ReportHistory history={history} onDownload={handleExportClick} />
      </Box>

      {/* Preview overlay */}
      {preview && <ReportPreview report={preview} onClose={() => setPreview(null)} onExport={() => handleExportClick(preview)} />}

      {/* Export format dialog */}
      <Dialog open={!!exportDialog} onClose={() => setExportDialog(null)} TransitionComponent={SlideUp} PaperProps={{ sx: { borderRadius: radius.xl, p: 3, minWidth: 340, maxWidth: 400 } }}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: semantic.text, mb: 0.5 }}>Export Report</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, mb: 2.5 }}>{exportDialog?.title || "Report"}</Typography>
        <Stack spacing={1.25}>
          {EXPORT_FORMATS.map(fmt => {
            const Icon = FORMAT_ICONS[fmt.icon] || Description;
            return (
              <Box key={fmt.id} onClick={() => fmt.available && handleExportFormat(fmt.id)} sx={{ p: 2, borderRadius: radius.lg, border: `1px solid ${semantic.border}`, cursor: fmt.available ? "pointer" : "default", opacity: fmt.available ? 1 : 0.5, transition: transitions.fast, "&:hover": fmt.available ? { bgcolor: semantic.surface, borderColor: semantic.borderHover } : {} }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Icon sx={{ fontSize: 20, color: fmt.available ? semantic.info : semantic.textTertiary }} />
                  <Box>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{fmt.label}</Typography>
                    <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>{fmt.available ? (fmt.ext || "Send via email") : "Coming soon"}</Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Dialog>
    </Stack>
  );
}
