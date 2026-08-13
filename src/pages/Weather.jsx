/**
 * Feldrix — Weather Intelligence Page
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Full-page weather dashboard answering:
 *   "What should I do BEFORE the weather affects my farm?"
 *
 * Sections:
 *   1. Risk Score Banner — Farm Weather Risk with factors
 *   2. Current Conditions — Temperature, wind, humidity, pressure, UV
 *   3. Early Warnings — Countdown alerts with phase recommendations
 *   4. Hourly Forecast — Next 24h scrollable timeline
 *   5. 7-Day Forecast — Daily cards with min/max/condition
 *   6. Recommendations — Livestock / Crops / Machinery tabs
 *   7. Preparation Checklists — Interactive tick-off items
 *   8. Active Alerts — Detailed alert cards with advice
 */

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Air,
  DeviceThermostat,
  LocationOn,
  Opacity,
  Refresh,
  Visibility,
  WbSunny,
  WaterDrop,
  Speed,
  Thermostat,
} from "@mui/icons-material";

import {
  PremiumPageLayout,
  PremiumDashboardSection,
  PremiumCard,
  PremiumLoadingState,
  PremiumEmptyState,
  spacing,
  radius,
  transitions,
} from "../design";

import { useWeather } from "../context/WeatherContext";
import WeatherChecklist from "../components/weather/WeatherChecklist";
import EarlyWarningCountdown from "../components/weather/EarlyWarningCountdown";

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function RiskBanner({ risk }) {
  if (!risk) return null;

  const bgColor = {
    LOW: "rgba(34, 197, 94, 0.08)",
    MODERATE: "rgba(234, 179, 8, 0.08)",
    HIGH: "rgba(249, 115, 22, 0.08)",
    EXTREME: "rgba(239, 68, 68, 0.08)",
  }[risk.level] || "rgba(34, 197, 94, 0.08)";

  const borderColor = {
    LOW: "rgba(34, 197, 94, 0.3)",
    MODERATE: "rgba(234, 179, 8, 0.3)",
    HIGH: "rgba(249, 115, 22, 0.3)",
    EXTREME: "rgba(239, 68, 68, 0.3)",
  }[risk.level] || "rgba(34, 197, 94, 0.3)";

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: radius.cardLarge,
        border: `2px solid ${borderColor}`,
        bgcolor: bgColor,
        transition: transitions.hover,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography sx={{ fontSize: 48, lineHeight: 1 }}>{risk.emoji}</Typography>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: risk.color }}>
                {risk.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 500 }}>
                {risk.summary}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {risk.factors.slice(0, 4).map((f, i) => (
              <Chip
                key={i}
                label={f.message}
                size="small"
                sx={{
                  bgcolor: `${risk.color}15`,
                  color: risk.color,
                  fontWeight: 600,
                  fontSize: "0.72rem",
                }}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CurrentConditions({ weather }) {
  const current = weather?.current;
  if (!current || !current.updatedAt) return null;

  const details = [
    { icon: <Thermostat sx={{ fontSize: 18 }} />, label: "Feels Like", value: current.feelsLike != null ? `${current.feelsLike}\u00B0C` : "—" },
    { icon: <Air sx={{ fontSize: 18 }} />, label: "Wind", value: current.windSpeed != null ? `${current.windSpeed} km/h ${current.windDirection || ""}` : "—" },
    { icon: <Opacity sx={{ fontSize: 18 }} />, label: "Humidity", value: current.humidity != null ? `${current.humidity}%` : "—" },
    { icon: <WaterDrop sx={{ fontSize: 18 }} />, label: "Rainfall", value: current.rainfall != null ? `${current.rainfall} mm` : "0 mm" },
    { icon: <Speed sx={{ fontSize: 18 }} />, label: "Pressure", value: current.pressure ? `${current.pressure} hPa` : "—" },
    { icon: <Visibility sx={{ fontSize: 18 }} />, label: "Visibility", value: current.visibility ? `${current.visibility} km` : "—" },
    { icon: <WbSunny sx={{ fontSize: 18 }} />, label: "UV Index", value: current.uvIndex != null ? `${current.uvIndex}` : "—" },
    { icon: <DeviceThermostat sx={{ fontSize: 18 }} />, label: "Dew Point", value: current.dewPoint != null ? `${current.dewPoint}\u00B0C` : "—" },
  ];

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 56, lineHeight: 1 }}>{current.icon}</Typography>
          <Box>
            <Typography variant="h3" fontWeight={800} color="text.primary" sx={{ lineHeight: 1 }}>
              {current.temperature}\u00B0C
            </Typography>
            <Typography variant="body1" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
              {current.condition} {current.description && current.description !== current.condition ? `\u2014 ${current.description}` : ""}
            </Typography>
          </Box>
        </Stack>

        {current.locationName && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
            <LocationOn sx={{ fontSize: 14, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary">{current.locationName}</Typography>
            {current.updatedAt && (
              <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                Updated {new Date(current.updatedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            )}
          </Stack>
        )}

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {details.map((d) => (
            <Grid size={{ xs: 6, sm: 3 }} key={d.label}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ color: "text.disabled" }}>{d.icon}</Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {d.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary">
                    {d.value}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function HourlyForecast({ hourly }) {
  if (!hourly || hourly.length === 0) return null;

  // Show next 24 hours
  const hours = hourly.slice(0, 24);

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Hourly Forecast
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            pb: 1,
            "&::-webkit-scrollbar": { height: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 2 },
          }}
        >
          {hours.map((hour, i) => {
            const time = new Date(hour.time);
            const label = i === 0 ? "Now" : time.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
            return (
              <Box
                key={i}
                sx={{
                  minWidth: 72,
                  textAlign: "center",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: i === 0 ? "primary.main" : "transparent",
                  color: i === 0 ? "#fff" : "text.primary",
                  border: i === 0 ? "none" : "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, opacity: 0.7 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 22, my: 0.5 }}>{hour.icon}</Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  {hour.temperature}\u00B0
                </Typography>
                {hour.pop != null && hour.pop > 0 && (
                  <Typography sx={{ fontSize: "0.6rem", opacity: 0.7, mt: 0.5 }}>
                    \uD83D\uDCA7 {hour.pop}%
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function DailyForecast({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  const days = forecast.slice(0, 7);

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          7-Day Forecast
        </Typography>
        <Stack spacing={1}>
          {days.map((day, i) => {
            const date = new Date(day.date + "T12:00:00");
            const dayName = i === 0
              ? "Today"
              : i === 1
              ? "Tomorrow"
              : date.toLocaleDateString("en-ZA", { weekday: "short" });

            return (
              <Stack
                key={i}
                direction="row"
                alignItems="center"
                sx={{
                  py: 1.2,
                  px: 1.5,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "action.hover" },
                  transition: transitions.fast,
                }}
              >
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, width: 80, flexShrink: 0 }}>
                  {dayName}
                </Typography>
                <Typography sx={{ fontSize: 20, width: 36, textAlign: "center" }}>
                  {day.icon}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mx: 1.5, fontSize: "0.78rem" }}>
                  {day.condition}
                </Typography>
                {day.pop != null && day.pop > 0 && (
                  <Typography sx={{ fontSize: "0.7rem", color: "info.main", fontWeight: 600, mr: 2 }}>
                    \uD83D\uDCA7 {day.pop}%
                  </Typography>
                )}
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, width: 40, textAlign: "right" }}>
                  {day.temperatureMax}\u00B0
                </Typography>
                <Box sx={{ width: 60, mx: 1.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, ((day.temperatureMax - day.temperatureMin) / 30) * 100))}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "rgba(0,0,0,0.06)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        bgcolor: day.temperatureMax >= 35 ? "error.main" : day.temperatureMin <= 3 ? "info.main" : "primary.main",
                      },
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, width: 40, color: "text.secondary" }}>
                  {day.temperatureMin}\u00B0
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function RecommendationsPanel({ recommendations }) {
  const [tab, setTab] = useState(0);

  if (!recommendations) return null;

  const tabs = [
    { label: "\uD83D\uDC04 Livestock", data: recommendations.livestock },
    { label: "\uD83C\uDF31 Crops", data: recommendations.crops },
    { label: "\uD83D\uDE9C Machinery", data: recommendations.machinery },
    { label: "\uD83D\uDCCB General", data: recommendations.general },
  ];

  const activeTab = tabs[tab] || tabs[0];
  const items = activeTab.data || [];

  if (items.length === 0 && tabs.every((t) => (t.data || []).length === 0)) {
    return null; // No recommendations at all
  }

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Farm Recommendations
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            minHeight: 36,
            "& .MuiTab-root": { minHeight: 36, py: 0.5, fontSize: "0.78rem", textTransform: "none", fontWeight: 600 },
          }}
        >
          {tabs.map((t, i) => (
            <Tab key={i} label={`${t.label} (${(t.data || []).length})`} />
          ))}
        </Tabs>

        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            No recommendations for this category.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {items.map((item, i) => (
              <Stack
                key={i}
                direction="row"
                alignItems="flex-start"
                spacing={1.5}
                sx={{
                  py: 1.2,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: item.urgency === "critical" ? "rgba(239,68,68,0.05)" : item.urgency === "high" ? "rgba(249,115,22,0.04)" : "transparent",
                  border: "1px solid",
                  borderColor: item.urgency === "critical" ? "rgba(239,68,68,0.2)" : item.urgency === "high" ? "rgba(249,115,22,0.15)" : "divider",
                }}
              >
                <Typography sx={{ fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>
                  {item.icon || "\u2022"}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {item.message}
                  </Typography>
                  {item.animalType && item.animalType !== "all" && (
                    <Typography variant="caption" color="text.disabled">
                      Target: {item.animalType}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={item.urgency || "info"}
                  size="small"
                  sx={{
                    fontSize: "0.6rem",
                    height: 20,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    bgcolor:
                      item.urgency === "critical" ? "error.main"
                        : item.urgency === "high" ? "warning.main"
                          : item.urgency === "moderate" ? "info.main"
                            : "action.selected",
                    color: item.urgency === "critical" || item.urgency === "high" ? "#fff" : "text.primary",
                  }}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function AlertsPanel({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Active Weather Alerts
          </Typography>
          <Chip
            label={`${alerts.length} alert${alerts.length > 1 ? "s" : ""}`}
            size="small"
            color="error"
            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
          />
        </Stack>

        <Stack spacing={1.5}>
          {alerts.map((alert) => (
            <Box
              key={alert.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alert.color}30`,
                bgcolor: `${alert.color}08`,
                borderLeft: `4px solid ${alert.color}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 24 }}>{alert.icon}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {alert.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {alert.message}
                  </Typography>
                </Box>
                <Chip
                  label={alert.priority}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    bgcolor: alert.priority === "Critical" ? "error.main" : "warning.main",
                    color: "#fff",
                  }}
                />
              </Stack>

              {alert.advice && alert.advice.length > 0 && (
                <Box sx={{ mt: 1.5, pl: 4.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Recommended Actions
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                    {alert.advice.slice(0, 5).map((a, i) => (
                      <Typography key={i} variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                        \u2022 {a}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Weather() {
  const {
    weather,
    loading,
    error,
    risk,
    alerts,
    recommendations,
    insight,
    checklists,
    earlyWarnings,
    location,
    forceRefresh,
  } = useWeather();

  // Handle first load
  if (loading && !weather) {
    return (
      <PremiumPageLayout title="Weather Intelligence" subtitle="Loading weather data...">
        <PremiumLoadingState message="Fetching farm weather intelligence..." size={40} />
      </PremiumPageLayout>
    );
  }

  // No weather data available
  if (!weather?.available) {
    return (
      <PremiumPageLayout title="Weather Intelligence" subtitle="Farm weather intelligence powered by real-time data">
        <PremiumEmptyState
          title="Weather Unavailable"
          message="Configure your OpenWeatherMap API key (VITE_WEATHER_API_KEY) and weather location in Account → Farm Information to enable weather intelligence."
          icon="\u2601\uFE0F"
        />
      </PremiumPageLayout>
    );
  }

  return (
    <PremiumPageLayout
      title="Weather Intelligence"
      subtitle={insight || "Farm weather intelligence for today"}
    >
      <Stack spacing={spacing.sectionGap}>

        {/* HEADER ACTIONS */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationOn sx={{ fontSize: 16, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary">
              {weather.locationName || location || "Default Location"}
            </Typography>
            {weather.lastUpdated && (
              <Typography variant="caption" color="text.disabled">
                \u2022 Updated {new Date(weather.lastUpdated).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            )}
          </Stack>
          <Tooltip title="Refresh weather data">
            <IconButton onClick={forceRefresh} size="small" disabled={loading}>
              <Refresh sx={{ fontSize: 20, animation: loading ? "spin 1s linear infinite" : "none" }} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* RISK SCORE BANNER */}
        <RiskBanner risk={risk} />

        {/* EARLY WARNINGS (if any) */}
        {earlyWarnings.length > 0 && (
          <PremiumDashboardSection title="Early Warnings" description="Countdown to upcoming weather events">
            <EarlyWarningCountdown warnings={earlyWarnings} />
          </PremiumDashboardSection>
        )}

        {/* ACTIVE ALERTS */}
        {alerts.length > 0 && (
          <AlertsPanel alerts={alerts} />
        )}

        {/* CURRENT CONDITIONS */}
        <CurrentConditions weather={weather} />

        {/* HOURLY FORECAST */}
        <HourlyForecast hourly={weather.hourly} />

        {/* 7-DAY FORECAST */}
        <DailyForecast forecast={weather.forecast} />

        {/* RECOMMENDATIONS */}
        <RecommendationsPanel recommendations={recommendations} />

        {/* PREPARATION CHECKLISTS */}
        {checklists.length > 0 && (
          <PremiumDashboardSection title="Preparation Checklists" description="Tick items as you complete them">
            <WeatherChecklist checklists={checklists} />
          </PremiumDashboardSection>
        )}

      </Stack>

      {/* Refresh animation keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PremiumPageLayout>
  );
}
