/**
 * Feldrix — USDA Soil Reference panel (USA-5)
 *
 * Displays location-based USDA NRCS SSURGO soil REFERENCE for a US farm, shown
 * DISTINCTLY from — and never replacing — the farmer's measured Ground
 * Sampling data. It is purely informational (no agronomic recommendations).
 *
 * DESIGN NOTES
 *   - US-only. The country/coordinate decision lives in soilIntelligenceService
 *     (shouldUseSsurgo). For non-US farms this renders NOTHING (returns null),
 *     so South African farms are completely unaffected.
 *   - Only values actually returned by USDA are shown; missing attributes are
 *     omitted (never fabricated).
 *   - SSURGO map units often contain multiple soil components: the dominant
 *     component is shown, with an explicit "may contain multiple components"
 *     note. No field-level laboratory precision is implied.
 *   - Clear source attribution + "not a substitute for field/laboratory
 *     sampling" disclaimer.
 *   - Uses the USA-2 units layer (formatDepth) for available water capacity.
 */

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { getSoilReference, SOIL_STATUS } from "../../services/soilIntelligenceService";
import { formatDepth } from "../../utils/units";

const DISCLAIMER = "Location-based soil reference; not a substitute for field/laboratory sampling.";

export default function SoilReferencePanel({ farmCtx }) {
  const [state, setState] = useState({ available: false, status: null, data: null, loading: true });

  useEffect(() => {
    let mounted = true;
    // Only attempt once the farm context has resolved. The service itself
    // gates US-vs-non-US and coordinate presence — no country logic here.
    if (!farmCtx) {
      setState({ available: false, status: null, data: null, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    getSoilReference(farmCtx)
      .then((res) => { if (mounted) setState({ ...res, loading: false }); })
      .catch(() => { if (mounted) setState({ available: false, status: SOIL_STATUS.ERROR, data: null, loading: false }); });
    return () => { mounted = false; };
  }, [farmCtx]);

  const { status, data, loading } = state;

  // Non-US farm → render nothing at all (SA sees no change).
  if (status === SOIL_STATUS.NOT_US) return null;
  // Before the context resolves, render nothing (avoids a flash for SA).
  if (!farmCtx && !loading) return null;

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "#FBFAF7" }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* Header + attribution */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <PublicIcon sx={{ fontSize: 20, color: "#8D6E63" }} />
          <Typography variant="subtitle1" fontWeight={800}>USDA Soil Reference</Typography>
          <Chip label="Reference" size="small" sx={{ ml: 0.5, fontWeight: 700, fontSize: "0.6rem", bgcolor: "#EFEBE9", color: "#5D4037" }} />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Source: USDA NRCS Soil Survey Geographic Database (SSURGO). {DISCLAIMER}
        </Typography>

        {loading && (
          <Typography variant="body2" color="text.secondary">Loading USDA soil reference…</Typography>
        )}

        {!loading && status === SOIL_STATUS.NO_LOCATION && (
          <UnavailableNote text="USDA soil reference unavailable until the farm location (latitude/longitude) is set." />
        )}
        {!loading && status === SOIL_STATUS.NO_COVERAGE && (
          <UnavailableNote text="No USDA soil survey data available for this location." />
        )}
        {!loading && status === SOIL_STATUS.ERROR && (
          <UnavailableNote text="USDA soil reference temporarily unavailable. Please try again later." />
        )}

        {!loading && status === SOIL_STATUS.AVAILABLE && data && (
          <SoilReferenceBody data={data} farmCtx={farmCtx} />
        )}
      </CardContent>
    </Card>
  );
}

function UnavailableNote({ text }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.5 }}>
      <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.disabled", mt: 0.1 }} />
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Stack>
  );
}

// Render only fields USDA actually returned (skip null/blank).
function RefField({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <Box>
      <Typography variant="caption" sx={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.disabled", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary">{value}</Typography>
    </Box>
  );
}

function SoilReferenceBody({ data, farmCtx }) {
  const dom = data.dominant_component || {};
  const awc = data.available_water_capacity_cm != null
    ? formatDepth(data.available_water_capacity_cm, farmCtx)  // canonical cm → cm/in
    : null;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
        <RefField label="Dominant soil component" value={data.soil_series} />
        <RefField label="Map unit" value={data.map_unit} />
        <RefField label="Survey area" value={data.survey_area} />
      </Stack>

      <Divider />

      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
        <RefField label="Drainage" value={data.drainage_class} />
        <RefField label="Available water capacity (0–100 cm)" value={awc} />
        <RefField label="Reference pH" value={data.reference_pH != null ? String(data.reference_pH) : null} />
        <RefField label="Electrical conductivity" value={data.electrical_conductivity != null ? `${data.electrical_conductivity} dS/m` : null} />
        <RefField label="Flooding frequency" value={data.flooding_frequency} />
        <RefField label="Taxonomic order" value={dom.taxOrder} />
      </Stack>

      {/* Multiple-component honesty: never imply single-soil field precision. */}
      {data.multipleComponents && (
        <Box sx={{ mt: 0.5, p: 1.25, borderRadius: 2, bgcolor: "#FFF8E1", border: "1px solid #FFECB3" }}>
          <Typography variant="caption" color="#8D6E63" sx={{ display: "block", fontWeight: 700, mb: 0.5 }}>
            This USDA soil map unit may contain multiple soil components.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data.components
              .filter((c) => c.name)
              .slice(0, 4)
              .map((c) => `${c.name}${c.percent != null ? ` (${c.percent}%)` : ""}`)
              .join(" · ")}
          </Typography>
        </Box>
      )}

      <Typography variant="caption" color="text.disabled">
        Retrieved {new Date(data.retrieved_at).toLocaleDateString(undefined)} • {data.source}
      </Typography>
    </Stack>
  );
}
