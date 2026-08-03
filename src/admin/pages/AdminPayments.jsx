/**
 * ============================================================
 * Feldrix Control Centre — Payments Page (Enterprise)
 * Sprint 49.0
 *
 * Executive KPI dashboard + enterprise payments table + drawer.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Skeleton } from "@mui/material";
import { FxPageLayout, FxStatCard } from "../../shared/design";
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
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { getBillingMetrics().then(setMetrics).catch(() => {}); }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPayments({ search: debouncedSearch, filter, sortBy, sortDir, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      setPayments(result.payments);
      setTotal(result.total);
    } catch (err) {
      setError(err?.message || "Failed to load.");
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  return (
    <FxPageLayout title="Payments" subtitle="Monitor all payment transactions across the Feldrix platform.">
      {/* KPI Dashboard */}
      {!metrics ? (
        <Box sx={{ mb: 1 }}>
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}
          </Grid>
        </Box>
      ) : (
        <Box sx={{ mb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="💰" label="Revenue (Month)" value={formatCurrency(metrics.revenueThisMonth)} color="#16A34A" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="📅" label="Revenue Today" value={formatCurrency(metrics.revenueToday)} color="#0EA5E9" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="✅" label="Successful" value={formatNumber(metrics.successfulPayments)} color="#16A34A" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="⏳" label="Pending" value={formatNumber(metrics.pendingPayments)} color="#F59E0B" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="❌" label="Failed" value={formatNumber(metrics.failedPayments)} color="#EF4444" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="🚫" label="Cancelled" value={formatNumber(metrics.cancelledPayments)} color="#64748B" /></Grid>
          </Grid>
        </Box>
      )}

      {/* Payments Table */}
      <PaymentTable
        payments={payments}
        total={total}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(col, dir) => { setSortBy(col); setSortDir(dir); }}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        onPaymentClick={(p) => { setSelectedPayment(p); setDrawerOpen(true); }}
      />

      {/* Subscription Drawer */}
      <SubscriptionDrawer
        open={drawerOpen}
        payment={selectedPayment}
        onClose={() => { setDrawerOpen(false); setSelectedPayment(null); }}
      />
    </FxPageLayout>
  );
}
