/**
 * Feldrix — Regional Crop Timing panel (USA-4)
 *
 * Shows TYPICAL regional planting/harvest windows, current seasonal timing,
 * lifecycle stage and (when meaningful) frost risk for a US farm's crops.
 *
 * DESIGN NOTES
 *   - US farms ONLY. It renders nothing (returns null) when no crop resolves a
 *     US regional profile, so South African farms see no change (design §14).
 *   - Language is deliberately "typical / expected / estimated / regional
 *     expectation" — never "you must plant on ..." (design §6, §15).
 *   - No agronomy prescriptions. Timing/seasonal intelligence only (design §10).
 *   - Uses the farm locale (USA-2) for date display; no hard-coded ZAR/°C/mm.
 *   - Fails gracefully: crops without a supported profile are simply omitted.
 */

import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AcUnitIcon from "@mui/icons-material/AcUnit";

import { getCropSeasonalIntelligence } from "../../utils/cropIntelligence";
import { resolveLocale } from "../../utils/currency";
import { getCropStageColor } from "../../utils/cropLifecycle";

// Format an "MM-DD" window edge into a readable, locale-aware "Mon D".
function fmtMd(md, locale) {
  if (!md) return "\u2014";
  const [m, d] = md.split("-").map(Number);
  if (!m || !d) return "\u2014";
  // Year is arbitrary (window recurs annually); we only render month + day.
  const date = new Date(Date.UTC(2001, m - 1, d));
  try {
    return date.toLocaleDateString(locale || "en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  } catch {
    return md;
  }
}

const STATUS_TONE = {
  in_window: { color: "#15803D", bg: "#DCFCE7" },
  planted_in_window: { color: "#15803D", bg: "#DCFCE7" },
  window_closing: { color: "#B45309", bg: "#FEF3C7" },
  before_window: { color: "#1D4ED8", bg: "#DBEAFE" },
  after_window: { color: "#B91C1C", bg: "#FEE2E2" },
  planted_early: { color: "#B45309", bg: "#FEF3C7" },
  planted_late: { color: "#B45309", bg: "#FEF3C7" },
};

export default function RegionalCropTiming({ crops = [], farmCtx, weather = null }) {
  const locale = resolveLocale(farmCtx);

  // Resolve seasonal intelligence for each crop; keep only supported ones.
  const items = (crops || [])
    .map((crop) => ({ crop, intel: getCropSeasonalIntelligence(crop, farmCtx, weather) }))
    .filter((x) => x.intel.available);

  // US-only + supported-crop gating: render nothing otherwise (SA-safe).
  if (items.length === 0) return null;

  const regionLabel = items[0].intel.region.replace(/_/g, " ");

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <EventAvailableIcon sx={{ fontSize: 20, color: "success.main" }} />
          <Typography variant="subtitle1" fontWeight={800}>
            Regional Crop Timing
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Typical {regionLabel} windows (USDA regional expectation). These are estimated,
          not exact — actual timing varies by field, season and cultivar.
        </Typography>

        <Stack spacing={1.5}>
          {items.map(({ crop, intel }) => {
            const tone = STATUS_TONE[intel.planting?.status] || { color: "#475569", bg: "#F1F5F9" };
            const stageColor = intel.lifecycleStage ? getCropStageColor(intel.lifecycleStage) : null;
            return (
              <Box
                key={crop.id ?? `${intel.crop}-${crop.field_name || ""}`}
                sx={{ p: 1.75, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "#FCFCFD" }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {intel.crop}{crop.field_name ? ` • ${crop.field_name}` : ""}
                  </Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    {intel.isManualHarvested ? (
                      <Chip label="Harvested" size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", bgcolor: "#F1F5F9", color: "#64748B" }} />
                    ) : (
                      <>
                        {intel.planting?.label && (
                          <Chip label={intel.planting.label} size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", bgcolor: tone.bg, color: tone.color }} />
                        )}
                        {intel.lifecycleStage && stageColor && (
                          <Chip label={intel.lifecycleStage} size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", bgcolor: stageColor.bg, color: stageColor.color }} />
                        )}
                      </>
                    )}
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                  <TimingField
                    label="Typical planting"
                    value={`${fmtMd(intel.profile.plantingStart, locale)} \u2013 ${fmtMd(intel.profile.plantingEnd, locale)}`}
                  />
                  <TimingField
                    label="Typical harvest"
                    value={`${fmtMd(intel.profile.harvestStart, locale)} \u2013 ${fmtMd(intel.profile.harvestEnd, locale)}`}
                  />
                  <TimingField
                    label="Typical season"
                    value={`${intel.profile.growingDaysMin}\u2013${intel.profile.growingDaysMax} days`}
                  />
                </Stack>

                {/* Current seasonal note (only when meaningful). */}
                {!intel.isManualHarvested && intel.harvest?.status === "harvest_approaching" && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {intel.harvest.message}
                  </Typography>
                )}
                {!intel.isManualHarvested && intel.harvest?.status === "in_harvest_window" && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {intel.harvest.message}
                  </Typography>
                )}

                {/* Frost risk — only for frost-sensitive crops with real weather. */}
                {intel.frost && (
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                    <AcUnitIcon sx={{ fontSize: 16, color: intel.frost.severity === "high" ? "#DC2626" : "#D97706" }} />
                    <Typography variant="caption" fontWeight={600} sx={{ color: intel.frost.severity === "high" ? "#B91C1C" : "#B45309" }}>
                      {intel.frost.message}
                    </Typography>
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function TimingField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.disabled", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}
