/**
 * Feldrix — Weather Checklist Component
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Interactive preparation checklists that farmers can tick off.
 * Automatically generated based on weather conditions:
 *   - Freeze Checklist
 *   - Storm Checklist
 *   - Heat Checklist
 *   - Flood Checklist
 *   - Hail Checklist
 *
 * State persisted in localStorage so checked items survive page refreshes.
 * Checklists reset when the weather condition changes (new checklist generated).
 */

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { radius, transitions } from "../../design/tokens";

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "feldrix_weather_checklists";

function getStoredChecks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredChecks(checks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
  } catch { /* unavailable */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WeatherChecklist({ checklists = [] }) {
  const [checks, setChecks] = useState(() => getStoredChecks());

  // Persist checks to localStorage whenever they change
  useEffect(() => {
    saveStoredChecks(checks);
  }, [checks]);

  const handleToggle = useCallback((checklistId, itemId) => {
    setChecks((prev) => {
      const key = `${checklistId}__${itemId}`;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const handleResetChecklist = useCallback((checklistId, items) => {
    setChecks((prev) => {
      const next = { ...prev };
      for (const item of items) {
        delete next[`${checklistId}__${item.id}`];
      }
      return next;
    });
  }, []);

  if (!checklists || checklists.length === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {checklists.map((checklist) => {
        const items = checklist.items || [];
        const completedCount = items.filter((item) => checks[`${checklist.id}__${item.id}`]).length;
        const totalCount = items.length;
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const isComplete = completedCount === totalCount && totalCount > 0;

        return (
          <Card
            key={checklist.id}
            elevation={0}
            sx={{
              borderRadius: radius.card,
              border: "1px solid",
              borderColor: isComplete ? "success.light" : "divider",
              bgcolor: isComplete ? "rgba(34, 197, 94, 0.03)" : "background.paper",
              transition: transitions.hover,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              {/* Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography sx={{ fontSize: 24, lineHeight: 1 }}>{checklist.icon}</Typography>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      {checklist.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {completedCount}/{totalCount} completed
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={checklist.priority}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.6rem",
                      height: 20,
                      bgcolor:
                        checklist.priority === "Critical" ? "error.main"
                          : checklist.priority === "High" ? "warning.main"
                            : "info.main",
                      color: "#fff",
                    }}
                  />
                  {isComplete && (
                    <Chip
                      label="\u2713 Done"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.6rem",
                        height: 20,
                        bgcolor: "success.main",
                        color: "#fff",
                      }}
                    />
                  )}
                </Stack>
              </Stack>

              {/* Progress Bar */}
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  mb: 2,
                  bgcolor: "rgba(0,0,0,0.06)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    bgcolor: isComplete ? "success.main" : "primary.main",
                    transition: "transform 0.4s ease",
                  },
                }}
              />

              {/* Checklist Items */}
              <Stack spacing={0}>
                {items.map((item, i) => {
                  const key = `${checklist.id}__${item.id}`;
                  const isChecked = !!checks[key];

                  return (
                    <Box key={item.id}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        onClick={() => handleToggle(checklist.id, item.id)}
                        sx={{
                          py: 0.8,
                          px: 0.5,
                          borderRadius: 1.5,
                          cursor: "pointer",
                          transition: transitions.fast,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          size="small"
                          sx={{
                            p: 0.5,
                            color: "text.disabled",
                            "&.Mui-checked": {
                              color: "success.main",
                            },
                          }}
                          inputProps={{ "aria-label": item.text }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: isChecked ? "line-through" : "none",
                            color: isChecked ? "text.disabled" : "text.primary",
                            fontWeight: isChecked ? 400 : 500,
                            transition: transitions.fast,
                          }}
                        >
                          {item.text}
                        </Typography>
                      </Stack>
                      {i < items.length - 1 && (
                        <Divider sx={{ ml: 4.5, opacity: 0.5 }} />
                      )}
                    </Box>
                  );
                })}
              </Stack>

              {/* Reset button (only show when some items are checked) */}
              {completedCount > 0 && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{
                    mt: 1.5,
                    display: "block",
                    textAlign: "right",
                    cursor: "pointer",
                    "&:hover": { color: "text.secondary" },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetChecklist(checklist.id, items);
                  }}
                >
                  Reset checklist
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
