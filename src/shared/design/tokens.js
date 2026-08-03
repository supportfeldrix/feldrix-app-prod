/**
 * ============================================================
 * Feldrix Design System — Shared Design Tokens
 * Sprint 47.3
 *
 * Single source of truth for all visual values.
 * Used by BOTH farmer app and Control Centre.
 * Only accent/primary colours differ per theme.
 * ============================================================
 */

// ─── Typography ──────────────────────────────────────────────

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // Page-level
  pageTitle: { fontSize: { xs: "1.4rem", md: "1.65rem" }, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 },
  pageSubtitle: { fontSize: "0.88rem", fontWeight: 400, lineHeight: 1.5 },

  // Section-level
  sectionTitle: { fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.3 },
  sectionCaption: { fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },

  // Card-level
  cardTitle: { fontSize: "0.88rem", fontWeight: 700, lineHeight: 1.3 },
  cardDescription: { fontSize: "0.78rem", fontWeight: 400, lineHeight: 1.5 },

  // Data
  metricValue: { fontSize: { xs: "1.3rem", md: "1.5rem" }, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" },
  metricLabel: { fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },

  // Body
  body: { fontSize: "0.85rem", fontWeight: 400, lineHeight: 1.6 },
  bodySmall: { fontSize: "0.78rem", fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: "0.72rem", fontWeight: 500, lineHeight: 1.4 },
  tiny: { fontSize: "0.65rem", fontWeight: 600, lineHeight: 1.3 },

  // Interactive
  buttonPrimary: { fontSize: "0.88rem", fontWeight: 600 },
  buttonSmall: { fontSize: "0.78rem", fontWeight: 600 },
  chipLabel: { fontSize: "0.68rem", fontWeight: 600 },
  inputLabel: { fontSize: "0.8rem", fontWeight: 600 },
  inputValue: { fontSize: "0.88rem", fontWeight: 400 },
};

// ─── Spacing ─────────────────────────────────────────────────

export const spacing = {
  // Page
  pagePx: { xs: 2, sm: 2.5, md: 3.5 },
  pagePy: { xs: 2, md: 3 },
  pageGap: 3,

  // Section
  sectionGap: 2.5,

  // Card
  cardPx: { xs: 2.5, md: 3 },
  cardPy: { xs: 2.5, md: 3 },
  cardGap: 2,

  // Form
  fieldGap: 2.5,
  labelGap: 0.75,

  // Grid
  gridGap: 2,

  // Inline
  iconGap: 1.5,
  chipGap: 0.75,
  buttonGap: 1.5,
};

// ─── Border Radius ───────────────────────────────────────────

export const radius = {
  xs: 1.5,     // 6px — chips, badges
  sm: 2,       // 8px — inputs, small buttons
  md: 2.5,     // 10px — buttons, menu items
  lg: 3,       // 12px — cards, dialogs
  xl: 4,       // 16px — large cards, modals
  full: "50%", // circular
  pill: 100,   // pill shapes
};

// ─── Elevation & Shadows ─────────────────────────────────────

export const shadows = {
  none: "none",
  xs: "0 1px 2px rgba(0,0,0,0.04)",
  sm: "0 2px 8px rgba(0,0,0,0.05)",
  md: "0 4px 16px rgba(0,0,0,0.06)",
  lg: "0 8px 32px rgba(0,0,0,0.08)",
  xl: "0 16px 48px rgba(0,0,0,0.1)",
  card: "0 1px 3px rgba(0,0,0,0.04)",
  cardHover: "0 8px 24px rgba(0,0,0,0.07)",
  dialog: "0 24px 80px rgba(0,0,0,0.12)",
  dropdown: "0 8px 32px rgba(0,0,0,0.1)",
};

// ─── Transitions ─────────────────────────────────────────────

export const transitions = {
  fast: "all 0.12s ease",
  normal: "all 0.2s ease",
  smooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
};

// ─── Breakpoints (MUI standard) ──────────────────────────────

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// ─── Component Sizes ─────────────────────────────────────────

export const sizes = {
  // Touch targets
  touchMin: 44,
  buttonHeight: { sm: 36, md: 44, lg: 52 },

  // Icons
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 28,

  // Avatars
  avatarSm: 28,
  avatarMd: 36,
  avatarLg: 48,
  avatarXl: 64,

  // Cards
  statIconBox: { xs: 38, md: 44 },
  statIconRadius: { xs: "10px", md: "12px" },

  // Layout
  sidebarWidth: 280,
  adminSidebarWidth: 260,
  drawerWidth: 520,
  topBarHeight: { xs: 56, md: 64 },
  maxContentWidth: 1200,
};

// ─── Shared Colours (non-theme, semantic) ────────────────────

export const semantic = {
  success: "#16A34A",
  successBg: "#DCFCE7",
  successText: "#166534",

  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  warningText: "#92400E",

  error: "#EF4444",
  errorBg: "#FEE2E2",
  errorText: "#991B1B",

  info: "#3B82F6",
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",

  neutral: "#64748B",
  neutralBg: "#F1F5F9",
  neutralText: "#475569",

  border: "rgba(15,23,42,0.06)",
  borderHover: "rgba(15,23,42,0.12)",
  divider: "rgba(15,23,42,0.06)",

  surface: "#F8FAFC",
  background: "#F5F7FA",
  paper: "#FFFFFF",

  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  textDisabled: "#CBD5E1",
};

// ─── Status Map ──────────────────────────────────────────────

export const statusColors = {
  active: { bg: "#DCFCE7", text: "#166534", label: "Active" },
  inactive: { bg: "#F1F5F9", text: "#475569", label: "Inactive" },
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  healthy: { bg: "#DCFCE7", text: "#166534", label: "Healthy" },
  warning: { bg: "#FEF3C7", text: "#92400E", label: "Warning" },
  critical: { bg: "#FEE2E2", text: "#991B1B", label: "Critical" },
  suspended: { bg: "#FEE2E2", text: "#991B1B", label: "Suspended" },
  starter: { bg: "#F0FDF4", text: "#166534", label: "Starter" },
  pro: { bg: "#EDE9FE", text: "#5B21B6", label: "PRO" },
  cancelled: { bg: "#F1F5F9", text: "#475569", label: "Cancelled" },
  admin: { bg: "#EDE9FE", text: "#5B21B6", label: "Admin" },
  support: { bg: "#DBEAFE", text: "#1E40AF", label: "Support" },
  finance: { bg: "#FEF3C7", text: "#92400E", label: "Finance" },
  readonly: { bg: "#F1F5F9", text: "#475569", label: "Read Only" },
  farmer: { bg: "#F0FDF4", text: "#166534", label: "Farmer" },
};

// ─── Hover / Interaction States ──────────────────────────────

export const interactions = {
  cardHover: {
    transform: "translateY(-2px)",
    boxShadow: shadows.cardHover,
    borderColor: "rgba(15,23,42,0.1)",
  },
  buttonActive: {
    transform: "scale(0.98)",
  },
  rowHover: {
    bgcolor: "#F8FAFC",
  },
};

// ─── Export All ──────────────────────────────────────────────

export default {
  typography,
  spacing,
  radius,
  shadows,
  transitions,
  breakpoints,
  sizes,
  semantic,
  statusColors,
  interactions,
};
