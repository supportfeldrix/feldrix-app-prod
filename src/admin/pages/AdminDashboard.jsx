/**
 * ============================================================
 * Feldrix Control Centre — Executive Command Centre
 * Version 2.3.1 — Final Executive Polish
 * Enterprise-grade: Azure Monitor / Datadog / Stripe density
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
import { runIntelligenceAnalysis } from "../services/adminExecutiveIntelligenceService";
import { runPredictiveAnalysis } from "../services/adminPredictiveIntelligenceService";
import { runOperationsAnalysis } from "../services/adminOperationsService";

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

  // Derived executive metrics
  const totalSubs = subBreakdown.reduce((s, b) => s + b.value, 0);
  const proSubs = subBreakdown.find(s => s.name === "PRO")?.value || 0;
  const topFeature = featureUsage.length > 0 ? featureUsage[0] : null;
  const peakDay = platformActivity.length > 0 ? platformActivity.reduce((max, d) => d.logins > max.logins ? d : max, platformActivity[0]) : null;
  const avgLogins = platformActivity.length > 0 ? Math.round(platformActivity.reduce((s, d) => s + d.logins, 0) / platformActivity.length) : 0;
  const totalLogins = platformActivity.reduce((s, d) => s + d.logins, 0);
  const healthyCount = customerHealth.filter(c => c.name === "Healthy").reduce((s, c) => s + c.value, 0);
  const totalHealthCustomers = customerHealth.reduce((s, c) => s + c.value, 0);
  const healthyPct = totalHealthCustomers > 0 ? Math.round((healthyCount / totalHealthCustomers) * 100) : 0;
  const atRiskCount = totalHealthCustomers - healthyCount;
  const sortedFeatures = [...featureUsage].sort((a, b) => b.records - a.records);
  const totalRecords = featureUsage.reduce((s, f) => s + f.records, 0);
  const latestRevenue = revenue.length > 0 ? revenue[revenue.length - 1]?.revenue || 0 : 0;
  const projectedARR = latestRevenue * 12;
  const latestGrowth = growth.length > 0 ? growth[growth.length - 1] : null;
  const growthRate = growth.length > 1 && growth[growth.length - 2]?.totalCustomers > 0
    ? Math.round(((latestGrowth?.totalCustomers - growth[growth.length - 2].totalCustomers) / growth[growth.length - 2].totalCustomers) * 100)
    : 0;
  const activePct = metrics?.totalUsers > 0 ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0;

  // Executive Intelligence — computed from existing dashboard data (no extra API calls)
  const intelligenceData = { metrics, health, growth, revenue, subBreakdown, platformActivity, featureUsage, customerHealth, activity };
  const intelligence = !loading && metrics ? runIntelligenceAnalysis(intelligenceData) : null;

  // Predictive Intelligence — forecasts, upgrade/churn predictions, priorities
  const predictions = !loading && metrics ? runPredictiveAnalysis(intelligenceData) : null;

  // AI Operations — prioritised queue, impact, revenue opportunities
  const operations = !loading && metrics && intelligence && predictions
    ? runOperationsAnalysis(intelligenceData, intelligence, predictions) : null;

  if (loading) {
    return (
      <Stack spacing={4}>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: radius.xl }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: radius.xl }} />
        <Grid container spacing={2.5}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={130} sx={{ borderRadius: radius.lg }} /></Grid>)}</Grid>
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: radius.xl }} />
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: radius.xl }} />
      </Stack>
    );
  }

  return (
    <Stack spacing={5} sx={{ width: "100%" }}>

      {/* ═══ DARK EXECUTIVE BANNER ═══ */}
      <Box sx={{ px: { xs: 3, md: 4.5 }, py: { xs: 3, md: 3.5 }, borderRadius: radius.xl, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ position: "relative" }}>
          <Box>
            <Typography sx={{ fontSize: { xs: "1.4rem", md: "1.6rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {greeting}, {admin?.name?.split(" ")[0] || "Admin"}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", mt: 0.5 }}>{dateStr}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", mt: 0.25 }}>Executive Command Centre — Real-time platform intelligence</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <PillBadge label="Platform" value="Healthy" color={semantic.success} />
            <PillBadge label="Database" value="Online" color={semantic.info} />
            <PillBadge label="Services" value={`${healthPct}%`} color="#8B5CF6" />
            <PillBadge label="AI Engine" value="Active" color={semantic.success} />
          </Stack>
        </Stack>
      </Box>

      {/* ═══ EXECUTIVE INTELLIGENCE ═══ */}
      {intelligence && (
        <FxCard sx={{ p: { xs: 3, md: 4 }, position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: intelligence.overview.status === "excellent" ? `linear-gradient(90deg, ${semantic.success}, #06B6D4)` : intelligence.overview.status === "healthy" ? `linear-gradient(90deg, ${semantic.info}, ${semantic.success})` : intelligence.overview.status === "attention" ? `linear-gradient(90deg, ${semantic.warning}, #F59E0B)` : `linear-gradient(90deg, ${semantic.error}, ${semantic.warning})` }} />
          <Grid container spacing={3}>
            {/* Health Score */}
            <Grid item xs={12} sm={6} md={3}>
              <Stack alignItems="center" spacing={1.5}>
                <Box sx={{ position: "relative", width: 88, height: 88 }}>
                  <svg width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={44} cy={44} r={38} fill="none" stroke={semantic.surface} strokeWidth={7} />
                    <circle cx={44} cy={44} r={38} fill="none" stroke={intelligence.overview.status === "excellent" ? semantic.success : intelligence.overview.status === "healthy" ? semantic.info : intelligence.overview.status === "attention" ? semantic.warning : semantic.error} strokeWidth={7} strokeLinecap="round" strokeDasharray={238.76} strokeDashoffset={238.76 - (intelligence.overview.healthScore / 100) * 238.76} style={{ transition: "stroke-dashoffset 1s ease" }} />
                  </svg>
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: semantic.text, lineHeight: 1 }}>{intelligence.overview.healthScore}</Typography>
                    <Typography sx={{ fontSize: "0.55rem", color: semantic.textTertiary, mt: 0.25 }}>/ 100</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.text }}>Business Health</Typography>
                  <Box sx={{ mt: 0.5, px: 1.5, py: 0.25, borderRadius: radius.pill, display: "inline-block", bgcolor: intelligence.overview.status === "excellent" ? semantic.successBg : intelligence.overview.status === "healthy" ? semantic.infoBg : intelligence.overview.status === "attention" ? semantic.warningBg : semantic.errorBg }}>
                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "capitalize", color: intelligence.overview.status === "excellent" ? semantic.successText : intelligence.overview.status === "healthy" ? semantic.infoText : intelligence.overview.status === "attention" ? semantic.warningText : semantic.errorText }}>{intelligence.overview.status}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            {/* Today's Focus */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: radius.xs, bgcolor: `${semantic.info}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: "0.7rem" }}>🎯</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Today's Focus</Typography>
                </Stack>
                <Typography sx={{ fontSize: "0.82rem", color: semantic.text, fontWeight: 500, lineHeight: 1.6, flex: 1 }}>{intelligence.summary.todaysFocus}</Typography>
              </Box>
            </Grid>

            {/* Top Opportunity */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: radius.xs, bgcolor: `${semantic.success}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: "0.7rem" }}>🚀</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Top Opportunity</Typography>
                </Stack>
                {intelligence.summary.topOpportunity ? (
                  <>
                    <Typography sx={{ fontSize: "0.82rem", color: semantic.text, fontWeight: 600, lineHeight: 1.5, mb: 0.5 }}>{intelligence.summary.topOpportunity.title}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, lineHeight: 1.5 }}>{intelligence.summary.topOpportunity.action}</Typography>
                  </>
                ) : (
                  <Typography sx={{ fontSize: "0.78rem", color: semantic.textTertiary, lineHeight: 1.5 }}>No immediate opportunities identified. Continue monitoring engagement.</Typography>
                )}
              </Box>
            </Grid>

            {/* Top Risk */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: radius.xs, bgcolor: intelligence.summary.topRisk ? `${semantic.warning}10` : `${semantic.success}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: "0.7rem" }}>{intelligence.summary.topRisk ? "⚠️" : "✓"}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Top Risk</Typography>
                </Stack>
                {intelligence.summary.topRisk ? (
                  <>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ px: 1, py: 0.15, borderRadius: radius.xs, bgcolor: intelligence.summary.topRisk.priority === "critical" ? semantic.errorBg : semantic.warningBg }}>
                        <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", color: intelligence.summary.topRisk.priority === "critical" ? semantic.errorText : semantic.warningText }}>{intelligence.summary.topRisk.priority}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>{intelligence.summary.topRisk.category}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: "0.82rem", color: semantic.text, fontWeight: 600, lineHeight: 1.5, mb: 0.5 }}>{intelligence.summary.topRisk.title}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, lineHeight: 1.5 }}>{intelligence.summary.topRisk.action}</Typography>
                  </>
                ) : (
                  <Typography sx={{ fontSize: "0.78rem", color: semantic.success, fontWeight: 500, lineHeight: 1.5 }}>No critical risks detected. All systems operating normally.</Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Executive Recommendation */}
          <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${semantic.border}` }}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Box sx={{ width: 24, height: 24, borderRadius: radius.xs, bgcolor: "#6366F110", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: "1px" }}>
                <Typography sx={{ fontSize: "0.7rem" }}>💡</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.25 }}>Executive Recommendation</Typography>
                <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary, lineHeight: 1.6 }}>{intelligence.summary.briefing}</Typography>
              </Box>
            </Stack>
          </Box>
        </FxCard>
      )}

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
              <BriefingLine icon="✓" color={semantic.success} text={`${formatNumber(metrics?.totalUsers)} registered customers. ${formatNumber(metrics?.activeUsers)} active (${activePct}% engagement rate).`} />
              {metrics?.todaySignups > 0 && <BriefingLine icon="✓" color={semantic.info} text={`${metrics.todaySignups} new sign-up(s) today — acquisition pipeline is active.`} />}
              {metrics?.revenueMonth > 0 ? <BriefingLine icon="✓" color={semantic.success} text={`MRR: ${formatCurrency(metrics.revenueMonth)}. Projected ARR: ${formatCurrency(projectedARR)}. Revenue trajectory is positive.`} /> : <BriefingLine icon="⚠" color={semantic.warning} text="No revenue recorded yet. Converting the first PRO subscriber should be the primary objective." />}
              {(metrics?.pendingPayments || 0) > 0 ? <BriefingLine icon="⚠" color={semantic.warning} text={`${metrics.pendingPayments} pending payment(s) require immediate review to maintain cash flow.`} /> : <BriefingLine icon="✓" color={semantic.success} text="All payments processed. No outstanding issues." />}
              <BriefingLine icon="✓" color={healthPct >= 80 ? semantic.success : semantic.warning} text={`Infrastructure health: ${healthPct}%. ${healthPct >= 95 ? "All systems nominal." : "Monitor degraded services."}`} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, borderRadius: radius.lg, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 2 }}>Today's Priority</Typography>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: semantic.text, lineHeight: 1.6, mb: 2.5, flex: 1 }}>
                {metrics?.pendingPayments > 0 ? "Review pending payments and ensure cash flow continuity. Unresolved payments impact MRR projections." : metrics?.proSubscribers === 0 ? "Convert the first PRO subscriber. This establishes the revenue baseline and validates pricing." : "Monitor growth trajectories and platform engagement. Current trajectory is healthy."}
              </Typography>
              <Chip label="View AI Operations →" onClick={() => navigate("/support")} size="small" sx={{ alignSelf: "flex-start", bgcolor: `${semantic.info}10`, color: semantic.info, fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", transition: transitions.normal, "&:hover": { bgcolor: `${semantic.info}18` } }} />
            </Box>
          </Grid>
        </Grid>
      </FxCard>

      {/* ═══ EXECUTIVE KPI CARDS ═══ */}
      {/* Forecast Panel */}
      {predictions && (
        <FxCard sx={{ p: { xs: 3, md: 4 }, position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)" }} />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: radius.md, bgcolor: "#06B6D410", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>🔮</Box>
            <Box>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: semantic.text }}>Forecast (Next 30 Days)</Typography>
              <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>Confidence: {predictions.executiveForecast.forecast.confidence}%</Typography>
            </Box>
          </Stack>
          <Grid container spacing={2.5}>
            <Grid item xs={6} sm={4} md={2.4}>
              <ForecastMetric label="Expected Customers" value={formatNumber(predictions.executiveForecast.forecast.expectedCustomers)} trend={predictions.growthForecast.trend} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <ForecastMetric label="Expected PRO" value={formatNumber(predictions.executiveForecast.forecast.expectedPRO)} trend={predictions.upgradePredictions.estimatedConversions > 0 ? "up" : "stable"} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <ForecastMetric label="Expected MRR" value={predictions.executiveForecast.forecast.expectedMRR > 0 ? formatCurrency(predictions.executiveForecast.forecast.expectedMRR) : "—"} trend={predictions.revenueForecast.trend === "growing" ? "up" : predictions.revenueForecast.trend === "declining" ? "down" : "stable"} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <ForecastMetric label="Health Projection" value={`${predictions.executiveForecast.forecast.projectedHealth}/100`} trend={predictions.executiveForecast.forecast.projectedHealth >= 70 ? "up" : "down"} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <ForecastMetric label="Churn Risk" value={`${predictions.churnPredictions.riskScore}%`} trend={predictions.churnPredictions.riskScore >= 50 ? "down" : "up"} negative />
            </Grid>
          </Grid>
          {/* Three-Horizon Summary */}
          <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${semantic.border}` }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <HorizonCard label="Yesterday" icon="◀" text={predictions.executiveForecast.summary.yesterday} />
              </Grid>
              <Grid item xs={12} md={4}>
                <HorizonCard label="Today" icon="●" text={predictions.executiveForecast.summary.today} active />
              </Grid>
              <Grid item xs={12} md={4}>
                <HorizonCard label="Tomorrow" icon="▶" text={predictions.executiveForecast.summary.tomorrow} />
              </Grid>
            </Grid>
          </Box>
        </FxCard>
      )}

      {/* Executive Priorities */}
      {predictions?.executiveForecast?.priorities?.length > 0 && (
        <FxCard sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: radius.md, bgcolor: `${semantic.warning}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>🎯</Box>
            <Box>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: semantic.text }}>Executive Priorities</Typography>
              <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>Top actions ranked by business impact</Typography>
            </Box>
          </Stack>
          <Stack spacing={1.5}>
            {predictions.executiveForecast.priorities.map((p, i) => (
              <Box key={i} sx={{ p: 2, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ width: 28, height: 28, borderRadius: radius.xs, bgcolor: p.impact === "high" ? semantic.errorBg : p.impact === "medium" ? semantic.warningBg : semantic.infoBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: p.impact === "high" ? semantic.errorText : p.impact === "medium" ? semantic.warningText : semantic.infoText }}>{p.priority}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: semantic.text }}>{p.title}</Typography>
                      <Box sx={{ px: 0.75, py: 0.15, borderRadius: radius.xs, bgcolor: semantic.neutralBg }}>
                        <Typography sx={{ fontSize: "0.55rem", fontWeight: 600, color: semantic.neutralText }}>{p.area}</Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary, lineHeight: 1.5 }}>{p.description}</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                      <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary }}>Impact: <Box component="span" sx={{ fontWeight: 700, color: p.impact === "high" ? semantic.error : p.impact === "medium" ? semantic.warning : semantic.info }}>{p.impact}</Box></Typography>
                      <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary }}>Effort: <Box component="span" sx={{ fontWeight: 700 }}>{p.effort}</Box></Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </FxCard>
      )}

      {/* KPI Cards with Trend Indicators */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.totalUsers)} label="Total Customers" color={semantic.info} icon="👥" sub="Lifetime registrations" trend={predictions?.executiveForecast?.trends?.customers} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.activeUsers)} label="Active Customers" color="#0EA5E9" icon="📡" sub={`${activePct}% engagement`} trend={predictions?.executiveForecast?.trends?.activity} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.proSubscribers)} label="PRO Subscribers" color="#8B5CF6" icon="⭐" sub="Paying customers" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={metrics?.revenueMonth > 0 ? formatCurrency(metrics.revenueMonth) : "—"} label="Monthly Revenue" color={semantic.success} icon="💰" sub="Current MRR" trend={predictions?.executiveForecast?.trends?.revenue} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={`${healthPct}%`} label="Platform Health" color={healthPct >= 80 ? semantic.success : semantic.warning} icon="🟢" sub="Service availability" trend={predictions?.executiveForecast?.trends?.health} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.pendingPayments || 0)} label="Pending Actions" color={metrics?.pendingPayments > 0 ? semantic.error : semantic.success} icon="⚠️" sub={metrics?.pendingPayments > 0 ? "Requires attention" : "All clear"} /></Grid>
      </Grid>

      {/* ═══ AI OPERATIONS CENTRE ═══ */}
      {operations && (
        <Box>
          <SectionHeader icon="🤖" title="AI OPERATIONS CENTRE" subtitle="Prioritised actions ranked by business impact. Your AI-powered work queue." />
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Operations Queue */}
            <Grid item xs={12} md={8}>
              <FxCard sx={{ p: { xs: 3, md: 4 }, height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: semantic.text }}>Operations Queue</Typography>
                  <Box sx={{ px: 1.5, py: 0.25, borderRadius: radius.pill, bgcolor: semantic.infoBg }}>
                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.infoText }}>{operations.queue.total} action(s)</Typography>
                  </Box>
                </Stack>
                {/* Top Action Highlight */}
                {operations.actions.topAction && (
                  <Box sx={{ p: 2.5, mb: 2.5, borderRadius: radius.lg, bgcolor: `${semantic.success}06`, border: `1px solid ${semantic.success}20` }}>
                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.success, textTransform: "uppercase", letterSpacing: 0.6, mb: 0.75 }}>Highest-Value Action</Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: semantic.text, fontWeight: 600, lineHeight: 1.5 }}>{operations.actions.narrative}</Typography>
                  </Box>
                )}
                {/* Queue Items */}
                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  {operations.queue.items.slice(0, 5).map((item) => (
                    <Box key={item.priority} onClick={() => navigate(item.route)} sx={{ p: 2, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, cursor: "pointer", transition: transitions.smooth, "&:hover": { borderColor: semantic.borderHover, boxShadow: shadows.sm, transform: "translateX(2px)" } }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{ width: 32, height: 32, borderRadius: radius.xs, bgcolor: item.impact === "high" ? semantic.errorBg : item.impact === "medium" ? semantic.warningBg : semantic.infoBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Typography sx={{ fontSize: "0.85rem" }}>{item.icon}</Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: semantic.text }}>{item.title}</Typography>
                            <Box sx={{ px: 0.75, py: 0.1, borderRadius: radius.xs, bgcolor: semantic.neutralBg }}>
                              <Typography sx={{ fontSize: "0.52rem", fontWeight: 600, color: semantic.neutralText }}>{item.area}</Typography>
                            </Box>
                            {item.estimatedRevenue > 0 && (
                              <Box sx={{ px: 0.75, py: 0.1, borderRadius: radius.xs, bgcolor: semantic.successBg }}>
                                <Typography sx={{ fontSize: "0.52rem", fontWeight: 700, color: semantic.successText }}>+R{item.estimatedRevenue}/mo</Typography>
                              </Box>
                            )}
                          </Stack>
                          <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, mt: 0.25 }}>{item.reason}</Typography>
                          <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                            <Typography sx={{ fontSize: "0.58rem", color: semantic.textTertiary }}>Effort: {item.effort}</Typography>
                            {item.confidence && <Typography sx={{ fontSize: "0.58rem", color: semantic.textTertiary }}>Confidence: {item.confidence}%</Typography>}
                          </Stack>
                        </Box>
                        <ArrowForward sx={{ fontSize: 14, color: semantic.textTertiary, flexShrink: 0, mt: 0.5 }} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </FxCard>
            </Grid>

            {/* Right Column: Impact + Revenue + Urgent */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3} sx={{ height: "100%" }}>
                {/* Business Impact */}
                <FxCard sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: semantic.text, mb: 2 }}>Business Impact</Typography>
                  <Stack spacing={1.5}>
                    <ImpactRow label="Revenue Gain" value={operations.impact.revenueGain.value > 0 ? `+R${operations.impact.revenueGain.value}/mo` : "—"} level={operations.impact.revenueGain.level} />
                    <ImpactRow label="Revenue at Risk" value={operations.impact.revenueAtRisk.value > 0 ? `R${operations.impact.revenueAtRisk.value}/mo` : "—"} level={operations.impact.revenueAtRisk.level} negative />
                    <ImpactRow label="Customers Impacted" value={operations.impact.customersAffected.value} level={operations.impact.customersAffected.level} />
                    <ImpactRow label="Health Improvement" value={operations.impact.healthImprovement.value > 0 ? `+${operations.impact.healthImprovement.value} pts` : "—"} level={operations.impact.healthImprovement.level} />
                    <Box sx={{ pt: 1.5, borderTop: `1px solid ${semantic.border}` }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary }}>Time to complete all</Typography>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.text }}>{operations.impact.timeToComplete.formatted}</Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </FxCard>

                {/* Revenue Opportunities */}
                <FxCard sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: semantic.text, mb: 2 }}>Revenue Opportunity</Typography>
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Potential MRR</Typography>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.success }}>{operations.revenueOps.potentialMRR > 0 ? `R${operations.revenueOps.potentialMRR}` : "—"}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Potential ARR</Typography>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.text }}>{operations.revenueOps.potentialARR > 0 ? `R${operations.revenueOps.potentialARR}` : "—"}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Expected conversions</Typography>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.text }}>{operations.revenueOps.upgradeCount}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Confidence</Typography>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: operations.revenueOps.upgradeConfidence >= 60 ? semantic.success : semantic.warning }}>{operations.revenueOps.upgradeConfidence}%</Typography>
                    </Stack>
                  </Stack>
                  <Typography sx={{ fontSize: "0.7rem", color: semantic.textSecondary, lineHeight: 1.5 }}>{operations.revenueOps.summary}</Typography>
                </FxCard>

                {/* Urgent Attention */}
                {operations.urgent.total > 0 && (
                  <FxCard sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: semantic.text }}>Urgent Attention</Typography>
                      {operations.urgent.critical > 0 && (
                        <Box sx={{ px: 1, py: 0.2, borderRadius: radius.xs, bgcolor: semantic.errorBg }}>
                          <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: semantic.errorText }}>{operations.urgent.critical} critical</Typography>
                        </Box>
                      )}
                    </Stack>
                    <Stack spacing={1}>
                      {operations.urgent.items.slice(0, 4).map((item, i) => (
                        <Box key={i} onClick={() => navigate(item.route)} sx={{ p: 1.5, borderRadius: radius.sm, cursor: "pointer", transition: transitions.normal, "&:hover": { bgcolor: semantic.surface } }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: item.severity === "critical" ? semantic.error : item.severity === "high" ? semantic.warning : semantic.info, flexShrink: 0 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: semantic.text }}>{item.title}</Typography>
                              <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary }}>{item.category}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </FxCard>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ═══ SECTION 1: BUSINESS GROWTH ═══ */}
      <Box>
        <SectionHeader icon="📈" title="BUSINESS GROWTH" subtitle="Understand how Feldrix is growing over time." />
        <Grid container spacing={3} sx={{ mt: 0.5, "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          {/* Customer Growth — Primary (8 cols) */}
          <Grid item xs={12} md={8}>
            <ChartCard
              title="Customer Growth"
              subtitle="Monthly acquisition and cumulative trajectory"
              metrics={[
                { label: "Customers", value: formatNumber(latestGrowth?.totalCustomers || metrics?.totalUsers || 0) },
                { label: "New This Month", value: formatNumber(latestGrowth?.newCustomers || 0) },
                { label: "Growth", value: `${growthRate >= 0 ? "+" : ""}${growthRate}%`, color: growthRate >= 0 ? semantic.success : semantic.error },
                { label: "Active", value: `${activePct}%`, color: activePct >= 50 ? semantic.success : semantic.warning },
              ]}
              insight={growth.length > 1 ? `Customer growth has ${growthRate > 0 ? "accelerated" : "stabilised"} at ${growthRate}% month-over-month. ${latestGrowth?.newCustomers > 0 ? `${latestGrowth.newCustomers} new customer(s) acquired this period.` : "Marketing investment should become the next priority to drive acquisition."}` : "Customer growth tracking has started. The trend line will establish once two or more months of data are available."}
            >
              {growth.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={growth} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={semantic.info} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={semantic.info} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: semantic.textSecondary }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="totalCustomers" stroke={semantic.info} strokeWidth={2.5} fill="url(#growthGrad)" name="Total Customers" dot={{ r: 4, fill: semantic.info, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7, strokeWidth: 2, stroke: semantic.info, fill: "#fff" }} animationDuration={800} animationEasing="ease-out" />
                    <Line type="monotone" dataKey="newCustomers" stroke={semantic.success} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: semantic.success }} name="New This Month" animationDuration={1000} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No trend available yet. Data will appear once customers begin registering over multiple months." />
              )}
            </ChartCard>
          </Grid>
          {/* Revenue Trend — Secondary (4 cols) */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Revenue Trend"
              subtitle="Monthly recurring revenue (ZAR)"
              metrics={[
                { label: "MRR", value: latestRevenue > 0 ? formatCurrency(latestRevenue) : "—" },
                { label: "ARR", value: projectedARR > 0 ? formatCurrency(projectedARR) : "—" },
                { label: "Outstanding", value: formatNumber(metrics?.pendingPayments || 0), color: (metrics?.pendingPayments || 0) > 0 ? semantic.warning : semantic.success },
              ]}
              insight={latestRevenue > 0 ? `Current MRR: ${formatCurrency(latestRevenue)}. At this rate, projected annual revenue is ${formatCurrency(projectedARR)}. Focus on reducing churn and increasing PRO conversions to accelerate growth.` : "Revenue tracking has started. The first PRO subscription will establish the baseline for recurring revenue projections."}
            >
              {revenue.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenue} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={semantic.success} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={semantic.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: semantic.textSecondary }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v}`} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`R${v}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke={semantic.success} strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: semantic.success, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7, strokeWidth: 2, stroke: semantic.success, fill: "#fff" }} animationDuration={800} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No revenue trend available yet. Data will appear once PRO subscriptions generate recurring payments." />
              )}
            </ChartCard>
          </Grid>
        </Grid>
      </Box>

      {/* ═══ SECTION 2: CUSTOMER INTELLIGENCE ═══ */}
      <Box>
        <SectionHeader icon="👥" title="CUSTOMER INTELLIGENCE" subtitle="Customer engagement, subscriptions, and health." />
        <Grid container spacing={3} sx={{ mt: 0.5, "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          {/* Subscriptions — Secondary (4 cols) */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Subscriptions"
              subtitle="Current plan distribution"
              metrics={[
                { label: "Total Farms", value: formatNumber(totalSubs) },
                { label: "PRO", value: formatNumber(proSubs), color: "#8B5CF6" },
                { label: "Conversion", value: totalSubs > 0 ? `${Math.round((proSubs / totalSubs) * 100)}%` : "—" },
              ]}
              insight={totalSubs > 0 ? `${subBreakdown.find(s => s.value === Math.max(...subBreakdown.map(x => x.value)))?.name || "Starter"} subscriptions currently dominate at ${totalSubs > 0 ? Math.round((Math.max(...subBreakdown.map(x => x.value)) / totalSubs) * 100) : 0}%. Improving PRO conversion rate is the largest revenue growth opportunity.` : "No subscription data recorded yet. The first customer sign-up will establish the subscription baseline."}
            >
              {totalSubs > 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 1, width: "100%", minWidth: 0 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center" sx={{ width: "100%" }}>
                    <Box sx={{ position: "relative", flexShrink: 0 }}>
                      <ResponsiveContainer width={150} height={150}>
                        <PieChart>
                          <Pie data={subBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={3} strokeWidth={0} animationDuration={800} animationEasing="ease-out">
                            {subBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                          </Pie>
                          <RTooltip contentStyle={TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: semantic.text, lineHeight: 1 }}>{totalSubs}</Typography>
                        <Typography sx={{ fontSize: "0.58rem", color: semantic.textTertiary, mt: 0.25 }}>farms</Typography>
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
                              <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>({pct}%)</Typography>
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Stack>
              ) : (
                <EmptyChart message="No subscription data available yet. Plans will appear once customers complete registration." />
              )}
            </ChartCard>
          </Grid>
          {/* Customer Health — Primary (8 cols) */}
          <Grid item xs={12} md={8}>
            <ChartCard
              title="Customer Health"
              subtitle="Engagement segment distribution"
              metrics={[
                { label: "Healthy", value: `${healthyPct}%`, color: semantic.success },
                { label: "At Risk", value: formatNumber(atRiskCount), color: atRiskCount > 0 ? semantic.warning : semantic.success },
                { label: "Total", value: formatNumber(totalHealthCustomers) },
                { label: "Retention", value: totalHealthCustomers > 0 ? `${healthyPct}%` : "—", color: healthyPct >= 70 ? semantic.success : semantic.warning },
              ]}
              insight={totalHealthCustomers > 0 ? `${healthyPct}% of customers are healthy and actively engaged. ${atRiskCount > 0 ? `${atRiskCount} customer(s) require attention — proactive outreach can prevent churn. Focus retention efforts on the at-risk segment.` : "All customers are engaged. Continue monitoring for early warning signs."}` : "Health scoring will activate once customers begin engaging with platform features."}
            >
              {totalHealthCustomers > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerHealth} layout="vertical" margin={{ top: 10, right: 50, bottom: 5, left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: semantic.text, fontWeight: 600 }} axisLine={false} tickLine={false} width={75} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Customers"]} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={30} label={{ position: "right", fontSize: 13, fill: semantic.text, fontWeight: 700 }} animationDuration={800} animationEasing="ease-out">
                      {customerHealth.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No health data available yet. Customer segments will populate as users engage with the platform." />
              )}
            </ChartCard>
          </Grid>
        </Grid>
      </Box>

      {/* ═══ SECTION 3: PLATFORM INTELLIGENCE ═══ */}
      <Box>
        <SectionHeader icon="🖥" title="PLATFORM INTELLIGENCE" subtitle="Platform usage and operational health." />
        <Grid container spacing={3} sx={{ mt: 0.5, "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          {/* Platform Activity — Primary (8 cols) */}
          <Grid item xs={12} md={8}>
            <ChartCard
              title="Platform Activity"
              subtitle="Daily login frequency (last 7 days)"
              metrics={[
                { label: "Total Logins", value: formatNumber(totalLogins) },
                { label: "Avg/Day", value: formatNumber(avgLogins) },
                { label: "Peak Day", value: peakDay?.day || "—" },
                { label: "Availability", value: `${healthPct}%`, color: healthPct >= 95 ? semantic.success : semantic.warning },
              ]}
              insight={peakDay ? `Peak activity occurs on ${peakDay.day} with ${peakDay.logins} sessions. Average daily engagement is ${avgLogins} logins. ${avgLogins > 5 ? "Platform engagement is healthy — users are returning consistently." : "Platform engagement is building. Focus on activation campaigns to increase daily usage."}` : "Activity tracking has started. Login data will populate over the next 7 days as users access the platform."}
            >
              {platformActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformActivity} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 13, fill: semantic.text, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Logins"]} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                    <Bar dataKey="logins" fill={semantic.info} radius={[8, 8, 0, 0]} barSize={38} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No activity data available yet. Daily login metrics will appear as users begin accessing the platform." />
              )}
            </ChartCard>
          </Grid>
          {/* Feature Usage — Secondary (4 cols) */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Feature Usage"
              subtitle="Records per module (last 30 days)"
              metrics={[
                { label: "Total Records", value: formatNumber(totalRecords) },
                { label: "Top Module", value: topFeature?.name || "—" },
                { label: "Modules Active", value: `${sortedFeatures.filter(f => f.records > 0).length}/${sortedFeatures.length}` },
              ]}
              insight={topFeature ? `${topFeature.name} remains the most-used module with ${formatNumber(topFeature.records)} records. ${sortedFeatures.length > 1 && sortedFeatures[sortedFeatures.length-1].records === 0 ? `${sortedFeatures[sortedFeatures.length-1].name} has zero adoption — consider in-app promotion or guided onboarding.` : sortedFeatures.length > 1 ? `${sortedFeatures[sortedFeatures.length-1].name} has the lowest adoption — consider feature education campaigns.` : "Continue monitoring feature engagement."}` : "Feature adoption tracking will activate once customers begin creating records in platform modules."}
            >
              {sortedFeatures.length > 0 && totalRecords > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedFeatures} layout="vertical" margin={{ top: 10, right: 40, bottom: 5, left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: semantic.text, fontWeight: 600 }} axisLine={false} tickLine={false} width={75} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Records"]} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                    <Bar dataKey="records" radius={[0, 8, 8, 0]} barSize={22} label={{ position: "right", fontSize: 12, fill: semantic.textSecondary, fontWeight: 600 }} animationDuration={800} animationEasing="ease-out">
                      {sortedFeatures.map((f, i) => <Cell key={i} fill={f.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No feature usage data yet. Records will appear once customers begin using platform modules." />
              )}
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
              <Box onClick={() => navigate(a.path)} sx={{ p: 2.5, borderRadius: radius.lg, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, textAlign: "center", cursor: "pointer", transition: transitions.smooth, position: "relative", overflow: "hidden", "&:hover": { boxShadow: shadows.md, transform: "translateY(-3px)", borderColor: semantic.borderHover, bgcolor: semantic.surface, "& .action-icon": { transform: "scale(1.15)" }, "& .action-arrow": { opacity: 1, transform: "translateX(0)" } } }}>
                <Typography className="action-icon" sx={{ fontSize: "1.5rem", mb: 0.75, transition: transitions.smooth, display: "inline-block" }}>{a.icon}</Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: semantic.text }}>{a.title}</Typography>
                <Box className="action-arrow" sx={{ position: "absolute", top: 10, right: 10, opacity: 0, transform: "translateX(-4px)", transition: transitions.normal }}>
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
              <Box sx={{ py: 5, textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>📋</Typography>
                <Typography sx={{ fontSize: "0.85rem", color: semantic.textSecondary, fontWeight: 500 }}>No recent activity</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: semantic.textTertiary, mt: 0.5 }}>Events will appear here as customers sign up and make payments.</Typography>
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
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: healthPct >= 80 ? semantic.successText : semantic.warningText }}>{healthPct}% Operational</Typography>
              </Box>
            </Stack>
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              {health && Object.entries(health.services).map(([name, svc]) => (
                <Box key={name} sx={{ p: 2, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, transition: transitions.normal }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: svc.status === "healthy" ? semantic.success : svc.status === "warning" ? semantic.warning : semantic.error, boxShadow: `0 0 6px ${svc.status === "healthy" ? semantic.success : semantic.warning}40` }} />
                      <Typography sx={{ fontSize: "0.78rem", color: semantic.text, fontWeight: 600, textTransform: "capitalize" }}>{name}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {svc.latency && <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{svc.latency}ms</Typography>}
                      <Box sx={{ px: 1, py: 0.25, borderRadius: radius.xs, bgcolor: svc.status === "healthy" ? semantic.successBg : semantic.warningBg }}>
                        <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: svc.status === "healthy" ? semantic.successText : semantic.warningText, textTransform: "uppercase", letterSpacing: 0.3 }}>{svc.status === "healthy" ? "OK" : svc.status}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
            {/* Infrastructure Summary */}
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${semantic.border}` }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Availability</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: semantic.text, fontWeight: 600 }}>{healthPct}%</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Services Online</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: semantic.text, fontWeight: 600 }}>{health ? Object.values(health.services).filter(s => s.status === "healthy").length : 0}/{health ? Object.values(health.services).length : 0}</Typography>
              </Stack>
            </Box>
          </FxCard>
        </Grid>
      </Grid>

    </Stack>
  );
}


// ═══ CONSTANTS ══════════════════════════════════════════════

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  fontSize: 13,
  padding: "12px 16px",
  backdropFilter: "blur(8px)",
};

// ═══ HELPER COMPONENTS ══════════════════════════════════════

function SectionHeader({ icon, title, subtitle }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography sx={{ fontSize: "1rem" }}>{icon}</Typography>
        <Typography sx={{ ...typo.sectionCaption, color: semantic.text, fontSize: "0.72rem" }}>{title}</Typography>
      </Stack>
      {subtitle && <Typography sx={{ fontSize: "0.78rem", color: semantic.textTertiary, mt: 0.5, ml: 4.5 }}>{subtitle}</Typography>}
      <Box sx={{ mt: 2, height: 1, background: `linear-gradient(90deg, ${semantic.border} 0%, transparent 100%)` }} />
    </Box>
  );
}

function PillBadge({ label, value, color }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: radius.pill, bgcolor: `${color}20`, backdropFilter: "blur(4px)" }}>
      <Typography sx={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.62rem", color, fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

function KpiCard({ value, label, color, icon, sub, trend }) {
  return (
    <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: radius.lg, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, boxShadow: shadows.xs, transition: transitions.smooth, "&:hover": { boxShadow: shadows.md, transform: "translateY(-2px)", borderColor: semantic.borderHover } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: radius.md, bgcolor: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>{icon}</Box>
        <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: semantic.textSecondary, lineHeight: 1.3 }}>{label}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="baseline">
        <Typography sx={{ ...typo.metricValue, color: semantic.text, mb: 0.75 }}>{value}</Typography>
        {trend && trend.value !== 0 && (
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: trend.direction === "up" ? semantic.success : trend.direction === "down" ? semantic.error : semantic.textTertiary }}>
            {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "▬"} {Math.abs(trend.value)}%
          </Typography>
        )}
      </Stack>
      <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary, fontWeight: 500 }}>{sub}</Typography>
    </Box>
  );
}

function ChartCard({ title, subtitle, metrics, insight, children }) {
  return (
    <FxCard sx={{ p: { xs: 3, md: 4 }, height: "100%", width: "100%", minWidth: 0, display: "flex", flexDirection: "column", minHeight: 420, borderRadius: radius.xl, transition: transitions.normal }}>
      {/* Header */}
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: semantic.text, letterSpacing: "-0.01em" }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: "0.75rem", color: semantic.textTertiary, mt: 0.25 }}>{subtitle}</Typography>}
      </Box>
      {/* Executive Metrics Strip */}
      {metrics && metrics.length > 0 && (
        <Stack direction="row" spacing={0} sx={{ mb: 2.5, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, overflow: "hidden" }}>
          {metrics.map((m, i) => (
            <Box key={i} sx={{ flex: 1, py: 1.5, px: 1.5, borderRight: i < metrics.length - 1 ? `1px solid ${semantic.border}` : "none", textAlign: "center" }}>
              <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.25 }}>{m.label}</Typography>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: m.color || semantic.text, letterSpacing: "-0.02em" }}>{m.value}</Typography>
            </Box>
          ))}
        </Stack>
      )}
      {/* Chart Area */}
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {children}
      </Box>
      {/* Executive Insight Footer */}
      {insight && (
        <Box sx={{ mt: "auto", pt: 2, borderTop: `1px solid ${semantic.border}` }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box sx={{ width: 22, height: 22, borderRadius: radius.xs, bgcolor: `${semantic.info}08`, border: `1px solid ${semantic.info}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: "1px" }}>
              <Typography sx={{ fontSize: "0.6rem" }}>💡</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.info, textTransform: "uppercase", letterSpacing: 0.6, mb: 0.25 }}>Executive Insight</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary, lineHeight: 1.6 }}>{insight}</Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </FxCard>
  );
}

function EmptyChart({ message }) {
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", py: 4, minHeight: 200 }}>
      <Box sx={{ width: "80%", height: 120, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px dashed ${semantic.border}`, display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
        <Stack spacing={0.5} alignItems="center">
          <Box sx={{ width: 48, height: 3, borderRadius: 2, bgcolor: semantic.border }} />
          <Box sx={{ width: 64, height: 3, borderRadius: 2, bgcolor: semantic.border }} />
          <Box sx={{ width: 36, height: 3, borderRadius: 2, bgcolor: semantic.border }} />
          <Box sx={{ width: 56, height: 3, borderRadius: 2, bgcolor: semantic.border }} />
        </Stack>
      </Box>
      <Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary, textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>{message}</Typography>
    </Box>
  );
}

function BriefingLine({ icon, color, text }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ width: 20, height: 20, borderRadius: radius.xs, bgcolor: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: "2px" }}>
        <Typography sx={{ fontSize: "0.7rem", color, lineHeight: 1 }}>{icon}</Typography>
      </Box>
      <Typography sx={{ fontSize: "0.85rem", color: semantic.textSecondary, lineHeight: 1.6 }}>{text}</Typography>
    </Stack>
  );
}

function ForecastMetric({ label, value, trend, negative }) {
  const trendColor = negative
    ? (trend === "up" ? semantic.success : trend === "down" ? semantic.error : semantic.textTertiary)
    : (trend === "up" ? semantic.success : trend === "down" ? semantic.error : semantic.textTertiary);
  const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : "▬";
  return (
    <Box sx={{ textAlign: "center", p: 2, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
      <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.75 }}>{label}</Typography>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: semantic.text, letterSpacing: "-0.02em" }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: trendColor, mt: 0.5 }}>{trendIcon} {trend === "stable" ? "Stable" : trend === "up" ? "Growing" : trend === "down" ? "Declining" : trend}</Typography>
    </Box>
  );
}

function HorizonCard({ label, icon, text, active }) {
  return (
    <Box sx={{ p: 2, borderRadius: radius.md, bgcolor: active ? `${semantic.info}06` : "transparent", border: active ? `1px solid ${semantic.info}20` : `1px solid ${semantic.border}` }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: "0.6rem", color: active ? semantic.info : semantic.textTertiary }}>{icon}</Typography>
        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: active ? semantic.info : semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary, lineHeight: 1.6 }}>{text}</Typography>
    </Box>
  );
}

function ImpactRow({ label, value, level, negative }) {
  const color = level === "high"
    ? (negative ? semantic.error : semantic.success)
    : level === "medium"
      ? semantic.warning
      : semantic.textTertiary;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ fontSize: "0.68rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color }}>{value}</Typography>
    </Stack>
  );
}
