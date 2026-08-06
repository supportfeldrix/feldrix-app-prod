/**
 * ============================================================
 * Feldrix — Farmer Support Ticket Service
 * Version 2.0
 *
 * Full two-way conversation support:
 *   - Create tickets
 *   - List farmer's tickets with unread counts
 *   - Load conversation messages
 *   - Send replies
 *   - Mark messages as read
 *
 * Designed for future email injection (messages from email
 * providers can be inserted into the same conversation).
 * ============================================================
 */

import { supabase } from "./supabase";
import { getCurrentUser, getProfile } from "./profileService";

/**
 * Generate a unique ticket number (FDX-XXXX format).
 */
function generateTicketNumber() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `FDX-${num}`;
}

/**
 * Create a support ticket from the Farmer Application.
 */
export async function createSupportTicket({ subject, category, message }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be logged in to submit a support request.");

  const profile = await getProfile().catch(() => null);
  const ticketNumber = generateTicketNumber();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert([{
      ticket_number: ticketNumber,
      customer_id: user.id,
      customer_name: profile?.full_name || user.user_metadata?.full_name || user.email,
      customer_email: user.email,
      farm_name: profile?.farm_name || "",
      subject,
      category,
      priority: "medium",
      status: "open",
      source: "farmer_app",
      created_by: user.id,
    }])
    .select()
    .single();

  if (ticketError) throw ticketError;

  // Insert the initial message
  if (message && ticket) {
    await supabase
      .from("ticket_messages")
      .insert([{
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_type: "customer",
        content: message,
      }]);
  }

  // Mark as read by the farmer (they just created it)
  await markTicketRead(ticket.id);

  return ticket;
}

/**
 * Get the current user's support tickets with unread counts.
 */
export async function getMyTickets() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("customer_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load tickets:", error);
    return [];
  }

  // Get read status for unread calculation
  const { data: readStatuses } = await supabase
    .from("ticket_read_status")
    .select("ticket_id, last_read_at")
    .eq("user_id", user.id);

  const readMap = new Map((readStatuses || []).map((r) => [r.ticket_id, r.last_read_at]));

  // Get message counts per ticket for unread calculation
  const enriched = await Promise.all(
    (tickets || []).map(async (ticket) => {
      const lastRead = readMap.get(ticket.id);

      let unreadCount = 0;
      if (lastRead) {
        const { count } = await supabase
          .from("ticket_messages")
          .select("*", { count: "exact", head: true })
          .eq("ticket_id", ticket.id)
          .eq("sender_type", "agent")
          .gt("created_at", lastRead);
        unreadCount = count || 0;
      } else {
        // Never read — count all agent messages as unread
        const { count } = await supabase
          .from("ticket_messages")
          .select("*", { count: "exact", head: true })
          .eq("ticket_id", ticket.id)
          .eq("sender_type", "agent");
        unreadCount = count || 0;
      }

      return { ...ticket, unread_count: unreadCount };
    })
  );

  return enriched;
}

/**
 * Get total unread reply count across all farmer's tickets.
 */
export async function getTotalUnreadCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  try {
    const tickets = await getMyTickets();
    return tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Get messages for a specific ticket.
 */
export async function getTicketMessages(ticketId) {
  const { data, error } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load messages:", error);
    return [];
  }

  return (data || []).map((m) => ({
    id: m.id,
    sender_type: m.sender_type,
    sender_name: m.sender_type === "customer" ? "You" : "Support Team",
    content: m.content,
    created_at: m.created_at,
  }));
}

/**
 * Send a reply from the farmer.
 */
export async function sendReply(ticketId, content) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be logged in to reply.");

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert([{
      ticket_id: ticketId,
      sender_id: user.id,
      sender_type: "customer",
      content,
    }])
    .select()
    .single();

  if (error) throw error;

  // Update ticket updated_at
  await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  // Mark as read (farmer just wrote)
  await markTicketRead(ticketId);

  return data;
}

/**
 * Mark a ticket as read (updates the last_read_at timestamp).
 */
export async function markTicketRead(ticketId) {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase
    .from("ticket_read_status")
    .upsert({
      ticket_id: ticketId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    }, { onConflict: "ticket_id,user_id" });
}
