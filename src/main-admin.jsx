/**
 * ============================================================
 * Feldrix Control Centre — Entry Point
 * Sprint 46.4
 *
 * Separate entry for admin.feldrix.com deployment.
 * Only loads admin code — zero farmer bundle.
 * ============================================================
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

import "@fontsource/inter";
import "./index.css";

import AdminApp from "./AdminApp";

// Admin theme — slate/blue (distinct from farmer green)
const adminTheme = createTheme({
  palette: {
    primary: { main: "#3B82F6" },
    secondary: { main: "#60A5FA" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    success: { main: "#16A34A" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "Inter, sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminApp />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
