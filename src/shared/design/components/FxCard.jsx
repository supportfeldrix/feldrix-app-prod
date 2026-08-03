/**
 * Feldrix Design System — FxCard
 * Base card component shared across both apps.
 */

import { Box } from "@mui/material";
import { radius, shadows, spacing, transitions, interactions } from "../tokens";

export default function FxCard({ children, hover = false, sx = {}, ...props }) {
  return (
    <Box
      sx={{
        p: spacing.cardPx,
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: "1px solid rgba(15,23,42,0.06)",
        boxShadow: shadows.card,
        transition: transitions.normal,
        ...(hover && {
          cursor: "pointer",
          "&:hover": interactions.cardHover,
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
