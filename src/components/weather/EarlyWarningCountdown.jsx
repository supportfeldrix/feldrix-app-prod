/**
 * Feldrix — Early Warning Countdown Component
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Displays countdown alerts with escalating recommendations:
 *   72 HOURS BEFORE — Monitor weather. Review preparation checklist.
 *   24 HOURS BEFORE — Prepare livestock shelters. Protect crops.
 *    6 HOURS BEFORE — Immediate action required. Move calves. Drain pipes.
 *   DURING EVENT    — Extreme Weather In Progress. Remain safe.
 *   AFTER EVENT     — Inspection checklist. Record damage.
 *
 * Visual design:
 *   - Large countdown timer (e.g. "12h 30m")
 *   - Phase indicator bar showing progress through warning stages
 *   - Color-coded urgency (green → yellow → orange → red)
 *   - Expandable recommendation list for current phase
 */

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { radius, transitions } from "../../design/tokens";

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE STYLING
// ═══════════════════════════════════════════════════════════════════════════════

const PHASE_STYLES = {
  monitor: {
    color: "#22C55E",
    bgColor: "rgba(34, 197, 94, 0.06)",
    borderColor: "rgba(34, 197, 94, 0.25)",
    label: "MONITORING",
    progressPercent: 20,
  },
  prepare: {
    color: "#EAB308",
    bgColor: "rgba(234, 179, 8, 0.06)",
    borderColor: "rgba(234, 179, 8, 0.25)",
    label: "PREPARE NOW",
    progressPercent: 50,
  },
  immediate: {
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.06)",
    borderColor: "rgba(249, 115, 22, 0.25)",
    label: "IMMEDIATE ACTION",
    progressPercent: 80,
  },
  active: {
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.06)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    label: "IN PROGRESS",
    progressPercent: 100,
  },
  recovery: {
    color: "#6B7280",
    bgColor: "rgba(107, 114, 128, 0.06)",
    borderColor: "rgba(107, 114, 128, 0.2)",
    label: "RECOVERY",
    progressPercent: 100,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN TIMER HOOK
// ═══════════════════════════════════════════════════════════════════════════════

function useCountdownTimer(hoursUntil) {
  const [display, setDisplay] = useState(formatTime(hoursUntil));

  useEffect(() => {
    setDisplay(formatTime(hoursUntil));

    // Update every minute for precision
    const interval = setInterval(() => {
      // This is approximate — real-time countdown would need the actual event timestamp
      setDisplay(formatTime(hoursUntil));
    }, 60000);

    return () => clearInterval(interval);
  }, [hoursUntil]);

  return display;
}

function formatTime(hours) {
  if (hours === null || hours === undefined) return "—";
  if (hours <= 0) return "NOW";

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h >= 24) {
    const days = Math.floor(h / 24);
    const remainH = h % 24;
    return `${days}d ${remainH}h`;
  }

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE WARNING CARD
// ═══════════════════════════════════════════════════════════════════════════════

function WarningCard({ warning }) {
  const [expanded, setExpanded] = useState(false);
  const countdown = useCountdownTimer(warning.hoursUntil);
  const phase = warning.stage?.phase || "monitor";
  const style = PHASE_STYLES[phase] || PHASE_STYLES.monitor;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: radius.card,
        border: `1px solid ${style.borderColor}`,
        bgcolor: style.bgColor,
        borderLeft: `4px solid ${style.color}`,
        transition: transitions.hover,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Top Row: Icon + Title + Countdown */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ fontSize: 28, lineHeight: 1 }}>{warning.icon}</Typography>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                {warning.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {warning.stage?.label || "Weather Event"}
              </Typography>
            </Box>
          </Stack>

          {/* Countdown Display */}
          <Stack alignItems="flex-end" spacing={0.5}>
            <Typography
              sx={{
                fontSize: warning.hoursUntil <= 0 ? "1.2rem" : "1.6rem",
                fontWeight: 800,
                color: style.color,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                fontFamily: "'Inter', monospace",
              }}
            >
              {countdown}
            </Typography>
            <Chip
              label={style.label}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.58rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                bgcolor: `${style.color}20`,
                color: style.color,
                border: `1px solid ${style.color}40`,
              }}
            />
          </Stack>
        </Stack>

        {/* Progress Bar — Shows how close the event is */}
        <Box sx={{ mt: 2, mb: 1.5 }}>
          <Box
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${style.progressPercent}%`,
                borderRadius: 2,
                bgcolor: style.color,
                transition: "width 0.6s ease",
              }}
            />
          </Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, px: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "text.disabled" }}>
              72h
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "text.disabled" }}>
              24h
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "text.disabled" }}>
              6h
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "text.disabled" }}>
              Now
            </Typography>
          </Stack>
        </Box>

        {/* Warning Message */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
          {warning.message}
        </Typography>

        {/* Expandable Recommendations */}
        {warning.recommendations && warning.recommendations.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              onClick={() => setExpanded(!expanded)}
              sx={{
                cursor: "pointer",
                py: 0.5,
                "&:hover": { opacity: 0.8 },
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: style.color, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {expanded ? "Hide" : "View"} Recommended Actions ({warning.recommendations.length})
              </Typography>
              {expanded ? (
                <ExpandLessIcon sx={{ fontSize: 16, color: style.color }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 16, color: style.color }} />
              )}
            </Stack>

            <Collapse in={expanded}>
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                {warning.recommendations.map((rec, i) => (
                  <Stack key={i} direction="row" alignItems="flex-start" spacing={1}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: style.color,
                        mt: 0.8,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" color="text.primary" sx={{ fontSize: "0.82rem" }}>
                      {rec}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function EarlyWarningCountdown({ warnings = [] }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {warnings.map((warning) => (
        <WarningCard key={warning.id} warning={warning} />
      ))}
    </Stack>
  );
}
