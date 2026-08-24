import {
  Box,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import GrassIcon from "@mui/icons-material/Grass";

function getScoreColor(score, palette) {
  if (score >= 80) return palette.success.main;
  if (score >= 60) return palette.success.light;
  if (score >= 40) return palette.warning.main;
  return palette.error.main;
}

export default function CropHealthScore({ analytics }) {
  const theme = useTheme();
  const { palette } = theme;

  if (!analytics || !analytics.available) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <GrassIcon sx={{ fontSize: 22, color: "success.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Crop Health Score
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Typography color="text.secondary" variant="body2">
            Add crops to see your Crop Health Score.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { score, status } = analytics;
  const color = getScoreColor(score, palette);

  return (
    <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <GrassIcon sx={{ fontSize: 22, color: "success.main" }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Crop Health Score
          </Typography>
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        <Stack spacing={3} alignItems="center" sx={{ flex: 1, justifyContent: "center" }}>
          {/* Score circle */}
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `4px solid ${color}`,
              bgcolor: `${color}18`,
            }}
          >
            <Typography variant="h3" fontWeight={800} sx={{ color }}>
              {score}
            </Typography>
          </Box>

          <Typography variant="body1" fontWeight={700} sx={{ color }}>
            {status}
          </Typography>

          <Box sx={{ width: "100%" }}>
            <LinearProgress
              variant="determinate"
              value={score}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: palette.action.hover,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  bgcolor: color,
                },
              }}
            />
          </Box>

          {/* Quick stats */}
          <Stack direction="row" spacing={3} justifyContent="center">
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {analytics.activeCrops}
              </Typography>
              <Typography variant="caption" color="text.secondary">Active</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {analytics.harvestReady}
              </Typography>
              <Typography variant="caption" color="text.secondary">Harvest Ready</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {analytics.needsIrrigation}
              </Typography>
              <Typography variant="caption" color="text.secondary">Irrigation Risk</Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
