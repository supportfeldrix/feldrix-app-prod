/**
 * Feldrix — Add / Edit Ground Sample (Soil Sample) Form
 *
 * Inline card form matching the Crops module CropForm style.
 * Records laboratory soil-analysis results against a field and,
 * optionally, a specific crop. Most soil measurements are optional so
 * partial lab panels can be saved.
 *
 * Units (v1 documented standard):
 *   pH unitless (0–14), N/P/K in mg/kg (ppm), Organic Matter & Moisture in %.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Grid, InputAdornment, MenuItem,
  Stack, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ScienceIcon from "@mui/icons-material/Science";

import { addGroundSample, updateGroundSample } from "../../services/groundSamplingService";

const DEPTH_OPTIONS = ["0–15 cm", "0–30 cm", "15–30 cm", "30–60 cm"];

const EMPTY = {
  field_name: "",
  crop_id: "",
  sample_date: "",
  sampling_depth: "",
  ph: "",
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  organic_matter: "",
  moisture: "",
  laboratory: "",
  sample_reference: "",
  notes: "",
};

function today() {
  return new Date().toISOString().split("T")[0];
}

// Parse an optional numeric field. Returns undefined for blank, or a number.
function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function GroundSamplingForm({ sample = null, crops = [], onSaved, onCancel, refreshSamples }) {
  const [form, setForm] = useState({ ...EMPTY, sample_date: today() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sample) {
      setForm({
        field_name: sample.field_name || "",
        crop_id: sample.crop_id ?? "",
        sample_date: sample.sample_date || today(),
        sampling_depth: sample.sampling_depth || "",
        ph: sample.ph ?? "",
        nitrogen: sample.nitrogen ?? "",
        phosphorus: sample.phosphorus ?? "",
        potassium: sample.potassium ?? "",
        organic_matter: sample.organic_matter ?? "",
        moisture: sample.moisture ?? "",
        laboratory: sample.laboratory || "",
        sample_reference: sample.sample_reference || "",
        notes: sample.notes || "",
      });
    } else {
      setForm({ ...EMPTY, sample_date: today() });
    }
  }, [sample]);

  // Distinct field names from existing crops for the field selector.
  const fieldOptions = useMemo(() => {
    const set = new Set(
      (crops || []).map((c) => (c.field_name || "").trim()).filter(Boolean)
    );
    return [...set].sort();
  }, [crops]);

  // Crops available for the selected field (or all crops if no field chosen).
  const cropOptions = useMemo(() => {
    if (!form.field_name) return crops || [];
    return (crops || []).filter((c) => (c.field_name || "").trim() === form.field_name);
  }, [crops, form.field_name]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // If the field changes, clear a crop that no longer matches.
      if (name === "field_name" && prev.crop_id) {
        const stillValid = (crops || []).some(
          (c) => String(c.id) === String(prev.crop_id) && (c.field_name || "").trim() === value
        );
        if (!stillValid) next.crop_id = "";
      }
      return next;
    });
  }

  function validate() {
    if (!form.sample_date) {
      alert("Sample date is required.");
      return false;
    }
    if (new Date(form.sample_date) > new Date()) {
      alert("Sample date cannot be in the future.");
      return false;
    }
    if (!form.field_name && !form.crop_id) {
      alert("Select a field or a crop for this sample.");
      return false;
    }
    if (form.ph !== "") {
      const ph = Number(form.ph);
      if (!Number.isFinite(ph) || ph < 0 || ph > 14) {
        alert("pH must be between 0 and 14.");
        return false;
      }
    }
    const nonNegative = ["nitrogen", "phosphorus", "potassium", "organic_matter", "moisture"];
    for (const key of nonNegative) {
      if (form[key] !== "") {
        const n = Number(form[key]);
        if (!Number.isFinite(n) || n < 0) {
          alert(`${key.replace("_", " ")} cannot be negative.`);
          return false;
        }
      }
    }
    for (const key of ["organic_matter", "moisture"]) {
      if (form[key] !== "" && Number(form[key]) > 100) {
        alert(`${key.replace("_", " ")} is a percentage and cannot exceed 100%.`);
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    // Resolve a field_name: prefer the chosen field; otherwise inherit from crop.
    let fieldName = form.field_name || null;
    if (!fieldName && form.crop_id) {
      const c = (crops || []).find((x) => String(x.id) === String(form.crop_id));
      fieldName = c?.field_name || null;
    }

    const payload = {
      field_name: fieldName,
      crop_id: form.crop_id ? Number(form.crop_id) : null,
      sample_date: form.sample_date,
      sampling_depth: form.sampling_depth || null,
      ph: numOrNull(form.ph),
      nitrogen: numOrNull(form.nitrogen),
      phosphorus: numOrNull(form.phosphorus),
      potassium: numOrNull(form.potassium),
      organic_matter: numOrNull(form.organic_matter),
      moisture: numOrNull(form.moisture),
      laboratory: form.laboratory || null,
      sample_reference: form.sample_reference || null,
      notes: form.notes || null,
    };

    setSaving(true);
    try {
      if (sample && sample.id) {
        await updateGroundSample(sample.id, payload);
      } else {
        await addGroundSample(payload);
      }
      if (refreshSamples) await refreshSamples();
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      // Preserve form input; just surface the error.
      alert(err.message || "Failed to save ground sample.");
    } finally {
      setSaving(false);
    }
  }

  const ppm = { endAdornment: <InputAdornment position="end">mg/kg</InputAdornment> };
  const pct = { endAdornment: <InputAdornment position="end">%</InputAdornment> };

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <ScienceIcon color="success" />
          <Typography variant="h6" fontWeight={700}>
            {sample ? "Edit Ground Sample" : "Add Ground Sample"}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Record a soil test result. Only Field/Crop and Sample Date are required —
          leave any measurement blank if your lab did not report it.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2.5}>
            {/* Field */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select fullWidth size="small"
                label="Field"
                name="field_name"
                value={form.field_name}
                onChange={handleChange}
                helperText="Select an existing field or leave blank"
              >
                <MenuItem value="">— None —</MenuItem>
                {fieldOptions.map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Crop (optional) */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select fullWidth size="small"
                label="Crop (optional)"
                name="crop_id"
                value={form.crop_id}
                onChange={handleChange}
                helperText="Link to a specific crop, or leave field-level"
              >
                <MenuItem value="">— Field-level (no crop) —</MenuItem>
                {cropOptions.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.crop_name}{c.field_name ? ` — ${c.field_name}` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Sample date */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                fullWidth required type="date" size="small"
                label="Sample Date"
                name="sample_date"
                value={form.sample_date}
                onChange={handleChange}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Depth */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select fullWidth size="small"
                label="Depth"
                name="sampling_depth"
                value={form.sampling_depth}
                onChange={handleChange}
              >
                <MenuItem value="">—</MenuItem>
                {DEPTH_OPTIONS.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Soil measurements */}
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                fullWidth type="number" size="small"
                label="pH"
                name="ph"
                value={form.ph}
                onChange={handleChange}
                inputProps={{ step: "0.1", min: 0, max: 14 }}
                helperText="0–14"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                fullWidth type="number" size="small"
                label="Nitrogen (N)"
                name="nitrogen"
                value={form.nitrogen}
                onChange={handleChange}
                inputProps={{ step: "0.1", min: 0 }}
                InputProps={ppm}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                fullWidth type="number" size="small"
                label="Phosphorus (P)"
                name="phosphorus"
                value={form.phosphorus}
                onChange={handleChange}
                inputProps={{ step: "0.1", min: 0 }}
                InputProps={ppm}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                fullWidth type="number" size="small"
                label="Potassium (K)"
                name="potassium"
                value={form.potassium}
                onChange={handleChange}
                inputProps={{ step: "0.1", min: 0 }}
                InputProps={ppm}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                fullWidth type="number" size="small"
                label="Organic Matter"
                name="organic_matter"
                value={form.organic_matter}
                onChange={handleChange}
                inputProps={{ step: "0.1", min: 0, max: 100 }}
                InputProps={pct}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                fullWidth type="number" size="small"
                label="Moisture"
                name="moisture"
                value={form.moisture}
                onChange={handleChange}
                inputProps={{ step: "0.1", min: 0, max: 100 }}
                InputProps={pct}
              />
            </Grid>

            {/* Lab info */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth size="small"
                label="Laboratory"
                name="laboratory"
                value={form.laboratory}
                onChange={handleChange}
                placeholder="e.g. Example Soil Lab"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth size="small"
                label="Lab Sample Reference"
                name="sample_reference"
                value={form.sample_reference}
                onChange={handleChange}
                placeholder="e.g. GS-2026-091"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth multiline rows={2} size="small"
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={saving}
              startIcon={<SaveIcon />}
              sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: 2, textTransform: "none" }}
            >
              {saving ? "Saving..." : sample ? "Update Sample" : "Save Sample"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outlined"
                onClick={onCancel}
                disabled={saving}
                startIcon={<CloseIcon />}
                sx={{ px: 3, py: 1.2, fontWeight: 700, borderRadius: 2, textTransform: "none" }}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
