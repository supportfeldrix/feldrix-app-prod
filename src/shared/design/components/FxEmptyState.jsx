/**
 * Feldrix Design System — FxEmptyState
 * Consistent empty state display.
 */

import { Box, Typography } from "@mui/material";
import { radius, semantic } from "../tokens";

export default function FxEmptyState({ icon = "📭", title = "No data", description, action, sx = {} }) {
  return (
    <Box
      sx={{
        p: { xs: 4, md: 5 },
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: `1px dashed ${semantic.border}`,
        textAlign: "center",
        ...sx,
      }}
    >
      <Typography sx={{ fontSize: "2rem", mb: 1.5 }}>{icon}</Typography>
      <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: semantic.text, mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary, mb: action ? 2.5 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
