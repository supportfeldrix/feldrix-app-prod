import { Box, Typography, Stack } from "@mui/material";
import { FilterList } from "@mui/icons-material";
import { semantic, radius } from "../../../shared/design";

const FILTERS = ["All", "Executive", "Revenue", "Customer", "Platform", "Operations"];

export default function ReportFilters({ active, onChange }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.75 }}>
      <FilterList sx={{ fontSize: 16, color: semantic.textTertiary }} />
      {FILTERS.map(f => (
        <Box key={f} onClick={() => onChange(f)} sx={{ px: 1.5, py: 0.5, borderRadius: radius.pill, bgcolor: active === f ? `${semantic.info}12` : "transparent", border: `1px solid ${active === f ? semantic.info : semantic.border}`, cursor: "pointer", transition: "all 0.15s ease", "&:hover": { borderColor: semantic.borderHover } }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: active === f ? semantic.info : semantic.textSecondary }}>{f}</Typography>
        </Box>
      ))}
    </Stack>
  );
}
