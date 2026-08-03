/**
 * ============================================================
 * Feldrix Control Centre — Payments (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, semantic, typography as typo } from "../../shared/design";
import PaymentTable from "../components/payments/PaymentTable";
import SubscriptionDrawer from "../components/payments/SubscriptionDrawer";
import { getBillingMetrics, getPayments } from "../services/adminBillingService";
import { formatNumber, formatCurrency } from "../utils/adminFormatters";

const PAGE_SIZE = 25;

export default function AdminPayments() {
  const [metrics, setMetrics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  function loadMetrics() { getBillingMetrics().then(setMetrics).catch(() => {}); }
  useEffect(() => { loadMetrics(); }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await getPayments({ search: debouncedSearch, filter, sortBy, sortDir, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }); setPayments(r.payments); setTotal(r.total); }
    catch (err) { setError(err?.message || "Failed to load."); setPayments([]); setTotal(0); }
    finally { setLoading(false); }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  function handleRefresh() { fetchPayments(); loadMetrics(); }

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Payments</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Monitor revenue, failed payments, renewals and billing health.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={handleRefresh} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Stack>

      {/* KPIs */}
      {!metrics ? (
        <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="💰" label="Revenue" value={formatCurrency(metrics.revenueThisMonth)} color="#16A34A" subtitle="This month" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="📅" label="Today" value={formatCurrency(metrics.revenueToday)} color="#0EA5E9" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="✅" label="Successful" value={formatNumber(metrics.successfulPayments)} color="#16A34A" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="⏳" label="Pending" value={formatNumber(metrics.pendingPayments)} color="#F59E0B" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="❌" label="Failed" value={formatNumber(metrics.failedPayments)} color="#EF4444" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="📋" label="Showing" value={formatNumber(total)} color="#64748B" subtitle={filter !== "all" ? filter : "All"} /></Grid>
        </Grid>
      )}

      {/* Payment Table */}
      <PaymentTable
        payments={payments} total={total} loading={loading} error={error}
        search={search} onSearchChange={setSearch}
        filter={filter} onFilterChange={setFilter}
        sortBy={sortBy} sortDir={sortDir} onSortChange={(c, d) => { setSortBy(c); setSortDir(d); }}
        page={page} onPageChange={setPage} pageSize={PAGE_SIZE}
        onPaymentClick={(p) => { setSelectedPayment(p); setDrawerOpen(true); }}
      />

      <SubscriptionDrawer open={drawerOpen} payment={selectedPayment} onClose={() => { setDrawerOpen(false); setSelectedPayment(null); }} />
    </Stack>
  );
}
