import { useMemo, useState } from "react";

import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  Notifications,
  CheckCircle,
  Close,
  Search,
  DoneAll,
  ClearAll,
} from "@mui/icons-material";

const PRIORITY_FILTERS = ["All", "Unread", "Critical", "High", "Medium", "Low"];
const MODULE_FILTERS = ["Planner", "Livestock", "Crops", "Machinery", "Finance", "Weather", "AI", "System"];

function getPriorityColor(priority) {
  switch (priority) {
    case "Critical": return "error";
    case "High": return "warning";
    case "Medium": return "info";
    case "Low": return "success";
    default: return "default";
  }
}

function getModuleColor(module) {
  switch (module) {
    case "Planner": return "#ed6c02";
    case "Livestock": return "#d32f2f";
    case "Crops": return "#2e7d32";
    case "Machinery": return "#1976d2";
    case "Finance": return "#7b1fa2";
    case "Weather": return "#0288d1";
    case "AI": return "#388e3c";
    case "System": return "#757575";
    default: return "#757575";
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export default function NotificationCenter({
  notifications: initialNotifications = [],
  loading = false,
  onNotificationClick,
  onMarkAsRead,
  onClear,
}) {
  const [localNotifications, setLocalNotifications] = useState(initialNotifications);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState(null);
  const [search, setSearch] = useState("");

  // Sync when prop changes
  useMemo(() => {
    setLocalNotifications(initialNotifications);
  }, [initialNotifications]);

  // Statistics
  const unreadCount = localNotifications.filter((n) => !n.read).length;
  const criticalCount = localNotifications.filter((n) => n.priority === "Critical").length;
  const todayCount = localNotifications.filter((n) => {
    if (!n.createdAt) return false;
    const d = new Date(n.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Filtering
  const filtered = useMemo(() => {
    let result = localNotifications;

    if (priorityFilter === "Unread") {
      result = result.filter((n) => !n.read);
    } else if (priorityFilter !== "All") {
      result = result.filter((n) => n.priority === priorityFilter);
    }

    if (moduleFilter) {
      result = result.filter((n) => n.module === moduleFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((n) =>
        (n.title || "").toLowerCase().includes(q) ||
        (n.message || "").toLowerCase().includes(q) ||
        (n.module || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [localNotifications, priorityFilter, moduleFilter, search]);

  // Actions
  function handleMarkAsRead(notification) {
    setLocalNotifications((prev) =>
      prev.map((n) => n.id === notification.id ? { ...n, read: true } : n)
    );
    onMarkAsRead?.(notification);
  }

  function handleClear(notification) {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    onClear?.(notification);
  }

  function handleMarkAllRead() {
    localNotifications.filter((n) => !n.read).forEach((n) => onMarkAsRead?.(n));
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleClearAllRead() {
    localNotifications.filter((n) => n.read).forEach((n) => onClear?.(n));
    setLocalNotifications((prev) => prev.filter((n) => !n.read));
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "box-shadow 0.2s ease",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>

        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <Notifications sx={{ fontSize: 18, color: "primary.main" }} />
          </Badge>
          <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
            Notifications
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              startIcon={<DoneAll sx={{ fontSize: 14 }} />}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              sx={{ textTransform: "none", fontSize: "0.6rem" }}
            >
              Mark All Read
            </Button>
            <Button
              size="small"
              startIcon={<ClearAll sx={{ fontSize: 14 }} />}
              onClick={handleClearAllRead}
              sx={{ textTransform: "none", fontSize: "0.6rem" }}
            >
              Clear Read
            </Button>
          </Stack>
        </Stack>

        {/* Statistics */}
        <Stack direction="row" spacing={0.75} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
          <Chip label={`${unreadCount} Unread`} size="small" color={unreadCount > 0 ? "primary" : "default"} sx={{ height: 18, fontSize: "0.55rem", fontWeight: 600 }} />
          {criticalCount > 0 && <Chip label={`${criticalCount} Critical`} size="small" color="error" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 600 }} />}
          <Chip label={`${todayCount} Today`} size="small" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 600 }} />
        </Stack>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <Search sx={{ fontSize: 16, color: "text.disabled", mr: 0.5 }} /> } }}
          sx={{ mb: 1.5, "& .MuiInputBase-root": { fontSize: "0.75rem", height: 32 } }}
          fullWidth
        />

        {/* Priority Filters */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          {PRIORITY_FILTERS.map((f) => (
            <Chip
              key={f}
              label={f}
              size="small"
              variant={priorityFilter === f ? "filled" : "outlined"}
              color={priorityFilter === f ? (f === "All" || f === "Unread" ? "primary" : getPriorityColor(f)) : "default"}
              onClick={() => setPriorityFilter(f)}
              sx={{ height: 20, fontSize: "0.55rem", fontWeight: 600, cursor: "pointer" }}
            />
          ))}
        </Stack>

        {/* Module Filters */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
          <Chip
            label="All Modules"
            size="small"
            variant={!moduleFilter ? "filled" : "outlined"}
            color={!moduleFilter ? "primary" : "default"}
            onClick={() => setModuleFilter(null)}
            sx={{ height: 18, fontSize: "0.5rem", fontWeight: 600, cursor: "pointer" }}
          />
          {MODULE_FILTERS.map((m) => (
            <Chip
              key={m}
              label={m}
              size="small"
              variant={moduleFilter === m ? "filled" : "outlined"}
              onClick={() => setModuleFilter(moduleFilter === m ? null : m)}
              sx={{
                height: 18,
                fontSize: "0.5rem",
                fontWeight: 600,
                cursor: "pointer",
                ...(moduleFilter === m ? { bgcolor: getModuleColor(m), color: "#fff" } : {}),
              }}
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        {/* Loading */}
        {loading && (
          <Stack spacing={1.5}>
            {[...Array(5)].map((_, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                <Skeleton variant="circular" width={8} height={8} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={16} />
                  <Skeleton variant="text" width="80%" height={14} />
                </Box>
              </Stack>
            ))}
          </Stack>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CheckCircle sx={{ fontSize: 28, color: "success.main", mb: 0.5 }} />
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem" }}>
              {search || moduleFilter || priorityFilter !== "All"
                ? "No matching notifications."
                : "You're all caught up!"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {search || moduleFilter || priorityFilter !== "All"
                ? "Try adjusting your filters."
                : "No notifications at the moment."}
            </Typography>
          </Box>
        )}

        {/* Notification list */}
        {!loading && filtered.length > 0 && (
          <Box sx={{ maxHeight: 400, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={0.75}>
              {filtered.map((notification) => (
                <Box
                  key={notification.id}
                  onClick={() => onNotificationClick?.(notification)}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    cursor: "pointer",
                    bgcolor: notification.read ? "transparent" : "action.hover",
                    border: "1px solid",
                    borderColor: notification.read ? "transparent" : "divider",
                    transition: "background 0.15s ease",
                    "&:hover": { bgcolor: "grey.50" },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Box
                      sx={{
                        mt: 0.6,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: `${getPriorityColor(notification.priority)}.main`,
                        flexShrink: 0,
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                          variant="caption"
                          fontWeight={notification.read ? 500 : 700}
                          noWrap
                          sx={{ flex: 1, fontSize: "0.7rem" }}
                        >
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.55rem", flexShrink: 0 }}>
                          {formatRelativeTime(notification.createdAt)}
                        </Typography>
                      </Stack>

                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", fontSize: "0.6rem" }}>
                        {notification.message}
                      </Typography>

                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                        <Chip
                          label={notification.module}
                          size="small"
                          sx={{
                            height: 14,
                            fontSize: "0.45rem",
                            fontWeight: 600,
                            bgcolor: `${getModuleColor(notification.module)}14`,
                            color: getModuleColor(notification.module),
                          }}
                        />
                      </Stack>
                    </Box>

                    <Stack spacing={0.25} sx={{ flexShrink: 0 }}>
                      {!notification.read && (
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification); }}
                          sx={{ p: 0.25 }}
                          aria-label="Mark as read"
                        >
                          <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleClear(notification); }}
                        sx={{ p: 0.25 }}
                        aria-label="Clear notification"
                      >
                        <Close sx={{ fontSize: 12, color: "text.disabled" }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

      </CardContent>
    </Card>
  );
}
