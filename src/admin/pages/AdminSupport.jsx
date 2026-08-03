/**
 * ============================================================
 * Feldrix Control Centre — AI Executive Operations Centre
 * Sprint 51.0
 *
 * Intelligence layer: briefing, recommendations, predictions,
 * alerts, opportunities, executive timeline.
 *
 * NOTE: Mounted at /support route (repurposed from placeholder).
 * Route label in sidebar is "Support" — can be renamed later.
 * This page IS the AI Operations Centre.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Grid, Typography, Stack, Skeleton, LinearProgress, Chip } from "@mui/material";
import { FxPageLayout, FxStatCard, FxCard, FxStatusChip, FxEmptyState, semantic, typography as typo } from "../../shared/design";
import {
  getExecutiveBriefing,
  getRecommendations,
  getPredictions,
  getExecutiveAlerts,
  getOpportunities,
  getExecutiveTimeline,
} from "../services/adminAIService";
import { formatRelativeTime } from "../utils/adminFormatters";

// Priority colours
const PRIORITY_COLORS = {
  critical: { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" },
  warning: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
  healthy: { bg: "#DCFCE7", text: "#166534", border: "#16A34A" },
  opportunity: { bg: "#EDE9FE", text: "#5B21B6", border: "#8B5CF6" },
  success: { bg: "#DCFCE7", text: "#166534", border: "#16A34A" },
  information: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
};

export default function AdminSupport() {
  const [briefing, setBriefing] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [opportunities, setOpportunities] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [b, r, p, a, o, t] = await Promise.all([
          getExecutiveBriefing(),
          getRecommendations(),
          getPredictions(),
          getExecutiveAlerts(),
          getOpportunities(),
          getExecutiveTimeline(),
        ]);
        setBriefing(b);
        setRecommendations(r);
        setPredictions(p);
        setAlerts(a);
        setOpportunities(o);
        setTimeline(t);
      } catch { /* graceful */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <FxPageLayout title="AI Operations" subtitle="Loading intelligence...">
        <Stack spacing={2.5}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />)}
        </Stack>
      </FxPageLayout>
    );
  }

  return (
    <FxPageLayout title="AI Operations Centre" subtitle="Executive decision support powered by platform intelligence.">
      <Stack spacing={4}>

        {/* ─── Executive Briefing ─────────────────────────── */}
        <FxCard sx={{ position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #A78BFA, #3B82F6, #06B6D4)" }} />
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ ...typo.pageTitle, color: semantic.text, fontSize: { xs: "1.2rem", md: "1.4rem" } }}>
                {briefing?.greeting || "Good day"}.
              </Typography>
              <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary, mt: 0.5 }}>
                {briefing?.summary}
              </Typography>
            </Box>
            <Stack spacing={1}>
              {(briefing?.points || []).map((point, i) => (
                <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                  <PriorityDot priority={point.priority} />
                  <Typography sx={{ ...typo.bodySmall, color: semantic.text }}>{point.text}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </FxCard>

        {/* ─── Alerts ─────────────────────────────────────── */}
        <Section title="Executive Alerts">
          <Stack spacing={1.5}>
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </Stack>
        </Section>

        {/* ─── Recommendations ────────────────────────────── */}
        <Section title="AI Recommendations">
          <Stack spacing={2}>
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </Stack>
        </Section>

        {/* ─── Predictions ────────────────────────────────── */}
        <Section title="Predictive Insights">
          <Grid container spacing={2}>
            {predictions.map((pred) => (
              <Grid item xs={6} sm={3} key={pred.id}>
                <FxCard sx={{ textAlign: "center", py: 2.5 }}>
                  <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, mb: 0.25 }}>{pred.value}</Typography>
                  <Typography sx={{ ...typo.tiny, color: semantic.textSecondary, textTransform: "uppercase", mb: 1 }}>{pred.label}</Typography>
                  <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                    <Typography sx={{ fontSize: "0.7rem", color: pred.trend === "up" ? semantic.success : pred.trend === "down" ? semantic.error : semantic.textTertiary }}>
                      {pred.trend === "up" ? "↑" : pred.trend === "down" ? "↓" : "→"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>{pred.confidence}% confidence</Typography>
                  </Stack>
                </FxCard>
              </Grid>
            ))}
          </Grid>
        </Section>

        {/* ─── Opportunities ──────────────────────────────── */}
        <Section title="Opportunity Centre">
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}><FxStatCard icon="⬆️" label="Upgrade Targets" value={opportunities?.upgradeTargets || 0} color="#8B5CF6" subtitle="Starter → PRO" /></Grid>
            <Grid item xs={6} sm={3}><FxStatCard icon="⚠️" label="At Risk" value={opportunities?.atRisk || 0} color="#EF4444" subtitle="Inactive 30d+" /></Grid>
            <Grid item xs={6} sm={3}><FxStatCard icon="🔥" label="High Engagement" value={opportunities?.highEngagement || 0} color="#16A34A" subtitle="Active this week" /></Grid>
            <Grid item xs={6} sm={3}><FxStatCard icon="🎯" label="Total Opportunities" value={opportunities?.totalOpportunities || 0} color="#3B82F6" /></Grid>
          </Grid>
        </Section>

        {/* ─── Executive Timeline ─────────────────────────── */}
        <Section title="Executive Timeline">
          {timeline.length === 0 ? (
            <FxEmptyState icon="📅" title="No events yet" description="Platform events will appear here as activity grows." />
          ) : (
            <FxCard>
              <Stack spacing={1.5}>
                {timeline.map((event, i) => (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: event.type === "alert" ? semantic.error : event.type === "payment" ? semantic.success : semantic.info, mt: 0.7, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{event.title}</Typography>
                      {event.subtitle && <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{event.subtitle}</Typography>}
                    </Box>
                    <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, flexShrink: 0 }}>{formatRelativeTime(event.timestamp)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </FxCard>
          )}
        </Section>

      </Stack>
    </FxPageLayout>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <Box>
      <Typography sx={{ ...typo.sectionCaption, color: semantic.textSecondary, mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

function PriorityDot({ priority }) {
  const color = PRIORITY_COLORS[priority]?.border || semantic.textTertiary;
  return <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />;
}

function AlertCard({ alert }) {
  const colors = PRIORITY_COLORS[alert.severity] || PRIORITY_COLORS.information;
  return (
    <Box sx={{ p: 2, borderRadius: radius_val, bgcolor: colors.bg, border: `1px solid ${colors.border}20`, borderLeft: `3px solid ${colors.border}` }}>
      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: colors.text, mb: 0.25 }}>{alert.title}</Typography>
      <Typography sx={{ fontSize: "0.78rem", color: colors.text, opacity: 0.8 }}>{alert.description}</Typography>
    </Box>
  );
}

function RecommendationCard({ rec }) {
  const colors = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.information;
  return (
    <FxCard sx={{ borderLeft: `3px solid ${colors.border}` }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <PriorityDot priority={rec.priority} />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography sx={{ ...typo.cardTitle, color: semantic.text }}>{rec.title}</Typography>
            <Chip label={`${rec.confidence}%`} size="small" sx={{ height: 18, fontSize: "0.58rem", fontWeight: 700, bgcolor: `${colors.border}15`, color: colors.text }} />
          </Stack>
          <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary, mb: 0.75 }}>{rec.reason}</Typography>
          <Typography sx={{ ...typo.caption, color: semantic.info, fontWeight: 600 }}>→ {rec.action}</Typography>
        </Box>
      </Stack>
    </FxCard>
  );
}

const radius_val = 2.5 * 4;
