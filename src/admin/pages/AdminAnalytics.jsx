/**
 * ============================================================
 * Feldrix Control Centre — Executive Analytics Centre
 * Sprint 50.0
 *
 * Business intelligence: KPIs, growth, usage, geographic,
 * subscription health, operational insights, AI summary.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Grid, Typography, Stack, Skeleton, Chip } from "@mui/material";
import { FxPageLayout, FxStatCard, FxCard, FxEmptyState, semantic, typography as typo } from "../../shared/design";
import {
  getExecutiveMetrics,
  getGrowthMetrics,
  getPlatformUsage,
  getGeographicInsights,
  getOperationalInsights,
} from "../services/adminExecutiveService";
import { formatNumber, formatCurrency, formatPercent, formatRelativeTime } from "../utils/adminFormatters";

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [usage, setUsage] = useState(null);
  const [geo, setGeo] = useState(null);
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, g, u, ge, o] = await Promise.all([
          getExecutiveMetrics(),
          getGrowthMetrics(),
          getPlatformUsage(),
          getGeographicInsights(),
          getOperationalInsights(),
        ]);
        setMetrics(m);
        setGrowth(g);
        setUsage(u);
        setGeo(ge);
        setOps(o);
      } catch { /* graceful */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <FxPageLayout title="Analytics" subtitle="Loading executive intelligence...">
        <Grid container spacing={2}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /></Grid>
          ))}
        </Grid>
      </FxPageLayout>
    );
  }

  return (
    <FxPageLayout title="Analytics" subtitle="Executive business intelligence for the Feldrix platform.">
      <Stack spacing={4}>

        {/* ─── Executive KPIs ──────────────────────────────── */}
        <Section title="Executive Overview">
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="👥" label="Total Farmers" value={formatNumber(metrics?.totalFarmers)} color="#3B82F6" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📡" label="Active Today" value={formatNumber(metrics?.activeToday)} color="#0EA5E9" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📆" label="Active This Week" value={formatNumber(metrics?.activeWeek)} color="#06B6D4" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📅" label="Active This Month" value={formatNumber(metrics?.activeMonth)} color="#14B8A6" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🆕" label="New Today" value={formatNumber(metrics?.newToday)} color="#16A34A" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📈" label="New This Month" value={formatNumber(metrics?.newMonth)} color="#22C55E" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⭐" label="PRO Conversion" value={`${metrics?.proConversion || 0}%`} color="#8B5CF6" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💰" label="MRR" value={formatCurrency(metrics?.mrr)} color="#F59E0B" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📊" label="ARR" value={formatCurrency(metrics?.arr)} color="#F59E0B" subtitle="Projected" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔄" label="Retention" value={`${metrics?.retention || 0}%`} color="#16A34A" subtitle="30-day active" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💎" label="ARPU" value={formatCurrency(metrics?.arpu)} color="#6366F1" subtitle="Per PRO user" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🏥" label="Platform Health" value="Operational" color="#16A34A" /></Grid>
          </Grid>
        </Section>

        {/* ─── AI Executive Summary ───────────────────────── */}
        <FxCard sx={{ position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #6366F1, #A78BFA, #3B82F6)" }} />
          <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>🧠 Executive Briefing</Typography>
          <Stack spacing={0.75}>
            <BriefingLine text={`${formatNumber(metrics?.totalFarmers)} registered farmers (${formatNumber(metrics?.newMonth)} new this month).`} />
            <BriefingLine text={`${metrics?.retention || 0}% monthly retention — ${metrics?.retention >= 70 ? "healthy" : "needs attention"}.`} />
            <BriefingLine text={`${metrics?.proConversion || 0}% PRO conversion rate${metrics?.proConversion < 10 ? " — consider upgrade campaigns." : "."}`} />
            <BriefingLine text={metrics?.mrr > 0 ? `Monthly revenue: ${formatCurrency(metrics.mrr)}.` : "No revenue recorded yet — focus on PRO upgrades."} />
            <BriefingLine text={usage?.mostUsed ? `Most-used module: ${usage.mostUsed.name} (${formatNumber(usage.mostUsed.count)} records).` : "Platform usage data building."} />
            <BriefingLine text={ops?.inactiveCount > 0 ? `${formatNumber(ops.inactiveCount)} farmers inactive 30+ days — consider re-engagement.` : "All farmers recently active."} />
          </Stack>
        </FxCard>

        {/* ─── Growth Chart Placeholder ───────────────────── */}
        <Section title="Growth Trends">
          <FxCard>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {growth.map((g) => (
                <Chip key={g.month} label={`${g.month}: ${g.signups}`} size="small" sx={{ bgcolor: semantic.infoBg, color: semantic.infoText, fontWeight: 600, fontSize: "0.7rem" }} />
              ))}
            </Stack>
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>📈</Typography>
              <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>Interactive growth charts coming in Sprint 51.</Typography>
            </Box>
          </FxCard>
        </Section>

        {/* ─── Platform Usage ─────────────────────────────── */}
        <Section title="Platform Usage">
          <Grid container spacing={2}>
            {(usage?.modules || []).map((mod) => (
              <Grid item xs={6} sm={4} md={2} key={mod.name}>
                <FxStatCard icon={mod.icon} label={mod.name} value={formatNumber(mod.count)} color={mod === usage?.mostUsed ? "#16A34A" : undefined} subtitle={mod === usage?.mostUsed ? "Most used" : mod === usage?.leastUsed ? "Least used" : undefined} />
              </Grid>
            ))}
          </Grid>
        </Section>

        {/* ─── Geographic Insights ────────────────────────── */}
        <Section title="Geographic Distribution">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FxCard>
                <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>By Province</Typography>
                {geo?.provinces?.length > 0 ? (
                  <Stack spacing={0.75}>
                    {geo.provinces.slice(0, 8).map((p) => (
                      <Stack key={p.name} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                        <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{p.name}</Typography>
                        <Typography sx={{ ...typo.bodySmall, fontWeight: 700, color: semantic.text }}>{p.count}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ ...typo.bodySmall, color: semantic.textTertiary, fontStyle: "italic" }}>No geographic data yet.</Typography>
                )}
              </FxCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <FxCard>
                <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>By Country</Typography>
                {geo?.countries?.length > 0 ? (
                  <Stack spacing={0.75}>
                    {geo.countries.slice(0, 8).map((c) => (
                      <Stack key={c.name} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                        <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{c.name}</Typography>
                        <Typography sx={{ ...typo.bodySmall, fontWeight: 700, color: semantic.text }}>{c.count}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ ...typo.bodySmall, color: semantic.textTertiary, fontStyle: "italic" }}>No geographic data yet.</Typography>
                )}
              </FxCard>
            </Grid>
          </Grid>
        </Section>

        {/* ─── Operational Insights ───────────────────────── */}
        <Section title="Operational Insights">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FxCard>
                <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>🏆 Most Active Farms</Typography>
                {ops?.topActive?.length > 0 ? (
                  <Stack spacing={0.75}>
                    {ops.topActive.map((f) => (
                      <Stack key={f.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                        <Box>
                          <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{f.farm_name || f.full_name || "—"}</Typography>
                          <Typography sx={{ ...typo.tiny, color: semantic.textTertiary }}>{formatRelativeTime(f.last_login)}</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <FxEmptyState icon="🚜" title="No data" description="Farm activity will appear here." sx={{ p: 2, border: "none" }} />
                )}
              </FxCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <FxCard>
                <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>⚠️ Attention Required</Typography>
                <Stack spacing={1}>
                  <InfoRow label="Inactive 30+ days" value={formatNumber(ops?.inactiveCount)} />
                  <InfoRow label="Suspended accounts" value={formatNumber(metrics?.suspended)} />
                  <InfoRow label="Churn rate" value="—" />
                  <InfoRow label="At-risk customers" value="—" />
                </Stack>
                <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, mt: 1.5 }}>Churn prediction coming in Sprint 51.</Typography>
              </FxCard>
            </Grid>
          </Grid>
        </Section>

        {/* ─── Reports Placeholder ────────────────────────── */}
        <Section title="Reports & Exports">
          <FxCard sx={{ textAlign: "center", py: 4 }}>
            <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>📋</Typography>
            <Typography sx={{ ...typo.cardTitle, color: semantic.text, mb: 0.5 }}>Export & Scheduled Reports</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>PDF export, CSV download, and scheduled email reports coming in Sprint 51.</Typography>
          </FxCard>
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

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ ...typo.bodySmall, fontWeight: 700, color: semantic.text }}>{value ?? "—"}</Typography>
    </Stack>
  );
}

function BriefingLine({ text }) {
  return <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>• {text}</Typography>;
}
