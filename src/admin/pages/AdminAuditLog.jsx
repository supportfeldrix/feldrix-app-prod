/**
 * ============================================================
 * Feldrix Control Centre Audit Log (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, Grid, Chip, Skeleton, Pagination, IconButton, Tooltip, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, useMediaQuery, useTheme } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxStatCard, FxCard, FxSearchBar, FxStatusChip, FxEmptyState, semantic, typography as typo, radius, shadows, transitions } from "../../shared/design";
import { getAuditMetrics, getAuditEntries } from "../services/adminPlatformSettingsService";
import { formatRelativeTime } from "../utils/adminFormatters";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "7days", label: "7 Days" },
  { id: "30days", label: "30 Days" },
  { id: "security", label: "Security" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
];

const PAGE_SIZE = 20;

export default function AdminAuditLog() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [metrics, setMetrics] = useState(null);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  function loadMetrics() { getAuditMetrics().then(setMetrics).catch(() => {}); }
  useEffect(() => { loadMetrics(); }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try { const r = await getAuditEntries({ search: debouncedSearch, filter, sortBy, sortDir, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }); setEntries(r.entries); setTotal(r.total); }
    catch { setEntries([]); setTotal(0); }
    finally { setLoading(false); }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  function handleRefresh() { fetchEntries(); loadMetrics(); }
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Audit Log</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Enterprise compliance, security monitoring and admin action trail.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={handleRefresh} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Stack>

      {/* KPIs */}
      {!metrics ? (
        <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="people" label="Total" value={metrics.total} color="#3B82F6" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="calendar" label="Today" value={metrics.today} color="#0EA5E9" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="warning" label="Critical" value={metrics.critical} color="#EF4444" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="warning" label="Warning" value={metrics.warning} color="#F59E0B" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="security" label="Security" value={metrics.security} color="#8B5CF6" /></Grid>
          <Grid item xs={6} sm={4} md={2}><FxStatCard icon="assessment" label="Showing" value={total} color="#64748B" subtitle={filter !== "all" ? filter : "All"} /></Grid>
        </Grid>
      )}

      {/* AI Summary */}
      {metrics && (
        <FxCard sx={{ position: "relative", overflow: "hidden", py: 2.5 }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #6366F1, #3B82F6)" }} />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: "#6366F112", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}></Box>
            <Typography sx={{ ...typo.bodySmall, fontWeight: 700, color: semantic.text }}>Audit Intelligence</Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.critical === 0 ? "No critical events detected." : `${metrics.critical} critical event(s) require review.`}</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.security === 0 ? "No security concerns." : `${metrics.security} security event(s) logged.`}</Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{metrics.today > 0 ? `${metrics.today} event(s) today platform actively managed.` : "No events today."}</Typography>
          </Stack>
        </FxCard>
      )}

      {/* Toolbar + Filters */}
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <FxSearchBar value={search} onChange={setSearch} placeholder="Search audit log..." maxWidth={360} />
          <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, display: { xs: "none", sm: "block" } }}>{total} result{total !== 1 ? "s" : ""}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {FILTERS.map((f) => <Chip key={f.id} label={f.label} size="small" onClick={() => setFilter(f.id)} sx={{ bgcolor: filter === f.id ? `${semantic.info}12` : "#fff", color: filter === f.id ? semantic.info : semantic.textSecondary, border: `1px solid ${filter === f.id ? semantic.info + "40" : semantic.border}`, fontWeight: filter === f.id ? 700 : 500, fontSize: "0.7rem", cursor: "pointer", transition: transitions.fast, "&:hover": { bgcolor: `${semantic.info}08` } }} />)}
        </Stack>
      </Stack>

      {/* Table / Cards */}
      {loading ? <Stack spacing={1.5}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2.5 }} />)}</Stack>
      : entries.length === 0 ? <FxEmptyState icon="assessment" title="No audit events" description="Events will appear here as admin actions are performed." />
      : isMobile ? (
        <Stack spacing={1.5}>
          {entries.map((e) => (
            <FxCard key={e.id} sx={{ py: 1.5, px: 2.5, borderLeft: `3px solid ${e.details?.severity === "error" ? semantic.error : e.details?.severity === "security" ? "#8B5CF6" : e.details?.severity === "warn" ? semantic.warning : semantic.success}` }}>
              <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{e.action}</Typography>
              <Typography sx={{ ...typo.tiny, color: semantic.textSecondary }}>{e.profiles?.full_name || "System"} {e.target_type || "—"}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <FxStatusChip status={e.details?.severity === "error" ? "critical" : e.details?.severity === "security" ? "admin" : e.details?.severity === "warn" ? "warning" : "active"} label={e.details?.severity || "info"} />
                <Typography sx={{ ...typo.tiny, color: semantic.textTertiary }}>{formatRelativeTime(e.created_at)}</Typography>
              </Stack>
            </FxCard>
          ))}
        </Stack>
      ) : (
        <Box sx={{ borderRadius: radius.lg, border: `1px solid ${semantic.border}`, overflow: "hidden", boxShadow: shadows.xs }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, py: 1.75, borderBottom: `1px solid ${semantic.border}` }}>
                  <TableSortLabel active={sortBy === "created_at"} direction={sortDir} onClick={() => { setSortBy("created_at"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Time</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", color: semantic.textSecondary, textTransform: "uppercase", py: 1.75, borderBottom: `1px solid ${semantic.border}` }}>Admin</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", color: semantic.textSecondary, textTransform: "uppercase", py: 1.75, borderBottom: `1px solid ${semantic.border}` }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", color: semantic.textSecondary, textTransform: "uppercase", py: 1.75, borderBottom: `1px solid ${semantic.border}` }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", color: semantic.textSecondary, textTransform: "uppercase", py: 1.75, borderBottom: `1px solid ${semantic.border}` }}>Severity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id} sx={{ transition: transitions.fast, "&:hover": { bgcolor: "#FAFBFC" }, "& td": { borderBottom: `1px solid ${semantic.border}`, py: 1.5 } }}>
                  <TableCell><Typography sx={{ ...typo.caption, color: semantic.textTertiary }}>{formatRelativeTime(e.created_at)}</Typography></TableCell>
                  <TableCell><Typography sx={{ ...typo.bodySmall, color: semantic.text }}>{e.profiles?.full_name || "System"}</Typography></TableCell>
                  <TableCell><Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{e.action}</Typography></TableCell>
                  <TableCell><Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{e.target_type || "—"}</Typography></TableCell>
                  <TableCell><FxStatusChip status={e.details?.severity === "error" ? "critical" : e.details?.severity === "security" ? "admin" : e.details?.severity === "warn" ? "warning" : "active"} label={e.details?.severity || "info"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}><Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" /></Box>}
    </Stack>
  );
}
