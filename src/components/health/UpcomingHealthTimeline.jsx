import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  alpha,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import MedicationIcon from "@mui/icons-material/Medication";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HealingIcon from "@mui/icons-material/Healing";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FavoriteIcon from "@mui/icons-material/Favorite";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddIcon from "@mui/icons-material/Add";

function getEventIcon(type) {
  switch (type) {
    case "Vaccination": return <VaccinesIcon sx={{ fontSize: 22 }} />;
    case "Medication": return <MedicationIcon sx={{ fontSize: 22 }} />;
    case "Veterinary": return <LocalHospitalIcon sx={{ fontSize: 22 }} />;
    case "Deworming": return <HealingIcon sx={{ fontSize: 22 }} />;
    case "Treatment": return <HealingIcon sx={{ fontSize: 22 }} />;
    case "Follow-up": return <AssignmentIcon sx={{ fontSize: 22 }} />;
    default: return <FavoriteIcon sx={{ fontSize: 22 }} />;
  }
}

function getRelativeLabel(diffDays) {
  if (diffDays < -1) return `Overdue`;
  if (diffDays === -1) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `In ${diffDays} Days`;
  if (diffDays <= 14) return "Next Week";
  return `In ${Math.round(diffDays / 7)} Weeks`;
}

function getChipColor(diffDays) {
  if (diffDays < 0) return "error";
  if (diffDays === 0) return "info";
  if (diffDays <= 3) return "warning";
  return "success";
}

function getGroup(diffDays) {
  if (diffDays < 0) return "OVERDUE";
  if (diffDays === 0) return "TODAY";
  if (diffDays <= 7) return "THIS WEEK";
  return "UPCOMING";
}

function getGroupColor(group, palette) {
  switch (group) {
    case "OVERDUE": return palette.error.main;
    case "TODAY": return palette.warning.main;
    case "THIS WEEK": return palette.info.main;
    default: return palette.text.disabled;
  }
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function buildTimelineEvents(healthRecords) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const events = [];

  for (const record of healthRecords) {
    if (!record.next_due) continue;

    // Completed treatments are no longer outstanding health events.
    if (record.completed_at) continue;

    const dueDate = new Date(record.next_due);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate > thirtyDaysFromNow) continue;

    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    events.push({
      id: record.id,
      animalId: record.animal_id || null,
      animalTag: record.livestock?.tag || "Unknown",
      animalBreed: record.livestock?.breed || "",
      eventType: record.treatment_type || "Health Review",
      date: record.next_due,
      diffDays,
      group: getGroup(diffDays),
      relativeLabel: getRelativeLabel(diffDays),
      chipColor: getChipColor(diffDays),
      formattedDate: formatDate(record.next_due),
    });
  }

  events.sort((a, b) => a.diffDays - b.diffDays);

  return events;
}

const MAX_VISIBLE = 5;

export default function UpcomingHealthTimeline({ healthRecords = [], onAddRecord }) {
  const theme = useTheme();
  const { palette } = theme;
  const navigate = useNavigate();

  const events = useMemo(() => buildTimelineEvents(healthRecords), [healthRecords]);

  const visibleEvents = events.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(0, events.length - MAX_VISIBLE);

  // Group visible events
  const groups = [];
  let currentGroup = null;
  for (const event of visibleEvents) {
    if (event.group !== currentGroup) {
      currentGroup = event.group;
      groups.push({ label: currentGroup, events: [] });
    }
    groups[groups.length - 1].events.push(event);
  }

  function handleEventClick(event) {
    if (event.animalId) {
      navigate(`/animals/${event.animalId}`, { state: { source: "health", section: "health" } });
    }
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 3, bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 22, color: "info.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Upcoming Health Events
            </Typography>
            {events.length > 0 && (
              <Chip
                label={`${events.length} event${events.length > 1 ? "s" : ""}`}
                size="small"
                color={events.some((e) => e.diffDays < 0) ? "error" : "info"}
                sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22, ml: "auto" }}
              />
            )}
          </Stack>

          <Divider />

          {/* Content */}
          {events.length === 0 ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 44, color: "success.main" }} />
              <Typography variant="h6" fontWeight={700} color="success.main">
                Excellent!
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6, maxWidth: 300 }}>
                No upcoming health events are scheduled.
                All monitored animals are currently up to date.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              {groups.map((group) => (
                <Stack key={group.label} spacing={1}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      color: getGroupColor(group.label, palette),
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      fontSize: "0.65rem",
                    }}
                  >
                    {group.label}
                  </Typography>

                  <Stack spacing={0} divider={<Divider sx={{ ml: 6.5 }} />}>
                    {group.events.map((event) => (
                      <ButtonBase
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        sx={{
                          width: "100%",
                          borderRadius: 2,
                          textAlign: "left",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: "action.hover",
                            boxShadow: `0 2px 8px ${alpha(palette.text.primary, 0.06)}`,
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{ py: 1.5, px: 1.5, width: "100%" }}
                        >
                          {/* Icon */}
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: alpha(
                                event.diffDays < 0 ? palette.error.main
                                  : event.diffDays === 0 ? palette.warning.main
                                  : palette.info.main,
                                0.1
                              ),
                              color: event.diffDays < 0 ? palette.error.main
                                : event.diffDays === 0 ? palette.warning.main
                                : palette.info.main,
                              flexShrink: 0,
                            }}
                          >
                            {event.diffDays < 0
                              ? <WarningAmberIcon sx={{ fontSize: 22 }} />
                              : getEventIcon(event.eventType)}
                          </Box>

                          {/* Content */}
                          <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                                {event.animalTag}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {event.eventType}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.disabled">
                              {event.formattedDate}
                            </Typography>
                          </Stack>

                          {/* Date badge */}
                          <Chip
                            label={event.relativeLabel}
                            size="small"
                            color={event.chipColor}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              height: 24,
                              minWidth: 72,
                              flexShrink: 0,
                            }}
                          />

                          <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 20, flexShrink: 0 }} />
                        </Stack>
                      </ButtonBase>
                    ))}
                  </Stack>
                </Stack>
              ))}

              {remainingCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5 }}>
                  + {remainingCount} additional upcoming event{remainingCount > 1 ? "s" : ""}
                </Typography>
              )}
            </Stack>
          )}

          {/* Quick Actions */}
          <Divider />
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <QuickButton label="Vaccination" onClick={onAddRecord} />
            <QuickButton label="Treatment" onClick={onAddRecord} />
            <QuickButton label="Vet Visit" onClick={onAddRecord} />
            <QuickButton label="Follow-up" onClick={onAddRecord} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuickButton({ label, onClick }) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<AddIcon sx={{ fontSize: 16 }} />}
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.78rem",
        borderRadius: 2,
        px: 2,
        py: 0.75,
      }}
    >
      {label}
    </Button>
  );
}
