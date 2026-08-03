/**
 * ============================================================
 * Feldrix Control Centre — Farm Detail Drawer (Polished)
 * Sprint 48.1
 *
 * Improved hierarchy, skeleton loading, empty states,
 * grouped admin actions, subscription card.
 * ============================================================
 */

import { useState, useEffect } from "react";
import {
  Drawer, Box, Typography, Stack, Avatar, Chip, Divider,
  IconButton, LinearProgress, CircularProgress, Button, Skeleton,
  useMediaQuery, useTheme,
} from "@mui/material";
import { Close, Refresh, Block, CheckCircle, Replay } from "@mui/icons-material";
import { FxCard, FxStatusChip, FxEmptyState, semantic, typography as typo, radius } from "../../../shared/design";
import { formatDate, formatRelativeTime, formatNumber } from "../../utils/adminFormatters";
import { getFarmDetail, getFarmActivity, getFarmHealth } from "../../services/adminFarmService";
import { suspendUser, reactivateUser, restartOnboarding } from "../../services/adminUserService";
import { useAdminContext } from "../../context/AdminContext";

const DRAWER_WIDTH = 540;

// ─── Skeleton Loader ─────────────────────────────────────────

function DrawerSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: radius.lg }} />
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: radius.lg }} />
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: radius.lg }} />
        <Skeleton variant="rounded" height={100} sx={{ borderRadius: radius.lg }} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: radius.lg }} />
      </Stack>
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function FarmDetailDrawer({ open, farm, onClose, onUpdated }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { admin, permissions } = useAdminContext();

  const [detail, setDetail] = useState(null);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!open || !farm?.id) { setLoading(false); return; }
    setLoading(true);
    loadData();
  }, [open, farm?.id]);

  async function loadData() {
    if (!farm?.id) { setLoading(false); return; }
    try {
      const [d, a, h] = await Promise.all([
        getFarmDetail(farm.id),
        getFarmActivity(farm.id),
        getFarmHealth(farm.id),
      ]);
      setDetail(d);
      setActivity(a || []);
      setHealth(h);
    } catch { /* graceful */ }
    finally { setLoading(false); }
  }

  async function handleAction(actionFn) {
    if (!admin?.id || !farm?.id) return;
    setActionLoading(true);
    try {
      await actionFn(farm.id, admin.id);
      await loadData();
      if (onUpdated) onUpdated();
    } catch { /* silent */ }
    setActionLoading(false);
  }

  const profile = detail?.profile || farm || {};
  const counts = detail?.counts || {};
  const onboarding = profile.onboarding_state || {};
  const healthScore = health?.score || 0;
  const healthStatus = health?.status || "unknown";
  const healthColor = healthScore >= 75 ? semantic.success : healthScore >= 50 ? semantic.warning : semantic.error;

  if (!farm) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: isMobile ? "100%" : DRAWER_WIDTH, maxWidth: "100vw", bgcolor: semantic.surface, borderLeft: `1px solid ${semantic.border}` } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5, bgcolor: "#fff", borderBottom: `1px solid ${semantic.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 52, height: 52, bgcolor: "#16A34A", fontWeight: 700, fontSize: "1.2rem" }}>
              {(profile.farm_name || "F").charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: semantic.text, letterSpacing: "-0.01em" }}>
                {profile.farm_name || "Unknown Farm"}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary }}>
                {profile.full_name || "—"} · {profile.email || "—"}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ minWidth: 44, minHeight: 44 }} aria-label="Close"><Close /></IconButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <FxStatusChip status={profile.suspended ? "suspended" : "active"} />
          <FxStatusChip status={healthStatus} label={`${healthScore}% Health`} />
          <FxStatusChip status="starter" />
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <DrawerSkeleton />
      ) : (
        <Box sx={{ p: 2.5, pb: 4, overflow: "auto", flex: 1 }}>
          <Stack spacing={2.5}>

            {/* Admin Actions */}
            {permissions?.canManageUsers && (
              <FxCard sx={{ p: 2 }}>
                <Typography sx={{ ...typo.tiny, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}>Admin Actions</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {!profile.suspended ? (
                    <Button size="small" variant="outlined" color="error" startIcon={<Block sx={{ fontSize: 15 }} />} disabled={actionLoading} onClick={() => handleAction(suspendUser)} sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 2 }}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle sx={{ fontSize: 15 }} />} disabled={actionLoading} onClick={() => handleAction(reactivateUser)} sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 2 }}>
                      Reactivate
                    </Button>
                  )}
                  <Button size="small" variant="outlined" startIcon={<Replay sx={{ fontSize: 15 }} />} disabled={actionLoading} onClick={() => handleAction(restartOnboarding)} sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 2 }}>
                    Restart Onboarding
                  </Button>
                </Stack>
              </FxCard>
            )}

            {/* Farm Health */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 2 }}>💚 Farm Health</Typography>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography sx={{ fontSize: "2.2rem", fontWeight: 800, color: healthColor, lineHeight: 1 }}>{healthScore}%</Typography>
                <Typography sx={{ ...typo.caption, color: semantic.textSecondary, mt: 0.5 }}>
                  {healthScore >= 75 ? "Excellent" : healthScore >= 50 ? "Needs Attention" : "Critical"}
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={healthScore} sx={{ height: 8, borderRadius: 4, bgcolor: `${semantic.border}`, mb: 1.5, "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: healthColor } }} />
              <Typography sx={{ ...typo.caption, color: semantic.textTertiary }}>
                {healthScore >= 75 ? "Farm operating well across all modules." : healthScore >= 50 ? "Some modules need attention — encourage farmer to explore." : "Limited activity — this farm may need support outreach."}
              </Typography>
            </FxCard>

            {/* Farm Information */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>🏡 Farm Information</Typography>
              <InfoRow label="Farm Name" value={profile.farm_name || "—"} />
              <InfoRow label="Farm Type" value={profile.farm_type || "—"} />
              <InfoRow label="Owner" value={profile.full_name || "—"} />
              <InfoRow label="Email" value={profile.email || "—"} />
              <InfoRow label="Province" value={profile.province || "—"} />
              <InfoRow label="Country" value={profile.country || "—"} />
              <Divider sx={{ my: 1 }} />
              <InfoRow label="Registered" value={formatDate(profile.created_at)} />
              <InfoRow label="Last Login" value={formatRelativeTime(profile.last_login)} />
              <InfoRow label="Onboarding" value={onboarding.completed ? "Complete ✓" : "Incomplete"} />
            </FxCard>

            {/* Operations Summary */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>📊 Operations</Typography>
              <Stack spacing={0.5}>
                <OperationRow icon="🐄" label="Livestock" value={counts.livestock} />
                <OperationRow icon="🌾" label="Crops" value={counts.crops} />
                <OperationRow icon="📋" label="Planner Tasks" value={counts.tasks} />
                <OperationRow icon="💳" label="Finance Records" value={counts.finance} />
                <OperationRow icon="❤️" label="Health Records" value={counts.health} />
                <OperationRow icon="🚜" label="Machinery" value={counts.machinery} />
              </Stack>
            </FxCard>

            {/* AI Summary */}
            <FxCard sx={{ position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>🧠 AI Farm Summary</Typography>
              <Stack spacing={0.75}>
                <SummaryLine ok={counts.livestock > 0} text={counts.livestock > 0 ? `${counts.livestock} livestock records managed.` : "No livestock recorded yet."} />
                <SummaryLine ok={counts.crops > 0} text={counts.crops > 0 ? `${counts.crops} crop records active.` : "No crops recorded yet."} />
                <SummaryLine ok={counts.tasks > 0} text={counts.tasks > 0 ? `Planner actively used (${counts.tasks} tasks).` : "Planner not yet used."} />
                <SummaryLine ok={counts.finance > 0} text={counts.finance > 0 ? `Finance module active (${counts.finance} entries).` : "No finance records."} />
                <SummaryLine ok={onboarding.completed} text={onboarding.completed ? "Onboarding complete." : "Onboarding incomplete."} />
              </Stack>
            </FxCard>

            {/* Activity Timeline */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>📅 Recent Activity</Typography>
              {activity.length === 0 ? (
                <FxEmptyState icon="📭" title="No activity" description="No events recorded for this farm yet." sx={{ p: 3, border: "none" }} />
              ) : (
                <Stack spacing={1.5}>
                  {activity.slice(0, 8).map((event) => (
                    <Box key={event.id} sx={{ display: "flex", gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: semantic.info, mt: 0.7, flexShrink: 0 }} />
                      <Box>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{event.title || "Event"}</Typography>
                        {event.description && <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary }}>{event.description}</Typography>}
                        <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary, mt: 0.25 }}>{formatRelativeTime(event.created_at)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </FxCard>

          </Stack>
        </Box>
      )}
    </Drawer>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
      <Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: semantic.text }}>{value ?? "—"}</Typography>
    </Stack>
  );
}

function OperationRow({ icon, label, value }) {
  const count = value || 0;
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75, px: 1, borderRadius: 1.5, "&:hover": { bgcolor: semantic.surface } }}>
      <Typography sx={{ fontSize: "0.9rem", width: 24, textAlign: "center" }}>{icon}</Typography>
      <Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary, flex: 1 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: count > 0 ? semantic.text : semantic.textTertiary }}>{formatNumber(count)}</Typography>
    </Stack>
  );
}

function SummaryLine({ ok, text }) {
  return (
    <Typography sx={{ fontSize: "0.78rem", color: semantic.textSecondary }}>
      <Box component="span" sx={{ color: ok ? semantic.success : semantic.warning, mr: 0.75 }}>{ok ? "✓" : "⚠"}</Box>
      {text}
    </Typography>
  );
}
