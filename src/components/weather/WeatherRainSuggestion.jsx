/**
 * Feldrix — Weather-service Rainfall Suggestion
 *
 * When the EXISTING weather data (useWeather) indicates meaningful
 * precipitation, offer the farmer a one-tap way to LOG it — but never
 * write anything automatically. The farmer must confirm, and can change
 * the amount before saving.
 *
 * Wording is deliberately "Weather data indicates…" (not "your farm
 * received…") because weather-service precipitation can be inaccurate
 * for an individual farm.
 *
 * De-duplication (lightweight, no new infrastructure):
 *   - Not shown if the farmer already has a rainfall log for today.
 *   - Not shown if dismissed for today (sessionStorage flag).
 *   - Reuses existing weather data — no extra weather API request.
 */

import { useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

import { useWeather } from "../../context/WeatherContext";

// Minimum precipitation (mm) worth suggesting — avoids nagging for a
// cloudy sky with trace/zero precipitation.
const MIN_MEANINGFUL_MM = 1;

function localTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeatherRainSuggestion({ logs = [], onLog }) {
  const { weather } = useWeather();
  const todayISO = localTodayISO();
  const dismissKey = `feldrix_rain_suggestion_dismissed_${todayISO}`;

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });

  // Weather-service precipitation for today (from existing data only).
  const suggestedMm = useMemo(() => {
    const mm = Number(weather?.current?.rainfall);
    return Number.isFinite(mm) ? Math.round(mm * 10) / 10 : 0;
  }, [weather]);

  // Already logged rainfall for today? (any farmer record dated today)
  const alreadyLoggedToday = useMemo(
    () => (logs || []).some((r) => r.rainfall_date === todayISO),
    [logs, todayISO]
  );

  const shouldShow =
    weather?.available &&
    suggestedMm >= MIN_MEANINGFUL_MM &&
    !alreadyLoggedToday &&
    !dismissed;

  if (!shouldShow) return null;

  function handleDismiss() {
    try {
      sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* non-blocking */
    }
    setDismissed(true);
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "rgba(25,118,210,0.35)",
        bgcolor: "rgba(25,118,210,0.05)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <WaterDropIcon sx={{ color: "#1976D2", mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F2740" }}>
              🌧️ Rain detected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Weather data indicates approximately <strong>{suggestedMm} mm</strong> of
              precipitation around your farm today. Did rain actually fall on your farm?
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => onLog?.({ amount: suggestedMm, prefillAmount: true })}
                sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
              >
                Log {suggestedMm} mm
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onLog?.({ amount: null, prefillAmount: false })}
                sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
              >
                Enter Amount
              </Button>
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={handleDismiss}
                sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", color: "text.secondary" }}
              >
                Dismiss
              </Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
