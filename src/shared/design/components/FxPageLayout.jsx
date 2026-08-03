/**
 * Feldrix Design System — FxPageLayout
 * Standard page structure for every page in both apps.
 */

import { Box, Typography, Stack } from "@mui/material";
import { typography as typo, spacing, semantic } from "../tokens";

export default function FxPageLayout({ title, subtitle, actions, toolbar, children, sx = {} }) {
  return (
    <Stack spacing={spacing.pageGap} sx={sx}>
      {/* Page Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
      >
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            {actions}
          </Stack>
        )}
      </Stack>

      {/* Toolbar */}
      {toolbar}

      {/* Content */}
      {children}
    </Stack>
  );
}
