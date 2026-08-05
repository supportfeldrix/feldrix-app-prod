import { Box, Stack, Typography } from "@mui/material";
import { SmartToy } from "@mui/icons-material";
import { semantic, radius, transitions } from "../../../shared/design";

export default function ManagerHeader({ intelligence, adminName }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
  const score = intelligence?.overview?.healthScore;
  const status = intelligence?.overview?.status;

  const statusColor = status === "excellent" ? semantic.success
    : status === "healthy" ? semantic.info
    : status === "attention" ? semantic.warning
    : semantic.error;

  return (
    <Box sx={{ px: { xs: 2.5, md: 3.5 }, pt: 2.5, pb: 2, borderBottom: `1px solid ${semantic.border}`, bgcolor: semantic.paper, borderRadius: "16px 16px 0 0" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        {/* Left: identity */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <SmartToy sx={{ fontSize: 22, color: "#fff" }} />
          </Box>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: semantic.text, letterSpacing: "-0.01em" }}>
                Feldrix Manager
              </Typography>
              <Box sx={{ px: 1, py: 0.2, borderRadius: radius.pill, bgcolor: `${semantic.success}15`, border: `1px solid ${semantic.success}30` }}>
                <Typography sx={{ fontSize: "0.52rem", fontWeight: 700, color: semantic.success, textTransform: "uppercase", letterSpacing: 0.5 }}>Live</Typography>
              </Box>
            </Stack>
            <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, mt: 0.1 }}>
              Executive Operations Manager
            </Typography>
          </Box>
        </Stack>

        {/* Right: status pills */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {score !== null && score !== undefined && (
            <Box sx={{ px: 1.25, py: 0.35, borderRadius: radius.pill, bgcolor: `${statusColor}10`, border: `1px solid ${statusColor}25` }}>
              <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: statusColor }}>
                Health {score}/100
              </Typography>
            </Box>
          )}
          <Box sx={{ px: 1.25, py: 0.35, borderRadius: radius.pill, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: semantic.textTertiary }}>{timeStr}</Typography>
          </Box>
          <Box sx={{ px: 1.25, py: 0.35, borderRadius: radius.pill, bgcolor: semantic.surface, border: `1px solid ${semantic.border}`, display: { xs: "none", md: "block" } }}>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: semantic.textTertiary }}>{dateStr}</Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
