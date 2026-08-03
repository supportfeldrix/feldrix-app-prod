/**
 * Feldrix Control Centre — Notifications Page (Placeholder)
 * Sprint 46.2
 */
import { Box, Typography, Stack } from "@mui/material";
import { ADMIN_THEME } from "../utils/adminConstants";

export default function AdminNotifications() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: ADMIN_THEME.text }}>Notifications</Typography>
        <Typography sx={{ fontSize: "0.9rem", color: ADMIN_THEME.textSecondary }}>Broadcast messages and platform announcements.</Typography>
      </Box>
      <Box sx={{ p: 4, borderRadius: 3, bgcolor: "#fff", border: `1px dashed ${ADMIN_THEME.primary}30`, textAlign: "center" }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_THEME.primary, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>Coming in Sprint 46.3</Typography>
        <Stack spacing={1}>
          {["Broadcast Composer", "Notification History", "Target Audience Selector", "Schedule for Later", "Maintenance Notices", "Release Notes"].map((s) => (
            <Typography key={s} sx={{ fontSize: "0.85rem", color: ADMIN_THEME.textSecondary }}>• {s}</Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
