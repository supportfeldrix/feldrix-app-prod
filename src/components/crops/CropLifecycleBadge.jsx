/**
 * Feldrix — Crop Lifecycle Badge
 * Color-coded chip + optional progress bar.
 */

import { Box, Chip, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { getCropLifecycle, getCropStageColor } from "../../utils/cropLifecycle";

export default function CropLifecycleBadge({ crop, showProgress = false, size = "small" }) {
  const lc = getCropLifecycle(crop);

  if (!lc.lifecycleStage) {
    return <Chip label="No Date" size={size} sx={{ fontSize: "0.65rem", fontWeight: 600, bgcolor: "#F8FAFC", color: "#94A3B8" }} />;
  }

  const { color, bg } = getCropStageColor(lc.lifecycleStage);

  const tooltip = lc.daysRemaining != null
    ? `${lc.ageLabel} old · ${lc.daysRemaining} days to harvest · ${lc.progressPercent}% complete`
    : lc.ageLabel;

  if (showProgress) {
    return (
      <Tooltip title={tooltip} arrow>
        <Stack spacing={0.5} sx={{ minWidth: 100 }}>
          <Chip label={lc.lifecycleStage} size={size} sx={{ fontWeight: 700, fontSize: "0.65rem", bgcolor: bg, color, alignSelf: "flex-start" }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={lc.progressPercent}
              sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: `${color}20`, "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }}
            />
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color, minWidth: 28 }}>{lc.progressPercent}%</Typography>
          </Box>
        </Stack>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip} arrow>
      <Chip label={lc.lifecycleStage} size={size} sx={{ fontWeight: 700, fontSize: "0.65rem", bgcolor: bg, color, border: `1px solid ${color}25` }} />
    </Tooltip>
  );
}
