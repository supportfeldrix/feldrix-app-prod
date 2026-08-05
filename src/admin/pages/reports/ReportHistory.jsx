import { Box, Typography, Stack } from "@mui/material";
import { History } from "@mui/icons-material";
import { semantic, radius } from "../../../shared/design";

export default function ReportHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <Box sx={{ p: 3, borderRadius: radius.lg, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, textAlign: "center" }}>
        <History sx={{ fontSize: 28, color: semantic.textTertiary, mb: 1 }} />
        <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary }}>No reports generated yet</Typography>
        <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, mt: 0.5 }}>Generated reports will appear here.</Typography>
      </Box>
    );
  }
  return (
    <Stack spacing={1}>
      {history.map((item, i) => (
        <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: radius.md, border: `1px solid ${semantic.border}` }}>
          <Box>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{item.title}</Typography>
            <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>{item.generatedAt}</Typography>
          </Box>
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: semantic.info }}>{item.format || "PDF"}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
