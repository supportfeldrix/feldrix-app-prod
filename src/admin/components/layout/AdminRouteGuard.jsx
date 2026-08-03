/**
 * ============================================================
 * Feldrix Control Centre — Route Guard (Fixed)
 * Sprint 52.5
 *
 * ONLY consumes AdminContext — does NOT provide it.
 * AdminProvider is now in AdminApp.jsx (stays mounted).
 * This prevents re-authentication on every navigation.
 * ============================================================
 */

import { Outlet, Navigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useAdminContext } from "../../context/AdminContext";

export default function AdminRouteGuard() {
  const { isAdmin, isLoading, isAuthenticated } = useAdminContext();

  // Loading — minimal spinner
  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F8FAFC" }}>
        <CircularProgress size={32} sx={{ color: "#64748B" }} />
      </Box>
    );
  }

  // Not authenticated → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but NOT admin → generic 404
  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "#F8FAFC", px: 3, textAlign: "center" }}>
        <Typography sx={{ fontSize: "4rem", fontWeight: 800, color: "#CBD5E1", mb: 1 }}>404</Typography>
        <Typography sx={{ fontSize: "1.1rem", color: "#64748B", mb: 3 }}>Page not found</Typography>
        <Typography component="a" href="/" sx={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}>Go back</Typography>
      </Box>
    );
  }

  // Authorised → render children
  return <Outlet />;
}
