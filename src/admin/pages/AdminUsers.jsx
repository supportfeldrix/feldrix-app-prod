/**
 * ============================================================
 * Feldrix Control Centre — Users Management Page (Enterprise)
 * Sprint 47.0
 *
 * Wires UserTable + UserDetailDrawer + search/filter/sort/pagination.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack } from "@mui/material";
import UserTable from "../components/users/UserTable";
import UserDetailDrawer from "../components/users/UserDetailDrawer";
import { getUsers } from "../services/adminUserService";
import { ADMIN_THEME } from "../utils/adminConstants";

const PAGE_SIZE = 25;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controls
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  // Drawer
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers({
        search: debouncedSearch,
        filter,
        sortBy,
        sortDir,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      setError(err?.message || "Failed to load users.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, sortBy, sortDir, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  // Handlers
  function handleSortChange(column, direction) {
    setSortBy(column);
    setSortDir(direction);
  }

  function handleUserClick(user) {
    setSelectedUser(user);
    setDrawerOpen(true);
  }

  function handleDrawerClose() {
    setDrawerOpen(false);
    setSelectedUser(null);
  }

  function handleUserUpdated() {
    // Refresh the list after an action
    fetchUsers();
  }

  return (
    <Stack spacing={3}>
      {/* Page Header */}
      <Box>
        <Typography sx={{ fontSize: { xs: "1.3rem", md: "1.5rem" }, fontWeight: 800, color: ADMIN_THEME.text, letterSpacing: "-0.02em" }}>
          Users
        </Typography>
        <Typography sx={{ fontSize: "0.88rem", color: ADMIN_THEME.textSecondary }}>
          Manage all registered Feldrix customers.
        </Typography>
      </Box>

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
        onSortChange={handleSortChange}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        onUserClick={handleUserClick}
      />

      {/* User Detail Drawer */}
      <UserDetailDrawer
        open={drawerOpen}
        user={selectedUser}
        onClose={handleDrawerClose}
        onUserUpdated={handleUserUpdated}
      />
    </Stack>
  );
}
