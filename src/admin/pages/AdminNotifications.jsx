/**
 * ============================================================
 * Feldrix Control Centre — Customer Success Operations Centre
 * Sprint 52.0
 *
 * Complete customer success workspace: health scoring, queue,
 * communications, AI recommendations, platform health.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Grid, Typography, Stack, Skeleton, Chip, Avatar, LinearProgress, useMediaQuery, useTheme } from "@mui/material";
import { FxPageLayout, FxStatCard, FxCard, FxStatusChip, FxEmptyState, FxSearchBar, semantic, typography as typo, radius } from "../../shared/design";
import {
  getSuccessMetrics,
  getSuccessQueue,
  getPlatformHealth,
  getCSRecommendations,
  getCommunications,
} from "../services/adminCustomerSuccessService";
import { formatNumber, formatRelativeTime } from "../utils/adminFormatters";

export default function AdminNotifications() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [metrics, setMetrics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [health, setHealth] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [comms, setComms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, q, h, r, c] = await Promise.all([
          getSuccessMetrics(),
          getSuccessQueue({ limit: 10 }),
          getPlatformHealth(),
          getCSRecommendations(),
          getCommunications(),
        ]);
        setMetrics(m);
        setQueue(q.customers);
        setQueueTotal(q.total);
        setHealth(h);
        setRecommendations(r);
        setComms(c);
      } catch { /* graceful */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <FxPageLayout title="Customer Success" subtitle="Loading...">
        <Stack spacing={2.5}>
          <Grid container spacing={2}>{Array.from({ length: 8 }).map((_, i) => <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
          <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
        </Stack>
      </FxPageLayout>
    );
  }

  return (
    <FxPageLayout title="Customer Success" subtitle="Proactive support, customer health and platform operations.">
      <Stack spacing={4}>

        {/* ─── KPI Dashboard ──────────────────────────────── */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⚠️" label="Needs Attention" value={formatNumber(metrics?.needsAttention)} color="#F59E0B" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="😴" label="Inactive" value={formatNumber(metrics?.inactive)} color="#EF4444" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📉" label="High Churn Risk" value={formatNumber(metrics?.highChurnRisk)} color="#EF4444" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⬆️" label="Upgrade Targets" value={formatNumber(metrics?.upgradeOpportunities)} color="#8B5CF6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💚" label="Avg Health" value={`${metrics?.avgCustomerHealth || 0}%`} color="#16A34A" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🎯" label="Onboarding %" value={`${metrics?.onboardingCompletion || 0}%`} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🎧" label="Open Cases" value={formatNumber(metrics?.openSupportCases)} color="#64748B" subtitle="Coming soon" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⏱️" label="Avg Response" value="—" color="#64748B" subtitle="Coming soon" /></Grid>
        </Grid>

        {/* ─── AI Recommendations ─────────────────────────── */}
        <Section title="AI Customer Success">
          <Stack spacing={1.5}>
            {recommendations.map((rec, i) => (
              <FxCard key={i} sx={{ borderLeft: `3px solid ${rec.priority === "warning" ? semantic.warning : rec.priority === "opportunity" ? "#8B5CF6" : semantic.success}` }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: rec.priority === "warning" ? semantic.warning : rec.priority === "opportunity" ? "#8B5CF6" : semantic.success, mt: 0.7, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                      <Typography sx={{ ...typo.cardTitle, color: semantic.text }}>{rec.title}</Typography>
                      <Chip label={`${rec.confidence}%`} size="small" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 700 }} />
                    </Stack>
                    <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary, mb: 0.5 }}>{rec.reason}</Typography>
                    <Typography sx={{ ...typo.caption, color: semantic.info, fontWeight: 600 }}>→ {rec.action}</Typography>
                  </Box>
                </Stack>
              </FxCard>
            ))}
          </Stack>
        </Section>

        {/* ─── Success Queue ──────────────────────────────── */}
        <Section title={`Success Queue (${queueTotal})`}>
          {queue.length === 0 ? (
            <FxEmptyState icon="👥" title="No customers" description="Customer data will appear here." />
          ) : (
            <Stack spacing={1}>
              {queue.map((c) => (
                <FxCard key={c.id} sx={{ py: 1.5, px: 2.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: c.risk === "critical" ? semantic.error : c.risk === "needs_attention" ? semantic.warning : semantic.success, fontSize: "0.75rem", fontWeight: 700 }}>
                        {(c.full_name || "?").charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name || "—"}</Typography>
                        <Typography sx={{ ...typo.tiny, color: semantic.textSecondary }}>{c.farm_name || "No farm"}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <HealthBadge score={c.healthScore} />
                      <FxStatusChip status={c.risk === "critical" ? "critical" : c.risk === "needs_attention" ? "warning" : "healthy"} label={c.risk === "needs_attention" ? "Attention" : c.risk} />
                      <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, minWidth: 50, textAlign: "right" }}>{formatRelativeTime(c.last_login)}</Typography>
                    </Stack>
                  </Stack>
                </FxCard>
              ))}
            </Stack>
          )}
        </Section>

        {/* ─── Platform Health ─────────────────────────────── */}
        <Section title="Platform Health">
          <Grid container spacing={2}>
            {health && Object.entries(health.services).map(([name, svc]) => (
              <Grid item xs={6} sm={4} md={2} key={name}>
                <FxCard sx={{ textAlign: "center", py: 2 }}>
                  <Typography sx={{ fontSize: "1.2rem", mb: 0.5 }}>
                    {svc.status === "healthy" ? "🟢" : svc.status === "degraded" ? "🟡" : "🔴"}
                  </Typography>
                  <Typography sx={{ ...typo.caption, fontWeight: 600, color: semantic.text, textTransform: "capitalize" }}>{name}</Typography>
                  {svc.latency && <Typography sx={{ ...typo.tiny, color: semantic.textTertiary }}>{svc.latency}ms</Typography>}
                </FxCard>
              </Grid>
            ))}
          </Grid>
          {health && (
            <Box sx={{ mt: 1.5, textAlign: "center" }}>
              <FxStatusChip status={health.overall === "healthy" ? "healthy" : health.overall === "degraded" ? "warning" : "critical"} label={`Overall: ${health.overall}`} />
            </Box>
          )}
        </Section>

        {/* ─── Communications ─────────────────────────────── */}
        <Section title="Communications Centre">
          <Grid container spacing={1.5}>
            {(comms?.templates || []).map((t) => (
              <Grid item xs={6} sm={4} md={2} key={t.id}>
                <FxCard sx={{ textAlign: "center", py: 2.5, cursor: "pointer", "&:hover": { borderColor: semantic.borderHover } }}>
                  <Typography sx={{ fontSize: "1.2rem", mb: 0.75 }}>
                    {t.id === "welcome" ? "👋" : t.id === "upgrade" ? "⬆️" : t.id === "billing" ? "💳" : t.id === "maintenance" ? "🔧" : t.id === "feature" ? "✨" : "📧"}
                  </Typography>
                  <Typography sx={{ ...typo.caption, fontWeight: 600, color: semantic.text }}>{t.name}</Typography>
                  <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, mt: 0.25 }}>Ready</Typography>
                </FxCard>
              </Grid>
            ))}
          </Grid>
          <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, mt: 1.5, textAlign: "center" }}>
            Email and push notification sending will be enabled once the messaging service is integrated.
          </Typography>
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

function HealthBadge({ score }) {
  const color = score >= 70 ? semantic.success : score >= 40 ? semantic.warning : semantic.error;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 28, height: 4, borderRadius: 2, bgcolor: `${color}30`, overflow: "hidden" }}>
        <Box sx={{ width: `${score}%`, height: "100%", bgcolor: color, borderRadius: 2 }} />
      </Box>
      <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color, minWidth: 24 }}>{score}%</Typography>
    </Box>
  );
}
