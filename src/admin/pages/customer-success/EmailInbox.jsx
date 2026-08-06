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
  MarkEmailRead, AttachFile, ArrowBack, Circle, OpenInNew, Refresh,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { semantic, radius, shadows, transitions } from "../../../shared/design/tokens";
import { getEmails, getEmailCounts, markEmailRead, moveEmail, toggleStarEmail, linkEmailToTicket, getLinkedTicket, syncMailbox, sendEmailReply, getSentReplies } from "../../services/emailService";
import { createTicket } from "../../services/ticketService";
import { getCustomerContext, matchCustomerByEmail } from "../../services/supportService";

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
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentReplies, setSentReplies] = useState([]);

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

  async function handleSync() {
    setSyncing(true);
    setSyncError("");
    try {
      await syncMailbox();
      toast.success("Mailbox synchronized successfully.");
      await loadEmails();
    } catch (err) {
      const msg = err?.message || "Unable to connect to the support mailbox.";
      setSyncError(msg);
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedEmail) return;
    setSending(true);
    try {
      const subject = selectedEmail.subject.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`;
      const sent = await sendEmailReply({
        to: selectedEmail.from_address,
        subject,
        text: replyText.trim(),
        in_reply_to: selectedEmail.message_id || null,
        references: selectedEmail.message_id || null,
        original_email_id: selectedEmail.id,
      });
      toast.success("Reply sent successfully.");
      setReplyText("");
      setShowReply(false);
      // Append to local conversation immediately
      setSentReplies((prev) => [...prev, sent]);
    } catch (err) {
      toast.error(err?.message || "Unable to send email. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleSelectEmail(email) {
    setSelectedEmail(email);
    setShowReply(false);
    setReplyText("");
    if (!email.is_read) {
      await markEmailRead(email.id, true);
      loadEmails();
    }
    // Load sent replies for conversation display
    const replies = await getSentReplies(email.id);
    setSentReplies(replies);
    // Customer matching: try customer_id first, then match by sender email
    if (email.customer_id) {
      const ctx = await getCustomerContext(email.customer_id);
      setCustomerCtx(ctx);
    } else if (email.from_address) {
      const ctx = await matchCustomerByEmail(email.from_address);
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
        <Box sx={{ px: 2, mt: 2 }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 14 }} />}
            onClick={handleSync}
            disabled={syncing}
            sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 600, borderRadius: radius.sm }}
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
        </Box>
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
              {syncError ? (
                <>
                  <Typography variant="body2" color="error.main" fontWeight={600} sx={{ mb: 1 }}>
                    {syncError}
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 14 }} />} onClick={handleSync} disabled={syncing} sx={{ textTransform: "none", fontSize: "0.72rem" }}>
                    Retry
                  </Button>
                </>
              ) : (
                <>
                  <Inbox sx={{ fontSize: 32, color: semantic.textDisabled, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No emails have been received yet.</Typography>
                  <Button size="small" sx={{ mt: 1, textTransform: "none", fontSize: "0.72rem" }} onClick={handleSync} disabled={syncing} startIcon={<Refresh sx={{ fontSize: 14 }} />}>
                    Sync Mailbox
                  </Button>
                </>
              )}
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
              <Tooltip title="Reply"><IconButton size="small" onClick={() => setShowReply(!showReply)}><Reply sx={{ fontSize: 18, color: showReply ? semantic.info : undefined }} /></IconButton></Tooltip>
              <Tooltip title="Reply All (coming soon)"><span><IconButton size="small" disabled><ReplyAll sx={{ fontSize: 18 }} /></IconButton></span></Tooltip>
              <Tooltip title="Forward (coming soon)"><span><IconButton size="small" disabled><Forward sx={{ fontSize: 18 }} /></IconButton></span></Tooltip>
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

              {/* Sent Replies — Conversation Thread */}
              {sentReplies.length > 0 && (
                <Stack spacing={2} sx={{ mt: 3 }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: semantic.textTertiary }}>
                    Replies ({sentReplies.length})
                  </Typography>
                  {sentReplies.map((reply) => (
                    <Paper key={reply.id} elevation={0} sx={{ p: 2.5, borderRadius: radius.md, bgcolor: `${semantic.info}06`, border: `1px solid ${semantic.info}20` }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: semantic.info, fontSize: "0.6rem", fontWeight: 700 }}>F</Avatar>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: semantic.info }}>Feldrix Support</Typography>
                        <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary }}>{reply.sent_at ? new Date(reply.sent_at).toLocaleString("en-ZA") : "Pending..."}</Typography>
                        <Chip label={reply.status === "sent" ? "Sent" : reply.status === "failed" ? "Failed" : "Sending..."} size="small" sx={{ height: 16, fontSize: "0.5rem", fontWeight: 600, bgcolor: reply.status === "sent" ? `${semantic.success}12` : reply.status === "failed" ? `${semantic.error}12` : `${semantic.warning}12`, color: reply.status === "sent" ? semantic.success : reply.status === "failed" ? semantic.error : semantic.warning }} />
                      </Stack>
                      <Typography sx={{ fontSize: "0.82rem", color: semantic.text, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {reply.body}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Reply Composer */}
              {showReply && (
                <Paper elevation={0} sx={{ mt: 3, p: 2.5, borderRadius: radius.md, border: `1px solid ${semantic.info}40`, bgcolor: `${semantic.info}04` }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textTertiary, mb: 0.5 }}>From</Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: semantic.text }}>support@feldrix.com</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textTertiary, mb: 0.5 }}>To</Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: semantic.text }}>{selectedEmail.from_address}</Typography>
                      </Box>
                    </Stack>
                    <Box>
                      <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textTertiary, mb: 0.5 }}>Subject</Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: semantic.text }}>
                        {selectedEmail.subject.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      size="small"
                      InputProps={{ sx: { fontSize: "0.82rem", borderRadius: radius.sm } }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => { setShowReply(false); }} sx={{ textTransform: "none", fontSize: "0.72rem" }}>
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Send sx={{ fontSize: 14 }} />}
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sending}
                        sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 600, borderRadius: radius.sm }}
                      >
                        {sending ? "Sending..." : "Send Reply"}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

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
