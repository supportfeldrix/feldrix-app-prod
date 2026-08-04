/**
 * ============================================================
 * Feldrix Control Centre — Executive Command Centre
 * Version 2.3.0 — Enterprise BI Dashboard
 * Inspired by OpenShift Console, Grafana, Azure Monitor, Datadog
 * Asymmetric 8/4 sections with executive insight footers
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

  // Derived insights from existing data
  const totalSubs = subBreakdown.reduce((s, b) => s + b.value, 0);
  const topFeature = featureUsage.length > 0 ? featureUsage[0] : null;
  const peakDay = platformActivity.length > 0 ? platformActivity.reduce((max, d) => d.logins > max.logins ? d : max, platformActivity[0]) : null;
  const avgLogins = platformActivity.length > 0 ? Math.round(platformActivity.reduce((s, d) => s + d.logins, 0) / platformActivity.length) : 0;
  const healthyCount = customerHealth.filter(c => c.name === "Healthy").reduce((s, c) => s + c.value, 0);
  const totalHealthCustomers = customerHealth.reduce((s, c) => s + c.value, 0);
  const healthyPct = totalHealthCustomers > 0 ? Math.round((healthyCount / totalHealthCustomers) * 100) : 0;
  const sortedFeatures = [...featureUsage].sort((a, b) => b.records - a.records);
  const latestRevenue = revenue.length > 0 ? revenue[revenue.length - 1]?.revenue || 0 : 0;
  const projectedARR = latestRevenue * 12;

  if (loading) {
    return (
      <Stack spacing={4}>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: radius.xl }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: radius.xl }} />
        <Grid container spacing={2.5}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: radius.lg }} /></Grid>)}</Grid>
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: radius.xl }} />
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: radius.xl }} />
      </Stack>
    );
  }

  return (
    <Stack spacing={5} sx={{ width: "100%" }}>

      {/* ═══ DARK EXECUTIVE BANNER ═══ */}
      <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 3.5 }, borderRadius: radius.xl, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ position: "relative" }}>
          <Box>
            <Typography sx={{ fontSize: { xs: "1.4rem", md: "1.6rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {greeting}, {admin?.name?.split(" ")[0] || "Admin"}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", mt: 0.5 }}>{dateStr}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", mt: 0.25 }}>Executive Command Centre — Real-time platform overview</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <PillBadge label="Platform" value="Healthy" color={semantic.success} />
            <PillBadge label="Database" value="Online" color={semantic.info} />
            <PillBadge label="Services" value={`${healthPct}%`} color="#8B5CF6" />
            <PillBadge label="AI Engine" value="Active" color={semantic.success} />
          </Stack>
        </Stack>
      </Box>

      {/* ═══ EXECUTIVE BRIEFING + TODAY'S PRIORITY ═══ */}
      <FxCard sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 } }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #3B82F6, #06B6D4)" }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: radius.md, bgcolor: "#6366F112", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🧠</Box>
              <Box>
                <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: semantic.text }}>Executive Briefing</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>AI-generated · Updated now</Typography>
              </Box>
            </Stack>
            <Stack spacing={1.5}>
              <BriefingLine icon="✓" color={semantic.success} text={`${formatNumber(metrics?.totalUsers)} customers (${formatNumber(metrics?.activeUsers)} active).`} />
              {metrics?.todaySignups > 0 && <BriefingLine icon="✓" color={semantic.info} text={`${metrics.todaySignups} new sign-up(s) today.`} />}
              {metrics?.revenueMonth > 0 ? <BriefingLine icon="✓" color={semantic.success} text={`Revenue: ${formatCurrency(metrics.revenueMonth)} this month. Projected ARR: ${formatCurrency(projectedARR)}.`} /> : <BriefingLine icon="⚠" color={semantic.warning} text="No revenue yet — focus on PRO conversions." />}
              {(metrics?.pendingPayments || 0) > 0 ? <BriefingLine icon="⚠" color={semantic.warning} text={`${metrics.pendingPayments} pending payment(s) require attention.`} /> : <BriefingLine icon="✓" color={semantic.success} text="No payment issues." />}
              <BriefingLine icon="✓" color={healthPct >= 80 ? semantic.success : semantic.warning} text={`Platform health: ${healthPct}%. All services operational.`} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, borderRadius: radius.lg, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 2 }}>Today's Priority</Typography>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: semantic.text, lineHeight: 1.5, mb: 2.5, flex: 1 }}>
                {metrics?.pendingPayments > 0 ? "Review pending payments and ensure cash flow continuity." : metrics?.proSubscribers === 0 ? "Focus on first PRO conversion — the path to revenue begins here." : "Monitor growth trajectories and platform engagement."}
              </Typography>
              <Chip label="View AI Operations →" onClick={() => navigate("/support")} size="small" sx={{ alignSelf: "flex-start", bgcolor: `${semantic.info}10`, color: semantic.info, fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", "&:hover": { bgcolor: `${semantic.info}18` } }} />
            </Box>
          </Grid>
        </Grid>
      </FxCard>

      {/* ═══ EXECUTIVE KPI CARDS ═══ */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.totalUsers)} label="Total Customers" color={semantic.info} icon="👥" sub="Lifetime registrations" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.activeUsers)} label="Active Customers" color="#0EA5E9" icon="📡" sub="Active in last 30 days" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.proSubscribers)} label="PRO Subscribers" color="#8B5CF6" icon="⭐" sub="Paying customers" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={metrics?.revenueMonth > 0 ? formatCurrency(metrics.revenueMonth) : "—"} label="Monthly Revenue" color={semantic.success} icon="💰" sub="Current MRR" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={`${healthPct}%`} label="Platform Health" color={healthPct >= 80 ? semantic.success : semantic.warning} icon="🟢" sub="Service availability" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.pendingPayments || 0)} label="Pending Actions" color={metrics?.pendingPayments > 0 ? semantic.error : semantic.success} icon="⚠️" sub="Requires attention" /></Grid>
      </Grid>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: BUSINESS GROWTH
          ═══════════════════════════════════════════════════════════ */}
      <Box>
        <SectionHeader icon="📈" title="BUSINESS GROWTH" subtitle="Understand how Feldrix is growing over time." />
        <Grid container spacing={3} sx={{ mt: 0.5, "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          {/* Customer Growth — Primary (8 cols) */}
          <Grid item xs={12} md={8}>
            <ChartCard title="Customer Growth" subtitle="Monthly acquisition and cumulative trajectory" insight={growth.length > 1 ? `Growing steadily — ${formatNumber(growth[growth.length-1]?.totalCustomers || 0)} total customers. ${growth[growth.length-1]?.newCustomers || 0} new customers acquired this month.` : "Growth tracking active. Data will populate as customers register."}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={growth} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={semantic.info} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={semantic.info} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: shadows.lg, fontSize: 13, padding: "12px 16px" }} />
                  <Area type="monotone" dataKey="totalCustomers" stroke={semantic.info} strokeWidth={2.5} fill="url(#growthGrad)" name="Total Customers" dot={{ r: 4, fill: semantic.info, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="newCustomers" stroke={semantic.success} strokeWidth={2} dot={{ r: 3, fill: semantic.success }} name="New This Month" />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
          {/* Revenue Trend — Secondary (4 cols) */}
          <Grid item xs={12} md={4}>
            <ChartCard title="Revenue Trend" subtitle="Monthly recurring revenue (ZAR)" insight={latestRevenue > 0 ? `Current MRR: ${formatCurrency(latestRevenue)}. Projected ARR: ${formatCurrency(projectedARR)}. Revenue forecast available.` : "Revenue tracking active. First PRO subscriber will establish the revenue baseline."}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenue} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={semantic.success} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={semantic.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v}`} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: shadows.lg, fontSize: 13, padding: "12px 16px" }} formatter={(v) => [`R${v}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke={semantic.success} strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: semantic.success, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>
      </Box>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: CUSTOMER INTELLIGENCE
          ═══════════════════════════════════════════════════════════ */}
      <Box>
        <SectionHeader icon="👥" title="CUSTOMER INTELLIGENCE" subtitle="Customer engagement, subscriptions, and health." />
        <Grid container spacing={3} sx={{ mt: 0.5, "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          {/* Subscriptions — Secondary (4 cols) */}
          <Grid item xs={12} md={4}>
            <ChartCard title="Subscriptions" subtitle="Plan distribution across all farms" insight={totalSubs > 0 ? `${totalSubs} total farms subscribed. ${subBreakdown.find(s => s.name === "PRO")?.value || 0} PRO subscribers generating revenue.` : "No subscription data yet. First customers will establish the baseline."}>
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 2, width: "100%", minWidth: 0 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center" sx={{ width: "100%" }}>
                  <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={subBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={48} paddingAngle={3} strokeWidth={0}>
                          {subBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Pie>
                        <RTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: shadows.lg, fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: semantic.text, lineHeight: 1 }}>{totalSubs}</Typography>
                      <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary, mt: 0.25 }}>farms</Typography>
                    </Box>
                  </Box>
                  <Stack spacing={1.5} sx={{ flex: 1 }}>
                    {subBreakdown.map((s) => {
                      const pct = totalSubs > 0 ? Math.round((s.value / totalSubs) * 100) : 0;
                      return (
                        <Stack key={s.name} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: s.color }} />
                            <Typography sx={{ fontSize: "0.78rem", color: semantic.text, fontWeight: 500 }}>{s.name}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.75} alignItems="baseline">
                            <Typography sx={{ fontSize: "0.78rem", color: semantic.text, fontWeight: 700 }}>{s.value}</Typography>
                            <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary }}>({pct}%)</Typography>
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Stack>
              </Stack>
            </ChartCard>
          </Grid>
          {/* Customer Health — Primary (8 cols) */}
          <Grid item xs={12} md={8}>
            <ChartCard title="Customer Health" subtitle="Distribution across engagement segments" insight={totalHealthCustomers > 0 ? `${healthyPct}% of customers are healthy and engaged. ${totalHealthCustomers - healthyCount} customer(s) need attention. Focus retention efforts on at-risk segments.` : "Health tracking active. Segments will populate as customers engage."}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={customerHealth} layout="vertical" margin={{ top: 10, right: 40, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: semantic.text, fontWeight: 500 }} axisLine={false} tickLine={false} width={75} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: shadows.lg, fontSize: 13 }} formatter={(v) => [v, "Customers"]} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32} label={{ position: "right", fontSize: 12, fill: semantic.text, fontWeight: 600 }}>
                    {customerHealth.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>
      </Box>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: PLATFORM INTELLIGENCE
          ═══════════════════════════════════════════════════════════ */}
      <Box>
        <SectionHeader icon="🖥" title="PLATFORM INTELLIGENCE" subtitle="Platform usage and operational health." />
        <Grid container spacing={3} sx={{ mt: 0.5, "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          {/* Platform Activity — Primary (8 cols) */}
          <Grid item xs={12} md={8}>
            <ChartCard title="Platform Activity" subtitle="Daily login frequency (last 7 days)" insight={peakDay ? `Peak day: ${peakDay.day} (${peakDay.logins} logins). Average: ${avgLogins} logins/day. Platform engagement is ${avgLogins > 5 ? "healthy" : "building"}.` : "Tracking weekly activity. Login data will populate over the next 7 days."}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={platformActivity} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: semantic.text, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: shadows.lg, fontSize: 13, padding: "12px 16px" }} formatter={(v) => [v, "Logins"]} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                  <Bar dataKey="logins" fill={semantic.info} radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
          {/* Feature Usage — Secondary (4 cols) */}
          <Grid item xs={12} md={4}>
            <ChartCard title="Feature Usage" subtitle="Records per module (last 30 days)" insight={topFeature ? `${topFeature.name} remains the most-used module. ${sortedFeatures.length > 1 ? `${sortedFeatures[sortedFeatures.length-1].name} has the lowest adoption — consider promotion.` : ""}` : "Tracking feature adoption across all modules."}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sortedFeatures} layout="vertical" margin={{ top: 10, right: 30, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: semantic.text, fontWeight: 500 }} axisLine={false} tickLine={false} width={75} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: shadows.lg, fontSize: 13 }} formatter={(v) => [v, "Records"]} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                  <Bar dataKey="records" radius={[0, 8, 8, 0]} barSize={24} label={{ position: "right", fontSize: 11, fill: semantic.textSecondary, fontWeight: 600 }}>
                    {sortedFeatures.map((f, i) => <Cell key={i} fill={f.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>
      </Box>

      {/* ═══ QUICK ACTIONS ═══ */}
      <Box>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2.5}>
          {[
            { icon: "👥", title: "Users", path: "/users" },
            { icon: "💳", title: "Payments", path: "/payments" },
            { icon: "⭐", title: "Subscriptions", path: "/payments" },
            { icon: "📈", title: "Analytics", path: "/analytics" },
            { icon: "🎯", title: "Customer Success", path: "/notifications" },
            { icon: "⚙️", title: "Settings", path: "/settings" },
          ].map((a) => (
            <Grid item xs={6} sm={4} md={2} key={a.title}>
              <Box onClick={() => navigate(a.path)} sx={{ p: 2.5, borderRadius: radius.lg, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, textAlign: "center", cursor: "pointer", transition: transitions.smooth, position: "relative", overflow: "hidden", "&:hover": { boxShadow: shadows.md, transform: "translateY(-3px)", borderColor: semantic.borderHover, "& .action-arrow": { opacity: 1, transform: "translateX(0)" } } }}>
                <Typography sx={{ fontSize: "1.4rem", mb: 0.75 }}>{a.icon}</Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: semantic.text }}>{a.title}</Typography>
                <Box className="action-arrow" sx={{ position: "absolute", top: 8, right: 8, opacity: 0, transform: "translateX(-4px)", transition: transitions.normal }}>
                  <ArrowForward sx={{ fontSize: 14, color: semantic.textTertiary }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ═══ RECENT ACTIVITY + INFRASTRUCTURE ═══ */}
      <Grid container spacing={3} sx={{ "& .MuiGrid-item": { display: "flex" } }}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <FxCard sx={{ p: { xs: 3, md: 4 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ ...typo.cardTitle, color: semantic.text, mb: 3 }}>Recent Activity</Typography>
            {activity.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", color: semantic.textTertiary }}>Activity will appear here as customers engage.</Typography>
              </Box>
            ) : (
              <Stack spacing={0}>
                {activity.slice(0, 6).map((item, i) => (
                  <Stack key={i} direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.75, borderBottom: i < 5 ? `1px solid ${semantic.border}` : "none" }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: radius.md, bgcolor: item.type === "signup" ? semantic.infoBg : semantic.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>{item.type === "signup" ? "👤" : "💰"}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: semantic.text }}>{item.description}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: semantic.textTertiary, mt: 0.25 }}>{formatRelativeTime(item.timestamp)}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </FxCard>
        </Grid>

        {/* Infrastructure Health */}
        <Grid item xs={12} md={4}>
          <FxCard sx={{ p: { xs: 3, md: 4 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Typography sx={{ ...typo.cardTitle, color: semantic.text }}>Infrastructure</Typography>
              <Box sx={{ px: 1.5, py: 0.25, borderRadius: radius.pill, bgcolor: healthPct >= 80 ? semantic.successBg : semantic.warningBg }}>
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: healthPct >= 80 ? semantic.successText : semantic.warningText }}>{healthPct}%</Typography>
              </Box>
            </Stack>
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              {health && Object.entries(health.services).map(([name, svc]) => (
                <Box key={name} sx={{ p: 2, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: svc.status === "healthy" ? semantic.success : svc.status === "warning" ? semantic.warning : semantic.error }} />
                      <Typography sx={{ fontSize: "0.78rem", color: semantic.text, fontWeight: 600, textTransform: "capitalize" }}>{name}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {svc.latency && <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary, fontFamily: "monospace" }}>{svc.latency}ms</Typography>}
                      <Box sx={{ px: 1, py: 0.25, borderRadius: radius.xs, bgcolor: svc.status === "healthy" ? semantic.successBg : semantic.warningBg }}>
                        <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: svc.status === "healthy" ? semantic.successText : semantic.warningText, textTransform: "capitalize" }}>{svc.status}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </FxCard>
        </Grid>
      </Grid>

    </Stack>
  );
}


// ═══ HELPER COMPONENTS ══════════════════════════════════════

function SectionHeader({ icon, title, subtitle }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography sx={{ fontSize: "1rem" }}>{icon}</Typography>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.text, fontSize: "0.7rem" }}>{title}</Typography>
      </Stack>
      {subtitle && <Typography sx={{ fontSize: "0.78rem", color: semantic.textTertiary, mt: 0.5, ml: 4.5 }}>{subtitle}</Typography>}
      <Box sx={{ mt: 1.5, height: 1, bgcolor: semantic.border }} />
    </Box>
  );
}

function PillBadge({ label, value, color }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: radius.pill, bgcolor: `${color}20` }}>
      <Typography sx={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.62rem", color, fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

function KpiCard({ value, label, color, icon, sub }) {
  return (
    <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: radius.lg, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, boxShadow: shadows.xs, transition: transitions.normal, "&:hover": { boxShadow: shadows.md, transform: "translateY(-2px)" } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: radius.md, bgcolor: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>{icon}</Box>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: semantic.textSecondary, lineHeight: 1.3 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ ...typo.metricValue, color: semantic.text, mb: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary }}>{sub}</Typography>
    </Box>
  );
}

function ChartCard({ title, subtitle, insight, children }) {
  return (
    <FxCard sx={{ p: 4, height: "100%", width: "100%", minWidth: 0, display: "flex", flexDirection: "column", minHeight: 420, borderRadius: radius.xl }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: semantic.text }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: "0.75rem", color: semantic.textTertiary, mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {children}
      </Box>
      {insight && (
        <Box sx={{ mt: "auto", pt: 2, borderTop: `1px solid ${semantic.border}` }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Box sx={{ width: 20, height: 20, borderRadius: radius.xs, bgcolor: `${semantic.info}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: "1px" }}>
              <Typography sx={{ fontSize: "0.6rem" }}>💡</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: semantic.info, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.25 }}>Executive Insight</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary, lineHeight: 1.5 }}>{insight}</Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </FxCard>
  );
}

function BriefingLine({ icon, color, text }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Typography sx={{ fontSize: "0.85rem", color, lineHeight: 1.5, flexShrink: 0, mt: "1px" }}>{icon}</Typography>
      <Typography sx={{ fontSize: "0.88rem", color: semantic.textSecondary, lineHeight: 1.6 }}>{text}</Typography>
    </Stack>
  );
}
