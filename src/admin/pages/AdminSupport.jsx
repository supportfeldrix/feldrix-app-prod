/**
 * ============================================================
 * Feldrix Control Centre — AI Operations (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip, Chip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, FxCard, FxStatusChip, FxEmptyState, semantic, typography as typo, shadows, radius, transitions } from "../../shared/design";
import { getExecutiveBriefing, getRecommendations, getPredictions, getExecutiveAlerts, getOpportunities, getExecutiveTimeline } from "../services/adminAIService";
import { formatRelativeTime } from "../utils/adminFormatters";

const PRIORITY_COLORS = { critical: semantic.error, warning: semantic.warning, healthy: semantic.success, opportunity: "#8B5CF6", success: semantic.success, information: semantic.info };

export default function AdminSupport() {
  const [briefing, setBriefing] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [opportunities, setOpportunities] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([getExecutiveBriefing(), getRecommendations(), getPredictions(), getExecutiveAlerts(), getOpportunities(), getExecutiveTimeline()])
      .then(([b, r, p, a, o, t]) => { setBriefing(b); setRecommendations(r); setPredictions(p); setAlerts(a); setOpportunities(o); setTimeline(t); })
      .catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Stack spacing={4}>
        <Box><Skeleton variant="rounded" height={32} width={220} /><Skeleton variant="rounded" height={18} width={380} sx={{ mt: 1 }} /></Box>
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>AI Operations</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Executive decision support powered by platform intelligence.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={load} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Stack>

      {/* Executive Briefing */}
      <FxCard sx={{ position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #3B82F6, #06B6D4)" }} />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#6366F112", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🧠</Box>
          <Box>
            <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: semantic.text }}>{briefing?.greeting || "Executive Briefing"}</Typography>
            <Typography sx={{ fontSize: "0.7rem", color: semantic.textTertiary }}>AI-generated platform intelligence</Typography>
          </Box>
        </Stack>
        <Stack spacing={1.25}>
          {(briefing?.points || []).map((p, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: PRIORITY_COLORS[p.priority] || semantic.textTertiary, flexShrink: 0 }} />
              <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{p.text}</Typography>
            </Stack>
          ))}
        </Stack>
      </FxCard>

      {/* Alerts */}
      <Section title="Executive Alerts">
        <Stack spacing={1.5}>
          {alerts.map((a) => (
            <FxCard key={a.id} sx={{ py: 2, px: 2.5, borderLeft: `3px solid ${PRIORITY_COLORS[a.severity] || semantic.info}` }}>
              <Typography sx={{ ...typo.bodySmall, fontWeight: 700, color: semantic.text }}>{a.title}</Typography>
              <Typography sx={{ ...typo.caption, color: semantic.textSecondary, mt: 0.25 }}>{a.description}</Typography>
            </FxCard>
          ))}
        </Stack>
      </Section>

      {/* Recommendations */}
      <Section title="Recommendations">
        <Stack spacing={2}>
          {recommendations.map((rec) => (
            <FxCard key={rec.id} sx={{ borderLeft: `3px solid ${PRIORITY_COLORS[rec.priority] || semantic.info}` }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography sx={{ ...typo.cardTitle, color: semantic.text }}>{rec.title}</Typography>
                <Chip label={`${rec.confidence}%`} size="small" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 700, bgcolor: `${PRIORITY_COLORS[rec.priority]}15`, color: PRIORITY_COLORS[rec.priority] }} />
              </Stack>
              <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary, mb: 0.5 }}>{rec.reason}</Typography>
              <Typography sx={{ ...typo.caption, color: semantic.info, fontWeight: 600 }}>→ {rec.action}</Typography>
            </FxCard>
          ))}
        </Stack>
      </Section>

      {/* Predictions + Opportunities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Section title="Predictive Insights">
            <Grid container spacing={2}>
              {predictions.map((p) => (
                <Grid item xs={6} key={p.id}>
                  <FxCard sx={{ textAlign: "center", py: 2.5 }}>
                    <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text }}>{p.value}</Typography>
                    <Typography sx={{ ...typo.tiny, color: semantic.textSecondary, textTransform: "uppercase", mt: 0.25 }}>{p.label}</Typography>
                    <Typography sx={{ fontSize: "0.62rem", color: p.trend === "up" ? semantic.success : p.trend === "down" ? semantic.error : semantic.textTertiary, mt: 0.5 }}>
                      {p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "→"} {p.confidence}%
                    </Typography>
                  </FxCard>
                </Grid>
              ))}
            </Grid>
          </Section>
        </Grid>
        <Grid item xs={12} md={6}>
          <Section title="Opportunities">
            <Grid container spacing={2}>
              <Grid item xs={6}><FxStatCard icon="⬆️" label="Upgrade" value={opportunities?.upgradeTargets || 0} color="#8B5CF6" subtitle="Targets" /></Grid>
              <Grid item xs={6}><FxStatCard icon="⚠️" label="At Risk" value={opportunities?.atRisk || 0} color="#EF4444" subtitle="30d+" /></Grid>
              <Grid item xs={6}><FxStatCard icon="🔥" label="Engaged" value={opportunities?.highEngagement || 0} color="#16A34A" /></Grid>
              <Grid item xs={6}><FxStatCard icon="🎯" label="Total" value={opportunities?.totalOpportunities || 0} color="#3B82F6" /></Grid>
            </Grid>
          </Section>
        </Grid>
      </Grid>

      {/* Timeline */}
      <Section title="Executive Timeline">
        {timeline.length === 0 ? <FxEmptyState icon="📅" title="No events" description="Platform events will appear here." /> : (
          <FxCard>
            <Stack spacing={1.5}>
              {timeline.slice(0, 10).map((e, i) => (
                <Stack key={i} direction="row" spacing={2} alignItems="flex-start" sx={{ py: 0.75, borderBottom: i < timeline.length - 1 ? `1px solid ${semantic.border}` : "none" }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: e.type === "alert" ? `${semantic.error}10` : e.type === "payment" ? `${semantic.success}10` : `${semantic.info}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>
                    {e.type === "signup" ? "👤" : e.type === "payment" ? "💰" : "📋"}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{e.title}</Typography>
                    {e.subtitle && <Typography sx={{ ...typo.caption, color: semantic.textTertiary }}>{e.subtitle}</Typography>}
                  </Box>
                  <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, flexShrink: 0 }}>{formatRelativeTime(e.timestamp)}</Typography>
                </Stack>
              ))}
            </Stack>
          </FxCard>
        )}
      </Section>
    </Stack>
  );
}

function Section({ title, children }) {
  return <Box><Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>{title}</Typography>{children}</Box>;
}
