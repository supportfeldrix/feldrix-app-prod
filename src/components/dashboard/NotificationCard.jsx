import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForward,
  ChevronRight,
  Notifications,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

const PLANNER_ROWS = [
  {
    icon: "🔴",
    label: "Overdue Tasks",
    emptyLabel: "✅ No Overdue Tasks",
    key: "overdue",
    filter: "overdue",
    path: "/planner",
  },
  {
    icon: "🟡",
    label: "Due Today",
    emptyLabel: "✅ Nothing Due Today",
    key: "today",
    filter: "today",
    path: "/planner",
  },
  {
    icon: "🟢",
    label: "Due This Week",
    emptyLabel: "📅 No Upcoming Tasks",
    key: "upcoming",
    filter: "upcoming",
    path: "/planner",
  },
];

const MODULE_ROWS = [
  {
    icon: "❤️",
    label: "Animal Health",
    emptyLabel: "✓ No alerts",
    key: "health",
    path: "/health",
  },
  {
    icon: "🐄",
    label: "Breeding",
    emptyLabel: "✓ No alerts",
    key: "breeding",
    path: "/breeding",
  },
  {
    icon: "🌾",
    label: "Crops",
    emptyLabel: "✓ No alerts",
    key: "crops",
    path: "/crops",
  },
  {
    icon: "💳",
    label: "Finance",
    emptyLabel: "✓ No alerts",
    key: "finance",
    path: "/finance",
  },
];

function NotificationRow({ icon, label, emptyLabel, count, onClick }) {
  const isEmpty = count === 0;

  return (
    <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
      <ButtonBase
        onClick={onClick}
        sx={{
          width: "100%",
          px: 2.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 3,
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: 3,
            bgcolor: "action.hover",
          },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography fontSize="1.2rem">{icon}</Typography>
          <Typography fontWeight={600} fontSize="0.95rem">
            {isEmpty ? emptyLabel : label}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {!isEmpty && (
            <Box
              sx={{
                bgcolor: "grey.100",
                borderRadius: 2,
                px: 1.5,
                py: 0.25,
                minWidth: 32,
                textAlign: "center",
              }}
            >
              <Typography fontWeight={700} fontSize="0.9rem">
                {count}
              </Typography>
            </Box>
          )}
          <ChevronRight sx={{ color: "text.secondary" }} />
        </Stack>
      </ButtonBase>
    </Paper>
  );
}

export default function NotificationCard({ notifications }) {
  const navigate = useNavigate();

  if (!notifications) return null;

  const { overdue, today, upcoming } = notifications.summary;
  const plannerCounts = { overdue, today, upcoming };
  const moduleCounts = notifications.modules || {};

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 4,
        height: "100%",
        transition: "all 0.2s ease",
        "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <Notifications color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Farm Alerts
          </Typography>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Planner Section */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          color="text.secondary"
          sx={{ mb: 1.5 }}
        >
          Planner
        </Typography>

        <Stack spacing={1.5}>
          {PLANNER_ROWS.map((row) => (
            <NotificationRow
              key={row.key}
              icon={row.icon}
              label={row.label}
              emptyLabel={row.emptyLabel}
              count={plannerCounts[row.key] || 0}
              onClick={() =>
                navigate(row.path, { state: { filter: row.filter } })
              }
            />
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Farm Modules Section */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          color="text.secondary"
          sx={{ mb: 1.5 }}
        >
          Farm Modules
        </Typography>

        <Stack spacing={1.5}>
          {MODULE_ROWS.map((row) => (
            <NotificationRow
              key={row.key}
              icon={row.icon}
              label={row.label}
              emptyLabel={row.emptyLabel}
              count={moduleCounts[row.key] || 0}
              onClick={() => navigate(row.path)}
            />
          ))}
        </Stack>

        <Button
          sx={{ mt: 4 }}
          fullWidth
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={() => navigate("/planner")}
        >
          Open Planner
        </Button>
      </CardContent>
    </Card>
  );
}
