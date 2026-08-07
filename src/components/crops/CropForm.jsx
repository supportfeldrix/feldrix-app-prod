/**
 * Feldrix — Add / Edit Crop Form
 * Simplified: farmer enters Crop + Field + Area + Planting Date.
 * Lifecycle engine auto-calculates harvest estimate from SA crop profiles.
 * Advanced Options allow manual override of growing period or harvest date.
 */

import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Collapse, Divider, Grid,
  LinearProgress, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { addCrop, updateCrop } from "../../services/cropService";
import { getCropLifecycle, getGrowingDays, getCropStageColor } from "../../utils/cropLifecycle";

export default function CropForm({ crop = null, refreshCrops, onSaved }) {
  const [form, setForm] = useState({
    crop_name: "",
    field_name: "",
    area: "",
    area_unit: "ha",
    planting_date: "",
    status: "Growing",
    notes: "",
    // Advanced overrides (only sent if explicitly set)
    expected_harvest: "",
    expected_growing_days: "",
  });

  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (crop) {
      setForm({
        crop_name: crop.crop_name || "",
        field_name: crop.field_name || "",
        area: crop.area || "",
        area_unit: crop.area_unit || "ha",
        planting_date: crop.planting_date || "",
        status: crop.status || "Growing",
        notes: crop.notes || "",
        expected_harvest: crop.expected_harvest || "",
        expected_growing_days: crop.expected_growing_days || "",
      });
      // Show advanced if overrides were previously set
      if (crop.expected_harvest || crop.expected_growing_days) {
        setShowAdvanced(true);
      }
    }
  }, [crop]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.crop_name.trim()) {
      alert("Crop name is required.");
      return;
    }

    setSaving(true);
    try {
      // Only include overrides if they have values
      const payload = {
        crop_name: form.crop_name,
        field_name: form.field_name,
        area: form.area || null,
        area_unit: form.area_unit,
        planting_date: form.planting_date || null,
        status: form.status,
        notes: form.notes,
        expected_harvest: form.expected_harvest || null,
        expected_growing_days: form.expected_growing_days ? Number(form.expected_growing_days) : null,
      };

      if (crop) {
        await updateCrop(crop.id, payload);
      } else {
        await addCrop(payload);
      }

      setForm({
        crop_name: "", field_name: "", area: "", area_unit: "ha",
        planting_date: "", status: "Growing", notes: "",
        expected_harvest: "", expected_growing_days: "",
      });

      if (refreshCrops) await refreshCrops();
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    setSaving(false);
  }

  // Lifecycle preview from current form state
  const lifecycle = getCropLifecycle({
    crop_name: form.crop_name,
    planting_date: form.planting_date,
    expected_harvest: form.expected_harvest || undefined,
    expected_growing_days: form.expected_growing_days || undefined,
    status: form.status,
  });

  const defaultDays = getGrowingDays({ crop_name: form.crop_name });
  const stageColor = lifecycle.lifecycleStage ? getCropStageColor(lifecycle.lifecycleStage) : null;

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
          {crop ? "Edit Crop" : "Add Crop"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {crop ? "Update crop details below." : "Register a new crop. Harvest dates are calculated automatically."}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            {/* Core Fields */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth required
                label="Crop"
                name="crop_name"
                value={form.crop_name}
                onChange={handleChange}
                size="small"
                placeholder="e.g. Maize, Wheat, Potatoes"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Field / Location"
                name="field_name"
                value={form.field_name}
                onChange={handleChange}
                size="small"
                placeholder="e.g. Field 4, Block B"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Area"
                name="area"
                value={form.area}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2, md: 2 }}>
              <TextField
                select fullWidth
                label="Unit"
                name="area_unit"
                value={form.area_unit}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="ha">ha</MenuItem>
                <MenuItem value="acres">acres</MenuItem>
              </TextField>
            </Grid>

            {/* Planting Date + Status */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Planting Date"
                name="planting_date"
                value={form.planting_date}
                onChange={handleChange}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={form.crop_name ? `Default growing period: ${defaultDays} days` : ""}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select fullWidth
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="Growing">Growing</MenuItem>
                <MenuItem value="Planted">Planted</MenuItem>
                <MenuItem value="Harvested">Harvested</MenuItem>
              </TextField>
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth multiline rows={2}
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                size="small"
              />
            </Grid>
          </Grid>

          {/* Lifecycle Preview */}
          {form.planting_date && lifecycle.lifecycleStage && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                  Harvest Forecast
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "center" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Stage</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={lifecycle.lifecycleStage} size="small" sx={{ fontWeight: 700, bgcolor: stageColor?.bg, color: stageColor?.color }} />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Age</Typography>
                    <Typography variant="body2" fontWeight={600}>{lifecycle.ageLabel}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Estimated Harvest</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {lifecycle.estimatedHarvestDate ? new Date(lifecycle.estimatedHarvestDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Countdown</Typography>
                    <Typography variant="body2" fontWeight={600} color={lifecycle.daysRemaining <= 7 ? "success.main" : "text.primary"}>
                      {lifecycle.daysRemaining != null ? `${lifecycle.daysRemaining} days` : "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">Progress</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      <LinearProgress variant="determinate" value={lifecycle.progressPercent} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: `${stageColor?.color}15`, "& .MuiLinearProgress-bar": { bgcolor: stageColor?.color, borderRadius: 3 } }} />
                      <Typography variant="caption" fontWeight={700} color={stageColor?.color}>{lifecycle.progressPercent}%</Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </>
          )}

          {/* Advanced Options */}
          <Box sx={{ mt: 2.5 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" }}
            >
              Advanced Options
            </Button>

            <Collapse in={showAdvanced}>
              <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, border: "1px dashed", borderColor: "divider", bgcolor: "grey.25" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  Override the automatic calculations. Leave blank to use South African defaults.
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Override Growing Period (days)"
                      name="expected_growing_days"
                      value={form.expected_growing_days}
                      onChange={handleChange}
                      size="small"
                      placeholder={`Default: ${defaultDays}`}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Override Harvest Date"
                      name="expected_harvest"
                      value={form.expected_harvest}
                      onChange={handleChange}
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          {/* Submit */}
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={saving}
            startIcon={<SaveIcon />}
            sx={{ mt: 3, px: 4, py: 1.2, fontWeight: 700, borderRadius: 2, textTransform: "none" }}
          >
            {saving ? "Saving..." : crop ? "Update Crop" : "Save Crop"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
