/**
 * ============================================================
 * Feldrix Control Centre — Standalone App Router
 * Sprint 46.4
 *
 * Used when deployed independently at admin.feldrix.com.
 * Routes are at root level (/ not /admin).
 * ============================================================
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import Login from "./pages/Login";

const AdminRouteGuard = lazy(() => import("./admin/components/layout/AdminRouteGuard"));
const AdminLayout = lazy(() => import("./admin/components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers"));
const AdminFarms = lazy(() => import("./admin/pages/AdminFarms"));
const AdminSubscriptions = lazy(() => import("./admin/pages/AdminSubscriptions"));
const AdminPayments = lazy(() => import("./admin/pages/AdminPayments"));
const AdminAnalytics = lazy(() => import("./admin/pages/AdminAnalytics"));
const AdminSupport = lazy(() => import("./admin/pages/AdminSupport"));
const AdminNotifications = lazy(() => import("./admin/pages/AdminNotifications"));
const AdminSystemHealth = lazy(() => import("./admin/pages/AdminSystemHealth"));
const AdminAuditLog = lazy(() => import("./admin/pages/AdminAuditLog"));
const AdminSettings = lazy(() => import("./admin/pages/AdminSettings"));

function LoadingFallback() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F8FAFC" }}>
      <CircularProgress size={32} sx={{ color: "#64748B" }} />
    </Box>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Control Centre — routes at root level */}
      <Route
        element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminRouteGuard />
          </Suspense>
        }
      >
        <Route
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route path="/dashboard" element={<Suspense fallback={null}><AdminDashboard /></Suspense>} />
          <Route path="/users" element={<Suspense fallback={null}><AdminUsers /></Suspense>} />
          <Route path="/farms" element={<Suspense fallback={null}><AdminFarms /></Suspense>} />
          <Route path="/subscriptions" element={<Suspense fallback={null}><AdminSubscriptions /></Suspense>} />
          <Route path="/payments" element={<Suspense fallback={null}><AdminPayments /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={null}><AdminAnalytics /></Suspense>} />
          <Route path="/support" element={<Suspense fallback={null}><AdminSupport /></Suspense>} />
          <Route path="/notifications" element={<Suspense fallback={null}><AdminNotifications /></Suspense>} />
          <Route path="/system" element={<Suspense fallback={null}><AdminSystemHealth /></Suspense>} />
          <Route path="/audit" element={<Suspense fallback={null}><AdminAuditLog /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={null}><AdminSettings /></Suspense>} />
        </Route>
      </Route>
    </Routes>
  );
}
