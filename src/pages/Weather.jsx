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
import { useLocation as useRouterLocation } from "react-router-dom";
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
import { getWeatherHistory, getWeatherHistorySummary } from "../services/weatherService";
import WeatherChecklist from "../components/weather/WeatherChecklist";
import EarlyWarningCountdown from "../components/weather/EarlyWarningCountdown";
import WeatherNotificationSettings from "../components/weather/WeatherNotificationSettings";

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
    { icon: <Thermostat sx={{ fontSize: 18 }} />, label: "Feels Like", value: current.feelsLike != null ? `${current.feelsLike}°C` : "—" },
    { icon: <Air sx={{ fontSize: 18 }} />, label: "Wind", value: current.windSpeed != null ? `${current.windSpeed} km/h ${current.windDirection || ""}` : "—" },
    { icon: <Opacity sx={{ fontSize: 18 }} />, label: "Humidity", value: current.humidity != null ? `${current.humidity}%` : "—" },
    { icon: <WaterDrop sx={{ fontSize: 18 }} />, label: "Rainfall", value: current.rainfall != null ? `${current.rainfall} mm` : "0 mm" },
    { icon: <Speed sx={{ fontSize: 18 }} />, label: "Pressure", value: current.pressure ? `${current.pressure} hPa` : "—" },
    { icon: <Visibility sx={{ fontSize: 18 }} />, label: "Visibility", value: current.visibility ? `${current.visibility} km` : "—" },
    { icon: <WbSunny sx={{ fontSize: 18 }} />, label: "UV Index", value: current.uvIndex != null ? `${current.uvIndex}` : "—" },
    { icon: <DeviceThermostat sx={{ fontSize: 18 }} />, label: "Dew Point", value: current.dewPoint != null ? `${current.dewPoint}°C` : "—" },
  ];

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 56, lineHeight: 1 }}>{current.icon}</Typography>
          <Box>
            <Typography variant="h3" fontWeight={800} color="text.primary" sx={{ lineHeight: 1 }}>
              {current.temperature}°C
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
                  {hour.temperature}°
                </Typography>
                {hour.pop != null && hour.pop > 0 && (
                  <Typography sx={{ fontSize: "0.6rem", opacity: 0.7, mt: 0.5 }}>
                    💧 {hour.pop}%
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
                    💧 {day.pop}%
                  </Typography>
                )}
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, width: 40, textAlign: "right" }}>
                  {day.temperatureMax}°
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
                  {day.temperatureMin}°
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
    { label: "🐄 Livestock", data: recommendations.livestock },
    { label: "🌱 Crops", data: recommendations.crops },
    { label: "🚜 Machinery", data: recommendations.machinery },
    { label: "📋 General", data: recommendations.general },
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
                  {item.icon || "•"}
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
                        • {a}
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
// WEATHER HISTORY PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function WeatherHistoryPanel() {
  const history = getWeatherHistory();
  const summary = getWeatherHistorySummary();

  if (!history || history.length < 2) {
    return (
      <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Weather History</Typography>
          <Typography variant="body2" color="text.secondary">
            History will appear once weather data has been collected over time. Check back after 24 hours.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Split history into last 24h and 7d
  const now = Date.now();
  const last24h = history.filter((h) => now - new Date(h.timestamp).getTime() < 24 * 60 * 60 * 1000);
  const last24hSummary = summarizeEntries(last24h);

  const confidenceColor = summary.periodDays >= 5 ? "success.main" : summary.periodDays >= 2 ? "warning.main" : "text.disabled";

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Weather History</Typography>
          <Typography variant="caption" color={confidenceColor} fontWeight={600}>
            {summary.entries} readings over {summary.periodDays} day{summary.periodDays !== 1 ? "s" : ""}
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          {/* Last 24 Hours */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "rgba(0,0,0,0.01)" }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                Last 24 Hours
              </Typography>
              {last24h.length > 0 ? (
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  <HistoryRow label="Temperature" value={`${last24hSummary.minTemp}° – ${last24hSummary.maxTemp}°`} icon="🌡️" />
                  <HistoryRow label="Rainfall" value={`${last24hSummary.totalRainfall} mm`} icon="🌧️" />
                  <HistoryRow label="Wind" value={`Avg ${last24hSummary.avgWind} km/h`} icon="💨" />
                  <HistoryRow label="Humidity" value={`Avg ${last24hSummary.avgHumidity}%`} icon="💧" />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No data yet for last 24h</Typography>
              )}
            </Box>
          </Grid>

          {/* All-Time (up to 7 days) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "rgba(0,0,0,0.01)" }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                Last {summary.periodDays} Day{summary.periodDays !== 1 ? "s" : ""}
              </Typography>
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                <HistoryRow label="Temperature" value={`${summary.minTemp ?? "—"}° – ${summary.maxTemp ?? "—"}°`} icon="🌡️" />
                <HistoryRow label="Total Rainfall" value={`${summary.totalRainfall} mm`} icon="🌧️" />
                <HistoryRow label="Avg Wind" value={`${summary.avgWind ?? "—"} km/h`} icon="💨" />
                <HistoryRow label="Avg Humidity" value={`${summary.avgHumidity ?? "—"}%`} icon="💧" />
                <HistoryRow label="Avg Temperature" value={`${summary.avgTemp ?? "—"}°C`} icon="📊" />
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function HistoryRow({ label, value, icon }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{ fontSize: 14 }}>{icon}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.78rem" }}>{label}</Typography>
      </Stack>
      <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontSize: "0.82rem" }}>{value}</Typography>
    </Stack>
  );
}

function summarizeEntries(entries) {
  if (!entries || entries.length === 0) {
    return { minTemp: "—", maxTemp: "—", totalRainfall: 0, avgWind: "—", avgHumidity: "—" };
  }
  const temps = entries.filter((e) => e.temperature != null).map((e) => e.temperature);
  const winds = entries.filter((e) => e.windSpeed != null).map((e) => e.windSpeed);
  const humidities = entries.filter((e) => e.humidity != null).map((e) => e.humidity);
  const rainfall = entries.reduce((sum, e) => sum + (e.rainfall || 0), 0);

  return {
    minTemp: temps.length > 0 ? Math.min(...temps) : "—",
    maxTemp: temps.length > 0 ? Math.max(...temps) : "—",
    totalRainfall: Math.round(rainfall * 10) / 10,
    avgWind: winds.length > 0 ? Math.round(winds.reduce((a, b) => a + b, 0) / winds.length) : "—",
    avgHumidity: humidities.length > 0 ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length) : "—",
  };
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
    farmName,
    forceRefresh,
    refreshStatus,
    lastUpdated,
    nextRefresh,
    provider,
    isOffline,
    confidence,
  } = useWeather();

  // Deep-link scrolling — scroll to alerts section when navigated from notification
  const routerLocation = useRouterLocation();
  useEffect(() => {
    if (routerLocation.hash === "#alerts" || routerLocation.search?.includes("section=alerts")) {
      setTimeout(() => {
        const el = document.getElementById("weather-alerts");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [routerLocation]);

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
      title=""
      subtitle=""
    >
      <Stack spacing={spacing.sectionGap}>

        {/* PAGE HEADER — Farm Name, Location, Risk, Provider, Timestamps */}
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              {farmName && (
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem" }}>
                  {farmName}
                </Typography>
              )}
              <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                Weather Intelligence
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <LocationOn sx={{ fontSize: 14, color: "text.disabled" }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {weather.locationName || location || "No location set"}
                </Typography>
                {risk && (
                  <Chip
                    label={`${risk.emoji} ${risk.label}`}
                    size="small"
                    sx={{
                      ml: 1,
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      height: 22,
                      bgcolor: `${risk.color}15`,
                      color: risk.color,
                      border: `1px solid ${risk.color}30`,
                    }}
                  />
                )}
              </Stack>
            </Box>
            <Tooltip title="Refresh weather data">
              <IconButton onClick={forceRefresh} size="small" disabled={loading}>
                <Refresh sx={{ fontSize: 22, animation: loading ? "spin 1s linear infinite" : "none" }} />
              </IconButton>
            </Tooltip>
          </Stack>
          {insight && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 600 }}>
              {insight}
            </Typography>
          )}
        </Box>

        {/* REFRESH STATUS BANNER */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ minHeight: 20 }}>
          {refreshStatus === "refreshing" && (
            <Typography variant="caption" color="info.main" fontWeight={600}>Refreshing...</Typography>
          )}
          {refreshStatus === "success" && (
            <Typography variant="caption" color="success.main" fontWeight={600}>Weather Updated Successfully</Typography>
          )}
          {refreshStatus === "error" && (
            <Typography variant="caption" color="error.main" fontWeight={600}>Refresh failed — using last known data</Typography>
          )}
          {isOffline && refreshStatus === "idle" && (
            <Chip label="Using Last Known Forecast" size="small" color="warning" variant="outlined" sx={{ fontSize: "0.65rem", height: 22 }} />
          )}
        </Stack>

        {/* STATUS BAR — Provider, Updated, Next Refresh, Confidence */}
        <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider", bgcolor: "rgba(0,0,0,0.01)" }}>
          <CardContent sx={{ py: 1.5, px: 2.5, "&:last-child": { pb: 1.5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
                {/* Provider */}
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Weather Provider
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                    {provider}
                  </Typography>
                </Box>
                {/* Last Updated */}
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                    {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </Typography>
                </Box>
                {/* Next Refresh */}
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Next Refresh
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                    {nextRefresh ? new Date(nextRefresh).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </Typography>
                </Box>
              </Stack>
              {/* Forecast Confidence */}
              <Chip
                label={`Confidence: ${confidence?.level || "—"}`}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  height: 24,
                  bgcolor:
                    confidence?.level === "High" ? "rgba(34,197,94,0.1)"
                      : confidence?.level === "Medium" ? "rgba(234,179,8,0.1)"
                        : "rgba(239,68,68,0.1)",
                  color:
                    confidence?.level === "High" ? "success.main"
                      : confidence?.level === "Medium" ? "warning.main"
                        : "error.main",
                  border: "1px solid",
                  borderColor:
                    confidence?.level === "High" ? "success.light"
                      : confidence?.level === "Medium" ? "warning.light"
                        : "error.light",
                }}
              />
            </Stack>
            {confidence?.reason && (
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block", fontSize: "0.65rem" }}>
                {confidence.reason}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* OFFLINE WARNING */}
        {isOffline && (
          <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "warning.light", bgcolor: "rgba(234,179,8,0.04)" }}>
            <CardContent sx={{ py: 1.5, px: 2.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontSize: 16 }}>⚠️</Typography>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="warning.dark">
                    Unable to refresh weather
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Using cached forecast. Last successful update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "Unknown"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

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
          <Box id="weather-alerts">
            <AlertsPanel alerts={alerts} />
          </Box>
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

        {/* WEATHER HISTORY */}
        <PremiumDashboardSection title="Weather History" description="Historical weather data for your farm">
          <WeatherHistoryPanel />
        </PremiumDashboardSection>

        {/* NOTIFICATION SETTINGS */}
        <PremiumDashboardSection title="Notification Settings" description="Control which weather alerts notify you">
          <WeatherNotificationSettings />
        </PremiumDashboardSection>

        {/* POWERED BY ATTRIBUTION */}
        <Stack direction="row" justifyContent="center" sx={{ pt: 2, pb: 1 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
            Powered by {provider} • Architecture supports SAWS, WeatherAPI, Tomorrow.io
          </Typography>
        </Stack>

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
