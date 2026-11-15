import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
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
import EventNoteIcon from "@mui/icons-material/EventNote";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { deleteBreedingRecord } from "../../services/breedingService";
import { radius, transitions } from "../../design/tokens";
import { sireLabel } from "../../utils/breedingSire";
import { lastBreedingEvent, shortEventLabel } from "../../utils/breedingEvents";

function getPregnancyProgress(record) {
  if (!record.breeding_date || !record.expected_birth) return 0;
  const start = new Date(record.breeding_date);
  const end = new Date(record.expected_birth);
  const today = new Date();
  const total = Math.max(1, Math.round((end - start) / 86400000));
  const elapsed = Math.round((today - start) / 86400000);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function getDaysRemaining(record) {
  if (!record.expected_birth) return { label: "\u2014", days: null, color: "default" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(record.expected_birth);
  due.setHours(0, 0, 0, 0);
  const days = Math.ceil((due - today) / 86400000);
  if (days < 0) return { label: "Overdue", days, color: "error" };
  if (days === 0) return { label: "Today", days: 0, color: "warning" };
  if (days <= 7) return { label: `${days} Days`, days, color: "warning" };
  if (days <= 30) return { label: `${days} Days`, days, color: "info" };
  return { label: `${days} Days`, days, color: "success" };
}

function getStatusColor(status) {
  switch (status) {
    case "Pregnant": return "success";
    case "Confirmed": return "success";
    case "Bred": return "info";
    case "Completed": return "secondary";
    case "Failed": return "error";
    case "Ready": return "warning";
    case "Heat Detected": return "warning";
    default: return "default";
  }
}

function formatDate(date) {
  if (!date) return "\u2014";
  try {
    return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "\u2014"; }
}

function getProgressColor(progress) {
  if (progress >= 90) return "error.main";
  if (progress >= 70) return "warning.main";
  return "success.main";
}

export default function BreedingTable({ records = [], onEdit, onEditEvents, refreshRecords }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = records.filter((record) => {
    const term = search.toLowerCase();
    return (
      (record.female?.tag || "").toLowerCase().includes(term) ||
      sireLabel(record).toLowerCase().includes(term) ||
      (record.status || "").toLowerCase().includes(term) ||
      (record.breeding_method || "").toLowerCase().includes(term)
    );
  });

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this breeding record?")) return;
    try {
      await deleteBreedingRecord(id);
      await refreshRecords();
    } catch (err) { alert(err.message); }
  }

  function handleEdit(e, record) {
    e.stopPropagation();
    onEdit?.(record);
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
            Breeding Records
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>

        <TextField
          size="small"
          placeholder="Search by animal, status or method..."
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
              <TableCell sx={headerCell}>Female</TableCell>
              <TableCell sx={headerCell}>Sire</TableCell>
              <TableCell sx={headerCell}>Date</TableCell>
              <TableCell sx={headerCell}>Method</TableCell>
              <TableCell sx={headerCell}>Expected</TableCell>
              <TableCell sx={headerCell}>Progress</TableCell>
              <TableCell sx={headerCell}>Days Left</TableCell>
              <TableCell sx={headerCell}>Last Event</TableCell>
              <TableCell sx={headerCell}>Status</TableCell>
              <TableCell sx={headerCell} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">No breeding records match your search.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((record, index) => {
                const progress = getPregnancyProgress(record);
                const daysInfo = getDaysRemaining(record);
                const lastEvent = lastBreedingEvent(record);
                return (
                  <TableRow
                    key={record.id}
                    hover
                    onClick={() => record.female_id && navigate(`/animals/${record.female_id}`, { state: { source: "breeding", section: "breeding" } })}
                    sx={{
                      cursor: record.female_id ? "pointer" : "default",
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
                        {record.female?.tag || "\u2014"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Typography variant="body2" color="text.secondary">
                        {sireLabel(record)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(record.breeding_date)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Typography variant="body2" color="text.primary">
                        {record.breeding_method || "\u2014"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Typography variant="body2" color="text.primary">
                        {formatDate(record.expected_birth)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      {record.expected_birth && record.status === "Pregnant" ? (
                        <Stack spacing={0.5} sx={{ minWidth: 80 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "grey.200",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                bgcolor: getProgressColor(progress),
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                            {progress}%
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.disabled">{"\u2014"}</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={dataCell}>
                      {daysInfo.label !== "\u2014" ? (
                        <Chip
                          label={daysInfo.label}
                          size="small"
                          color={daysInfo.color}
                          sx={{ fontWeight: 700, fontSize: "0.7rem", height: 24, minWidth: 64 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">{"\u2014"}</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={dataCell}>
                      {lastEvent ? (
                        <>
                          <Typography variant="body2" color="text.primary">{shortEventLabel(lastEvent)}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(lastEvent.date)}</Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.disabled">{"\u2014"}</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={dataCell}>
                      <Chip
                        label={record.status || "Unknown"}
                        size="small"
                        color={getStatusColor(record.status)}
                        sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26 }}
                      />
                    </TableCell>

                    <TableCell sx={dataCell} align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {record.female_id && (
                          <Tooltip title="View Animal">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => { e.stopPropagation(); navigate(`/animals/${record.female_id}`, { state: { source: "breeding", section: "breeding" } }); }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEditEvents && (
                          <Tooltip title="Edit events (heat / check / birth)">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onEditEvents(record); }}>
                              <EventNoteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={(e) => handleEdit(e, record)}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={(e) => handleDelete(e, record.id)}>
                            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
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
