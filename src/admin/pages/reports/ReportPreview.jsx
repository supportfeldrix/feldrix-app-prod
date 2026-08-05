import { Box, Typography, Stack, Grid, Chip, IconButton } from "@mui/material";
import { Close, Download } from "@mui/icons-material";
import { semantic, radius, shadows } from "../../../shared/design";

export default function ReportPreview({ report, onClose }) {
  if (!report) return null;
  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <Box onClick={e => e.stopPropagation()} sx={{ width: "90%", maxWidth: 720, maxHeight: "85vh", overflowY: "auto", bgcolor: semantic.paper, borderRadius: radius.xl, boxShadow: shadows.dialog, p: { xs: 3, md: 5 } }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: semantic.text }}>{report.title}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, mt: 0.5 }}>Generated {new Date(report.generatedAt).toLocaleString("en-ZA")} by {report.generatedBy}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" sx={{ border: `1px solid ${semantic.border}`, borderRadius: radius.md }}><Download sx={{ fontSize: 16 }} /></IconButton>
            <IconButton onClick={onClose} size="small" sx={{ border: `1px solid ${semantic.border}`, borderRadius: radius.md }}><Close sx={{ fontSize: 16 }} /></IconButton>
          </Stack>
        </Stack>
        {/* Summary */}
        <Box sx={{ p: 2.5, borderRadius: radius.lg, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, mb: 3 }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>Executive Summary</Typography>
          <Typography sx={{ fontSize: "0.88rem", color: semantic.text, lineHeight: 1.7 }}>{report.summary}</Typography>
        </Box>
        {/* KPIs */}
        {report.kpis?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>Key Metrics</Typography>
            <Grid container spacing={1.5}>
              {report.kpis.map((kpi, i) => (
                <Grid item xs={6} sm={4} md={3} key={i}>
                  <Box sx={{ p: 1.5, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: semantic.text }}>{kpi.value}</Typography>
                    <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary, mt: 0.25 }}>{kpi.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {/* Sections */}
        {report.sections?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>Report Sections</Typography>
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
              {report.sections.map((s, i) => <Chip key={i} label={s} size="small" sx={{ fontSize: "0.68rem", bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }} />)}
            </Stack>
          </Box>
        )}
        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>Recommendations</Typography>
            <Stack spacing={1}>
              {report.recommendations.map((r, i) => (
                <Typography key={i} sx={{ fontSize: "0.82rem", color: semantic.textSecondary, lineHeight: 1.6 }}>- {r}</Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}
