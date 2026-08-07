/**
 * ============================================================
 * Feldrix — Sync Queue Panel
 * Version 1.0
 *
 * Displays pending offline records and sync status.
 * Provides manual "Sync Now" button.
 * ============================================================
 */

import { useState, useEffect } from "react";
import {
  Box, Typography, Stack, Card, CardContent, Divider,
  Button, Chip, Paper, CircularProgress,
} from "@mui/material";
import { Sync, CloudDone, CloudOff, Schedule, CheckCircle, Error } from "@mui/icons-material";
import { useConnection } from "../../context/ConnectionContext";
import { getPendingQueue } from "../../services/offline/offlineDb";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "warning", icon: <Schedule sx={{ fontSize: 12 }} /> },
  synced: { label: "Synced", color: "success", icon: <CheckCircle sx={{ fontSize: 12 }} /> },
  failed: { label: "Failed", color: "error", icon: <Error sx={{ fontSize: 12 }} /> },
  max_retries: { label: "Max Retries", color: "error", icon: <Error sx={{ fontSize: 12 }} /> },
};

export default function SyncQueue() {
  const { isOnline, isSyncing, pendingCount, triggerSync } = useConnection();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadQueue() {
    try {
      const items = await getPendingQueue();
      setQueue(items);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          {isOnline ? <CloudDone color="success" sx={{ fontSize: 28 }} /> : <CloudOff color="error" sx={{ fontSize: 28 }} />}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>Sync Queue</Typography>
            <Typography variant="body2" color="text.secondary">
              {isOnline ? "Connected — all data synchronized." : "Offline — changes saved locally."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={isSyncing ? <CircularProgress size={14} color="inherit" /> : <Sync />}
            onClick={triggerSync}
            disabled={!isOnline || isSyncing || pendingCount === 0}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={`${pendingCount} Pending`} size="small" color={pendingCount > 0 ? "warning" : "default"} sx={{ fontWeight: 600 }} />
          <Chip label={isOnline ? "Online" : "Offline"} size="small" color={isOnline ? "success" : "error"} sx={{ fontWeight: 600 }} />
        </Stack>

        {/* Queue Items */}
        {loading ? (
          <Box sx={{ textAlign: "center", py: 3 }}><CircularProgress size={24} /></Box>
        ) : queue.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircle sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>All synced</Typography>
            <Typography variant="caption" color="text.secondary">No pending records.</Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {queue.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={item.module} size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 600 }} />
                      <Typography variant="caption" fontWeight={600}>{item.action}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {item.retryCount > 0 && (
                        <Typography variant="caption" color="text.disabled">Retry {item.retryCount}</Typography>
                      )}
                      <Chip
                        label={statusCfg.label}
                        size="small"
                        color={statusCfg.color}
                        sx={{ height: 18, fontSize: "0.55rem", fontWeight: 600 }}
                      />
                    </Stack>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {formatTime(item.createdAt)} &middot; {item.table}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
