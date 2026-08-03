/**
 * Feldrix Design System — FxButton
 * Consistent button styling shared across apps.
 */

import { Button } from "@mui/material";
import { interactions } from "../tokens";

export default function FxButton({
  children,
  variant = "contained",
  size = "medium",
  fullWidth = false,
  sx = {},
  ...props
}) {
  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        "&:active": interactions.buttonActive,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
