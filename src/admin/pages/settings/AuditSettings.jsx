import { Box, Typography, Stack, Switch } from "@mui/material";
import { History, Policy, Security } from "@mui/icons-material";
import { FxCard, semantic, radius } from "../../../shared/design";

function Row({ label, value, status }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: status === "success" ? semantic.success : status === "warning" ? semantic.warning : semantic.text }}>{value || "--"}</Typography>
    </Stack>
  );
}

function Toggle({ label, on, description }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Box><Typography sx={{ fontSize: "0.82rem", color: semantic.text }}>{label}</Typography>{description && <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>{description}</Typography>}</Box>
      <Switch checked={!!on} size="small" disabled color="primary" />
    </Stack>
  );
}

export default function AuditSettings({ settings }) {
  const a = settings?.audit || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <History sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Audit & Logging
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Row label="Retention Days" value={a.retentionDays ? `${a.retentionDays} days` : null} />
        <Row label="Log Level" value={a.level} />
        <Toggle label="Security Monitoring" on={a.securityMonitoring} description="Track security-related events" />
      </FxCard>
    </Stack>
  );
}
