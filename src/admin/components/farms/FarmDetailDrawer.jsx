/**
 * ============================================================
 * Feldrix Control Centre — Farm Detail Drawer (Enterprise)
 * Sprint 48.0
 *
 * Full detail view: info, subscription, operations, health,
 * timeline, AI summary, admin actions.
 * ============================================================
 */

import { useState, useEffect } from "react";
import {
  Drawer, Box, Typography, Stack, Avatar, Chip, Divider,
  IconButton, LinearProgress, CircularProgress, Button,
  useMediaQuery, useTheme,
} from "@mui/material";
import { Close, Refresh, Block, Notifications, OpenInNew } from "@mui/icons-material";
import { FxCard, FxStatusChip, semantic, typography as typo, radius, sizes } from "../../../shared/design";
import { formatDate, formatRelativeTime, formatNumber } from "../../utils/adminFormatters";
import { getFarmDetail, getFarmActivity, getFarmHealth } from "../../services/adminFarmService";
import { suspendUser, reactivateUser, restartOnboarding } from "../../services/adminUserService";
import { useAdminContext } from "../../context/AdminContext";

const DRAWER_WIDTH = 540;

export default function FarmDetailDrawer({ open, farm, onClose, onUpdated }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { admin, permissions } = useAdminContext();

  const [detail, setDetail] = useState(null);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const profile = detail?.profile || farm || {};
  const counts = detail?.counts || {};
  const onboarding = profile.onboarding_state || {};
  const healthScore = health?.score || 0;
  const healthStatus = health?.status || "unknown";

  if (!farm) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: isMobile ? "100%" : DRAWER_WIDTH, maxWidth: "100vw", bgcolor: semantic.surface, borderLeft: `1px solid ${semantic.border}` } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: "#fff", borderBottom: `1px solid ${semantic.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 48, height: 48, bgcolor: "#16A34A", fontWeight: 700, fontSize: "1.1rem" }}>
              {(profile.farm_name || "F").charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ ...typo.cardTitle, fontSize: "1.1rem", color: semantic.text }}>{profile.farm_name || "Unknown Farm"}</Typography>
              <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{profile.full_name || "—"} · {profile.email || "—"}</Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ minWidth: 44, minHeight: 44 }} aria-label="Close"><Close /></IconButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <FxStatusChip status={profile.suspended ? "suspended" : "active"} />
          <FxStatusChip status={healthStatus} label={`Health ${healthScore}%`} />
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} color="primary" /></Box>
      ) : (
        <Box sx={{ p: 2.5, pb: 4, overflow: "auto", flex: 1 }}>
          <Stack spacing={2.5}>

            {/* Admin Actions */}
            {permissions?.canManageUsers && (
              <FxCard sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {!profile.suspended ? (
                    <Button size="small" startIcon={<Block sx={{ fontSize: 16 }} />} color="error" onClick={async () => { await suspendUser(farm.id, admin.id); loadData(); if (onUpdated) onUpdated(); }} sx={{ textTransform: "none", fontSize: "0.78rem" }}>Suspend</Button>
                  ) : (
                    <Button size="small" color="success" onClick={async () => { await reactivateUser(farm.id, admin.id); loadData(); if (onUpdated) onUpdated(); }} sx={{ textTransform: "none", fontSize: "0.78rem" }}>Reactivate</Button>
                  )}
                  <Button size="small" startIcon={<Refresh sx={{ fontSize: 16 }} />} onClick={async () => { await restartOnboarding(farm.id, admin.id); loadData(); }} sx={{ textTransform: "none", fontSize: "0.78rem" }}>Restart Onboarding</Button>
                </Stack>
              </FxCard>
            )}

            {/* Farm Information */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>🏡 Farm Information</Typography>
              <InfoRow label="Farm Name" value={profile.farm_name || "—"} />
              <InfoRow label="Farm Type" value={profile.farm_type || "—"} />
              <InfoRow label="Owner" value={profile.full_name || "—"} />
              <InfoRow label="Email" value={profile.email || "—"} />
              <InfoRow label="Province" value={profile.province || "—"} />
              <InfoRow label="Country" value={profile.country || "—"} />
              <InfoRow label="Registered" value={formatDate(profile.created_at)} />
              <InfoRow label="Last Login" value={formatRelativeTime(profile.last_login)} />
            </FxCard>

            {/* Operations */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>📊 Operations</Typography>
              <InfoRow label="Livestock" value={formatNumber(counts.livestock)} />
              <InfoRow label="Crops" value={formatNumber(counts.crops)} />
              <InfoRow label="Planner Tasks" value={formatNumber(counts.tasks)} />
              <InfoRow label="Finance Records" value={formatNumber(counts.finance)} />
              <InfoRow label="Health Records" value={formatNumber(counts.health)} />
              <InfoRow label="Machinery" value={formatNumber(counts.machinery)} />
            </FxCard>

            {/* Farm Health */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>💚 Farm Health</Typography>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>Health Score</Typography>
                <Typography sx={{ ...typo.caption, fontWeight: 700, color: healthScore >= 75 ? semantic.success : healthScore >= 50 ? semantic.warning : semantic.error }}>{healthScore}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={healthScore} sx={{ height: 6, borderRadius: 3, bgcolor: `${semantic.border}`, "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: healthScore >= 75 ? semantic.success : healthScore >= 50 ? semantic.warning : semantic.error } }} />
              <Typography sx={{ ...typo.caption, color: semantic.textTertiary, mt: 1 }}>
                {healthScore >= 75 ? "Farm is operating well across all modules." : healthScore >= 50 ? "Some modules need attention." : "Farm has limited data — encourage farmer to explore more modules."}
              </Typography>
            </FxCard>

            {/* AI Summary */}
            <FxCard sx={{ position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1 }}>🧠 AI Farm Summary</Typography>
              <Stack spacing={0.5}>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {counts.livestock > 0 ? `✓ ${counts.livestock} livestock records managed.` : "⚠ No livestock recorded yet."}
                </Typography>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {counts.crops > 0 ? `✓ ${counts.crops} crop records active.` : "⚠ No crops recorded yet."}
                </Typography>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {counts.tasks > 0 ? `✓ Planner actively used (${counts.tasks} tasks).` : "⚠ Planner not yet used."}
                </Typography>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {counts.finance > 0 ? `✓ Finance module active (${counts.finance} entries).` : "⚠ No finance records."}
                </Typography>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {onboarding.completed ? "✓ Onboarding complete." : "⚠ Onboarding incomplete."}
                </Typography>
              </Stack>
            </FxCard>

            {/* Activity Timeline */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>📅 Activity Timeline</Typography>
              {activity.length === 0 ? (
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary, fontStyle: "italic" }}>No activity recorded yet.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {activity.slice(0, 10).map((event) => (
                    <Box key={event.id} sx={{ display: "flex", gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: semantic.info, mt: 0.7, flexShrink: 0 }} />
                      <Box>
                        <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{event.title || "Event"}</Typography>
                        {event.description && <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{event.description}</Typography>}
                        <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, mt: 0.25 }}>{formatRelativeTime(event.created_at)}</Typography>
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

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
      <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ ...typo.caption, fontWeight: 600, color: semantic.text }}>{value ?? "—"}</Typography>
    </Stack>
  );
}
