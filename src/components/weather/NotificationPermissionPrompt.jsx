/**
 * Feldrix v1.2 — Notification Permission Prompt
 *
 * One-time permission request shown after login.
 * Does NOT re-prompt once a decision is made (unless "Remind Me Later" expires after 7 days).
 *
 * Displays:
 *   "Enable Weather Alerts?"
 *   Receive automatic warnings for: Freeze, Storms, Floods, Wind, Lightning, Heatwaves
 *   [Enable] [Remind Me Later]
 */

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";
import { radius } from "../../design/tokens";

import {
  shouldShowPermissionPrompt,
  requestPermission,
  setRemindLater,
} from "../../services/pushNotificationService";

export default function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(() => shouldShowPermissionPrompt());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!visible) return null;

  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      const result = await requestPermission();
      if (result === "granted") {
        setVisible(false);
      } else if (result === "denied") {
        setError("Notifications blocked. You can enable them later in your browser settings.");
        setTimeout(() => setVisible(false), 4000);
      } else if (result === "unsupported") {
        setError("Push notifications are not supported in this browser.");
        setTimeout(() => setVisible(false), 4000);
      }
    } catch {
      setError("Something went wrong. Please try again later.");
      setTimeout(() => setVisible(false), 4000);
    } finally {
      setLoading(false);
    }
  }

  function handleRemindLater() {
    setRemindLater();
    setVisible(false);
  }

  return (
    <Collapse in={visible}>
      <Card
        elevation={0}
        sx={{
          borderRadius: radius.card,
          border: "1px solid",
          borderColor: "primary.light",
          bgcolor: "rgba(22, 163, 74, 0.03)",
          mb: 2,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            {/* Icon */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <NotificationsActiveIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                Enable Weather Alerts?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                Receive automatic warnings before dangerous weather arrives:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {["Freeze", "Storms", "Floods", "Wind", "Lightning", "Heatwaves"].map((item) => (
                  <Typography
                    key={item}
                    variant="caption"
                    sx={{
                      px: 1.2,
                      py: 0.4,
                      borderRadius: 1,
                      bgcolor: "rgba(22,163,74,0.08)",
                      color: "primary.main",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Stack>

              {/* Action buttons */}
              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleEnable}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2.5,
                  }}
                >
                  {loading ? "Enabling..." : "Enable"}
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  size="small"
                  onClick={handleRemindLater}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    color: "text.secondary",
                  }}
                >
                  Remind Me Later
                </Button>
              </Stack>

              {/* Error message */}
              {error && (
                <Typography variant="caption" color="error.main" sx={{ mt: 1.5, display: "block" }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Collapse>
  );
}
