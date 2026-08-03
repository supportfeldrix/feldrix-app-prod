/**
 * Feldrix Design System — FxStatCard
 * KPI metric card. Used in both farmer dashboard and admin dashboard.
 */

import { Box, Typography, Stack } from "@mui/material";
import { typography as typo, radius, shadows, spacing, transitions, sizes, semantic } from "../tokens";

export default function FxStatCard({ icon, label, value, subtitle, trend, color, sx = {} }) {
  const accentColor = color || "primary.main";

  return (
    <Box
      sx={{
        p: spacing.cardPx,
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: `1px solid ${semantic.border}`,
        boxShadow: shadows.card,
        height: "100%",
        transition: transitions.normal,
        overflow: "hidden",
        "&:hover": {
          boxShadow: shadows.md,
          borderColor: semantic.borderHover,
        },
        ...sx,
      }}
    >
      <Stack spacing={1.5}>
        {/* Icon + Label */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: sizes.statIconBox,
              height: sizes.statIconBox,
              borderRadius: sizes.statIconRadius,
              bgcolor: `${typeof accentColor === "string" && accentColor.startsWith("#") ? accentColor : ""}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: { xs: "1rem", md: "1.2rem" },
              flexShrink: 0,
              color: accentColor,
            }}
            aria-hidden="true"
          >
            {icon}
          </Box>
          <Typography sx={{ ...typo.metricLabel, color: semantic.textSecondary }}>
            {label}
          </Typography>
        </Stack>

        {/* Value */}
        <Typography sx={{ ...typo.metricValue, color: semantic.text, wordBreak: "break-word" }}>
          {value}
        </Typography>

        {/* Subtitle / Trend */}
        {(subtitle || trend) && (
          <Box>
            {subtitle && (
              <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography
                sx={{
                  ...typo.caption,
                  fontWeight: 600,
                  color: trend.startsWith("+") ? semantic.success : trend.startsWith("-") ? semantic.error : semantic.textSecondary,
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
