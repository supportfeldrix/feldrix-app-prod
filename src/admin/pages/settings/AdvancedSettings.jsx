import { Box, Typography, Stack, Switch } from "@mui/material";
import { Settings, Build, Storage } from "@mui/icons-material";
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

export default function AdvancedSettings({ settings }) {
  const sys = settings?.system || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <Settings sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Advanced
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Toggle label="Maintenance Mode" on={sys.maintenanceMode} description="Take platform offline for updates" />
        <Row label="Version" value={sys.version} />
        <Row label="Release" value={sys.release} />
        <Row label="Database" value="Supabase" status="success" />
        <Row label="Cache" value="--" />
      </FxCard>
    </Stack>
  );
}
