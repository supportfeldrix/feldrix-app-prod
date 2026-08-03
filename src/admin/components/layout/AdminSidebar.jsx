/**
 * ============================================================
 * Feldrix Control Centre — Sidebar Navigation
 * Sprint 46.2
 *
 * Slate/dark blue theme. Role-filtered nav items.
 * ============================================================
 */

import { Link, useLocation } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import { useAdminContext } from "../../context/AdminContext";
import { ADMIN_BASE_PATH, ADMIN_THEME, getNavItemsForRole, ROLE_LABELS } from "../../utils/adminConstants";

export default function AdminSidebar({ onNavigate }) {
  const location = useLocation();
  const { admin, logout } = useAdminContext();

  const navItems = getNavItemsForRole(admin?.role || "readonly");

  function handleClick() {
    if (onNavigate) onNavigate();
  }

  function isActive(itemPath) {
    const fullPath = `${ADMIN_BASE_PATH}${itemPath}`;
    if (itemPath === "") {
      return location.pathname === ADMIN_BASE_PATH || location.pathname === `${ADMIN_BASE_PATH}/`;
    }
    return location.pathname.startsWith(fullPath);
  }

  return (
    <Box
      component="aside"
      sx={{
        width: 260,
        bgcolor: ADMIN_THEME.sidebar,
        color: "#fff",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        p: "20px 14px",
        boxSizing: "border-box",
        flexShrink: 0,
        pt: "calc(20px + env(safe-area-inset-top))",
        pb: "calc(16px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Branding */}
      <Box sx={{ px: 1.5, mb: 2.5 }}>
        <Box
          component="img"
          src="/branding/feldrix-logo-white.png"
          alt="Feldrix"
          sx={{ height: 34, width: "auto", display: "block", mb: 0.75 }}
        />
        <Typography
          sx={{
            fontSize: "0.58rem",
            fontWeight: 700,
            color: ADMIN_THEME.accent,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Control Centre
        </Typography>
      </Box>

      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", mb: 2 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1 }}>
        <Stack spacing={0.5}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={`${ADMIN_BASE_PATH}${item.path}`}
                onClick={handleClick}
                style={{ textDecoration: "none" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.75,
                    py: 1.25,
                    borderRadius: "10px",
                    color: active ? "#fff" : "rgba(255,255,255,0.6)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.85rem",
                    bgcolor: active ? "rgba(59,130,246,0.18)" : "transparent",
                    borderLeft: active ? `3px solid ${ADMIN_THEME.primary}` : "3px solid transparent",
                    transition: "all 0.15s ease",
                    minHeight: 42,
                    "&:hover": {
                      bgcolor: active ? "rgba(59,130,246,0.18)" : ADMIN_THEME.sidebarHover,
                      color: "#fff",
                    },
                  }}
                >
                  <Box component="span" sx={{ fontSize: "1rem", lineHeight: 1, width: 22, textAlign: "center" }}>
                    {item.icon}
                  </Box>
                  <Typography component="span" sx={{ fontSize: "0.84rem", fontWeight: "inherit", color: "inherit" }}>
                    {item.label}
                  </Typography>
                </Box>
              </Link>
            );
          })}
        </Stack>
      </Box>

      {/* Admin info + logout */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2, mt: 2 }}>
        {admin && (
          <Box sx={{ px: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff", mb: 0.25 }}>
              {admin.name}
            </Typography>
            <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>
              {ROLE_LABELS[admin.role] || admin.role}
            </Typography>
          </Box>
        )}

        <Box
          component="button"
          onClick={logout}
          sx={{
            width: "100%",
            py: 1.25,
            px: 2,
            border: "none",
            borderRadius: "8px",
            bgcolor: "rgba(239,68,68,0.12)",
            color: "#FCA5A5",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.8rem",
            minHeight: 40,
            transition: "all 0.15s ease",
            "&:hover": { bgcolor: "rgba(239,68,68,0.2)", color: "#fff" },
          }}
        >
          Logout
        </Box>

        {/* Switch to farmer view */}
        <Link to="/dashboard" onClick={handleClick} style={{ textDecoration: "none" }}>
          <Box
            sx={{
              mt: 1,
              py: 1,
              px: 2,
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.4)",
              transition: "all 0.15s ease",
              "&:hover": { color: "rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.03)" },
            }}
          >
            ← Switch to Farmer View
          </Box>
        </Link>
      </Box>
    </Box>
  );
}
