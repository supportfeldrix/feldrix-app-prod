import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { supabase } from "../services/supabase";

export default function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [form, setForm] = useState({
    fullName: "",
    farmName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // -----------------------------------
  // Register User
  // -----------------------------------

  const handleRegister = async () => {
    if (!form.fullName || !form.farmName || !form.email || !form.password) {
      alert("Please complete all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            farm_name: form.farmName,
          },
        },
      });

      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("Unable to create account.");

      // Profile is created automatically by the database trigger (handle_new_user).
      // The trigger fires on auth.users INSERT and creates the profiles row server-side.
      // We pass full_name and farm_name via user_metadata so the trigger can access them,
      // and we update the profile with full details after the user signs in (when session exists).

      alert("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      console.error("Registration failed:", err);
      alert(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // Dynamic Background & Greeting
  // -----------------------------------

  const hour = new Date().getHours();

  let backgroundImage = "/branding/login/login-sunrise.png";
  let greeting = "Start Your Journey";

  if (hour >= 12 && hour < 18) {
    backgroundImage = "/branding/login/login-sunset.png";
    greeting = "Welcome to Feldrix";
  }

  if (hour >= 18 || hour < 5) {
    backgroundImage = "/branding/login/login-night.png";
    greeting = "Build Your Farm";
  }

  const fields = [
    { name: "fullName", label: "Full Name", type: "text", placeholder: "Your full name" },
    { name: "farmName", label: "Farm Name", type: "text", placeholder: "Your farm name" },
    { name: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
    { name: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" },
    { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Re-enter password" },
  ];

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
          pt: "max(24px, env(safe-area-inset-top))",
          pb: "max(24px, env(safe-area-inset-bottom))",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              component="img"
              src="/branding/feldrix-logo-green.png"
              alt="Feldrix"
              sx={{
                width: { xs: 140, sm: 180 },
                height: "auto",
                display: "block",
                mx: "auto",
                mb: 1.5,
              }}
            />
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: "text.secondary",
                letterSpacing: 1,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Smart Farm Operating System
            </Typography>
          </Box>

          {/* Header */}
          <Typography
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              fontWeight: 700,
              color: "#14532d",
              mb: 0.5,
            }}
          >
            Create Account
          </Typography>
          <Typography sx={{ color: "#6b7280", mb: 3, fontSize: "0.9rem" }}>
            Start managing your farm today.
          </Typography>

          {/* Form fields */}
          {fields.map(({ name, label, type, placeholder }) => (
            <Box key={name} sx={{ mb: 2 }}>
              <Box component="label" sx={labelSx}>
                {label}
              </Box>
              <Box
                component="input"
                name={name}
                type={type}
                placeholder={placeholder}
                value={form[name]}
                onChange={update}
                disabled={loading}
                sx={inputSx}
              />
            </Box>
          ))}

          {/* Submit */}
          <Box
            component="button"
            onClick={handleRegister}
            disabled={loading}
            sx={submitBtnSx(loading)}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Box>

          {/* Sign In link */}
          <Typography
            sx={{
              mt: 3.5,
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.9375rem",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#198754",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </Typography>

          {/* Footer */}
          <Box
            sx={{
              mt: 4,
              pt: 2.5,
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
      }}
    >
      {/* LEFT SIDE */}
      <div style={{ display: "flex", alignItems: "center", padding: "80px" }}>
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

          <h1 style={{ fontSize: 68, lineHeight: 1, marginBottom: 24, fontWeight: 700 }}>
            {greeting}
          </h1>

          <p style={{ fontSize: 24, lineHeight: 1.7, opacity: 0.95, marginBottom: 45 }}>
            Create your Feldrix account and start managing livestock, crops, finance,
            machinery and daily farm operations from one powerful platform.
          </p>

          <div style={{ display: "grid", gap: 24 }}>
            {[
              ["Smart Livestock Management", "Keep every animal organised from day one."],
              ["Financial Control", "Track income and expenses with confidence."],
              ["AI Farm Intelligence", "Grow your farm with intelligent insights."],
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
        <div style={{ width: "100%", maxWidth: 430 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#198754", marginBottom: 8 }}>
            FELDRIX
          </div>

          <h2 style={{ fontSize: 38, color: "#14532d", marginBottom: 10 }}>
            Create Account
          </h2>

          <p style={{ color: "#6b7280", marginBottom: 35, fontSize: 16 }}>
            Create your Feldrix account to get started.
          </p>

          {fields.map(({ name, label, type, placeholder }) => (
            <input
              key={name}
              name={name}
              type={type}
              placeholder={placeholder}
              value={form[name]}
              onChange={update}
              disabled={loading}
              style={desktopInputStyle}
            />
          ))}

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%", padding: 20, border: "none", borderRadius: 14,
              background: "linear-gradient(135deg,#198754 0%,#157347 100%)",
              color: "#fff", fontSize: 17, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: 8,
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div style={{ marginTop: 35, textAlign: "center", color: "#6b7280", fontSize: 15 }}>
            Already have an account?
            <Link to="/login" style={{ marginLeft: 6, color: "#198754", fontWeight: 700, textDecoration: "none" }}>
              Sign In
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
  mb: 0.75,
  fontWeight: 600,
  color: "#374151",
  fontSize: "0.8125rem",
};

const inputSx = {
  width: "100%",
  p: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
  minHeight: 48,
  "&:focus": {
    borderColor: "#198754",
    boxShadow: "0 0 0 3px rgba(25,135,84,0.1)",
  },
};

const submitBtnSx = (loading) => ({
  width: "100%",
  py: 2,
  mt: 1,
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(135deg,#198754 0%,#157347 100%)",
  color: "#fff",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.7 : 1,
  transition: "all .25s ease",
  minHeight: 52,
  "&:active": {
    transform: "scale(0.98)",
  },
});

// ─── Desktop inline styles (unchanged) ───────────────────────
const desktopInputStyle = {
  width: "100%",
  padding: "18px",
  marginBottom: 18,
  border: "1px solid #d1d5db",
  borderRadius: 14,
  fontSize: 16,
  boxSizing: "border-box",
  outline: "none",
};
