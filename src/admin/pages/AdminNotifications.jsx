/**
 * ============================================================
 * Feldrix Control Centre — Customer Success (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip, Avatar, Chip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, FxCard, FxStatusChip, FxEmptyState, semantic, typography as typo, radius, shadows, transitions } from "../../shared/design";
import { getSuccessMetrics, getSuccessQueue, getPlatformHealth, getCSRecommendations, getCommunications } from "../services/adminCustomerSuccessService";
import { formatNumber, formatRelativeTime } from "../utils/adminFormatters";

export default function AdminNotifications() {
  const [metrics, setMetrics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [health, setHealth] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [comms, setComms] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([getSuccessMetrics(), getSuccessQueue({ limit: 8 }), getPlatformHealth(), getCSRecommendations(), getCommunications()])
      .then(([m, q, h, r, c]) => { setMetrics(m); setQueue(q.customers); setQueueTotal(q.total); setHealth(h); setRecommendations(r); setComms(c); })
      .catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Stack spacing={4}>
        <Box><Skeleton variant="rounded" height={32} width={240} /><Skeleton variant="rounded" height={18} width={380} sx={{ mt: 1 }} /></Box>
        <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Customer Success</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Proactive support, customer health monitoring and platform communications.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={load} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Stack>

      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2}><FxStatCard icon="⚠️" label="Attention" value={formatNumber(metrics?.needsAttention)} color="#F59E0B" /></Grid>
        <Grid item xs={6} sm={4} md={2}><FxStatCard icon="😴" label="Inactive" value={formatNumber(metrics?.inactive)} color="#EF4444" /></Grid>
        <Grid item xs={6} sm={4} md={2}><FxStatCard icon="📉" label="Churn Risk" value={formatNumber(metrics?.highChurnRisk)} color="#EF4444" /></Grid>
        <Grid item xs={6} sm={4} md={2}><FxStatCard icon="⬆️" label="Upgrades" value={formatNumber(metrics?.upgradeOpportunities)} color="#8B5CF6" /></Grid>
        <Grid item xs={6} sm={4} md={2}><FxStatCard icon="💚" label="Avg Health" value={`${metrics?.avgCustomerHealth || 0}%`} color="#16A34A" /></Grid>
        <Grid item xs={6} sm={4} md={2}><FxStatCard icon="🎯" label="Onboarding" value={`${metrics?.onboardingCompletion || 0}%`} color="#3B82F6" /></Grid>
      </Grid>

      {/* AI Recommendations */}
      <Section title="AI Recommendations">
        <Stack spacing={1.5}>
          {recommendations.map((rec, i) => (
            <FxCard key={i} sx={{ py: 2, px: 2.5, borderLeft: `3px solid ${rec.priority === "warning" ? semantic.warning : rec.priority === "opportunity" ? "#8B5CF6" : semantic.success}` }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                <Typography sx={{ ...typo.bodySmall, fontWeight: 700, color: semantic.text }}>{rec.title}</Typography>
                <Chip label={`${rec.confidence}%`} size="small" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 700 }} />
              </Stack>
              <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{rec.reason}</Typography>
              <Typography sx={{ ...typo.caption, color: semantic.info, fontWeight: 600, mt: 0.5 }}>→ {rec.action}</Typography>
            </FxCard>
          ))}
        </Stack>
      </Section>

      {/* Success Queue + Platform Health */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Section title={`Success Queue (${queueTotal})`}>
            {queue.length === 0 ? <FxEmptyState icon="👥" title="No customers" description="Customer health data will appear here." /> : (
              <Stack spacing={1}>
                {queue.map((c) => (
                  <FxCard key={c.id} sx={{ py: 1.5, px: 2.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: c.risk === "critical" ? semantic.error : c.risk === "needs_attention" ? semantic.warning : semantic.success, fontSize: "0.68rem", fontWeight: 700 }}>
                          {(c.full_name || "?").charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name || "—"}</Typography>
                          <Typography sx={{ ...typo.tiny, color: semantic.textTertiary }}>{c.farm_name || "No farm"}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HealthBar score={c.healthScore} />
                        <FxStatusChip status={c.risk === "critical" ? "critical" : c.risk === "needs_attention" ? "warning" : "healthy"} />
                      </Stack>
                    </Stack>
                  </FxCard>
                ))}
              </Stack>
            )}
          </Section>
        </Grid>

        <Grid item xs={12} md={4}>
          <Section title="Platform Health">
            <FxCard sx={{ height: "100%" }}>
              <Stack spacing={1.25}>
                {health && Object.entries(health.services).map(([name, svc]) => (
                  <Stack key={name} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: svc.status === "healthy" ? semantic.success : svc.status === "degraded" ? semantic.warning : semantic.error }} />
                      <Typography sx={{ ...typo.bodySmall, color: semantic.text, textTransform: "capitalize" }}>{name}</Typography>
                    </Stack>
                    {svc.latency && <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, fontFamily: "monospace" }}>{svc.latency}ms</Typography>}
                  </Stack>
                ))}
              </Stack>
              {health && <Box sx={{ mt: 2, textAlign: "center" }}><FxStatusChip status={health.overall === "healthy" ? "healthy" : "warning"} label={`Overall: ${health.overall}`} /></Box>}
            </FxCard>
          </Section>
        </Grid>
      </Grid>

      {/* Communications */}
      <Section title="Communications Centre">
        <Grid container spacing={1.5}>
          {(comms?.templates || []).map((t) => (
            <Grid item xs={6} sm={4} md={2} key={t.id}>
              <FxCard sx={{ textAlign: "center", py: 2.5, cursor: "pointer", transition: transitions.normal, "&:hover": { boxShadow: shadows.sm, transform: "translateY(-2px)" } }}>
                <Typography sx={{ fontSize: "1.2rem", mb: 0.75 }}>{t.id === "welcome" ? "👋" : t.id === "upgrade" ? "⬆️" : t.id === "billing" ? "💳" : t.id === "maintenance" ? "🔧" : t.id === "feature" ? "✨" : "📧"}</Typography>
                <Typography sx={{ ...typo.caption, fontWeight: 600, color: semantic.text }}>{t.name}</Typography>
              </FxCard>
            </Grid>
          ))}
        </Grid>
      </Section>
    </Stack>
  );
}

function Section({ title, children }) {
  return <Box><Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>{title}</Typography>{children}</Box>;
}

function HealthBar({ score }) {
  const color = score >= 70 ? semantic.success : score >= 40 ? semantic.warning : semantic.error;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Box sx={{ width: 28, height: 4, borderRadius: 2, bgcolor: `${color}25`, overflow: "hidden" }}><Box sx={{ width: `${score}%`, height: "100%", bgcolor: color, borderRadius: 2 }} /></Box>
      <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color, minWidth: 22 }}>{score}%</Typography>
    </Stack>
  );
}
