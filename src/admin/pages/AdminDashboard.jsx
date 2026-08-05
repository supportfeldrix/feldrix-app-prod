/**
 * ============================================================
 * Feldrix Control Centre â€” Executive Command Centre
 * Version 2.3.1.1 â€” Consolidation & Premium Polish
 * Enterprise-grade: Azure Monitor / Datadog / Stripe density
 * ============================================================
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Grid, Skeleton, Chip } from "@mui/material";
import { ArrowForward, Refresh } from "@mui/icons-material";
import { Line, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, Legend } from "recharts";
import { FxCard, semantic, typography as typo, shadows, radius, transitions } from "../../shared/design";
import { useAdminContext } from "../context/AdminContext";
import { getDashboardMetrics } from "../services/adminAnalyticsService";
import { getSystemHealth } from "../services/adminSystemService";
import { getCustomerGrowth, getRevenueGrowth, getSubscriptionBreakdown, getPlatformActivity, getFeatureUsage, getCustomerHealthDistribution } from "../services/adminBIService";
import { formatNumber, formatCurrency } from "../utils/adminFormatters";
import { runIntelligenceAnalysis } from "../services/adminExecutiveIntelligenceService";
import { runPredictiveAnalysis } from "../services/adminPredictiveIntelligenceService";
import { runOperationsAnalysis } from "../services/adminOperationsService";
import { runLiveMonitoring } from "../services/adminLiveMonitoringService";
import { runExecutiveTimeline } from "../services/adminExecutiveTimelineService";
import AnalyticsWorkspace from "../components/AnalyticsWorkspace";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin } = useAdminContext();
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [subBreakdown, setSubBreakdown] = useState([]);
  const [platformActivity, setPlatformActivity] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [customerHealth, setCustomerHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  // â”€â”€â”€ Live Monitoring State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveLastUpdated, setLiveLastUpdated] = useState(null);

  const refreshLiveMonitoring = useCallback(async () => {
    try {
      const data = await runLiveMonitoring();
      setLiveData(data);
      setLiveLastUpdated(new Date());
    } catch { /* graceful */ }
    finally { setLiveLoading(false); }
  }, []);

  // Initial load + 30s polling
  useEffect(() => {
    refreshLiveMonitoring();
    const interval = setInterval(refreshLiveMonitoring, 30000);
    return () => clearInterval(interval);
  }, [refreshLiveMonitoring]);

  // â”€â”€â”€ Executive Timeline State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState("All");
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineVisible, setTimelineVisible] = useState(30);

  const loadTimeline = useCallback(async () => {
    try {
      const data = await runExecutiveTimeline({ limit: 100 });
      setTimelineData(data);
    } catch { /* graceful */ }
    finally { setTimelineLoading(false); }
  }, []);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  // â”€â”€â”€ Analytics Workspace State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (!timelineData?.timeline) return [];
    let events = timelineData.timeline;
    if (timelineFilter !== "All") {
      events = events.filter(e => e.category === timelineFilter);
    }
    if (timelineSearch.trim()) {
      const q = timelineSearch.toLowerCase();
      events = events.filter(e =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q) ||
        (e.user || "").toLowerCase().includes(q) ||
        (e.farm || "").toLowerCase().includes(q)
      );
    }
    return events;
  }, [timelineData, timelineFilter, timelineSearch]);

  // Grouped timeline
  const groupedTimeline = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

    const groups = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };
    filteredTimeline.slice(0, timelineVisible).forEach(e => {
      const ts = new Date(e.timestamp);
      if (ts >= todayStart) groups.Today.push(e);
      else if (ts >= yesterdayStart) groups.Yesterday.push(e);
      else if (ts >= weekStart) groups["This Week"].push(e);
      else groups.Earlier.push(e);
    });
    return groups;
  }, [filteredTimeline, timelineVisible]);

  useEffect(() => {
    async function load() {
      try {
        const [m, h, g, r, sb, pa, fu, ch] = await Promise.all([
          getDashboardMetrics(), getSystemHealth(),
          getCustomerGrowth(), getRevenueGrowth(), getSubscriptionBreakdown(),
          getPlatformActivity(), getFeatureUsage(), getCustomerHealthDistribution(),
        ]);
        setMetrics(m); setHealth(h); setGrowth(g); setRevenue(r);
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

  // Executive Intelligence â€” computed from existing dashboard data (no extra API calls)
  const intelligenceData = { metrics, health, growth, revenue, subBreakdown, platformActivity, featureUsage, customerHealth };
  const intelligence = !loading && metrics ? runIntelligenceAnalysis(intelligenceData) : null;

  // Predictive Intelligence â€” forecasts, upgrade/churn predictions, priorities
  const predictions = !loading && metrics ? runPredictiveAnalysis(intelligenceData) : null;

  // AI Operations â€” prioritised queue, impact, revenue opportunities
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

      {/* â•â•â• DARK EXECUTIVE BANNER â•â•â• */}
      <Box sx={{ px: { xs: 3, md: 4.5 }, py: { xs: 3, md: 3.5 }, borderRadius: radius.xl, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ position: "relative" }}>
          <Box>
            <Typography sx={{ fontSize: { xs: "1.4rem", md: "1.6rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {greeting}, {admin?.name?.split(" ")[0] || "Admin"}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", mt: 0.5 }}>{dateStr}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", mt: 0.25 }}>Executive Command Centre â€” Real-time platform intelligence</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <PillBadge label="Platform" value="Healthy" color={semantic.success} />
            <PillBadge label="Database" value="Online" color={semantic.info} />
            <PillBadge label="Services" value={`${healthPct}%`} color="#8B5CF6" />
            <PillBadge label="AI Engine" value="Active" color={semantic.success} />
          </Stack>
        </Stack>
      </Box>

      {/* â•â•â• EXECUTIVE INTELLIGENCE â•â•â• */}
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
                    <Typography sx={{ fontSize: "0.7rem" }}>ðŸŽ¯</Typography>
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
                    <Typography sx={{ fontSize: "0.7rem" }}>ðŸš€</Typography>
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
                    <Typography sx={{ fontSize: "0.7rem" }}>{intelligence.summary.topRisk ? "âš ï¸" : "âœ“"}</Typography>
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
                <Typography sx={{ fontSize: "0.7rem" }}>ðŸ’¡</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.25 }}>Executive Recommendation</Typography>
                <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary, lineHeight: 1.6 }}>{intelligence.summary.briefing}</Typography>
              </Box>
            </Stack>
          </Box>
        </FxCard>
      )}

      {/* â•â•â• EXECUTIVE BRIEFING + TODAY'S PRIORITY â•â•â• */}
      <FxCard sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 } }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #3B82F6, #06B6D4)" }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: radius.md, bgcolor: "#6366F112", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>ðŸ§ </Box>
              <Box>
                <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: semantic.text }}>Executive Briefing</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>AI-generated Â· Updated now</Typography>
              </Box>
            </Stack>
            <Stack spacing={1.5}>
              <BriefingLine icon="âœ“" color={semantic.success} text={`${formatNumber(metrics?.totalUsers)} registered customers. ${formatNumber(metrics?.activeUsers)} active (${activePct}% engagement rate).`} />
              {metrics?.todaySignups > 0 && <BriefingLine icon="âœ“" color={semantic.info} text={`${metrics.todaySignups} new sign-up(s) today â€” acquisition pipeline is active.`} />}
              {metrics?.revenueMonth > 0 ? <BriefingLine icon="âœ“" color={semantic.success} text={`MRR: ${formatCurrency(metrics.revenueMonth)}. Projected ARR: ${formatCurrency(projectedARR)}. Revenue trajectory is positive.`} /> : <BriefingLine icon="âš " color={semantic.warning} text="No revenue recorded yet. Converting the first PRO subscriber should be the primary objective." />}
              {(metrics?.pendingPayments || 0) > 0 ? <BriefingLine icon="âš " color={semantic.warning} text={`${metrics.pendingPayments} pending payment(s) require immediate review to maintain cash flow.`} /> : <BriefingLine icon="âœ“" color={semantic.success} text="All payments processed. No outstanding issues." />}
              <BriefingLine icon="âœ“" color={healthPct >= 80 ? semantic.success : semantic.warning} text={`Infrastructure health: ${healthPct}%. ${healthPct >= 95 ? "All systems nominal." : "Monitor degraded services."}`} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, borderRadius: radius.lg, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 2 }}>Today's Priority</Typography>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: semantic.text, lineHeight: 1.6, mb: 2.5, flex: 1 }}>
                {metrics?.pendingPayments > 0 ? "Review pending payments and ensure cash flow continuity. Unresolved payments impact MRR projections." : metrics?.proSubscribers === 0 ? "Convert the first PRO subscriber. This establishes the revenue baseline and validates pricing." : "Monitor growth trajectories and platform engagement. Current trajectory is healthy."}
              </Typography>
              <Chip label="View AI Operations â†’" onClick={() => navigate("/support")} size="small" sx={{ alignSelf: "flex-start", bgcolor: `${semantic.info}10`, color: semantic.info, fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", transition: transitions.normal, "&:hover": { bgcolor: `${semantic.info}18` } }} />
            </Box>
          </Grid>
        </Grid>
      </FxCard>

      {/* â•â•â• EXECUTIVE KPI CARDS â•â•â• */}
      {/* Forecast Panel */}
      {predictions && (
        <FxCard sx={{ p: { xs: 3, md: 4 }, position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)" }} />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: radius.md, bgcolor: "#06B6D410", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>ðŸ”®</Box>
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
              <ForecastMetric label="Expected MRR" value={predictions.executiveForecast.forecast.expectedMRR > 0 ? formatCurrency(predictions.executiveForecast.forecast.expectedMRR) : "â€”"} trend={predictions.revenueForecast.trend === "growing" ? "up" : predictions.revenueForecast.trend === "declining" ? "down" : "stable"} />
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
                <HorizonCard label="Yesterday" icon="â—€" text={predictions.executiveForecast.summary.yesterday} />
              </Grid>
              <Grid item xs={12} md={4}>
                <HorizonCard label="Today" icon="â—" text={predictions.executiveForecast.summary.today} active />
              </Grid>
              <Grid item xs={12} md={4}>
                <HorizonCard label="Tomorrow" icon="â–¶" text={predictions.executiveForecast.summary.tomorrow} />
              </Grid>
            </Grid>
          </Box>
        </FxCard>
      )}

      {/* Executive Priorities */}
      {predictions?.executiveForecast?.priorities?.length > 0 && (
        <FxCard sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: radius.md, bgcolor: `${semantic.warning}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>ðŸŽ¯</Box>
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
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.totalUsers)} label="Total Customers" color={semantic.info} icon="ðŸ‘¥" sub="Lifetime registrations" trend={predictions?.executiveForecast?.trends?.customers} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.activeUsers)} label="Active Customers" color="#0EA5E9" icon="ðŸ“¡" sub={`${activePct}% engagement`} trend={predictions?.executiveForecast?.trends?.activity} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.proSubscribers)} label="PRO Subscribers" color="#8B5CF6" icon="â­" sub="Paying customers" /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={metrics?.revenueMonth > 0 ? formatCurrency(metrics.revenueMonth) : "â€”"} label="Monthly Revenue" color={semantic.success} icon="ðŸ’°" sub="Current MRR" trend={predictions?.executiveForecast?.trends?.revenue} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={`${healthPct}%`} label="Platform Health" color={healthPct >= 80 ? semantic.success : semantic.warning} icon="ðŸŸ¢" sub="Service availability" trend={predictions?.executiveForecast?.trends?.health} /></Grid>
        <Grid item xs={6} sm={4} md={2}><KpiCard value={formatNumber(metrics?.pendingPayments || 0)} label="Pending Actions" color={metrics?.pendingPayments > 0 ? semantic.error : semantic.success} icon="âš ï¸" sub={metrics?.pendingPayments > 0 ? "Requires attention" : "All clear"} /></Grid>
      </Grid>

      {/* â•â•â• AI OPERATIONS CENTRE â•â•â• */}
      {operations && (
        <Box>
          <SectionHeader icon="ðŸ¤–" title="AI OPERATIONS CENTRE" subtitle="Prioritised actions ranked by business impact. Your AI-powered work queue." />
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
                    <ImpactRow label="Revenue Gain" value={operations.impact.revenueGain.value > 0 ? `+R${operations.impact.revenueGain.value}/mo` : "â€”"} level={operations.impact.revenueGain.level} />
                    <ImpactRow label="Revenue at Risk" value={operations.impact.revenueAtRisk.value > 0 ? `R${operations.impact.revenueAtRisk.value}/mo` : "â€”"} level={operations.impact.revenueAtRisk.level} negative />
                    <ImpactRow label="Customers Impacted" value={operations.impact.customersAffected.value} level={operations.impact.customersAffected.level} />
                    <ImpactRow label="Health Improvement" value={operations.impact.healthImprovement.value > 0 ? `+${operations.impact.healthImprovement.value} pts` : "â€”"} level={operations.impact.healthImprovement.level} />
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
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.success }}>{operations.revenueOps.potentialMRR > 0 ? `R${operations.revenueOps.potentialMRR}` : "â€”"}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Potential ARR</Typography>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.text }}>{operations.revenueOps.potentialARR > 0 ? `R${operations.revenueOps.potentialARR}` : "â€”"}</Typography>
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

      {/* â•â•â• LIVE OPERATIONS CENTRE â•â•â• */}
      <Box>
        <SectionHeader icon="ðŸ“¡" title="LIVE OPERATIONS CENTRE" subtitle="Unified real-time event stream, platform health, and executive summary." />
        <FxCard sx={{ p: { xs: 3, md: 4 }, position: "relative", overflow: "hidden", mt: 1.5 }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #16A34A, #06B6D4, #3B82F6, #8B5CF6)" }} />
          <Grid container spacing={3}>
            {/* LEFT: Unified Event Stream (9 cols) */}
            <Grid item xs={12} md={9}>
              <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <LiveDot color={semantic.success} pulse />
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: semantic.text }}>Event Stream</Typography>
                  <Box sx={{ px: 1, py: 0.2, borderRadius: radius.pill, bgcolor: semantic.infoBg }}>
                    <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: semantic.infoText }}>{filteredTimeline.length} events</Typography>
                  </Box>
                </Stack>
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                    {["All", "Customer", "Farm", "Finance", "Subscription", "Operations", "Platform", "Support", "AI", "System"].map(cat => (
                      <Box key={cat} onClick={() => { setTimelineFilter(cat); setTimelineVisible(30); }} sx={{ px: 1.25, py: 0.4, borderRadius: radius.pill, bgcolor: timelineFilter === cat ? `${semantic.info}15` : "transparent", border: `1px solid ${timelineFilter === cat ? semantic.info : semantic.border}`, cursor: "pointer", transition: transitions.fast, "&:hover": { borderColor: semantic.borderHover } }}>
                        <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: timelineFilter === cat ? semantic.info : semantic.textSecondary }}>{cat}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <input type="text" placeholder="Search â€” customer, farm, payment, keyword..." value={timelineSearch} onChange={e => { setTimelineSearch(e.target.value); setTimelineVisible(30); }} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.08)", background: "#F8FAFC", fontSize: "0.72rem", fontFamily: "Inter, sans-serif", outline: "none", color: "#0F172A", transition: "border-color 0.2s" }} />
                </Stack>
                <Box sx={{ flex: 1, maxHeight: 520, overflowY: "auto", pr: 1, position: "relative", pl: 3, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { borderRadius: 2, bgcolor: semantic.border } }}>
                  <Box sx={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 2, bgcolor: semantic.border, borderRadius: 1 }} />
                  {timelineLoading ? (
                    <Stack spacing={1.5}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: radius.md }} />)}</Stack>
                  ) : filteredTimeline.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography sx={{ fontSize: "1.2rem", mb: 1 }}>ðŸ“¡</Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary }}>No events found</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, mt: 0.5 }}>Events will appear as platform activity occurs.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={0}>
                      {Object.entries(groupedTimeline).map(([group, events]) => events.length > 0 && (
                        <Box key={group}>
                          <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.25, mt: 1.5, ml: 1 }}>{group}</Typography>
                          <Stack spacing={1}>{events.map((event, i) => <TimelineEvent key={event.id} event={event} index={i} navigate={navigate} />)}</Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {filteredTimeline.length > timelineVisible && (
                    <Box onClick={() => setTimelineVisible(v => v + 30)} sx={{ mt: 2, mb: 1, py: 1.25, textAlign: "center", borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, cursor: "pointer", transition: transitions.normal, "&:hover": { bgcolor: `${semantic.info}06`, borderColor: semantic.borderHover } }}>
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: semantic.info }}>Load more ({filteredTimeline.length - timelineVisible} remaining)</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
            {/* RIGHT: Executive Summary Panel (3 cols) */}
            <Grid item xs={12} md={3}>
              <Box sx={{ p: 2.5, borderRadius: radius.lg, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, height: "100%" }}>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>Platform Status</Typography>
                <Stack spacing={0.6} sx={{ mb: 2 }}>
                  {(liveData?.platform?.services || [{ name: "Database", status: "healthy" }, { name: "API", status: "healthy" }, { name: "Realtime", status: "healthy" }, { name: "AI Engine", status: "healthy" }, { name: "Background Jobs", status: "healthy" }]).map((svc) => (
                    <Stack key={svc.name} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <LiveDot color={svc.status === "healthy" ? semantic.success : svc.status === "warning" ? semantic.warning : semantic.error} pulse={svc.status === "healthy"} />
                        <Typography sx={{ fontSize: "0.65rem", color: semantic.text, fontWeight: 500 }}>{svc.name}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: "0.52rem", fontWeight: 600, color: svc.status === "healthy" ? semantic.success : svc.status === "warning" ? semantic.warning : semantic.error, textTransform: "capitalize" }}>{svc.status}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>Live Counters</Typography>
                <Grid container spacing={0.75} sx={{ mb: 2 }}>
                  <Grid item xs={6}><LiveCounter label="Online" value={liveData?.customers?.customersOnline || 0} color={semantic.success} /></Grid>
                  <Grid item xs={6}><LiveCounter label="Payments" value={liveData?.payments?.paymentsToday || 0} color={semantic.info} /></Grid>
                  <Grid item xs={6}><LiveCounter label="Support" value={liveData?.support?.openTickets || 0} color={semantic.warning} /></Grid>
                  <Grid item xs={6}><LiveCounter label="Farms" value={liveData?.farms?.activeFarms || 0} color="#8B5CF6" /></Grid>
                </Grid>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>Today's Summary</Typography>
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  <TimelineSummaryRow icon="ðŸ‘¤" label="Registrations" value={timelineData?.summary?.registrations || 0} />
                  <TimelineSummaryRow icon="ðŸ’°" label="Revenue" value={timelineData?.summary?.revenue > 0 ? `R${timelineData.summary.revenue}` : "â€”"} />
                  <TimelineSummaryRow icon="ðŸšœ" label="Farm Activity" value={timelineData?.summary?.farmActivity || 0} />
                  <TimelineSummaryRow icon="âš ï¸" label="Alerts" value={timelineData?.summary?.platformAlerts || 0} />
                </Stack>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>Statistics</Typography>
                <Stack spacing={0.6} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>Most Active</Typography><Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: semantic.info }}>{timelineData?.statistics?.mostActiveModule || "â€”"}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>Top Customer</Typography><Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: semantic.text, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{timelineData?.statistics?.mostActiveCustomer || "â€”"}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>Events Today</Typography><Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: semantic.text }}>{timelineData?.statistics?.eventsToday || 0}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>This Week</Typography><Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: semantic.text }}>{timelineData?.statistics?.eventsWeek || 0}</Typography></Stack>
                </Stack>
                {liveData?.alerts?.length > 0 && (<><Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>Alerts</Typography><Stack spacing={0.6} sx={{ mb: 2 }}>{liveData.alerts.slice(0, 3).map((alert, i) => (<Stack key={i} direction="row" spacing={0.75} alignItems="flex-start"><Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: alert.severity === "critical" ? semantic.error : alert.severity === "warning" ? semantic.warning : semantic.info, flexShrink: 0, mt: "4px" }} /><Typography sx={{ fontSize: "0.6rem", color: semantic.textSecondary, lineHeight: 1.4 }}>{alert.title}</Typography></Stack>))}</Stack></>)}
                <Box sx={{ pt: 1.5, borderTop: `1px solid ${semantic.border}` }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: "0.58rem", color: semantic.textTertiary }}>Last Refresh</Typography><Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: semantic.text }}>{liveLastUpdated ? liveLastUpdated.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "â€”"}</Typography></Stack>
                    <Box onClick={refreshLiveMonitoring} sx={{ mt: 0.75, py: 0.6, borderRadius: radius.sm, bgcolor: `${semantic.info}08`, border: `1px solid ${semantic.info}15`, textAlign: "center", cursor: "pointer", transition: transitions.normal, "&:hover": { bgcolor: `${semantic.info}15` } }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center"><Refresh sx={{ fontSize: 11, color: semantic.info }} /><Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: semantic.info }}>Refresh Now</Typography></Stack>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </FxCard>
      </Box>

      {/* â•â•â• EXECUTIVE ANALYTICS HUB â•â•â• */}
      <Box>
        <SectionHeader icon="ðŸ“Š" title="EXECUTIVE ANALYTICS" subtitle="Deep-dive into business intelligence â€” click any workspace to explore." />
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          {[
            { id: "growth", icon: "ðŸ“ˆ", title: "Business Growth", lines: ["Customer growth", "Revenue trends", "Forecast"], color: semantic.info },
            { id: "customers", icon: "ðŸ‘¥", title: "Customer Intelligence", lines: ["Customer health", "Retention", "Activity"], color: "#8B5CF6" },
            { id: "revenue", icon: "ðŸ’°", title: "Revenue Intelligence", lines: ["MRR / ARR", "Payments", "Forecast"], color: semantic.success },
            { id: "farms", icon: "ðŸšœ", title: "Farm Operations", lines: ["Livestock", "Crops", "Planner"], color: "#16A34A" },
            { id: "platform", icon: "ðŸ–¥", title: "Platform Intelligence", lines: ["Usage", "Performance", "Infrastructure"], color: "#06B6D4" },
            { id: "insights", icon: "ðŸ¤–", title: "Executive Insights", lines: ["Predictions", "AI Analysis", "Opportunities"], color: "#6366F1" },
          ].map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Box onClick={() => setActiveWorkspace(card.id)} sx={{ p: 3, borderRadius: radius.lg, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, cursor: "pointer", transition: transitions.smooth, height: 170, display: "flex", flexDirection: "column", justifyContent: "space-between", "&:hover": { boxShadow: shadows.md, transform: "translateY(-3px)", borderColor: `${card.color}40`, "& .hub-arrow": { opacity: 1, transform: "translateX(0)" } } }}>
                <Box>
                  <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>{card.icon}</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: semantic.text, mb: 0.75 }}>{card.title}</Typography>
                  {card.lines.map((line, i) => <Typography key={i} sx={{ fontSize: "0.68rem", color: semantic.textTertiary, lineHeight: 1.6 }}>{line}</Typography>)}
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: card.color }}>View Analytics</Typography>
                  <ArrowForward className="hub-arrow" sx={{ fontSize: 13, color: card.color, opacity: 0, transform: "translateX(-4px)", transition: transitions.normal }} />
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <AnalyticsWorkspace open={activeWorkspace === "growth"} onClose={() => setActiveWorkspace(null)} title="Business Growth" subtitle="Customer acquisition and revenue trajectory">
        <Grid container spacing={3} sx={{ "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          <Grid item xs={12} md={8}>
            <ChartCard title="Customer Growth" subtitle="Monthly acquisition" metrics={[{ label: "Customers", value: formatNumber(latestGrowth?.totalCustomers || metrics?.totalUsers || 0) }, { label: "New", value: formatNumber(latestGrowth?.newCustomers || 0) }, { label: "Growth", value: `${growthRate >= 0 ? "+" : ""}${growthRate}%`, color: growthRate >= 0 ? semantic.success : semantic.error }]} insight={growth.length > 1 ? `Growth: ${growthRate}% MoM.` : "Tracking started."}>
              {growth.length > 1 ? (<ResponsiveContainer width="100%" height={350}><AreaChart data={growth} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}><defs><linearGradient id="gGW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={semantic.info} stopOpacity={0.15} /><stop offset="95%" stopColor={semantic.info} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: semantic.textSecondary }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} /><RTooltip contentStyle={TOOLTIP_STYLE} /><Area type="monotone" dataKey="totalCustomers" stroke={semantic.info} strokeWidth={2.5} fill="url(#gGW)" name="Total" dot={{ r: 4, fill: semantic.info, strokeWidth: 2, stroke: "#fff" }} animationDuration={800} /><Line type="monotone" dataKey="newCustomers" stroke={semantic.success} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: semantic.success }} name="New" /><Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} /></AreaChart></ResponsiveContainer>) : (<EmptyChart message="No trend available yet." />)}
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Revenue Trend" subtitle="MRR (ZAR)" metrics={[{ label: "MRR", value: latestRevenue > 0 ? formatCurrency(latestRevenue) : "—" }, { label: "ARR", value: projectedARR > 0 ? formatCurrency(projectedARR) : "—" }]} insight={latestRevenue > 0 ? `MRR: ${formatCurrency(latestRevenue)}.` : "Revenue tracking started."}>
              {revenue.length > 1 ? (<ResponsiveContainer width="100%" height={350}><AreaChart data={revenue} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}><defs><linearGradient id="rGW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={semantic.success} stopOpacity={0.15} /><stop offset="95%" stopColor={semantic.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: semantic.textSecondary }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v}`} /><RTooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`R${v}`, "Revenue"]} /><Area type="monotone" dataKey="revenue" stroke={semantic.success} strokeWidth={2.5} fill="url(#rGW)" dot={{ r: 4, fill: semantic.success, strokeWidth: 2, stroke: "#fff" }} animationDuration={800} /></AreaChart></ResponsiveContainer>) : (<EmptyChart message="No revenue trend yet." />)}
            </ChartCard>
          </Grid>
        </Grid>
      </AnalyticsWorkspace>

      <AnalyticsWorkspace open={activeWorkspace === "customers"} onClose={() => setActiveWorkspace(null)} title="Customer Intelligence" subtitle="Engagement, subscriptions, and health">
        <Grid container spacing={3} sx={{ "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          <Grid item xs={12} md={5}>
            <ChartCard title="Subscriptions" subtitle="Plan distribution" metrics={[{ label: "Total", value: formatNumber(totalSubs) }, { label: "PRO", value: formatNumber(proSubs), color: "#8B5CF6" }]} insight={totalSubs > 0 ? `PRO: ${Math.round((proSubs / totalSubs) * 100)}%.` : "No data yet."}>
              {totalSubs > 0 ? (<Stack alignItems="center" sx={{ py: 2 }}><ResponsiveContainer width={160} height={160}><PieChart><Pie data={subBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={48} paddingAngle={3} strokeWidth={0}>{subBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}</Pie><RTooltip contentStyle={TOOLTIP_STYLE} /></PieChart></ResponsiveContainer></Stack>) : (<EmptyChart message="No subscription data yet." />)}
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={7}>
            <ChartCard title="Customer Health" subtitle="Engagement segments" metrics={[{ label: "Healthy", value: `${healthyPct}%`, color: semantic.success }, { label: "At Risk", value: formatNumber(atRiskCount) }]} insight={totalHealthCustomers > 0 ? `${healthyPct}% healthy.` : "Pending."}>
              {totalHealthCustomers > 0 ? (<ResponsiveContainer width="100%" height={350}><BarChart data={customerHealth} layout="vertical" margin={{ top: 10, right: 50, bottom: 5, left: 80 }}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} /><XAxis type="number" tick={{ fontSize: 12, fill: semantic.textTertiary }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: semantic.text, fontWeight: 600 }} axisLine={false} tickLine={false} width={75} /><RTooltip contentStyle={TOOLTIP_STYLE} /><Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={30} animationDuration={800}>{customerHealth.map((c, i) => <Cell key={i} fill={c.color} />)}</Bar></BarChart></ResponsiveContainer>) : (<EmptyChart message="No health data yet." />)}
            </ChartCard>
          </Grid>
        </Grid>
      </AnalyticsWorkspace>

      <AnalyticsWorkspace open={activeWorkspace === "revenue"} onClose={() => setActiveWorkspace(null)} title="Revenue Intelligence" subtitle="MRR, ARR, payments">
        <ChartCard title="Revenue Trend" subtitle="Monthly recurring revenue (ZAR)" metrics={[{ label: "MRR", value: latestRevenue > 0 ? formatCurrency(latestRevenue) : "—" }, { label: "ARR", value: projectedARR > 0 ? formatCurrency(projectedARR) : "—" }]} insight={latestRevenue > 0 ? `MRR: ${formatCurrency(latestRevenue)}.` : "Revenue tracking started."}>
          {revenue.length > 1 ? (<ResponsiveContainer width="100%" height={400}><AreaChart data={revenue} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}><defs><linearGradient id="rGW2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={semantic.success} stopOpacity={0.15} /><stop offset="95%" stopColor={semantic.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: semantic.textSecondary }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v}`} /><RTooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`R${v}`, "Revenue"]} /><Area type="monotone" dataKey="revenue" stroke={semantic.success} strokeWidth={2.5} fill="url(#rGW2)" dot={{ r: 4, fill: semantic.success, strokeWidth: 2, stroke: "#fff" }} animationDuration={800} /></AreaChart></ResponsiveContainer>) : (<EmptyChart message="No revenue trend yet." />)}
        </ChartCard>
      </AnalyticsWorkspace>

      <AnalyticsWorkspace open={activeWorkspace === "farms"} onClose={() => setActiveWorkspace(null)} title="Farm Operations" subtitle="Livestock, crops, planner">
        <Grid container spacing={3} sx={{ "& .MuiGrid-item": { display: "flex", minWidth: 0 } }}>
          <Grid item xs={12} md={5}>
            <ChartCard title="Feature Usage" subtitle="Records per module" metrics={[{ label: "Total", value: formatNumber(totalRecords) }, { label: "Top", value: topFeature?.name || "—" }]} insight={topFeature ? `${topFeature.name} leads.` : "Tracking started."}>
              {sortedFeatures.length > 0 && totalRecords > 0 ? (<ResponsiveContainer width="100%" height={300}><BarChart data={sortedFeatures} layout="vertical" margin={{ top: 10, right: 40, bottom: 5, left: 80 }}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: semantic.text, fontWeight: 600 }} axisLine={false} tickLine={false} width={75} /><RTooltip contentStyle={TOOLTIP_STYLE} /><Bar dataKey="records" radius={[0, 8, 8, 0]} barSize={22} animationDuration={800}>{sortedFeatures.map((f, i) => <Cell key={i} fill={f.color} />)}</Bar></BarChart></ResponsiveContainer>) : (<EmptyChart message="No data yet." />)}
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={7}>
            <ChartCard title="Platform Activity" subtitle="Daily logins (7 days)" metrics={[{ label: "Total", value: formatNumber(totalLogins) }, { label: "Avg", value: formatNumber(avgLogins) }]} insight={peakDay ? `Peak: ${peakDay.day}.` : "Tracking started."}>
              {platformActivity.length > 0 ? (<ResponsiveContainer width="100%" height={300}><BarChart data={platformActivity} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 13, fill: semantic.text }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} allowDecimals={false} /><RTooltip contentStyle={TOOLTIP_STYLE} /><Bar dataKey="logins" fill={semantic.info} radius={[8, 8, 0, 0]} barSize={38} animationDuration={800} /></BarChart></ResponsiveContainer>) : (<EmptyChart message="No activity data yet." />)}
            </ChartCard>
          </Grid>
        </Grid>
      </AnalyticsWorkspace>

      <AnalyticsWorkspace open={activeWorkspace === "platform"} onClose={() => setActiveWorkspace(null)} title="Platform Intelligence" subtitle="Usage, performance, infrastructure">
        <ChartCard title="Platform Activity" subtitle="Daily logins (7 days)" metrics={[{ label: "Total", value: formatNumber(totalLogins) }, { label: "Avg/Day", value: formatNumber(avgLogins) }, { label: "Peak", value: peakDay?.day || "—" }, { label: "Health", value: `${healthPct}%` }]} insight={peakDay ? `Peak: ${peakDay.day} (${peakDay.logins}).` : "Tracking started."}>
          {platformActivity.length > 0 ? (<ResponsiveContainer width="100%" height={400}><BarChart data={platformActivity} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 13, fill: semantic.text }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: semantic.textTertiary }} axisLine={false} tickLine={false} allowDecimals={false} /><RTooltip contentStyle={TOOLTIP_STYLE} /><Bar dataKey="logins" fill={semantic.info} radius={[8, 8, 0, 0]} barSize={42} animationDuration={800} /></BarChart></ResponsiveContainer>) : (<EmptyChart message="No activity data yet." />)}
        </ChartCard>
      </AnalyticsWorkspace>

      <AnalyticsWorkspace open={activeWorkspace === "insights"} onClose={() => setActiveWorkspace(null)} title="Executive Insights" subtitle="AI predictions, risks, opportunities">
        <Stack spacing={3}>
          {intelligence && (<FxCard sx={{ p: 3 }}><Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: semantic.text, mb: 2 }}>Business Health: {intelligence.overview.healthScore}/100</Typography><Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary, lineHeight: 1.6 }}>{intelligence.summary.briefing}</Typography></FxCard>)}
          {predictions && (<FxCard sx={{ p: 3 }}><Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: semantic.text, mb: 2 }}>30-Day Forecast</Typography><Grid container spacing={2}><Grid item xs={6} sm={3}><ForecastMetric label="Customers" value={formatNumber(predictions.executiveForecast.forecast.expectedCustomers)} trend={predictions.growthForecast.trend} /></Grid><Grid item xs={6} sm={3}><ForecastMetric label="PRO" value={formatNumber(predictions.executiveForecast.forecast.expectedPRO)} trend="stable" /></Grid><Grid item xs={6} sm={3}><ForecastMetric label="Churn" value={`${predictions.churnPredictions.riskScore}%`} trend={predictions.churnPredictions.riskScore >= 50 ? "down" : "up"} negative /></Grid><Grid item xs={6} sm={3}><ForecastMetric label="Health" value={`${predictions.executiveForecast.forecast.projectedHealth}/100`} trend={predictions.executiveForecast.forecast.projectedHealth >= 70 ? "up" : "down"} /></Grid></Grid></FxCard>)}
        </Stack>
      </AnalyticsWorkspace>

    </Stack>
  );
}


// â•â•â• CONSTANTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  fontSize: 13,
  padding: "12px 16px",
  backdropFilter: "blur(8px)",
};

// â•â•â• HELPER COMPONENTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
            {trend.direction === "up" ? "â–²" : trend.direction === "down" ? "â–¼" : "â–¬"} {Math.abs(trend.value)}%
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
              <Typography sx={{ fontSize: "0.6rem" }}>ðŸ’¡</Typography>
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
  const trendIcon = trend === "up" ? "â–²" : trend === "down" ? "â–¼" : "â–¬";
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

// â•â•â• LIVE MONITOR HELPERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function LiveDot({ color, pulse }) {
  return (
    <Box sx={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
      {pulse && (
        <Box sx={{ position: "absolute", inset: -2, borderRadius: "50%", bgcolor: `${color}30`, animation: "livePulse 2s ease-in-out infinite", "@keyframes livePulse": { "0%, 100%": { transform: "scale(1)", opacity: 1 }, "50%": { transform: "scale(1.8)", opacity: 0 } } }} />
      )}
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, position: "relative" }} />
    </Box>
  );
}

function LiveCounter({ label, value, color }) {
  return (
    <Box sx={{ textAlign: "center", p: 1.5, borderRadius: radius.md, bgcolor: `${color}06`, border: `1px solid ${color}15` }}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color, lineHeight: 1, transition: transitions.smooth }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.55rem", fontWeight: 600, color: semantic.textTertiary, mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

// â•â•â• EXECUTIVE TIMELINE HELPERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const TIMELINE_CATEGORY_COLORS = {
  Customer: "#3B82F6",
  Farm: "#16A34A",
  Finance: "#F59E0B",
  Subscription: "#8B5CF6",
  Operations: "#06B6D4",
  Platform: "#64748B",
  AI: "#6366F1",
  Support: "#EC4899",
  Security: "#EF4444",
  System: "#475569",
};

const TIMELINE_PRIORITY_COLORS = {
  critical: { bg: semantic.errorBg, text: semantic.errorText },
  high: { bg: semantic.warningBg, text: semantic.warningText },
  medium: { bg: semantic.infoBg, text: semantic.infoText },
  low: { bg: semantic.neutralBg, text: semantic.neutralText },
};

function timelineTimeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function TimelineEvent({ event, index, navigate }) {
  const catColor = TIMELINE_CATEGORY_COLORS[event.category] || semantic.neutral;
  const prioStyle = TIMELINE_PRIORITY_COLORS[event.priority] || TIMELINE_PRIORITY_COLORS.low;
  return (
    <Box
      onClick={() => navigate(event.route)}
      sx={{
        position: "relative", p: 2, ml: 1, borderRadius: radius.md, bgcolor: semantic.paper,
        border: `1px solid ${semantic.border}`, cursor: "pointer", transition: transitions.smooth,
        animation: `timelineFadeIn 0.35s ease ${index * 0.03}s both`,
        "@keyframes timelineFadeIn": { from: { opacity: 0, transform: "translateX(-8px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        "&:hover": { boxShadow: shadows.sm, borderColor: semantic.borderHover, transform: "translateX(4px)", "& .tl-arrow": { opacity: 1 } },
      }}
    >
      {/* Timeline dot */}
      <Box sx={{ position: "absolute", left: -23, top: 18, width: 10, height: 10, borderRadius: "50%", bgcolor: catColor, border: "2px solid #fff", boxShadow: `0 0 0 2px ${catColor}30` }} />
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ width: 32, height: 32, borderRadius: radius.sm, bgcolor: `${catColor}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>
          {event.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{event.title}</Typography>
            <Box sx={{ px: 0.75, py: 0.15, borderRadius: radius.xs, bgcolor: `${catColor}12`, flexShrink: 0 }}>
              <Typography sx={{ fontSize: "0.5rem", fontWeight: 700, color: catColor, textTransform: "uppercase" }}>{event.category}</Typography>
            </Box>
            {event.priority !== "low" && (
              <Box sx={{ px: 0.6, py: 0.1, borderRadius: radius.xs, bgcolor: prioStyle.bg, flexShrink: 0 }}>
                <Typography sx={{ fontSize: "0.48rem", fontWeight: 700, color: prioStyle.text, textTransform: "uppercase" }}>{event.priority}</Typography>
              </Box>
            )}
            <ArrowForward className="tl-arrow" sx={{ fontSize: 12, color: semantic.textTertiary, opacity: 0, transition: transitions.fast, flexShrink: 0 }} />
          </Stack>
          <Typography sx={{ fontSize: "0.68rem", color: semantic.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.description}</Typography>
          <Typography sx={{ fontSize: "0.58rem", color: semantic.textTertiary, mt: 0.5 }}>{timelineTimeAgo(event.timestamp)}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function TimelineSummaryRow({ icon, label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography sx={{ fontSize: "0.72rem" }}>{icon}</Typography>
        <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.text }}>{value}</Typography>
    </Stack>
  );
}
