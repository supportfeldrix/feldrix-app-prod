import { useEffect, useMemo, useState } from "react";
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
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddIcon from "@mui/icons-material/Add";
import TodayIcon from "@mui/icons-material/Today";
import EventIcon from "@mui/icons-material/Event";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AddTaskIcon from "@mui/icons-material/AddTask";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import {
  PremiumPageLayout,
  PremiumKPIGrid,
  PremiumStatCard,
  PremiumDashboardSection,
  PremiumActionButton,
  PremiumLoadingState,
  PremiumEmptyState,
  spacing,
} from "../design";

import { getPlannerTasks } from "../services/plannerService";

const FILTER_MODULES = ["All", "Livestock", "Health", "Breeding", "Crops", "Machinery", "Finance", "General"];
const MAX_TASKS = 5;

export default function Tasks() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { palette } = theme;

  const [planner, setPlanner] = useState({
    today: [],
    upcoming: [],
    overdue: [],
    completed: [],
  });

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    loadPlanner();
  }, []);

  async function loadPlanner() {
    setLoading(true);
    try {
      const data = await getPlannerTasks();
      setPlanner(data);
    } catch (err) {
      console.error("Planner error:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterTasks(tasks) {
    if (activeFilter === "All") return tasks;
    return tasks.filter((t) =>
      (t.module || t.category || "General").toLowerCase().includes(activeFilter.toLowerCase())
    );
  }

  const filteredToday = useMemo(() => filterTasks(planner.today), [planner.today, activeFilter]);
  const filteredUpcoming = useMemo(() => filterTasks(planner.upcoming), [planner.upcoming, activeFilter]);
  const filteredOverdue = useMemo(() => filterTasks(planner.overdue), [planner.overdue, activeFilter]);
  const filteredCompleted = useMemo(() => filterTasks(planner.completed), [planner.completed, activeFilter]);

  // Intelligence summary
  const intelligence = useMemo(() => {
    const items = [];
    if (planner.overdue.length > 0) {
      items.push({
        severity: "high",
        message: `${planner.overdue.length} overdue task${planner.overdue.length > 1 ? "s" : ""} require${planner.overdue.length === 1 ? "s" : ""} immediate attention.`,
        reason: "Overdue tasks delay farm operations and may affect animal welfare, crop yields or machinery readiness.",
        action: "Review Overdue",
        taskData: null,
        workspace: true,
      });
    }
    if (planner.today.length > 0) {
      const first = planner.today[0];
      items.push({
        severity: "medium",
        message: `${planner.today.length} task${planner.today.length > 1 ? "s" : ""} scheduled for today${first?.title ? ` — including "${first.title}"` : ""}.`,
        reason: "Completing today's tasks on time keeps your farm operations on schedule.",
        action: "View Today",
        taskData: null,
        workspace: false,
      });
    }
    if (planner.upcoming.length > 0) {
      items.push({
        severity: "low",
        message: `${planner.upcoming.length} upcoming activit${planner.upcoming.length > 1 ? "ies" : "y"} planned for the coming days.`,
        reason: "Planning ahead ensures resources are available when needed.",
        action: "View Upcoming",
        taskData: null,
        workspace: false,
      });
    }
    if (items.length === 0) {
      items.push({
        severity: "low",
        message: "Everything is on schedule. No tasks require immediate attention.",
        reason: "Your farm operations are running smoothly.",
        action: null,
        taskData: null,
        workspace: false,
        type: "all_good",
      });
    }
    return items.slice(0, 3);
  }, [planner]);

  if (loading) {
    return (
      <PremiumPageLayout
        title="Smart Farm Planner"
        subtitle="Plan, organise and prioritise every farm activity from one central operations dashboard."
        icon={<CalendarMonthIcon sx={{ fontSize: 28 }} />}
      >
        <PremiumLoadingState message="Loading planner..." size={40} />
      </PremiumPageLayout>
    );
  }

  return (
    <PremiumPageLayout
      title="Smart Farm Planner"
      subtitle="Plan, organise and prioritise every farm activity from one central operations dashboard."
      icon={<CalendarMonthIcon sx={{ fontSize: 28 }} />}
    >
      <Stack spacing={4}>
        {/* KPI Cards */}
        <PremiumKPIGrid gap={3.5}>
          <PremiumStatCard
            label="Today's Tasks"
            value={planner.today.length}
            subtitle="Scheduled today"
            icon={<TodayIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(46,125,50,0.12)"
            iconColor="#2E7D32"
          />
          <PremiumStatCard
            label="Upcoming"
            value={planner.upcoming.length}
            subtitle="Planned activities"
            icon={<EventIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(25,118,210,0.12)"
            iconColor="#1976D2"
          />
          <PremiumStatCard
            label="Overdue"
            value={planner.overdue.length}
            subtitle="Needs attention"
            icon={<WarningAmberIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(211,47,47,0.12)"
            iconColor="#D32F2F"
          />
          <PremiumStatCard
            label="Completed"
            value={planner.completed.length}
            subtitle="Finished"
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(123,31,162,0.12)"
            iconColor="#7B1FA2"
          />
        </PremiumKPIGrid>

        {/* Planner Intelligence */}
        <PremiumDashboardSection
          title="Planner Intelligence"
          description="Today's workload summary and priority recommendations."
        >
          <Stack spacing={2}>
            {intelligence.map((item, idx) => (
              <Stack
                key={idx}
                spacing={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(
                    item.severity === "high" ? palette.error.main
                      : item.severity === "medium" ? palette.warning.main
                      : palette.success.main,
                    0.04
                  ),
                  border: "1px solid",
                  borderColor: alpha(
                    item.severity === "high" ? palette.error.main
                      : item.severity === "medium" ? palette.warning.main
                      : palette.success.main,
                    0.12
                  ),
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Chip
                    label={item.severity === "high" ? "Critical" : item.severity === "medium" ? "Attention" : "Info"}
                    size="small"
                    color={item.severity === "high" ? "error" : item.severity === "medium" ? "warning" : "success"}
                    sx={{ fontWeight: 600, fontSize: "0.65rem", height: 22, flexShrink: 0, mt: 0.1 }}
                  />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ lineHeight: 1.4 }}>
                      {item.message}
                    </Typography>
                    {item.reason && (
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {item.reason}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
                {(item.action || item.workspace) && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pl: 0.5, pt: 0.5 }}>
                    {item.action && (
                      <Chip label={item.action} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.65rem", height: 22 }} />
                    )}
                    {item.workspace && (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        onClick={() => navigate("/planner")}
                        sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.72rem", color: "primary.main", px: 1, minWidth: 0 }}
                      >
                        Open Workspace
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            ))}
          </Stack>
        </PremiumDashboardSection>

        {/* Quick Actions + Filters */}
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
            <PremiumActionButton label="Add Task" variant="contained" color="success" startIcon={<AddIcon />} onClick={() => navigate("/planner")} />
            <PremiumActionButton label="Open Workspace" variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => navigate("/planner")} />
            <PremiumActionButton label="Refresh" variant="outlined" startIcon={<RefreshIcon />} onClick={loadPlanner} />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {FILTER_MODULES.map((mod) => (
              <Chip
                key={mod}
                label={mod}
                size="small"
                variant={activeFilter === mod ? "filled" : "outlined"}
                color={activeFilter === mod ? "success" : "default"}
                onClick={() => setActiveFilter(mod)}
                sx={{ fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Stack>

        {/* Operations Board — 4 columns desktop */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6} lg={3}>
            <TaskSection
              title="Today's Tasks"
              subtitle="Scheduled for today"
              count={filteredToday.length}
              tasks={filteredToday}
              accent={palette.success.main}
              hero
              emptyTitle="Nothing Today"
              emptyMessage="No tasks are due today."
              navigate={navigate}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <TaskSection
              title="Overdue"
              subtitle="Requires attention"
              count={filteredOverdue.length}
              tasks={filteredOverdue}
              accent={palette.error.main}
              emptyTitle="No Overdue"
              emptyMessage="You're all caught up."
              navigate={navigate}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <TaskSection
              title="Upcoming"
              subtitle="Planned activities"
              count={filteredUpcoming.length}
              tasks={filteredUpcoming}
              accent={palette.info.main}
              emptyTitle="No Upcoming"
              emptyMessage="Plan ahead by scheduling tasks."
              navigate={navigate}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <TaskSection
              title="Completed"
              subtitle="Recently finished"
              count={filteredCompleted.length}
              tasks={filteredCompleted}
              accent={palette.secondary.main}
              emptyTitle="No Completed"
              emptyMessage="Tasks appear here when done."
              navigate={navigate}
            />
          </Grid>
        </Grid>
      </Stack>
    </PremiumPageLayout>
  );
}

// ─── TaskSection ──────────────────────────────────────────────────────────────

function TaskSection({ title, subtitle, count, tasks, accent, hero, emptyTitle, emptyMessage, navigate }) {
  const visible = tasks.slice(0, MAX_TASKS);
  const remaining = tasks.length - visible.length;

  return (
    <Card
      elevation={hero ? 3 : 1}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: hero ? alpha(accent, 0.3) : "divider",
        borderLeft: hero ? `4px solid ${accent}` : undefined,
        height: 560,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header — always visible */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5, flexShrink: 0 }}>
          <Stack spacing={0.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                {title}
              </Typography>
            </Stack>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5 }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
          <Chip label={count} size="small" sx={{ fontWeight: 700, fontSize: "0.75rem", height: 24, bgcolor: alpha(accent, 0.1), color: accent }} />
        </Stack>

        <Divider sx={{ mb: 1.5, flexShrink: 0 }} />

        {/* Scrollable content */}
        {visible.length === 0 ? (
          <Stack sx={{ flex: 1, justifyContent: "center" }}>
            <PremiumEmptyState title={emptyTitle} message={emptyMessage} />
          </Stack>
        ) : (
          <Stack spacing={0} sx={{ flex: 1, overflowY: "auto", pr: 0.5 }} divider={<Divider />}>
            {visible.map((task) => (
              <TaskRow key={task.id} task={task} accent={accent} navigate={navigate} />
            ))}
          </Stack>
        )}

        {/* View All button */}
        {remaining > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/planner")}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", mt: 1.5, alignSelf: "stretch", borderRadius: 2, flexShrink: 0 }}
          >
            Open Planner Workspace ({remaining} more)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task, accent, navigate }) {
  const theme = useTheme();
  const { palette } = theme;

  return (
    <ButtonBase
      onClick={() => navigate("/planner")}
      sx={{
        width: "100%",
        textAlign: "left",
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: "action.hover",
          boxShadow: `0 2px 8px ${alpha(palette.text.primary, 0.05)}`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.8, px: 1.5, width: "100%" }}>
        <Box sx={{ width: 3, height: 28, borderRadius: 1, bgcolor: accent, flexShrink: 0 }} />

        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
            {task.title || task.task || "Untitled Task"}
          </Typography>
          <Typography variant="caption" color="text.disabled" noWrap>
            {task.module || task.category || ""}{task.due_date ? ` • ${new Date(task.due_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}` : ""}
          </Typography>
        </Stack>

        {task.priority && (
          <Chip
            label={task.priority}
            size="small"
            color={task.priority === "High" ? "error" : task.priority === "Medium" ? "warning" : "default"}
            sx={{ fontWeight: 600, fontSize: "0.6rem", height: 20, flexShrink: 0 }}
          />
        )}

        <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 18, flexShrink: 0 }} />
      </Stack>
    </ButtonBase>
  );
}
