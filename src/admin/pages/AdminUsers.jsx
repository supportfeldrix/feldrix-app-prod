/**
 * ============================================================
 * Feldrix Control Centre — Users Management (Premium v2.0)
 * Version 2.0 Phase 1
 *
 * Matches Executive Dashboard visual standard.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, FxPageLayout, semantic, typography as typo } from "../../shared/design";
import UserTable from "../components/users/UserTable";
import UserDetailDrawer from "../components/users/UserDetailDrawer";
import { getUsers, getUserCount, getTodaySignups } from "../services/adminUserService";
import { formatNumber } from "../utils/adminFormatters";

const PAGE_SIZE = 25;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  // Load KPIs
  useEffect(() => {
    async function loadKpis() {
      try {
        const [totalCount, todayCount] = await Promise.all([getUserCount(), getTodaySignups()]);
        setKpis({ total: totalCount, today: todayCount });
      } catch { /* graceful */ }
    }
    loadKpis();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await getUsers({ search: debouncedSearch, filter, sortBy, sortDir, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      setUsers(result.users); setTotal(result.total);
    } catch (err) { setError(err?.message || "Failed to load."); setUsers([]); setTotal(0); }
    finally { setLoading(false); }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  return (
    <Stack spacing={4}>
      {/* Page Header — matches Dashboard style */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Users</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Manage all registered Feldrix customers.
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchUsers} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}>
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Mini KPI Row */}
      {kpis && (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <FxStatCard icon="👥" label="Total Users" value={formatNumber(kpis.total)} color="#3B82F6" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FxStatCard icon="🆕" label="Today" value={formatNumber(kpis.today)} color="#16A34A" subtitle="New signups" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FxStatCard icon="📋" label="Showing" value={formatNumber(total)} color="#64748B" subtitle={filter !== "all" ? filter : "All users"} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FxStatCard icon="📄" label="Page" value={`${page} / ${Math.ceil(total / PAGE_SIZE) || 1}`} color="#64748B" />
          </Grid>
        </Grid>
      )}
      {!kpis && (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => <Grid item xs={6} sm={3} key={i}><Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
      )}

      {/* User Table */}
      <UserTable
        users={users}
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
        onUserClick={(u) => { setSelectedUser(u); setDrawerOpen(true); }}
      />

      {/* Drawer */}
      <UserDetailDrawer
        open={drawerOpen}
        user={selectedUser}
        onClose={() => { setDrawerOpen(false); setSelectedUser(null); }}
        onUserUpdated={fetchUsers}
      />
    </Stack>
  );
}
