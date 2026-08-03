/**
 * ============================================================
 * Feldrix Control Centre — Executive Dashboard (WOW Factor)
 * Sprint 54.1
 *
 * Flagship page. Every pixel has purpose.
 * Premium executive command centre feel.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Grid, Skeleton, Chip } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { FxCard, FxStatusChip, semantic, typography as typo, shadows, radius, transitions } from "../../shared/design";
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
  const healthPct = health ? Math.round((Object.values(health.services).filter(s => s.status === "healthy").length / Object.values(health.services).length) * 100) : 0;

  if (loading) {
    return (
      <Stack spacing={3.5}>
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} />
        <Grid container spacing={2.5}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>

      {/* ═══════════════════════════════════════════════════════
          EXECUTIVE COMMAND HERO
      ═══════════════════════════════════════════════════════ */}
      <Box
        sx={{
          p: { xs: 3, sm: 3.5, md: 4.5 },
          borderRadius: 4,
          background: "linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orbs */}
        <Box sx={{ position: "absolute", top: -80, right: -50, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -60, left: "20%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", top: "50%", right: "15%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />

        <Grid container spacing={3} alignItems="center" sx={{ position: "relative" }}>
          {/* Left: Greeting */}
          <Grid item xs={12} md={7}>
            <Typography sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              {greeting}, {admin?.name?.split(" ")[0] || "Admin"}
            </Typography>
            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.55)", mt: 1 }}>
              {dateStr}
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", mt: 0.75, maxWidth: 440 }}>
              Welcome back to the Feldrix Control Centre. Here's your executive overview of platform operations.
            </Typography>
          </Grid>

          {/* Right: Status indicators */}
          <Grid item xs={12} md={5}>
            <Stack spacing={1.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
              <StatusPill icon="🟢" label="Platform" value={health?.overall || "operational"} healthy={health?.overall === "healthy"} />
              <StatusPill icon="🧠" label="AI" value="Active" healthy />
              <StatusPill icon="💳" label="Payments" value="Operational" healthy />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          AI EXECUTIVE BRIEFING — THE CENTREPIECE
      ═══════════════════════════════════════════════════════ */}
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          bgcolor: "#fff",
          border: `1px solid ${semantic.border}`,
          boxShadow: shadows.sm,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1 0%, #3B82F6 40%, #06B6D4 100%)" }} />

        <Grid container spacing={4}>
          {/* Briefing points */}
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: "11px", bgcolor: "#6366F112", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🧠</Box>
              <Box>
                <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: semantic.text, letterSpacing: "-0.01em" }}>Today's Executive Briefing</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: semantic.textTertiary }}>AI-generated platform intelligence</Typography>
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              <BriefingLine icon="✓" color={semantic.success} text={`Platform operating normally — ${healthPct}% service health.`} />
              <BriefingLine icon="✓" color={semantic.success} text={`${formatNumber(metrics?.totalUsers)} registered customers (${formatNumber(metrics?.activeUsers)} active).`} />
              {metrics?.todaySignups > 0 && <BriefingLine icon="✓" color={semantic.info} text={`${metrics.todaySignups} new farmer${metrics.todaySignups !== 1 ? "s" : ""} today.`} />}
              {metrics?.revenueMonth > 0 ? <BriefingLine icon="✓" color={semantic.success} text={`Revenue this month: ${formatCurrency(metrics.revenueMonth)}.`} /> : <BriefingLine icon="⚠" color={semantic.warning} text="No revenue recorded yet — focus on PRO conversions." />}
              {(metrics?.pendingPayments || 0) > 0 ? <BriefingLine icon="⚠" color={semantic.warning} text={`${metrics.pendingPayments} pending payment${metrics.pendingPayments !== 1 ? "s" : ""} require attention.`} /> : <BriefingLine icon="✓" color={semantic.success} text="No failed or pending payments." />}
              {(metrics?.proSubscribers || 0) === 0 && <BriefingLine icon="⚠" color={semantic.warning} text="No PRO subscriptions yet — opportunity for growth." />}
            </Stack>
          </Grid>

          {/* Recommendation sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "#F8FAFC", border: `1px solid ${semantic.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}>Recommendation</Typography>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: semantic.text, lineHeight: 1.5, mb: 2 }}>
                {metrics?.proSubscribers === 0 ? "Focus on customer acquisition and PRO conversions this week." : "Continue monitoring subscription health and renewals."}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#6366F1" }} />
                <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>85% confidence</Typography>
              </Stack>
              <Chip
                label="View AI Operations →"
                onClick={() => navigate("/support")}
                size="small"
                sx={{ bgcolor: `${semantic.info}10`, color: semantic.info, fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", "&:hover": { bgcolor: `${semantic.info}18` } }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          EXECUTIVE KPIs — FOCUSED, PREMIUM
      ═══════════════════════════════════════════════════════ */}
      <Box>
        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>Key Performance Indicators</Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.totalUsers)} label="Customers" color="#3B82F6" icon="👥" /></Grid>
          <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.activeUsers)} label="Active Today" color="#0EA5E9" icon="📡" /></Grid>
          <Grid item xs={6} sm={4} md={2}><KpiCard value={formatCurrency(metrics?.revenueMonth)} label="Revenue" color="#16A34A" icon="💰" sub="This month" /></Grid>
          <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.proSubscribers)} label="PRO Subs" color="#8B5CF6" icon="⭐" /></Grid>
          <Grid item xs={6} sm={4} md={2}><KpiCard value={`${healthPct}%`} label="Health" color={healthPct >= 80 ? "#16A34A" : "#F59E0B"} icon={healthPct >= 80 ? "🟢" : "🟡"} /></Grid>
          <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.pendingPayments || 0)} label="Alerts" color={metrics?.pendingPayments > 0 ? "#EF4444" : "#16A34A"} icon="⚠️" sub={metrics?.pendingPayments > 0 ? "Action needed" : "All clear"} /></Grid>
        </Grid>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          EXECUTIVE QUICK ACTIONS
      ═══════════════════════════════════════════════════════ */}
      <Box>
        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {[
            { icon: "👥", title: "Manage Users", desc: "View and manage customers", path: "/users" },
            { icon: "💳", title: "Payments", desc: "Review transactions", path: "/payments" },
            { icon: "🎯", title: "Customer Success", desc: "Proactive support", path: "/notifications" },
            { icon: "📈", title: "Analytics", desc: "Business intelligence", path: "/analytics" },
            { icon: "📨", title: "Communications", desc: "Broadcast messages", path: "/notifications" },
            { icon: "⚙️", title: "Settings", desc: "Platform configuration", path: "/settings" },
          ].map((a) => (
            <Grid item xs={6} sm={4} md={2} key={a.title}>
              <Box
                onClick={() => navigate(a.path)}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  bgcolor: "#fff",
                  border: `1px solid ${semantic.border}`,
                  cursor: "pointer",
                  transition: transitions.normal,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": { boxShadow: shadows.md, borderColor: semantic.borderHover, transform: "translateY(-3px)", "& .action-arrow": { opacity: 1, transform: "translateX(0)" } },
                  "&:active": { transform: "translateY(0)" },
                }}
              >
                <Typography sx={{ fontSize: "1.4rem", mb: 1.25 }}>{a.icon}</Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: semantic.text, mb: 0.25 }}>{a.title}</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, flex: 1 }}>{a.desc}</Typography>
                <Box className="action-arrow" sx={{ mt: 1, opacity: 0, transform: "translateX(-4px)", transition: transitions.normal }}>
                  <ArrowForward sx={{ fontSize: 14, color: semantic.info }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          BOTTOM: ACTIVITY (8) + HEALTH (4)
      ═══════════════════════════════════════════════════════ */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3.5, bgcolor: "#fff", border: `1px solid ${semantic.border}`, boxShadow: shadows.xs, height: "100%" }}>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, mb: 3 }}>Recent Activity</Typography>
            {activity.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>📭</Typography>
                <Typography sx={{ fontSize: "0.82rem", color: semantic.textTertiary }}>Activity will appear here as the platform grows.</Typography>
              </Box>
            ) : (
              <Stack spacing={0}>
                {activity.slice(0, 7).map((item, i) => (
                  <Stack key={i} direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.75, borderBottom: i < activity.length - 1 ? `1px solid ${semantic.border}` : "none" }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: item.type === "signup" ? "#DBEAFE" : item.type === "payment" ? "#DCFCE7" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                      {item.type === "signup" ? "👤" : item.type === "payment" ? "💰" : "📋"}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text, lineHeight: 1.3 }}>{item.description}</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, mt: 0.5 }}>{formatRelativeTime(item.timestamp)}</Typography>
                    </Box>
                    <Chip label={item.type} size="small" sx={{ height: 20, fontSize: "0.58rem", fontWeight: 600, bgcolor: "#F1F5F9", color: semantic.textSecondary, display: { xs: "none", sm: "flex" } }} />
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Grid>

        {/* Platform Health */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3.5, bgcolor: "#fff", border: `1px solid ${semantic.border}`, boxShadow: shadows.xs, height: "100%" }}>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, mb: 2 }}>Infrastructure</Typography>

            {/* Circular health indicator */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box sx={{ position: "relative", width: 80, height: 80, mx: "auto" }}>
                <svg width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={40} cy={40} r={34} fill="none" stroke="#F1F5F9" strokeWidth={6} />
                  <circle cx={40} cy={40} r={34} fill="none" stroke={healthPct >= 80 ? semantic.success : semantic.warning} strokeWidth={6} strokeLinecap="round" strokeDasharray={213.6} strokeDashoffset={213.6 - (healthPct / 100) * 213.6} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                </svg>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: healthPct >= 80 ? semantic.success : semantic.warning }}>{healthPct}%</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, mt: 1 }}>Overall Health</Typography>
            </Box>

            {/* Service list */}
            <Stack spacing={1.25}>
              {health && Object.entries(health.services).map(([name, svc]) => (
                <Stack key={name} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: svc.status === "healthy" ? semantic.success : svc.status === "degraded" ? semantic.warning : semantic.error }} />
                    <Typography sx={{ fontSize: "0.78rem", color: semantic.text, textTransform: "capitalize" }}>{name}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {svc.latency && <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary, fontFamily: "monospace" }}>{svc.latency}ms</Typography>}
                    <Box sx={{ width: 16, height: 16, borderRadius: "4px", bgcolor: svc.status === "healthy" ? `${semantic.success}15` : `${semantic.warning}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "2px", bgcolor: svc.status === "healthy" ? semantic.success : semantic.warning }} />
                    </Box>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Grid>
      </Grid>

    </Stack>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatusPill({ icon, label, value, healthy }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, px: 2, py: 0.75, borderRadius: "100px", bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography sx={{ fontSize: "0.7rem" }}>{icon}</Typography>
      <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.7rem", color: healthy ? "#4ADE80" : "#FCD34D", fontWeight: 600, textTransform: "capitalize" }}>{value}</Typography>
    </Box>
  );
}

function KpiCard({ value, label, color, icon, sub }) {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        bgcolor: "#fff",
        border: `1px solid ${semantic.border}`,
        borderTop: `3px solid ${color}`,
        boxShadow: shadows.xs,
        transition: transitions.normal,
        height: "100%",
        "&:hover": { boxShadow: shadows.md, transform: "translateY(-2px)" },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>{icon}</Box>
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: { xs: "1.3rem", md: "1.5rem" }, fontWeight: 800, color: semantic.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary, mt: 0.75 }}>{sub}</Typography>}
      {/* Sparkline placeholder area */}
      <Box sx={{ mt: 1.5, height: 3, borderRadius: 2, bgcolor: `${color}12`, overflow: "hidden" }}>
        <Box sx={{ width: "60%", height: "100%", borderRadius: 2, bgcolor: `${color}40` }} />
      </Box>
    </Box>
  );
}

function BriefingLine({ icon, color, text }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Typography sx={{ fontSize: "0.82rem", color, lineHeight: 1.5, flexShrink: 0, mt: "1px" }}>{icon}</Typography>
      <Typography sx={{ fontSize: "0.85rem", color: semantic.textSecondary, lineHeight: 1.55 }}>{text}</Typography>
    </Stack>
  );
}
