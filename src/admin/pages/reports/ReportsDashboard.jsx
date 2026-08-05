/**
 * ============================================================
 * Feldrix Control Centre -- Enterprise Reports & Export Centre
 * Sprint 54.3
 * ============================================================
 */

import { useState } from "react";
import { Box, Typography, Stack, Grid } from "@mui/material";
import { FxStatCard, semantic, typography as typo, radius } from "../../../shared/design";
import { getAllTemplates } from "../../services/reportTemplateService";
import { generateReport } from "../../services/reportService";
import ReportCard from "./ReportCard";
import ReportPreview from "./ReportPreview";
import ReportFilters from "./ReportFilters";
import ReportHistory from "./ReportHistory";

export default function ReportsDashboard() {
  const templates = getAllTemplates();
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);

  const filtered = filter === "All" ? templates : templates.filter(t =>
    t.title.toLowerCase().includes(filter.toLowerCase())
  );

  function handleGenerate(templateId) {
    const report = generateReport(templateId, {}, "Admin");
    if (report) {
      setHistory(prev => [report, ...prev].slice(0, 20));
      setPreview(report);
    }
  }

  function handlePreview(templateId) {
    const report = generateReport(templateId, {}, "Admin");
    if (report) setPreview(report);
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
        <Grid item xs={6} sm={3}>
          <FxStatCard icon="assessment" label="Available" value={templates.length} color={semantic.info} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <FxStatCard icon="description" label="Generated" value={history.length} color={semantic.success} />
        </Grid>
      </Grid>

      {/* Filters */}
      <ReportFilters active={filter} onChange={setFilter} />

      {/* Report cards grid */}
      <Grid container spacing={2.5}>
        {filtered.map(t => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <ReportCard template={t} onGenerate={() => handleGenerate(t.id)} onPreview={() => handlePreview(t.id)} />
          </Grid>
        ))}
      </Grid>

      {/* History */}
      <Box>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}>Report History</Typography>
        <ReportHistory history={history} />
      </Box>

      {/* Preview overlay */}
      {preview && <ReportPreview report={preview} onClose={() => setPreview(null)} />}
    </Stack>
  );
}
