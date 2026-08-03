/**
 * ============================================================
 * Feldrix Control Centre — Payment Table (Enterprise)
 * Sprint 49.0
 *
 * Enterprise data table for payments/subscriptions.
 * Desktop → table. Mobile → cards. Uses shared design system.
 * ============================================================
 */

import {
  Box, Typography, Stack, Chip, Avatar, IconButton, Skeleton, Pagination,
  useMediaQuery, useTheme, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TableSortLabel,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { FxSearchBar, FxStatusChip, FxEmptyState, semantic, typography as typo, radius } from "../../../shared/design";
import { formatRelativeTime, formatDate, formatCurrency } from "../../utils/adminFormatters";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "successful", label: "Successful" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refunded" },
];

const COLUMNS = [
  { id: "customer", label: "Customer", sortable: false },
  { id: "amount", label: "Amount", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "reference", label: "Reference", sortable: false },
  { id: "created_at", label: "Date", sortable: true },
];

function PaymentStatusChip({ status }) {
  const map = {
    success: "healthy",
    pending: "pending",
    failed: "critical",
    cancelled: "cancelled",
    refunded: "warning",
  };
  const labels = {
    success: "Successful",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return <FxStatusChip status={map[status] || "inactive"} label={labels[status] || status || "—"} />;
}

// ─── Mobile Card ─────────────────────────────────────────────

function PaymentCard({ payment, onClick }) {
  const profile = payment.profiles || {};
  const statusColor = payment.status === "success" ? semantic.success : payment.status === "failed" ? semantic.error : semantic.warning;

  return (
    <Box
      onClick={() => onClick(payment)}
      sx={{
        p: 2.5,
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: `1px solid ${semantic.border}`,
        borderLeft: `3px solid ${statusColor}`,
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile.full_name || "Unknown"}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary }}>
            {profile.farm_name || "—"} · {formatRelativeTime(payment.created_at)}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: semantic.text }}>
            {formatCurrency(payment.amount)}
          </Typography>
          <PaymentStatusChip status={payment.status} />
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── Skeleton ────────────────────────────────────────────────

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

export default function PaymentTable({
  payments,
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
  onPaymentClick,
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
      {/* Search + Count */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <FxSearchBar value={search} onChange={onSearchChange} placeholder="Search payments..." />
        <Typography sx={{ ...typo.caption, color: semantic.textSecondary, whiteSpace: "nowrap" }}>
          {total} payment{total !== 1 ? "s" : ""}
        </Typography>
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
          <Typography sx={{ fontSize: "0.85rem", color: semantic.errorText }}>Failed to load payments.</Typography>
        </Box>
      )}

      {/* Loading */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty */}
      {!loading && !error && payments.length === 0 && (
        <FxEmptyState icon="💳" title="No payments found" description="No payment records match your current filters." />
      )}

      {/* Mobile cards */}
      {!loading && !error && payments.length > 0 && isMobile && (
        <Stack spacing={1.5}>
          {payments.map((p) => (
            <PaymentCard key={p.id} payment={p} onClick={onPaymentClick} />
          ))}
        </Stack>
      )}

      {/* Desktop table */}
      {!loading && !error && payments.length > 0 && !isMobile && (
        <TableContainer component={Paper} sx={{ borderRadius: radius.lg, border: `1px solid ${semantic.border}`, boxShadow: "none" }}>
          <Table size="small" aria-label="Payments table">
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
              {payments.map((p) => {
                const profile = p.profiles || {};
                return (
                  <TableRow key={p.id} hover onClick={() => onPaymentClick(p)} sx={{ cursor: "pointer", "&:hover": { bgcolor: semantic.surface } }}>
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{profile.full_name || "—"}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: semantic.textSecondary }}>{profile.farm_name || "—"}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: semantic.text }}>{formatCurrency(p.amount)}</Typography>
                    </TableCell>
                    <TableCell><PaymentStatusChip status={p.status} /></TableCell>
                    <TableCell><Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary, fontFamily: "monospace" }}>{p.reference || "—"}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary }}>{formatDate(p.created_at)}</Typography></TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onPaymentClick(p); }}><MoreVert sx={{ fontSize: 18 }} /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
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
