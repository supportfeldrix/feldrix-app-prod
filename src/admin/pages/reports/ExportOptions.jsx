import { Box, Typography, Stack } from "@mui/material";
import { PictureAsPdf, TableChart, Description, Code, Email } from "@mui/icons-material";
import { semantic, radius, transitions } from "../../../shared/design";
import { EXPORT_FORMATS } from "../../services/reportExportService";

const ICONS = { PictureAsPdf, TableChart, Description, Code, Email };

export default function ExportOptions({ onSelect }) {
  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Export Format</Typography>
      {EXPORT_FORMATS.map(fmt => {
        const Icon = ICONS[fmt.icon] || Description;
        return (
          <Box key={fmt.id} onClick={() => onSelect?.(fmt.id)} sx={{ p: 1.5, borderRadius: radius.lg, border: `1px solid ${semantic.border}`, cursor: "pointer", transition: transitions.fast, "&:hover": { bgcolor: semantic.surface, borderColor: semantic.borderHover } }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Icon sx={{ fontSize: 18, color: semantic.textTertiary }} />
              <Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{fmt.label}</Typography>
                {fmt.ext && <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>{fmt.ext}</Typography>}
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
