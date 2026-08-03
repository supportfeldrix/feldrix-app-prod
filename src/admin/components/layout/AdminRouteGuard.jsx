/**
 * ============================================================
 * Feldrix Control Centre — Route Guard (Production)
 * Sprint 46.3
 *
 * Protects all /admin routes.
 * - No session → redirect to /login
 * - Session but no admin role → generic 404 (never exposes admin)
 * - Admin role → render Control Centre
 * ============================================================
 */

import { Outlet, Navigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { AdminProvider, useAdminContext } from "../../context/AdminContext";

function GuardInner() {
  const { isAdmin, isLoading, isAuthenticated } = useAdminContext();

  // Loading — minimal spinner, no admin branding
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F8FAFC",
        }}
      >
        <CircularProgress size={32} sx={{ color: "#64748B" }} />
      </Box>
    );
  }

  // Not authenticated at all → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but NOT an admin role → generic 404
  if (!isAdmin) {
    return <NotFoundPage />;
  }

  // Authorised admin → render Control Centre
  return <Outlet />;
}

/**
 * Generic 404 — does NOT reveal admin portal existence.
 */
function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F8FAFC",
        px: 3,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{ fontSize: "4rem", fontWeight: 800, color: "#CBD5E1", mb: 1 }}
      >
        404
      </Typography>
      <Typography sx={{ fontSize: "1.1rem", color: "#64748B", mb: 3 }}>
        Page not found
      </Typography>
      <Typography
        component="a"
        href="/dashboard"
        sx={{
          color: "#3B82F6",
          textDecoration: "none",
          fontWeight: 600,
          "&:hover": { textDecoration: "underline" },
        }}
      >
        Go to Dashboard
      </Typography>
    </Box>
  );
}

/**
 * Root wrapper — provides AdminContext and renders guard.
 */
export default function AdminRouteGuard() {
  return (
    <AdminProvider>
      <GuardInner />
    </AdminProvider>
  );
}
