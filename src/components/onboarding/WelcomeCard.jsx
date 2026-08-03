/**
 * ============================================================
 * Feldrix Onboarding — Premium Welcome Card
 * Sprint 45.2 — Polished with circular progress, animations
 * ============================================================
 */

import { Box, Typography, Button, Stack, Fade, Grow } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { useOnboarding } from "../../hooks/useOnboarding";
import { getTimeGreeting, getWelcomeMessage, estimateRemainingTime } from "../../utils/onboardingUtils";

function CircularProgress({ value, size = 100, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <Box sx={{ position: "relative", width: size, height: size, mx: "auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(46,125,50,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#66BB6A" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{ fontSize: "1.5rem", fontWeight: 800, color: "#2E7D32", lineHeight: 1 }}
          aria-label={`Setup progress ${value} percent`}
        >
          {value}%
        </Typography>
        <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", mt: 0.25, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Complete
        </Typography>
      </Box>
    </Box>
  );
}

export default function WelcomeCard({ onStart }) {
  const { firstName, farmName, progress, steps } = useOnboarding();

  const greeting = getTimeGreeting();
  const message = getWelcomeMessage(firstName, farmName);
  const timeEstimate = estimateRemainingTime(steps);

  return (
    <Grow in timeout={400}>
      <Box
        role="dialog"
        aria-labelledby="onboarding-welcome-title"
        aria-describedby="onboarding-welcome-desc"
        sx={{
          width: "100%",
          maxWidth: 440,
          mx: "auto",
          p: { xs: 3.5, sm: 5 },
          borderRadius: 4,
          bgcolor: "#ffffff",
          boxShadow: "0 32px 100px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.06)",
          border: "1px solid rgba(46,125,50,0.06)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #2E7D32, #66BB6A, #2E7D32)",
          }}
        />

        {/* Greeting */}
        <Fade in timeout={600}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: "1.75rem", mb: 1 }}>👋</Typography>
            <Typography
              id="onboarding-welcome-title"
              sx={{
                fontSize: { xs: "1.4rem", sm: "1.6rem" },
                fontWeight: 800,
                color: "#0D2F1F",
                letterSpacing: "-0.02em",
                mb: 0.5,
              }}
            >
              {greeting}, {firstName}
            </Typography>
            <Typography
              id="onboarding-welcome-desc"
              sx={{
                fontSize: "0.95rem",
                color: "text.secondary",
                lineHeight: 1.6,
              }}
            >
              {message}
            </Typography>
          </Box>
        </Fade>

        {/* Circular progress */}
        <Fade in timeout={800} style={{ transitionDelay: "200ms" }}>
          <Box sx={{ mb: 3 }}>
            <CircularProgress value={progress} size={110} strokeWidth={9} />
          </Box>
        </Fade>

        {/* Stats row */}
        <Fade in timeout={800} style={{ transitionDelay: "400ms" }}>
          <Stack
            direction="row"
            spacing={0}
            sx={{
              mb: 4,
              borderRadius: 2.5,
              bgcolor: "#f8faf8",
              border: "1px solid rgba(46,125,50,0.06)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ flex: 1, py: 2, borderRight: "1px solid rgba(46,125,50,0.06)" }}>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#2E7D32" }}>
                {steps.filter((s) => s.complete).length}/{steps.length}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Steps Done
              </Typography>
            </Box>
            <Box sx={{ flex: 1, py: 2 }}>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#0D2F1F" }}>
                {timeEstimate}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Remaining
              </Typography>
            </Box>
          </Stack>
        </Fade>

        {/* CTA */}
        <Fade in timeout={800} style={{ transitionDelay: "600ms" }}>
          <Box>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={onStart}
              fullWidth
              aria-label="Start farm setup"
              sx={{
                py: 1.75,
                borderRadius: 3,
                fontSize: "1rem",
                fontWeight: 700,
                textTransform: "none",
                background: "linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)",
                boxShadow: "0 4px 16px rgba(46,125,50,0.25)",
                minHeight: 52,
                "&:hover": {
                  background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
                  boxShadow: "0 8px 24px rgba(46,125,50,0.3)",
                },
                "&:active": { transform: "scale(0.98)" },
              }}
            >
              Start Setup
            </Button>

            {/* Skip */}
            <Button
              variant="text"
              size="small"
              onClick={onStart}
              sx={{
                mt: 1.5,
                color: "text.secondary",
                fontSize: "0.8rem",
                textTransform: "none",
                minHeight: 44,
                "&:hover": { color: "primary.main", bgcolor: "transparent" },
              }}
              aria-label="Skip setup and do it later"
            >
              I'll set up later
            </Button>
          </Box>
        </Fade>
      </Box>
    </Grow>
  );
}
