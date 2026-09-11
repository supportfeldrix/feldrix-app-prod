import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ViewListIcon from "@mui/icons-material/ViewList";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function PlannerToolbar({
  onNewTask,
  view = "workspace",
  onViewChange,
}) {
  const isCalendar = view === "calendar";

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 4,
        boxShadow: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          flexDirection: {
            xs: "column",
            md: "row",
          },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
          >
            🧠 Smart Farm Planner
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
          >
            Manage your daily farm operations,
            reminders and upcoming activities
            from one intelligent workspace.
          </Typography>
        </Box>

        <Chip
          icon={<CheckCircleIcon />}
          label={
            isCalendar
              ? "Calendar View"
              : "Workspace Active"
          }
          color="success"
          sx={{
            fontWeight: 700,
          }}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
      >
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={onNewTask}
        >
          New Task
        </Button>

        <Button
          variant={
            isCalendar
              ? "contained"
              : "outlined"
          }
          color="primary"
          startIcon={
            isCalendar
              ? <ViewListIcon />
              : <CalendarMonthIcon />
          }
          onClick={() =>
            onViewChange?.(
              isCalendar
                ? "workspace"
                : "calendar"
            )
          }
        >
          {isCalendar
            ? "Workspace"
            : "Calendar"}
        </Button>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Export
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* Module Status */}
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Connected Planner Modules
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
      >
        <Chip
          label="❤️ Health"
          color="success"
          variant="outlined"
        />

        <Chip
          label="🐂 Breeding"
          color="success"
          variant="outlined"
        />

        <Chip
          label="🌾 Crops"
          color="warning"
          variant="outlined"
        />

        <Chip
          label="💳 Finance"
          color="warning"
          variant="outlined"
        />

        <Chip
          label="🐄 Livestock"
          color="warning"
          variant="outlined"
        />
      </Stack>
    </Box>
  );
}
