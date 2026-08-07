import { useState } from "react";

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

import { deleteCrop } from "../../services/cropService";
import { radius, transitions } from "../../design/tokens";
import { getCropLifecycle, getCropStageColor } from "../../utils/cropLifecycle";

function getStatusColor(status) {
  switch (status) {
    case "Growing": return "success";
    case "Planted": return "warning";
    case "Harvested": return "info";
    case "Completed": return "secondary";
    case "Failed": return "error";
    default: return "default";
  }
}

function getGrowthStageColor(stage) {
  switch (stage) {
    case "Seeded": return "default";
    case "Germinating": return "info";
    case "Growing": return "success";
    case "Flowering": return "warning";
    case "Harvest Ready": return "error";
    case "Completed": return "secondary";
    default: return "default";
  }
}

export default function CropTable({ crops = [], onEdit, refreshCrops }) {
  const [search, setSearch] = useState("");

  const filtered = crops.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.crop_name || "").toLowerCase().includes(term) ||
      (c.variety || "").toLowerCase().includes(term) ||
      (c.field_name || "").toLowerCase().includes(term) ||
      (c.status || "").toLowerCase().includes(term) ||
      (c.growth_stage || "").toLowerCase().includes(term) ||
      (getCropLifecycle(c).lifecycleStage || "").toLowerCase().includes(term)
    );
  });

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this crop?")) return;
    try {
      await deleteCrop(id);
      if (refreshCrops) await refreshCrops();
    } catch (err) { alert(err.message); }
  }

  function handleEdit(e, crop) {
    e.stopPropagation();
    onEdit?.(crop);
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
            Crop Registry
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} crop{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>

        <TextField
          size="small"
          placeholder="Search by crop, variety or field..."
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
            minWidth: 260,
            "& .MuiOutlinedInput-root": { borderRadius: radius.input },
          }}
        />
      </Stack>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={headerCell}>Crop</TableCell>
              <TableCell sx={headerCell}>Field</TableCell>
              <TableCell sx={headerCell}>Lifecycle</TableCell>
              <TableCell sx={headerCell}>Age</TableCell>
              <TableCell sx={headerCell}>Harvest</TableCell>
              <TableCell sx={headerCell}>Area</TableCell>
              <TableCell sx={headerCell}>Status</TableCell>
              <TableCell sx={headerCell} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">No crops match your search.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((crop, index) => {
                const lc = getCropLifecycle(crop);
                const stageColor = lc.lifecycleStage ? getCropStageColor(lc.lifecycleStage) : null;
                return (
                <TableRow
                  key={crop.id}
                  hover
                  onClick={() => onEdit?.(crop)}
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
                      {crop.crop_name || "\u2014"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{crop.variety || ""}</Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.secondary">
                      {crop.field_name || "\u2014"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    {stageColor ? (
                      <Chip label={lc.lifecycleStage} size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22, bgcolor: stageColor.bg, color: stageColor.color }} />
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.secondary">
                      {lc.ageLabel !== "No planting date" ? lc.ageLabel : "—"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    {lc.daysRemaining != null ? (
                      <Typography variant="body2" color={lc.daysRemaining <= 7 ? "success.main" : "text.secondary"} fontWeight={lc.daysRemaining <= 7 ? 700 : 400}>
                        {lc.daysRemaining === 0 ? "Ready!" : `${lc.daysRemaining}d`}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.primary">
                      {crop.area ? `${crop.area} ${crop.area_unit || "ha"}` : "\u2014"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Chip
                      label={crop.status || "Unknown"}
                      size="small"
                      color={getStatusColor(crop.status)}
                      sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26 }}
                    />
                  </TableCell>

                  <TableCell sx={dataCell} align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => handleEdit(e, crop)}
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => handleEdit(e, crop)}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDelete(e, crop.id)}
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
