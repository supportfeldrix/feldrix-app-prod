/**
 * Feldrix — Livestock Status Change Dialog
 * Confirmation dialog for changing an animal's lifecycle status.
 */

import { useState } from "react";
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography, Box, Chip,
} from "@mui/material";
import toast from "react-hot-toast";
import { changeAnimalStatus } from "../../services/livestockService";
import { LIVESTOCK_STATUSES, getStatusConfig } from "../../constants/livestockStatus";

export default function StatusChangeDialog({ open, onClose, animal, onStatusChanged }) {
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  if (!animal) return null;

  const currentConfig = getStatusConfig(animal.status);

  async function handleConfirm() {
    if (!newStatus || newStatus === animal.status) return;

    setSaving(true);
    try {
      await changeAnimalStatus(animal.id, newStatus);
      toast.success(`Status changed to ${newStatus}.`);
      onStatusChanged?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to change status.");
    } finally {
      setSaving(false);
    }
  }

  const selectedConfig = newStatus ? getStatusConfig(newStatus) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Change Status</Typography>
        <Typography variant="body2" color="text.secondary">
          {animal.tag} — {animal.breed}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={2.5}>
          {/* Current Status */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Current Status
            </Typography>
            <Chip
              label={currentConfig.label}
              sx={{ fontWeight: 700, bgcolor: currentConfig.bg, color: currentConfig.color }}
            />
          </Box>

          {/* New Status Selection */}
          <TextField
            select
            fullWidth
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            size="small"
          >
            {LIVESTOCK_STATUSES.filter((s) => s.value !== animal.status).map((s) => (
              <MenuItem key={s.value} value={s.value}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.color }} />
                  <span>{s.label}</span>
                </Stack>
              </MenuItem>
            ))}
          </TextField>

          {/* Warning for removal statuses */}
          {selectedConfig && ["Sold", "Slaughtered", "Deceased"].includes(newStatus) && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#FEF3C7", border: "1px solid #FDE68A" }}>
              <Typography variant="body2" color="#92400E" fontWeight={600}>
                This will remove {animal.tag} from the active herd.
              </Typography>
              <Typography variant="caption" color="#B45309">
                All history, health records, and financial data will be retained.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!newStatus || newStatus === animal.status || saving}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {saving ? "Saving..." : "Confirm Change"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
