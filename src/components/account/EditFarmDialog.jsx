import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
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

import { getProfile, updateFarmContext } from "../../services/profileService";
import { geocodeLocation } from "../../services/weatherService";
import {
  COUNTRIES,
  US_STATES,
  getCountryConfig,
  normalizeCountry,
} from "../../constants/locations";

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

// SA quick-pick weather locations (preserves the existing SA experience).
const SA_WEATHER_LOCATIONS = [
  "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth",
  "Bloemfontein", "East London", "Pietermaritzburg", "Polokwane", "Nelspruit",
  "Kimberley", "Rustenburg", "George", "Stellenbosch", "Paarl", "Worcester",
  "Upington", "Welkom", "Bethlehem", "Kroonstad", "Grahamstown", "Oudtshoorn",
  "Ceres", "Cradock", "Standerton", "Lichtenburg", "Tzaneen", "Louis Trichardt",
  "Mossel Bay", "Vryburg", "Ermelo", "Middelburg", "Potchefstroom", "Klerksdorp",
  "Harrismith", "Ladysmith", "Newcastle", "Vereeniging", "Phalaborwa", "Graaff-Reinet",
];

const US_ZIP_RE = /^\d{5}(-\d{4})?$/;

export default function EditFarmDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    farm_name: "",
    farm_type: "",
    country: "",
    province: "",       // existing SA field (preserved)
    region_state: "",   // new: US state (or other subdivision)
    zip: "",            // US ZIP (used to build the geocode query; not a DB column in USA-1)
    city: "",           // free-text city/location used to build weather_location
    farm_size: "",
    preferred_units: "Metric",
    weather_location: "",
    // Resolved/derived (shown read-only)
    latitude: null,
    longitude: null,
    timezone: null,
    currency: "",
    measurement_system: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const config = useMemo(() => getCountryConfig(form.country), [form.country]);
  const isUS = config.code === "US";
  const isSA = config.code === "ZA";

  useEffect(() => {
    if (open) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadProfile() {
    setError("");
    const profile = await getProfile();
    if (!profile) return;

    setForm({
      farm_name: profile.farm_name || "",
      farm_type: profile.farm_type || "",
      country: normalizeCountry(profile.country) || profile.country || "",
      province: profile.province || "",
      region_state: profile.region_state || "",
      zip: "",
      city: "",
      farm_size: profile.farm_size ?? "",
      preferred_units: profile.preferred_units || "Metric",
      weather_location: profile.weather_location || "",
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
      timezone: profile.timezone ?? null,
      currency: profile.currency || "",
      measurement_system: profile.measurement_system || "",
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // When the country changes, apply that country's defaults (measurement
  // system + currency) WITHOUT overwriting an explicit prior choice beyond
  // what makes sense, and clear the region field so a SA province is never
  // shown as a US state (and vice-versa).
  function handleCountryChange(e) {
    const country = e.target.value;
    const cfg = getCountryConfig(country);
    setForm((prev) => ({
      ...prev,
      country,
      // Clear the administrative region on country switch to avoid stale
      // cross-country values (SA province vs US state).
      province: cfg.code === "ZA" ? prev.province : "",
      region_state: cfg.code === "US" ? prev.region_state : "",
      // Apply country defaults for the new settings (still editable/optional).
      measurement_system: cfg.defaultMeasurementSystem || "",
      currency: cfg.defaultCurrency || "",
      preferred_units: cfg.code === "US" ? "Imperial" : "Metric",
    }));
  }

  /**
   * Build the geocode query string from the country-appropriate inputs.
   * Reuses the existing OpenWeatherMap geocoding in weatherService (no new
   * geocoder, no key exposure). Returns the query or "" if nothing usable.
   */
  function buildGeocodeQuery() {
    const suffix = config.geocodeSuffix ? `,${config.geocodeSuffix}` : "";
    if (isUS) {
      // Prefer ZIP (most precise), else city + state.
      if (form.zip && US_ZIP_RE.test(form.zip.trim())) {
        return `${form.zip.trim()},${config.geocodeSuffix}`;
      }
      const parts = [form.city, form.region_state].filter(Boolean).join(",");
      return parts ? `${parts}${suffix}` : "";
    }
    // SA / other: reuse the chosen weather_location or a typed city.
    if (form.weather_location) return form.weather_location;
    return form.city ? `${form.city}${suffix}` : "";
  }

  async function handleSave() {
    setError("");

    // Validation
    if (isUS && form.zip && !US_ZIP_RE.test(form.zip.trim())) {
      setError("Please enter a valid US ZIP (e.g. 79101 or 79101-1234), or leave it blank.");
      return;
    }

    setSaving(true);
    try {
      // Resolve coordinates (best-effort) via existing geocoding.
      let latitude = form.latitude;
      let longitude = form.longitude;
      let weatherLocation = form.weather_location;

      const query = buildGeocodeQuery();
      if (query) {
        try {
          const coords = await geocodeLocation(query);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lon;
            // Store a usable weather_location string so weather keeps working.
            weatherLocation = isUS
              ? [coords.name || form.city, config.geocodeSuffix].filter(Boolean).join(",")
              : (form.weather_location || query);
          }
        } catch {
          // Geocoding is best-effort in USA-1; save the rest regardless.
        }
      }

      // NOTE: OpenWeatherMap geocoding does not return a reliable IANA
      // timezone, so we do NOT invent one here (kept nullable, architecture
      // ready for automatic resolution in a later phase). SA effective
      // timezone is derived at read time by getFarmContext.
      const payload = {
        farm_name: form.farm_name,
        farm_type: form.farm_type,
        country: form.country,
        province: isSA ? form.province : (form.province || null),
        region_state: isUS ? form.region_state : (form.region_state || null),
        farm_size: form.farm_size === "" ? null : Number(form.farm_size),
        preferred_units: form.preferred_units,
        weather_location: weatherLocation || null,
        latitude,
        longitude,
        currency: form.currency || null,
        measurement_system: form.measurement_system || null,
        // timezone intentionally left as-is (nullable) — not invented in USA-1.
      };

      await updateFarmContext(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save farm information.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={700}>Edit Farm Information</Typography>
        <Typography variant="body2" color="text.secondary">Update your farm details below.</Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: "24px !important", pb: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Farm Name" name="farm_name" value={form.farm_name} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Farm Type" name="farm_type" value={form.farm_type} onChange={handleChange}>
              {farmTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Country drives the rest of the location UI */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Country" name="country" value={form.country} onChange={handleCountryChange}>
              <MenuItem value=""><em>Not set</em></MenuItem>
              {COUNTRIES.map((c) => <MenuItem key={c.code} value={c.value}>{c.value}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Administrative region — country aware */}
          <Grid size={{ xs: 12, md: 6 }}>
            {isUS ? (
              <TextField select fullWidth label="State" name="region_state" value={form.region_state} onChange={handleChange}>
                <MenuItem value=""><em>Select state</em></MenuItem>
                {US_STATES.map((s) => <MenuItem key={s.abbr} value={s.name}>{s.name} ({s.abbr})</MenuItem>)}
              </TextField>
            ) : isSA ? (
              <TextField select fullWidth label="Province" name="province" value={form.province} onChange={handleChange}>
                <MenuItem value=""><em>Select province</em></MenuItem>
                {config.regions.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            ) : (
              <TextField fullWidth label="Province / State" name="province" value={form.province} onChange={handleChange} />
            )}
          </Grid>

          {/* US ZIP */}
          {isUS && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="zip"
                value={form.zip}
                onChange={handleChange}
                placeholder="e.g. 79101"
                helperText="Used to locate your farm for weather. ZIP or ZIP+4."
              />
            </Grid>
          )}

          {/* City / location — used to build the weather location */}
          <Grid size={{ xs: 12, md: 6 }}>
            {isSA ? (
              <TextField
                select
                fullWidth
                label="Weather Location"
                name="weather_location"
                value={form.weather_location}
                onChange={handleChange}
                helperText="Nearest town for weather forecasts"
              >
                <MenuItem value=""><em>Use default (Johannesburg)</em></MenuItem>
                {SA_WEATHER_LOCATIONS.map((loc) => (
                  <MenuItem key={loc} value={`${loc},ZA`}>{loc}</MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                label={isUS ? "City / Town" : "City / Location"}
                name="city"
                value={form.city}
                onChange={handleChange}
                helperText="Nearest town for weather forecasts"
              />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth type="number" label="Farm Size (ha)" name="farm_size" value={form.farm_size} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Preferred Units" name="preferred_units" value={form.preferred_units} onChange={handleChange}>
              {unitOptions.map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Derived / secondary information — read-only, auto-detected */}
          {(form.country || form.latitude != null) && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>
                  Detected Farm Context
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={3} sx={{ mt: 1 }}>
                  <DetItem label="Measurement" value={form.measurement_system || (isUS ? "us_customary" : "metric")} />
                  <DetItem label="Currency" value={form.currency || (isUS ? "USD" : "ZAR")} />
                  <DetItem label="Coordinates" value={form.latitude != null && form.longitude != null ? `${Number(form.latitude).toFixed(3)}, ${Number(form.longitude).toFixed(3)}` : "Resolves on save"} />
                  <DetItem label="Timezone" value={form.timezone || (isSA ? "Africa/Johannesburg" : "Auto (later)")} />
                </Stack>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button startIcon={<CloseIcon />} onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DetItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.disabled" sx={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Box>
  );
}
