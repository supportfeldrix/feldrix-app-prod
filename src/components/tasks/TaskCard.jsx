import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import AgricultureIcon from "@mui/icons-material/Agriculture";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PetsIcon from "@mui/icons-material/Pets";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function TaskCard({
  task,
  onComplete,
  onEdit,
}) {

  const priorityColor = {
    Critical: "error",
    High: "error",
    Medium: "warning",
    Low: "success",
  };

  const moduleConfig = {
    "Animal Health": {
      color: "error",
      icon: <FavoriteIcon />,
    },
    Breeding: {
      color: "success",
      icon: <PetsIcon />,
    },
    Crops: {
      color: "warning",
      icon: <AgricultureIcon />,
    },
    Finance: {
      color: "primary",
      icon: <PaymentsIcon />,
    },
    Livestock: {
      color: "secondary",
      icon: <PetsIcon />,
    },
    General: {
      color: "info",
      icon: <PetsIcon />,
    },
  };

  const module =
    moduleConfig[task.module] || {
      color: "default",
      icon: <PetsIcon />,
    };

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#fff",
        transition: "all .2s ease",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
          cursor: "pointer",
        },
      }}
    >
      <CardContent
        sx={{
          p: 2,
          "&:last-child": {
            pb: 2,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
        >
          <Avatar
            sx={{
              bgcolor: `${module.color}.main`,
              width: 42,
              height: 42,
              flexShrink: 0,
            }}
          >
            {module.icon}
          </Avatar>

          <Box flexGrow={1}>
            {task.animalTag && (
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                🐄 Animal #{task.animalTag}
              </Typography>
            )}

            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                mt: 0.3,
                lineHeight: 1.25,
              }}
            >
              {task.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              📅 {task.due}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                mt: 1.5,
              }}
            >
              <Chip
                label={task.module}
                color={module.color}
                size="small"
              />

              <Chip
                label={task.priority}
                color={priorityColor[task.priority]}
                size="small"
              />

              <Box sx={{ flexGrow: 1 }} />

              {task.record?.source === "Manual" && (
                <Button
                  size="small"
                  variant="contained"
                  color={
                    task.status === "Completed"
                      ? "error"
                      : "success"
                  }
                  sx={{ mr: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (onComplete) {
                      onComplete(task);
                    }
                  }}
                >
                  {task.status === "Completed"
                    ? "Delete"
                    : "Complete"}
                </Button>
              )}

              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    task.record?.source === "Manual" &&
                    onEdit
                  ) {
                    onEdit(task);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor:
                    task.record?.source === "Manual"
                      ? "pointer"
                      : "default",
                }}
              >
                <ArrowForwardIosIcon
                  sx={{
                    fontSize: 16,
                    color: "text.secondary",
                  }}
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}


