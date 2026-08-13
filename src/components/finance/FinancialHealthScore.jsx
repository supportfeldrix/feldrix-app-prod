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

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { componentSize } from "../../design/tokens";

function getScoreColor(score, palette) {
  if (score >= 80) return palette.success.main;
  if (score >= 60) return palette.success.light;
  if (score >= 40) return palette.warning.main;
  return palette.error.main;
}

function getStatus(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
}

function calculateFinancialScore(analytics) {
  if (!analytics || !analytics.available) return 0;

  let score = 50;

  const margin = analytics.profitMargin || 0;
  if (margin >= 30) score += 30;
  else if (margin >= 20) score += 25;
  else if (margin >= 10) score += 15;
  else if (margin >= 0) score += 5;
  else score -= 10;

  if (analytics.monthlyTrend === "up") score += 10;
  else if (analytics.monthlyTrend === "down") score -= 5;

  if (analytics.totalIncome > 0) score += 10;

  return Math.max(0, Math.min(100, score));
}

const SCORE_FACTORS = [
  "Profit Margin",
  "Monthly Trend",
  "Income Diversity",
  "Revenue Growth",
];

export default function FinancialHealthScore({ analytics }) {
  const theme = useTheme();
  const { palette } = theme;

  if (!analytics || !analytics.available) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 22, color: "secondary.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Financial Health Score
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Typography color="text.secondary" variant="body2">
            Record income and expenses to generate your financial health score.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const score = calculateFinancialScore(analytics);
  const color = getScoreColor(score, palette);
  const status = getStatus(score);

  return (
    <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 22, color: "secondary.main" }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Financial Health Score
          </Typography>
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        <Stack spacing={2.5} alignItems="center" sx={{ flex: 1, justifyContent: "center" }}>
          {/* Score circle */}
          <Box
            sx={{
              width: componentSize.scoreCircle,
              height: componentSize.scoreCircle,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `${componentSize.scoreCircleBorder}px solid ${color}`,
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
                height: componentSize.progressBar,
                borderRadius: componentSize.progressBar / 2,
                bgcolor: palette.action.hover,
                "& .MuiLinearProgress-bar": {
                  borderRadius: componentSize.progressBar / 2,
                  bgcolor: color,
                },
              }}
            />
          </Box>

          {/* Quick stats */}
          <Stack direction="row" spacing={3} justifyContent="center">
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {(analytics.profitMargin || 0).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Margin</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                R {Number(analytics.totalIncome || 0).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">Income</Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {analytics.monthlyTrend === "up" ? "\u2191" : analytics.monthlyTrend === "down" ? "\u2193" : "\u2192"}
              </Typography>
              <Typography variant="caption" color="text.secondary">Trend</Typography>
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
