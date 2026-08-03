/**
 * ============================================================
 * Feldrix Control Centre — Admin Login
 * Sprint 46.4
 *
 * Dedicated login page with slate/blue Control Centre branding.
 * Uses existing Supabase auth. After login, evaluates role:
 *   - Admin role → navigate to dashboard
 *   - Non-admin → show generic "Not Found"
 * ============================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { supabase } from "../../supabaseClient";
import { ADMIN_ROLES, ADMIN_THEME } from "../utils/adminConstants";
import { useAdminContext } from "../context/AdminContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading, refresh } = useAdminContext();

  // Already authenticated as admin → go to dashboard
  useEffect(() => {
    if (!isLoading && isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setUnauthorized(false);
    setLoading(true);

    try {
      // Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = data?.user;
      if (!user) throw new Error("Authentication failed.");

      // Evaluate role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || !ADMIN_ROLES.includes(profile.role)) {
        // Not an admin — sign out silently and show not found
        await supabase.auth.signOut();
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      // Authorised — refresh context and enter Control Centre
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Unauthorized: generic 404 ────────────────────────────────
  if (unauthorized) {
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
        <Typography sx={{ fontSize: "4rem", fontWeight: 800, color: "#CBD5E1", mb: 1 }}>
          404
        </Typography>
        <Typography sx={{ fontSize: "1.1rem", color: "#64748B", mb: 3 }}>
          Page not found
        </Typography>
        <Typography
          component="a"
          href="/"
          sx={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
        >
          Go back
        </Typography>
      </Box>
    );
  }

  // ─── Login Form ────────────────────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: ADMIN_THEME.sidebar,
        px: 2,
        py: 4,
        // Safe area
        pt: "max(32px, env(safe-area-inset-top))",
        pb: "max(32px, env(safe-area-inset-bottom))",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "#FFFFFF",
          borderRadius: 4,
          p: { xs: 4, sm: 5 },
          boxShadow: "0 32px 100px rgba(0,0,0,0.25)",
        }}
      >
        {/* Branding */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            component="img"
            src="/branding/feldrix-logo-green.png"
            alt="Feldrix"
            sx={{ height: 36, width: "auto", display: "block", mx: "auto", mb: 1.5 }}
          />
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 600,
              color: ADMIN_THEME.primary,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              mt: 0.25,
            }}
          >
            Control Centre
          </Typography>
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: ADMIN_THEME.text,
            mb: 0.5,
            textAlign: "center",
          }}
        >
          Sign In
        </Typography>
        <Typography
          sx={{
            fontSize: "0.85rem",
            color: ADMIN_THEME.textSecondary,
            mb: 3.5,
            textAlign: "center",
          }}
        >
          Access the Feldrix administration platform.
        </Typography>

        {/* Error */}
        {error && (
          <Box
            sx={{
              bgcolor: "#FEF2F2",
              color: "#B91C1C",
              p: 2,
              borderRadius: 2.5,
              mb: 3,
              fontSize: "0.82rem",
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </Box>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleLogin}>
          <Box component="label" sx={labelSx}>
            Email
          </Box>
          <Box
            component="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@feldrix.com"
            autoComplete="email"
            sx={inputSx}
          />

          <Box component="label" sx={labelSx}>
            Password
          </Box>
          <Box sx={{ position: "relative", mb: 3 }}>
            <Box
              component="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              sx={{ ...inputSx, mb: 0, pr: "50px" }}
            />
            <Box
              component="button"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              sx={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                bgcolor: "transparent",
                cursor: "pointer",
                fontSize: "1rem",
                color: ADMIN_THEME.textSecondary,
                minWidth: 44,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </Box>
          </Box>

          {/* Submit */}
          <Box
            component="button"
            type="submit"
            disabled={loading}
            sx={{
              width: "100%",
              py: 1.75,
              border: "none",
              borderRadius: "12px",
              bgcolor: ADMIN_THEME.primary,
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s ease",
              minHeight: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              "&:hover": {
                bgcolor: ADMIN_THEME.primaryDark,
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              "Sign In"
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.72rem", color: ADMIN_THEME.textSecondary }}>
            Authorised administrators only.
          </Typography>
          <Typography sx={{ fontSize: "0.68rem", color: "#CBD5E1", mt: 0.5 }}>
            © {new Date().getFullYear()} Feldrix
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const labelSx = {
  display: "block",
  mb: 0.75,
  fontWeight: 600,
  color: "#374151",
  fontSize: "0.8rem",
};

const inputSx = {
  width: "100%",
  p: "14px 16px",
  mb: 2.5,
  borderRadius: "10px",
  border: "1px solid #E2E8F0",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
  minHeight: 48,
  fontFamily: "Inter, sans-serif",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  "&:focus": {
    borderColor: "#3B82F6",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.1)",
  },
  "&::placeholder": {
    color: "#94A3B8",
  },
};
