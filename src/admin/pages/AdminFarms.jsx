/**
 * ============================================================
 * Feldrix Control Centre — Farms Operations Centre
 * Sprint 48.0
 *
 * Executive dashboard + enterprise table + detail drawer.
 * Uses shared Feldrix Design System throughout.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Stack, Skeleton } from "@mui/material";
import { FxPageLayout, FxStatCard, semantic, typography as typo } from "../../shared/design";
import FarmTable from "../components/farms/FarmTable";
import FarmDetailDrawer from "../components/farms/FarmDetailDrawer";
import { getFarms, getFarmMetrics } from "../services/adminFarmService";
import { formatNumber } from "../utils/adminFormatters";

const PAGE_SIZE = 25;

export default function AdminFarms() {
  // KPI metrics
  const [metrics, setMetrics] = useState(null);

  // Table state
  const [farms, setFarms] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  // Drawer
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load metrics
  useEffect(() => {
    getFarmMetrics().then(setMetrics).catch(() => {});
  }, []);

  // Fetch farms
  const fetchFarms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFarms({
        search: debouncedSearch,
        filter,
        sortBy,
        sortDir,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setFarms(result.farms);
      setTotal(result.total);
    } catch (err) {
      setError(err?.message || "Failed to load farms.");
      setFarms([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => { fetchFarms(); }, [fetchFarms]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  function handleSortChange(col, dir) { setSortBy(col); setSortDir(dir); }
  function handleFarmClick(farm) { setSelectedFarm(farm); setDrawerOpen(true); }
  function handleDrawerClose() { setDrawerOpen(false); setSelectedFarm(null); }
  function handleUpdated() { fetchFarms(); getFarmMetrics().then(setMetrics).catch(() => {}); }

  return (
    <FxPageLayout title="Farms" subtitle="Operational view of every farm using Feldrix.">
      {/* KPI Dashboard */}
      {!metrics && (
        <Box sx={{ mb: 1 }}>
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={2} key={i}>
                <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      {metrics && (
        <Box sx={{ mb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="🚜" label="Total Farms" value={formatNumber(metrics.totalFarms)} subtitle="All registered" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="✅" label="Active Farms" value={formatNumber(metrics.activeFarms)} color="#16A34A" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="⭐" label="PRO Farms" value={formatNumber(metrics.proFarms)} color="#8B5CF6" subtitle="Subscribed" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="🆓" label="Starter" value={formatNumber(metrics.starterFarms)} color="#3B82F6" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="🆕" label="New This Month" value={formatNumber(metrics.newThisMonth)} color="#F59E0B" /></Grid>
            <Grid item xs={6} sm={4} md={2}><FxStatCard icon="📡" label="Active Today" value={formatNumber(metrics.activeToday)} color="#0EA5E9" /></Grid>
          </Grid>
        </Box>
      )}

      {/* Farm Table */}
      <FarmTable
        farms={farms}
        total={total}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        onFarmClick={handleFarmClick}
        onRefresh={fetchFarms}
      />

      {/* Farm Detail Drawer */}
      <FarmDetailDrawer
        open={drawerOpen}
        farm={selectedFarm}
        onClose={handleDrawerClose}
        onUpdated={handleUpdated}
      />
    </FxPageLayout>
  );
}
