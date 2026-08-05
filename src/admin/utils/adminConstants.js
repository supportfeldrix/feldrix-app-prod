/**
 * ============================================================
 * Feldrix Control Centre — Constants
 * Sprint 46.2
 *
 * Configurable base path, roles, navigation, permission matrix.
 * ============================================================
 */

// Base path — driven by environment variable.
// When deployed at admin.feldrix.com (VITE_APP_MODE=admin), routes are at root.
// When embedded in farmer app (VITE_APP_MODE=farmer or unset), routes are under /admin.
export const ADMIN_BASE_PATH = import.meta.env.VITE_APP_MODE === "admin" ? "" : "/admin";

// ─── Roles ──────────────────────────────────────────────────
export const ADMIN_ROLES = ["admin", "support", "finance", "readonly"];

export const ROLE_LABELS = {
  admin: "Administrator",
  support: "Support",
  finance: "Finance",
  readonly: "Read Only",
  farmer: "Farmer",
};

// ─── Navigation ─────────────────────────────────────────────
export const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "" },
  { id: "users", label: "Users", icon: "👥", path: "/users" },
  { id: "farms", label: "Farms", icon: "🚜", path: "/farms" },
  { id: "subscriptions", label: "Subscriptions", icon: "💳", path: "/subscriptions" },
  { id: "payments", label: "Payments", icon: "💰", path: "/payments" },
  { id: "reports", label: "Reports", icon: "📊", path: "/reports" },
  { id: "analytics", label: "Analytics", icon: "📈", path: "/analytics" },
  { id: "support", label: "Support", icon: "🎧", path: "/support" },
  { id: "notifications", label: "Notifications", icon: "📨", path: "/notifications" },
  { id: "system", label: "System Health", icon: "🛠", path: "/system" },
  { id: "audit", label: "Audit Log", icon: "📋", path: "/audit" },
  { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
];

// ─── Permission Matrix ──────────────────────────────────────
export const PERMISSION_MATRIX = {
  admin: {
    canViewDashboard: true,
    canManageUsers: true,
    canSuspendUsers: true,
    canViewFarms: true,
    canViewSubscriptions: true,
    canManageSubscriptions: true,
    canViewPayments: true,
    canViewAnalytics: true,
    canSendNotifications: true,
    canViewSystem: true,
    canViewAudit: true,
    canModifySettings: true,
    canViewSupport: true,
    canLoginAsUser: true,
  },
  support: {
    canViewDashboard: true,
    canManageUsers: false,
    canSuspendUsers: false,
    canViewFarms: true,
    canViewSubscriptions: true,
    canManageSubscriptions: false,
    canViewPayments: false,
    canViewAnalytics: true,
    canSendNotifications: true,
    canViewSystem: true,
    canViewAudit: true,
    canModifySettings: false,
    canViewSupport: true,
    canLoginAsUser: false,
  },
  finance: {
    canViewDashboard: true,
    canManageUsers: false,
    canSuspendUsers: false,
    canViewFarms: false,
    canViewSubscriptions: true,
    canManageSubscriptions: true,
    canViewPayments: true,
    canViewAnalytics: true,
    canSendNotifications: false,
    canViewSystem: false,
    canViewAudit: true,
    canModifySettings: false,
    canViewSupport: false,
    canLoginAsUser: false,
  },
  readonly: {
    canViewDashboard: true,
    canManageUsers: false,
    canSuspendUsers: false,
    canViewFarms: true,
    canViewSubscriptions: true,
    canManageSubscriptions: false,
    canViewPayments: true,
    canViewAnalytics: true,
    canSendNotifications: false,
    canViewSystem: true,
    canViewAudit: true,
    canModifySettings: false,
    canViewSupport: false,
    canLoginAsUser: false,
  },
};

// ─── Nav filtering by role ──────────────────────────────────
const NAV_PERMISSIONS = {
  dashboard: "canViewDashboard",
  users: "canManageUsers",
  farms: "canViewFarms",
  subscriptions: "canViewSubscriptions",
  payments: "canViewPayments",
  reports: "canViewAnalytics",
  analytics: "canViewAnalytics",
  support: "canViewSupport",
  notifications: "canSendNotifications",
  system: "canViewSystem",
  audit: "canViewAudit",
  settings: "canModifySettings",
};

export function getNavItemsForRole(role) {
  const perms = PERMISSION_MATRIX[role] || {};
  return ADMIN_NAV_ITEMS.filter((item) => {
    const required = NAV_PERMISSIONS[item.id];
    return required ? perms[required] : false;
  });
}

// ─── Audit Severity ─────────────────────────────────────────
export const AUDIT_SEVERITY = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  SECURITY: "security",
};

// ─── System Services ────────────────────────────────────────
export const SYSTEM_SERVICES = [
  { id: "supabase", name: "Supabase Database", icon: "🗄️" },
  { id: "auth", name: "Authentication", icon: "🔐" },
  { id: "storage", name: "Storage", icon: "📦" },
  { id: "edge", name: "Edge Functions", icon: "⚡" },
  { id: "payments", name: "Payment Gateway", icon: "💳" },
];

// ─── Theme Colours (Admin — Slate/Blue) ─────────────────────
export const ADMIN_THEME = {
  sidebar: "#0F172A",
  sidebarHover: "rgba(255,255,255,0.06)",
  sidebarActive: "rgba(59,130,246,0.12)",
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  accent: "#60A5FA",
  contentBg: "#F8FAFC",
  cardBorder: "rgba(15,23,42,0.06)",
  text: "#0F172A",
  textSecondary: "#64748B",
};
