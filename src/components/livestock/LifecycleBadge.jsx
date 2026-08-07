/**
 * Feldrix — Livestock Lifecycle Badge
 * Displays the automatically calculated growth stage.
 */

import { Chip, Tooltip } from "@mui/material";
import { getLifecycleStage, getStageColor } from "../../services/livestockLifecycle";

export default function LifecycleBadge({ animal, size = "small" }) {
  const { stage, ageLabel, nextStage, nextStageDate } = getLifecycleStage(animal);

  if (!stage) {
    return (
      <Chip
        label="No DOB"
        size={size}
        sx={{ fontSize: "0.65rem", fontWeight: 600, bgcolor: "#F8FAFC", color: "#94A3B8" }}
      />
    );
  }

  const { color, bg } = getStageColor(stage);

  const tooltip = nextStage
    ? `${ageLabel} — Next: ${nextStage} (${nextStageDate || "soon"})`
    : `${ageLabel} — Mature`;

  return (
    <Tooltip title={tooltip} arrow>
      <Chip
        label={stage}
        size={size}
        sx={{
          fontWeight: 700,
          fontSize: size === "small" ? "0.65rem" : "0.75rem",
          bgcolor: bg,
          color: color,
          border: `1px solid ${color}25`,
        }}
      />
    </Tooltip>
  );
}
