/**
 * ============================================================
 * Feldrix Onboarding — Trigger Button
 * Sprint 45.1
 *
 * Allows users to reopen the onboarding from Account / Help.
 * Only visible when onboarding is dismissed but not 100% complete,
 * or always available as a "Getting Started" option.
 * ============================================================
 */

import { Box, Typography, Button, Stack, LinearProgress } from "@mui/material";
import { PlayArrow } from "@mui/icons-material";
import { useOnboarding } from "../../hooks/useOnboarding";

export default function OnboardingTrigger() {
  const { progress, isComplete, reopen } = useOnboarding();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: isComplete ? "rgba(46,125,50,0.03)" : "#ffffff",
        border: "1px solid",
        borderColor: isComplete ? "rgba(46,125,50,0.12)" : "divider",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#0D2F1F", mb: 0.5 }}>
            {isComplete ? "✅ Setup Complete" : "🚀 Getting Started"}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1.5 }}>
            {isComplete
              ? "Your farm is fully set up. View your setup journey anytime."
              : `Your farm setup is ${progress}% complete. Continue where you left off.`}
          </Typography>

          {!isComplete && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: "rgba(46,125,50,0.06)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  bgcolor: "primary.main",
                },
              }}
            />
          )}
        </Box>

        <Button
          variant={isComplete ? "outlined" : "contained"}
          size="small"
          startIcon={<PlayArrow sx={{ fontSize: "1rem !important" }} />}
          onClick={reopen}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            px: 2,
            minHeight: 40,
            flexShrink: 0,
          }}
        >
          {isComplete ? "Review" : "Continue"}
        </Button>
      </Stack>
    </Box>
  );
}
