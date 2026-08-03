/**
 * ============================================================
 * Feldrix Control Centre — Farm Table (Premium v2.0)
 * Version 2.0 Phase 2
 *
 * Matches Users table quality. Same patterns, same tokens.
 * ============================================================
 */

import {
  Box, Typography, Stack, Chip, Avatar, IconButton, Skeleton, Pagination,
  useMediaQuery, useTheme, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TableSortLabel,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { FxSearchBar, FxStatusChip, FxEmptyState, semantic, typography as typo, radius, shadows, transitions } from "../../../shared/design";
import { formatRelativeTime, formatDate, formatNumber } from "../../utils/adminFormatters";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "pro", label: "PRO" },
  { id: "recently_active", label: "Recently Active" },
  { id: "new_this_month", label: "New" },
  { id: "south_africa", label: "South Africa" },
];

const COLUMNS = [
  { id: "farm_name", label: "Farm", sortable: true },
  { id: "health", label: "Health", sortable: false },
  { id: "livestock", label: "Livestock", sortable: false },
  { id: "crops", label: "Crops", sortable: false },
  { id: "tasks", label: "Tasks", sortable: false },
  { id: "suspended", label: "Status", sortable: true },
  { id: "last_login", label: "Last Active", sortable: true },
];

function FarmAvatar({ name }) {
  return (
    <Avatar sx={{ width: 32, height: 32, bgcolor: "#16A34A", fontSize: "0.72rem", fontWeight: 700 }}>
      {(name || "F").charAt(0).toUpperCase()}
    </Avatar>
  );
}

function HealthIndicator({ livestock, crops, tasks }) {
  const modules = [livestock > 0, crops > 0, tasks > 0].filter(Boolean).length;
  const score = Math.round((modules / 3) * 100);
  const color = score >= 75 ? semantic.success : score >= 50 ? semantic.warning : semantic.error;
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 28, height: 4, borderRadius: 2, bgcolor: `${color}25`, overflow: "hidden" }}>
        <Box sx={{ width: `${score}%`, height: "100%", bgcolor: color, borderRadius: 2 }} />
      </Box>
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color, minWidth: 26 }}>{score}%</Typography>
    </Stack>
  );
}

// ─── Mobile Card ─────────────────────────────────────────────

function FarmCard({ farm, onClick }) {
  const modules = [(farm.livestock || 0) > 0, (farm.crops || 0) > 0, (farm.tasks || 0) > 0].filter(Boolean).length;
  const score = Math.round((modules / 3) * 100);
  const healthColor = score >= 75 ? semantic.success : score >= 50 ? semantic.warning : semantic.error;

  return (
    <Box
      onClick={() => onClick(farm)}
      sx={{
        p: 2.5,
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: `1px solid ${semantic.border}`,
        borderLeft: `3px solid ${healthColor}`,
        cursor: "pointer",
        transition: transitions.normal,
        "&:hover": { boxShadow: shadows.sm, borderColor: semantic.borderHover },
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <FarmAvatar name={farm.farm_name} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {farm.farm_name || "—"}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary }}>
            {farm.full_name || "Unknown"} · {farm.province || "—"}
          </Typography>
        </Box>
        <Stack spacing={0.5} alignItems="flex-end">
          <FxStatusChip status={farm.suspended ? "suspended" : "active"} />
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: healthColor }}>{score}%</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function FarmTable({
  farms, total, loading, error, search, onSearchChange,
  filter, onFilterChange, sortBy, sortDir, onSortChange,
  page, onPageChange, pageSize, onFarmClick, onRefresh,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const totalPages = Math.ceil(total / pageSize);

  function handleSort(col) {
    onSortChange(col, col === sortBy && sortDir === "desc" ? "asc" : "desc");
  }

  return (
    <Stack spacing={2.5}>
      {/* Toolbar */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
        <FxSearchBar value={search} onChange={onSearchChange} placeholder="Search farms..." maxWidth={360} />
        <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, display: { xs: "none", sm: "block" } }}>
          {total} result{total !== 1 ? "s" : ""}
        </Typography>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} size="small" onClick={() => onFilterChange(f.id)}
            sx={{ bgcolor: filter === f.id ? `${semantic.info}12` : "#fff", color: filter === f.id ? semantic.info : semantic.textSecondary, border: `1px solid ${filter === f.id ? semantic.info + "40" : semantic.border}`, fontWeight: filter === f.id ? 700 : 500, fontSize: "0.7rem", cursor: "pointer", transition: transitions.fast, "&:hover": { bgcolor: `${semantic.info}08` } }}
          />
        ))}
      </Stack>

      {/* Error */}
      {error && <Box sx={{ p: 3, borderRadius: radius.lg, bgcolor: semantic.errorBg, border: `1px solid ${semantic.error}30`, textAlign: "center" }}><Typography sx={{ fontSize: "0.85rem", color: semantic.errorText }}>{error}</Typography></Box>}

      {/* Loading */}
      {loading && <Stack spacing={1.5}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2.5 }} />)}</Stack>}

      {/* Empty */}
      {!loading && !error && farms.length === 0 && <FxEmptyState icon="🚜" title="No farms found" description="Try adjusting your search or filters." />}

      {/* Mobile */}
      {!loading && !error && farms.length > 0 && isMobile && (
        <Stack spacing={1.5}>{farms.map((f) => <FarmCard key={f.id} farm={f} onClick={onFarmClick} />)}</Stack>
      )}

      {/* Desktop Table */}
      {!loading && !error && farms.length > 0 && !isMobile && (
        <Box sx={{ borderRadius: radius.lg, border: `1px solid ${semantic.border}`, overflow: "hidden", boxShadow: shadows.xs }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.68rem", color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, py: 1.75, borderBottom: `1px solid ${semantic.border}` }}>
                    {col.sortable ? <TableSortLabel active={sortBy === col.id} direction={sortBy === col.id ? sortDir : "asc"} onClick={() => handleSort(col.id)}>{col.label}</TableSortLabel> : col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 44, borderBottom: `1px solid ${semantic.border}` }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {farms.map((farm) => (
                <TableRow key={farm.id} onClick={() => onFarmClick(farm)} sx={{ cursor: "pointer", transition: transitions.fast, "&:hover": { bgcolor: "#FAFBFC" }, "& td": { borderBottom: `1px solid ${semantic.border}`, py: 1.5 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <FarmAvatar name={farm.farm_name} />
                      <Box>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{farm.farm_name || "—"}</Typography>
                        <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>{farm.full_name || "Unknown"}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell><HealthIndicator livestock={farm.livestock} crops={farm.crops} tasks={farm.tasks} /></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{formatNumber(farm.livestock)}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{formatNumber(farm.crops)}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{formatNumber(farm.tasks)}</Typography></TableCell>
                  <TableCell><FxStatusChip status={farm.suspended ? "suspended" : "active"} /></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary }}>{formatRelativeTime(farm.last_login)}</Typography></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onFarmClick(farm); }} sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}>
                      <MoreVert sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}><Pagination count={totalPages} page={page} onChange={(_, p) => onPageChange(p)} size="small" /></Box>}
    </Stack>
  );
}
