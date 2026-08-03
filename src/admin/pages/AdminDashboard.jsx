/**
 * ============================================================
 * Feldrix Control Centre — Executive Dashboard
 * Sprint 47.3 — Uses shared Feldrix Design System
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, CircularProgress, Chip } from "@mui/material";
import { FxStatCard, FxCard, FxStatusChip, semantic, typography as typo } from "../../shared/design";
import { useAdminContext } from "../context/AdminContext";
import { getDashboardMetrics, getRecentActivity } from "../services/adminAnalyticsService";
import { getSystemHealth } from "../services/adminSystemService";
import { formatNumber, formatCurrency, formatRelativeTime } from "../utils/adminFormatters";

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
        <CircularProgress size={32} color="primary" />
      </Box>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Stack spacing={3.5}>
      {/* Header */}
      <Box>
        <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>
          {greeting}, {admin?.name?.split(" ")[0] || "Admin"}
        </Typography>
        <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
          Welcome back to the Feldrix Control Centre.
        </Typography>
        <Typography sx={{ ...typo.bodySmall, color: semantic.textTertiary, mt: 0.25 }}>
          Here's what's happening across the platform today.
        </Typography>
      </Box>

      {/* AI Executive Summary */}
      <FxCard sx={{ position: "relative", overflow: "hidden" }}>
        {/* Accent bar */}
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "1rem" }}>🧠</Typography>
          <Typography sx={{ ...typo.cardTitle, color: semantic.text }}>Platform Summary</Typography>
          <Chip label="AI" size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 700, bgcolor: "primary.light", color: "#fff" }} />
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
            <SummaryMetric label="System" value={health?.overall || "—"} color={health?.overall === "healthy" ? semantic.success : semantic.warning} />
          </Grid>
        </Grid>
      </FxCard>

      {/* Key Metrics */}
      <Box>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 1.5 }}>Key Metrics</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="👥" label="Total Users" value={formatNumber(metrics?.totalUsers)} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="✅" label="Active Users" value={formatNumber(metrics?.activeUsers)} color="#16A34A" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🆕" label="Today's Signups" value={formatNumber(metrics?.todaySignups)} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⭐" label="PRO Subscribers" value={formatNumber(metrics?.proSubscribers)} color="#8B5CF6" subtitle={metrics?.proSubscribers === 0 ? "No subscriptions yet" : undefined} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💰" label="Monthly Revenue" value={formatCurrency(metrics?.monthlyRevenue)} color="#F59E0B" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⏳" label="Pending Payments" value={formatNumber(metrics?.pendingPayments)} color="#EF4444" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🐄" label="Livestock Records" value={formatNumber(metrics?.totalLivestock)} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🌾" label="Crop Records" value={formatNumber(metrics?.totalCrops)} /></Grid>
        </Grid>
      </Box>

      {/* Platform Activity */}
      <Box>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 1.5 }}>Platform Activity</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📋" label="Planner Tasks" value={formatNumber(metrics?.totalTasks)} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💳" label="Finance Records" value={formatNumber(metrics?.totalFinanceRecords)} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🚜" label="Machinery" value={formatNumber(metrics?.totalMachinery)} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="❤️" label="Health Records" value={formatNumber(metrics?.totalHealthRecords)} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🐂" label="Breeding Records" value={formatNumber(metrics?.totalBreedingRecords)} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📊" label="Onboarding %" value={`${metrics?.avgOnboardingCompletion || 0}%`} color="#6366F1" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔄" label="30-Day Active" value={formatNumber(metrics?.recentActiveUsers)} subtitle="Recent login" color="#0EA5E9" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🚫" label="Suspended" value={formatNumber(metrics?.suspendedUsers)} color="#EF4444" /></Grid>
        </Grid>
      </Box>

      {/* System Health */}
      <Box>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 1.5 }}>System Health</Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {health && Object.entries(health.services).map(([key, svc]) => (
            <FxStatusChip
              key={key}
              status={svc.status === "healthy" ? "healthy" : svc.status === "degraded" ? "warning" : "critical"}
              label={`${key}${svc.latency ? ` ${svc.latency}ms` : ""}`}
            />
          ))}
        </Stack>
      </Box>

      {/* Recent Activity */}
      {activity.length > 0 && (
        <Box>
          <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 1.5 }}>Recent Activity</Typography>
          <Stack spacing={1}>
            {activity.map((item, i) => (
              <FxCard key={i} sx={{ py: 1.5, px: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ ...typo.bodySmall, color: semantic.text }}>{item.description}</Typography>
                <Typography sx={{ ...typo.caption, color: semantic.textTertiary, flexShrink: 0, ml: 2 }}>{formatRelativeTime(item.timestamp)}</Typography>
              </FxCard>
            ))}
          </Stack>
        </Box>
      )}

      {/* Revenue Metrics */}
      <Box>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 1.5 }}>Revenue Metrics</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}><FxStatCard icon="📈" label="MRR" value={formatCurrency(metrics?.mrr)} color="#6366F1" subtitle={metrics?.mrr === 0 ? "No revenue yet" : undefined} /></Grid>
          <Grid item xs={6} sm={4}><FxStatCard icon="📊" label="ARR" value={formatCurrency(metrics?.arr)} color="#6366F1" subtitle={metrics?.arr === 0 ? "Projected" : undefined} /></Grid>
          <Grid item xs={12} sm={4}><FxStatCard icon="📉" label="Churn" value="—" color="#6366F1" subtitle="Requires 3+ months" /></Grid>
        </Grid>
      </Box>
    </Stack>
  );
}

function SummaryMetric({ label, value, color }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: color || semantic.text, lineHeight: 1.2, textTransform: "capitalize" }}>
        {value}
      </Typography>
      <Typography sx={{ ...typo.tiny, color: semantic.textSecondary, textTransform: "uppercase", mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}
