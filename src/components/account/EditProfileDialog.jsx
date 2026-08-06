import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { getProfile, updateProfile } from "../../services/profileService";

export default function EditProfileDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      loadProfile();
      setError("");
    }
  }, [open]);

  async function loadProfile() {
    try {
      const profile = await getProfile();
      if (!profile) return;
      setForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Failed to load profile data.");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function validate() {
    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      setSaving(true);
      setError("");

      await updateProfile({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          Edit Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update your personal details below.
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: "24px !important", pb: 2 }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            autoFocus
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button startIcon={<CloseIcon />} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
