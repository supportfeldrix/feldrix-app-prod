import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { supabase } from "../services/supabase";

export default function Login() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------
  // Dynamic Background & Greeting
  // -----------------------------------

  const hour = new Date().getHours();

  let backgroundImage = "/branding/login/login-sunrise.png";
  let greeting = "Good Morning";

  if (hour >= 12 && hour < 18) {
    backgroundImage = "/branding/login/login-sunset.png";
    greeting = "Good Afternoon";
  }

  if (hour >= 18 || hour < 5) {
    backgroundImage = "/branding/login/login-night.png";
    greeting = "Good Evening";
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── MOBILE LAYOUT ───────────────────────────────────────────
  if (isMobile) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: 4,
          bgcolor: "#ffffff",
          // Safe area support
          pt: "max(32px, env(safe-area-inset-top))",
          pb: "max(32px, env(safe-area-inset-bottom))",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              component="img"
              src="/branding/feldrix-logo-green.png"
              alt="Feldrix"
              sx={{
                width: { xs: 160, sm: 200 },
                height: "auto",
                display: "block",
                mx: "auto",
                mb: 2,
              }}
            />
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "text.secondary",
                letterSpacing: 1,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Smart Farm Operating System
            </Typography>
          </Box>

          {/* Welcome */}
          <Typography
            sx={{
              fontSize: { xs: "1.75rem", sm: "2rem" },
              fontWeight: 700,
              color: "#14532d",
              mb: 0.5,
            }}
          >
            {greeting}
          </Typography>
          <Typography
            sx={{
              color: "#6b7280",
              mb: 3.5,
              fontSize: "0.95rem",
            }}
          >
            Sign in to your Feldrix account.
          </Typography>

          {/* Error */}
          {error && (
            <Box
              sx={{
                bgcolor: "#fee2e2",
                color: "#b91c1c",
                p: 2,
                borderRadius: 3,
                mb: 3,
                fontSize: "0.875rem",
              }}
            >
              {error}
            </Box>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleLogin}>
            <Box component="label" sx={labelSx}>
              Email Address
            </Box>
            <Box
              component="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
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
                placeholder="Enter your password"
                sx={{ ...inputSx, mb: 0, pr: "55px" }}
              />
              <Box
                component="button"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                sx={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  bgcolor: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  minHeight: 44,
                  minWidth: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </Box>
            </Box>

            {/* Remember / Forgot */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Box
                component="label"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: "#374151",
                  minHeight: 44,
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                Remember Me
              </Box>

              <Link
                to="/forgot-password"
                style={{
                  color: "#198754",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            {/* Submit */}
            <Box
              component="button"
              type="submit"
              disabled={loading}
              sx={submitBtnSx(loading)}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Box>
          </Box>

          {/* Create Account */}
          <Typography
            sx={{
              mt: 4,
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.9375rem",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#198754",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Create Account
            </Link>
          </Typography>

          {/* Footer */}
          <Box
            sx={{
              mt: 5,
              pt: 3,
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "0.8125rem",
            }}
          >
            © {new Date().getFullYear()} Feldrix
            <br />
            Smart Farm Operating System
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 500px",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 0.5s ease-in-out",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            maxWidth: 620,
            background: "rgba(0,0,0,0.50)",
            backdropFilter: "blur(12px)",
            borderRadius: 32,
            padding: 60,
            color: "#fff",
            boxShadow: "0 25px 60px rgba(0,0,0,.35)",
          }}
        >
          <img
            src="/branding/feldrix-logo-white.png"
            alt="Feldrix"
            style={{ width: 320, marginBottom: 45 }}
          />

          <h1 style={{ fontSize: 70, lineHeight: 1, marginBottom: 24, fontWeight: 700 }}>
            {greeting}
          </h1>

          <p style={{ fontSize: 24, lineHeight: 1.7, opacity: 0.95, marginBottom: 45 }}>
            The complete Smart Farm Operating System built to help modern farmers.
          </p>

          <div style={{ display: "grid", gap: 24 }}>
            {[
              ["Livestock Management", "Track every animal from birth to sale."],
              ["Financial Insights", "Monitor farm income and expenses in real time."],
              ["AI Farm Intelligence", "Smart recommendations powered by your farm data."],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div
                  style={{
                    width: 50, height: 50, borderRadius: "50%",
                    background: "rgba(255,255,255,.18)",
                    display: "flex", justifyContent: "center", alignItems: "center",
                    fontSize: 22, fontWeight: 700,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                  <div style={{ opacity: 0.9 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          background: "#ffffff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontSize: 38, color: "#14532d", marginBottom: 10 }}>
            Sign In
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 35, fontSize: 16 }}>
            Sign in to your Feldrix account.
          </p>

          {error && (
            <div
              style={{
                background: "#fee2e2", color: "#b91c1c",
                padding: 15, borderRadius: 12, marginBottom: 24,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label style={desktopLabelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={desktopInputStyle}
            />

            <label style={desktopLabelStyle}>Password</label>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{ ...desktopInputStyle, marginBottom: 0, paddingRight: 55 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 16, top: "50%",
                  transform: "translateY(-50%)", border: "none",
                  background: "transparent", cursor: "pointer", fontSize: 18,
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#374151" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>
              <Link to="/forgot-password" style={{ color: "#198754", fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: 20, border: "none", borderRadius: 14,
                background: "linear-gradient(135deg,#198754 0%,#157347 100%)",
                color: "#fff", fontSize: 17, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, transition: "all .25s ease",
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 35, textAlign: "center", color: "#6b7280", fontSize: 15 }}>
            Don't have an account?
            <Link to="/register" style={{ marginLeft: 6, color: "#198754", fontWeight: 700, textDecoration: "none" }}>
              Create Account
            </Link>
          </div>

          <div
            style={{
              marginTop: 45, paddingTop: 24, borderTop: "1px solid #e5e7eb",
              textAlign: "center", color: "#9ca3af", fontSize: 13,
            }}
          >
            © {new Date().getFullYear()} Feldrix
            <br />
            Smart Farm Operating System
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile sx styles ─────────────────────────────────────────
const labelSx = {
  display: "block",
  mb: 1,
  fontWeight: 600,
  color: "#374151",
  fontSize: "0.875rem",
};

const inputSx = {
  width: "100%",
  p: "16px 18px",
  mb: 3,
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
  minHeight: 52,
  "&:focus": {
    borderColor: "#198754",
    boxShadow: "0 0 0 3px rgba(25,135,84,0.1)",
  },
};

const submitBtnSx = (loading) => ({
  width: "100%",
  py: 2.25,
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(135deg,#198754 0%,#157347 100%)",
  color: "#fff",
  fontSize: "1.0625rem",
  fontWeight: 700,
  cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.7 : 1,
  transition: "all .25s ease",
  minHeight: 56,
  "&:active": {
    transform: "scale(0.98)",
  },
});

// ─── Desktop inline styles (unchanged from original) ──────────
const desktopLabelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 600,
  color: "#374151",
};

const desktopInputStyle = {
  width: "100%",
  padding: 18,
  marginBottom: 24,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  fontSize: 16,
  boxSizing: "border-box",
  outline: "none",
};
