/**
 * ============================================================
 * Feldrix Control Centre — Stat Card (Production)
 * Sprint 46.3 — Responsive at 320px, no overflow
 * ============================================================
 */

import { Box, Typography, Stack } from "@mui/material";
import { ADMIN_THEME } from "../../utils/adminConstants";

export default function AdminStatCard({ icon, label, value, subtitle, trend, color }) {
  const cardColor = color || ADMIN_THEME.primary;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: { xs: 2.5, md: 3 },
        bgcolor: "#ffffff",
        border: `1px solid ${ADMIN_THEME.cardBorder}`,
        height: "100%",
        transition: "all 0.2s ease",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          borderColor: "rgba(59,130,246,0.12)",
        },
      }}
    >
      <Stack spacing={1.5}>
        {/* Icon + Label row */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: { xs: 36, sm: 40, md: 44 },
              height: { xs: 36, sm: 40, md: 44 },
              borderRadius: { xs: "10px", md: "12px" },
              bgcolor: `${cardColor}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: { xs: "1rem", md: "1.25rem" },
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {icon}
          </Box>
          <Typography
            sx={{
              fontSize: { xs: "0.62rem", md: "0.7rem" },
              fontWeight: 600,
              color: ADMIN_THEME.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              lineHeight: 1.3,
            }}
          >
            {label}
          </Typography>
        </Stack>

        {/* Value */}
        <Typography
          sx={{
            fontSize: { xs: "1.15rem", sm: "1.3rem", md: "1.5rem" },
            fontWeight: 800,
            color: ADMIN_THEME.text,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>

        {/* Subtitle / Trend */}
        {(subtitle || trend) && (
          <Box>
            {subtitle && (
              <Typography sx={{ fontSize: { xs: "0.68rem", md: "0.75rem" }, color: ADMIN_THEME.textSecondary }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: trend.startsWith("+") ? "#16A34A" : trend.startsWith("-") ? "#EF4444" : ADMIN_THEME.textSecondary,
                }}
              >
                {trend}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
