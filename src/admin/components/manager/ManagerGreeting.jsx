import { Box, Grid, Stack, Typography } from "@mui/material";
import { TrendingUp, People, Payments, HealthAndSafety, Flag, WarningAmber } from "@mui/icons-material";
import { semantic, radius, shadows, transitions } from "../../../shared/design";

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <Box sx={{ p: 2, borderRadius: radius.lg, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, height: "100%" }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: radius.md, bgcolor: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon sx={{ fontSize: 15, color }} />
        </Box>
        <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: semantic.text, lineHeight: 1.3 }}>{value}</Typography>
    </Box>
  );
}

export default function ManagerGreeting({ intelligence, metrics, adminName }) {
  if (!intelligence || !metrics) return null;

  const score = intelligence.overview?.healthScore;
  const status = intelligence.overview?.status;
  const opp = intelligence.summary?.topOpportunity;
  const risk = intelligence.summary?.topRisk;
  const focus = intelligence.summary?.todaysFocus;

  const statusColor = status === "excellent" ? semantic.success
    : status === "healthy" ? semantic.info
    : status === "attention" ? semantic.warning
    : semantic.error;

  const statusLabel = status === "excellent" ? "Excellent"
    : status === "healthy" ? "Healthy"
    : status === "attention" ? "Attention"
    : "Critical";

  const mrr = metrics.revenueMonth || 0;
  const total = metrics.totalUsers || 0;

  return (
    <Box sx={{ mx: { xs: 2, md: 3 }, mb: 2, p: 2.5, borderRadius: radius.xl, bgcolor: `#0F172A`, position: "relative", overflow: "hidden" }}>
      {/* Gradient overlay */}
      <Box sx={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />

      <Stack spacing={2} sx={{ position: "relative" }}>
        {/* Briefing line */}
        {focus && (
          <Box sx={{ p: 1.75, borderRadius: radius.lg, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
              <Box component="span" sx={{ fontWeight: 700, color: "#fff" }}>Today's Focus: </Box>
              {focus}
            </Typography>
          </Box>
        )}

        {/* Stat tiles */}
        <Grid container spacing={1.5}>
          <Grid item xs={6} sm={3}>
            <StatTile icon={HealthAndSafety} label="Health" value={score !== null ? `${score}/100` : "-"} color={statusColor} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatTile icon={People} label="Customers" value={total.toLocaleString()} color={semantic.info} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatTile icon={Payments} label="MRR" value={mrr > 0 ? `R${mrr.toLocaleString()}` : "No MRR"} color={semantic.success} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatTile icon={TrendingUp} label="Status" value={statusLabel} color={statusColor} />
          </Grid>
        </Grid>

        {/* Opportunity + Risk */}
        <Grid container spacing={1.5}>
          {opp && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.75, borderRadius: radius.lg, bgcolor: `${semantic.success}10`, border: `1px solid ${semantic.success}20` }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Flag sx={{ fontSize: 13, color: semantic.success }} />
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.success, textTransform: "uppercase", letterSpacing: 0.5 }}>Top Opportunity</Typography>
                </Stack>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff", lineHeight: 1.5 }}>{opp.title}</Typography>
              </Box>
            </Grid>
          )}
          {risk && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.75, borderRadius: radius.lg, bgcolor: `${semantic.warning}10`, border: `1px solid ${semantic.warning}20` }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <WarningAmber sx={{ fontSize: 13, color: semantic.warning }} />
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: semantic.warning, textTransform: "uppercase", letterSpacing: 0.5 }}>Top Risk</Typography>
                </Stack>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff", lineHeight: 1.5 }}>{risk.title}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Stack>
    </Box>
  );
}
