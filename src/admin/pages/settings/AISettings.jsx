import { Box, Typography, Stack, Switch } from "@mui/material";
import { SmartToy, Psychology, Memory } from "@mui/icons-material";
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

export default function AISettings({ settings }) {
  const ai = settings?.ai || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <SmartToy sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        AI Configuration
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: `1px solid ${semantic.border}` }}>
          <Box><Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: semantic.text }}>AI Engine</Typography><Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>Master toggle for all AI features</Typography></Box>
          <Switch checked={!!ai.enabled} size="medium" disabled color="primary" />
        </Stack>
        <Toggle label="Briefings" on={ai.briefings} description="Daily AI-generated farm briefings" />
        <Toggle label="Recommendations" on={ai.recommendations} description="Smart action recommendations" />
        <Toggle label="Auto Refresh" on={ai.autoRefresh} description="Refresh AI data automatically" />
        <Row label="Confidence Threshold" value={ai.confidence ? `${ai.confidence}%` : null} />
      </FxCard>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Row label="Provider" value="OpenAI" />
        <Row label="Model" value="GPT-4o" />
        <Row label="Temperature" value="0.2" />
        <Row label="Memory" value="30 messages" />
        <Row label="Status" value={ai.enabled ? "Active" : "Disabled"} status={ai.enabled ? "success" : "warning"} />
      </FxCard>
    </Stack>
  );
}
