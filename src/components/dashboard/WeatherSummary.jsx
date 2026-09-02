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

import { useWeather } from "../../context/WeatherContext";
import { getWeatherAtmosphere, isDaytime } from "../../utils/weatherBackground";

export default function WeatherSummary({ weather: legacyWeather }) {
  const navigate = useNavigate();

  // Use WeatherContext for intelligence data (existing behaviour)
  const { weather: contextWeather, risk, alerts } = useWeather();

  // Prefer context data, fallback to prop for backwards compatibility
  const weather = contextWeather || legacyWeather;
  const current = weather?.current;

  // Next severe alert (existing calculation)
  const nextAlert = alerts && alerts.length > 0 ? alerts[0] : null;

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
      aria-label={`Weather: ${current?.condition || "unknown"}, ${current?.temperature}°C, ${isDay ? "day" : "night"}. Open Weather Intelligence.`}
      sx={{
        borderRadius: radius.card,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        color: atmosphere.textColor,
        background: atmosphere.sky,
        border: "1px solid",
        borderColor: nextAlert?.priority === "Critical" ? "rgba(239,68,68,0.55)" : "rgba(255,255,255,0.15)",
        boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
        transition: "background 0.6s ease, color 0.4s ease, box-shadow .2s ease, transform .2s ease",
        "&:hover": { boxShadow: "0 12px 30px rgba(15,23,42,0.20)", transform: "translateY(-2px)" },
      }}
    >
      {/* Sun (day) / moon (night) disc + glow */}
      {(atmosphere.effect === "sun" || atmosphere.effect === "stars") && (
        <>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 18,
              right: 26,
              width: isDay ? 46 : 34,
              height: isDay ? 46 : 34,
              borderRadius: "50%",
              background: isDay
                ? "radial-gradient(circle at 40% 40%, #fff4c2 0%, #ffd24d 60%, #ffb020 100%)"
                : "radial-gradient(circle at 38% 38%, #ffffff 0%, #dfe7f2 55%, #b9c6da 100%)",
              boxShadow: isDay
                ? "0 0 26px 10px rgba(255,210,80,0.45)"
                : "0 0 20px 6px rgba(210,224,245,0.35)",
              pointerEvents: "none",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: -40,
              right: -30,
              width: 170,
              height: 170,
              borderRadius: "50%",
              background: isDay
                ? "radial-gradient(circle, rgba(255,214,102,0.35) 0%, rgba(255,214,102,0) 70%)"
                : "radial-gradient(circle, rgba(226,232,240,0.22) 0%, rgba(226,232,240,0) 70%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Cloud layer (soft, condition-dependent) */}
      {atmosphere.clouds && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "62%",
            background: atmosphere.clouds,
            filter: "blur(2px)",
            opacity: isDay ? 0.9 : 0.75,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Starfield for clear nights */}
      {atmosphere.effect === "stars" && <StarField />}

      {/* Rain / storm streaks */}
      {(atmosphere.effect === "rain" || atmosphere.effect === "storm") && <RainEffect heavy={atmosphere.effect === "storm"} />}

      {/* Snow */}
      {atmosphere.effect === "snow" && <SnowEffect />}

      {/* Horizon haze — soft band where sky meets land (depth) */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 78,
          height: 46,
          background: `linear-gradient(180deg, transparent 0%, ${atmosphere.haze} 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Farm landscape — layered ridges with field/tree hints */}
      <Box aria-hidden sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 108, pointerEvents: "none" }}>
        {/* Far ridge */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 44,
            height: 60,
            background: atmosphere.landscape.far,
            opacity: 0.75,
            borderTopLeftRadius: "60% 90%",
            borderTopRightRadius: "48% 80%",
          }}
        />
        {/* Mid ridge */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 26,
            height: 58,
            background: atmosphere.landscape.mid,
            opacity: 0.9,
            borderTopLeftRadius: "45% 80%",
            borderTopRightRadius: "65% 100%",
          }}
        />
        {/* Near field with subtle furrow texture */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 42,
            background: `repeating-linear-gradient(90deg, ${atmosphere.landscape.near} 0px, ${atmosphere.landscape.near} 14px, rgba(0,0,0,0.06) 15px, ${atmosphere.landscape.near} 16px), linear-gradient(180deg, ${atmosphere.landscape.mid} 0%, ${atmosphere.landscape.near} 100%)`,
            borderTopLeftRadius: "40% 60%",
            borderTopRightRadius: "40% 60%",
          }}
        />
        {/* A couple of tree silhouettes on the mid ridge */}
        <Box sx={{ position: "absolute", bottom: 40, left: "16%", width: 10, height: 16, bgcolor: atmosphere.landscape.near, borderRadius: "50% 50% 40% 40%", opacity: 0.9 }} />
        <Box sx={{ position: "absolute", bottom: 42, left: "78%", width: 12, height: 20, bgcolor: atmosphere.landscape.near, borderRadius: "50% 50% 40% 40%", opacity: 0.9 }} />
      </Box>

      {/* Vignette for atmospheric framing */}
      <Box aria-hidden sx={{ position: "absolute", inset: 0, background: atmosphere.vignette, pointerEvents: "none" }} />

      {/* Readability overlay */}
      <Box
        aria-hidden
        sx={{ position: "absolute", inset: 0, background: atmosphere.overlay, pointerEvents: "none" }}
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
              py: 0.25,
              mb: 0.5,
              borderRadius: 999,
              bgcolor: atmosphere.surface,
              border: "1px solid",
              borderColor: atmosphere.surfaceBorder,
              backdropFilter: "blur(3px)",
            }}
          >
            <Typography aria-hidden sx={{ fontSize: 12, lineHeight: 1 }}>
              {isDay ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </Typography>
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{ color: atmosphere.textColor, letterSpacing: 1, fontSize: "0.6rem" }}
            >
              {isDay ? "DAY" : "NIGHT"}
            </Typography>
          </Box>
          <Typography aria-hidden sx={{ fontSize: 46, lineHeight: 1 }}>
            {current?.icon || "\u2600\uFE0F"}
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1, color: atmosphere.textColor }}>
            {current?.temperature}°C
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ color: atmosphere.subTextColor }}>
            {current?.condition}
          </Typography>
          {current?.feelsLike != null && current.feelsLike !== current.temperature && (
            <Typography variant="caption" sx={{ color: atmosphere.subTextColor }}>
              Feels like {current.feelsLike}°
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
              label={`${current.windSpeed} km/h`}
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
              label={`${current.rainfall} mm`}
            />
          )}
        </Stack>

        {/* Severe alert warning banner (existing calculation) */}
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
                {(tomorrow.temperatureMax ?? tomorrow.temperature)}° / {tomorrow.temperatureMin ?? "\u2014"}°
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

function StarField() {
  // A few deterministic stars — subtle, non-animated to avoid distraction.
  const stars = [
    { top: "14%", left: "22%", s: 2 },
    { top: "20%", left: "60%", s: 1.5 },
    { top: "12%", left: "78%", s: 2.5 },
    { top: "30%", left: "40%", s: 1.5 },
    { top: "26%", left: "12%", s: 1.5 },
    { top: "34%", left: "88%", s: 2 },
  ];
  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((st, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            top: st.top,
            left: st.left,
            width: st.s,
            height: st.s,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 4px rgba(255,255,255,0.7)",
          }}
        />
      ))}
    </Box>
  );
}

function RainEffect({ heavy }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: heavy ? 0.45 : 0.3,
        backgroundImage:
          "repeating-linear-gradient(105deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 9px)",
        backgroundSize: "auto",
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 80%, transparent 100%)",
      }}
    />
  );
}

function SnowEffect() {
  const flakes = [
    { top: "10%", left: "18%" },
    { top: "22%", left: "48%" },
    { top: "16%", left: "72%" },
    { top: "34%", left: "30%" },
    { top: "40%", left: "62%" },
    { top: "28%", left: "86%" },
  ];
  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {flakes.map((f, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: 4,
            height: 4,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.9)",
          }}
        />
      ))}
    </Box>
  );
}
