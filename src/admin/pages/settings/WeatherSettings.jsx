import { Stack, Typography } from "@mui/material";
import { WbSunny, Cloud, Thermostat } from "@mui/icons-material";
import { FxCard, semantic, radius } from "../../../shared/design";

function Row({ label, value, status }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: status === "success" ? semantic.success : status === "warning" ? semantic.warning : semantic.text }}>{value || "--"}</Typography>
    </Stack>
  );
}

export default function WeatherSettings({ settings }) {
  const w = settings?.weather || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <WbSunny sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Weather Integration
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Row label="API Key" value={w.apiKey ? "Configured" : "Not set"} status={w.apiKey ? "success" : "warning"} />
        <Row label="Country" value={w.country} />
        <Row label="Refresh Interval" value={w.refreshInterval ? `${w.refreshInterval} min` : null} />
        <Row label="Connection" value={w.connected ? "Connected" : "Disconnected"} status={w.connected ? "success" : "warning"} />
      </FxCard>
    </Stack>
  );
}
