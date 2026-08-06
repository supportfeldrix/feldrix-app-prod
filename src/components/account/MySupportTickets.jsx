/**
 * ============================================================
 * Feldrix — My Support Tickets
 * Version 1.0
 *
 * Farmer-facing ticket list with conversation view and reply.
 * Displayed on the Account page below Contact Support.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Stack, Card, CardContent, Chip, Divider,
  TextField, Button, IconButton, Paper, Badge, CircularProgress,
  InputAdornment, Avatar,
} from "@mui/material";
import {
  ConfirmationNumber, ArrowBack, Send, Search, Circle, Schedule,
  CheckCircle, HourglassEmpty,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import {
  getMyTickets,
  getTicketMessages,
  sendReply,
  markTicketRead,
} from "../../services/supportTicketService";

const STATUS_CONFIG = {
  open: { label: "Open", color: "#3B82F6", icon: <Circle sx={{ fontSize: 8 }} /> },
  assigned: { label: "Assigned", color: "#8B5CF6", icon: <Circle sx={{ fontSize: 8 }} /> },
  waiting_customer: { label: "Waiting for You", color: "#F59E0B", icon: <HourglassEmpty sx={{ fontSize: 12 }} /> },
  resolved: { label: "Resolved", color: "#16A34A", icon: <CheckCircle sx={{ fontSize: 12 }} /> },
  closed: { label: "Closed", color: "#64748B", icon: <CheckCircle sx={{ fontSize: 12 }} /> },
};

export default function MySupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function handleOpenTicket(ticket) {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const msgs = await getTicketMessages(ticket.id);
      setMessages(msgs);
      await markTicketRead(ticket.id);
      // Update local unread count
      setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, unread_count: 0 } : t));
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await sendReply(selectedTicket.id, replyText.trim());
      setReplyText("");
      toast.success("Reply sent.");
      // Reload messages
      const msgs = await getTicketMessages(selectedTicket.id);
      setMessages(msgs);
      loadTickets();
    } catch (err) {
      toast.error("Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  }

  const filteredTickets = search.trim()
    ? tickets.filter((t) => t.subject.toLowerCase().includes(search.toLowerCase()) || t.ticket_number.toLowerCase().includes(search.toLowerCase()))
    : tickets;

  const totalUnread = tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);

  // ─── Conversation View ────────────────────────────────────

  if (selectedTicket) {
    const status = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
    const canReply = selectedTicket.status !== "closed";

    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <IconButton size="small" onClick={() => setSelectedTicket(null)}>
              <ArrowBack sx={{ fontSize: 18 }} />
            </IconButton>
            <ConfirmationNumber sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
              {selectedTicket.ticket_number}
            </Typography>
            <Chip label={status.label} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, bgcolor: `${status.color}15`, color: status.color }} />
            <Box sx={{ flex: 1 }} />
            {selectedTicket.category && (
              <Chip label={selectedTicket.category} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6rem" }} />
            )}
          </Stack>

          {/* Subject */}
          <Box sx={{ px: 3, py: 1.5, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle1" fontWeight={700}>{selectedTicket.subject}</Typography>
            <Typography variant="caption" color="text.secondary">Created {formatTime(selectedTicket.created_at)}</Typography>
          </Box>

          {/* Messages */}
          <Box sx={{ maxHeight: 400, overflowY: "auto", px: 3, py: 2 }}>
            {loadingMessages ? (
              <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress size={24} /></Box>
            ) : messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>No messages yet.</Typography>
            ) : (
              <Stack spacing={2}>
                {messages.map((msg) => (
                  <Box key={msg.id} sx={{ display: "flex", justifyContent: msg.sender_type === "customer" ? "flex-end" : "flex-start" }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, maxWidth: "80%", borderRadius: 2,
                        bgcolor: msg.sender_type === "customer" ? "primary.50" : "grey.100",
                        border: "1px solid",
                        borderColor: msg.sender_type === "customer" ? "primary.100" : "divider",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700} color={msg.sender_type === "customer" ? "primary.main" : "text.primary"}>
                          {msg.sender_name}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">{formatTime(msg.created_at)}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {msg.content}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Reply Input */}
          {canReply && (
            <Box sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  multiline
                  maxRows={3}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  sx={{ minWidth: 44 }}
                >
                  <Send sx={{ fontSize: 18 }} />
                </Button>
              </Stack>
            </Box>
          )}

          {!canReply && (
            <Box sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                This ticket has been closed. Create a new ticket if you need further assistance.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Ticket List View ─────────────────────────────────────

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <ConfirmationNumber color="primary" sx={{ fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={700}>My Support Tickets</Typography>
              {totalUnread > 0 && (
                <Badge badgeContent={totalUnread} color="error" sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem" } }} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">View and manage your support requests.</Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Search */}
        {tickets.length > 0 && (
          <TextField
            size="small"
            fullWidth
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
            sx={{ mb: 2 }}
          />
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress size={28} /></Box>
        )}

        {/* Empty State */}
        {!loading && tickets.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Schedule sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>No tickets yet</Typography>
            <Typography variant="caption" color="text.secondary">
              When you contact support, your tickets will appear here.
            </Typography>
          </Box>
        )}

        {/* Ticket List */}
        {!loading && filteredTickets.length > 0 && (
          <Stack spacing={1}>
            {filteredTickets.map((ticket) => {
              const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              return (
                <Paper
                  key={ticket.id}
                  elevation={0}
                  onClick={() => handleOpenTicket(ticket)}
                  sx={{
                    p: 2, borderRadius: 2, cursor: "pointer",
                    border: "1px solid", borderColor: "divider",
                    transition: "all 0.15s ease",
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" fontWeight={700} color="primary.main">{ticket.ticket_number}</Typography>
                      <Chip label={status.label} size="small" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 600, bgcolor: `${status.color}15`, color: status.color }} />
                      {ticket.unread_count > 0 && (
                        <Chip label={`${ticket.unread_count} new`} size="small" color="error" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 700 }} />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.disabled">{formatTime(ticket.updated_at)}</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ticket.subject}
                  </Typography>
                  {ticket.category && (
                    <Typography variant="caption" color="text.secondary">{ticket.category}</Typography>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
