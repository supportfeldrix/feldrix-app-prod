/**
 * ============================================================
 * Feldrix Customer Success Centre — Main Page
 * Version 1.0
 *
 * Container page with Email Inbox and Support Tickets modules.
 * Coordinates cross-module navigation (e.g. Convert to Ticket
 * switches to Tickets tab and opens the new ticket).
 * ============================================================
 */

import { useState, useCallback } from "react";
import { Box, Typography, Stack, Tab, Tabs, Chip } from "@mui/material";
import { Email, ConfirmationNumber } from "@mui/icons-material";
import { semantic } from "../../../shared/design/tokens";
import EmailInbox from "./EmailInbox";
import SupportTickets from "./SupportTickets";

export default function CustomerSuccessCentre() {
  const [activeTab, setActiveTab] = useState(0);
  const [openTicketId, setOpenTicketId] = useState(null);

  /**
   * Called by EmailInbox after converting an email to a ticket.
   * Switches to Support Tickets tab and auto-opens the new ticket.
   */
  const handleTicketCreated = useCallback((ticketId) => {
    setOpenTicketId(ticketId);
    setActiveTab(1);
  }, []);

  /**
   * Called by SupportTickets once it has consumed the openTicketId.
   */
  const handleTicketOpened = useCallback(() => {
    setOpenTicketId(null);
  }, []);

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: semantic.text }}>
            Customer Success
          </Typography>
          <Chip label="v1.0" size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 700, bgcolor: `${semantic.info}10`, color: semantic.info }} />
        </Stack>
        <Typography sx={{ fontSize: "0.82rem", color: semantic.textSecondary, mt: 0.25 }}>
          Manage customer communication, email and support tickets in one workspace.
        </Typography>
      </Box>

      {/* Module Tabs */}
      <Box sx={{ borderBottom: `1px solid ${semantic.border}` }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 42,
            "& .MuiTab-root": {
              minHeight: 42,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              px: 2.5,
            },
          }}
        >
          <Tab icon={<Email sx={{ fontSize: 18 }} />} iconPosition="start" label="Email Inbox" />
          <Tab icon={<ConfirmationNumber sx={{ fontSize: 18 }} />} iconPosition="start" label="Support Tickets" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box>
        {activeTab === 0 && <EmailInbox onTicketCreated={handleTicketCreated} />}
        {activeTab === 1 && <SupportTickets openTicketId={openTicketId} onTicketOpened={handleTicketOpened} />}
      </Box>
    </Stack>
  );
}
