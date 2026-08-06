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

const weatherLocations = [
  { label: "Johannesburg", value: "Johannesburg,ZA" },
  { label: "Cape Town", value: "Cape Town,ZA" },
  { label: "Durban", value: "Durban,ZA" },
  { label: "Pretoria", value: "Pretoria,ZA" },
  { label: "Port Elizabeth (Gqeberha)", value: "Port Elizabeth,ZA" },
  { label: "Bloemfontein", value: "Bloemfontein,ZA" },
  { label: "East London", value: "East London,ZA" },
  { label: "Pietermaritzburg", value: "Pietermaritzburg,ZA" },
  { label: "Polokwane", value: "Polokwane,ZA" },
  { label: "Nelspruit (Mbombela)", value: "Nelspruit,ZA" },
  { label: "Kimberley", value: "Kimberley,ZA" },
  { label: "Rustenburg", value: "Rustenburg,ZA" },
  { label: "George", value: "George,ZA" },
  { label: "Stellenbosch", value: "Stellenbosch,ZA" },
  { label: "Paarl", value: "Paarl,ZA" },
  { label: "Worcester", value: "Worcester,ZA" },
  { label: "Upington", value: "Upington,ZA" },
  { label: "Welkom", value: "Welkom,ZA" },
  { label: "Bethlehem", value: "Bethlehem,ZA" },
  { label: "Kroonstad", value: "Kroonstad,ZA" },
  { label: "Grahamstown (Makhanda)", value: "Grahamstown,ZA" },
  { label: "Oudtshoorn", value: "Oudtshoorn,ZA" },
  { label: "Ceres", value: "Ceres,ZA" },
  { label: "Cradock", value: "Cradock,ZA" },
  { label: "Standerton", value: "Standerton,ZA" },
  { label: "Lichtenburg", value: "Lichtenburg,ZA" },
  { label: "Tzaneen", value: "Tzaneen,ZA" },
  { label: "Louis Trichardt (Makhado)", value: "Louis Trichardt,ZA" },
  { label: "Mossel Bay", value: "Mossel Bay,ZA" },
  { label: "Vryburg", value: "Vryburg,ZA" },
  { label: "Ermelo", value: "Ermelo,ZA" },
  { label: "Middelburg (Mpumalanga)", value: "Middelburg,ZA" },
  { label: "Potchefstroom", value: "Potchefstroom,ZA" },
  { label: "Klerksdorp", value: "Klerksdorp,ZA" },
  { label: "Harrismith", value: "Harrismith,ZA" },
  { label: "Ladysmith", value: "Ladysmith,ZA" },
  { label: "Newcastle", value: "Newcastle,ZA" },
  { label: "Vereeniging", value: "Vereeniging,ZA" },
  { label: "Phalaborwa", value: "Phalaborwa,ZA" },
  { label: "Graaff-Reinet", value: "Graaff-Reinet,ZA" },
];

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
              select
              fullWidth
              label="Weather Location"
              name="weather_location"
              value={form.weather_location}
              onChange={handleChange}
              helperText="Nearest town for weather forecasts"
            >
              <MenuItem value="">
                <em>Use default (Johannesburg)</em>
              </MenuItem>
              {weatherLocations.map((loc) => (
                <MenuItem key={loc.value} value={loc.value}>
                  {loc.label}
                </MenuItem>
              ))}
            </TextField>
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
