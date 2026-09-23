/**
 * Feldrix — Weather Summary Dashboard Card
 * Version 2.0 — Premium dynamic farm-weather card
 *
 * This card answers: "What is the weather doing on my farm right now?"
 *
 * VISUAL REDESIGN NOTES
 *   - Same dashboard position and column width (Farm Overview center).
 *   - Reuses the EXISTING weather data (useWeather + prop fallback),
 *     risk/alerts intelligence, day/night rule, condition vocabulary and
 *     emoji icons. No new API calls, no new dependencies, no DB changes.
 *   - Dynamic background responds to REAL weather condition + day/night via
 *     utils/weatherBackground.js (pure CSS gradients + subtle effects).
 *
 * Displays:
 *   - Current temperature, condition, feels-like, wind, humidity
 *   - DAY / NIGHT state (from actual sunrise/sunset)
 *   - Farm Weather Risk badge (existing calculation)
 *   - Severe alert warning banner (existing calculation)
 *   - Tomorrow's outlook
 *   - Link to full Weather Intelligence page
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AirIcon from "@mui/icons-material/Air";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { radius } from "../../design/tokens";

import { useWeather, useWeatherOfficialAlerts } from "../../context/WeatherContext";
import { getWeatherAtmosphere, isDaytime } from "../../utils/weatherBackground";
import { getFarmContext } from "../../services/profileService";
import { formatTemperature, formatWindSpeed, formatPrecipitation } from "../../utils/units";

export default function WeatherSummary({ weather: legacyWeather }) {
  const navigate = useNavigate();

  // Use WeatherContext for intelligence data (existing behaviour)
  const { weather: contextWeather, risk, alerts } = useWeather();

  // Farm context drives display units (weather API values are canonical
  // metric: °C / km/h / mm). Defaults to metric until loaded (SA-safe).
  const [farmCtx, setFarmCtx] = useState(null);
  useEffect(() => {
    getFarmContext().then(setFarmCtx).catch(() => {});
  }, []);

  // Prefer context data, fallback to prop for backwards compatibility
  const weather = contextWeather || legacyWeather;
  const current = weather?.current;

  // Next severe alert (existing Feldrix intelligence calculation)
  const nextAlert = alerts && alerts.length > 0 ? alerts[0] : null;

  // USA-3: official NWS/NOAA alert (distinct from Feldrix intelligence).
  // Surface a concise indicator only — the full alert lives on the Weather page.
  const officialAlerts = useWeatherOfficialAlerts();
  const officialAlert = officialAlerts && officialAlerts.length > 0 ? officialAlerts[0] : null;

  // Day/night from actual sunrise/sunset (same rule as Weather page)
  const isDay = isDaytime(current?.sunrise, current?.sunset);

  // Dynamic atmosphere from REAL condition + day/night
  const atmosphere = getWeatherAtmosphere(current?.condition, isDay);

  // ── Empty / unavailable state (preserve existing fallback) ──────────────
  if (!weather?.available) {
    return (
      <Card
        elevation={0}
        onClick={() => navigate("/weather")}
        sx={{
          borderRadius: radius.card,
          height: "100%",
          border: "1px solid",
          borderColor: "divider",
          cursor: "pointer",
          transition: "box-shadow .2s ease, transform .2s ease",
          "&:hover": { boxShadow: 2, transform: "translateY(-2px)" },
        }}
      >
        <CardContent sx={{ p: 3, textAlign: "center" }}>
          <CloudIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {weather?.locationError ? "Location Not Found" : "Weather Unavailable"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {weather?.locationError
              ? "Update your Weather Location in Account \u2192 Farm Information."
              : "Configure an API key to enable weather intelligence."}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const tomorrow = weather.forecast?.[0] || null;

  return (
    <Card
      elevation={0}
      onClick={() => navigate("/weather")}
      aria-label={`Weather: ${current?.condition || "unknown"}, ${formatTemperature(current?.temperature, farmCtx)}, ${isDay ? "day" : "night"}. Open Weather Intelligence.`}
      sx={{
        borderRadius: radius.card,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        color: atmosphere.textColor,
        // Real photographic background — selected from the EXISTING condition
        // + day/night state via utils/weatherBackground.js. Changes
        // automatically when the weather condition changes.
        backgroundImage: `url(${atmosphere.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        border: "1px solid",
        borderColor: nextAlert?.priority === "Critical" ? "rgba(239,68,68,0.55)" : "rgba(255,255,255,0.15)",
        boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
        transition: "background-image 0.6s ease, color 0.4s ease, box-shadow .2s ease, transform .2s ease",
        "&:hover": { boxShadow: "0 12px 30px rgba(15,23,42,0.20)", transform: "translateY(-2px)" },
      }}
    >
      {/* Vignette for photographic framing */}
      <Box aria-hidden sx={{ position: "absolute", inset: 0, background: atmosphere.vignette, pointerEvents: "none" }} />

      {/* Readability overlay — adaptive dark gradient over the photo so the
          existing text/icons stay legible. Tuned per mood (stronger for
          night / rain / storm, lighter for bright sunny photos). */}
      <Box
        aria-hidden
        sx={{ position: "absolute", inset: 0, background: atmosphere.imageOverlay, pointerEvents: "none" }}
      />

      <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <CloudIcon sx={{ fontSize: 20, color: atmosphere.textColor }} />
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: atmosphere.textColor }}>
              Weather
            </Typography>
          </Stack>
          {risk && (
            <Chip
              label={risk.label}
              size="small"
              sx={{
                bgcolor: `${risk.color}`,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 22,
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              }}
            />
          )}
        </Stack>

        {/* Current weather — hero */}
        <Stack alignItems="center" spacing={0.25} sx={{ pt: 0.5, pb: 1 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.3,
              mb: 0.5,
              borderRadius: 999,
              bgcolor: atmosphere.surface,
              border: "1px solid",
              // Warm/golden accent by day, cool blue by night.
              borderColor: isDay ? "rgba(255,196,68,0.75)" : "rgba(120,160,220,0.6)",
              boxShadow: isDay
                ? "0 0 10px rgba(255,196,68,0.25)"
                : "0 0 10px rgba(120,160,220,0.22)",
              backdropFilter: "blur(3px)",
            }}
          >
            <Typography aria-hidden sx={{ fontSize: 12, lineHeight: 1 }}>
              {isDay ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </Typography>
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                color: isDay ? "#B45309" : "#AFC7EE",
                letterSpacing: 1.2,
                fontSize: "0.6rem",
              }}
            >
              {isDay ? "DAY" : "NIGHT"}
            </Typography>
          </Box>
          <Typography
            aria-hidden
            sx={{
              fontSize: 48,
              lineHeight: 1,
              filter: isDay
                ? "drop-shadow(0 2px 6px rgba(15,23,42,0.22))"
                : "drop-shadow(0 2px 8px rgba(0,0,0,0.45))",
            }}
          >
            {current?.icon || "\u2600\uFE0F"}
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1, color: atmosphere.textColor }}>
            {formatTemperature(current?.temperature, farmCtx)}
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ color: atmosphere.subTextColor }}>
            {current?.condition}
          </Typography>
          {current?.feelsLike != null && current.feelsLike !== current.temperature && (
            <Typography variant="caption" sx={{ color: atmosphere.subTextColor }}>
              Feels like {formatTemperature(current.feelsLike, farmCtx, { withUnit: false })}°
            </Typography>
          )}
        </Stack>

        {/* Wind + humidity glass row */}
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          sx={{ mb: 1.5 }}
        >
          {current?.windSpeed != null && (
            <GlassStat
              atmosphere={atmosphere}
              icon={<AirIcon sx={{ fontSize: 15 }} />}
              label={formatWindSpeed(current.windSpeed, farmCtx)}
            />
          )}
          {current?.humidity != null && (
            <GlassStat
              atmosphere={atmosphere}
              icon={<WaterDropIcon sx={{ fontSize: 15 }} />}
              label={`${current.humidity}%`}
            />
          )}
          {current?.rainfall != null && current.rainfall > 0 && (
            <GlassStat
              atmosphere={atmosphere}
              icon={<span aria-hidden>{"\uD83C\uDF27\uFE0F"}</span>}
              label={formatPrecipitation(current.rainfall, farmCtx)}
            />
          )}
        </Stack>

        {/* Severe alert warning banner (existing calculation) */}
        {/* USA-3: concise OFFICIAL (NWS) alert indicator — clearly a government
            alert, distinct from the Feldrix banner below. Tapping the card
            opens the Weather page where the full official alert is shown. */}
        {officialAlert && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="flex-start"
            role="alert"
            sx={{
              py: 1,
              px: 1.25,
              mb: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.95)",
              borderLeft: "4px solid",
              borderColor: officialAlert.color || "#dc2626",
              boxShadow: "0 4px 14px rgba(15,23,42,0.18)",
              backdropFilter: "blur(3px)",
            }}
          >
            <Typography sx={{ fontSize: 18, mt: 0.1, flexShrink: 0 }}>{officialAlert.icon}</Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" fontWeight={800} sx={{ display: "block", lineHeight: 1.3, color: officialAlert.color || "#b91c1c" }}>
                {officialAlert.event}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", lineHeight: 1.35, color: "rgba(15,23,42,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, fontSize: "0.6rem" }}>
                National Weather Service
              </Typography>
            </Box>
          </Stack>
        )}

        {nextAlert && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="flex-start"
            role="alert"
            sx={{
              py: 1,
              px: 1.25,
              mb: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.92)",
              borderLeft: "4px solid",
              borderColor: nextAlert.priority === "Critical" ? "#dc2626" : "#f97316",
              boxShadow: "0 4px 14px rgba(15,23,42,0.18)",
              backdropFilter: "blur(3px)",
            }}
          >
            <WarningAmberIcon
              sx={{
                fontSize: 18,
                mt: 0.1,
                flexShrink: 0,
                color: nextAlert.priority === "Critical" ? "#dc2626" : "#f97316",
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{ display: "block", lineHeight: 1.3, color: nextAlert.priority === "Critical" ? "#b91c1c" : "#c2410c" }}
              >
                {nextAlert.icon} {nextAlert.title}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", lineHeight: 1.35, color: "rgba(15,23,42,0.75)" }}>
                {nextAlert.advice?.[0] || nextAlert.message}
              </Typography>
            </Box>
          </Stack>
        )}

        {/* Tomorrow forecast — glass surface */}
        {tomorrow && (
          <Box
            sx={{
              borderRadius: 2,
              px: 1.5,
              py: 1,
              mb: 1.5,
              bgcolor: atmosphere.surface,
              border: "1px solid",
              borderColor: atmosphere.surfaceBorder,
              backdropFilter: "blur(2px)",
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{ color: atmosphere.subTextColor, textTransform: "uppercase", letterSpacing: 0.6, fontSize: "0.6rem" }}
            >
              Tomorrow
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
              <Typography aria-hidden sx={{ fontSize: 20 }}>{tomorrow.icon}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: atmosphere.textColor }}>
                {formatTemperature(tomorrow.temperatureMax ?? tomorrow.temperature, farmCtx, { withUnit: false })}° / {tomorrow.temperatureMin != null ? formatTemperature(tomorrow.temperatureMin, farmCtx, { withUnit: false }) : "\u2014"}°
              </Typography>
              <Typography variant="body2" sx={{ color: atmosphere.subTextColor, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tomorrow.condition}
              </Typography>
              {tomorrow.pop > 0 && (
                <Typography variant="caption" fontWeight={700} sx={{ color: atmosphere.textColor }}>
                  {"\uD83D\uDCA7"} {tomorrow.pop}%
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Weather Intelligence link */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" fontWeight={800} sx={{ color: atmosphere.textColor }}>
            View Weather Intelligence
          </Typography>
          <ArrowForwardIcon sx={{ fontSize: 13, color: atmosphere.textColor }} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENTATION SUB-COMPONENTS (visual only)
// ═══════════════════════════════════════════════════════════════════════════════

function GlassStat({ atmosphere, icon, label }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: atmosphere.surface,
        border: "1px solid",
        borderColor: atmosphere.surfaceBorder,
        color: atmosphere.textColor,
      }}
    >
      {icon}
      <Typography variant="caption" fontWeight={700} sx={{ color: atmosphere.textColor }}>
        {label}
      </Typography>
    </Stack>
  );
}
