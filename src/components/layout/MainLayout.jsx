import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { NotificationProvider } from "../../context/NotificationContext";

const SIDEBAR_WIDTH = 280;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const handleDrawerClose = () => setMobileOpen(false);

  return (
    <NotificationProvider>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fa" }}>
        {/* Desktop: permanent sidebar */}
        {!isMobile && (
          <Box
            component="nav"
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
            }}
          >
            <Sidebar />
          </Box>
        )}

        {/* Mobile: temporary drawer */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerClose}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                width: SIDEBAR_WIDTH,
                boxSizing: "border-box",
                border: "none",
              },
            }}
          >
            <Sidebar onNavigate={handleDrawerClose} />
          </Drawer>
        )}

        {/* Main content area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            // Safe area support for iPhone notch/Dynamic Island
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <TopBar onMenuToggle={handleDrawerToggle} showMenuButton={isMobile} />

          <Box
            component="main"
            sx={{
              flex: 1,
              p: { xs: 2, sm: 2.5, md: 3.5 },
              pb: { xs: 4, md: 3.5 },
              overflow: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </NotificationProvider>
  );
}
