/**
 * Feldrix Control Centre — Audit Log Page (Placeholder)
 * Sprint 46.2
 */
import { Box, Typography, Stack } from "@mui/material";
import { ADMIN_THEME } from "../utils/adminConstants";

export default function AdminAuditLog() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: ADMIN_THEME.text }}>Audit Log</Typography>
        <Typography sx={{ fontSize: "0.9rem", color: ADMIN_THEME.textSecondary }}>Track all administrator actions for accountability.</Typography>
      </Box>
      <Box sx={{ p: 4, borderRadius: 3, bgcolor: "#fff", border: `1px dashed ${ADMIN_THEME.primary}30`, textAlign: "center" }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.primary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>Coming in Sprint 46.3</Typography>
        <Stack spacing={1}>
          {["Audit Table (searchable, filterable)", "Severity Filter (INFO / WARN / ERROR / SECURITY)", "Admin Action Details", "Target Entity Links", "Export Audit Log"].map((s) => (
            <Typography key={s} sx={{ fontSize: "0.85rem", color: ADMIN_THEME.textSecondary }}>• {s}</Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
