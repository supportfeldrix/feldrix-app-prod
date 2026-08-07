import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { radius, transitions, elevation } from "../../design/tokens";
import { getLifecycleStage, getStageColor } from "../../services/livestockLifecycle";

function getStatusColor(status) {
  switch (status) {
    case "Healthy": return "success";
    case "Pregnant": return "warning";
    case "Sick": return "error";
    case "Injured": return "error";
    case "Sold": return "default";
    default: return "default";
  }
}

function getSpeciesIcon(type) {
  switch (type) {
    case "Cattle": return "\uD83D\uDC04";
    case "Sheep": return "\uD83D\uDC11";
    case "Goats": return "\uD83D\uDC10";
    case "Pigs": return "\uD83D\uDC16";
    case "Poultry": return "\uD83D\uDC14";
    default: return "\uD83D\uDC04";
  }
}

export default function AnimalCard({ animal, onEdit, onDelete }) {
  const navigate = useNavigate();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: radius.cardLarge,
        border: "1px solid",
        borderColor: "divider",
        transition: transitions.entrance,
        "&:hover": {
          boxShadow: elevation.cardHover,
          transform: "translateY(-3px)",
          borderColor: "transparent",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          {/* Header: Avatar + Status + Lifecycle */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ fontSize: 44, lineHeight: 1 }}>
              {getSpeciesIcon(animal.animal_type)}
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {(() => {
                const lc = getLifecycleStage(animal);
                if (!lc.stage) return null;
                const sc = getStageColor(lc.stage);
                return <Chip label={lc.stage} size="small" sx={{ fontWeight: 700, fontSize: "0.6rem", height: 22, bgcolor: sc.bg, color: sc.color }} />;
              })()}
              <Chip
                label={animal.status || "Unknown"}
                size="small"
                color={getStatusColor(animal.status)}
                sx={{ fontWeight: 700, fontSize: "0.7rem", height: 24 }}
              />
            </Stack>
          </Stack>

          {/* Name + ID */}
          <Stack spacing={0.25}>
            <Typography variant="h6" fontWeight={700} color="text.primary" noWrap>
              {animal.tag}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {animal.breed}
            </Typography>
          </Stack>

          <Divider />

          {/* Attributes Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
            }}
          >
            <AttrField label="Gender" value={animal.gender || "\u2014"} />
            <AttrField label="Weight" value={animal.weight ? `${animal.weight} kg` : "\u2014"} />
            <AttrField label="Species" value={animal.animal_type || "\u2014"} />
            <AttrField label="Value" value={animal.purchase_price ? `R ${Number(animal.purchase_price).toLocaleString()}` : "\u2014"} />
          </Box>

          <Divider />

          {/* Primary Action */}
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
            onClick={() => navigate(`/animals/${animal.id}`)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: radius.button,
              py: 1.2,
            }}
          >
            View Profile
          </Button>

          {/* Secondary Actions */}
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={() => onEdit(animal)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: radius.button,
                fontSize: "0.78rem",
              }}
            >
              Edit
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => onDelete(animal.id)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: radius.button,
                fontSize: "0.78rem",
              }}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AttrField({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {value}
      </Typography>
    </Stack>
  );
}
