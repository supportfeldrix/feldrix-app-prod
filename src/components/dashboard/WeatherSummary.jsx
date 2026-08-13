/**
 * Feldrix — Weather Summary Dashboard Card
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * This card answers: "What should I do today?"
 *
 * Displays:
 *   - Current temperature & conditions
 *   - Farm Weather Risk Score (color-coded)
 *   - Today's top recommendation
 *   - Tomorrow's outlook
 *   - Next severe alert (if any)
 *   - Link to full Weather Intelligence page
 */

import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { radius, transitions } from "../../design/tokens";

import { useWeather } from "../../context/WeatherContext";

export default function WeatherSummary({ weather: legacyWeather }) {
  const navigate = useNavigate();

  // Use WeatherContext for intelligence data
  const {
    weather: contextWeather,
    risk,
    alerts,
    insight,
    recommendations,
  } = useWeather();

  // Prefer context data, fallback to prop for backwards compatibility
  const weather = contextWeather || legacyWeather;

  // Get top recommendation for today
  const topRecommendation = getTopRecommendation(recommendations);

  // Get next severe alert
  const nextAlert = alerts && alerts.length > 0 ? alerts[0] : null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: radius.card,
        height: "100%",
        border: "1px solid",
        borderColor: nextAlert?.priority === "Critical" ? "error.light" : "divider",
        transition: transitions.hover,
        cursor: "pointer",
        "&:hover": { boxShadow: 2, transform: "translateY(-2px)" },
      }}
      onClick={() => navigate("/weather")}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CloudIcon sx={{ fontSize: 20, color: "info.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Weather
            </Typography>
          </Stack>
          {risk && (
            <Chip
              label={risk.label}
              size="small"
              sx={{
                bgcolor: `${risk.color}18`,
                color: risk.color,
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 22,
              }}
            />
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {weather?.available ? (
          <Stack spacing={2}>
            {/* Current Weather */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ fontSize: 40, lineHeight: 1 }}>
                {weather.current?.icon || "\u2600\uFE0F"}
              </Typography>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ lineHeight: 1 }}>
                  {weather.current?.temperature}\u00B0C
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                  {weather.current?.condition}
                  {weather.current?.feelsLike != null && weather.current.feelsLike !== weather.current.temperature && (
                    <> \u2022 Feels {weather.current.feelsLike}\u00B0</>
                  )}
                </Typography>
              </Box>
            </Stack>

            {/* Quick Stats */}
            <Stack direction="row" spacing={2} sx={{ opacity: 0.8 }}>
              {weather.current?.windSpeed != null && (
                <Typography variant="caption" color="text.secondary">
                  \uD83D\uDCA8 {weather.current.windSpeed} km/h
                </Typography>
              )}
              {weather.current?.humidity != null && (
                <Typography variant="caption" color="text.secondary">
                  \uD83D\uDCA7 {weather.current.humidity}%
                </Typography>
              )}
              {weather.current?.rainfall != null && weather.current.rainfall > 0 && (
                <Typography variant="caption" color="text.secondary">
                  \uD83C\uDF27\uFE0F {weather.current.rainfall} mm
                </Typography>
              )}
            </Stack>

            {/* Next Severe Alert (if any) */}
            {nextAlert && (
              <>
                <Divider />
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    py: 1,
                    px: 1.5,
                    borderRadius: 2,
                    bgcolor: nextAlert.priority === "Critical" ? "rgba(239,68,68,0.06)" : "rgba(249,115,22,0.05)",
                    border: "1px solid",
                    borderColor: nextAlert.priority === "Critical" ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.15)",
                  }}
                >
                  <WarningAmberIcon
                    sx={{
                      fontSize: 16,
                      color: nextAlert.priority === "Critical" ? "error.main" : "warning.main",
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        color: nextAlert.priority === "Critical" ? "error.main" : "warning.main",
                        display: "block",
                      }}
                    >
                      {nextAlert.icon} {nextAlert.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {nextAlert.advice?.[0] || nextAlert.message}
                    </Typography>
                  </Box>
                </Stack>
              </>
            )}

            {/* Today's Recommendation */}
            {topRecommendation && !nextAlert && (
              <>
                <Divider />
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TipsAndUpdatesIcon sx={{ fontSize: 16, color: "warning.main", mt: 0.2 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.disabled"
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Today's Advice
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>
                      {topRecommendation}
                    </Typography>
                  </Box>
                </Stack>
              </>
            )}

            {/* Weather Insight (fallback if no alert or recommendation) */}
            {!nextAlert && !topRecommendation && insight && (
              <>
                <Divider />
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TipsAndUpdatesIcon sx={{ fontSize: 16, color: "warning.main", mt: 0.2 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.disabled"
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Weather Insight
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>
                      {insight}
                    </Typography>
                  </Box>
                </Stack>
              </>
            )}

            {/* Tomorrow Outlook */}
            {weather.forecast?.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Tomorrow
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.primary">
                      {weather.forecast[0]?.icon} {weather.forecast[0]?.temperatureMax ?? weather.forecast[0]?.temperature}\u00B0 / {weather.forecast[0]?.temperatureMin ?? "—"}\u00B0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {weather.forecast[0]?.condition}
                    </Typography>
                    {weather.forecast[0]?.pop > 0 && (
                      <Typography variant="caption" color="info.main" fontWeight={600}>
                        \uD83D\uDCA7 {weather.forecast[0].pop}%
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </>
            )}

            {/* View More Link */}
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ pt: 0.5 }}>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                View Weather Intelligence
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: 12, color: "primary.main" }} />
            </Stack>
          </Stack>
        ) : (
          /* Empty State */
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CloudIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {weather?.locationError ? "Location Not Found" : "Weather Unavailable"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {weather?.locationError
                ? "Update your Weather Location in Account \u2192 Farm Information."
                : "Configure an API key to enable weather intelligence."}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract the single most important recommendation for today.
 * Prioritizes: critical livestock → critical crops → high urgency → moderate.
 */
function getTopRecommendation(recommendations) {
  if (!recommendations) return null;

  const all = [
    ...(recommendations.livestock || []),
    ...(recommendations.crops || []),
    ...(recommendations.machinery || []),
    ...(recommendations.general || []),
  ];

  if (all.length === 0) return null;

  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
  all.sort((a, b) => (urgencyOrder[a.urgency] ?? 5) - (urgencyOrder[b.urgency] ?? 5));

  return all[0]?.message || null;
}
