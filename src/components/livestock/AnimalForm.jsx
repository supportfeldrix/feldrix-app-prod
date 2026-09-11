/**
 * Feldrix — Add / Edit Animal Form
 * Responsive MUI layout with lifecycle preview.
 */

import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Divider, FormControl, Grid,
  InputLabel, ListSubheader, MenuItem, Select, Stack, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { addAnimal, updateAnimal } from "../../services/livestockService";
import { getLifecycleStage, getStageColor } from "../../services/livestockLifecycle";
import { LIVESTOCK_STATUSES } from "../../constants/livestockStatus";
import { SPECIES_CATALOG_GROUPS, OTHER_SPECIES, isOtherSpecies } from "../../constants/livestockSpecies";
import useFarmContext from "../../hooks/useFarmContext";
import { isUsCustomary, lbToKg, kgToLb, unitLabel } from "../../utils/units";
import { resolveLocale, currencySymbol } from "../../utils/currency";

export default function AnimalForm({ refreshAnimals, animal = null, onSaved }) {
  const farmCtx = useFarmContext();
  const us = isUsCustomary(farmCtx);
  // The weight INPUT is shown in the farm's display unit (lb for US); the
  // livestock.weight column stays CANONICAL kg. We convert the stored kg to the
  // display unit when editing, and the entered display value back to kg on save.
  const kgToDisplay = (kg) => (kg === "" || kg == null ? "" : (us ? Math.round(kgToLb(Number(kg)) * 10) / 10 : Number(kg)));
  const displayToKg = (val) => (val === "" || val == null ? "" : (us ? lbToKg(Number(val)) : Number(val)));
  const [form, setForm] = useState({
    tag: "",
    animal_type: "Cattle",
    // Custom free-text species, shown only when animal_type === "Other".
    // Persisted to the existing livestock.category column (no migration).
    custom_species: "",
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
        // For "Other" animals the custom species lives in category.
        custom_species: isOtherSpecies(animal.animal_type) ? (animal.category || "") : "",
        breed: animal.breed || "",
        gender: normalizeGender(animal.gender),
        date_of_birth: animal.date_of_birth || "",
        purchase_date: animal.purchase_date || "",
        // Stored canonical kg → shown in the farm's display unit (lb for US).
        weight: kgToDisplay(animal.weight),
        purchase_price: animal.purchase_price || "",
        status: animal.status || "Active",
        notes: animal.notes || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal, us]);

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
    if (isOtherSpecies(form.animal_type) && !form.custom_species.trim()) {
      alert("Please enter the animal type / species for \u201COther\u201D.");
      return;
    }

    setSaving(true);
    try {
      // Persist canonical kg (convert the entered display value for US farms).
      // Structured custom species: store the free-text name in the existing
      // `category` column when species is "Other"; clear it otherwise. The
      // transient `custom_species` field is never sent to the database.
      const { custom_species, ...rest } = form;
      const payload = {
        ...rest,
        weight: displayToKg(form.weight),
        category: isOtherSpecies(form.animal_type) ? custom_species.trim() : null,
      };
      if (animal) {
        await updateAnimal(animal.id, payload);
      } else {
        await addAnimal(payload);
      }

      setForm({
        tag: "", animal_type: "Cattle", custom_species: "", breed: "", gender: "Female",
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
              <FormControl fullWidth size="small">
                <InputLabel id="species-label">Species</InputLabel>
                <Select
                  labelId="species-label"
                  label="Species"
                  name="animal_type"
                  value={form.animal_type}
                  onChange={handleChange}
                >
                  {SPECIES_CATALOG_GROUPS.flatMap((grp) => [
                    <ListSubheader key={`hdr-${grp.group}`}>{grp.group}</ListSubheader>,
                    ...grp.options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </MenuItem>
                    )),
                  ])}
                </Select>
              </FormControl>
            </Grid>

            {/* Custom species — only when "Other" is selected. */}
            {isOtherSpecies(form.animal_type) && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Animal Type / Species"
                  name="custom_species"
                  value={form.custom_species}
                  onChange={handleChange}
                  size="small"
                  placeholder="e.g. Yak, Ostrich, Emu"
                  helperText="Enter the specific animal type."
                />
              </Grid>
            )}
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
                label={`Weight (${unitLabel("mass", farmCtx)})`}
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
                label={`Purchase Price (${currencySymbol(farmCtx)})`}
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
                        {new Date(lifecyclePreview.nextStageDate).toLocaleDateString(resolveLocale(farmCtx), { day: "numeric", month: "long", year: "numeric" })}
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
