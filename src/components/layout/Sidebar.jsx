import { Link, useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { supabase } from "../../services/supabase";

const menu = [
  { name: "Dashboard", emoji: "🏠", path: "/dashboard" },
  { name: "Livestock", emoji: "🐄", path: "/livestock" },
  { name: "Animal Health", emoji: "❤️", path: "/health" },
  { name: "Breeding", emoji: "🐂", path: "/breeding" },
  { name: "Finance", emoji: "💳", path: "/finance" },
  { name: "Crops", emoji: "🌾", path: "/crops" },
  { name: "Machinery", emoji: "🚜", path: "/machinery" },
  { name: "Weather", emoji: "⛅", path: "/weather" },
  { name: "Planner Dashboard", emoji: "📋", path: "/tasks" },
  { name: "Planner Workspace", emoji: "🧠", path: "/planner" },
  { name: "Reports", emoji: "📊", path: "/reports" },
  { name: "Account", emoji: "⚙️", path: "/account" },
];

/**
 * Sidebar navigation.
 * Renders identically on desktop (permanent) and mobile (inside Drawer).
 * On mobile, `onNavigate` is called after clicking a link to close the drawer.
 */
export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  function handleLinkClick() {
    if (onNavigate) onNavigate();
  }

  return (
    <Box
      component="aside"
      sx={{
        width: 280,
        bgcolor: "#0D2F1F",
        color: "#fff",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        p: "24px 18px",
        boxSizing: "border-box",
        flexShrink: 0,
        // Safe area for iPhone notch when in drawer
        pt: "calc(24px + env(safe-area-inset-top))",
        pb: "calc(16px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Logo */}
      <Box sx={{ textAlign: "center", mb: 2.5 }}>
        <Box
          component="img"
          src="/branding/feldrix-logo-white.png"
          alt="Feldrix"
          sx={{
            width: 200,
            maxWidth: "100%",
            height: "auto",
            display: "block",
            mx: "auto",
          }}
        />
      </Box>

      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,.12)", mb: 2.25 }} />

      {/* Navigation links */}
      <Box sx={{ flex: 1 }}>
        {menu.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={handleLinkClick}
              style={{ textDecoration: "none" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.75,
                  py: 1.5,
                  mb: 0.75,
                  borderRadius: "10px",
                  color: "#fff",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.9rem",
                  bgcolor: active ? "rgba(255,255,255,.10)" : "transparent",
                  transition: "all 0.2s ease",
                  // Touch target: min 44px height
                  minHeight: 44,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,.07)",
                  },
                  "&:active": {
                    bgcolor: "rgba(255,255,255,.14)",
                  },
                }}
              >
                <Box component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                  {item.emoji}
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.9rem",
                    fontWeight: "inherit",
                    color: "inherit",
                  }}
                >
                  {item.name}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </Box>

      {/* Logout button */}
      <Box
        component="button"
        onClick={handleLogout}
        sx={{
          width: "100%",
          py: 1.5,
          px: 2,
          border: "none",
          borderRadius: "10px",
          bgcolor: "#B91C1C",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          mb: 2,
          fontSize: "0.9rem",
          minHeight: 44,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "#991B1B",
          },
          "&:active": {
            bgcolor: "#7F1D1D",
          },
        }}
      >
        🚪 Logout
      </Box>

      <Box
        sx={{
          borderTop: "1px solid rgba(255,255,255,.12)",
          pt: 2,
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255,255,255,.65)",
        }}
      >
        © {new Date().getFullYear()} Feldrix
      </Box>
    </Box>
  );
}
