import {
  Badge,
  IconButton,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { Menu, Notifications } from "@mui/icons-material";
import { useNotificationBadge } from "../../context/NotificationContext";
import ConnectionIndicator from "../offline/ConnectionIndicator";

/**
 * Top bar header.
 * On mobile: shows hamburger menu button to toggle the sidebar drawer.
 * On desktop: shows branding only (sidebar is always visible).
 */
export default function TopBar({ onNotificationClick, onMenuToggle, showMenuButton }) {
  const { unreadCount } = useNotificationBadge();

  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#ffffff",
        px: { xs: 2, sm: 3 },
        py: 1.5,
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: { xs: 56, md: 68 },
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 1100,
        // Safe area support
        paddingTop: { xs: "max(12px, env(safe-area-inset-top))", md: "12px" },
      }}
    >
      {/* Left Side */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        {showMenuButton && (
          <IconButton
            onClick={onMenuToggle}
            aria-label="Open navigation menu"
            edge="start"
            sx={{
              color: "#0D2F1F",
              mr: 0.5,
              // Ensure 44px touch target
              width: 44,
              height: 44,
            }}
          >
            <Menu />
          </IconButton>
        )}

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0D2F1F",
              lineHeight: 1,
              fontSize: { xs: "1rem", md: "1.25rem" },
            }}
          >
            FELDRIX
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              letterSpacing: 1,
              textTransform: "uppercase",
              fontSize: { xs: "0.6rem", md: "0.75rem" },
              display: { xs: "none", sm: "block" },
            }}
          >
            The Smart Farm Operating System
          </Typography>
        </Box>
      </Stack>

      {/* Right Side */}
      <Stack direction="row" spacing={1} alignItems="center">
        <ConnectionIndicator />
        <IconButton
          onClick={onNotificationClick}
          aria-label="Notifications"
          sx={{
            // Ensure 44px touch target
            width: 44,
            height: 44,
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            invisible={unreadCount === 0}
          >
            <Notifications
              sx={{
                fontSize: 24,
                color: "#455A64",
              }}
            />
          </Badge>
        </IconButton>
      </Stack>
    </Box>
  );
}
