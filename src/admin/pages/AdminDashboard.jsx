/**
 * ============================================================
 * Feldrix Control Centre — Executive Dashboard (Premium)
 * Sprint 54.0
 *
 * Flagship page. Executive hero, AI briefing, focused KPIs,
 * quick actions, activity timeline, platform health.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Grid, Skeleton, Chip } from "@mui/material";
import { FxStatCard, FxCard, FxStatusChip, semantic, typography as typo, shadows, radius, transitions } from "../../shared/design";
import { useAdminContext } from "../context/AdminContext";
import { getDashboardMetrics, getRecentActivity } from "../services/adminAnalyticsService";
import { getSystemHealth } from "../services/adminSystemService";
import { formatNumber, formatCurrency, formatRelativeTime } from "../utils/adminFormatters";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin } = useAdminContext();
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, h, a] = await Promise.all([getDashboardMetrics(), getSystemHealth(), getRecentActivity()]);
        setMetrics(m); setHealth(h); setActivity(a);
      } catch { /* graceful */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 4 }} />
        <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>

      {/* ═══════ EXECUTIVE HERO ═══════════════════════════════ */}
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #334155 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient orb */}
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -40, left: "30%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ position: "relative" }}>
          <Box>
            <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.8rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {greeting}, {admin?.name?.split(" ")[0] || "Admin"}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", mt: 0.75 }}>
              {dateStr}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
              Welcome back to the Feldrix Control Centre.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: health?.overall === "healthy" ? "#22C55E" : "#F59E0B", boxShadow: `0 0 8px ${health?.overall === "healthy" ? "#22C55E" : "#F59E0B"}60` }} />
            <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              Platform {health?.overall || "operational"}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* ═══════ AI EXECUTIVE BRIEFING ════════════════════════ */}
      <FxCard sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 3.5 } }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #3B82F6, #06B6D4)" }} />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: "1.2rem" }}>🧠</Typography>
          <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: semantic.text, letterSpacing: "-0.01em" }}>Today's Executive Briefing</Typography>
        </Stack>
        <Stack spacing={1.25}>
          <BriefingItem priority="healthy" text={`${formatNumber(metrics?.totalUsers)} registered farmers (${formatNumber(metrics?.activeUsers)} active).`} />
          {metrics?.todaySignups > 0 && <BriefingItem priority="info" text={`${metrics.todaySignups} new farmer${metrics.todaySignups !== 1 ? "s" : ""} joined today.`} />}
          {metrics?.revenueMonth > 0 && <BriefingItem priority="healthy" text={`Revenue this month: ${formatCurrency(metrics.revenueMonth)}.`} />}
          {(metrics?.pendingPayments || 0) > 0 && <BriefingItem priority="warning" text={`${metrics.pendingPayments} pending payment${metrics.pendingPayments !== 1 ? "s" : ""} require attention.`} />}
          <BriefingItem priority={health?.overall === "healthy" ? "healthy" : "warning"} text={`Platform health: ${health?.overall || "operational"}.`} />
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          <Chip
            label="View AI Operations →"
            onClick={() => navigate("/support")}
            sx={{ bgcolor: `${semantic.info}10`, color: semantic.info, fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", "&:hover": { bgcolor: `${semantic.info}18` } }}
          />
        </Box>
      </FxCard>

      {/* ═══════ EXECUTIVE KPIs ═══════════════════════════════ */}
      <Box>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 2 }}>Key Performance Indicators</Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="👥" label="Customers" value={formatNumber(metrics?.totalUsers)} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="📡" label="Active Today" value={formatNumber(metrics?.activeUsers)} color="#0EA5E9" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="💰" label="Revenue" value={formatCurrency(metrics?.revenueMonth)} color="#16A34A" subtitle="This month" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="⭐" label="PRO" value={formatNumber(metrics?.proSubscribers)} color="#8B5CF6" subtitle="Subscribers" /></Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FxStatCard
              icon={health?.overall === "healthy" ? "🟢" : "🟡"}
              label="Health"
              value={health?.overall === "healthy" ? "100%" : "Degraded"}
              color={health?.overall === "healthy" ? "#16A34A" : "#F59E0B"}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="⚠️" label="Alerts" value={metrics?.pendingPayments > 0 ? formatNumber(metrics.pendingPayments) : "0"} color={metrics?.pendingPayments > 0 ? "#EF4444" : "#16A34A"} subtitle={metrics?.pendingPayments > 0 ? "Action needed" : "All clear"} /></Grid>
        </Grid>
      </Box>

      {/* ═══════ QUICK ACTIONS ════════════════════════════════ */}
      <Box>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {[
            { icon: "👥", label: "Manage Users", path: "/users" },
            { icon: "💳", label: "Review Payments", path: "/payments" },
            { icon: "🎯", label: "Customer Success", path: "/notifications" },
            { icon: "📈", label: "Analytics", path: "/analytics" },
            { icon: "📨", label: "Broadcast", path: "/notifications" },
            { icon: "⚙️", label: "Settings", path: "/settings" },
          ].map((action) => (
            <Grid item xs={6} sm={4} md={2} key={action.label}>
              <Box
                onClick={() => navigate(action.path)}
                sx={{
                  p: 2.5,
                  borderRadius: radius.lg,
                  bgcolor: "#fff",
                  border: `1px solid ${semantic.border}`,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: transitions.normal,
                  "&:hover": { boxShadow: shadows.md, borderColor: semantic.borderHover, transform: "translateY(-2px)" },
                  "&:active": { transform: "translateY(0)" },
                }}
              >
                <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>{action.icon}</Typography>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: semantic.text }}>{action.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ═══════ BOTTOM ROW: ACTIVITY + HEALTH ════════════════ */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={7}>
          <FxCard sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
            <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 2.5 }}>Recent Activity</Typography>
            {activity.length === 0 ? (
              <Typography sx={{ ...typo.bodySmall, color: semantic.textTertiary, fontStyle: "italic" }}>No recent activity.</Typography>
            ) : (
              <Stack spacing={2}>
                {activity.slice(0, 6).map((item, i) => (
                  <Stack key={i} direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: `${semantic.info}08`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.9rem" }}>
                      {item.type === "signup" ? "👤" : item.type === "payment" ? "💰" : "📋"}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{item.description}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: semantic.textTertiary, mt: 0.25 }}>{formatRelativeTime(item.timestamp)}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </FxCard>
        </Grid>

        {/* Platform Health */}
        <Grid item xs={12} md={5}>
          <FxCard sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
            <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 2.5 }}>Platform Health</Typography>
            <Stack spacing={1.5}>
              {health && Object.entries(health.services).map(([name, svc]) => (
                <Stack key={name} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: svc.status === "healthy" ? semantic.success : svc.status === "degraded" ? semantic.warning : semantic.error }} />
                    <Typography sx={{ fontSize: "0.82rem", color: semantic.text, textTransform: "capitalize" }}>{name}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {svc.latency && <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>{svc.latency}ms</Typography>}
                    <FxStatusChip status={svc.status === "healthy" ? "healthy" : svc.status === "degraded" ? "warning" : "critical"} />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </FxCard>
        </Grid>
      </Grid>

    </Stack>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function BriefingItem({ priority, text }) {
  const colors = {
    healthy: semantic.success,
    warning: semantic.warning,
    info: semantic.info,
    critical: semantic.error,
  };
  const color = colors[priority] || semantic.textSecondary;

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color, mt: 0.75, flexShrink: 0 }} />
      <Typography sx={{ fontSize: "0.85rem", color: semantic.textSecondary, lineHeight: 1.5 }}>{text}</Typography>
    </Stack>
  );
}
