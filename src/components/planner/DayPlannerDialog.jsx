import { useState } from "react";

import {
  AssignmentTurnedIn,
  Agriculture,
  Favorite,
  Pets,
  Paid,
  Grass,
  Edit,
  CheckCircle,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { format } from "date-fns";

import RecurringTaskDialog from "./RecurringTaskDialog";

function getPriorityColor(priority) {
  switch (priority) {
    case "Critical":
      return "error";

    case "High":
      return "warning";

    case "Medium":
      return "primary";

    default:
      return "success";
  }
}

function getModuleIcon(module) {
  switch (module) {
    case "Animal Health":
      return <Favorite color="error" />;

    case "Breeding":
      return <Pets color="success" />;

    case "Finance":
      return <Paid color="primary" />;

    case "Crops":
      return <Grass color="warning" />;

    case "Livestock":
      return <Agriculture color="secondary" />;

    default:
      return <AssignmentTurnedIn color="info" />;
  }
}

export default function DayPlannerDialog({
  open,
  selectedDate,
  tasks = [],
  onClose,
  onEdit,
  onComplete,
  onAddTask,
}) {
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [selectedRecurringTask, setSelectedRecurringTask] = useState(null);

  function handleEditClick(task) {
    if (task.record?.repeat_type && task.record.repeat_type !== "None") {
      setSelectedRecurringTask(task);
      setRecurringDialogOpen(true);
    } else {
      onEdit?.(task);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>

        <Typography
          variant="h5"
          fontWeight={700}
        >
          📅{" "}
          {selectedDate
            ? format(
                new Date(selectedDate),
                "dd MMMM yyyy"
              )
            : ""}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {tasks.length} Task
          {tasks.length !== 1 && "s"} Scheduled
        </Typography>

      </DialogTitle>

      <Divider />

      <DialogContent>

        {tasks.length === 0 && (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <AssignmentTurnedIn
              sx={{
                fontSize: 70,
                color: "success.main",
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              gutterBottom
            >
              No tasks scheduled
            </Typography>

            <Button
              variant="contained"
              color="success"
              sx={{ mt: 3 }}
              onClick={() =>
                onAddTask?.(selectedDate)
              }
            >
              Add Task
            </Button>
          </Box>
        )}

        <Stack spacing={2}>

          {tasks.map((task) => (
            <Card
              key={task.id}
              elevation={2}
              sx={{
                borderRadius: 3,
                transition: ".2s",
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>

                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  {getModuleIcon(task.module)}

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    {task.title}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ mt: 2 }}
                >
                  Animal:
                  {" "}
                  {task.animalTag || "-"}
                </Typography>

                <Typography
                  variant="body2"
                >
                  Due:
                  {" "}
                  {task.due}
                </Typography>

                <Chip
                  sx={{ mt: 2 }}
                  color={getPriorityColor(
                    task.priority
                  )}
                  label={task.priority}
                />

                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mt: 3 }}
                >
                  {task.status === "Completed" ? (
                    // Completed tasks: show status, no Complete action.
                    <Chip
                      icon={<CheckCircle />}
                      color="success"
                      label="Completed"
                    />
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() =>
                          handleEditClick(task)
                        }
                      >
                        Edit
                      </Button>

                      <Button
                        variant="contained"
                        color="success"
                        startIcon={
                          <CheckCircle />
                        }
                        onClick={() =>
                          onComplete?.(task)
                        }
                      >
                        Complete
                      </Button>
                    </>
                  )}
                </Stack>

              </CardContent>
            </Card>
          ))}

        </Stack>

      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          p: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
        >
          Close
        </Button>
      </DialogActions>

      <RecurringTaskDialog
        open={recurringDialogOpen}
        task={selectedRecurringTask}
        onClose={() => {
          setRecurringDialogOpen(false);
          setSelectedRecurringTask(null);
        }}
        onThisOccurrence={() => {
          setRecurringDialogOpen(false);
          onEdit?.(selectedRecurringTask);
        }}
        onEntireSeries={() => {
          // Reserved for Sprint 18.3
        }}
      />

    </Dialog>
  );
}
