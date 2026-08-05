/**
 * ============================================================
 * Feldrix Control Centre — Analytics Workspace
 * Version 2.3.3
 *
 * Premium full-screen dialog for displaying analytics charts.
 * Reusable: pass title, subtitle, and children (chart content).
 * ============================================================
 */

import { Box, Typography, Stack, IconButton, Dialog, Slide } from "@mui/material";
import { Close, Refresh } from "@mui/icons-material";
import { forwardRef } from "react";
import { semantic, radius, shadows, transitions } from "../../shared/design";

const SlideTransition = forwardRef(function SlideTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function AnalyticsWorkspace({ open, onClose, title, subtitle, onRefresh, children }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      TransitionComponent={SlideTransition}
      PaperProps={{
        sx: {
          width: "90vw",
          height: "90vh",
          maxWidth: "90vw",
          maxHeight: "90vh",
          borderRadius: radius.xl,
          bgcolor: semantic.background,
          boxShadow: shadows.dialog,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: { xs: 3, md: 4 }, py: 2.5, borderBottom: `1px solid ${semantic.border}`, bgcolor: semantic.paper, flexShrink: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: semantic.text, letterSpacing: "-0.02em" }}>{title}</Typography>
            {subtitle && <Typography sx={{ fontSize: "0.75rem", color: semantic.textTertiary, mt: 0.25 }}>{subtitle}</Typography>}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {onRefresh && (
              <IconButton onClick={onRefresh} size="small" sx={{ width: 34, height: 34, border: `1px solid ${semantic.border}`, borderRadius: radius.md, transition: transitions.normal, "&:hover": { borderColor: semantic.borderHover, bgcolor: semantic.surface } }}>
                <Refresh sx={{ fontSize: 16, color: semantic.textSecondary }} />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small" sx={{ width: 34, height: 34, border: `1px solid ${semantic.border}`, borderRadius: radius.md, transition: transitions.normal, "&:hover": { borderColor: semantic.error, bgcolor: semantic.errorBg, "& svg": { color: semantic.error } } }}>
              <Close sx={{ fontSize: 16, color: semantic.textSecondary }} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: "auto", px: { xs: 3, md: 4 }, py: 3, "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { borderRadius: 3, bgcolor: semantic.border } }}>
        {children}
      </Box>
    </Dialog>
  );
}
