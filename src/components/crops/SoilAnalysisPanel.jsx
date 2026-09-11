/**
 * Feldrix — Soil Analysis panel (PRESENTATION layer)
 *
 * Renders the structured output of soilAnalysisService for the latest measured
 * Ground Sample. Works for BOTH US and SA farms (one engine). The measured
 * laboratory sample is authoritative and is never overwritten; any USDA soil
 * reference (US only) is shown as CONTEXT, clearly separate.
 *
 * DESIGN
 *   - No soil thresholds or recommendation logic here — all of that lives in
 *     soilAnalysisService + cropSoilPreferences. This component only presents.
 *   - No-data / partial states handled gracefully.
 *   - USA-2 units used for reference values (formatDepth). Nutrient values are
 *     mg/kg (method-independent) so no conversion.
 *   - Always shows the agronomist/laboratory disclaimer.
 */

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { analyzeSoil } from "../../services/soilAnalysisService";
import { getSoilReference } from "../../services/soilIntelligenceService";
import { formatDepthRange } from "../../utils/units";

const OVERALL = {
  good: { label: "Good", color: "#15803D", bg: "#DCFCE7" },
  attention: { label: "Attention", color: "#B45309", bg: "#FEF3C7" },
  review_recommended: { label: "Review Recommended", color: "#B91C1C", bg: "#FEE2E2" },
};

const FINDING_ICON = {
  ok: <CheckCircleIcon sx={{ fontSize: 18, color: "#16A34A" }} />,
  attention: <WarningAmberIcon sx={{ fontSize: 18, color: "#D97706" }} />,
  note: <InfoOutlinedIcon sx={{ fontSize: 18, color: "#2563EB" }} />,
  unknown: <HelpOutlineIcon sx={{ fontSize: 18, color: "#94A3B8" }} />,
};

export default function SoilAnalysisPanel({ latestSample = null, history = null, crop = null, farmCtx = null }) {
  const [soilReference, setSoilReference] = useState(null);

  // Fetch the location-based soil reference (US only; SA resolves not_us with
  // no network call). It is CONTEXT for the comparison — the analysis works
  // from the measured sample regardless of whether this resolves.
  useEffect(() => {
    let mounted = true;
    if (!farmCtx) { setSoilReference(null); return; }
    getSoilReference(farmCtx)
      .then((res) => { if (mounted) setSoilReference(res); })
      .catch(() => { if (mounted) setSoilReference(null); });
    return () => { mounted = false; };
  }, [farmCtx]);

  const cropName = crop || latestSample?.crops?.crop_name || null;
  const analysis = analyzeSoil({ sample: latestSample, crop: cropName, farmCtx, soilReference, history });

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <ScienceIcon sx={{ fontSize: 20, color: "#2E7D32" }} />
          <Typography variant="subtitle1" fontWeight={800}>Soil Analysis</Typography>
          {analysis.available && analysis.overall && (
            <Chip
              label={OVERALL[analysis.overall]?.label || "—"}
              size="small"
              sx={{ ml: 0.5, fontWeight: 700, fontSize: "0.65rem", bgcolor: OVERALL[analysis.overall]?.bg, color: OVERALL[analysis.overall]?.color }}
            />
          )}
          {analysis.available && (
            <Chip label={`Confidence: ${analysis.confidence}`} size="small" variant="outlined" sx={{ ml: "auto", fontWeight: 600, fontSize: "0.6rem" }} />
          )}
        </Stack>

        {!analysis.available && (
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.disabled", mt: 0.1 }} />
            <Typography variant="body2" color="text.secondary">No measured soil sample available yet.</Typography>
          </Stack>
        )}

        {analysis.available && (
          <Stack spacing={2}>
            {/* Key Findings */}
            <Box>
              <SectionLabel text="Key Findings" />
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                {analysis.findings.map((f) => (
                  <Stack key={f.key} direction="row" spacing={1} alignItems="flex-start">
                    {FINDING_ICON[f.status] || FINDING_ICON.note}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {f.label} — {f.summary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{f.detail}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Potential Actions (cautious; no exact rates) */}
            {analysis.recommendations.length > 0 && (
              <Box>
                <SectionLabel text="Potential Actions" />
                <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                  {analysis.recommendations.map((r) => (
                    <Typography key={r.id} variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                      • {r.text}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            {/* pH trend from history (context) */}
            {analysis.soilConditions?.phTrend && (
              <Typography variant="caption" color="text.secondary">
                {analysis.soilConditions.phTrend.note}
              </Typography>
            )}

            <Divider />

            {/* Data Sources — measured vs reference kept clearly separate */}
            <Box>
              <SectionLabel text="Data Sources" />
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                <SourceField label="Measured (laboratory / farmer)" value={[
                  analysis.sampleDate ? `Sample ${analysis.sampleDate}` : null,
                  analysis.depth ? formatDepthRange(analysis.depth, farmCtx) : null,
                  analysis.laboratory || null,
                ].filter(Boolean).join(" • ") || "Recorded"} />
                {analysis.soilConditions?.referenceComparison && (
                  <SourceField
                    label="Reference (USDA NRCS)"
                    value={analysis.soilConditions.referenceComparison.note}
                  />
                )}
              </Stack>
            </Box>

            {/* Limitations */}
            {analysis.limitations.length > 0 && (
              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                  Data quality & limitations
                </Typography>
                {analysis.limitations.map((l, i) => (
                  <Typography key={i} variant="caption" color="text.secondary" sx={{ display: "block" }}>• {l}</Typography>
                ))}
              </Box>
            )}
          </Stack>
        )}

        {/* Always-present safety disclaimer */}
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 2 }}>
          {analysis.disclaimer}
        </Typography>
      </CardContent>
    </Card>
  );
}

function SectionLabel({ text }) {
  return (
    <Typography variant="caption" sx={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.6, color: "text.disabled", fontWeight: 800 }}>
      {text}
    </Typography>
  );
}

function SourceField({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.disabled", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary">{value}</Typography>
    </Box>
  );
}
