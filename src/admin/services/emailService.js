/**
 * ============================================================
 * Feldrix Customer Success Centre — Email Service
 * Version 2.0
 *
 * Reads emails from the imported_emails table (populated by
 * the email-sync Edge Function via IMAP).
 *
 * Provider-agnostic — the Edge Function handles IMAP specifics.
 * This service only reads from Supabase.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

// ─── Email Sync (triggers Edge Function) ────────────────────

/**
 * Trigger the email-sync Edge Function to fetch new emails from IMAP.
 */
export async function syncMailbox() {
  const { data, error } = await supabase.functions.invoke("email-sync", {
    method: "POST",
  });

  if (error) {
    throw new Error(error.message || "Mailbox sync failed.");
  }

  return data;
}

// ─── Read Emails from Database ──────────────────────────────

/**
 * Get emails with optional folder filter and search.
 */
export async function getEmails({ folder = "inbox", search = "", unreadOnly = false } = {}) {
  let query = supabase
    .from("imported_emails")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(100);

  if (folder !== "unread") {
    query = query.eq("folder", folder);
  }

  if (unreadOnly || folder === "unread") {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load emails:", error);
    return [];
  }

  let emails = data || [];

  // Client-side search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    emails = emails.filter(
      (e) =>
        (e.subject || "").toLowerCase().includes(q) ||
        (e.sender_name || "").toLowerCase().includes(q) ||
        (e.sender_email || "").toLowerCase().includes(q) ||
        (e.preview || "").toLowerCase().includes(q)
    );
  }

  return emails.map(mapEmail);
}

/**
 * Get a single email by ID.
 */
export async function getEmailById(id) {
  const { data, error } = await supabase
    .from("imported_emails")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data ? mapEmail(data) : null;
}

/**
 * Get email folder counts.
 */
export async function getEmailCounts() {
  const { count: inbox } = await supabase
    .from("imported_emails")
    .select("*", { count: "exact", head: true })
    .eq("folder", "inbox");

  const { count: unread } = await supabase
    .from("imported_emails")
    .select("*", { count: "exact", head: true })
    .eq("folder", "inbox")
    .eq("is_read", false);

  const { count: sent } = await supabase
    .from("imported_emails")
    .select("*", { count: "exact", head: true })
    .eq("folder", "sent");

  const { count: archive } = await supabase
    .from("imported_emails")
    .select("*", { count: "exact", head: true })
    .eq("folder", "archive");

  const { count: trash } = await supabase
    .from("imported_emails")
    .select("*", { count: "exact", head: true })
    .eq("folder", "trash");

  return {
    inbox: inbox || 0,
    unread: unread || 0,
    sent: sent || 0,
    archive: archive || 0,
    trash: trash || 0,
  };
}

/**
 * Mark email as read/unread (local database only — not on mail server).
 */
export async function markEmailRead(id, isRead = true) {
  const { data, error } = await supabase
    .from("imported_emails")
    .update({ is_read: isRead })
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data ? mapEmail(data) : null;
}

/**
 * Move email to folder (local database only — not on mail server).
 */
export async function moveEmail(id, folder) {
  const { data, error } = await supabase
    .from("imported_emails")
    .update({ folder })
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data ? mapEmail(data) : null;
}

/**
 * Star/unstar email (stores in local field).
 */
export async function toggleStarEmail(id) {
  // Fetch current state
  const { data: current } = await supabase
    .from("imported_emails")
    .select("is_read")
    .eq("id", id)
    .single();

  // Use is_read as star toggle placeholder (future: add is_starred column)
  // For now, this is a no-op visually — kept for interface compatibility
  return current;
}

// ─── Email ↔ Ticket Links ───────────────────────────────────

const EMAIL_TICKET_LINKS = new Map();

/**
 * Link an email to a ticket (prevents duplicate conversions).
 */
export function linkEmailToTicket(emailId, ticketNumber) {
  EMAIL_TICKET_LINKS.set(emailId, ticketNumber);
}

/**
 * Get the linked ticket number for an email (null if not converted).
 */
export function getLinkedTicket(emailId) {
  return EMAIL_TICKET_LINKS.get(emailId) || null;
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Map database row to the email shape expected by the UI.
 */
function mapEmail(row) {
  return {
    id: row.id,
    from_address: row.sender_email,
    from_name: row.sender_name || row.sender_email?.split("@")[0] || "Unknown",
    to_address: row.recipient || "support@feldrix.com",
    subject: row.subject || "(No Subject)",
    body_text: row.body_text || row.preview || "",
    body_html: row.body_html || null,
    folder: row.folder || "inbox",
    is_read: row.is_read || false,
    is_starred: false,
    priority: "normal",
    has_attachments: row.has_attachments || false,
    received_at: row.received_at || row.imported_at,
    customer_id: null, // Will be resolved via customer matching
  };
}


// ─── Email Sending (SMTP via Edge Function) ─────────────────

/**
 * Send a reply to an email via the email-send Edge Function.
 * Stores the sent email locally for immediate display.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject (pre-filled with Re: ...)
 * @param {string} params.text - Reply body
 * @param {string} [params.in_reply_to] - Message-ID of the original email
 * @param {string} [params.references] - References header for threading
 * @param {string} [params.original_email_id] - ID of the email being replied to
 * @returns {object} Sent email record
 */
export async function sendEmailReply({ to, subject, text, in_reply_to, references, original_email_id }) {
  // 1. Optimistic insert — store locally first
  const { data: sentRecord, error: insertError } = await supabase
    .from("sent_emails")
    .insert([{
      recipient: to,
      subject,
      body: text,
      in_reply_to: in_reply_to || null,
      references_header: references || null,
      original_email_id: original_email_id || null,
      sender_email: "support@feldrix.com",
      sender_name: "Feldrix Support",
      status: "pending",
    }])
    .select()
    .single();

  if (insertError) {
    throw new Error("Failed to create send record.");
  }

  // 2. Invoke the Edge Function to actually send via SMTP
  const { data, error } = await supabase.functions.invoke("email-send", {
    body: {
      to,
      subject,
      text,
      in_reply_to,
      references,
      sent_email_id: sentRecord.id,
    },
  });

  if (error || !data?.success) {
    // Update local record to failed status
    await supabase
      .from("sent_emails")
      .update({ status: "failed", smtp_response: data?.message || error?.message || "Unknown error" })
      .eq("id", sentRecord.id);

    throw new Error(data?.message || error?.message || "Unable to send email. Please try again.");
  }

  // 3. Update local record with success
  await supabase
    .from("sent_emails")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      message_id: data.message_id || null,
    })
    .eq("id", sentRecord.id);

  return { ...sentRecord, status: "sent", sent_at: new Date().toISOString(), message_id: data.message_id };
}

/**
 * Get sent replies for a specific original email (for conversation display).
 */
export async function getSentReplies(originalEmailId) {
  if (!originalEmailId) return [];

  const { data, error } = await supabase
    .from("sent_emails")
    .select("*")
    .eq("original_email_id", originalEmailId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data || [];
}

/**
 * Test SMTP connection by invoking the Edge Function with a test flag.
 * Returns connection status for diagnostics.
 */
export async function testSmtpConnection() {
  try {
    const { data, error } = await supabase.functions.invoke("email-send", {
      body: {
        to: "test@feldrix.com",
        subject: "__CONNECTION_TEST__",
        text: "test",
        _test: true,
      },
    });

    // The Edge Function will fail with a validation error or SMTP error
    // If it gets past authentication, the connection works
    if (error) {
      return { connected: false, message: error.message || "Connection failed." };
    }

    if (data?.success) {
      return { connected: true, message: "SMTP connection successful." };
    }

    return { connected: false, message: data?.message || "Connection test failed." };
  } catch (err) {
    return { connected: false, message: err?.message || "Unable to reach SMTP server." };
  }
}
