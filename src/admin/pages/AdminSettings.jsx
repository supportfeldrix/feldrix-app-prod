/**
 * ============================================================
 * Feldrix Control Centre — Settings (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip, Switch, Divider } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxCard, FxStatusChip, semantic, typography as typo, shadows, transitions } from "../../shared/design";
import { getPlatformSettings } from "../services/adminPlatformSettingsService";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() { setLoading(true); getPlatformSettings().then(setSettings).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Stack spacing={4}>
        <Box><Skeleton variant="rounded" height={32} width={220} /><Skeleton variant="rounded" height={18} width={360} sx={{ mt: 1 }} /></Box>
        <Stack spacing={2.5}>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />)}</Stack>
      </Stack>
    );
  }

  const s = settings || {};

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>Settings</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Platform configuration, branding, security, subscriptions and feature management.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={load} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Stack>

      {/* Settings Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SettingsSection title="🏢 Platform">
            <Row label="Name" value={s.platform?.name} />
            <Row label="Company" value={s.platform?.company} />
            <Row label="Support Email" value={s.platform?.supportEmail} />
            <Row label="Version" value={s.platform?.version} />
            <Row label="Environment" value={s.platform?.environment} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="🎨 Branding">
            <Row label="Primary" value={s.branding?.primaryColor} badge={s.branding?.primaryColor} />
            <Row label="Secondary" value={s.branding?.secondaryColor} badge={s.branding?.secondaryColor} />
            <Row label="Theme" value={s.branding?.theme} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="💳 Subscriptions">
            <Row label="Starter" value={`R${s.subscriptions?.starterPrice || 0}`} />
            <Row label="PRO" value={`R${s.subscriptions?.proPrice || 99}/mo`} />
            <Row label="Trial Days" value={s.subscriptions?.trialDays || "0"} />
            <Row label="Billing" value={s.subscriptions?.billingCycle || "monthly"} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="💰 PayFast">
            <Row label="Merchant ID" value={s.payfast?.merchantId || "Not set"} />
            <Row label="Mode" value={s.payfast?.sandbox ? "Sandbox" : "Live"} />
            <Row label="Status" value={s.payfast?.connected ? "Connected" : "Not connected"} status={s.payfast?.connected ? "healthy" : "warning"} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="🧠 AI">
            <Toggle label="AI Enabled" on={s.ai?.enabled} />
            <Toggle label="Briefings" on={s.ai?.briefings} />
            <Toggle label="Recommendations" on={s.ai?.recommendations} />
            <Toggle label="Auto Refresh" on={s.ai?.autoRefresh} />
            <Row label="Confidence" value={`${s.ai?.confidence || 70}%`} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="📨 Notifications">
            <Toggle label="Email" on={s.notifications?.email} />
            <Toggle label="Push" on={s.notifications?.push} />
            <Toggle label="SMS" on={s.notifications?.sms} />
            <Toggle label="Maintenance" on={s.notifications?.maintenance} />
            <Toggle label="Billing" on={s.notifications?.billing} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="🔐 Security">
            <Row label="Min Password" value={`${s.security?.passwordMinLength || 6} chars`} />
            <Row label="Session Timeout" value={`${s.security?.sessionTimeout || 30} min`} />
            <Row label="Failed Limit" value={s.security?.failedLoginLimit || 5} />
            <Toggle label="Email Verification" on={s.security?.emailVerification} />
            <Toggle label="MFA" on={s.security?.mfa} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="🌤️ Weather">
            <Row label="API Key" value={s.weather?.apiKey ? "Configured" : "Not set"} status={s.weather?.apiKey ? "healthy" : "warning"} />
            <Row label="Country" value={s.weather?.country || "ZA"} />
            <Row label="Refresh" value={`${s.weather?.refreshInterval || 30} min`} />
            <Row label="Connection" value={s.weather?.connected ? "Connected" : "—"} status={s.weather?.connected ? "healthy" : "inactive"} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12}>
          <SettingsSection title="🚩 Feature Flags">
            <Grid container spacing={0}>
              {Object.entries(s.featureFlags || {}).map(([key, enabled]) => (
                <Grid item xs={6} sm={4} md={3} key={key}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: enabled ? semantic.success : semantic.error }} />
                    <Typography sx={{ ...typo.bodySmall, color: semantic.text, textTransform: "capitalize" }}>{key}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="⚙️ System">
            <Toggle label="Maintenance Mode" on={s.system?.maintenanceMode} />
            <Row label="Version" value={s.system?.version || "1.0.0"} />
            <Row label="Release" value={s.system?.release || "Sprint 53"} />
          </SettingsSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <SettingsSection title="📋 Audit">
            <Row label="Retention" value={`${s.audit?.retentionDays || 90} days`} />
            <Row label="Level" value={s.audit?.level || "all"} />
            <Toggle label="Security Monitoring" on={s.audit?.securityMonitoring} />
          </SettingsSection>
        </Grid>
      </Grid>
    </Stack>
  );
}

function SettingsSection({ title, children }) {
  return (
    <FxCard sx={{ height: "100%" }}>
      <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 2 }}>{title}</Typography>
      <Stack spacing={0.25}>{children}</Stack>
    </FxCard>
  );
}

function Row({ label, value, badge, status }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {badge && <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: badge }} />}
        {status ? <FxStatusChip status={status} /> : <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{value ?? "—"}</Typography>}
      </Stack>
    </Stack>
  );
}

function Toggle({ label, on }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
      <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{label}</Typography>
      <Switch checked={!!on} size="small" disabled color="primary" />
    </Stack>
  );
}
