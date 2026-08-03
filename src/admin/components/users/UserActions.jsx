/**
 * ============================================================
 * Feldrix Control Centre — User Actions (Enterprise)
 * Sprint 47.0
 *
 * Confirmation-gated actions with audit logging.
 * Permission-aware — only shows actions the admin can perform.
 * ============================================================
 */

import { useState } from "react";
import {
  Box, Button, Stack, Menu, MenuItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
  Select, FormControl, InputLabel,
} from "@mui/material";
import {
  Block, CheckCircle, AdminPanelSettings, Replay,
  MoreHoriz, SupportAgent, AccountBalance, Visibility,
} from "@mui/icons-material";
import { useAdminContext } from "../../context/AdminContext";
import { suspendUser, reactivateUser, changeUserRole, restartOnboarding } from "../../services/adminUserService";
import { ADMIN_THEME } from "../../utils/adminConstants";

export default function UserActions({ user, onUpdated }) {
  const { admin, permissions } = useAdminContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [roleDialog, setRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [processing, setProcessing] = useState(false);

  const menuOpen = Boolean(anchorEl);

  function openMenu(e) { setAnchorEl(e.currentTarget); }
  function closeMenu() { setAnchorEl(null); }

  function confirmAction(action) {
    closeMenu();
    setConfirmDialog(action);
  }

  async function executeAction() {
    if (!confirmDialog || !admin) return;
    setProcessing(true);
    try {
      switch (confirmDialog) {
        case "suspend":
          await suspendUser(user.id, admin.id);
          break;
        case "reactivate":
          await reactivateUser(user.id, admin.id);
          break;
        case "restart_onboarding":
          await restartOnboarding(user.id, admin.id);
          break;
        default:
          break;
      }
      if (onUpdated) onUpdated();
    } catch (err) {
      console.warn("[UserActions] Failed:", err?.message);
    }
    setProcessing(false);
    setConfirmDialog(null);
  }

  async function executeRoleChange() {
    if (!selectedRole || !admin) return;
    setProcessing(true);
    try {
      await changeUserRole(user.id, selectedRole, admin.id);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.warn("[UserActions] Role change failed:", err?.message);
    }
    setProcessing(false);
    setRoleDialog(false);
    setSelectedRole("");
  }

  const CONFIRM_MESSAGES = {
    suspend: { title: "Suspend User", message: `Are you sure you want to suspend ${user?.full_name || user?.email || "this user"}? They will be unable to access Feldrix.`, severity: "warning" },
    reactivate: { title: "Reactivate User", message: `Reactivate ${user?.full_name || user?.email || "this user"}? They will regain full access.`, severity: "success" },
    restart_onboarding: { title: "Restart Onboarding", message: `Reset the onboarding journey for ${user?.full_name || user?.email || "this user"}? Their progress will be cleared.`, severity: "info" },
  };

  const dialogInfo = confirmDialog ? CONFIRM_MESSAGES[confirmDialog] : null;

  return (
    <>
      {/* Action Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          size="small"
          startIcon={<MoreHoriz sx={{ fontSize: "1rem !important" }} />}
          onClick={openMenu}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: ADMIN_THEME.textSecondary,
            border: `1px solid ${ADMIN_THEME.cardBorder}`,
            px: 2,
            minHeight: 36,
            "&:hover": { borderColor: ADMIN_THEME.primary, color: ADMIN_THEME.primary },
          }}
        >
          Actions
        </Button>
      </Box>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={menuOpen} onClose={closeMenu} PaperProps={{ sx: { borderRadius: 2, minWidth: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" } }}>
        {permissions.canSuspendUsers && !user.suspended && (
          <MenuItem onClick={() => confirmAction("suspend")}>
            <ListItemIcon><Block sx={{ fontSize: 18, color: "#EF4444" }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>Suspend User</ListItemText>
          </MenuItem>
        )}
        {permissions.canSuspendUsers && user.suspended && (
          <MenuItem onClick={() => confirmAction("reactivate")}>
            <ListItemIcon><CheckCircle sx={{ fontSize: 18, color: "#16A34A" }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>Reactivate User</ListItemText>
          </MenuItem>
        )}
        {permissions.canManageUsers && (
          <MenuItem onClick={() => { closeMenu(); setRoleDialog(true); setSelectedRole(user.role || "farmer"); }}>
            <ListItemIcon><AdminPanelSettings sx={{ fontSize: 18, color: "#6366F1" }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>Change Role</ListItemText>
          </MenuItem>
        )}
        {(permissions.canManageUsers || permissions.canViewSupport) && (
          <MenuItem onClick={() => confirmAction("restart_onboarding")}>
            <ListItemIcon><Replay sx={{ fontSize: 18, color: "#F59E0B" }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>Restart Onboarding</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}>
        {dialogInfo && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{dialogInfo.title}</DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: "0.88rem", color: ADMIN_THEME.textSecondary }}>{dialogInfo.message}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setConfirmDialog(null)} sx={{ textTransform: "none", fontSize: "0.85rem" }} disabled={processing}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={executeAction}
                disabled={processing}
                sx={{
                  textTransform: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: confirmDialog === "suspend" ? "#EF4444" : ADMIN_THEME.primary,
                  "&:hover": { bgcolor: confirmDialog === "suspend" ? "#DC2626" : ADMIN_THEME.primaryDark },
                }}
              >
                {processing ? "Processing..." : "Confirm"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} PaperProps={{ sx: { borderRadius: 3, maxWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Change Role</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.85rem", color: ADMIN_THEME.textSecondary, mb: 2.5 }}>
            Select a new role for {user?.full_name || user?.email || "this user"}.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} label="Role">
              <MenuItem value="farmer">Farmer</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
              <MenuItem value="support">Support</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="readonly">Read Only</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRoleDialog(false)} sx={{ textTransform: "none", fontSize: "0.85rem" }} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={executeRoleChange}
            disabled={processing || selectedRole === (user?.role || "farmer")}
            sx={{ textTransform: "none", fontSize: "0.85rem", fontWeight: 600, borderRadius: 2 }}
          >
            {processing ? "Saving..." : "Update Role"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
