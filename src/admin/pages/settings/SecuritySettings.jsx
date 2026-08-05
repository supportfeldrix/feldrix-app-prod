import { Box, Typography, Stack, Switch } from "@mui/material";
import { Security, Lock, Shield } from "@mui/icons-material";
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

export default function SecuritySettings({ settings }) {
  const sec = settings?.security || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <Security sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Security
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Row label="Min Password Length" value={sec.passwordMinLength} />
        <Row label="Session Timeout" value={sec.sessionTimeout ? `${sec.sessionTimeout} min` : null} />
        <Row label="Failed Login Limit" value={sec.failedLoginLimit} />
        <Toggle label="Email Verification" on={sec.emailVerification} description="Require email verification on signup" />
        <Toggle label="Multi-Factor Auth" on={sec.mfa} description="Enforce MFA for all users" />
      </FxCard>
    </Stack>
  );
}
