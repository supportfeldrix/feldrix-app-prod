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

import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function getScoreColor(score, palette) {
  if (score >= 85) return palette.success.main;
  if (score >= 70) return palette.success.light;
  if (score >= 50) return palette.warning.main;
  if (score >= 30) return palette.warning.dark;
  return palette.error.main;
}

const SCORE_FACTORS = [
  "Vaccination Status",
  "Treatment Records",
  "Follow-up Compliance",
  "Disease Monitoring",
  "Record Completeness",
  "Recent Health Activity",
];

export default function AnimalHealthScore({ analytics }) {
  const theme = useTheme();
  const { palette } = theme;

  if (!analytics || !analytics.available) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <LocalHospitalIcon sx={{ fontSize: 22, color: "error.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Animal Health Score
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Typography color="text.secondary" variant="body2">
            Add health records to see your Animal Health Score.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { healthScore, healthStatus } = analytics;
  const color = getScoreColor(healthScore, palette);

  return (
    <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <LocalHospitalIcon sx={{ fontSize: 22, color: "error.main" }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Animal Health Score
          </Typography>
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        <Stack spacing={2.5} alignItems="center" sx={{ flex: 1, justifyContent: "center" }}>
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
              {healthScore}
            </Typography>
          </Box>

          <Typography variant="body1" fontWeight={700} sx={{ color }}>
            {healthStatus}
          </Typography>

          <Box sx={{ width: "100%" }}>
            <LinearProgress
              variant="determinate"
              value={healthScore}
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

          <Stack direction="row" spacing={3} justifyContent="center">
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {analytics.animalsUpToDate}
              </Typography>
              <Typography variant="caption" color="text.secondary">Up To Date</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {analytics.overdueTreatments}
              </Typography>
              <Typography variant="caption" color="text.secondary">Overdue</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {analytics.activeTreatments}
              </Typography>
              <Typography variant="caption" color="text.secondary">Active</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Score explanation */}
        <Divider sx={{ mt: 2, mb: 1.5 }} />
        <Stack direction="row" spacing={0.75} alignItems="flex-start">
          <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.disabled", mt: 0.2 }} />
          <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.5 }}>
            Based on: {SCORE_FACTORS.join(" • ")}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
