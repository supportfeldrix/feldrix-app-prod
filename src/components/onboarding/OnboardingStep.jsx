/**
 * ============================================================
 * Feldrix Onboarding — Single Step Row (Polished)
 * Sprint 45.2 — Completion celebration, accessibility
 * ============================================================
 */

import { Box, Typography, Button, Stack, Grow } from "@mui/material";
import { CheckCircle, ArrowForward } from "@mui/icons-material";

export default function OnboardingStep({ step, isNext, onAction }) {
  const { icon, title, description, actionLabel, complete } = step;

  return (
    <Box
      role="listitem"
      aria-label={`${title} — ${complete ? "completed" : isNext ? "next step" : "pending"}`}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: isNext ? "2px solid" : "1px solid",
        borderColor: isNext ? "primary.main" : complete ? "rgba(46,125,50,0.18)" : "rgba(0,0,0,0.06)",
        bgcolor: complete ? "rgba(46,125,50,0.03)" : isNext ? "rgba(46,125,50,0.02)" : "#ffffff",
        transition: "all 0.25s ease",
        opacity: complete ? 0.8 : 1,
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          borderColor: isNext ? "primary.main" : complete ? "rgba(46,125,50,0.2)" : "rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* Next step accent bar */}
      {isNext && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #2E7D32 0%, #66BB6A 100%)",
          }}
        />
      )}

      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Icon / Checkmark */}
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            bgcolor: complete ? "rgba(46,125,50,0.1)" : isNext ? "rgba(46,125,50,0.06)" : "rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1.2rem",
            transition: "all 0.3s ease",
          }}
        >
          {complete ? (
            <Grow in timeout={400}>
              <CheckCircle sx={{ color: "primary.main", fontSize: 24 }} />
            </Grow>
          ) : (
            <span aria-hidden="true">{icon}</span>
          )}
        </Box>

        {/* Text content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25, flexWrap: "wrap" }}>
            <Typography
              sx={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: complete ? "text.secondary" : "#0D2F1F",
                textDecoration: complete ? "line-through" : "none",
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
            {isNext && !complete && (
              <Box
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: 1.5,
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Next Step
              </Box>
            )}
            {complete && (
              <Typography sx={{ fontSize: "0.7rem", color: "primary.main", fontWeight: 600 }}>
                Done ✓
              </Typography>
            )}
          </Stack>

          <Typography
            sx={{
              fontSize: "0.78rem",
              color: "text.secondary",
              lineHeight: 1.5,
              mb: isNext && !complete ? 1.5 : 0,
            }}
          >
            {description}
          </Typography>

          {/* Action button — only on the highlighted next step */}
          {isNext && !complete && (
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowForward sx={{ fontSize: "0.85rem !important" }} />}
              onClick={() => onAction(step)}
              aria-label={`${actionLabel} — navigate to complete this step`}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                px: 2.5,
                py: 0.85,
                minHeight: 38,
                background: "linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)",
                boxShadow: "0 2px 8px rgba(46,125,50,0.2)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
                },
                "&:active": { transform: "scale(0.97)" },
              }}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
