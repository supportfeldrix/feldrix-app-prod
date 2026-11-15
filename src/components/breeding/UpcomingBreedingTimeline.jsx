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
import ChildFriendlyIcon from "@mui/icons-material/ChildFriendly";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddIcon from "@mui/icons-material/Add";

function getEventIcon(type) {
  switch (type) {
    case "Expected Birth": return <ChildFriendlyIcon sx={{ fontSize: 22 }} />;
    case "Pregnancy Check": return <AssignmentIcon sx={{ fontSize: 22 }} />;
    case "Overdue Birth": return <WarningAmberIcon sx={{ fontSize: 22 }} />;
    default: return <ChildFriendlyIcon sx={{ fontSize: 22 }} />;
  }
}

function getRelativeLabel(diffDays) {
  if (diffDays < -1) return "Overdue";
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
    return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

const MAX_VISIBLE = 5;

export default function UpcomingBreedingTimeline({ timeline = [], onAddRecord, onEvent }) {
  // onEvent(type) opens the matching form; falls back to the general breeding form.
  const open = (type) => () => (onEvent ? onEvent(type) : onAddRecord?.());
  const theme = useTheme();
  const { palette } = theme;
  const navigate = useNavigate();

  const visibleEvents = timeline.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(0, timeline.length - MAX_VISIBLE);

  // Group
  const groups = [];
  let currentGroup = null;
  for (const event of visibleEvents) {
    const g = getGroup(event.diffDays);
    if (g !== currentGroup) {
      currentGroup = g;
      groups.push({ label: g, events: [] });
    }
    groups[groups.length - 1].events.push(event);
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 3, bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 22, color: "info.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Upcoming Breeding Events
            </Typography>
            {timeline.length > 0 && (
              <Chip
                label={`${timeline.length} event${timeline.length > 1 ? "s" : ""}`}
                size="small"
                color={timeline.some((e) => e.diffDays < 0) ? "error" : "info"}
                sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22, ml: "auto" }}
              />
            )}
          </Stack>

          <Divider />

          {timeline.length === 0 ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 44, color: "success.main" }} />
              <Typography variant="h6" fontWeight={700} color="success.main">
                Excellent!
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6, maxWidth: 300 }}>
                No upcoming breeding events are scheduled.
                The breeding programme is currently up to date.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              {groups.map((group) => (
                <Stack key={group.label} spacing={1}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: getGroupColor(group.label, palette), textTransform: "uppercase", letterSpacing: 1, fontSize: "0.65rem" }}
                  >
                    {group.label}
                  </Typography>

                  <Stack spacing={0} divider={<Divider sx={{ ml: 6.5 }} />}>
                    {group.events.map((event) => (
                      <ButtonBase
                        key={event.id}
                        onClick={() => event.animalId ? navigate(`/animals/${event.animalId}`, { state: { source: "breeding", section: "breeding" } }) : null}
                        sx={{
                          width: "100%",
                          borderRadius: 2,
                          textAlign: "left",
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: "action.hover", boxShadow: `0 2px 8px ${alpha(palette.text.primary, 0.06)}` },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.5, px: 1.5, width: "100%" }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: alpha(event.diffDays < 0 ? palette.error.main : event.diffDays === 0 ? palette.warning.main : palette.info.main, 0.1),
                              color: event.diffDays < 0 ? palette.error.main : event.diffDays === 0 ? palette.warning.main : palette.info.main,
                              flexShrink: 0,
                            }}
                          >
                            {getEventIcon(event.eventType)}
                          </Box>

                          <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>{event.animalTag}</Typography>
                              <Typography variant="caption" color="text.disabled">{event.eventType}</Typography>
                            </Stack>
                            <Typography variant="caption" color="text.disabled">{formatDate(event.date)}</Typography>
                          </Stack>

                          <Chip
                            label={getRelativeLabel(event.diffDays)}
                            size="small"
                            color={getChipColor(event.diffDays)}
                            sx={{ fontWeight: 700, fontSize: "0.65rem", height: 24, minWidth: 72, flexShrink: 0 }}
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

          <Divider />
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <QuickButton label="Heat Detection" onClick={open("heat")} />
            <QuickButton label="Start Breeding" onClick={onAddRecord} />
            <QuickButton label="Pregnancy Check" onClick={open("check")} />
            <QuickButton label="Record Birth" onClick={open("birth")} />
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
      sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.78rem", borderRadius: 2, px: 2, py: 0.75 }}
    >
      {label}
    </Button>
  );
}
