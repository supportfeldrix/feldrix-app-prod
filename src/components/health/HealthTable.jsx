import { useMemo, useState } from "react";
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { deleteHealthRecord } from "../../services/healthService";
import { radius, transitions } from "../../design/tokens";

function getStatus(record) {
  // Completed takes precedence over any date-based status. A completed
  // treatment is never "Overdue", even though next_due is preserved.
  if (record?.completed_at) return { label: "Completed", color: "success" };
  const nextDue = record?.next_due;
  if (!nextDue) return { label: "No Due Date", color: "default" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return { label: "Overdue", color: "error" };
  if (diff <= 7) return { label: "Due Soon", color: "warning" };
  return { label: "Current", color: "success" };
}

function formatDate(date) {
  if (!date) return "\u2014";
  try {
    return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "\u2014";
  }
}

export default function HealthTable({ records = [], onEdit, refreshRecords }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return records.filter((r) => {
      const text = `${r.livestock?.tag ?? ""} ${r.livestock?.breed ?? ""} ${r.treatment_type ?? ""} ${r.description ?? ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [records, search]);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this health record?")) return;
    try {
      await deleteHealthRecord(id);
      await refreshRecords?.();
    } catch (err) {
      alert(err.message);
    }
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
            Health Records
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>

        <TextField
          size="small"
          placeholder="Search by animal, treatment or description..."
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
            "& .MuiOutlinedInput-root": { borderRadius: radius.input },
          }}
        />
      </Stack>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={headerCell}>Animal</TableCell>
              <TableCell sx={headerCell}>Treatment</TableCell>
              <TableCell sx={headerCell}>Date</TableCell>
              <TableCell sx={headerCell}>Status</TableCell>
              <TableCell sx={headerCell}>Next Due</TableCell>
              <TableCell sx={headerCell} align="right">Cost</TableCell>
              <TableCell sx={headerCell} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">No health records match your search.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((record, index) => {
                const status = getStatus(record);
                return (
                  <TableRow
                    key={record.id}
                    hover
                    onClick={() => record.animal_id && navigate(`/animals/${record.animal_id}`, { state: { source: "health", section: "health" } })}
                    sx={{
                      cursor: record.animal_id ? "pointer" : "default",
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
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {record.livestock?.tag || "\u2014"}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {record.livestock?.breed || ""}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Typography variant="body2" color="text.primary">
                        {record.treatment_type}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(record.treatment_date)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                        sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26 }}
                      />
                    </TableCell>

                    <TableCell sx={dataCell}>
                      <Typography variant="body2" color="text.primary">
                        {formatDate(record.next_due)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell} align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        R {Number(record.cost || 0).toFixed(2)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={dataCell} align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {record.animal_id && (
                          <Tooltip title="View Animal">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => { e.stopPropagation(); navigate(`/animals/${record.animal_id}`, { state: { source: "health", section: "health" } }); }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => handleEdit(e, record)}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => handleDelete(e, record.id)}
                          >
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
