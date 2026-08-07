import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { deleteAnimal } from "../../services/livestockService";
import { radius, transitions } from "../../design/tokens";
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
    case "Sheep": return "\uD83D\uDC11";
    case "Goats": return "\uD83D\uDC10";
    case "Pigs": return "\uD83D\uDC16";
    case "Poultry": return "\uD83D\uDC14";
    default: return "\uD83D\uDC04";
  }
}

export default function AnimalTable({ animals, onEdit, refreshAnimals }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = animals.filter((animal) => {
    const term = search.toLowerCase();
    const lifecycle = getLifecycleStage(animal);
    return (
      (animal.tag || "").toLowerCase().includes(term) ||
      (animal.animal_type || "Cattle").toLowerCase().includes(term) ||
      (animal.breed || "").toLowerCase().includes(term) ||
      (animal.gender || "").toLowerCase().includes(term) ||
      (animal.status || "").toLowerCase().includes(term) ||
      (lifecycle.stage || "").toLowerCase().includes(term)
    );
  });

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this animal?")) return;
    try {
      await deleteAnimal(id);
      await refreshAnimals();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleEdit(e, animal) {
    e.stopPropagation();
    onEdit(animal);
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: radius.cardLarge,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      {/* Header + Search */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ px: 3, py: 2.5 }}
      >
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Herd Registry
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} animal{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>

        <TextField
          size="small"
          placeholder="Search animals by tag, breed or species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 280,
            "& .MuiOutlinedInput-root": {
              borderRadius: radius.input,
            },
          }}
        />
      </Stack>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={headerCell}>Tag</TableCell>
              <TableCell sx={headerCell}>Species</TableCell>
              <TableCell sx={headerCell}>Breed</TableCell>
              <TableCell sx={headerCell}>Gender</TableCell>
              <TableCell sx={headerCell}>Lifecycle</TableCell>
              <TableCell sx={headerCell}>Age</TableCell>
              <TableCell sx={headerCell}>Weight</TableCell>
              <TableCell sx={headerCell}>Status</TableCell>
              <TableCell sx={headerCell} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">No animals match your search.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((animal, index) => {
                const lifecycle = getLifecycleStage(animal);
                const stageColor = lifecycle.stage ? getStageColor(lifecycle.stage) : null;
                return (
                <TableRow
                  key={animal.id}
                  hover
                  onClick={() => navigate(`/animals/${animal.id}`)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: index % 2 === 0 ? "background.paper" : "grey.50",
                    transition: transitions.fast,
                    "&:hover": {
                      bgcolor: "rgba(46,125,50,0.04)",
                      borderLeft: "3px solid",
                      borderLeftColor: "success.main",
                    },
                    "& td": { borderBottom: "1px solid", borderBottomColor: "divider" },
                  }}
                >
                  <TableCell sx={dataCell}>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      {animal.tag}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontSize: 20, lineHeight: 1 }}>
                        {getSpeciesIcon(animal.animal_type)}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {animal.animal_type || "Cattle"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.primary">{animal.breed}</Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.secondary">{animal.gender}</Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    {lifecycle.stage ? (
                      <Chip label={lifecycle.stage} size="small" sx={{ fontWeight: 700, fontSize: "0.68rem", height: 24, bgcolor: stageColor.bg, color: stageColor.color }} />
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.secondary">
                      {lifecycle.ageLabel !== "Birth date not set" ? lifecycle.ageLabel : "—"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.primary" fontWeight={600}>
                      {animal.weight ? `${animal.weight} kg` : "\u2014"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Chip
                      label={animal.status}
                      size="small"
                      color={getStatusColor(animal.status)}
                      sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26 }}
                    />
                  </TableCell>

                  <TableCell sx={dataCell} align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Profile">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => { e.stopPropagation(); navigate(`/animals/${animal.id}`); }}
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => handleEdit(e, animal)}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDelete(e, animal.id)}
                        >
                          <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );})
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const headerCell = {
  fontWeight: 700,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "text.secondary",
  bgcolor: "grey.50",
  borderBottom: "2px solid",
  borderBottomColor: "divider",
  py: 1.5,
};

const dataCell = {
  py: 1.8,
  px: 2,
};
