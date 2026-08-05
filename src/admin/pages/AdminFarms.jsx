/**
 * ============================================================
 * Feldrix Control Centre Farms Operations (Premium v2.0)
 * Version 2.0 Phase 2
 *
 * Matches Dashboard + Users visual standard.
 * Same page flow: Header KPIs Table Drawer.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, semantic, typography as typo } from "../../shared/design";
import FarmTable from "../components/farms/FarmTable";
import FarmDetailDrawer from "../components/farms/FarmDetailDrawer";
import { getFarms, getFarmMetrics } from "../services/adminFarmService";
import { formatNumber } from "../utils/adminFormatters";

const PAGE_SIZE = 25;

export default function AdminFarms() {
  const [metrics, setMetrics] = useState(null);
  const [farms, setFarms] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  useEffect(() => { getFarmMetrics().then(setMetrics).catch(() => {}); }, []);

  const fetchFarms = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await getFarms({ search: debouncedSearch, filter, sortBy, sortDir, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      setFarms(r.farms); setTotal(r.total);
    } catch (err) { setError(err?.message || "Failed to load."); setFarms([]); setTotal(0); }
    finally { setLoading(false); }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => { fetchFarms(); }, [fetchFarms]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  function handleRefresh() { fetchFarms(); getFarmMetrics().then(setMetrics).catch(() => {}); }

  return (
    <Stack spacing={4}>
      {/* Page Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Farms</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Operational view of every farm using Feldrix.
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}>
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* KPI Row */}
      {!metrics ? (
        <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="people" label="Total Farms" value={formatNumber(metrics.totalFarms)} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="signal" label="Active" value={formatNumber(metrics.activeFarms)} color="#16A34A" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="star" label="PRO" value={formatNumber(metrics.proFarms)} color="#8B5CF6" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="calendar" label="Today" value={formatNumber(metrics.activeToday)} color="#0EA5E9" subtitle="Active today" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="calendar" label="New" value={formatNumber(metrics.newThisMonth)} color="#F59E0B" subtitle="This month" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="assessment" label="Showing" value={formatNumber(total)} color="#64748B" subtitle={filter !== "all" ? filter : "All farms"} /></Grid>
        </Grid>
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
        onSortChange={(col, dir) => { setSortBy(col); setSortDir(dir); }}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        onFarmClick={(f) => { setSelectedFarm(f); setDrawerOpen(true); }}
        onRefresh={handleRefresh}
      />

      {/* Drawer */}
      <FarmDetailDrawer
        open={drawerOpen}
        farm={selectedFarm}
        onClose={() => { setDrawerOpen(false); setSelectedFarm(null); }}
        onUpdated={handleRefresh}
      />
    </Stack>
  );
}
