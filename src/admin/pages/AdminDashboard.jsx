/**
 * ============================================================
 * Feldrix Control Centre — Executive Dashboard (Production)
 * Sprint 46.3
 *
 * KPI overview with real production data, AI summary, system health.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, CircularProgress, Chip } from "@mui/material";
import AdminStatCard from "../components/shared/AdminStatCard";
import { useAdminContext } from "../context/AdminContext";
import { getDashboardMetrics, getRecentActivity } from "../services/adminAnalyticsService";
import { getSystemHealth } from "../services/adminSystemService";
import { formatNumber, formatCurrency, formatRelativeTime } from "../utils/adminFormatters";
import { ADMIN_THEME } from "../utils/adminConstants";

export default function AdminDashboard() {
  const { admin } = useAdminContext();
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, h, a] = await Promise.all([
          getDashboardMetrics(),
          getSystemHealth(),
          getRecentActivity(),
        ]);
        setMetrics(m);
        setHealth(h);
        setActivity(a);
      } catch (err) {
        console.warn("[Admin Dashboard] Load failed:", err?.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <CircularProgress size={32} sx={{ color: ADMIN_THEME.primary }} />
      </Box>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Box>
        <Typography sx={{ fontSize: { xs: "1.3rem", md: "1.6rem" }, fontWeight: 800, color: ADMIN_THEME.text, letterSpacing: "-0.02em" }}>
          {greeting}, {admin?.name?.split(" ")[0] || "Admin"}
        </Typography>
        <Typography sx={{ fontSize: "0.88rem", color: ADMIN_THEME.textSecondary, mt: 0.25 }}>
          Welcome back to the Feldrix Control Centre.
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: ADMIN_THEME.textSecondary, mt: 0.25 }}>
          Here's what's happening across the platform today.
        </Typography>
      </Box>

      {/* AI Executive Summary */}
      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          bgcolor: "#fff",
          border: `1px solid ${ADMIN_THEME.cardBorder}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent bar */}
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${ADMIN_THEME.primary}, ${ADMIN_THEME.accent})` }} />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "1rem" }}>🧠</Typography>
          <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: ADMIN_THEME.text }}>
            Platform Summary
          </Typography>
          <Chip label="AI" size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 700, bgcolor: `${ADMIN_THEME.primary}12`, color: ADMIN_THEME.primary }} />
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2.4}>
            <SummaryMetric label="New Today" value={formatNumber(metrics?.todaySignups)} />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <SummaryMetric label="Total Users" value={formatNumber(metrics?.totalUsers)} />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <SummaryMetric label="Active" value={formatNumber(metrics?.activeUsers)} />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <SummaryMetric label="Livestock" value={formatNumber(metrics?.totalLivestock)} />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <SummaryMetric label="System" value={health?.overall || "—"} color={health?.overall === "healthy" ? "#16A34A" : "#F59E0B"} />
          </Grid>
        </Grid>
      </Box>

      {/* Primary KPIs */}
      <Box>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.textSecondary, mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Key Metrics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="👥" label="Total Users" value={formatNumber(metrics?.totalUsers)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="✅" label="Active Users" value={formatNumber(metrics?.activeUsers)} color="#16A34A" />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="🆕" label="Today's Signups" value={formatNumber(metrics?.todaySignups)} color="#3B82F6" />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="⭐" label="PRO Subscribers" value={formatNumber(metrics?.proSubscribers)} color="#8B5CF6" subtitle={metrics?.proSubscribers === 0 ? "No subscriptions yet" : undefined} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="💰" label="Monthly Revenue" value={formatCurrency(metrics?.monthlyRevenue)} color="#F59E0B" />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="⏳" label="Pending Payments" value={formatNumber(metrics?.pendingPayments)} color="#EF4444" />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="🐄" label="Livestock Records" value={formatNumber(metrics?.totalLivestock)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="🌾" label="Crop Records" value={formatNumber(metrics?.totalCrops)} />
          </Grid>
        </Grid>
      </Box>

      {/* Platform Data */}
      <Box>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.textSecondary, mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Platform Activity
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="📋" label="Planner Tasks" value={formatNumber(metrics?.totalTasks)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="💳" label="Finance Records" value={formatNumber(metrics?.totalFinanceRecords)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="🚜" label="Machinery" value={formatNumber(metrics?.totalMachinery)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="❤️" label="Health Records" value={formatNumber(metrics?.totalHealthRecords)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="🐂" label="Breeding Records" value={formatNumber(metrics?.totalBreedingRecords)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="📊" label="Onboarding %" value={`${metrics?.avgOnboardingCompletion || 0}%`} color="#6366F1" />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="🔄" label="30-Day Active" value={formatNumber(metrics?.recentActiveUsers)} subtitle="Users with recent login" color="#0EA5E9" />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <AdminStatCard icon="🚫" label="Suspended" value={formatNumber(metrics?.suspendedUsers)} color="#EF4444" />
          </Grid>
        </Grid>
      </Box>

      {/* System Health */}
      <Box>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.textSecondary, mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          System Health
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {health && Object.entries(health.services).map(([key, svc]) => (
            <Chip
              key={key}
              label={`${key}${svc.latency ? ` ${svc.latency}ms` : ""}`}
              size="small"
              sx={{
                bgcolor: svc.status === "healthy" ? "#DCFCE7" : svc.status === "degraded" ? "#FEF3C7" : "#FEE2E2",
                color: svc.status === "healthy" ? "#166534" : svc.status === "degraded" ? "#92400E" : "#991B1B",
                fontWeight: 600,
                fontSize: "0.72rem",
                textTransform: "capitalize",
                "& .MuiChip-label": { px: 1.5 },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Recent Activity */}
      {activity.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.textSecondary, mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Recent Activity
          </Typography>
          <Stack spacing={1}>
            {activity.map((item, i) => (
              <Box
                key={i}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: "#fff",
                  border: `1px solid ${ADMIN_THEME.cardBorder}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography sx={{ fontSize: "0.82rem", color: ADMIN_THEME.text }}>
                  {item.description}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: ADMIN_THEME.textSecondary, flexShrink: 0, ml: 2 }}>
                  {formatRelativeTime(item.timestamp)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Future Revenue Metrics */}
      <Box>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.textSecondary, mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Revenue Metrics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <AdminStatCard icon="📈" label="MRR" value={formatCurrency(metrics?.mrr)} color="#6366F1" subtitle={metrics?.mrr === 0 ? "No revenue yet" : undefined} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <AdminStatCard icon="📊" label="ARR" value={formatCurrency(metrics?.arr)} color="#6366F1" subtitle={metrics?.arr === 0 ? "Projected" : undefined} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <AdminStatCard icon="📉" label="Churn" value="—" color="#6366F1" subtitle="Requires 3+ months of data" />
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );
}

// ─── Helper Component ────────────────────────────────────────

function SummaryMetric({ label, value, color }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: color || ADMIN_THEME.text, lineHeight: 1.2, textTransform: "capitalize" }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: ADMIN_THEME.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}
