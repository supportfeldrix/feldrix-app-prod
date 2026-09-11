/**
 * Feldrix — Livestock Lifecycle Badge
 * Displays the automatically calculated growth stage.
 */

import { Chip, Tooltip } from "@mui/material";
import { getLifecycleStage, getStageColor } from "../../services/livestockLifecycle";

export default function LifecycleBadge({ animal, size = "small" }) {
  const { stage, ageLabel, nextStage, nextStageDate } = getLifecycleStage(animal);

  // A genuinely missing birth date is the ONLY case that shows "No DOB".
  // getLifecycleStage returns ageLabel "Birth date not set" only when no DOB
  // exists. Species without a validated stage model (e.g. Bison, Horse, Rabbit)
  // still have a DOB + a computed age — they must NOT be labelled "No DOB".
  const hasDob = ageLabel && ageLabel !== "Birth date not set";

  if (!hasDob) {
    return (
      <Chip
        label="No DOB"
        size={size}
        sx={{ fontSize: "0.65rem", fontWeight: 600, bgcolor: "#F8FAFC", color: "#94A3B8" }}
      />
    );
  }

  // DOB present but no growth-stage model for this species: show the age (never
  // fabricated — it comes from the stored DOB) instead of a stage label.
  if (!stage) {
    return (
      <Tooltip title={`Age: ${ageLabel}`} arrow>
        <Chip
          label={ageLabel}
          size={size}
          sx={{ fontSize: size === "small" ? "0.65rem" : "0.75rem", fontWeight: 600, bgcolor: "#F1F5F9", color: "#475569" }}
        />
      </Tooltip>
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
