/**
 * Feldrix v1.2.1 — Admin Weather Testing Page
 * Location: Admin Portal → System Tools → Weather Testing
 *
 * Provides administrators with tools to test the Weather Push Notification
 * Platform without needing to open the Supabase Dashboard.
 *
 * Sections:
 *   1. Test Push Buttons — Send test notifications for each alert type
 *   2. Device Registration Status — Permission, subscription, SW, devices
 *   3. VAPID Configuration — Verify keys are set
 *   4. Edge Function Health — Online/offline status with timing
 *   5. Push Notification Log — Full history table (newest first)
 */

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Refresh, CheckCircle, Error as ErrorIcon, Warning } from "@mui/icons-material";
import { semantic, typography as typo, radius, transitions } from "../../shared/design";

import {
  sendTestNotification,
  triggerEdgeFunctionTest,
  getDeviceStatus,
  getVapidStatus,
  checkEdgeFunctionHealth,
  getAdminNotificationLog,
  getNotificationStats,
  getTestAlertTypes,
} from "../services/pushTestService";

import {
  isPushSupported,
  getPermissionStatus,
} from "../../services/pushNotificationService";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminWeatherTesting() {
  const [loading, setLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [vapidStatus, setVapidStatus] = useState(null);
  const [edgeHealth, setEdgeHealth] = useState(null);
  const [notifLog, setNotifLog] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, opened: 0, dismissed: 0 });
  const [testResult, setTestResult] = useState(null);
  const [edgeLoading, setEdgeLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);

    // Safety timeout — ALWAYS exit loading state after 10 seconds max
    const safetyTimer = setTimeout(() => setLoading(false), 10000);

    // Load each section independently — one failure must NOT block the entire page
    let device = null;
    let vapid = null;
    let log = [];
    let statData = { total: 0, sent: 0, opened: 0, dismissed: 0 };

    try { device = await getDeviceStatus(); } catch (err) { console.warn("[AdminWeatherTesting] Device status failed:", err); }
    try { vapid = getVapidStatus(); } catch (err) { console.warn("[AdminWeatherTesting] VAPID status failed:", err); }
    try { log = await getAdminNotificationLog(50); } catch (err) { console.warn("[AdminWeatherTesting] Log fetch failed:", err); }
    try { statData = await getNotificationStats(); } catch (err) { console.warn("[AdminWeatherTesting] Stats fetch failed:", err); }

    clearTimeout(safetyTimer);

    setDeviceStatus(device || {
      pushSupported: isPushSupported(),
      permissionStatus: getPermissionStatus(),
      subscriptionActive: false,
      deviceName: "Unknown",
      browser: "Unknown",
      platform: "Unknown",
      serviceWorkerActive: false,
      lastPush: null,
      subscriptionCount: 0,
      registeredDevices: [],
    });
    setVapidStatus(vapid || { configured: false, publicKeyPresent: false, publicKeyPreview: "NOT SET", message: "Could not determine VAPID status." });
    setNotifLog(log);
    setStats(statData);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCheckEdge = useCallback(async () => {
    setEdgeLoading(true);
    const result = await checkEdgeFunctionHealth();
    setEdgeHealth(result);
    setEdgeLoading(false);
  }, []);

  const handleSendTest = useCallback(async (alertType) => {
    setEdgeLoading(true);
    try {
      // Use PRODUCTION pipeline — invokes Edge Function with real Web Push protocol
      const result = await triggerEdgeFunctionTest(alertType);
      setTestResult(result);
    } catch {
      // Fallback to local notification if Edge Function unavailable
      const farmName = "Test Farm";
      const result = sendTestNotification(alertType, farmName);
      setTestResult({ ...result, message: result.message + " (local fallback — Edge Function unavailable)" });
    }
    setEdgeLoading(false);
    setTimeout(() => setTestResult(null), 8000);
    setTimeout(() => getAdminNotificationLog(50).then(setNotifLog), 2000);
  }, []);

  const handleTriggerEdge = useCallback(async () => {
    setEdgeLoading(true);
    const result = await triggerEdgeFunctionTest();
    setTestResult(result);
    setEdgeLoading(false);
    setTimeout(() => setTestResult(null), 8000);
    setTimeout(() => getAdminNotificationLog(50).then(setNotifLog), 3000);
  }, []);

  if (loading) {
    return (
      <Stack spacing={4}>
        <Skeleton variant="rounded" height={60} />
        <Skeleton variant="rounded" height={200} />
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Weather Testing</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary }}>
            Test push notifications and monitor the Weather Push Notification Platform.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Refresh all status">
            <IconButton onClick={loadAll} size="small">
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ─── TEST RESULT BANNER ─────────────────────────────────────── */}
      {testResult && (
        <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: testResult.success ? "success.light" : "error.light", bgcolor: testResult.success ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)" }}>
          <CardContent sx={{ py: 1.5, px: 2.5, "&:last-child": { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {testResult.success ? <CheckCircle sx={{ color: "success.main", fontSize: 18 }} /> : <ErrorIcon sx={{ color: "error.main", fontSize: 18 }} />}
              <Typography variant="body2" fontWeight={600} color={testResult.success ? "success.main" : "error.main"}>
                {testResult.message}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ─── TEST PUSH BUTTONS ──────────────────────────────────────── */}
      <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Send Test Notification</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Send a push notification using the PRODUCTION Web Push pipeline. Uses VAPID JWT signing + AES-128-GCM encryption via the Edge Function. Works even when the app is closed.
          </Typography>
          <Grid container spacing={1.5}>
            {getTestAlertTypes().map((alert) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={alert.id}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSendTest(alert.id)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    borderRadius: 2,
                    py: 1.5,
                    borderColor: `${alert.color}40`,
                    color: alert.color,
                    "&:hover": { bgcolor: `${alert.color}08`, borderColor: alert.color },
                  }}
                >
                  {alert.icon} {alert.label.replace("Send ", "")}
                </Button>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 2.5 }} />
          <Button
            variant="contained"
            color="primary"
            onClick={handleTriggerEdge}
            disabled={edgeLoading}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {edgeLoading ? "Invoking..." : "Trigger Edge Function (Server Push)"}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Invokes the weather-push Edge Function to test server-side notification dispatch.
          </Typography>
        </CardContent>
      </Card>

      {/* ─── STATUS GRID ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        {/* DEVICE REGISTRATION */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Device Registration Status</Typography>
              <Stack spacing={1.5}>
                <StatusRow label="Push Supported" value={deviceStatus?.pushSupported ? "Yes" : "No"} status={deviceStatus?.pushSupported ? "success" : "error"} />
                <StatusRow label="Notification Permission" value={capitalize(deviceStatus?.permissionStatus || "Unknown")} status={deviceStatus?.permissionStatus === "granted" ? "success" : deviceStatus?.permissionStatus === "denied" ? "error" : "warning"} />
                <StatusRow label="Subscription Active" value={deviceStatus?.subscriptionActive ? "Registered" : "Not Registered"} status={deviceStatus?.subscriptionActive ? "success" : "warning"} />
                <StatusRow label="Service Worker" value={deviceStatus?.serviceWorkerActive ? "Active" : "Inactive"} status={deviceStatus?.serviceWorkerActive ? "success" : "warning"} />
                <StatusRow label="Device" value={deviceStatus?.deviceName || "—"} />
                <StatusRow label="Browser" value={deviceStatus?.browser || "—"} />
                <StatusRow label="Platform" value={deviceStatus?.platform || "—"} />
                <StatusRow label="Registered Devices" value={String(deviceStatus?.subscriptionCount || 0)} />
                {deviceStatus?.lastPush && (
                  <StatusRow label="Last Successful Push" value={new Date(deviceStatus.lastPush.sent_at).toLocaleString("en-ZA")} />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* VAPID + EDGE FUNCTION */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2.5} sx={{ height: "100%" }}>
            {/* VAPID STATUS */}
            <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: vapidStatus?.configured ? "divider" : "error.light", bgcolor: vapidStatus?.configured ? "background.paper" : "rgba(239,68,68,0.03)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>VAPID Configuration</Typography>
                <StatusRow label="Status" value={vapidStatus?.configured ? "Configured" : "NOT CONFIGURED"} status={vapidStatus?.configured ? "success" : "error"} />
                <StatusRow label="Public Key" value={vapidStatus?.publicKeyPreview || "—"} />
                {!vapidStatus?.configured && (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <Typography variant="caption" color="error.main" fontWeight={600}>
                      ⚠️ {vapidStatus?.message}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* EDGE FUNCTION HEALTH */}
            <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Weather Push Service</Typography>
                  <Button size="small" onClick={handleCheckEdge} disabled={edgeLoading} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.72rem" }}>
                    {edgeLoading ? "Checking..." : "Check Health"}
                  </Button>
                </Stack>
                {edgeHealth ? (
                  <Stack spacing={1.5}>
                    <StatusRow label="Status" value={edgeHealth.online ? "Online" : "Offline"} status={edgeHealth.online ? "success" : "error"} />
                    {edgeHealth.responseTime && <StatusRow label="Response Time" value={`${edgeHealth.responseTime}ms`} />}
                    {edgeHealth.lastRun && <StatusRow label="Last Run" value={new Date(edgeHealth.lastRun).toLocaleString("en-ZA")} />}
                    {!edgeHealth.online && (
                      <Box sx={{ mt: 1, p: 1.5, borderRadius: 1.5, bgcolor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Typography variant="caption" color="error.main">{edgeHealth.message}</Typography>
                      </Box>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Click "Check Health" to verify the Edge Function.</Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* ─── NOTIFICATION STATS ─────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Total Sent" value={stats.total} color="#3B82F6" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Delivered" value={stats.sent} color="#22C55E" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Opened" value={stats.opened} color="#8B5CF6" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Dismissed" value={stats.dismissed} color="#6B7280" />
        </Grid>
      </Grid>

      {/* ─── PUSH NOTIFICATION LOG ──────────────────────────────────── */}
      <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Weather Push Log</Typography>
            <Chip label={`${notifLog.length} entries`} size="small" sx={{ fontWeight: 600, fontSize: "0.65rem" }} />
          </Stack>

          {notifLog.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              No notifications sent yet. Use the test buttons above to send your first notification.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 420, overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Event</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Title</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifLog.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell sx={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                        {entry.sent_at ? new Date(entry.sent_at).toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.alert_type || "—"}
                          size="small"
                          sx={{ fontSize: "0.6rem", height: 20, fontWeight: 700, textTransform: "uppercase" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.priority || "—"}
                          size="small"
                          color={entry.priority === "Critical" ? "error" : entry.priority === "High" ? "warning" : "default"}
                          variant="outlined"
                          sx={{ fontSize: "0.6rem", height: 20, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status || "—"}
                          size="small"
                          color={entry.status === "opened" ? "success" : entry.status === "dismissed" ? "default" : "info"}
                          sx={{ fontSize: "0.6rem", height: 20, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.72rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.title || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ─── WATCH TESTING NOTE ─────────────────────────────────────── */}
      <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider", bgcolor: "rgba(0,0,0,0.01)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Smart Watch Testing</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            No dedicated smartwatch app is required. Notifications delivered to the phone automatically appear on paired:
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
            <Chip label="⌚ Wear OS" size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />
            <Chip label="⌚ Apple Watch" size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
            Ensure "Mirror phone notifications" is enabled in your watch companion app settings.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatusRow({ label, value, status }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.78rem" }}>{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {status === "success" && <CheckCircle sx={{ fontSize: 14, color: "success.main" }} />}
        {status === "error" && <ErrorIcon sx={{ fontSize: 14, color: "error.main" }} />}
        {status === "warning" && <Warning sx={{ fontSize: 14, color: "warning.main" }} />}
        <Typography variant="body2" fontWeight={600} color={status === "error" ? "error.main" : status === "success" ? "success.main" : "text.primary"} sx={{ fontSize: "0.78rem" }}>
          {value}
        </Typography>
      </Stack>
    </Stack>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
      <CardContent sx={{ py: 2, px: 1.5 }}>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.5, display: "block" }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
