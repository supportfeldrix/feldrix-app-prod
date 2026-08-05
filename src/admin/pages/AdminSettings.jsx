/**
 * ============================================================
 * Feldrix Control Centre -- Enterprise Settings Control Centre
 * Sprint 54.1 + 54.2
 *
 * Two-column layout: sticky sidebar + dynamic workspace.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Skeleton, IconButton, Tooltip } from "@mui/material";
import { Refresh, Business, SmartToy, Palette, Payments, Security, Notifications, WbSunny, Extension, Flag, History, Settings } from "@mui/icons-material";
import { semantic, typography as typo, radius, shadows, transitions } from "../../shared/design";
import { getPlatformSettings } from "../services/adminPlatformSettingsService";

import GeneralSettings from "./settings/GeneralSettings";
import AISettings from "./settings/AISettings";
import BrandingSettings from "./settings/BrandingSettings";
import BillingSettings from "./settings/BillingSettings";
import SecuritySettings from "./settings/SecuritySettings";
import NotificationsSettings from "./settings/NotificationsSettings";
import WeatherSettings from "./settings/WeatherSettings";
import FeatureFlagsSettings from "./settings/FeatureFlagsSettings";
import AuditSettings from "./settings/AuditSettings";
import AdvancedSettings from "./settings/AdvancedSettings";

const SECTIONS = [
  { id: "general", label: "General", desc: "Platform information", Icon: Business },
  { id: "ai", label: "AI Platform", desc: "Feldrix Manager configuration", Icon: SmartToy },
  { id: "branding", label: "Branding", desc: "Logo, colours, theme", Icon: Palette },
  { id: "billing", label: "Billing", desc: "Subscriptions and payments", Icon: Payments },
  { id: "security", label: "Security", desc: "Authentication and access", Icon: Security },
  { id: "notifications", label: "Notifications", desc: "Email, push, SMS", Icon: Notifications },
  { id: "weather", label: "Weather", desc: "Weather API integration", Icon: WbSunny },
  { id: "integrations", label: "Feature Flags", desc: "Toggle platform features", Icon: Flag },
  { id: "audit", label: "Audit", desc: "Logging and retention", Icon: History },
  { id: "advanced", label: "Advanced", desc: "System and maintenance", Icon: Settings },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("general");

  function load() {
    setLoading(true);
    getPlatformSettings().then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: radius.xl }} />
        <Stack direction="row" spacing={3}>
          <Skeleton variant="rounded" width={260} height={500} sx={{ borderRadius: radius.xl }} />
          <Skeleton variant="rounded" sx={{ flex: 1, height: 500, borderRadius: radius.xl }} />
        </Stack>
      </Stack>
    );
  }

  const s = settings || {};

  function renderContent() {
    switch (active) {
      case "general": return <GeneralSettings settings={s} />;
      case "ai": return <AISettings settings={s} />;
      case "branding": return <BrandingSettings settings={s} />;
      case "billing": return <BillingSettings settings={s} />;
      case "security": return <SecuritySettings settings={s} />;
      case "notifications": return <NotificationsSettings settings={s} />;
      case "weather": return <WeatherSettings settings={s} />;
      case "integrations": return <FeatureFlagsSettings settings={s} />;
      case "audit": return <AuditSettings settings={s} />;
      case "advanced": return <AdvancedSettings settings={s} />;
      default: return <GeneralSettings settings={s} />;
    }
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Platform Administration</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>Platform configuration and enterprise management.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ px: 1.5, py: 0.4, borderRadius: radius.pill, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textTertiary }}>v{s.platform?.version || "1.0.0"}</Typography>
          </Box>
          <Box sx={{ px: 1.5, py: 0.4, borderRadius: radius.pill, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textTertiary }}>{s.platform?.environment || "production"}</Typography>
          </Box>
          <Tooltip title="Refresh settings">
            <IconButton onClick={load} size="small" sx={{ width: 36, height: 36, border: `1px solid ${semantic.border}`, borderRadius: radius.md }}>
              <Refresh sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Two-column layout */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", md: 260 }, flexShrink: 0, position: { md: "sticky" }, top: { md: 80 } }}>
          <Box sx={{ borderRadius: radius.xl, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, boxShadow: shadows.sm, overflow: "hidden", p: 1 }}>
            <Stack spacing={0.5}>
              {SECTIONS.map(({ id, label, desc, Icon }) => (
                <Box
                  key={id}
                  onClick={() => setActive(id)}
                  sx={{
                    px: 2, py: 1.5, borderRadius: radius.lg, cursor: "pointer",
                    bgcolor: active === id ? `${semantic.info}08` : "transparent",
                    border: active === id ? `1px solid ${semantic.info}20` : "1px solid transparent",
                    transition: transitions.fast,
                    "&:hover": { bgcolor: active === id ? `${semantic.info}08` : semantic.surface },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Icon sx={{ fontSize: 18, color: active === id ? semantic.info : semantic.textTertiary, transition: transitions.fast }} />
                    <Box>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: active === id ? 700 : 500, color: active === id ? semantic.info : semantic.text }}>{label}</Typography>
                      <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary, mt: 0.1 }}>{desc}</Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Content workspace */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ borderRadius: radius.xl, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, boxShadow: shadows.sm, p: { xs: 3, md: 4 }, minHeight: 500 }}>
            {renderContent()}
          </Box>
        </Box>
      </Stack>
    </Stack>
  );
}
