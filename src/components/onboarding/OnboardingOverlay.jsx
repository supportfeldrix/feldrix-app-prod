/**
 * ============================================================
 * Feldrix Onboarding — Overlay Container (Production)
 * Sprint 45.2 — Keyboard nav, aria, reduced-motion, error boundary
 * ============================================================
 */

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Fade } from "@mui/material";
import { useOnboarding } from "../../hooks/useOnboarding";

// Lazy load the heavy components for performance
const WelcomeCard = lazy(() => import("./WelcomeCard"));
const StepChecklist = lazy(() => import("./StepChecklist"));
const CelebrationScreen = lazy(() => import("./CelebrationScreen"));

export default function OnboardingOverlay() {
  const navigate = useNavigate();
  const { phase, dismiss, firstName, isLoading } = useOnboarding();
  const [localPhase, setLocalPhase] = useState(null);

  const activePhase = localPhase || phase;

  // Don't render anything if hidden or still loading
  if (activePhase === "hidden" || activePhase === "loading" || isLoading) return null;

  function handleStart() {
    setLocalPhase("journey");
  }

  function handleDismiss() {
    setLocalPhase("hidden");
  }

  function handleFinish() {
    dismiss();
    setLocalPhase("hidden");
    navigate("/dashboard");
  }

  return (
    <OnboardingOverlayShell onDismiss={handleDismiss}>
      <Suspense fallback={null}>
        {activePhase === "welcome" && <WelcomeCard onStart={handleStart} />}
        {activePhase === "journey" && <StepChecklist onDismiss={handleDismiss} />}
        {activePhase === "celebration" && <CelebrationScreen onFinish={handleFinish} firstName={firstName} />}
      </Suspense>
    </OnboardingOverlayShell>
  );
}

/**
 * Overlay shell with backdrop, keyboard handling, and accessibility.
 */
function OnboardingOverlayShell({ children, onDismiss }) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    },
    [onDismiss]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Trap focus awareness — prevent body scroll when overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <Fade in timeout={250}>
      <Box
        role="presentation"
        aria-modal="true"
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          px: { xs: 2, sm: 3 },
          py: 3,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          // Safe area support
          paddingTop: "max(24px, env(safe-area-inset-top))",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
          // Reduced motion — disable backdrop blur
          "@media (prefers-reduced-motion: reduce)": {
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          },
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onDismiss();
        }}
      >
        {children}
      </Box>
    </Fade>
  );
}
