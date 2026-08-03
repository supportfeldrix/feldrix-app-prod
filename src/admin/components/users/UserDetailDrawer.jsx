/**
 * ============================================================
 * Feldrix Control Centre — User Detail Drawer (Enterprise)
 * Sprint 47.0 — Bug fix: null-safe throughout
 *
 * Full-screen on mobile, right-side panel on desktop.
 * Profile, farm, subscription, onboarding, timeline, notes.
 * ============================================================
 */

import { useState, useEffect } from "react";
import {
  Box, Drawer, Typography, Stack, Avatar, Chip, Divider,
  IconButton, LinearProgress, TextField, Button, CircularProgress,
  useMediaQuery, useTheme,
} from "@mui/material";
import { Close, Send } from "@mui/icons-material";
import { ADMIN_THEME, ROLE_LABELS } from "../../utils/adminConstants";
import { formatDate, formatRelativeTime, formatNumber } from "../../utils/adminFormatters";
import { getUserDetail, getUserTimeline, getUserNotes, addUserNote } from "../../services/adminUserService";
import { useAdminContext } from "../../context/AdminContext";
import UserActions from "./UserActions";

const DRAWER_WIDTH = 520;

export default function UserDetailDrawer({ open, user, onClose, onUserUpdated }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { admin, permissions } = useAdminContext();

  const [detail, setDetail] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!open || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadData();
  }, [open, user?.id]);

  async function loadData() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const [d, t, n] = await Promise.all([
        getUserDetail(user.id).catch(() => null),
        getUserTimeline(user.id).catch(() => []),
        getUserNotes(user.id).catch(() => []),
      ]);
      setDetail(d);
      setTimeline(t || []);
      setNotes(n || []);
    } catch {
      // Graceful — show what we have from the user prop
      setDetail(null);
      setTimeline([]);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim() || !admin?.id || !user?.id) return;
    setAddingNote(true);
    try {
      const note = await addUserNote(user.id, admin.id, newNote.trim());
      if (note) setNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch { /* silent */ }
    setAddingNote(false);
  }

  // Null-safe profile resolution
  const profile = detail?.profile || user || {};
  const counts = detail?.counts || {};
  const onboarding = profile.onboarding_state || {};
  const onboardingProgress = onboarding.completed ? 100 : 0;

  // Don't render drawer content if no user
  if (!user) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No user selected.</Typography>
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? "100%" : DRAWER_WIDTH,
          maxWidth: "100vw",
          bgcolor: "#F8FAFC",
          borderLeft: `1px solid ${ADMIN_THEME.cardBorder}`,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: "#fff", borderBottom: `1px solid ${ADMIN_THEME.cardBorder}`, position: "sticky", top: 0, zIndex: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 48, height: 48, bgcolor: ADMIN_THEME.primary, fontWeight: 700, fontSize: "1.1rem" }}>
              {(profile.full_name || profile.email || "?").charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: ADMIN_THEME.text }}>
                {profile.full_name || "Unknown User"}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: ADMIN_THEME.textSecondary }}>
                {profile.email || "—"}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ minWidth: 44, minHeight: 44 }} aria-label="Close drawer">
            <Close />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip label={profile.suspended ? "Suspended" : "Active"} size="small" sx={{ bgcolor: profile.suspended ? "#FEE2E2" : "#DCFCE7", color: profile.suspended ? "#991B1B" : "#166534", fontWeight: 600, fontSize: "0.68rem" }} />
          <Chip label={ROLE_LABELS[profile.role] || "Farmer"} size="small" sx={{ bgcolor: `${ADMIN_THEME.primary}12`, color: ADMIN_THEME.primary, fontWeight: 600, fontSize: "0.68rem" }} />
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} sx={{ color: ADMIN_THEME.primary }} /></Box>
      ) : (
        <Box sx={{ p: 2.5, pb: 4, overflow: "auto", flex: 1 }}>
          <Stack spacing={2.5}>
            {/* Actions */}
            <UserActions user={profile} onUpdated={() => { loadData(); if (onUserUpdated) onUserUpdated(); }} />

            {/* Profile Card */}
            <Card title="Profile">
              <InfoRow label="Phone" value={profile.phone || "—"} />
              <InfoRow label="Country" value={profile.country || "—"} />
              <InfoRow label="Province" value={profile.province || "—"} />
              <InfoRow label="Joined" value={formatDate(profile.created_at)} />
              <InfoRow label="Last Login" value={formatRelativeTime(profile.last_login)} />
            </Card>

            {/* Farm Summary */}
            <Card title="🚜 Farm Summary">
              <InfoRow label="Farm Name" value={profile.farm_name || "No Farm"} />
              <InfoRow label="Farm Type" value={profile.farm_type || "—"} />
              <InfoRow label="Location" value={[profile.province, profile.country].filter(Boolean).join(", ") || "—"} />
              <Divider sx={{ my: 1 }} />
              <InfoRow label="Livestock" value={formatNumber(counts.livestock)} />
              <InfoRow label="Crops" value={formatNumber(counts.crops)} />
              <InfoRow label="Planner Tasks" value={formatNumber(counts.tasks)} />
              <InfoRow label="Finance Records" value={formatNumber(counts.finance)} />
            </Card>

            {/* Onboarding */}
            <Card title="🎯 Onboarding">
              <Box sx={{ mb: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: "0.75rem", color: ADMIN_THEME.textSecondary }}>Progress</Typography>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.primary }}>{onboardingProgress}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={onboardingProgress} sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(59,130,246,0.08)", "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: ADMIN_THEME.primary } }} />
              </Box>
              <InfoRow label="Status" value={onboarding.completed ? "Complete" : onboarding.dismissed ? "Dismissed" : "In Progress"} />
              <InfoRow label="Dashboard Visited" value={onboarding.dashboard_visited ? "Yes" : "No"} />
            </Card>

            {/* Timeline */}
            <Card title="📅 Timeline">
              {timeline.length === 0 ? (
                <Typography sx={{ fontSize: "0.78rem", color: ADMIN_THEME.textSecondary, fontStyle: "italic" }}>No events recorded yet.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {timeline.slice(0, 10).map((event) => (
                    <Box key={event.id} sx={{ display: "flex", gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ADMIN_THEME.primary, mt: 0.7, flexShrink: 0 }} />
                      <Box>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: ADMIN_THEME.text }}>{event.title || "Event"}</Typography>
                        {event.description && <Typography sx={{ fontSize: "0.72rem", color: ADMIN_THEME.textSecondary }}>{event.description}</Typography>}
                        <Typography sx={{ fontSize: "0.65rem", color: "#94A3B8", mt: 0.25 }}>{formatRelativeTime(event.created_at)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Card>

            {/* Admin Notes */}
            {(permissions?.canManageUsers || permissions?.canViewSupport) && (
              <Card title="📝 Admin Notes">
                {/* Add note */}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    placeholder="Add an internal note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    maxRows={3}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.82rem" } }}
                  />
                  <IconButton
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                    sx={{ bgcolor: ADMIN_THEME.primary, color: "#fff", borderRadius: 2, width: 40, height: 40, "&:hover": { bgcolor: ADMIN_THEME.primaryDark }, "&:disabled": { bgcolor: "#E2E8F0" } }}
                  >
                    <Send sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
                {/* Notes list */}
                {notes.length === 0 ? (
                  <Typography sx={{ fontSize: "0.78rem", color: ADMIN_THEME.textSecondary, fontStyle: "italic" }}>No notes yet.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {notes.map((note) => (
                      <Box key={note.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F1F5F9", border: "1px solid #E2E8F0" }}>
                        <Typography sx={{ fontSize: "0.78rem", color: ADMIN_THEME.text, whiteSpace: "pre-wrap" }}>{note.content || ""}</Typography>
                        <Typography sx={{ fontSize: "0.65rem", color: "#94A3B8", mt: 0.75 }}>
                          {note.profiles?.full_name || "Admin"} · {formatRelativeTime(note.created_at)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Card>
            )}
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}

// ─── Helper Components ───────────────────────────────────────

function Card({ title, children }) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#fff", border: `1px solid ${ADMIN_THEME.cardBorder}` }}>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: ADMIN_THEME.text, mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
      <Typography sx={{ fontSize: "0.75rem", color: ADMIN_THEME.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: ADMIN_THEME.text }}>{value ?? "—"}</Typography>
    </Stack>
  );
}
