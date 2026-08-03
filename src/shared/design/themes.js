/**
 * ============================================================
 * Feldrix Design System — Theme Configurations
 * Sprint 47.3
 *
 * Farmer: Green (agriculture, natural, friendly)
 * Admin:  Slate/Blue (enterprise, executive, professional)
 *
 * Both share identical spacing, radius, typography, shadows.
 * Only colour palette differs.
 * ============================================================
 */

import { createTheme } from "@mui/material/styles";
import { typography as typo, radius, shadows, sizes } from "./tokens";

// ─── Shared Component Overrides ──────────────────────────────

function sharedComponents(primary) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md * 4,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.88rem",
          boxShadow: "none",
          minHeight: 44,
          "&:hover": { boxShadow: "none" },
        },
        sizeLarge: { minHeight: 52, fontSize: "0.95rem", padding: "12px 28px" },
        sizeSmall: { minHeight: 36, fontSize: "0.78rem", padding: "6px 16px" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg * 4,
          boxShadow: shadows.card,
          border: "1px solid rgba(15,23,42,0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.xs * 4,
          fontWeight: 600,
          fontSize: "0.68rem",
        },
        sizeSmall: { height: 22 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: radius.sm * 4,
            fontSize: "0.88rem",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.xl * 4,
          boxShadow: shadows.dialog,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: 0.3,
          color: "#64748B",
        },
        body: {
          fontSize: "0.82rem",
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          "& .MuiPaginationItem-root": { fontSize: "0.8rem", minWidth: 32, minHeight: 32 },
        },
      },
    },
  };
}

// ─── Shared Typography ───────────────────────────────────────

const sharedTypography = {
  fontFamily: typo.fontFamily,
  h4: { fontWeight: 800, letterSpacing: "-0.02em" },
  h5: { fontWeight: 700, letterSpacing: "-0.01em" },
  h6: { fontWeight: 700 },
  subtitle1: { fontWeight: 500 },
  body1: { fontSize: "0.88rem", lineHeight: 1.6 },
  body2: { fontSize: "0.82rem", lineHeight: 1.5 },
  caption: { fontSize: "0.72rem", lineHeight: 1.4 },
  button: { textTransform: "none", fontWeight: 600 },
};

// ─── Farmer Theme (Green) ────────────────────────────────────

export const farmerTheme = createTheme({
  palette: {
    primary: { main: "#2E7D32", light: "#66BB6A", dark: "#1B5E20" },
    secondary: { main: "#66BB6A" },
    background: { default: "#F5F7FA", paper: "#FFFFFF" },
    success: { main: "#16A34A" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    info: { main: "#3B82F6" },
    text: { primary: "#0F172A", secondary: "#64748B" },
    divider: "rgba(15,23,42,0.06)",
  },
  shape: { borderRadius: 14 },
  typography: sharedTypography,
  components: sharedComponents("#2E7D32"),
});

// ─── Admin Theme (Slate/Blue) ────────────────────────────────

export const adminTheme = createTheme({
  palette: {
    primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
    secondary: { main: "#60A5FA" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    success: { main: "#16A34A" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    info: { main: "#3B82F6" },
    text: { primary: "#0F172A", secondary: "#64748B" },
    divider: "rgba(15,23,42,0.06)",
  },
  shape: { borderRadius: 14 },
  typography: sharedTypography,
  components: sharedComponents("#3B82F6"),
});

export default { farmerTheme, adminTheme };
