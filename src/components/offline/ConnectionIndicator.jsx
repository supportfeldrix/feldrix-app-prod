/**
 * ============================================================
 * Feldrix — Connection Status Indicator
 * Version 1.0
 *
 * Displays connectivity status in the TopBar.
 * Shows pending sync badge when items are queued.
 * ============================================================
 */

import { Badge, Chip, CircularProgress } from "@mui/material";
import { CloudDone, CloudOff, Sync } from "@mui/icons-material";
import { useConnection } from "../../context/ConnectionContext";

export default function ConnectionIndicator() {
  const { isOnline, isSyncing, pendingCount } = useConnection();

  if (isSyncing) {
    return (
      <Chip
        icon={<CircularProgress size={12} sx={{ color: "inherit" }} />}
        label="Syncing"
        size="small"
        sx={{
          height: 24,
          fontSize: "0.7rem",
          fontWeight: 600,
          bgcolor: "warning.50",
          color: "warning.dark",
          border: "1px solid",
          borderColor: "warning.200",
        }}
      />
    );
  }

  if (!isOnline) {
    return (
      <Badge badgeContent={pendingCount} color="warning" max={99}>
        <Chip
          icon={<CloudOff sx={{ fontSize: 14 }} />}
          label="Offline"
          size="small"
          sx={{
            height: 24,
            fontSize: "0.7rem",
            fontWeight: 600,
            bgcolor: "error.50",
            color: "error.dark",
            border: "1px solid",
            borderColor: "error.200",
          }}
        />
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Badge badgeContent={pendingCount} color="warning" max={99}>
        <Chip
          icon={<Sync sx={{ fontSize: 14 }} />}
          label="Pending"
          size="small"
          onClick={() => {}}
          sx={{
            height: 24,
            fontSize: "0.7rem",
            fontWeight: 600,
            bgcolor: "warning.50",
            color: "warning.dark",
            border: "1px solid",
            borderColor: "warning.200",
            cursor: "pointer",
          }}
        />
      </Badge>
    );
  }

  // Online, no pending — show green indicator
  return (
    <Chip
      icon={<CloudDone sx={{ fontSize: 14 }} />}
      label="Online"
      size="small"
      sx={{
        height: 24,
        fontSize: "0.7rem",
        fontWeight: 600,
        bgcolor: "success.50",
        color: "success.dark",
        border: "1px solid",
        borderColor: "success.200",
      }}
    />
  );
}
