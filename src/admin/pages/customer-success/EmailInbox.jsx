/**
 * ============================================================
 * Feldrix Customer Success Centre — Email Inbox
 * Version 1.1
 *
 * Provider-agnostic email UI with folder navigation,
 * email list, detail view, and Convert to Ticket action.
 *
 * Workflow:
 *   - Convert to Ticket shows toast (no browser alert)
 *   - Auto-navigates to ticket after creation
 *   - Shows "Converted to Ticket #XXXX" badge on converted emails
 *   - Prevents duplicate ticket creation
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Stack, Divider, IconButton, TextField, Chip,
  List, ListItemButton, ListItemIcon, ListItemText, Badge, Paper,
  Button, Tooltip, InputAdornment, Skeleton, Avatar,
} from "@mui/material";
import {
  Inbox, MarkEmailUnread, Send, Archive, Delete, Search,
  Star, StarBorder, Reply, ReplyAll, Forward, ConfirmationNumber,
  MarkEmailRead, AttachFile, ArrowBack, Circle, OpenInNew,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { semantic, radius, shadows, transitions } from "../../../shared/design/tokens";
import { getEmails, getEmailCounts, markEmailRead, moveEmail, toggleStarEmail, linkEmailToTicket, getLinkedTicket } from "../../services/emailService";
import { createTicket } from "../../services/ticketService";
import { getCustomerContext } from "../../services/supportService";

// ─── Constants ──────────────────────────────────────────────

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: <Inbox sx={{ fontSize: 18 }} /> },
  { id: "unread", label: "Unread", icon: <MarkEmailUnread sx={{ fontSize: 18 }} /> },
  { id: "sent", label: "Sent", icon: <Send sx={{ fontSize: 18 }} /> },
  { id: "archive", label: "Archive", icon: <Archive sx={{ fontSize: 18 }} /> },
  { id: "trash", label: "Trash", icon: <Delete sx={{ fontSize: 18 }} /> },
];

const PRIORITY_COLORS = { urgent: semantic.error, high: "#F59E0B", normal: semantic.textSecondary, low: semantic.textTertiary };

// ─── Email Inbox Page ───────────────────────────────────────

export default function EmailInbox({ onTicketCreated }) {
  const [folder, setFolder] = useState("inbox");
  const [emails, setEmails] = useState([]);
  const [counts, setCounts] = useState({});
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerCtx, setCustomerCtx] = useState(null);
  const [converting, setConverting] = useState(false);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const isUnread = folder === "unread";
      const data = await getEmails({ folder: isUnread ? "inbox" : folder, search, unreadOnly: isUnread });
      setEmails(data);
      const c = await getEmailCounts();
      setCounts(c);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [folder, search]);

  useEffect(() => { loadEmails(); }, [loadEmails]);

  async function handleSelectEmail(email) {
    setSelectedEmail(email);
    if (!email.is_read) {
      await markEmailRead(email.id, true);
      loadEmails();
    }
    if (email.customer_id) {
      const ctx = await getCustomerContext(email.customer_id);
      setCustomerCtx(ctx);
    } else {
      setCustomerCtx(null);
    }
  }

  async function handleStar(e, email) {
    e.stopPropagation();
    await toggleStarEmail(email.id);
    loadEmails();
  }

  async function handleArchive() {
    if (!selectedEmail) return;
    await moveEmail(selectedEmail.id, "archive");
    setSelectedEmail(null);
    loadEmails();
  }

  async function handleDelete() {
    if (!selectedEmail) return;
    await moveEmail(selectedEmail.id, "trash");
    setSelectedEmail(null);
    loadEmails();
  }

  async function handleMarkUnread() {
    if (!selectedEmail) return;
    await markEmailRead(selectedEmail.id, false);
    setSelectedEmail(null);
    loadEmails();
  }

  async function handleConvertToTicket() {
    if (!selectedEmail) return;

    // Prevent duplicate: if already converted, navigate to existing ticket
    const existingTicket = getLinkedTicket(selectedEmail.id);
    if (existingTicket) {
      toast(`This email is already linked to Ticket ${existingTicket}`, { icon: "🎫" });
      if (onTicketCreated) onTicketCreated(existingTicket);
      return;
    }

    setConverting(true);
    try {
      const ticket = await createTicket({
        customer_name: selectedEmail.from_name || selectedEmail.from_address,
        customer_email: selectedEmail.from_address,
        subject: selectedEmail.subject,
        content: selectedEmail.body_text,
        priority: selectedEmail.priority === "urgent" ? "urgent" : selectedEmail.priority === "high" ? "high" : "medium",
        email_id: selectedEmail.id,
      });

      // Link email to ticket for deduplication
      linkEmailToTicket(selectedEmail.id, ticket.ticket_number);

      // Toast notification
      toast.success(`Support Ticket ${ticket.ticket_number} created successfully.`);

      // Navigate to the new ticket
      if (onTicketCreated) onTicketCreated(ticket.id);
    } catch (err) {
      toast.error("Failed to create ticket. Please try again.");
    } finally {
      setConverting(false);
    }
  }

  function handleViewLinkedTicket() {
    if (!selectedEmail) return;
    const ticketNumber = getLinkedTicket(selectedEmail.id);
    if (ticketNumber && onTicketCreated) {
      onTicketCreated(ticketNumber);
    }
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < 604800000) {
      return d.toLocaleDateString("en-ZA", { weekday: "short" });
    }
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  }

  // Check if current email has a linked ticket
  const linkedTicket = selectedEmail ? getLinkedTicket(selectedEmail.id) : null;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 80px)", overflow: "hidden", borderRadius: radius.lg, border: `1px solid ${semantic.border}`, bgcolor: semantic.paper }}>
      {/* Left Sidebar — Folders */}
      <Box sx={{ width: 200, borderRight: `1px solid ${semantic.border}`, flexShrink: 0, py: 2, display: { xs: "none", md: "block" } }}>
        <Typography sx={{ px: 2, mb: 1.5, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: semantic.textTertiary }}>
          Folders
        </Typography>
        <List disablePadding dense>
          {FOLDERS.map((f) => (
            <ListItemButton
              key={f.id}
              selected={folder === f.id}
              onClick={() => { setFolder(f.id); setSelectedEmail(null); }}
              sx={{ px: 2, py: 1, mx: 1, borderRadius: radius.sm, "&.Mui-selected": { bgcolor: `${semantic.info}10`, color: semantic.info } }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>{f.icon}</ListItemIcon>
              <ListItemText primary={f.label} primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: folder === f.id ? 700 : 500 }} />
              {f.id === "inbox" && counts.unread > 0 && (
                <Badge badgeContent={counts.unread} color="error" sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", height: 16, minWidth: 16 } }} />
              )}
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Email List */}
      <Box sx={{ width: { xs: selectedEmail ? 0 : "100%", md: 360 }, borderRight: `1px solid ${semantic.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, transition: "width 0.2s" }}>
        {/* Search */}
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${semantic.border}` }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: semantic.textTertiary }} /></InputAdornment>,
              sx: { fontSize: "0.82rem", borderRadius: radius.sm },
            }}
          />
        </Box>

        {/* List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <Stack spacing={0} sx={{ p: 1 }}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: radius.sm, mb: 0.5 }} />)}
            </Stack>
          ) : emails.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">No emails in this folder.</Typography>
            </Box>
          ) : (
            emails.map((email) => {
              const emailLinked = getLinkedTicket(email.id);
              return (
                <Box
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  sx={{
                    px: 2, py: 1.5, cursor: "pointer",
                    bgcolor: selectedEmail?.id === email.id ? `${semantic.info}08` : email.is_read ? "transparent" : `${semantic.info}04`,
                    borderBottom: `1px solid ${semantic.border}`,
                    transition: transitions.fast,
                    "&:hover": { bgcolor: `${semantic.info}06` },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {!email.is_read && <Circle sx={{ fontSize: 8, color: semantic.info, mt: 0.8, flexShrink: 0 }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: email.is_read ? 500 : 700, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {email.from_name || email.from_address}
                        </Typography>
                        <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary, flexShrink: 0, ml: 1 }}>
                          {formatTime(email.received_at)}
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: email.is_read ? 400 : 600, color: semantic.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mt: 0.25 }}>
                        {email.subject}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        {emailLinked ? (
                          <Chip
                            label={`Ticket ${emailLinked}`}
                            size="small"
                            icon={<ConfirmationNumber sx={{ fontSize: 10 }} />}
                            sx={{ height: 16, fontSize: "0.55rem", fontWeight: 600, bgcolor: `${semantic.success}12`, color: semantic.success }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: "0.68rem", color: semantic.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {email.body_text?.slice(0, 80)}...
                          </Typography>
                        )}
                        {email.has_attachments && <AttachFile sx={{ fontSize: 12, color: semantic.textTertiary }} />}
                        {email.priority !== "normal" && <Circle sx={{ fontSize: 6, color: PRIORITY_COLORS[email.priority] }} />}
                      </Stack>
                    </Box>
                    <IconButton size="small" onClick={(e) => handleStar(e, email)} sx={{ mt: -0.5 }}>
                      {email.is_starred ? <Star sx={{ fontSize: 16, color: "#F59E0B" }} /> : <StarBorder sx={{ fontSize: 16, color: semantic.textTertiary }} />}
                    </IconButton>
                  </Stack>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Email Detail */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedEmail ? (
          <>
            {/* Toolbar */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${semantic.border}` }}>
              <IconButton size="small" onClick={() => setSelectedEmail(null)} sx={{ display: { md: "none" } }}>
                <ArrowBack sx={{ fontSize: 18 }} />
              </IconButton>
              <Tooltip title="Reply"><IconButton size="small"><Reply sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Tooltip title="Reply All"><IconButton size="small"><ReplyAll sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Tooltip title="Forward"><IconButton size="small"><Forward sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Tooltip title="Archive"><IconButton size="small" onClick={handleArchive}><Archive sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" onClick={handleDelete}><Delete sx={{ fontSize: 18, color: semantic.error }} /></IconButton></Tooltip>
              <Tooltip title="Mark Unread"><IconButton size="small" onClick={handleMarkUnread}><MarkEmailUnread sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Box sx={{ flex: 1 }} />

              {/* Convert to Ticket OR View Linked Ticket */}
              {linkedTicket ? (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                  onClick={handleViewLinkedTicket}
                  sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 600, borderRadius: radius.sm }}
                >
                  View Ticket {linkedTicket}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ConfirmationNumber sx={{ fontSize: 14 }} />}
                  onClick={handleConvertToTicket}
                  disabled={converting}
                  sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 600, borderRadius: radius.sm }}
                >
                  {converting ? "Creating..." : "Convert to Ticket"}
                </Button>
              )}
            </Stack>

            {/* Converted Badge */}
            {linkedTicket && (
              <Box sx={{ px: 3, py: 1, bgcolor: `${semantic.success}08`, borderBottom: `1px solid ${semantic.success}20` }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ConfirmationNumber sx={{ fontSize: 14, color: semantic.success }} />
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: semantic.success }}>
                    Converted to Ticket {linkedTicket}
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* Email Content */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text, mb: 1 }}>
                {selectedEmail.subject}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: `${semantic.info}20`, color: semantic.info, fontSize: "0.85rem", fontWeight: 700 }}>
                  {(selectedEmail.from_name || "?").charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: semantic.text }}>
                    {selectedEmail.from_name || selectedEmail.from_address}
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: semantic.textTertiary }}>
                    {selectedEmail.from_address} &middot; {new Date(selectedEmail.received_at).toLocaleString("en-ZA")}
                  </Typography>
                </Box>
                {selectedEmail.priority !== "normal" && (
                  <Chip
                    label={selectedEmail.priority}
                    size="small"
                    sx={{ height: 20, fontSize: "0.6rem", fontWeight: 600, bgcolor: `${PRIORITY_COLORS[selectedEmail.priority]}15`, color: PRIORITY_COLORS[selectedEmail.priority] }}
                  />
                )}
              </Stack>

              <Paper elevation={0} sx={{ p: 3, borderRadius: radius.md, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
                <Typography sx={{ fontSize: "0.85rem", color: semantic.text, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {selectedEmail.body_text}
                </Typography>
              </Paper>

              {/* Customer Context (if available) */}
              {customerCtx && (
                <Paper elevation={0} sx={{ mt: 3, p: 2.5, borderRadius: radius.md, border: `1px solid ${semantic.border}` }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: semantic.textTertiary, mb: 1.5 }}>
                    Customer Context
                  </Typography>
                  <Stack spacing={1}>
                    <ContextRow label="Name" value={customerCtx.full_name} />
                    <ContextRow label="Farm" value={customerCtx.farm_name} />
                    <ContextRow label="Plan" value={customerCtx.subscription} />
                    <ContextRow label="Province" value={customerCtx.province} />
                    <ContextRow label="Livestock" value={customerCtx.livestock_count} />
                    <ContextRow label="Crops" value={customerCtx.crop_count} />
                    <ContextRow label="Health Score" value={`${customerCtx.health_score}%`} />
                  </Stack>
                </Paper>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Stack alignItems="center" spacing={1}>
              <Inbox sx={{ fontSize: 48, color: semantic.textDisabled }} />
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: semantic.textSecondary }}>
                Select an email to read
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

function ContextRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography sx={{ fontSize: "0.72rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: semantic.text }}>{value ?? "—"}</Typography>
    </Stack>
  );
}
