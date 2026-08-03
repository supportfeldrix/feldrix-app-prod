/**
 * ============================================================
 * Feldrix Control Centre — Subscriptions (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, FxCard, FxStatusChip, FxEmptyState, semantic, typography as typo, shadows } from "../../shared/design";
import { getBillingMetrics } from "../services/adminBillingService";
import { formatNumber, formatCurrency } from "../utils/adminFormatters";

export default function AdminSubscriptions() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() { setLoading(true); getBillingMetrics().then(setMetrics).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, []);

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Subscriptions</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Monitor subscription health, revenue and renewal status across the platform.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={load} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Stack>

      {/* KPIs */}
      {loading ? (
        <Grid container spacing={2}>{Array.from({ length: 8 }).map((_, i) => <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📈" label="MRR" value={formatCurrency(metrics?.mrr)} color="#6366F1" subtitle={metrics?.mrr === 0 ? "No revenue yet" : undefined} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📊" label="ARR" value={formatCurrency(metrics?.arr)} color="#6366F1" subtitle="Projected" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⭐" label="PRO Subscribers" value={formatNumber(metrics?.proSubscribers)} color="#8B5CF6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🆓" label="Starter Users" value={formatNumber(metrics?.starterUsers)} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔄" label="Pending Renewals" value={formatNumber(metrics?.pendingRenewals)} color="#F59E0B" subtitle="Due this week" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="❌" label="Failed Payments" value={formatNumber(metrics?.failedPayments)} color="#EF4444" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🚫" label="Cancelled" value={formatNumber(metrics?.cancelledPayments)} color="#64748B" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💰" label="Revenue (Month)" value={formatCurrency(metrics?.revenueThisMonth)} color="#16A34A" /></Grid>
        </Grid>
      )}

      {/* AI Billing Summary */}
      {!loading && metrics && (
        <FxCard sx={{ position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #A78BFA)" }} />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: "#6366F112", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🧠</Box>
            <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: semantic.text }}>Billing Intelligence</Typography>
          </Stack>
          <Stack spacing={0.75}>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.revenueThisMonth > 0 ? `✓ Revenue this month: ${formatCurrency(metrics.revenueThisMonth)}.` : "ℹ No revenue recorded this month."}</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.pendingRenewals > 0 ? `⚠ ${metrics.pendingRenewals} renewal(s) due this week.` : "✓ No renewals due this week."}</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.failedPayments > 0 ? `⚠ ${metrics.failedPayments} failed payment(s) require attention.` : "✓ No failed payments."}</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.proSubscribers > 0 ? `✓ ${metrics.proSubscribers} active PRO subscriber(s).` : "ℹ No PRO subscribers yet."}</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.starterUsers > 5 ? `💡 ${metrics.starterUsers} Starter users are upgrade candidates.` : "✓ Platform growing steadily."}</Typography>
          </Stack>
        </FxCard>
      )}

      {/* Charts Placeholder */}
      <FxCard sx={{ textAlign: "center", py: 5 }}>
        <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>📊</Typography>
        <Typography sx={{ ...typo.cardTitle, color: semantic.text, mb: 0.5 }}>Revenue Charts</Typography>
        <Typography sx={{ ...typo.bodySmall, color: semantic.textTertiary }}>Monthly revenue, growth, and conversion charts coming soon.</Typography>
      </FxCard>
    </Stack>
  );
}
