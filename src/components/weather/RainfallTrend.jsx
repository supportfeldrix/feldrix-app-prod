/**
 * Feldrix — Rainfall Trend
 *
 * Simple bar chart of FARMER-RECORDED rainfall (mm) by date, with a
 * 7 / 30 / 90 day range selector and headline totals. Uses recharts
 * (already a project dependency) — no new chart library added.
 *
 * Uses ONLY rainfall_logs data passed in. Never weather-service data.
 */

import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Chip, Grid, Stack, Typography,
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const RANGES = [
  { key: 7, label: "7 Days" },
  { key: 30, label: "30 Days" },
  { key: 90, label: "90 Days" },
];

function toDateOnly(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function shortLabel(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export default function RainfallTrend({ logs = [] }) {
  const [rangeDays, setRangeDays] = useState(30);

  const { chartData, total, rainyDays, average, hasData } = useMemo(() => {
    const today = toDateOnly(new Date());
    const start = toDateOnly(new Date());
    start.setDate(start.getDate() - (rangeDays - 1)); // inclusive window

    // Aggregate mm per date within the window (multiple logs per day sum).
    const byDate = new Map();
    for (const r of logs) {
      if (!r.rainfall_date) continue;
      const d = toDateOnly(r.rainfall_date + "T00:00:00");
      if (d < start || d > today) continue;
      const amount = Number(r.amount_mm) || 0;
      byDate.set(r.rainfall_date, (byDate.get(r.rainfall_date) || 0) + amount);
    }

    const rows = [...byDate.entries()]
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, mm]) => ({ date, label: shortLabel(date), mm: Math.round(mm * 10) / 10 }));

    const totalMm = rows.reduce((s, r) => s + r.mm, 0);
    const rainy = rows.filter((r) => r.mm > 0).length;
    const avg = rainy > 0 ? totalMm / rainy : 0;

    return {
      chartData: rows,
      total: Math.round(totalMm * 10) / 10,
      rainyDays: rainy,
      average: Math.round(avg * 10) / 10,
      hasData: rows.length > 0,
    };
  }, [logs, rangeDays]);

  const activeLabel = RANGES.find((r) => r.key === rangeDays)?.label || "";

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header + range selector */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ShowChartIcon sx={{ color: "#1976D2" }} />
            <Typography variant="h6" fontWeight={700}>Rainfall Trend</Typography>
            <Typography variant="body2" color="text.secondary">Last {activeLabel}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {RANGES.map((r) => (
              <Chip
                key={r.key}
                label={r.label}
                size="small"
                onClick={() => setRangeDays(r.key)}
                variant={rangeDays === r.key ? "filled" : "outlined"}
                color={rangeDays === r.key ? "primary" : "default"}
                sx={{ fontWeight: 600, cursor: "pointer", fontSize: "0.7rem" }}
              />
            ))}
          </Stack>
        </Stack>

        {/* Totals */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <TotalItem label="Total" value={`${total} mm`} />
          <TotalItem label="Rainy Days" value={`${rainyDays}`} />
          <TotalItem label="Average" value={`${average} mm`} hint="per rainy day" />
        </Grid>

        {/* Chart or limited-data state */}
        {hasData ? (
          <Box sx={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  unit=""
                />
                <Tooltip
                  formatter={(v) => [`${v} mm`, "Rainfall"]}
                  labelFormatter={(l) => l}
                  contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
                />
                <Bar dataKey="mm" fill="#1976D2" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">
              Not enough rainfall recorded in the last {activeLabel.toLowerCase()} to show a trend.
            </Typography>
            <Typography variant="caption">
              Log rainfall to start building your farm's trend.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function TotalItem({ label, value, hint }) {
  return (
    <Grid size={{ xs: 4 }}>
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: 0.4, fontSize: "0.6rem", fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: "#1976D2" }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Grid>
  );
}
