/**
 * ============================================================
 * Feldrix Control Centre — User Data Table (Enterprise)
 * Sprint 47.0
 *
 * Sortable, filterable, searchable, paginated, responsive.
 * On mobile: stacked card layout.
 * ============================================================
 */

import { useState } from "react";
import {
  Box, Typography, Stack, Chip, Avatar, IconButton,
  TextField, InputAdornment, Skeleton, Pagination,
  useMediaQuery, useTheme, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TableSortLabel,
} from "@mui/material";
import { Search, FilterList, MoreVert } from "@mui/icons-material";
import { ADMIN_THEME } from "../../utils/adminConstants";
import { formatRelativeTime, formatDate } from "../../utils/adminFormatters";

const FILTERS = [
  { id: "all", label: "All Users" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
  { id: "pro", label: "PRO" },
  { id: "starter", label: "Starter" },
  { id: "admin", label: "Admin" },
  { id: "support", label: "Support" },
  { id: "finance", label: "Finance" },
  { id: "readonly", label: "ReadOnly" },
  { id: "new_this_week", label: "New This Week" },
  { id: "inactive", label: "Inactive" },
];

const COLUMNS = [
  { id: "full_name", label: "Name", sortable: true },
  { id: "email", label: "Email", sortable: true },
  { id: "farm_name", label: "Farm", sortable: true },
  { id: "role", label: "Role", sortable: true },
  { id: "country", label: "Country", sortable: false },
  { id: "suspended", label: "Status", sortable: true },
  { id: "last_login", label: "Last Login", sortable: true },
  { id: "created_at", label: "Joined", sortable: true },
];

function StatusChip({ suspended }) {
  return (
    <Chip
      label={suspended ? "Suspended" : "Active"}
      size="small"
      sx={{
        bgcolor: suspended ? "#FEE2E2" : "#DCFCE7",
        color: suspended ? "#991B1B" : "#166534",
        fontWeight: 600,
        fontSize: "0.68rem",
        height: 22,
      }}
    />
  );
}

function RoleChip({ role }) {
  const colors = {
    admin: { bg: "#EDE9FE", text: "#5B21B6" },
    support: { bg: "#DBEAFE", text: "#1E40AF" },
    finance: { bg: "#FEF3C7", text: "#92400E" },
    readonly: { bg: "#F1F5F9", text: "#475569" },
    farmer: { bg: "#F0FDF4", text: "#166534" },
  };
  const c = colors[role] || colors.farmer;
  return (
    <Chip
      label={role || "farmer"}
      size="small"
      sx={{ bgcolor: c.bg, color: c.text, fontWeight: 600, fontSize: "0.65rem", height: 22, textTransform: "capitalize" }}
    />
  );
}

function UserAvatar({ name, size = 34 }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: ADMIN_THEME.primary,
        fontSize: size * 0.38,
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  );
}

// ─── Mobile Card ─────────────────────────────────────────────

function UserCard({ user, onClick }) {
  return (
    <Box
      onClick={() => onClick(user)}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        bgcolor: "#fff",
        border: `1px solid ${ADMIN_THEME.cardBorder}`,
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <UserAvatar name={user.full_name} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: ADMIN_THEME.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.full_name || "—"}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: ADMIN_THEME.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </Typography>
        </Box>
        <Stack spacing={0.5} alignItems="flex-end">
          <StatusChip suspended={user.suspended} />
          <RoleChip role={user.role} />
        </Stack>
      </Stack>
      {user.farm_name && (
        <Typography sx={{ fontSize: "0.72rem", color: ADMIN_THEME.textSecondary, mt: 1, ml: 7 }}>
          🚜 {user.farm_name}
        </Typography>
      )}
    </Box>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────

function TableSkeleton({ rows = 5 }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function UserTable({
  users,
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
  onUserClick,
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
      {/* Search + Filter bar */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <TextField
          placeholder="Search users..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            maxWidth: { sm: 320 },
            "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: ADMIN_THEME.textSecondary }} />
              </InputAdornment>
            ),
          }}
        />
        <Typography sx={{ fontSize: "0.78rem", color: ADMIN_THEME.textSecondary, whiteSpace: "nowrap" }}>
          {total} user{total !== 1 ? "s" : ""}
        </Typography>
      </Stack>

      {/* Filter chips */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            size="small"
            onClick={() => onFilterChange(f.id)}
            sx={{
              bgcolor: filter === f.id ? `${ADMIN_THEME.primary}12` : "#fff",
              color: filter === f.id ? ADMIN_THEME.primary : ADMIN_THEME.textSecondary,
              border: `1px solid ${filter === f.id ? ADMIN_THEME.primary + "40" : ADMIN_THEME.cardBorder}`,
              fontWeight: filter === f.id ? 700 : 500,
              fontSize: "0.72rem",
              cursor: "pointer",
              "&:hover": { bgcolor: `${ADMIN_THEME.primary}08` },
            }}
          />
        ))}
      </Box>

      {/* Error state */}
      {error && (
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: "#FEF2F2", border: "1px solid #FECACA", textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.85rem", color: "#B91C1C" }}>Failed to load users. Please try again.</Typography>
        </Box>
      )}

      {/* Loading state */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty state */}
      {!loading && !error && users.length === 0 && (
        <Box sx={{ p: 5, borderRadius: 3, bgcolor: "#fff", border: `1px dashed ${ADMIN_THEME.cardBorder}`, textAlign: "center" }}>
          <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>👥</Typography>
          <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: ADMIN_THEME.text, mb: 0.5 }}>No users found</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: ADMIN_THEME.textSecondary }}>Try adjusting your search or filters.</Typography>
        </Box>
      )}

      {/* Data — Mobile cards */}
      {!loading && !error && users.length > 0 && isMobile && (
        <Stack spacing={1.5}>
          {users.map((user) => (
            <UserCard key={user.id} user={user} onClick={onUserClick} />
          ))}
        </Stack>
      )}

      {/* Data — Desktop table */}
      {!loading && !error && users.length > 0 && !isMobile && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${ADMIN_THEME.cardBorder}`, boxShadow: "none" }}>
          <Table size="small" aria-label="Users table">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.72rem", color: ADMIN_THEME.textSecondary, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortBy === col.id}
                        direction={sortBy === col.id ? sortDir : "asc"}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  onClick={() => onUserClick(user)}
                  sx={{ cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC" } }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <UserAvatar name={user.full_name} size={30} />
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: ADMIN_THEME.text }}>
                        {user.full_name || "—"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.78rem", color: ADMIN_THEME.textSecondary }}>{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.78rem", color: ADMIN_THEME.textSecondary }}>{user.farm_name || "—"}</Typography>
                  </TableCell>
                  <TableCell><RoleChip role={user.role} /></TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.78rem", color: ADMIN_THEME.textSecondary }}>{user.country || "—"}</Typography>
                  </TableCell>
                  <TableCell><StatusChip suspended={user.suspended} /></TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.75rem", color: ADMIN_THEME.textSecondary }}>{formatRelativeTime(user.last_login)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.75rem", color: ADMIN_THEME.textSecondary }}>{formatDate(user.created_at)}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onUserClick(user); }}>
                      <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
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
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            size="small"
            sx={{
              "& .MuiPaginationItem-root": { fontSize: "0.8rem", minWidth: 32, minHeight: 32 },
              "& .Mui-selected": { bgcolor: `${ADMIN_THEME.primary} !important`, color: "#fff" },
            }}
          />
        </Box>
      )}
    </Stack>
  );
}
