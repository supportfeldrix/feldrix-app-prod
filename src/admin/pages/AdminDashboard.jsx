/**
 * ============================================================
 * Feldrix Control Centre — Executive BI Dashboard (Layout Fix)
 * Version 2.2 — Expanded charts, proper grid, full-width
 * ============================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Grid, Skeleton, Chip } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, Legend } from "recharts";
import { FxCard, FxStatusChip, semantic, typography as typo, shadows, radius, transitions } from "../../shared/design";
import { useAdminContext } from "../context/AdminContext";
import { getDashboardMetrics, getRecentActivity } from "../services/adminAnalyticsService";
import { getSystemHealth } from "../services/adminSystemService";
import { getCustomerGrowth, getRevenueGrowth, getSubscriptionBreakdown, getPlatformActivity, getFeatureUsage, getCustomerHealthDistribution } from "../services/adminBIService";
import { formatNumber, formatCurrency, formatRelativeTime } from "../utils/adminFormatters";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin } = useAdminContext();
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [activity, setActivity] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [subBreakdown, setSubBreakdown] = useState([]);
  const [platformActivity, setPlatformActivity] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [customerHealth, setCustomerHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, h, a, g, r, sb, pa, fu, ch] = await Promise.all([
          getDashboardMetrics(), getSystemHealth(), getRecentActivity(),
          getCustomerGrowth(), getRevenueGrowth(), getSubscriptionBreakdown(),
          getPlatformActivity(), getFeatureUsage(), getCustomerHealthDistribution(),
        ]);
        setMetrics(m); setHealth(h); setActivity(a); setGrowth(g); setRevenue(r);
        setSubBreakdown(sb); setPlatformActivity(pa); setFeatureUsage(fu); setCustomerHealth(ch);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
  const healthPct = health ? Math.round((Object.values(health.services).filter(s => s.status === "healthy").length / Object.values(health.services).length) * 100) : 0;

  if (loading) {
    return (
      <Stack spacing={3.5}>
        <Skeleton variant="rounded" height={150} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 4 }} />
        <Grid container spacing={2.5}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
        <Grid container spacing={3}><Grid item xs={12} md={8}><Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} /></Grid><Grid item xs={12} md={4}><Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} /></Grid></Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      {/* ═══ HERO ═══ */}
      <Box sx={{ p: { xs: 3, md: 4.5 }, borderRadius: 4, background: "linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: -80, right: -50, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Grid container spacing={3} alignItems="center" sx={{ position: "relative" }}>
          <Grid item xs={12} md={7}>
            <Typography sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15 }}>{greeting}, {admin?.name?.split(" ")[0] || "Admin"}</Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", mt: 0.75 }}>{dateStr}</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", mt: 0.5 }}>Your executive command centre for Feldrix operations.</Typography>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={1} alignItems={{ xs: "flex-start", md: "flex-end" }}>
              <StatusPill label="Platform" value={health?.overall || "operational"} healthy={health?.overall === "healthy"} />
              <StatusPill label="Revenue" value={metrics?.revenueMonth > 0 ? "Active" : "None"} healthy={metrics?.revenueMonth > 0} />
              <StatusPill label="Growth" value={metrics?.todaySignups > 0 ? `+${metrics.todaySignups} today` : "Stable"} healthy={metrics?.todaySignups > 0} />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* ═══ AI BRIEFING ═══ */}
      <FxCard sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 } }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #3B82F6, #06B6D4)" }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#6366F112", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🧠</Box>
              <Box><Typography sx={{ fontSize: "1rem", fontWeight: 800, color: semantic.text }}>Executive Briefing</Typography><Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>AI-generated · Updated now</Typography></Box>
            </Stack>
            <Stack spacing={1.25}>
              <BriefingLine icon="✓" color={semantic.success} text={`${formatNumber(metrics?.totalUsers)} customers (${formatNumber(metrics?.activeUsers)} active).`} />
              {metrics?.todaySignups > 0 && <BriefingLine icon="✓" color={semantic.info} text={`${metrics.todaySignups} new today.`} />}
              {metrics?.revenueMonth > 0 ? <BriefingLine icon="✓" color={semantic.success} text={`Revenue: ${formatCurrency(metrics.revenueMonth)} this month.`} /> : <BriefingLine icon="⚠" color={semantic.warning} text="No revenue yet — focus on PRO conversions." />}
              {(metrics?.pendingPayments || 0) > 0 ? <BriefingLine icon="⚠" color={semantic.warning} text={`${metrics.pendingPayments} pending payment(s).`} /> : <BriefingLine icon="✓" color={semantic.success} text="No payment issues." />}
              <BriefingLine icon="✓" color={healthPct >= 80 ? semantic.success : semantic.warning} text={`Platform health: ${healthPct}%.`} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "#F8FAFC", border: `1px solid ${semantic.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}>Today's Priority</Typography>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: semantic.text, lineHeight: 1.5, mb: 2 }}>
                {metrics?.pendingPayments > 0 ? "Review pending payments." : metrics?.proSubscribers === 0 ? "Focus on first PRO conversion." : "Monitor growth and engagement."}
              </Typography>
              <Chip label="View AI Operations →" onClick={() => navigate("/support")} size="small" sx={{ bgcolor: `${semantic.info}10`, color: semantic.info, fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", "&:hover": { bgcolor: `${semantic.info}18` } }} />
            </Box>
          </Grid>
        </Grid>
      </FxCard>

      {/* ═══ KPIs ═══ */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.totalUsers)} label="Customers" color="#3B82F6" icon="👥" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.activeUsers)} label="Active" color="#0EA5E9" icon="📡" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.proSubscribers)} label="PRO" color="#8B5CF6" icon="⭐" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatCurrency(metrics?.revenueMonth)} label="MRR" color="#16A34A" icon="💰" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={`${healthPct}%`} label="Health" color={healthPct >= 80 ? "#16A34A" : "#F59E0B"} icon={healthPct >= 80 ? "🟢" : "🟡"} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.pendingPayments || 0)} label="Alerts" color={metrics?.pendingPayments > 0 ? "#EF4444" : "#16A34A"} icon="⚠️" /></Grid>
      </Grid>

      {/* ═══ CHARTS ROW 1: Customer Growth (8) + Subscriptions (4) ═══ */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ChartCard title="Customer Growth" subtitle="Monthly new & cumulative customers" footer={growth.length > 1 ? `${growth[growth.length-1]?.totalCustomers || 0} total customers` : undefined}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={growth} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: shadows.md, fontSize: 13 }} />
                <Area type="monotone" dataKey="totalCustomers" stroke="#3B82F6" strokeWidth={2.5} fill="url(#growthGrad)" name="Total" dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }} />
                <Line type="monotone" dataKey="newCustomers" stroke="#16A34A" strokeWidth={2} dot={{ r: 3, fill: "#16A34A" }} name="New" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="Subscriptions" subtitle="Plan distribution" footer={`${subBreakdown.reduce((s, b) => s + b.value, 0)} total users`}>
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={subBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={95} innerRadius={60} paddingAngle={3} strokeWidth={0}>
                    {subBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <RTooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: shadows.md, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Stack direction="row" spacing={2.5} justifyContent="center">
              {subBreakdown.map((s) => (
                <Stack key={s.name} direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: s.color }} />
                  <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary, fontWeight: 500 }}>{s.name} ({s.value})</Typography>
                </Stack>
              ))}
            </Stack>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ═══ CHARTS ROW 2: Revenue (6) + Platform Activity (6) ═══ */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Revenue Trend" subtitle="Monthly revenue (6 months)" footer={revenue.length > 0 ? `Latest: R${revenue[revenue.length-1]?.revenue || 0}` : undefined}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenue} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v}`} />
                <RTooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: shadows.md, fontSize: 13 }} formatter={(v) => [`R${v}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: "#16A34A", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Platform Activity" subtitle="Daily logins — last 7 days" footer={`${platformActivity.reduce((s, d) => s + d.logins, 0)} total logins this week`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformActivity} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: shadows.md, fontSize: 13 }} formatter={(v) => [v, "Logins"]} />
                <Bar dataKey="logins" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Logins" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ═══ CHARTS ROW 3: Feature Usage (6) + Customer Health (6) ═══ */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Feature Usage" subtitle="Records per module" footer={featureUsage.length > 0 ? `Most used: ${featureUsage[0]?.name}` : undefined}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureUsage} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: semantic.text, fontWeight: 500 }} axisLine={false} tickLine={false} width={75} />
                <RTooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: shadows.md, fontSize: 13 }} formatter={(v) => [v, "Records"]} />
                <Bar dataKey="records" radius={[0, 6, 6, 0]} name="Records" barSize={22}>
                  {featureUsage.map((f, i) => <Cell key={i} fill={f.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Customer Health" subtitle="Engagement distribution" footer={`${customerHealth.reduce((s, c) => s + c.value, 0)} total customers`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerHealth} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: semantic.textSecondary }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: shadows.md, fontSize: 13 }} formatter={(v) => [v, "Customers"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Customers" barSize={40}>
                  {customerHealth.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ═══ QUICK ACTIONS ═══ */}
      <Box>
        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {[
            { icon: "👥", title: "Users", path: "/users" },
            { icon: "💳", title: "Payments", path: "/payments" },
            { icon: "🎯", title: "Success", path: "/notifications" },
            { icon: "📈", title: "Analytics", path: "/analytics" },
            { icon: "🧠", title: "AI Ops", path: "/support" },
            { icon: "⚙️", title: "Settings", path: "/settings" },
          ].map((a) => (
            <Grid item xs={4} sm={2} key={a.title}>
              <Box onClick={() => navigate(a.path)} sx={{ p: 2, borderRadius: radius.lg, bgcolor: "#fff", border: `1px solid ${semantic.border}`, textAlign: "center", cursor: "pointer", transition: transitions.normal, "&:hover": { boxShadow: shadows.sm, transform: "translateY(-2px)" } }}>
                <Typography sx={{ fontSize: "1.3rem", mb: 0.5 }}>{a.icon}</Typography>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: semantic.text }}>{a.title}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ═══ BOTTOM: ACTIVITY + HEALTH ═══ */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <FxCard sx={{ p: { xs: 2.5, md: 3.5 }, height: "100%" }}>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, mb: 2.5 }}>Recent Activity</Typography>
            {activity.length === 0 ? (
              <Box sx={{ py: 3, textAlign: "center" }}><Typography sx={{ fontSize: "0.82rem", color: semantic.textTertiary }}>Activity will appear here.</Typography></Box>
            ) : (
              <Stack spacing={0}>
                {activity.slice(0, 6).map((item, i) => (
                  <Stack key={i} direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.5, borderBottom: i < 5 ? `1px solid ${semantic.border}` : "none" }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: item.type === "signup" ? "#DBEAFE" : "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>{item.type === "signup" ? "👤" : "💰"}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{item.description}</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, mt: 0.25 }}>{formatRelativeTime(item.timestamp)}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </FxCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <FxCard sx={{ p: { xs: 2.5, md: 3.5 }, height: "100%" }}>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, mb: 2 }}>Infrastructure</Typography>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <Box sx={{ position: "relative", width: 72, height: 72, mx: "auto" }}>
                <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}><circle cx={36} cy={36} r={30} fill="none" stroke="#F1F5F9" strokeWidth={6} /><circle cx={36} cy={36} r={30} fill="none" stroke={healthPct >= 80 ? semantic.success : semantic.warning} strokeWidth={6} strokeLinecap="round" strokeDasharray={188.5} strokeDashoffset={188.5 - (healthPct / 100) * 188.5} style={{ transition: "stroke-dashoffset 0.8s ease" }} /></svg>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ fontSize: "1rem", fontWeight: 800, color: healthPct >= 80 ? semantic.success : semantic.warning }}>{healthPct}%</Typography></Box>
              </Box>
            </Box>
            <Stack spacing={1}>
              {health && Object.entries(health.services).map(([name, svc]) => (
                <Stack key={name} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: svc.status === "healthy" ? semantic.success : semantic.warning }} /><Typography sx={{ fontSize: "0.75rem", color: semantic.text, textTransform: "capitalize" }}>{name}</Typography></Stack>
                  {svc.latency && <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary, fontFamily: "monospace" }}>{svc.latency}ms</Typography>}
                </Stack>
              ))}
            </Stack>
          </FxCard>
        </Grid>
      </Grid>

    </Stack>
  );
}

// ═══ COMPONENTS ══════════════════════════════════════════════

function StatusPill({ label, value, healthy }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.75, py: 0.6, borderRadius: "100px", bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: healthy ? "#4ADE80" : "#FCD34D" }} />
      <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.68rem", color: healthy ? "#4ADE80" : "#FCD34D", fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

function KpiCard({ value, label, color, icon }) {
  return (
    <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, bgcolor: "#fff", border: `1px solid ${semantic.border}`, borderTop: `3px solid ${color}`, boxShadow: shadows.xs, transition: transitions.normal, "&:hover": { boxShadow: shadows.md, transform: "translateY(-2px)" } }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>{icon}</Box>
        <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: { xs: "1.2rem", md: "1.4rem" }, fontWeight: 800, color: semantic.text, letterSpacing: "-0.02em" }}>{value}</Typography>
    </Box>
  );
}

function ChartCard({ title, subtitle, footer, children }) {
  return (
    <FxCard sx={{ p: { xs: 2.5, md: 3 }, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: semantic.text }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, mt: 0.25 }}>{subtitle}</Typography>}
      </Box>
      <Box sx={{ flex: 1 }}>{children}</Box>
      {footer && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${semantic.border}` }}>
          <Typography sx={{ fontSize: "0.7rem", color: semantic.textSecondary, fontWeight: 500 }}>{footer}</Typography>
        </Box>
      )}
    </FxCard>
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
