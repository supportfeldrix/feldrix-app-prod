/**
 * Feldrix — Ground Sampling latest-sample card.
 *
 * Shows the most recent soil sample prominently, or a friendly empty
 * state when none exist. Displays RAW values with explicit units only —
 * no agronomic interpretation in v1 (no established Feldrix thresholds).
 */

import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return d;
  }
}

// value + explicit unit; blank measurements show as "—"
function metric(label, value, unit) {
  const shown = value == null || value === "" ? "—" : `${value}${unit ? ` ${unit}` : ""}`;
  return { label, shown };
}

export default function GroundSampleCard({ latest, previousCount = 0, onAdd, onEdit }) {
  // ── Empty state ─────────────────────────────────────────────
  if (!latest) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: "center" }}>
          <ScienceIcon sx={{ fontSize: 44, color: "success.main", mb: 1 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No ground samples recorded yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: "auto", mb: 2.5 }}>
            Record your first soil sample to start tracking pH, nutrients and soil
            condition for your fields.
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
          >
            Add Ground Sample
          </Button>
        </CardContent>
      </Card>
    );
  }

  const cropName = latest.crops?.crop_name || null;
  const fieldName = latest.field_name || latest.crops?.field_name || "—";

  const metrics = [
    metric("pH", latest.ph, ""),
    metric("Nitrogen (N)", latest.nitrogen, "mg/kg"),
    metric("Phosphorus (P)", latest.phosphorus, "mg/kg"),
    metric("Potassium (K)", latest.potassium, "mg/kg"),
    metric("Organic Matter", latest.organic_matter, "%"),
    metric("Moisture", latest.moisture, "%"),
  ];

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }} flexWrap="wrap" gap={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ScienceIcon color="success" />
            <Typography variant="h6" fontWeight={700}>Ground Sampling</Typography>
            <Chip label="Latest" size="small" color="success" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
          </Stack>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
          >
            Add Sample
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Soil analysis and field nutrient history
        </Typography>

        {/* Meta */}
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          <MetaItem label="Field" value={fieldName} />
          <MetaItem label="Crop" value={cropName || "Field-level"} />
          <MetaItem label="Sample Date" value={fmtDate(latest.sample_date)} />
          <MetaItem label="Depth" value={latest.sampling_depth || "—"} />
        </Grid>

        <Divider sx={{ my: 1.5 }} />

        {/* Measurements (raw values + explicit units) */}
        <Grid container spacing={1.5}>
          {metrics.map((m) => (
            <Grid size={{ xs: 6, sm: 4 }} key={m.label}>
              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {m.label}
                </Typography>
                <Typography variant="body1" fontWeight={700} color="text.primary">
                  {m.shown}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Lab info */}
        {(latest.laboratory || latest.sample_reference) && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              {latest.laboratory && (
                <Typography variant="body2" color="text.secondary">
                  Laboratory: <strong style={{ color: "inherit" }}>{latest.laboratory}</strong>
                </Typography>
              )}
              {latest.sample_reference && (
                <Typography variant="body2" color="text.secondary">
                  Sample Ref: <strong>{latest.sample_reference}</strong>
                </Typography>
              )}
            </Stack>
          </>
        )}

        {latest.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
            {latest.notes}
          </Typography>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit?.(latest)}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
          >
            Edit
          </Button>
          {previousCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              Previous samples: {previousCount}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function MetaItem({ label, value }) {
  return (
    <Grid size={{ xs: 6, sm: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </Typography>
    </Grid>
  );
}
