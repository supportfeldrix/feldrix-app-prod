/**
 * ============================================================
 * Feldrix Control Centre — Layout Shell
 * Sprint 46.2
 *
 * Sidebar + TopBar + content area.
 * Visually distinct from the farmer application (slate/blue theme).
 * Mobile responsive with drawer sidebar.
 * ============================================================
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import { ADMIN_THEME } from "../../utils/adminConstants";

const SIDEBAR_WIDTH = 260;

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => setMobileOpen((prev) => !prev);
  const handleClose = () => setMobileOpen(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: ADMIN_THEME.contentBg }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}
          aria-label="Admin navigation"
        >
          <AdminSidebar />
        </Box>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              boxSizing: "border-box",
              border: "none",
            },
          }}
        >
          <AdminSidebar onNavigate={handleClose} />
        </Drawer>
      )}

      {/* Main area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <AdminTopBar onMenuToggle={handleToggle} showMenuButton={isMobile} />

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            pb: { xs: 4, md: 3 },
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            width: "100%",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
