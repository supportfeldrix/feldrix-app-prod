/**
 * ============================================================
 * Feldrix Control Centre — Top Bar
 * Sprint 46.2
 *
 * Hamburger on mobile, breadcrumb placeholder, admin badge.
 * ============================================================
 */

import { Box, Typography, IconButton, Stack, Chip } from "@mui/material";
import { Menu } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { useAdminContext } from "../../context/AdminContext";
import { ADMIN_NAV_ITEMS, ADMIN_BASE_PATH, ADMIN_THEME, ROLE_LABELS } from "../../utils/adminConstants";

export default function AdminTopBar({ onMenuToggle, showMenuButton }) {
  const location = useLocation();
  const { admin } = useAdminContext();

  // Derive current page title from path
  const currentPath = location.pathname.replace(ADMIN_BASE_PATH, "");
  const currentNav = ADMIN_NAV_ITEMS.find((item) =>
    item.path === "" ? currentPath === "" || currentPath === "/" : currentPath.startsWith(item.path)
  );
  const pageTitle = currentNav?.label || "Control Centre";

  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#ffffff",
        px: { xs: 2, sm: 3 },
        py: 1.5,
        borderBottom: `1px solid ${ADMIN_THEME.cardBorder}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: { xs: 56, md: 64 },
        position: "sticky",
        top: 0,
        zIndex: 1100,
        paddingTop: { xs: "max(12px, env(safe-area-inset-top))", md: "12px" },
      }}
    >
      {/* Left */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        {showMenuButton && (
          <IconButton
            onClick={onMenuToggle}
            aria-label="Open admin navigation"
            edge="start"
            sx={{ color: ADMIN_THEME.text, width: 44, height: 44 }}
          >
            <Menu />
          </IconButton>
        )}

        <Box>
          <Typography
            sx={{
              fontSize: { xs: "1rem", md: "1.15rem" },
              fontWeight: 700,
              color: ADMIN_THEME.text,
              lineHeight: 1.2,
            }}
          >
            {pageTitle}
          </Typography>
          {!showMenuButton && (
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: ADMIN_THEME.textSecondary,
                letterSpacing: 0.5,
              }}
            >
              Feldrix Control Centre
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Right */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        {admin && (
          <>
            <Chip
              label={ROLE_LABELS[admin.role] || admin.role}
              size="small"
              sx={{
                bgcolor: `${ADMIN_THEME.primary}12`,
                color: ADMIN_THEME.primary,
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 26,
                display: { xs: "none", sm: "flex" },
              }}
            />
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                bgcolor: ADMIN_THEME.primary,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
              aria-label={`Logged in as ${admin.name}`}
            >
              {admin.name?.charAt(0)?.toUpperCase() || "A"}
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
