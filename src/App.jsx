import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Livestock from "./pages/Livestock";
import AnimalProfile from "./pages/AnimalProfile";
import Crops from "./pages/Crops";
import Health from "./pages/Health";
import Breeding from "./pages/Breeding";
import Finance from "./pages/Finance";
import Tasks from "./pages/Tasks";
import PlannerWorkspace from "./pages/PlannerWorkspace";
import Reports from "./pages/Reports";
import Account from "./pages/Account";
import Machinery from "./pages/Machinery";
import MachineProfile from "./pages/MachineProfile";
import Weather from "./pages/Weather";

import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";

// ─── Admin Portal (lazy-loaded — zero impact on farmer bundle) ──────
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
const AdminWeatherTesting = lazy(() => import("./admin/pages/AdminWeatherTesting"));
const AdminAuditLog = lazy(() => import("./admin/pages/AdminAuditLog"));
const AdminSettings = lazy(() => import("./admin/pages/AdminSettings"));
const AdminCustomerSuccess = lazy(() => import("./admin/pages/customer-success/CustomerSuccessCentre"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ─── Farmer Application ──────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/livestock" element={<Livestock />} />
        <Route path="/animals/:id" element={<AnimalProfile />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/health" element={<Health />} />
        <Route path="/breeding" element={<Breeding />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/machinery" element={<Machinery />} />
        <Route path="/machinery/:id" element={<MachineProfile />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/planner" element={<PlannerWorkspace />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/payment-success" element={<PaymentSuccess />} />
        <Route path="/account/payment-cancelled" element={<PaymentCancelled />} />
      </Route>

      {/* ─── Control Centre (Admin Portal) ───────────────── */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={null}>
            <AdminRouteGuard />
          </Suspense>
        }
      >
        <Route
          element={
            <Suspense fallback={null}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={null}><AdminDashboard /></Suspense>} />
          <Route path="users" element={<Suspense fallback={null}><AdminUsers /></Suspense>} />
          <Route path="farms" element={<Suspense fallback={null}><AdminFarms /></Suspense>} />
          <Route path="subscriptions" element={<Suspense fallback={null}><AdminSubscriptions /></Suspense>} />
          <Route path="customer-success" element={<Suspense fallback={null}><AdminCustomerSuccess /></Suspense>} />
          <Route path="payments" element={<Suspense fallback={null}><AdminPayments /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={null}><AdminAnalytics /></Suspense>} />
          <Route path="support" element={<Suspense fallback={null}><AdminSupport /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={null}><AdminNotifications /></Suspense>} />
          <Route path="system" element={<Suspense fallback={null}><AdminSystemHealth /></Suspense>} />
          <Route path="weather-testing" element={<Suspense fallback={null}><AdminWeatherTesting /></Suspense>} />
          <Route path="audit" element={<Suspense fallback={null}><AdminAuditLog /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={null}><AdminSettings /></Suspense>} />
        </Route>
      </Route>
    </Routes>
  );
}
