/**
 * ============================================================
 * Feldrix Control Centre — Subscriptions Page (Enterprise)
 * Sprint 49.0
 *
 * Executive view of subscription health across the platform.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Grid, Typography, Stack, Skeleton } from "@mui/material";
import { FxPageLayout, FxStatCard, FxCard, FxEmptyState, semantic, typography as typo } from "../../shared/design";
import { getBillingMetrics } from "../services/adminBillingService";
import { formatNumber, formatCurrency } from "../utils/adminFormatters";

export default function AdminSubscriptions() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBillingMetrics().then((m) => { setMetrics(m); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <FxPageLayout title="Subscriptions" subtitle="Subscription health and revenue overview for the Feldrix platform.">
      {/* KPI Dashboard */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📈" label="MRR" value={formatCurrency(metrics?.mrr)} color="#6366F1" subtitle={metrics?.mrr === 0 ? "No revenue yet" : undefined} /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📊" label="ARR" value={formatCurrency(metrics?.arr)} color="#6366F1" subtitle="Projected annually" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⭐" label="PRO Subscribers" value={formatNumber(metrics?.proSubscribers)} color="#8B5CF6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🆓" label="Starter Users" value={formatNumber(metrics?.starterUsers)} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔄" label="Pending Renewals" value={formatNumber(metrics?.pendingRenewals)} color="#F59E0B" subtitle="Due this week" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="❌" label="Failed Payments" value={formatNumber(metrics?.failedPayments)} color="#EF4444" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🚫" label="Cancelled" value={formatNumber(metrics?.cancelledPayments)} color="#64748B" /></Grid>
          <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💰" label="Revenue (Month)" value={formatCurrency(metrics?.revenueThisMonth)} color="#16A34A" /></Grid>
        </Grid>
      )}

      {/* AI Revenue Summary */}
      <FxCard sx={{ position: "relative", overflow: "hidden", mt: 3 }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #6366F1, #A78BFA)" }} />
        <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>🧠 AI Billing Summary</Typography>
        <Stack spacing={0.75}>
          <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
            {metrics?.revenueThisMonth > 0 ? `✓ Revenue this month: ${formatCurrency(metrics.revenueThisMonth)}.` : "ℹ No revenue recorded this month yet."}
          </Typography>
          <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
            {metrics?.pendingRenewals > 0 ? `⚠ ${metrics.pendingRenewals} renewal(s) due this week.` : "✓ No renewals due this week."}
          </Typography>
          <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
            {metrics?.failedPayments > 0 ? `⚠ ${metrics.failedPayments} failed payment(s) require attention.` : "✓ No failed payments."}
          </Typography>
          <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
            {metrics?.proSubscribers > 0 ? `✓ ${metrics.proSubscribers} active PRO subscriber(s).` : "ℹ No PRO subscribers yet — consider outreach."}
          </Typography>
          <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
            {metrics?.starterUsers > 5 ? `💡 ${metrics.starterUsers} Starter users may be upgrade candidates.` : "✓ Platform growing steadily."}
          </Typography>
        </Stack>
      </FxCard>

      {/* Revenue Charts Placeholder */}
      <FxCard sx={{ mt: 3, textAlign: "center", py: 5 }}>
        <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>📊</Typography>
        <Typography sx={{ ...typo.cardTitle, color: semantic.text, mb: 0.5 }}>Revenue Charts</Typography>
        <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>Monthly revenue, growth, conversion and churn charts coming in Sprint 50.</Typography>
      </FxCard>
    </FxPageLayout>
  );
}
