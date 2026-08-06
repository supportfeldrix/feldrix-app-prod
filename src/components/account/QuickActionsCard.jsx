import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import PetsIcon from "@mui/icons-material/Pets";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import { useNavigate } from "react-router-dom";

export default function QuickActionsCard() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Add Animal",
      subtitle: "Register new livestock",
      icon: <PetsIcon />,
      color: "#4CAF50",
      path: "/livestock",
    },
    {
      title: "Add Crop",
      subtitle: "Create crop record",
      icon: <AgricultureIcon />,
      color: "#2196F3",
      path: "/crops",
    },
    {
      title: "Add Machine",
      subtitle: "Register machinery",
      icon: <PrecisionManufacturingIcon />,
      color: "#FF9800",
      path: "/machinery",
    },
    {
      title: "Create Task",
      subtitle: "Planner workspace",
      icon: <AssignmentIcon />,
      color: "#9C27B0",
      path: "/planner",
    },
    {
      title: "Generate Report",
      subtitle: "Open Reports Centre",
      icon: <AssessmentIcon />,
      color: "#009688",
      path: "/reports",
    },
  ];

  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          fontWeight={700}
        >
          Quick Actions
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
        >
          Frequently used shortcuts.
        </Typography>

        <Stack spacing={2}>
          {actions.map((action) => (
            <Box
              key={action.title}
              onClick={() => navigate(action.path)}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 2,
                cursor: "pointer",
                transition: "0.25s",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "translateX(4px)",
                },
              }}
            >
              <Grid
                container
                alignItems="center"
              >
                <Grid size={{ xs: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: `${action.color}20`,
                      color: action.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {action.icon}
                  </Box>
                </Grid>

                <Grid size={{ xs: 9 }}>
                  <Typography
                    fontWeight={700}
                  >
                    {action.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {action.subtitle}
                  </Typography>
                </Grid>

                <Grid
                  size={{ xs: 1 }}
                  textAlign="right"
                >
                  <ArrowForwardIosIcon
                    fontSize="small"
                    color="action"
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
