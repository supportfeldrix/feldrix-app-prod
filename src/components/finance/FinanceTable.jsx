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
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { deleteFinanceRecord } from "../../services/financeService";
import { radius, transitions } from "../../design/tokens";

function getAppliesToLabel(record) {
  const scope = record.applies_to || (record.animal_id ? "animal" : "farm");
  if (scope === "farm") return "Entire Farm";
  if (scope === "livestock") return "Livestock";
  if (scope === "animal") return record.animal?.tag ? `Animal • ${record.animal.tag}` : "Deleted Animal";
  return "Entire Farm";
}

function formatDate(date) {
  if (!date) return "\u2014";
  try {
    return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "\u2014"; }
}

function formatAmount(value, category) {
  const num = Number(value || 0);
  const formatted = `R ${Math.abs(num).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return category === "Income" ? `+${formatted}` : `-${formatted}`;
}

export default function FinanceTable({ records = [], onEdit, refreshRecords }) {
  const [search, setSearch] = useState("");

  const filtered = records.filter((record) => {
    const term = search.toLowerCase();
    return (
      getAppliesToLabel(record).toLowerCase().includes(term) ||
      (record.animal?.tag || "").toLowerCase().includes(term) ||
      (record.transaction_type || "").toLowerCase().includes(term) ||
      (record.category || "").toLowerCase().includes(term) ||
      (record.description || "").toLowerCase().includes(term)
    );
  });

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this finance record?")) return;
    try {
      await deleteFinanceRecord(id);
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
            Finance Records
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>

        <TextField
          size="small"
          placeholder="Search by type, category or description..."
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
              <TableCell sx={headerCell}>Date</TableCell>
              <TableCell sx={headerCell}>Type</TableCell>
              <TableCell sx={headerCell}>Category</TableCell>
              <TableCell sx={headerCell}>Applies To</TableCell>
              <TableCell sx={headerCell}>Description</TableCell>
              <TableCell sx={headerCell} align="right">Amount</TableCell>
              <TableCell sx={headerCell} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">No finance records match your search.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((record, index) => (
                <TableRow
                  key={record.id}
                  hover
                  sx={{
                    cursor: "default",
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
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(record.transaction_date)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {record.transaction_type}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Chip
                      label={record.category}
                      size="small"
                      color={record.category === "Income" ? "success" : "error"}
                      sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26 }}
                    />
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.secondary">
                      {getAppliesToLabel(record)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell}>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {record.description || "\u2014"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell} align="right">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: record.category === "Income" ? "success.main" : "error.main" }}
                    >
                      {formatAmount(record.amount, record.category)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={dataCell} align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
              ))
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
