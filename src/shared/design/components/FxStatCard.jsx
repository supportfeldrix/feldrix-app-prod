/**
 * Feldrix Design System — FxStatCard (Polished)
 * Sprint 48.1 — Accent top border, larger values, trend placeholder.
 */

import { Box, Typography, Stack } from "@mui/material";
import { typography as typo, radius, shadows, spacing, transitions, sizes, semantic } from "../tokens";

export default function FxStatCard({ icon, label, value, subtitle, trend, color, sx = {} }) {
  const accentColor = color || semantic.info;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: `1px solid ${semantic.border}`,
        borderTop: `3px solid ${accentColor}`,
        boxShadow: shadows.card,
        height: "100%",
        transition: transitions.normal,
        overflow: "hidden",
        position: "relative",
        "&:hover": {
          boxShadow: shadows.md,
          borderColor: semantic.borderHover,
          borderTopColor: accentColor,
        },
        ...sx,
      }}
    >
      <Stack spacing={1.25}>
        {/* Icon + Label */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: { xs: 40, md: 46 },
              height: { xs: 40, md: 46 },
              borderRadius: { xs: "11px", md: "13px" },
              bgcolor: `${accentColor}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: { xs: "1.1rem", md: "1.3rem" },
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {icon}
          </Box>
          <Typography
            sx={{
              fontSize: { xs: "0.62rem", md: "0.68rem" },
              fontWeight: 700,
              color: semantic.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              lineHeight: 1.3,
            }}
          >
            {label}
          </Typography>
        </Stack>

        {/* Value */}
        <Typography
          sx={{
            fontSize: { xs: "1.4rem", sm: "1.6rem", md: "1.75rem" },
            fontWeight: 800,
            color: semantic.text,
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
            {trend && (
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: trend.startsWith("+") ? semantic.success : trend.startsWith("-") ? semantic.error : semantic.textTertiary,
                }}
              >
                {trend}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ fontSize: { xs: "0.68rem", md: "0.72rem" }, color: semantic.textTertiary, mt: trend ? 0.25 : 0 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
