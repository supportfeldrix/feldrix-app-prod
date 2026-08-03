/**
 * ============================================================
 * Feldrix Onboarding — Guided Setup Journey
 * Sprint 45.2 — Auto-scroll, celebration on complete, polished
 * ============================================================
 */

import { useEffect, useRef } from "react";
import { Box, Typography, LinearProgress, Stack, IconButton, Fade, Grow } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../hooks/useOnboarding";
import { estimateRemainingTime } from "../../utils/onboardingUtils";
import OnboardingStep from "./OnboardingStep";

export default function StepChecklist({ onDismiss }) {
  const navigate = useNavigate();
  const { steps, progress, nextStep, dismiss } = useOnboarding();
  const timeEstimate = estimateRemainingTime(steps);
  const nextStepRef = useRef(null);

  const completedCount = steps.filter((s) => s.complete).length;

  // Auto-scroll to the next step
  useEffect(() => {
    if (nextStepRef.current) {
      const timer = setTimeout(() => {
        nextStepRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [nextStep?.id]);

  function handleAction(step) {
    navigate(step.navigateTo);
    if (onDismiss) onDismiss();
  }

  function handleDismiss() {
    dismiss();
    if (onDismiss) onDismiss();
  }

  return (
    <Grow in timeout={350}>
      <Box
        role="dialog"
        aria-labelledby="onboarding-journey-title"
        aria-label="Farm setup journey"
        sx={{
          width: "100%",
          maxWidth: 520,
          maxHeight: { xs: "85vh", sm: "80vh" },
          mx: "auto",
          borderRadius: 4,
          bgcolor: "#ffffff",
          boxShadow: "0 32px 100px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.06)",
          border: "1px solid rgba(46,125,50,0.06)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header — fixed */}
        <Box
          sx={{
            px: { xs: 3, sm: 4 },
            pt: { xs: 3, sm: 3.5 },
            pb: 2.5,
            background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
            borderBottom: "1px solid rgba(46,125,50,0.06)",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography
                id="onboarding-journey-title"
                sx={{
                  fontSize: { xs: "1.15rem", sm: "1.35rem" },
                  fontWeight: 800,
                  color: "#0D2F1F",
                  letterSpacing: "-0.01em",
                  mb: 0.25,
                }}
              >
                Your Setup Journey
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                {completedCount}/{steps.length} complete · {timeEstimate} remaining
              </Typography>
            </Box>

            <IconButton
              onClick={handleDismiss}
              size="small"
              aria-label="Dismiss onboarding"
              sx={{ color: "text.secondary", mt: -0.5, minWidth: 44, minHeight: 44 }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Stack>

          {/* Progress bar */}
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              aria-label={`Setup progress ${progress} percent`}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "rgba(46,125,50,0.08)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  background: "linear-gradient(90deg, #2E7D32 0%, #66BB6A 100%)",
                  transition: "transform 0.8s ease",
                },
              }}
            />
          </Box>
        </Box>

        {/* Steps — scrollable */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: { xs: 2.5, sm: 3.5 },
            py: 2.5,
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Stack spacing={1.5}>
            {steps.map((step, index) => {
              const isNext = nextStep?.id === step.id;
              return (
                <Fade in timeout={300 + index * 80} key={step.id}>
                  <Box ref={isNext ? nextStepRef : undefined}>
                    <OnboardingStep
                      step={step}
                      isNext={isNext}
                      onAction={handleAction}
                    />
                  </Box>
                </Fade>
              );
            })}
          </Stack>
        </Box>

        {/* Footer hint */}
        <Box
          sx={{
            px: { xs: 3, sm: 4 },
            py: 2,
            borderTop: "1px solid rgba(0,0,0,0.04)",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
            Reopen anytime from <strong>Account → Getting Started</strong>
          </Typography>
        </Box>
      </Box>
    </Grow>
  );
}
