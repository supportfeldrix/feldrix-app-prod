import { Box, Typography, Stack } from "@mui/material";
import { Palette, ColorLens } from "@mui/icons-material";
import { FxCard, semantic, radius } from "../../../shared/design";

function Row({ label, value, status }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: status === "success" ? semantic.success : status === "warning" ? semantic.warning : semantic.text }}>{value || "--"}</Typography>
    </Stack>
  );
}

function ColorRow({ label, color }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary }}>{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 16, height: 16, borderRadius: "4px", backgroundColor: color || semantic.border }} />
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>{color || "--"}</Typography>
      </Stack>
    </Stack>
  );
}

export default function BrandingSettings({ settings }) {
  const b = settings?.branding || {};
  const p = settings?.platform || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <Palette sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Branding
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <ColorRow label="Primary Color" color={b.primaryColor} />
        <ColorRow label="Secondary Color" color={b.secondaryColor} />
        <Row label="Theme" value={b.theme} />
        <Row label="Company Name" value={p.name} />
      </FxCard>
    </Stack>
  );
}
