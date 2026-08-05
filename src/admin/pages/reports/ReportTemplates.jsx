import { Box, Typography, Stack, Grid } from "@mui/material";
import { semantic, radius } from "../../../shared/design";
import { getAllTemplates } from "../../services/reportTemplateService";

export default function ReportTemplates({ onSelect }) {
  const templates = getAllTemplates();
  return (
    <Box>
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>Available Templates</Typography>
      <Grid container spacing={1.5}>
        {templates.map(t => (
          <Grid item xs={12} sm={6} key={t.id}>
            <Box onClick={() => onSelect?.(t.id)} sx={{ p: 2, borderRadius: radius.lg, border: `1px solid ${semantic.border}`, cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: semantic.surface, borderColor: semantic.borderHover } }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{t.title}</Typography>
              <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary, mt: 0.25 }}>{t.sections.length} sections, {t.kpis.length} KPIs</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
