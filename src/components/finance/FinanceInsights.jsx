import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccountBalance,
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";

import { formatCurrency } from "../../utils/currency";
import useFarmContext from "../../hooks/useFarmContext";

function MetricCard({ icon, label, value, color }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          {icon}
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight={700} sx={{ color: color || "inherit" }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function FinanceInsights({ analytics }) {
  const farmCtx = useFarmContext();
  const fmt = (v) => formatCurrency(v, farmCtx);
  if (!analytics || !analytics.available) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <AccountBalance sx={{ fontSize: 22, color: "secondary.main" }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Finance Insights
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ py: 3, textAlign: "center" }}>
            <AccountBalanceWallet sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>
              Not enough financial history yet.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Continue recording income and expenses to unlock financial insights.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const {
    totalIncome = 0,
    totalExpenses = 0,
    netProfit = 0,
    profitMargin = 0,
    largestExpenseCategory,
    largestIncomeSource,
    monthlyTrend,
    insights = [],
  } = analytics;

  const profitColor = netProfit >= 0 ? "success.dark" : "error.main";

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <AccountBalance sx={{ fontSize: 22, color: "secondary.main" }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Finance Insights
          </Typography>
          {monthlyTrend && (
            <Chip
              icon={monthlyTrend === "up" ? <TrendingUp /> : <TrendingDown />}
              label={monthlyTrend === "up" ? "Trending Up" : "Trending Down"}
              size="small"
              color={monthlyTrend === "up" ? "success" : "error"}
              sx={{ fontWeight: 600, fontSize: "0.6rem", height: 20, ml: 1 }}
            />
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Metrics Grid */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MetricCard
              icon={<AccountBalanceWallet sx={{ fontSize: 16, color: "success.dark" }} />}
              label="Total Income"
              value={fmt(totalIncome)}
              color="success.dark"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MetricCard
              icon={<AccountBalanceWallet sx={{ fontSize: 16, color: "error.main" }} />}
              label="Total Expenses"
              value={fmt(totalExpenses)}
              color="error.main"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MetricCard
              icon={netProfit >= 0
                ? <TrendingUp sx={{ fontSize: 16, color: profitColor }} />
                : <TrendingDown sx={{ fontSize: 16, color: profitColor }} />
              }
              label="Net Profit"
              value={fmt(Math.abs(netProfit))}
              color={profitColor}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 14 }}>📊</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Profit Margin
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, profitMargin))}
                    sx={{
                      flex: 1,
                      height: 7,
                      borderRadius: 4,
                      bgcolor: "grey.200",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        bgcolor: profitMargin >= 20 ? "success.dark" : profitMargin >= 10 ? "warning.main" : "error.main",
                      },
                    }}
                  />
                  <Typography variant="body2" fontWeight={700}>
                    {profitMargin.toFixed(1)}%
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MetricCard
              icon={<Typography sx={{ fontSize: 14 }}>🏷</Typography>}
              label="Top Expense"
              value={largestExpenseCategory || "-"}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MetricCard
              icon={<Typography sx={{ fontSize: 14 }}>🐄</Typography>}
              label="Top Income"
              value={largestIncomeSource || "-"}
            />
          </Grid>
        </Grid>

        {/* Insights */}
        {insights.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: "block" }}>
              INSIGHTS
            </Typography>

            <Stack spacing={1}>
              {insights.map((insight, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: insight.severity === "high" ? "error.main" : insight.severity === "medium" ? "warning.main" : "success.dark",
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {insight.message}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}

      </CardContent>
    </Card>
  );
}
