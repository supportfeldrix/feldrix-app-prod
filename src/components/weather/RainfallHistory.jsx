/**
 * Feldrix — Rainfall history table.
 *
 * Lists farmer-recorded rainfall (newest first). Newest row highlighted.
 * Edit + delete follow existing Feldrix table conventions (window.confirm).
 * Horizontally scrollable on small screens to stay mobile-safe.
 */

import {
  Box, Chip, IconButton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { deleteRainfallLog } from "../../services/rainfallService";
import { radius } from "../../design/tokens";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return d;
  }
}

const val = (v) => (v == null || v === "" ? "—" : v);

export default function RainfallHistory({ logs = [], onEdit, refreshLogs }) {
  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this rainfall record? This cannot be undone.")) return;
    try {
      await deleteRainfallLog(id);
      await refreshLogs?.();
    } catch (err) {
      alert(err.message || "Failed to delete rainfall record.");
    }
  }

  if (!logs || logs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="body2">No rainfall recorded yet.</Typography>
      </Box>
    );
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
      <TableContainer sx={{ maxHeight: 480, overflowX: "auto" }}>
        <Table stickyHeader size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCell}>Date</TableCell>
              <TableCell sx={headerCell} align="right">Amount</TableCell>
              <TableCell sx={headerCell}>Field</TableCell>
              <TableCell sx={headerCell}>Source</TableCell>
              <TableCell sx={headerCell}>Notes</TableCell>
              <TableCell sx={headerCell} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((r, index) => (
              <TableRow
                key={r.id}
                hover
                sx={{
                  bgcolor: index === 0 ? "rgba(25,118,210,0.06)" : "inherit",
                  "& td": { borderBottom: "1px solid", borderBottomColor: "divider" },
                }}
              >
                <TableCell sx={dataCell}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2" fontWeight={index === 0 ? 700 : 500}>
                      {fmtDate(r.rainfall_date)}
                    </Typography>
                    {index === 0 && (
                      <Chip label="Latest" size="small" color="info" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
                    )}
                  </Stack>
                </TableCell>
                <TableCell sx={dataCell} align="right">
                  <Typography variant="body2" fontWeight={700}>{Number(r.amount_mm)} mm</Typography>
                </TableCell>
                <TableCell sx={dataCell}>{val(r.field_name)}</TableCell>
                <TableCell sx={dataCell}>{val(r.measurement_source)}</TableCell>
                <TableCell sx={{ ...dataCell, maxWidth: 220, whiteSpace: "normal" }}>{val(r.notes)}</TableCell>
                <TableCell sx={dataCell} align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onEdit?.(r); }}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={(e) => handleDelete(e, r.id)}>
                        <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const headerCell = {
  fontWeight: 700,
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  color: "text.secondary",
  bgcolor: "grey.50",
  borderBottom: "2px solid",
  borderBottomColor: "divider",
  py: 1.25,
  whiteSpace: "nowrap",
};

const dataCell = { py: 1.2, px: 1.5, whiteSpace: "nowrap" };
