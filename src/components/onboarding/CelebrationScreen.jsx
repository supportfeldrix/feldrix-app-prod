/**
 * ============================================================
 * Feldrix Onboarding — Celebration Screen
 * Sprint 45.2 — Confetti animation, animated progress, dual buttons
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Button, Stack, Grow, Fade } from "@mui/material";
import { ArrowForward, Replay } from "@mui/icons-material";

/**
 * Lightweight confetti burst — uses CSS keyframe particles.
 * No external library needed. Respects prefers-reduced-motion.
 */
function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    color: ["#2E7D32", "#66BB6A", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6"][i % 6],
    size: 4 + Math.random() * 5,
  }));

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        "@media (prefers-reduced-motion: reduce)": { display: "none" },
      }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-5%",
            width: p.size,
            height: p.size,
            borderRadius: p.id % 3 === 0 ? "50%" : "2px",
            bgcolor: p.color,
            opacity: 0.85,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            "@keyframes confettiFall": {
              "0%": {
                transform: `translateY(0) rotate(0deg) scale(1)`,
                opacity: 1,
              },
              "100%": {
                transform: `translateY(400px) rotate(${360 + Math.random() * 360}deg) scale(0.3)`,
                opacity: 0,
              },
            },
          }}
        />
      ))}
    </Box>
  );
}

/**
 * Animated circular progress that fills to 100%.
 */
function AnimatedCircle({ size = 100, strokeWidth = 8 }) {
  const [value, setValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setValue(100), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ position: "relative", width: size, height: size, mx: "auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(46,125,50,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#celebrationGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <defs>
          <linearGradient id="celebrationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#66BB6A" />
          </linearGradient>
        </defs>
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          animation: value === 100 ? "celebratePop 0.4s ease 1.2s both" : "none",
          "@keyframes celebratePop": {
            "0%": { transform: "scale(0.5)", opacity: 0 },
            "50%": { transform: "scale(1.2)" },
            "100%": { transform: "scale(1)", opacity: 1 },
          },
        }}
      >
        🎉
      </Box>
    </Box>
  );
}

export default function CelebrationScreen({ onFinish, firstName }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  function handleReview() {
    // Close celebration, user will see the steps again
    if (onFinish) onFinish();
  }

  return (
    <Grow in timeout={400}>
      <Box
        role="dialog"
        aria-labelledby="celebration-title"
        aria-label="Setup complete celebration"
        sx={{
          width: "100%",
          maxWidth: 460,
          mx: "auto",
          p: { xs: 4, sm: 5 },
          borderRadius: 4,
          bgcolor: "#ffffff",
          boxShadow: "0 32px 100px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.06)",
          border: "1px solid rgba(46,125,50,0.08)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Confetti */}
        <ConfettiBurst />

        {/* Top accent */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #2E7D32, #66BB6A, #F59E0B, #66BB6A, #2E7D32)",
          }}
        />

        {/* Animated circle */}
        <Box sx={{ mb: 3, position: "relative", zIndex: 1 }}>
          <AnimatedCircle size={120} strokeWidth={10} />
        </Box>

        {/* Content — fades in after animation */}
        <Fade in={showContent} timeout={600}>
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              id="celebration-title"
              sx={{
                fontSize: { xs: "1.4rem", sm: "1.65rem" },
                fontWeight: 800,
                color: "#0D2F1F",
                mb: 1,
                letterSpacing: "-0.02em",
              }}
            >
              Congratulations{firstName ? `, ${firstName}` : ""}!
            </Typography>

            <Typography
              sx={{
                fontSize: "1rem",
                color: "text.secondary",
                mb: 0.5,
                lineHeight: 1.6,
              }}
            >
              Your farm is ready.
            </Typography>

            <Typography
              sx={{
                fontSize: "0.9rem",
                color: "text.secondary",
                mb: 4,
              }}
            >
              Welcome to Feldrix. 🌱
            </Typography>

            {/* Step icons summary */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 4 }}
            >
              {["🏡", "🐄", "📋", "💳", "🏠"].map((emoji, i) => (
                <Grow in timeout={300 + i * 100} key={i}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "11px",
                      bgcolor: "rgba(46,125,50,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      border: "1px solid rgba(46,125,50,0.1)",
                    }}
                    aria-hidden="true"
                  >
                    {emoji}
                  </Box>
                </Grow>
              ))}
            </Stack>

            {/* Buttons */}
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={onFinish}
                fullWidth
                aria-label="Go to your farm dashboard"
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
                  },
                  "&:active": { transform: "scale(0.98)" },
                }}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="text"
                size="small"
                startIcon={<Replay sx={{ fontSize: "1rem !important" }} />}
                onClick={handleReview}
                fullWidth
                sx={{
                  color: "text.secondary",
                  textTransform: "none",
                  fontSize: "0.85rem",
                  minHeight: 44,
                  "&:hover": { color: "primary.main", bgcolor: "rgba(46,125,50,0.04)" },
                }}
                aria-label="Review your setup steps"
              >
                Review Setup
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Box>
    </Grow>
  );
}
