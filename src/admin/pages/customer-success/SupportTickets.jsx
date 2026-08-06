/**
 * ============================================================
 * Feldrix Customer Success Centre — Support Tickets
 * Version 1.0
 *
 * Ticket management workspace with list, detail view,
 * customer context panel, conversation, and timeline.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Stack, Divider, IconButton, TextField, Chip,
  Button, Tooltip, InputAdornment, Skeleton, Avatar, Paper, Tab, Tabs,
} from "@mui/material";
import {
  Search, ArrowBack, Send, Edit, Close, Flag,
  PersonAdd, CheckCircle, Schedule, Circle, AccessTime,
  StickyNote2, Timeline as TimelineIcon, ChatBubble,
} from "@mui/icons-material";
import { semantic, radius, shadows, transitions } from "../../../shared/design/tokens";
import { getTickets, getTicketById, getTicketMessages, getTicketNotes, getTicketCounts, addTicketReply, addTicketNote, updateTicketStatus, updateTicketPriority } from "../../services/ticketService";
import { getCustomerContext, getCustomerTimeline } from "../../services/supportService";

// ─── Constants ──────────────────────────────────────────────

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "assigned", label: "Assigned" },
  { id: "waiting_customer", label: "Waiting" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

const STATUS_COLORS = {
  open: { bg: "#DBEAFE", text: "#1E40AF" },
  assigned: { bg: "#EDE9FE", text: "#5B21B6" },
  waiting_customer: { bg: "#FEF3C7", text: "#92400E" },
  resolved: { bg: "#DCFCE7", text: "#166534" },
  closed: { bg: "#F1F5F9", text: "#475569" },
};

const PRIORITY_COLORS = { urgent: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#94A3B8" };

const TIMELINE_ICONS = {
  email: "📧",
  ticket: "🎫",
  reply: "💬",
  login: "🔑",
  activity: "📋",
  subscription: "💳",
};

// ─── Support Tickets Page ───────────────────────────────────

export default function SupportTickets() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [customerCtx, setCustomerCtx] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [detailTab, setDetailTab] = useState(0);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTickets({ status: statusFilter, search });
      setTickets(data);
      const c = await getTicketCounts();
      setCounts(c);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function handleSelectTicket(ticket) {
    setSelectedTicket(ticket);
    setDetailTab(0);
    const [msgs, nts] = await Promise.all([
      getTicketMessages(ticket.id),
      getTicketNotes(ticket.id),
    ]);
    setMessages(msgs);
    setNotes(nts);

    if (ticket.customer_id) {
      const [ctx, tl] = await Promise.all([
        getCustomerContext(ticket.customer_id),
        getCustomerTimeline(ticket.customer_id),
      ]);
      setCustomerCtx(ctx);
      setTimeline(tl);
    } else {
      setCustomerCtx(null);
      setTimeline([]);
    }
  }

  async function handleReply() {
    if (!replyText.trim() || !selectedTicket) return;
    await addTicketReply(selectedTicket.id, replyText.trim());
    setReplyText("");
    const msgs = await getTicketMessages(selectedTicket.id);
    setMessages(msgs);
  }

  async function handleAddNote() {
    if (!noteText.trim() || !selectedTicket) return;
    await addTicketNote(selectedTicket.id, noteText.trim());
    setNoteText("");
    const nts = await getTicketNotes(selectedTicket.id);
    setNotes(nts);
  }

  async function handleStatusChange(newStatus) {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket.id, newStatus);
    const updated = await getTicketById(selectedTicket.id);
    setSelectedTicket(updated);
    loadTickets();
  }

  async function handlePriorityChange(priority) {
    if (!selectedTicket) return;
    await updateTicketPriority(selectedTicket.id, priority);
    const updated = await getTicketById(selectedTicket.id);
    setSelectedTicket(updated);
    loadTickets();
  }

  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 80px)", overflow: "hidden", borderRadius: radius.lg, border: `1px solid ${semantic.border}`, bgcolor: semantic.paper }}>
      {/* Ticket List Panel */}
      <Box sx={{ width: { xs: selectedTicket ? 0 : "100%", md: 400 }, borderRight: `1px solid ${semantic.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, transition: "width 0.2s" }}>
        {/* Status Tabs */}
        <Box sx={{ borderBottom: `1px solid ${semantic.border}`, px: 1 }}>
          <Tabs
            value={statusFilter}
            onChange={(_, v) => { setStatusFilter(v); setSelectedTicket(null); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 0, fontSize: "0.7rem", textTransform: "none", fontWeight: 600 } }}
          >
            {STATUS_TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={`${t.label}${counts[t.id] != null ? ` (${counts[t.id]})` : ""}`} />
            ))}
          </Tabs>
        </Box>

        {/* Search */}
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${semantic.border}` }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: semantic.textTertiary }} /></InputAdornment>,
              sx: { fontSize: "0.82rem", borderRadius: radius.sm },
            }}
          />
        </Box>

        {/* Ticket List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <Stack spacing={0.5} sx={{ p: 1 }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: radius.sm }} />)}
            </Stack>
          ) : tickets.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">No tickets match your filter.</Typography>
            </Box>
          ) : (
            tickets.map((ticket) => (
              <Box
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
                sx={{
                  px: 2, py: 1.5, cursor: "pointer",
                  bgcolor: selectedTicket?.id === ticket.id ? `${semantic.info}08` : "transparent",
                  borderBottom: `1px solid ${semantic.border}`,
                  transition: transitions.fast,
                  "&:hover": { bgcolor: `${semantic.info}06` },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: semantic.info }}>{ticket.ticket_number}</Typography>
                    <Chip
                      label={ticket.status.replace("_", " ")}
                      size="small"
                      sx={{ height: 18, fontSize: "0.55rem", fontWeight: 600, bgcolor: STATUS_COLORS[ticket.status]?.bg, color: STATUS_COLORS[ticket.status]?.text }}
                    />
                  </Stack>
                  <Circle sx={{ fontSize: 8, color: PRIORITY_COLORS[ticket.priority] }} />
                </Stack>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ticket.subject}
                </Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary }}>
                    {ticket.customer_name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary }}>
                    {formatTime(ticket.updated_at)}
                  </Typography>
                </Stack>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Ticket Detail */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedTicket ? (
          <>
            {/* Header */}
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${semantic.border}` }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={() => setSelectedTicket(null)} sx={{ display: { md: "none" } }}>
                  <ArrowBack sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.info }}>{selectedTicket.ticket_number}</Typography>
                <Chip label={selectedTicket.status.replace("_", " ")} size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 600, bgcolor: STATUS_COLORS[selectedTicket.status]?.bg, color: STATUS_COLORS[selectedTicket.status]?.text }} />
                <Chip label={selectedTicket.priority} size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 600, bgcolor: `${PRIORITY_COLORS[selectedTicket.priority]}15`, color: PRIORITY_COLORS[selectedTicket.priority] }} />
                <Box sx={{ flex: 1 }} />
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle sx={{ fontSize: 14 }} />} onClick={() => handleStatusChange("resolved")} sx={{ textTransform: "none", fontSize: "0.7rem", fontWeight: 600, borderRadius: radius.sm }}>
                    Resolve
                  </Button>
                )}
                {selectedTicket.status === "resolved" && (
                  <Button size="small" variant="outlined" startIcon={<Close sx={{ fontSize: 14 }} />} onClick={() => handleStatusChange("closed")} sx={{ textTransform: "none", fontSize: "0.7rem", fontWeight: 600, borderRadius: radius.sm }}>
                    Close
                  </Button>
                )}
              </Stack>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: semantic.text, mt: 1 }}>
                {selectedTicket.subject}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: semantic.textTertiary, mt: 0.25 }}>
                {selectedTicket.customer_name} &middot; {selectedTicket.customer_email} &middot; {selectedTicket.farm_name}
              </Typography>
            </Box>

            {/* Tabs */}
            <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ borderBottom: `1px solid ${semantic.border}`, minHeight: 36, px: 2, "& .MuiTab-root": { minHeight: 36, py: 0, fontSize: "0.72rem", textTransform: "none", fontWeight: 600 } }}>
              <Tab icon={<ChatBubble sx={{ fontSize: 14 }} />} iconPosition="start" label="Conversation" />
              <Tab icon={<StickyNote2 sx={{ fontSize: 14 }} />} iconPosition="start" label={`Notes (${notes.length})`} />
              <Tab icon={<TimelineIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="Timeline" />
            </Tabs>

            {/* Tab Content */}
            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Main content area */}
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
                  {detailTab === 0 && (
                    <Stack spacing={2}>
                      {messages.map((msg) => (
                        <Box key={msg.id} sx={{ display: "flex", justifyContent: msg.sender_type === "agent" ? "flex-end" : "flex-start" }}>
                          <Paper elevation={0} sx={{ p: 2, maxWidth: "80%", borderRadius: radius.md, bgcolor: msg.sender_type === "agent" ? `${semantic.info}08` : semantic.surface, border: `1px solid ${msg.sender_type === "agent" ? `${semantic.info}20` : semantic.border}` }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: msg.sender_type === "agent" ? semantic.info : semantic.text }}>
                                {msg.sender_name}
                              </Typography>
                              <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary }}>
                                {formatTime(msg.created_at)}
                              </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: "0.8rem", color: semantic.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                              {msg.content}
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {detailTab === 1 && (
                    <Stack spacing={1.5}>
                      {notes.length === 0 ? (
                        <Typography sx={{ fontSize: "0.8rem", color: semantic.textTertiary, textAlign: "center", py: 3 }}>No internal notes yet.</Typography>
                      ) : (
                        notes.map((note) => (
                          <Paper key={note.id} elevation={0} sx={{ p: 2, borderRadius: radius.sm, bgcolor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#92400E" }}>{note.author}</Typography>
                              <Typography sx={{ fontSize: "0.6rem", color: "#B45309" }}>{formatTime(note.created_at)}</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: "0.78rem", color: "#78350F", lineHeight: 1.5 }}>{note.content}</Typography>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  )}

                  {detailTab === 2 && (
                    <Stack spacing={0}>
                      {timeline.length === 0 ? (
                        <Typography sx={{ fontSize: "0.8rem", color: semantic.textTertiary, textAlign: "center", py: 3 }}>No activity recorded yet.</Typography>
                      ) : (
                        timeline.map((event, i) => (
                          <Stack key={i} direction="row" spacing={1.5} sx={{ py: 1.5, borderLeft: i < timeline.length - 1 ? `2px solid ${semantic.border}` : "2px solid transparent", ml: 1, pl: 2, position: "relative" }}>
                            <Box sx={{ position: "absolute", left: -7, top: 14, width: 14, height: 14, borderRadius: "50%", bgcolor: semantic.paper, border: `2px solid ${semantic.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem" }}>
                              {TIMELINE_ICONS[event.type] || "📌"}
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: semantic.text }}>{event.title}</Typography>
                              {event.subtitle && <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary }}>{event.subtitle}</Typography>}
                              <Typography sx={{ fontSize: "0.6rem", color: semantic.textDisabled, mt: 0.25 }}>{formatTime(event.timestamp)}</Typography>
                            </Box>
                          </Stack>
                        ))
                      )}
                    </Stack>
                  )}
                </Box>

                {/* Reply / Note Input */}
                {detailTab === 0 && selectedTicket.status !== "closed" && (
                  <Box sx={{ p: 2, borderTop: `1px solid ${semantic.border}` }}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                        InputProps={{ sx: { fontSize: "0.82rem", borderRadius: radius.sm } }}
                      />
                      <Button variant="contained" size="small" onClick={handleReply} disabled={!replyText.trim()} sx={{ minWidth: 40, borderRadius: radius.sm }}>
                        <Send sx={{ fontSize: 16 }} />
                      </Button>
                    </Stack>
                  </Box>
                )}
                {detailTab === 1 && (
                  <Box sx={{ p: 2, borderTop: `1px solid ${semantic.border}` }}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Add internal note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                        InputProps={{ sx: { fontSize: "0.82rem", borderRadius: radius.sm } }}
                      />
                      <Button variant="contained" size="small" color="warning" onClick={handleAddNote} disabled={!noteText.trim()} sx={{ minWidth: 40, borderRadius: radius.sm }}>
                        <StickyNote2 sx={{ fontSize: 16 }} />
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Box>

              {/* Customer Context Sidebar */}
              {customerCtx && (
                <Box sx={{ width: 240, borderLeft: `1px solid ${semantic.border}`, overflowY: "auto", p: 2, display: { xs: "none", lg: "block" } }}>
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: semantic.textTertiary, mb: 1.5 }}>
                    Customer
                  </Typography>
                  <Stack spacing={0.75} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: `${semantic.info}20`, color: semantic.info, fontWeight: 700 }}>
                      {customerCtx.full_name.charAt(0)}
                    </Avatar>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: semantic.text, textAlign: "center" }}>{customerCtx.full_name}</Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary }}>{customerCtx.farm_name}</Typography>
                  </Stack>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    <CtxRow label="Plan" value={customerCtx.subscription} />
                    <CtxRow label="Status" value={customerCtx.subscription_status} />
                    <CtxRow label="Province" value={customerCtx.province} />
                    <CtxRow label="Member Since" value={new Date(customerCtx.member_since).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })} />
                    <CtxRow label="Last Login" value={formatTime(customerCtx.last_login)} />
                    <Divider />
                    <CtxRow label="Livestock" value={customerCtx.livestock_count} />
                    <CtxRow label="Crops" value={customerCtx.crop_count} />
                    <CtxRow label="Tasks" value={customerCtx.planner_tasks} />
                    <CtxRow label="Finance" value={customerCtx.finance_records} />
                    <Divider />
                    <CtxRow label="Health Score" value={`${customerCtx.health_score}%`} />
                  </Stack>
                </Box>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Stack alignItems="center" spacing={1}>
              <Schedule sx={{ fontSize: 48, color: semantic.textDisabled }} />
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: semantic.textSecondary }}>
                Select a ticket to view
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: semantic.textTertiary }}>
                Choose from the list on the left
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Helper Components ──────────────────────────────────────

function CtxRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography sx={{ fontSize: "0.65rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.text }}>{value ?? "—"}</Typography>
    </Stack>
  );
}
