import { Stack, Typography } from "@mui/material";
import { Business, Email, Code, Cloud } from "@mui/icons-material";
import { FxCard, semantic, radius } from "../../../shared/design";

function Row({ label, value, status }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: status === "success" ? semantic.success : status === "warning" ? semantic.warning : semantic.text }}>{value || "--"}</Typography>
    </Stack>
  );
}

export default function GeneralSettings({ settings }) {
  const p = settings?.platform || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <Business sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        General Settings
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Row label="Platform Name" value={p.name} />
        <Row label="Company" value={p.company} />
        <Row label="Support Email" value={p.supportEmail} />
        <Row label="Version" value={p.version} />
        <Row label="Environment" value={p.environment} status={p.environment === "production" ? "success" : "warning"} />
      </FxCard>
    </Stack>
  );
}
