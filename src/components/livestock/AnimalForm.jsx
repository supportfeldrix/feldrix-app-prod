/**
 * Feldrix — Add / Edit Animal Form
 * Responsive MUI layout with lifecycle preview.
 */

import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { addAnimal, updateAnimal } from "../../services/livestockService";
import { getLifecycleStage, getStageColor } from "../../services/livestockLifecycle";
import { LIVESTOCK_STATUSES } from "../../constants/livestockStatus";

export default function AnimalForm({ refreshAnimals, animal = null, onSaved }) {
  const [form, setForm] = useState({
    tag: "",
    animal_type: "Cattle",
    breed: "",
    gender: "Female",
    date_of_birth: "",
    purchase_date: "",
    weight: "",
    purchase_price: "",
    status: "Active",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (animal) {
      setForm({
        tag: animal.tag || "",
        animal_type: animal.animal_type || "Cattle",
        breed: animal.breed || "",
        gender: normalizeGender(animal.gender),
        date_of_birth: animal.date_of_birth || "",
        purchase_date: animal.purchase_date || "",
        weight: animal.weight || "",
        purchase_price: animal.purchase_price || "",
        status: animal.status || "Active",
        notes: animal.notes || "",
      });
    }
  }, [animal]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.tag.trim()) {
      alert("Tag Number is required.");
      return;
    }
    if (!form.breed.trim()) {
      alert("Breed is required.");
      return;
    }

    setSaving(true);
    try {
      if (animal) {
        await updateAnimal(animal.id, form);
      } else {
        await addAnimal(form);
      }

      setForm({
        tag: "", animal_type: "Cattle", breed: "", gender: "Female",
        date_of_birth: "", purchase_date: "", weight: "",
        purchase_price: "", status: "Active", notes: "",
      });

      if (refreshAnimals) await refreshAnimals();
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    setSaving(false);
  }

  // Lifecycle preview (computed from current form state)
  const lifecyclePreview = getLifecycleStage({
    animal_type: form.animal_type,
    gender: form.gender,
    date_of_birth: form.date_of_birth,
  });

  const stageColor = lifecyclePreview.stage ? getStageColor(lifecyclePreview.stage) : null;

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
          {animal ? "Edit Animal" : "Add Animal"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {animal ? "Update this animal's details below." : "Register a new animal in your herd."}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            {/* Row 1: Tag + Species + Breed */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                required
                label="Tag Number"
                name="tag"
                value={form.tag}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Species"
                name="animal_type"
                value={form.animal_type}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="Cattle">🐄 Cattle</MenuItem>
                <MenuItem value="Sheep">🐑 Sheep</MenuItem>
                <MenuItem value="Goats">🐐 Goats</MenuItem>
                <MenuItem value="Pigs">🐖 Pigs</MenuItem>
                <MenuItem value="Poultry">🐔 Poultry</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                required
                label="Breed"
                name="breed"
                value={form.breed}
                onChange={handleChange}
                size="small"
              />
            </Grid>

            {/* Row 2: Gender + DOB */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={form.date_of_birth ? "Used for automatic lifecycle tracking." : "Required for automatic lifecycle tracking."}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Purchase Date"
                name="purchase_date"
                value={form.purchase_date}
                onChange={handleChange}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Row 3: Weight + Price + Status */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Weight (kg)"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Purchase Price (R)"
                name="purchase_price"
                value={form.purchase_price}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                size="small"
              >
                {LIVESTOCK_STATUSES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                size="small"
              />
            </Grid>
          </Grid>

          {/* Lifecycle Preview */}
          {form.date_of_birth && form.animal_type && lifecyclePreview.stage && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                  Lifecycle Preview
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Stage</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={lifecyclePreview.stage} size="small" sx={{ fontWeight: 700, bgcolor: stageColor?.bg, color: stageColor?.color }} />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Age</Typography>
                    <Typography variant="body2" fontWeight={600}>{lifecyclePreview.ageLabel}</Typography>
                  </Box>
                  {lifecyclePreview.nextStage && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Next Stage</Typography>
                      <Typography variant="body2" fontWeight={600}>{lifecyclePreview.nextStage}</Typography>
                    </Box>
                  )}
                  {lifecyclePreview.nextStageDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Estimated Transition</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(lifecyclePreview.nextStageDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={saving}
            startIcon={<SaveIcon />}
            sx={{ mt: 3, px: 4, py: 1.2, fontWeight: 700, borderRadius: 2, textTransform: "none" }}
          >
            {saving ? "Saving..." : animal ? "Update Animal" : "Save Animal"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function normalizeGender(gender) {
  if (!gender) return "Female";
  const lower = gender.toLowerCase();
  const maleTerms = ["bull", "ram", "buck", "boar", "rooster", "male", "steer", "ox"];
  if (maleTerms.some((t) => lower.includes(t))) return "Male";
  return "Female";
}
