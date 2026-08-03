/**
 * ============================================================
 * Feldrix Control Centre — Analytics (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip, Chip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, FxCard, FxEmptyState, semantic, typography as typo, shadows, radius } from "../../shared/design";
import { getExecutiveMetrics, getGrowthMetrics, getPlatformUsage, getGeographicInsights, getOperationalInsights } from "../services/adminExecutiveService";
import { formatNumber, formatCurrency, formatRelativeTime } from "../utils/adminFormatters";

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [usage, setUsage] = useState(null);
  const [geo, setGeo] = useState(null);
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([getExecutiveMetrics(), getGrowthMetrics(), getPlatformUsage(), getGeographicInsights(), getOperationalInsights()])
      .then(([m, g, u, ge, o]) => { setMetrics(m); setGrowth(g); setUsage(u); setGeo(ge); setOps(o); })
      .catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Stack spacing={4}>
        <Box><Skeleton variant="rounded" height={32} width={200} /><Skeleton variant="rounded" height={18} width={350} sx={{ mt: 1 }} /></Box>
        <Grid container spacing={2}>{Array.from({ length: 12 }).map((_, i) => <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Analytics</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Executive business intelligence for the Feldrix platform.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={load} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Stack>

      {/* KPIs */}
      <Section title="Executive Overview">
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="👥" label="Total Farmers" value={formatNumber(metrics?.totalFarmers)} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📡" label="Active Today" value={formatNumber(metrics?.activeToday)} color="#0EA5E9" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📆" label="Active Week" value={formatNumber(metrics?.activeWeek)} color="#06B6D4" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🆕" label="New This Month" value={formatNumber(metrics?.newMonth)} color="#16A34A" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⭐" label="PRO Conversion" value={`${metrics?.proConversion || 0}%`} color="#8B5CF6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💰" label="MRR" value={formatCurrency(metrics?.mrr)} color="#F59E0B" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔄" label="Retention" value={`${metrics?.retention || 0}%`} color="#16A34A" subtitle="30-day" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💎" label="ARPU" value={formatCurrency(metrics?.arpu)} color="#6366F1" /></Grid>
        </Grid>
      </Section>

      {/* Growth */}
      <Section title="Growth Trends">
        <FxCard>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {growth.map((g) => <Chip key={g.month} label={`${g.month}: ${g.signups}`} size="small" sx={{ bgcolor: `${semantic.info}10`, color: semantic.info, fontWeight: 600, fontSize: "0.7rem" }} />)}
          </Stack>
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography sx={{ fontSize: "1.3rem", mb: 0.75 }}>📈</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textTertiary }}>Interactive charts coming soon.</Typography>
          </Box>
        </FxCard>
      </Section>

      {/* Platform Usage */}
      <Section title="Platform Usage">
        <Grid container spacing={2}>
          {(usage?.modules || []).map((mod) => (
            <Grid item xs={6} sm={4} md={2} key={mod.name}>
              <FxStatCard icon={mod.icon} label={mod.name} value={formatNumber(mod.count)} color={mod === usage?.mostUsed ? "#16A34A" : undefined} subtitle={mod === usage?.mostUsed ? "Most used" : mod === usage?.leastUsed ? "Least used" : undefined} />
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* Geographic + Operational */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Section title="Geographic Distribution">
            <FxCard sx={{ height: "100%" }}>
              {geo?.provinces?.length > 0 ? (
                <Stack spacing={0.75}>{geo.provinces.slice(0, 8).map((p) => <InfoRow key={p.name} label={p.name} value={p.count} />)}</Stack>
              ) : <Typography sx={{ ...typo.bodySmall, color: semantic.textTertiary, fontStyle: "italic" }}>No geographic data yet.</Typography>}
            </FxCard>
          </Section>
        </Grid>
        <Grid item xs={12} md={6}>
          <Section title="Most Active Farms">
            <FxCard sx={{ height: "100%" }}>
              {ops?.topActive?.length > 0 ? (
                <Stack spacing={0.75}>{ops.topActive.slice(0, 8).map((f) => <InfoRow key={f.id} label={f.farm_name || f.full_name || "—"} value={formatRelativeTime(f.last_login)} />)}</Stack>
              ) : <FxEmptyState icon="🚜" title="No data" description="Farm activity will appear here." sx={{ p: 2, border: "none" }} />}
            </FxCard>
          </Section>
        </Grid>
      </Grid>
    </Stack>
  );
}

function Section({ title, children }) {
  return <Box><Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>{title}</Typography>{children}</Box>;
}

function InfoRow({ label, value }) {
  return <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}><Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{label}</Typography><Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{value}</Typography></Stack>;
}
