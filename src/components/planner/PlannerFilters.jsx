import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import FavoriteIcon from "@mui/icons-material/Favorite";
import PetsIcon from "@mui/icons-material/Pets";
import AgricultureIcon from "@mui/icons-material/Agriculture";
// Currency-neutral wallet icon for Finance (no $/€/£/R symbol inside the glyph).
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AppsIcon from "@mui/icons-material/Apps";

export default function PlannerFilters({
  value = "all",
  onChange = () => {},
}) {
  const filters = [
    {
      value: "all",
      label: "All",
      icon: <AppsIcon />,
      color: "primary",
    },
    {
      value: "health",
      label: "Health",
      icon: <FavoriteIcon />,
      color: "error",
    },
    {
      value: "breeding",
      label: "Breeding",
      icon: <PetsIcon />,
      color: "success",
    },
    {
      value: "crops",
      label: "Crops",
      icon: <AgricultureIcon />,
      color: "warning",
    },
    {
      value: "finance",
      label: "Finance",
      icon: <AccountBalanceWalletIcon />,
      color: "secondary",
    },
    {
      value: "livestock",
      label: "Livestock",
      icon: <Inventory2Icon />,
      color: "info",
    },
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        mb={2}
      >
        📂 Filter Planner
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
      >
        Filter your planner by farm module.
      </Typography>

      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
      >
        {filters.map((filter) => (
          <Chip
            key={filter.value}
            icon={filter.icon}
            label={filter.label}
            color={
              value === filter.value
                ? filter.color
                : "default"
            }
            variant={
              value === filter.value
                ? "filled"
                : "outlined"
            }
            clickable
            onClick={() => onChange(filter.value)}
            sx={{
              borderRadius: 2,
              px: 1,
              py: 2.5,
              fontWeight: 600,
              transition: "all .2s",
              "&:hover": {
                transform: "translateY(-2px)",
              },
            }}
          />
        ))}
      </Stack>
    </Paper>
  );
}
