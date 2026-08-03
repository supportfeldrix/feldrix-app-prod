/**
 * ============================================================
 * Feldrix Control Centre — Enterprise Audit & Compliance Centre
 * Sprint 53.0
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Typography, Stack, Chip, Skeleton, Pagination,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel,
  useMediaQuery, useTheme,
} from "@mui/material";
import { FxPageLayout, FxStatCard, FxCard, FxStatusChip, FxSearchBar, FxEmptyState, semantic, typography as typo, radius } from "../../shared/design";
import { getAuditMetrics, getAuditEntries } from "../services/adminPlatformSettingsService";
import { formatRelativeTime, formatDate } from "../utils/adminFormatters";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
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

  useEffect(() => { getAuditMetrics().then(setMetrics).catch(() => {}); }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAuditEntries({ search: debouncedSearch, filter, sortBy, sortDir, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      setEntries(r.entries);
      setTotal(r.total);
    } catch { setEntries([]); setTotal(0); }
    finally { setLoading(false); }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <FxPageLayout title="Audit Log" subtitle="Enterprise compliance and security audit trail.">
      <Stack spacing={4}>

        {/* KPIs */}
        {!metrics ? (
          <Grid container spacing={2}>{Array.from({ length: 8 }).map((_, i) => <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📋" label="Total Events" value={metrics.total} color="#3B82F6" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📅" label="Today" value={metrics.today} color="#0EA5E9" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔴" label="Critical" value={metrics.critical} color="#EF4444" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⚠️" label="Warning" value={metrics.warning} color="#F59E0B" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔐" label="Security" value={metrics.security} color="#8B5CF6" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="💳" label="Billing" value={metrics.billing} color="#16A34A" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🚫" label="Failed Logins" value={metrics.failedLogins} color="#EF4444" /></Grid>
            <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔑" label="Permission Changes" value={metrics.permissionChanges} color="#6366F1" /></Grid>
          </Grid>
        )}

        {/* AI Summary */}
        <FxCard sx={{ position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #6366F1, #3B82F6)" }} />
          <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1 }}>🧠 AI Audit Summary</Typography>
          <Stack spacing={0.5}>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
              {(metrics?.critical || 0) === 0 ? "✓ No critical events detected." : `⚠ ${metrics.critical} critical event(s) require review.`}
            </Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
              {(metrics?.security || 0) === 0 ? "✓ No security concerns." : `🔐 ${metrics.security} security event(s) logged.`}
            </Typography>
            <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
              {(metrics?.today || 0) > 0 ? `✓ ${metrics.today} event(s) today — platform actively managed.` : "ℹ No events logged today."}
            </Typography>
          </Stack>
        </FxCard>

        {/* Search + Filters */}
        <Stack spacing={2}>
          <FxSearchBar value={search} onChange={setSearch} placeholder="Search audit log..." />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {FILTERS.map((f) => (
              <Chip key={f.id} label={f.label} size="small" onClick={() => setFilter(f.id)}
                sx={{ bgcolor: filter === f.id ? `${semantic.info}12` : "#fff", color: filter === f.id ? semantic.info : semantic.textSecondary, border: `1px solid ${filter === f.id ? semantic.info + "40" : semantic.border}`, fontWeight: filter === f.id ? 700 : 500, fontSize: "0.72rem", cursor: "pointer" }} />
            ))}
          </Box>
        </Stack>

        {/* Table / Cards */}
        {loading ? (
          <Stack spacing={1.5}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={50} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : entries.length === 0 ? (
          <FxEmptyState icon="📋" title="No audit events" description="Audit events will appear here as admin actions are performed." />
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {entries.map((e) => (
              <FxCard key={e.id} sx={{ py: 1.5, px: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{e.action}</Typography>
                    <Typography sx={{ ...typo.tiny, color: semantic.textSecondary }}>{e.profiles?.full_name || "System"} · {e.target_type || "—"}</Typography>
                  </Box>
                  <Stack alignItems="flex-end" spacing={0.5}>
                    <FxStatusChip status={e.details?.severity === "error" ? "critical" : e.details?.severity === "security" ? "warning" : "healthy"} label={e.details?.severity || "info"} />
                    <Typography sx={{ ...typo.tiny, color: semantic.textTertiary }}>{formatRelativeTime(e.created_at)}</Typography>
                  </Stack>
                </Stack>
              </FxCard>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: radius.lg, border: `1px solid ${semantic.border}`, boxShadow: "none" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: semantic.surface }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", color: semantic.textSecondary, textTransform: "uppercase" }}>
                    <TableSortLabel active={sortBy === "created_at"} direction={sortDir} onClick={() => { setSortBy("created_at"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Time</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", color: semantic.textSecondary, textTransform: "uppercase" }}>Admin</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", color: semantic.textSecondary, textTransform: "uppercase" }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", color: semantic.textSecondary, textTransform: "uppercase" }}>Target</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", color: semantic.textSecondary, textTransform: "uppercase" }}>Severity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id} hover sx={{ "&:hover": { bgcolor: semantic.surface } }}>
                    <TableCell><Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{formatRelativeTime(e.created_at)}</Typography></TableCell>
                    <TableCell><Typography sx={{ ...typo.bodySmall, color: semantic.text }}>{e.profiles?.full_name || "System"}</Typography></TableCell>
                    <TableCell><Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{e.action}</Typography></TableCell>
                    <TableCell><Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{e.target_type || "—"}</Typography></TableCell>
                    <TableCell><FxStatusChip status={e.details?.severity === "error" ? "critical" : e.details?.severity === "security" ? "admin" : e.details?.severity === "warn" ? "warning" : "active"} label={e.details?.severity || "info"} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" />
          </Box>
        )}

        {/* Export Placeholders */}
        <FxCard sx={{ textAlign: "center", py: 3 }}>
          <Typography sx={{ fontSize: "1.2rem", mb: 0.75 }}>📥</Typography>
          <Typography sx={{ ...typo.cardTitle, color: semantic.text, mb: 0.5 }}>Export Audit Log</Typography>
          <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>CSV, PDF, and JSON exports coming in Sprint 54.</Typography>
        </FxCard>

      </Stack>
    </FxPageLayout>
  );
}
