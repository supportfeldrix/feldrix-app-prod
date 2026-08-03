/**
 * ============================================================
 * Feldrix Control Centre — Farm Table (Enterprise Polished)
 * Sprint 48.1
 *
 * Enterprise table with health score column, subscription chip,
 * toolbar (search + refresh + export placeholder), filters.
 * Desktop → table. Mobile → cards.
 * ============================================================
 */

import { useState } from "react";
import {
  Box, Typography, Stack, Chip, Avatar, IconButton, Skeleton, Pagination,
  useMediaQuery, useTheme, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TableSortLabel, Button, Tooltip,
} from "@mui/material";
import { MoreVert, Refresh, FileDownload } from "@mui/icons-material";
import { FxSearchBar, FxStatusChip, FxEmptyState, semantic, typography as typo, radius } from "../../../shared/design";
import { formatRelativeTime, formatDate, formatNumber } from "../../utils/adminFormatters";

const FILTERS = [
  { id: "all", label: "All Farms" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "pro", label: "PRO" },
  { id: "starter", label: "Starter" },
  { id: "new_this_month", label: "New This Month" },
  { id: "recently_active", label: "Recently Active" },
  { id: "south_africa", label: "South Africa" },
];

const COLUMNS = [
  { id: "farm_name", label: "Farm", sortable: true },
  { id: "full_name", label: "Owner", sortable: true },
  { id: "health", label: "Health", sortable: false },
  { id: "livestock", label: "Livestock", sortable: false },
  { id: "crops", label: "Crops", sortable: false },
  { id: "tasks", label: "Tasks", sortable: false },
  { id: "province", label: "Province", sortable: true },
  { id: "suspended", label: "Status", sortable: true },
  { id: "last_login", label: "Last Active", sortable: true },
];

function FarmAvatar({ name }) {
  const letter = (name || "F").charAt(0).toUpperCase();
  return (
    <Avatar sx={{ width: 32, height: 32, bgcolor: "#16A34A", fontSize: "0.75rem", fontWeight: 700 }}>
      {letter}
    </Avatar>
  );
}

function HealthScore({ livestock, crops, tasks }) {
  const modules = [livestock > 0, crops > 0, tasks > 0].filter(Boolean).length;
  const score = Math.round((modules / 3) * 100);
  const color = score >= 75 ? semantic.success : score >= 50 ? semantic.warning : semantic.error;
  return (
    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color }}>
      {score}%
    </Typography>
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
        transition: "all 0.15s ease",
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <FarmAvatar name={farm.farm_name} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {farm.farm_name || "—"}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary }}>
            {farm.full_name || "Unknown"} · {farm.province || farm.country || "—"}
          </Typography>
        </Box>
        <Stack spacing={0.5} alignItems="flex-end">
          <FxStatusChip status={farm.suspended ? "suspended" : "active"} />
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: healthColor }}>{score}% Health</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={2.5} sx={{ mt: 1.5, ml: 6 }}>
        <Typography sx={{ fontSize: "0.7rem", color: semantic.textSecondary }}>🐄 {farm.livestock || 0}</Typography>
        <Typography sx={{ fontSize: "0.7rem", color: semantic.textSecondary }}>🌾 {farm.crops || 0}</Typography>
        <Typography sx={{ fontSize: "0.7rem", color: semantic.textSecondary }}>📋 {farm.tasks || 0}</Typography>
      </Stack>
    </Box>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────

function TableSkeleton({ rows = 5 }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={50} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function FarmTable({
  farms,
  total,
  loading,
  error,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sortBy,
  sortDir,
  onSortChange,
  page,
  onPageChange,
  pageSize,
  onFarmClick,
  onRefresh,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const totalPages = Math.ceil(total / pageSize);

  function handleSort(column) {
    if (column === sortBy) {
      onSortChange(column, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(column, "desc");
    }
  }

  return (
    <Stack spacing={2.5}>
      {/* Enterprise Toolbar */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
          <FxSearchBar value={search} onChange={onSearchChange} placeholder="Search farms..." />
          <Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary, whiteSpace: "nowrap", display: { xs: "none", sm: "block" } }}>
            {total} farm{total !== 1 ? "s" : ""}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={onRefresh} sx={{ width: 36, height: 36, border: `1px solid ${semantic.border}`, borderRadius: 2 }}>
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Export (coming soon)">
            <span>
              <IconButton size="small" disabled sx={{ width: 36, height: 36, border: `1px solid ${semantic.border}`, borderRadius: 2 }}>
                <FileDownload sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filters */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            size="small"
            onClick={() => onFilterChange(f.id)}
            sx={{
              bgcolor: filter === f.id ? `${semantic.info}12` : "#fff",
              color: filter === f.id ? semantic.info : semantic.textSecondary,
              border: `1px solid ${filter === f.id ? semantic.info + "40" : semantic.border}`,
              fontWeight: filter === f.id ? 700 : 500,
              fontSize: "0.72rem",
              cursor: "pointer",
              "&:hover": { bgcolor: `${semantic.info}08` },
            }}
          />
        ))}
      </Box>

      {/* Error */}
      {error && (
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: semantic.errorBg, border: `1px solid ${semantic.error}30`, textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.85rem", color: semantic.errorText }}>Failed to load farms. Please try again.</Typography>
        </Box>
      )}

      {/* Loading */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty */}
      {!loading && !error && farms.length === 0 && (
        <FxEmptyState icon="🚜" title="No farms found" description="Try adjusting your search or filters." />
      )}

      {/* Mobile cards */}
      {!loading && !error && farms.length > 0 && isMobile && (
        <Stack spacing={1.5}>
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} onClick={onFarmClick} />
          ))}
        </Stack>
      )}

      {/* Desktop table */}
      {!loading && !error && farms.length > 0 && !isMobile && (
        <TableContainer component={Paper} sx={{ borderRadius: radius.lg, border: `1px solid ${semantic.border}`, boxShadow: "none" }}>
          <Table size="small" aria-label="Farms table">
            <TableHead>
              <TableRow sx={{ bgcolor: semantic.surface }}>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.7rem", color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
                    {col.sortable ? (
                      <TableSortLabel active={sortBy === col.id} direction={sortBy === col.id ? sortDir : "asc"} onClick={() => handleSort(col.id)}>
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {farms.map((farm) => (
                <TableRow key={farm.id} hover onClick={() => onFarmClick(farm)} sx={{ cursor: "pointer", "&:hover": { bgcolor: semantic.surface } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <FarmAvatar name={farm.farm_name} />
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{farm.farm_name || "—"}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary }}>{farm.full_name || "—"}</Typography></TableCell>
                  <TableCell><HealthScore livestock={farm.livestock} crops={farm.crops} tasks={farm.tasks} /></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{formatNumber(farm.livestock)}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{formatNumber(farm.crops)}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{formatNumber(farm.tasks)}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary }}>{farm.province || "—"}</Typography></TableCell>
                  <TableCell><FxStatusChip status={farm.suspended ? "suspended" : "active"} /></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary }}>{formatRelativeTime(farm.last_login)}</Typography></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onFarmClick(farm); }}><MoreVert sx={{ fontSize: 18 }} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => onPageChange(p)} size="small" />
        </Box>
      )}
    </Stack>
  );
}
