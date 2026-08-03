import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    farmName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  // -----------------------------------
  // Register User
  // -----------------------------------

  const handleRegister = async () => {
    if (
      !form.fullName ||
      !form.farmName ||
      !form.email ||
      !form.password
    ) {
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

      const { data, error } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

      if (error) throw error;

      const user = data.user;

      if (!user) {
        throw new Error("Unable to create account.");
      }

      const { error: profileError } =
        await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: form.fullName,
            email: form.email,
            farm_name: form.farmName,
            farm_type: "Mixed Farming",
            province: "",
            country: "South Africa",
            farm_size: 0,
            preferred_units: "Metric",
            weather_alerts: true,
            ai_recommendations: true,
            weekly_summary: true,
            email_notifications: true,
            sms_notifications: false,
          }, { onConflict: "id" });

      if (profileError) {
        console.error("=================================");
        console.error("PROFILE INSERT FAILED");
        console.error(profileError);
        console.error("Code:", profileError.code);
        console.error("Message:", profileError.message);
        console.error("Details:", profileError.details);
        console.error("Hint:", profileError.hint);
        console.error("=================================");
        throw profileError;
      }

      alert(
        "Account created successfully! Please sign in."
      );

      navigate("/login");
    } catch (err) {
      console.error("=================================");
      console.error("REGISTER ERROR");
      console.error(err);
      console.error("Code:", err.code);
      console.error("Message:", err.message);
      console.error("Details:", err.details);
      console.error("Hint:", err.hint);
      console.error("=================================");
      alert(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // Dynamic Background & Greeting
  // -----------------------------------

  const hour = new Date().getHours();

  let backgroundImage =
    "/branding/login/login-sunrise.png";

  let greeting = "Start Your Journey";

  if (hour >= 12 && hour < 18) {
    backgroundImage =
      "/branding/login/login-sunset.png";
    greeting = "Welcome to Feldrix";
  }

  if (hour >= 18 || hour < 5) {
    backgroundImage =
      "/branding/login/login-night.png";
    greeting = "Build Your Farm";
  }

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
            style={{
              width: 320,
              marginBottom: 45,
            }}
          />

          <h1
            style={{
              fontSize: 68,
              lineHeight: 1,
              marginBottom: 24,
              fontWeight: 700,
            }}
          >
            {greeting}
          </h1>

          <p
            style={{
              fontSize: 24,
              lineHeight: 1.7,
              opacity: 0.95,
              marginBottom: 45,
            }}
          >
            Create your Feldrix account and start
            managing livestock, crops, finance,
            machinery and daily farm operations
            from one powerful platform.
          </p>

          <div
            style={{
              display: "grid",
              gap: 24,
            }}
          >
	              <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.18)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Smart Livestock Management
                </div>

                <div style={{ opacity: 0.9 }}>
                  Keep every animal organised from day one.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.18)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Financial Control
                </div>

                <div style={{ opacity: 0.9 }}>
                  Track income and expenses with confidence.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.18)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  AI Farm Intelligence
                </div>

                <div style={{ opacity: 0.9 }}>
                  Grow your farm with intelligent insights.
                </div>
              </div>
            </div>
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
        <div
          style={{
            width: "100%",
            maxWidth: 430,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#198754",
              marginBottom: 8,
            }}
          >
            FELDRIX
          </div>

          <h2
            style={{
              fontSize: 38,
              color: "#14532d",
              marginBottom: 10,
            }}
          >
            Create Account
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginBottom: 35,
              fontSize: 16,
            }}
          >
            Create your Feldrix account to get started.
          </p>

          {[
            ["fullName", "Full Name"],
            ["farmName", "Farm Name"],
            ["email", "Email Address", "email"],
            ["password", "Password", "password"],
            ["confirmPassword", "Confirm Password", "password"],
          ].map(([name, label, type]) => (
            <input
              key={name}
              name={name}
              type={type || "text"}
              placeholder={label}
              value={form[name]}
              onChange={update}
              disabled={loading}
              style={inputStyle}
            />
          ))}

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%",
              padding: 20,
              border: "none",
              borderRadius: 14,
              background:
                "linear-gradient(135deg,#198754 0%,#157347 100%)",
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div
            style={{
              marginTop: 35,
              textAlign: "center",
              color: "#6b7280",
              fontSize: 15,
            }}
          >
            Already have an account?

            <Link
              to="/login"
              style={{
                marginLeft: 6,
                color: "#198754",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </div>

          <div
            style={{
              marginTop: 45,
              paddingTop: 24,
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
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

const inputStyle = {
  width: "100%",
  padding: "18px",
  marginBottom: 18,
  border: "1px solid #d1d5db",
  borderRadius: 14,
  fontSize: 16,
  boxSizing: "border-box",
  outline: "none",
};
