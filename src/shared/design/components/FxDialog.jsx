/**
 * Feldrix Design System — FxDialog
 * Consistent dialog/modal across apps.
 */

import { Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { radius, shadows, semantic } from "../tokens";

export default function FxDialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = "sm",
  fullWidth = true,
  sx = {},
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: radius.xl,
          boxShadow: shadows.dialog,
          ...sx,
        },
      }}
    >
      {title && (
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 0.5 }}>
          {title}
        </DialogTitle>
      )}
      <DialogContent sx={{ pt: title ? 1 : 2 }}>
        {description && (
          <Typography sx={{ fontSize: "0.88rem", color: semantic.textSecondary, mb: 2 }}>
            {description}
          </Typography>
        )}
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
