import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Box, Stack } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RefreshIcon from "@mui/icons-material/Refresh";
import TodayIcon from "@mui/icons-material/Today";
import EventIcon from "@mui/icons-material/Event";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ListAltIcon from "@mui/icons-material/ListAlt";

import {
  PremiumPageLayout,
  PremiumKPIGrid,
  PremiumStatCard,
  PremiumDashboardSection,
  PremiumActionButton,
  PremiumLoadingState,
  spacing,
} from "../design";

import PlannerSearch from "../components/planner/PlannerSearch";
import PlannerFilters from "../components/planner/PlannerFilters";
import PlannerTaskList from "../components/planner/PlannerTaskList";
import PlannerCalendar from "../components/planner/PlannerCalendar";
import ManualTaskModal from "../components/planner/ManualTaskModal";
import ViewToggle from "../components/livestock/ViewToggle";

import {
  createManualTask,
  updateManualTask,
  completeManualTask,
  deleteManualTask,
  getPlannerTasks,
} from "../services/plannerService";
import { completeHealthTask } from "../services/healthService";

function buildTaskFromPayload(payload) {
  if (!payload || !payload.source) return null;
  const titleMap = { Machinery: "Service Machinery", Livestock: "Health Check", Crops: "Crop Task", Finance: "Finance Follow-up", Planner: "Follow-up Task" };
  const moduleMap = { Machinery: "Livestock", Livestock: "Animal Health", Crops: "Crops", Finance: "Finance", Planner: "General" };
  return {
    title: titleMap[payload.source] || "New Task",
    description: "Created from Farm Intelligence",
    module: moduleMap[payload.source] || "General",
    priority: payload.priority || "Medium",
    due_date: new Date().toISOString().split("T")[0],
  };
}

export default function PlannerWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const plannerBoardRef = useRef(null);

  const [planner, setPlanner] = useState({ overdue: [], today: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState("workspace");

  useEffect(() => { loadPlanner(); }, []);

  useEffect(() => {
    if (!loading && location.search.includes("section=")) {
      setTimeout(() => { plannerBoardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 250);
    }
  }, [loading, location]);

  useEffect(() => {
    const stateFilter = location.state?.filter;
    const payload = location.state?.payload;
    const newTask = location.state?.newTask;

    if (!loading && stateFilter) {
      setView("workspace");
      setFilter("all");
      setTimeout(() => { plannerBoardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 250);
    }

    if (!loading && payload) {
      const prefilled = buildTaskFromPayload(payload);
      if (prefilled) { setSelectedTask(prefilled); setTaskModalOpen(true); }
    }

    if (!loading && newTask) {
      setSelectedTask(newTask);
      setTaskModalOpen(true);
    }

    if (!loading && (stateFilter || payload || newTask)) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [loading, location.state]);

  async function loadPlanner() {
    try {
      const data = await getPlannerTasks();
      setPlanner(data);
    } catch (err) { console.error("Planner Workspace:", err); }
    finally { setLoading(false); }
  }

  async function handleSaveTask(task) {
    try {
      if (task.id) { await updateManualTask(task.id, task); }
      else { await createManualTask(task); }
      setSelectedTask(null);
      setTaskModalOpen(false);
      await loadPlanner();
    } catch (err) { console.error("Save Manual Task:", err); }
  }

  function handleEditTask(task) { setSelectedTask(task); setTaskModalOpen(true); }

  async function handleCompleteTask(task) {
    try {
      // Virtual Animal Health tasks complete the source health record
      // (sets completed_at). They are never deleted.
      if (task.module === "Animal Health") {
        await completeHealthTask(task.record);
      } else if (task.status === "Completed") {
        // Manual tasks: the completed action is a Delete.
        await deleteManualTask(task.id);
      } else {
        await completeManualTask(task.id);
      }
      await loadPlanner();
    } catch (err) { console.error("Task Action:", err); }
  }

  function handleAddTaskForDate(date) { setSelectedTask({ due_date: date }); setTaskModalOpen(true); }

  const filteredPlanner = useMemo(() => {
    const applyFilters = (tasks) => tasks.filter((task) => {
      const matchesSearch = search.trim() === "" ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.module.toLowerCase().includes(search.toLowerCase()) ||
        (task.animalTag || "").toLowerCase().includes(search.toLowerCase());
      const moduleKey = task.module.toLowerCase().replace(/\s+/g, "");
      const matchesModule = filter === "all" || moduleKey === filter || (filter === "health" && moduleKey === "animalhealth");
      return matchesSearch && matchesModule;
    });
    return {
      overdue: applyFilters(planner.overdue),
      today: applyFilters(planner.today),
      upcoming: applyFilters(planner.upcoming),
      completed: applyFilters(planner.completed),
    };
  }, [planner, search, filter]);

  const totalActive = filteredPlanner.today.length + filteredPlanner.upcoming.length + filteredPlanner.overdue.length;

  if (loading) {
    return (
      <PremiumPageLayout
        title="Planner Workspace"
        subtitle="Manage every farm activity from one central operations workspace."
        icon={<AssignmentIcon sx={{ fontSize: 28 }} />}
      >
        <PremiumLoadingState message="Loading workspace..." size={40} />
      </PremiumPageLayout>
    );
  }

  return (
    <PremiumPageLayout
      title="Planner Workspace"
      subtitle="Manage every farm activity from one central operations workspace."
      icon={<AssignmentIcon sx={{ fontSize: 28 }} />}
    >
      <Stack spacing={4}>
        {/* KPI Cards */}
        <PremiumKPIGrid gap={3.5}>
          <PremiumStatCard
            label="Active Tasks"
            value={totalActive}
            subtitle="In progress"
            icon={<ListAltIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(46,125,50,0.12)"
            iconColor="#2E7D32"
          />
          <PremiumStatCard
            label="Due Today"
            value={filteredPlanner.today.length}
            subtitle="Scheduled"
            icon={<TodayIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(25,118,210,0.12)"
            iconColor="#1976D2"
          />
          <PremiumStatCard
            label="Overdue"
            value={filteredPlanner.overdue.length}
            subtitle="Needs attention"
            icon={<WarningAmberIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(211,47,47,0.12)"
            iconColor="#D32F2F"
          />
          <PremiumStatCard
            label="Completed"
            value={filteredPlanner.completed.length}
            subtitle="Finished"
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(123,31,162,0.12)"
            iconColor="#7B1FA2"
          />
        </PremiumKPIGrid>

        {/* Toolbar + Search + Filters */}
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
            <PremiumActionButton
              label="Add Task"
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={() => { setSelectedTask(null); setTaskModalOpen(true); }}
            />
            <ViewToggle
              view={view === "workspace" ? "table" : "cards"}
              setView={(v) => setView(v === "table" ? "workspace" : "calendar")}
            />
            <PremiumActionButton
              label="Refresh"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadPlanner}
            />
          </Stack>

          <PlannerSearch value={search} onChange={(e) => setSearch(e.target.value)} />

          <PlannerFilters value={filter} onChange={setFilter} />
        </Stack>

        {/* Workspace */}
        <Box ref={plannerBoardRef}>
          {view === "workspace" ? (
            <PlannerTaskList
              planner={filteredPlanner}
              onComplete={handleCompleteTask}
              onEdit={handleEditTask}
            />
          ) : (
            <PlannerCalendar
              planner={filteredPlanner}
              onEdit={handleEditTask}
              onComplete={handleCompleteTask}
              onAddTask={handleAddTaskForDate}
            />
          )}
        </Box>
      </Stack>

      <ManualTaskModal
        open={taskModalOpen}
        onClose={() => { setSelectedTask(null); setTaskModalOpen(false); }}
        onSave={handleSaveTask}
        task={selectedTask}
      />
    </PremiumPageLayout>
  );
}
