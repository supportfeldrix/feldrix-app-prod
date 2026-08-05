import { Box, Typography, Stack, Switch } from "@mui/material";
import { Notifications, Email, Sms } from "@mui/icons-material";
import { FxCard, semantic, radius } from "../../../shared/design";

function Toggle({ label, on, description }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Box><Typography sx={{ fontSize: "0.82rem", color: semantic.text }}>{label}</Typography>{description && <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>{description}</Typography>}</Box>
      <Switch checked={!!on} size="small" disabled color="primary" />
    </Stack>
  );
}

export default function NotificationsSettings({ settings }) {
  const n = settings?.notifications || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <Notifications sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Notifications
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Toggle label="Email Notifications" on={n.email} description="Send alerts via email" />
        <Toggle label="Push Notifications" on={n.push} description="Browser push notifications" />
        <Toggle label="SMS Notifications" on={n.sms} description="Send alerts via SMS" />
        <Toggle label="Maintenance Alerts" on={n.maintenance} description="Notify on scheduled maintenance" />
        <Toggle label="Billing Alerts" on={n.billing} description="Payment and subscription alerts" />
        <Toggle label="System Alerts" on={true} description="Critical system notifications" />
      </FxCard>
    </Stack>
  );
}
