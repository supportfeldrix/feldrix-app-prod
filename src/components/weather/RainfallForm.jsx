/**
 * Feldrix — Log / Edit Rainfall Form
 *
 * Inline card form matching the Feldrix module form style. Records
 * farmer-measured rainfall (mm). Only Rainfall Date and Amount are
 * required. Field + Source + Notes are optional.
 *
 * Field selector reuses existing crops.field_name values (no duplicate
 * field-management system).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Grid, InputAdornment, MenuItem,
  Stack, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

import { addRainfallLog, updateRainfallLog } from "../../services/rainfallService";

const SOURCE_OPTIONS = ["Rain Gauge", "Weather Station", "Manual Estimate", "Weather Estimate", "Other"];

function today() {
  return new Date().toISOString().split("T")[0];
}

const EMPTY = {
  rainfall_date: "",
  amount_mm: "",
  field_name: "",
  measurement_source: "",
  notes: "",
};

export default function RainfallForm({ log = null, fieldOptions = [], onSaved, onCancel, refreshLogs }) {
  const [form, setForm] = useState({ ...EMPTY, rainfall_date: today() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setForm({
        rainfall_date: log.rainfall_date || today(),
        amount_mm: log.amount_mm ?? "",
        field_name: log.field_name || "",
        measurement_source: log.measurement_source || "",
        notes: log.notes || "",
      });
    } else {
      setForm({ ...EMPTY, rainfall_date: today() });
    }
  }, [log]);

  const fields = useMemo(
    () => [...new Set((fieldOptions || []).filter(Boolean))].sort(),
    [fieldOptions]
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!form.rainfall_date) {
      alert("Rainfall date is required.");
      return false;
    }
    if (new Date(form.rainfall_date) > new Date()) {
      alert("Rainfall date cannot be in the future.");
      return false;
    }
    if (form.amount_mm === "" || form.amount_mm == null) {
      alert("Rainfall amount (mm) is required.");
      return false;
    }
    const amount = Number(form.amount_mm);
    if (!Number.isFinite(amount)) {
      alert("Rainfall amount must be a valid number.");
      return false;
    }
    if (amount < 0) {
      alert("Rainfall amount cannot be negative.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      rainfall_date: form.rainfall_date,
      amount_mm: Number(form.amount_mm),
      field_name: form.field_name || null,
      measurement_source: form.measurement_source || null,
      notes: form.notes || null,
    };

    setSaving(true);
    try {
      if (log && log.id) {
        await updateRainfallLog(log.id, payload);
      } else {
        await addRainfallLog(payload);
      }
      if (refreshLogs) await refreshLogs();
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      // Preserve entered data; just surface the error.
      alert(err.message || "Failed to save rainfall.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <WaterDropIcon sx={{ color: "#1976D2" }} />
          <Typography variant="h6" fontWeight={700}>
            {log ? "Edit Rainfall" : "Log Rainfall"}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Record rainfall measured on your farm. Enter 0 mm to log a dry day.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth required type="date" size="small"
                label="Rainfall Date"
                name="rainfall_date"
                value={form.rainfall_date}
                onChange={handleChange}
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{ max: today() }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth required type="number" size="small"
                label="Amount"
                name="amount_mm"
                value={form.amount_mm}
                onChange={handleChange}
                inputProps={{ step: "0.1", min: 0 }}
                InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                placeholder="e.g. 12.5"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select fullWidth size="small"
                label="Field (optional)"
                name="field_name"
                value={form.field_name}
                onChange={handleChange}
              >
                <MenuItem value="">— None —</MenuItem>
                {fields.map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select fullWidth size="small"
                label="Measurement Source (optional)"
                name="measurement_source"
                value={form.measurement_source}
                onChange={handleChange}
              >
                <MenuItem value="">—</MenuItem>
                {SOURCE_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth multiline rows={2} size="small"
                label="Notes (optional)"
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
              {saving ? "Saving..." : log ? "Update Rainfall" : "Save Rainfall"}
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
