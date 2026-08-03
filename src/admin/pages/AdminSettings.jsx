/**
 * ============================================================
 * Feldrix Control Centre — Enterprise Platform Settings
 * Sprint 53.0
 *
 * 12 configuration sections, all reading from platform_settings.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Grid, Typography, Stack, Skeleton, Chip, Switch, Divider } from "@mui/material";
import { FxPageLayout, FxCard, FxStatusChip, FxEmptyState, semantic, typography as typo } from "../../shared/design";
import { getPlatformSettings } from "../services/adminPlatformSettingsService";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformSettings().then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <FxPageLayout title="Platform Settings" subtitle="Loading...">
        <Stack spacing={2.5}>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: 3 }} />)}</Stack>
      </FxPageLayout>
    );
  }

  const s = settings || {};

  return (
    <FxPageLayout title="Platform Settings" subtitle="Configure branding, subscriptions, security, features and system operations.">
      <Stack spacing={3}>

        {/* Platform */}
        <SettingsCard title="🏢 Platform" icon="🏢">
          <SettingRow label="Platform Name" value={s.platform?.name} />
          <SettingRow label="Company" value={s.platform?.company} />
          <SettingRow label="Support Email" value={s.platform?.supportEmail} />
          <SettingRow label="Version" value={s.platform?.version} />
          <SettingRow label="Environment" value={s.platform?.environment} />
        </SettingsCard>

        {/* Branding */}
        <SettingsCard title="🎨 Branding">
          <SettingRow label="Primary Colour" value={s.branding?.primaryColor} badge={s.branding?.primaryColor} />
          <SettingRow label="Secondary Colour" value={s.branding?.secondaryColor} badge={s.branding?.secondaryColor} />
          <SettingRow label="Theme" value={s.branding?.theme} />
          <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, mt: 1 }}>Logo and favicon upload coming in Sprint 54.</Typography>
        </SettingsCard>

        {/* Subscriptions */}
        <SettingsCard title="💳 Subscriptions">
          <SettingRow label="Starter Plan" value={`R${s.subscriptions?.starterPrice || 0} (${s.subscriptions?.currency || "ZAR"})`} />
          <SettingRow label="PRO Plan" value={`R${s.subscriptions?.proPrice || 99}/month`} />
          <SettingRow label="Trial Days" value={s.subscriptions?.trialDays || "0"} />
          <SettingRow label="Billing Cycle" value={s.subscriptions?.billingCycle || "monthly"} />
        </SettingsCard>

        {/* PayFast */}
        <SettingsCard title="💰 PayFast">
          <SettingRow label="Merchant ID" value={s.payfast?.merchantId || "Not configured"} />
          <SettingRow label="Mode" value={s.payfast?.sandbox ? "Sandbox" : "Live"} />
          <SettingRow label="Connection" value={s.payfast?.connected ? "Connected" : "Not connected"} status={s.payfast?.connected ? "healthy" : "warning"} />
        </SettingsCard>

        {/* AI */}
        <SettingsCard title="🧠 Artificial Intelligence">
          <ToggleRow label="AI Enabled" enabled={s.ai?.enabled} />
          <ToggleRow label="Executive Briefings" enabled={s.ai?.briefings} />
          <ToggleRow label="Recommendations" enabled={s.ai?.recommendations} />
          <ToggleRow label="Auto Refresh" enabled={s.ai?.autoRefresh} />
          <SettingRow label="Confidence Threshold" value={`${s.ai?.confidence || 70}%`} />
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard title="📨 Notifications">
          <ToggleRow label="Email" enabled={s.notifications?.email} />
          <ToggleRow label="Push" enabled={s.notifications?.push} />
          <ToggleRow label="SMS" enabled={s.notifications?.sms} />
          <ToggleRow label="Maintenance" enabled={s.notifications?.maintenance} />
          <ToggleRow label="Marketing" enabled={s.notifications?.marketing} />
          <ToggleRow label="Billing" enabled={s.notifications?.billing} />
        </SettingsCard>

        {/* Weather */}
        <SettingsCard title="🌤️ Weather">
          <SettingRow label="API Key" value={s.weather?.apiKey ? "Configured" : "Not set"} status={s.weather?.apiKey ? "healthy" : "warning"} />
          <SettingRow label="Default Country" value={s.weather?.country || "ZA"} />
          <SettingRow label="Refresh Interval" value={`${s.weather?.refreshInterval || 30} min`} />
          <SettingRow label="Connection" value={s.weather?.connected ? "Connected" : "Disconnected"} status={s.weather?.connected ? "healthy" : "critical"} />
        </SettingsCard>

        {/* Security */}
        <SettingsCard title="🔐 Security">
          <SettingRow label="Password Min Length" value={s.security?.passwordMinLength || 6} />
          <SettingRow label="Session Timeout" value={`${s.security?.sessionTimeout || 30} min`} />
          <SettingRow label="Failed Login Limit" value={s.security?.failedLoginLimit || 5} />
          <ToggleRow label="Email Verification" enabled={s.security?.emailVerification} />
          <ToggleRow label="MFA" enabled={s.security?.mfa} />
        </SettingsCard>

        {/* Feature Flags */}
        <SettingsCard title="🚩 Feature Flags">
          <Grid container spacing={1}>
            {Object.entries(s.featureFlags || {}).map(([key, enabled]) => (
              <Grid item xs={6} sm={4} md={3} key={key}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: enabled ? semantic.success : semantic.error }} />
                  <Typography sx={{ ...typo.caption, color: semantic.text, textTransform: "capitalize" }}>{key}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </SettingsCard>

        {/* System */}
        <SettingsCard title="⚙️ System">
          <ToggleRow label="Maintenance Mode" enabled={s.system?.maintenanceMode} />
          <SettingRow label="Application Version" value={s.system?.version || "1.0.0"} />
          <SettingRow label="Current Release" value={s.system?.release || "Sprint 53"} />
        </SettingsCard>

        {/* Backups */}
        <SettingsCard title="💾 Backups">
          <SettingRow label="Last Backup" value={s.backups?.lastBackup || "Never"} />
          <SettingRow label="Health" value={s.backups?.health || "Unknown"} status={s.backups?.health === "healthy" ? "healthy" : "warning"} />
          <ToggleRow label="Auto Backup" enabled={s.backups?.autoBackup} />
          <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, mt: 1 }}>Manual backup and restore coming in Sprint 54.</Typography>
        </SettingsCard>

        {/* Audit Settings */}
        <SettingsCard title="📋 Audit">
          <SettingRow label="Retention Period" value={`${s.audit?.retentionDays || 90} days`} />
          <SettingRow label="Audit Level" value={s.audit?.level || "all"} />
          <ToggleRow label="Security Monitoring" enabled={s.audit?.securityMonitoring} />
        </SettingsCard>

      </Stack>
    </FxPageLayout>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function SettingsCard({ title, children }) {
  return (
    <FxCard>
      <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 2 }}>{title}</Typography>
      <Stack spacing={0.25}>{children}</Stack>
    </FxCard>
  );
}

function SettingRow({ label, value, badge, status }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {badge && <Box sx={{ width: 14, height: 14, borderRadius: "3px", bgcolor: badge }} />}
        {status && <FxStatusChip status={status} />}
        {!status && <Typography sx={{ ...typo.bodySmall, fontWeight: 600, color: semantic.text }}>{value ?? "—"}</Typography>}
      </Stack>
    </Stack>
  );
}

function ToggleRow({ label, enabled }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
      <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>{label}</Typography>
      <Switch checked={!!enabled} size="small" disabled color="primary" />
    </Stack>
  );
}
