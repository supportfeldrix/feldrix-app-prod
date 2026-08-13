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

import FavoriteIcon from "@mui/icons-material/Favorite";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function getScoreColor(score, palette) {
  if (score >= 85) return palette.success.main;
  if (score >= 70) return palette.success.light;
  if (score >= 50) return palette.warning.main;
  if (score >= 30) return palette.warning.dark;
  return palette.error.main;
}

const SCORE_FACTORS = [
  "Pregnancy Rate",
  "Birth Success",
  "Record Completeness",
  "Monitoring Activity",
  "Calving Timeliness",
];

export default function BreedingPerformanceScore({ analytics }) {
  const theme = useTheme();
  const { palette } = theme;

  if (!analytics || !analytics.available) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <FavoriteIcon sx={{ fontSize: 22, color: "error.light" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Breeding Performance
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Typography color="text.secondary" variant="body2">
            Add breeding records to see your performance score.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { breedingScore, breedingStatus } = analytics;
  const color = getScoreColor(breedingScore, palette);

  return (
    <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <FavoriteIcon sx={{ fontSize: 22, color: "error.light" }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Breeding Performance
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
              {breedingScore}
            </Typography>
          </Box>

          <Typography variant="body1" fontWeight={700} sx={{ color }}>
            {breedingStatus}
          </Typography>

          <Box sx={{ width: "100%" }}>
            <LinearProgress
              variant="determinate"
              value={breedingScore}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: palette.action.hover,
                "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: color },
              }}
            />
          </Box>

          <Stack direction="row" spacing={3} justifyContent="center">
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">{analytics.pregnantAnimals}</Typography>
              <Typography variant="caption" color="text.secondary">Pregnant</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">{analytics.expectedBirths}</Typography>
              <Typography variant="caption" color="text.secondary">Due Soon</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">{analytics.breedingSuccessRate}%</Typography>
              <Typography variant="caption" color="text.secondary">Success</Typography>
            </Stack>
          </Stack>
        </Stack>

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
