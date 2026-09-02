/**
 * Feldrix — Ground Sampling history table.
 *
 * Lists all soil samples (newest first). The newest row is highlighted.
 * Raw values with explicit unit headers only (no interpretation in v1).
 * Edit + delete follow existing Feldrix table conventions (window.confirm).
 */

import {
  Box, Chip, IconButton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { deleteGroundSample } from "../../services/groundSamplingService";
import { radius } from "../../design/tokens";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
      day: "2-digit", month: "short", year: "2-digit",
    });
  } catch {
    return d;
  }
}

const val = (v) => (v == null || v === "" ? "—" : v);

export default function GroundSampleHistory({ samples = [], onEdit, refreshSamples }) {
  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this ground sample? This cannot be undone.")) return;
    try {
      await deleteGroundSample(id);
      await refreshSamples?.();
    } catch (err) {
      alert(err.message || "Failed to delete sample.");
    }
  }

  if (!samples || samples.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="body2">No ground samples recorded yet.</Typography>
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
      <TableContainer sx={{ maxHeight: 520, overflowX: "auto" }}>
        <Table stickyHeader size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCell}>Date</TableCell>
              <TableCell sx={headerCell}>Field</TableCell>
              <TableCell sx={headerCell}>Crop</TableCell>
              <TableCell sx={headerCell}>Depth</TableCell>
              <TableCell sx={headerCell} align="right">pH</TableCell>
              <TableCell sx={headerCell} align="right">N (mg/kg)</TableCell>
              <TableCell sx={headerCell} align="right">P (mg/kg)</TableCell>
              <TableCell sx={headerCell} align="right">K (mg/kg)</TableCell>
              <TableCell sx={headerCell} align="right">OM (%)</TableCell>
              <TableCell sx={headerCell} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {samples.map((s, index) => (
              <TableRow
                key={s.id}
                hover
                sx={{
                  bgcolor: index === 0 ? "rgba(46,125,50,0.06)" : "inherit",
                  "& td": { borderBottom: "1px solid", borderBottomColor: "divider" },
                }}
              >
                <TableCell sx={dataCell}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2" fontWeight={index === 0 ? 700 : 500}>
                      {fmtDate(s.sample_date)}
                    </Typography>
                    {index === 0 && (
                      <Chip label="Latest" size="small" color="success" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
                    )}
                  </Stack>
                </TableCell>
                <TableCell sx={dataCell}>{val(s.field_name || s.crops?.field_name)}</TableCell>
                <TableCell sx={dataCell}>{val(s.crops?.crop_name)}</TableCell>
                <TableCell sx={dataCell}>{val(s.sampling_depth)}</TableCell>
                <TableCell sx={dataCell} align="right">{val(s.ph)}</TableCell>
                <TableCell sx={dataCell} align="right">{val(s.nitrogen)}</TableCell>
                <TableCell sx={dataCell} align="right">{val(s.phosphorus)}</TableCell>
                <TableCell sx={dataCell} align="right">{val(s.potassium)}</TableCell>
                <TableCell sx={dataCell} align="right">{val(s.organic_matter)}</TableCell>
                <TableCell sx={dataCell} align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onEdit?.(s); }}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={(e) => handleDelete(e, s.id)}>
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
