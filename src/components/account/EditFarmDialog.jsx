import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { getProfile, updateProfile } from "../../services/profileService";

const farmTypes = [
  "Mixed Farming",
  "Crop Farming",
  "Livestock",
  "Dairy",
  "Poultry",
  "Game Farm",
  "Wine Farm",
  "Other",
];

const unitOptions = ["Metric", "Imperial"];

export default function EditFarmDialog({
  open,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    farm_name: "",
    farm_type: "",
    province: "",
    country: "",
    farm_size: "",
    preferred_units: "Metric",
    weather_location: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  async function loadProfile() {
    const profile = await getProfile();

    if (!profile) return;

    setForm({
      farm_name: profile.farm_name || "",
      farm_type: profile.farm_type || "",
      province: profile.province || "",
      country: profile.country || "",
      farm_size: profile.farm_size ?? "",
      preferred_units: profile.preferred_units || "Metric",
      weather_location: profile.weather_location || "",
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);

      await updateProfile({
        ...form,
        farm_size:
          form.farm_size === ""
            ? null
            : Number(form.farm_size),
      });

      onSaved?.();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography
          variant="h5"
          fontWeight={700}
        >
          Edit Farm Information
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Update your farm details below.
        </Typography>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          pt: "24px !important",
          pb: 2,
        }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Farm Name"
              name="farm_name"
              value={form.farm_name}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Farm Type"
              name="farm_type"
              value={form.farm_type}
              onChange={handleChange}
            >
              {farmTypes.map((type) => (
                <MenuItem
                  key={type}
                  value={type}
                >
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Province / State"
              name="province"
              value={form.province}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Farm Size (ha)"
              name="farm_size"
              value={form.farm_size}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Preferred Units"
              name="preferred_units"
              value={form.preferred_units}
              onChange={handleChange}
            >
              {unitOptions.map((unit) => (
                <MenuItem
                  key={unit}
                  value={unit}
                >
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Weather Location"
              name="weather_location"
              value={form.weather_location}
              onChange={handleChange}
              placeholder="e.g. Stellenbosch,ZA"
              helperText="Town and country code for weather forecasts"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
        }}
      >
        <Button
          startIcon={<CloseIcon />}
          onClick={onClose}
        >
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
