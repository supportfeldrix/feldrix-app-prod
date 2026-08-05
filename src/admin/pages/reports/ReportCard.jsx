import { Box, Typography, Stack, IconButton, Tooltip } from "@mui/material";
import { PlayArrow, Visibility, Download } from "@mui/icons-material";
import { semantic, radius, shadows, transitions } from "../../../shared/design";

export default function ReportCard({ template, onGenerate, onPreview, onExport }) {
  return (
    <Box sx={{ p: 3, borderRadius: radius.xl, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, transition: "all 0.25s ease", display: "flex", flexDirection: "column", height: "100%", "&:hover": { boxShadow: shadows.md, transform: "translateY(-3px)", borderColor: `${semantic.info}40` } }}>
      <Box sx={{ width: 44, height: 44, borderRadius: radius.lg, bgcolor: `${semantic.info}08`, display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
        <PlayArrow sx={{ fontSize: 22, color: semantic.info }} />
      </Box>
      <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: semantic.text, mb: 0.5 }}>{template.title}</Typography>
      <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, lineHeight: 1.6, flex: 1, mb: 2 }}>{template.description}</Typography>
      <Stack direction="row" spacing={1}>
        <Box onClick={onGenerate} sx={{ flex: 1, py: 0.8, borderRadius: radius.md, bgcolor: "#0F172A", textAlign: "center", cursor: "pointer", transition: transitions.fast, "&:hover": { bgcolor: "#1E293B" } }}>
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff" }}>Generate</Typography>
        </Box>
        <Tooltip title="Preview"><IconButton onClick={onPreview} size="small" sx={{ border: `1px solid ${semantic.border}`, borderRadius: radius.md, width: 34, height: 34 }}><Visibility sx={{ fontSize: 15, color: semantic.textTertiary }} /></IconButton></Tooltip>
        <Tooltip title="Export"><IconButton onClick={onExport} size="small" sx={{ border: `1px solid ${semantic.border}`, borderRadius: radius.md, width: 34, height: 34 }}><Download sx={{ fontSize: 15, color: semantic.textTertiary }} /></IconButton></Tooltip>
      </Stack>
    </Box>
  );
}
