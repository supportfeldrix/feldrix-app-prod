/**
 * Feldrix Design System — FxStatusChip
 * Universal status indicator chip.
 */

import { Chip } from "@mui/material";
import { statusColors } from "../tokens";

export default function FxStatusChip({ status, label, size = "small", sx = {} }) {
  const config = statusColors[status] || statusColors.inactive;
  const displayLabel = label || config.label || status;

  return (
    <Chip
      label={displayLabel}
      size={size}
      sx={{
        bgcolor: config.bg,
        color: config.text,
        fontWeight: 600,
        fontSize: "0.68rem",
        height: size === "small" ? 22 : 28,
        textTransform: "capitalize",
        ...sx,
      }}
    />
  );
}
