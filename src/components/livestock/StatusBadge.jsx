/**
 * Feldrix — Livestock Status Badge
 * Color-coded chip showing the animal's lifecycle status.
 */

import { Chip } from "@mui/material";
import { getStatusConfig } from "../../constants/livestockStatus";

export default function StatusBadge({ status, size = "small", onClick }) {
  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      size={size}
      onClick={onClick}
      sx={{
        fontWeight: 700,
        fontSize: size === "small" ? "0.7rem" : "0.8rem",
        bgcolor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}25`,
        cursor: onClick ? "pointer" : "default",
      }}
    />
  );
}
