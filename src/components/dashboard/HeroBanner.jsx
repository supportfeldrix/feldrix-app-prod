import {
  CheckCircle,
  Error as ErrorIcon,
  WarningAmber,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ChevronRight,
  Lightbulb,
} from "@mui/icons-material";

import { useWeatherBanner, useWeatherRisk } from "../../context/WeatherContext";

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────

function getStaticGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 23) return "Good Evening";
  return "Welcome Back";
}

function getModuleIcon(module) {
  switch (module) {
    case "Livestock": return "\uD83D\uDC04";
    case "Crops": return "\uD83C\uDF3E";
    case "Machinery": return "\uD83D\uDE9C";
    case "Planner": return "\uD83D\uDCCB";
    case "Finance": return "\uD83D\uDCB3";
    default: return "\uD83D\uDCCA";
  }
}

function getStatusBorder(status) {
  switch (status) {
    case "critical": return "rgba(244,67,54,.5)";
    case "warning": return "rgba(255,152,0,.5)";
    default: return "rgba(255,255,255,.18)";
  }
}

function getStatusDotColor(status) {
  switch (status) {
    case "critical": return "#F44336";
    case "warning": return "#FF9800";
    default: return "#4CAF50";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

function StatusIcon({ status }) {
  const style = { fontSize: 13, opacity: 0.9 };
  switch (status) {
    case "critical": return <ErrorIcon sx={{ ...style, color: "#F44336" }} />;
    case "warning": return <WarningAmber sx={{ ...style, color: "#FF9800" }} />;
    default: return <CheckCircle sx={{ ...style, color: "#4CAF50" }} />;
  }
}

function TrendIcon({ trend }) {
  if (!trend) return null;
  const style = { fontSize: 12, opacity: 0.75 };
  switch (trend) {
    case "positive": return <TrendingUp sx={{ ...style, color: "#4CAF50" }} />;
    case "negative": return <TrendingDown sx={{ ...style, color: "#F44336" }} />;
    default: return <TrendingFlat sx={{ ...style, color: "#fff" }} />;
  }
}

// ─── HeroHeader ──────────────────────────────────────────────────────────────

function HeroHeader({ greeting, summary, farmName, farmRegion }) {
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div style={{ marginBottom: 8 }}>
      {(farmName || farmRegion) && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            opacity: 0.8,
            marginBottom: 4,
            letterSpacing: "0.01em",
          }}
        >
          {farmName}{farmName && farmRegion ? " • " : ""}{farmRegion}
        </div>
      )}
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          opacity: 0.55,
          marginBottom: 18,
        }}
      >
        {today}
      </div>
      <h1
        style={{
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          margin: 0,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {greeting}
      </h1>
      <p
        style={{
          fontSize: 15,
          fontWeight: 400,
          opacity: 0.85,
          marginTop: 12,
          maxWidth: 520,
          lineHeight: 1.6,
          margin: "12px 0 0 0",
        }}
      >
        {summary}
      </p>
    </div>
  );
}

// ─── WeatherPanel ────────────────────────────────────────────────────────────

function WeatherPanel({ weather, weatherText, riskBadge }) {
  return (
    <div
      style={{
        textAlign: "center",
        flexShrink: 0,
        marginLeft: 32,
        background: "rgba(255,255,255,.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "24px 28px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,.15)",
        minWidth: 180,
        boxShadow: "0 8px 32px rgba(0,0,0,.12)",
      }}
    >
      {weather?.available ? (
        <div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {weather.current?.temperature ?? ""}&deg;
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8, fontWeight: 600 }}>
            {weather.current?.condition || weatherText || ""}
          </div>
          {(weather.current?.high || weather.current?.low) && (
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6, fontWeight: 400 }}>
              H: {weather.current?.high ?? ""}&deg; &nbsp; L: {weather.current?.low ?? ""}&deg;
            </div>
          )}
          <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4, fontWeight: 400 }}>
            {weather.current?.humidity ? `Humidity ${weather.current.humidity}%` : ""}
            {weather.current?.humidity && weather.current?.windSpeed ? " • " : ""}
            {weather.current?.windSpeed ? `Wind ${weather.current.windSpeed} km/h` : ""}
          </div>
          {riskBadge && riskBadge.level !== "LOW" && (
            <div
              style={{
                marginTop: 10,
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "4px 10px",
                borderRadius: 12,
                background: `${riskBadge.color}30`,
                color: riskBadge.color,
                border: `1px solid ${riskBadge.color}50`,
              }}
            >
              {riskBadge.emoji} {riskBadge.level} RISK
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, opacity: 0.4, fontWeight: 500 }}>
          Weather<br />unavailable
        </div>
      )}
    </div>
  );
}

// ─── RecommendationCard ──────────────────────────────────────────────────────

function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  return (
    <div
      style={{
        marginTop: 20,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "rgba(255,255,255,.1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderLeft: "3px solid #3FAE66",
        borderRadius: 12,
        padding: "14px 18px",
        maxWidth: 480,
        boxShadow: "0 4px 16px rgba(0,0,0,.08)",
      }}
    >
      <Lightbulb sx={{ fontSize: 16, color: "#3FAE66", mt: "2px", flexShrink: 0 }} />
      <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.55, fontWeight: 400 }}>
        {recommendation}
      </div>
    </div>
  );
}

// ─── HighlightRow ────────────────────────────────────────────────────────────

function HighlightRow({ highlights }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
      {highlights.map((h, i) => (
        <div
          key={i}
          style={{
            fontSize: 12,
            fontWeight: 500,
            opacity: 0.92,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,.1)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.12)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#3FAE66",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {h}
        </div>
      ))}
    </div>
  );
}

// ─── KPICard ─────────────────────────────────────────────────────────────────

function KPICard({ icon, label, value, sub, accent, status, trend, onClick }) {
  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      role="button"
      tabIndex={onClick ? 0 : -1}
      aria-label={`${label}: ${value}. ${sub}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      style={{
        position: "relative",
        background: accent ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.12)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        padding: "20px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        border: `1px solid ${getStatusBorder(status)}`,
        boxShadow: "0 4px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.08)",
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1)",
        cursor: onClick ? "pointer" : "default",
        outline: "none",
        minHeight: 88,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 16px 40px rgba(15,81,50,.25), inset 0 1px 0 rgba(255,255,255,.12)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.08)";
      }}
      onFocus={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 16px 40px rgba(15,81,50,.25), inset 0 1px 0 rgba(255,255,255,.12)";
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.08)";
      }}
    >
      <div style={{ fontSize: 34, lineHeight: 1 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: getStatusDotColor(status),
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontSize: 11,
              opacity: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </div>
          <TrendIcon trend={trend} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          <StatusIcon status={status} />
          <div style={{ fontSize: 11, opacity: 0.72, fontWeight: 400 }}>{sub}</div>
        </div>
      </div>
      {onClick && (
        <ChevronRight
          sx={{
            fontSize: 14,
            opacity: 0.3,
            position: "absolute",
            bottom: 8,
            right: 8,
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function HeroBanner({
  totalAnimals = 0,
  totalCrops = 0,
  pregnantBreeding = 0,
  healthDue = 0,
  weather = null,
  machineryCount = 0,
  plannerOverdue = 0,
  plannerToday = 0,
  farmHealthScore = 0,
  farmHealthStatus = "",
  smartCards = [],
  onCardClick,
  dailyBriefing = null,
  userName = "",
  farmName = "",
  farmRegion = "",
}) {
  // ─── Weather Intelligence Integration ──────────────────────────────────────
  // Weather banner from Intelligence Engine takes priority over generic greetings
  // when severe weather is detected. This ensures farmers see critical alerts.
  const weatherBanner = useWeatherBanner();
  const weatherRisk = useWeatherRisk();

  // Determine if weather should override the default greeting
  const weatherOverride = weatherBanner.priority === "critical" || weatherBanner.priority === "warning";

  // Use briefing data if available, fallback to static
  const baseGreeting = weatherOverride
    ? weatherBanner.greeting
    : (dailyBriefing?.greeting || getStaticGreeting());

  const greeting = weatherOverride
    ? baseGreeting
    : (userName ? `${baseGreeting}, ${userName}` : baseGreeting);

  const summary = weatherOverride
    ? weatherBanner.subtitle
    : (dailyBriefing?.summary || "Your farm is looking great today.");

  const recommendation = weatherOverride
    ? (weatherBanner.action || null)
    : (dailyBriefing?.recommendation || null);

  const highlights = dailyBriefing?.highlights?.slice(0, 3) || [];
  const weatherText = dailyBriefing?.weatherSummary || null;

  const priority = weatherOverride
    ? weatherBanner.priority
    : (dailyBriefing?.priority || "good");

  // Priority accent for left border
  const accentColor =
    priority === "critical"
      ? "rgba(244,67,54,.6)"
      : priority === "warning"
      ? "rgba(255,152,0,.5)"
      : "rgba(63,174,102,.4)";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        color: "#fff",
        boxShadow: "0 8px 40px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08)",
        borderLeft: `4px solid ${accentColor}`,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Background — reuses Login page farm images */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: (() => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return "url('/branding/login/login-sunrise.png')";
            if (hour >= 12 && hour < 18) return "url('/branding/login/login-sunset.png')";
            return "url('/branding/login/login-night.png')";
          })(),
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          zIndex: 0,
        }}
      />
      {/* Soft dark green overlay with radial gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(27,94,32,.82) 0%, rgba(15,81,50,.88) 40%, rgba(36,92,60,.9) 100%)",
          zIndex: 1,
        }}
      />
      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.25) 100%)",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "48px 48px 40px",
          minHeight: 380,
          animation: "fadeIn 0.6s ease-out",
        }}
      >
        {/* Top Row: Left (Header/Summary/Recommendation/Highlights) + Right (Weather) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 36,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          {/* Left Column */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <HeroHeader greeting={greeting} summary={summary} farmName={farmName} farmRegion={farmRegion} />
            <RecommendationCard recommendation={recommendation} />
            <HighlightRow highlights={highlights} />
          </div>

          {/* Right Column — Weather */}
          <WeatherPanel weather={weather} weatherText={weatherText} riskBadge={weatherRisk} />
        </div>

        {/* KPI Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 18,
          }}
        >
          {smartCards.length > 0 ? (
            smartCards.map((card) => (
              <KPICard
                key={card.id}
                icon={getModuleIcon(card.module)}
                label={card.title}
                value={card.value}
                sub={card.subtitle}
                status={card.status}
                trend={card.trend}
                onClick={() => onCardClick?.(card.route)}
              />
            ))
          ) : (
            <>
              <KPICard
                icon={"\uD83D\uDC04"}
                label="Livestock"
                value={totalAnimals}
                sub="Total Animals"
                status="good"
              />
              <KPICard
                icon={"\uD83C\uDF3E"}
                label="Crops"
                value={totalCrops}
                sub="Active Fields"
                status="good"
              />
              <KPICard
                icon={"\uD83D\uDE9C"}
                label="Machinery"
                value={machineryCount > 0 ? machineryCount : "\u2713"}
                sub={machineryCount > 0 ? "Service Due" : "Active"}
                status={machineryCount > 0 ? "warning" : "good"}
              />
              <KPICard
                icon={"\uD83D\uDCCB"}
                label="Planner"
                value={plannerOverdue + plannerToday}
                sub="Items Today"
                status={plannerOverdue > 0 ? "critical" : "good"}
              />
              <KPICard
                icon={"\uD83D\uDCB3"}
                label="Finance"
                value={`R ${farmHealthScore.toLocaleString()}`}
                sub={farmHealthStatus || "Score"}
                status="good"
                accent
              />
            </>
          )}
        </div>
      </div>

      {/* Fade-in keyframe (injected inline for portability) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
