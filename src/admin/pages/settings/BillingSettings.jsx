import { Stack, Typography } from "@mui/material";
import { Payments, CreditCard, Receipt } from "@mui/icons-material";
import { FxCard, semantic, radius } from "../../../shared/design";

function Row({ label, value, status }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${semantic.border}` }}>
      <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: status === "success" ? semantic.success : status === "warning" ? semantic.warning : semantic.text }}>{value || "--"}</Typography>
    </Stack>
  );
}

export default function BillingSettings({ settings }) {
  const s = settings?.subscriptions || {};
  const pf = settings?.payfast || {};

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <Payments sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Billing & Subscriptions
      </Typography>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Row label="Starter Price" value={s.starterPrice ? `R${s.starterPrice}` : null} />
        <Row label="Pro Price" value={s.proPrice ? `R${s.proPrice}` : null} />
        <Row label="Trial Days" value={s.trialDays} />
        <Row label="Billing Cycle" value={s.billingCycle} />
      </FxCard>

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Row label="Merchant ID" value={pf.merchantId} />
        <Row label="Mode" value={pf.sandbox ? "Sandbox" : "Live"} status={pf.sandbox ? "warning" : "success"} />
        <Row label="Connection" value={pf.connected ? "Connected" : "Disconnected"} status={pf.connected ? "success" : "warning"} />
      </FxCard>
    </Stack>
  );
}
