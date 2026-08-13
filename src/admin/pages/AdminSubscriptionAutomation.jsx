/**
 * Feldrix Sprint 49 — Subscription Automation Admin Page
 * Location: Admin Portal → Subscription Automation
 *
 * Sections:
 *   1. System Health — Renewal Engine status
 *   2. Actions — Simulate / Run Now / Retry Failed
 *   3. Pending Queue — Subscriptions due for processing
 *   4. Processing History — Audit log of all renewal actions
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
import { Refresh, CheckCircle, Error as ErrorIcon, PlayArrow, Science, Replay } from "@mui/icons-material";
import { semantic, typography as typo, radius } from "../../shared/design";

import {
  runRenewalNow,
  simulateRenewal,
  retryFailedRenewals,
  checkRenewalHealth,
  getRenewalHistory,
  getPendingRenewals,
  getRenewalStats,
} from "../services/adminRenewalService";

export default function AdminSubscriptionAutomation() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState({ total: 0, today: 0, succeeded: 0, failed: 0 });
  const [pending, setPending] = useState({ count: 0, items: [] });
  const [history, setHistory] = useState([]);
  const [actionResult, setActionResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const safetyTimer = setTimeout(() => setLoading(false), 10000);

    try { setHealth(await checkRenewalHealth()); } catch {}
    try { setStats(await getRenewalStats()); } catch {}
    try { setPending(await getPendingRenewals()); } catch {}
    try { setHistory(await getRenewalHistory(30)); } catch {}

    clearTimeout(safetyTimer);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAction = useCallback(async (actionFn, label) => {
    setActionLoading(true);
    setActionResult(null);
    try {
      const result = await actionFn();
      setActionResult({ ...result, label });
    } catch (err) {
      setActionResult({ success: false, message: err.message, label });
    }
    setActionLoading(false);
    setTimeout(() => loadAll(), 2000);
  }, [loadAll]);

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
      {/* HEADER */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Subscription Automation</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary }}>
            Automatic renewal processing for expired subscriptions.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={loadAll} size="small"><Refresh sx={{ fontSize: 20 }} /></IconButton></Tooltip>
      </Stack>

      {/* ACTION RESULT */}
      {actionResult && (
        <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: actionResult.success ? "success.light" : "error.light", bgcolor: actionResult.success ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)" }}>
          <CardContent sx={{ py: 1.5, px: 2.5, "&:last-child": { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {actionResult.success ? <CheckCircle sx={{ color: "success.main", fontSize: 18 }} /> : <ErrorIcon sx={{ color: "error.main", fontSize: 18 }} />}
              <Typography variant="body2" fontWeight={600} color={actionResult.success ? "success.main" : "error.main"}>
                {actionResult.label}: {actionResult.message || (actionResult.success ? "Complete" : "Failed")}
              </Typography>
              {actionResult.processed != null && (
                <Chip label={`${actionResult.processed} processed`} size="small" sx={{ fontWeight: 600, fontSize: "0.65rem" }} />
              )}
            </Stack>
            {/* Simulation results */}
            {actionResult.results && actionResult.mode === "simulate" && (
              <Box sx={{ mt: 1.5 }}>
                {actionResult.results.map((r, i) => (
                  <Box key={i} sx={{ p: 1.5, mt: 1, borderRadius: 1.5, bgcolor: "rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="body2" fontWeight={700}>{r.name} ({r.email})</Typography>
                    <Typography variant="caption" color="text.secondary">Plan: {r.currentPlan} • Renewal: {r.renewalDate}</Typography>
                    <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                      {r.actions.map((a, j) => <Typography key={j} variant="caption" color="text.secondary">• {a}</Typography>)}
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* STATUS + ACTIONS */}
      <Grid container spacing={2.5}>
        {/* System Health */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Renewal Engine</Typography>
              <Stack spacing={1.5}>
                <StatusRow label="Status" value={health?.online ? "ONLINE" : "OFFLINE"} status={health?.online ? "success" : "error"} />
                <StatusRow label="Response" value={health?.responseTime ? `${health.responseTime}ms` : "—"} />
                <StatusRow label="Next Run" value="07:05 SAST (daily)" />
                <Divider />
                <StatusRow label="Total Processed" value={String(stats.total)} />
                <StatusRow label="Processed Today" value={String(stats.today)} />
                <StatusRow label="Succeeded" value={String(stats.succeeded)} status="success" />
                <StatusRow label="Failed" value={String(stats.failed)} status={stats.failed > 0 ? "error" : undefined} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Actions</Typography>
              <Stack spacing={1.5}>
                <Button
                  fullWidth variant="outlined" color="info" startIcon={<Science />}
                  onClick={() => handleAction(simulateRenewal, "Simulate")}
                  disabled={actionLoading}
                  sx={{ textTransform: "none", fontWeight: 600, justifyContent: "flex-start" }}
                >
                  Simulate Renewal
                </Button>
                <Button
                  fullWidth variant="contained" color="primary" startIcon={<PlayArrow />}
                  onClick={() => handleAction(runRenewalNow, "Run Now")}
                  disabled={actionLoading}
                  sx={{ textTransform: "none", fontWeight: 600, justifyContent: "flex-start" }}
                >
                  Run Renewal Now
                </Button>
                <Button
                  fullWidth variant="outlined" color="warning" startIcon={<Replay />}
                  onClick={() => handleAction(retryFailedRenewals, "Retry Failed")}
                  disabled={actionLoading}
                  sx={{ textTransform: "none", fontWeight: 600, justifyContent: "flex-start" }}
                >
                  Retry Failed Renewals
                </Button>
              </Stack>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: "block" }}>
                Simulate runs a dry run without making changes. Run Now processes all due subscriptions immediately.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Queue */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: pending.count > 0 ? "warning.light" : "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Pending Queue</Typography>
                <Chip label={`${pending.count} due`} size="small" color={pending.count > 0 ? "warning" : "default"} sx={{ fontWeight: 700 }} />
              </Stack>
              {pending.count === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  No subscriptions currently due for processing.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {pending.items.slice(0, 5).map((item) => (
                    <Box key={item.id} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "rgba(234,179,8,0.04)", border: "1px solid rgba(234,179,8,0.2)" }}>
                      <Typography variant="caption" fontWeight={600}>{item.plan} • Renewal: {item.renewal_date}</Typography>
                    </Box>
                  ))}
                  {pending.count > 5 && <Typography variant="caption" color="text.disabled">+{pending.count - 5} more</Typography>}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PROCESSING HISTORY */}
      <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Processing History</Typography>
          {history.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              No renewal processing history yet. Use "Simulate Renewal" to test.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Outcome</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Old Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>New Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell sx={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                        {new Date(entry.created_at).toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.details?.outcome || "—"}
                          size="small"
                          color={entry.details?.outcome === "SUCCESS" ? "success" : "error"}
                          sx={{ fontSize: "0.6rem", height: 20, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.72rem" }}>{entry.details?.old_plan || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.72rem" }}>{entry.details?.new_plan || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.72rem" }}>{entry.details?.email_sent ? "✓ Sent" : "✗ Failed"}</TableCell>
                      <TableCell sx={{ fontSize: "0.72rem" }}>{entry.details?.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

function StatusRow({ label, value, status }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.78rem" }}>{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {status === "success" && <CheckCircle sx={{ fontSize: 14, color: "success.main" }} />}
        {status === "error" && <ErrorIcon sx={{ fontSize: 14, color: "error.main" }} />}
        <Typography variant="body2" fontWeight={600} color={status === "error" ? "error.main" : status === "success" ? "success.main" : "text.primary"} sx={{ fontSize: "0.78rem" }}>
          {value}
        </Typography>
      </Stack>
    </Stack>
  );
}
