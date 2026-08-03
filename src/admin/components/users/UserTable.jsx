/**
 * ============================================================
 * Feldrix Control Centre — User Table (Premium v2.0)
 * Version 2.0 Phase 1
 *
 * Matches Executive Dashboard quality. Uses shared design system.
 * ============================================================
 */

import {
  Box, Typography, Stack, Chip, Avatar, IconButton, Skeleton, Pagination,
  useMediaQuery, useTheme, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TableSortLabel,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { FxSearchBar, FxStatusChip, FxEmptyState, semantic, typography as typo, radius, shadows, transitions } from "../../../shared/design";
import { formatRelativeTime, formatDate } from "../../utils/adminFormatters";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
  { id: "pro", label: "PRO" },
  { id: "admin", label: "Admin" },
  { id: "new_this_week", label: "New" },
  { id: "inactive", label: "Inactive" },
];

const COLUMNS = [
  { id: "full_name", label: "Customer", sortable: true },
  { id: "farm_name", label: "Farm", sortable: true },
  { id: "role", label: "Role", sortable: true },
  { id: "suspended", label: "Status", sortable: true },
  { id: "last_login", label: "Last Active", sortable: true },
  { id: "created_at", label: "Joined", sortable: true },
];

// ─── Mobile Card ─────────────────────────────────────────────

function UserCard({ user, onClick }) {
  return (
    <Box
      onClick={() => onClick(user)}
      sx={{
        p: 2.5,
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: `1px solid ${semantic.border}`,
        cursor: "pointer",
        transition: transitions.normal,
        "&:hover": { boxShadow: shadows.sm, borderColor: semantic.borderHover },
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <UserAvatar name={user.full_name} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.full_name || "Unknown"}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email || "—"}
          </Typography>
        </Box>
        <Stack spacing={0.5} alignItems="flex-end">
          <FxStatusChip status={user.suspended ? "suspended" : "active"} />
          <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>{formatRelativeTime(user.last_login)}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function UserAvatar({ name, size = 34 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: "#3B82F6", fontSize: size * 0.36, fontWeight: 700, letterSpacing: "-0.02em" }}>
      {initials}
    </Avatar>
  );
}

function RoleChip({ role }) {
  const map = { admin: "admin", support: "support", finance: "finance", readonly: "readonly", farmer: "farmer" };
  return <FxStatusChip status={map[role] || "farmer"} />;
}

// ─── Main Component ──────────────────────────────────────────

export default function UserTable({
  users, total, loading, error, search, onSearchChange,
  filter, onFilterChange, sortBy, sortDir, onSortChange,
  page, onPageChange, pageSize, onUserClick,
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
        <FxSearchBar value={search} onChange={onSearchChange} placeholder="Search customers..." maxWidth={360} />
        <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, display: { xs: "none", sm: "block" } }}>
          {total} result{total !== 1 ? "s" : ""}
        </Typography>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
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
              fontSize: "0.7rem",
              cursor: "pointer",
              transition: transitions.fast,
              "&:hover": { bgcolor: `${semantic.info}08` },
            }}
          />
        ))}
      </Stack>

      {/* Error */}
      {error && (
        <Box sx={{ p: 3, borderRadius: radius.lg, bgcolor: semantic.errorBg, border: `1px solid ${semantic.error}30`, textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.85rem", color: semantic.errorText }}>{error}</Typography>
        </Box>
      )}

      {/* Loading */}
      {loading && <Stack spacing={1.5}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2.5 }} />)}</Stack>}

      {/* Empty */}
      {!loading && !error && users.length === 0 && (
        <FxEmptyState icon="👥" title="No customers found" description="Try adjusting your search or filters." />
      )}

      {/* Mobile */}
      {!loading && !error && users.length > 0 && isMobile && (
        <Stack spacing={1.5}>{users.map((u) => <UserCard key={u.id} user={u} onClick={onUserClick} />)}</Stack>
      )}

      {/* Desktop Table */}
      {!loading && !error && users.length > 0 && !isMobile && (
        <Box sx={{ borderRadius: radius.lg, border: `1px solid ${semantic.border}`, overflow: "hidden", boxShadow: shadows.xs }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.68rem", color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, py: 1.75, borderBottom: `1px solid ${semantic.border}` }}>
                    {col.sortable ? (
                      <TableSortLabel active={sortBy === col.id} direction={sortBy === col.id ? sortDir : "asc"} onClick={() => handleSort(col.id)}>
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 44, borderBottom: `1px solid ${semantic.border}` }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => onUserClick(user)}
                  sx={{ cursor: "pointer", transition: transitions.fast, "&:hover": { bgcolor: "#FAFBFC" }, "& td": { borderBottom: `1px solid ${semantic.border}`, py: 1.5 } }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <UserAvatar name={user.full_name} size={32} />
                      <Box>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{user.full_name || "Unknown"}</Typography>
                        <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>{user.email || "—"}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary }}>{user.farm_name || "—"}</Typography></TableCell>
                  <TableCell><RoleChip role={user.role} /></TableCell>
                  <TableCell><FxStatusChip status={user.suspended ? "suspended" : "active"} /></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary }}>{formatRelativeTime(user.last_login)}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary }}>{formatDate(user.created_at)}</Typography></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onUserClick(user); }} sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}>
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
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => onPageChange(p)} size="small" />
        </Box>
      )}
    </Stack>
  );
}
