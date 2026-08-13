/**
 * Feldrix v1.2 — Weather Notification Settings
 *
 * Per-alert-type toggle settings panel.
 * Allows farmers to independently enable/disable:
 *   - Freeze, Frost, Storm, Heavy Rain, Lightning, Heatwave, Wind, Fire Danger
 *   - Livestock Alerts, Crop Alerts, Machinery Alerts
 *   - Morning Farm Brief (with time)
 *
 * Settings are persisted in localStorage and synced to Supabase.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { radius, transitions } from "../../design/tokens";

import {
  getSettings,
  saveSettings,
  getPermissionStatus,
  isPushSupported,
  clearCooldowns,
} from "../../services/pushNotificationService";

// ═══════════════════════════════════════════════════════════════════════════════
// SETTING DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const WEATHER_ALERTS = [
  { key: "freeze", label: "Freeze", icon: "❄️", description: "Temperature ≤ 0°C" },
  { key: "frost", label: "Frost", icon: "🌨️", description: "Temperature ≤ 3°C" },
  { key: "storm", label: "Storms", icon: "⛈️", description: "Thunderstorm activity" },
  { key: "heavy_rain", label: "Heavy Rain", icon: "🌧️", description: "Rainfall ≥ 30mm" },
  { key: "flood", label: "Flood", icon: "🌊", description: "Rainfall ≥ 50mm" },
  { key: "lightning", label: "Lightning", icon: "⚡", description: "Lightning risk" },
  { key: "heatwave", label: "Heatwave", icon: "🔥", description: "Temperature ≥ 35°C" },
  { key: "wind", label: "Strong Wind", icon: "💨", description: "Wind ≥ 40 km/h" },
  { key: "hail", label: "Hail", icon: "🧊", description: "Hail expected" },
  { key: "fire_danger", label: "Fire Danger", icon: "🔥", description: "Extreme fire conditions" },
];

const FARM_ALERTS = [
  { key: "livestock_alerts", label: "Livestock Alerts", icon: "🐄", description: "Weather affecting livestock" },
  { key: "crop_alerts", label: "Crop Alerts", icon: "🌾", description: "Weather affecting crops" },
  { key: "machinery_alerts", label: "Machinery Alerts", icon: "🚜", description: "Weather affecting machinery" },
];

const SCHEDULED = [
  { key: "morning_brief", label: "Morning Farm Brief", icon: "☀️", description: "Daily 07:00 weather summary" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WeatherNotificationSettings() {
  const [settings, setSettingsState] = useState(() => getSettings());
  const [permissionStatus, setPermissionStatus] = useState(() => getPermissionStatus());

  // Update when permission changes externally
  useEffect(() => {
    const interval = setInterval(() => {
      setPermissionStatus(getPermissionStatus());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = useCallback((key) => {
    setSettingsState((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const handleMasterToggle = useCallback(() => {
    setSettingsState((prev) => {
      const updated = { ...prev, enabled: !prev.enabled };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const isSupported = isPushSupported();
  const isGranted = permissionStatus === "granted";
  const isEnabled = settings.enabled && isGranted;

  return (
    <Card elevation={0} sx={{ borderRadius: radius.card, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Weather Notification Settings
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Choose which weather alerts send push notifications to your device.
            </Typography>
          </Box>
          <Chip
            label={isEnabled ? "Active" : isGranted ? "Paused" : "Disabled"}
            size="small"
            color={isEnabled ? "success" : "default"}
            variant={isEnabled ? "filled" : "outlined"}
            sx={{ fontWeight: 700, fontSize: "0.65rem" }}
          />
        </Stack>

        {/* Permission Warning */}
        {!isSupported && (
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", mb: 2 }}>
            <Typography variant="body2" color="error.main" fontWeight={600}>
              Push notifications are not supported in this browser.
            </Typography>
          </Box>
        )}

        {isSupported && !isGranted && (
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", mb: 2 }}>
            <Typography variant="body2" color="warning.dark" fontWeight={600}>
              Notification permission not granted. Enable notifications from your browser settings.
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Master Toggle */}
        <SettingRow
          label="Push Notifications"
          description="Master toggle for all weather push notifications"
          icon="🔔"
          checked={settings.enabled}
          onChange={handleMasterToggle}
          disabled={!isGranted}
          bold
        />

        <Divider sx={{ my: 2 }} />

        {/* Weather Alerts */}
        <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
          Weather Alerts
        </Typography>
        <Stack spacing={0.5}>
          {WEATHER_ALERTS.map((item) => (
            <SettingRow
              key={item.key}
              label={item.label}
              description={item.description}
              icon={item.icon}
              checked={settings[item.key] !== false}
              onChange={() => handleToggle(item.key)}
              disabled={!isEnabled}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Farm Alerts */}
        <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
          Farm Alerts
        </Typography>
        <Stack spacing={0.5}>
          {FARM_ALERTS.map((item) => (
            <SettingRow
              key={item.key}
              label={item.label}
              description={item.description}
              icon={item.icon}
              checked={settings[item.key] !== false}
              onChange={() => handleToggle(item.key)}
              disabled={!isEnabled}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Scheduled */}
        <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
          Scheduled Notifications
        </Typography>
        <Stack spacing={0.5}>
          {SCHEDULED.map((item) => (
            <SettingRow
              key={item.key}
              label={item.label}
              description={item.description}
              icon={item.icon}
              checked={settings[item.key] !== false}
              onChange={() => handleToggle(item.key)}
              disabled={!isEnabled}
            />
          ))}
        </Stack>

        {/* Reset cooldowns (for testing) */}
        <Divider sx={{ my: 2 }} />
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ cursor: "pointer", "&:hover": { color: "text.secondary" } }}
          onClick={clearCooldowns}
        >
          Reset notification cooldowns (for testing)
        </Typography>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTING ROW
// ═══════════════════════════════════════════════════════════════════════════════

function SettingRow({ label, description, icon, checked, onChange, disabled, bold }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        py: 1,
        px: 1.5,
        borderRadius: 1.5,
        transition: transitions.fast,
        opacity: disabled ? 0.5 : 1,
        "&:hover": { bgcolor: disabled ? "transparent" : "action.hover" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{icon}</Typography>
        <Box>
          <Typography variant="body2" fontWeight={bold ? 700 : 600} color="text.primary">
            {label}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      <Switch
        size="small"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        color="primary"
      />
    </Stack>
  );
}
