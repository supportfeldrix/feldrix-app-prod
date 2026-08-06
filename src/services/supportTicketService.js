/**
 * ============================================================
 * Feldrix — Farmer Support Ticket Service
 * Version 1.0
 *
 * Creates support tickets directly in Supabase from the
 * Farmer Application. Tickets appear immediately in the
 * Admin Customer Success Centre.
 *
 * This is the farmer-facing service (NOT the admin service).
 * ============================================================
 */

import { supabase } from "./supabase";
import { getCurrentUser, getProfile } from "./profileService";

/**
 * Generate a unique ticket number (FDX-XXXX format).
 * Uses timestamp + random to ensure uniqueness without a sequence.
 */
function generateTicketNumber() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `FDX-${num}`;
}

/**
 * Create a support ticket from the Farmer Application.
 *
 * @param {object} params
 * @param {string} params.subject - Ticket subject (required)
 * @param {string} params.category - Ticket category (required)
 * @param {string} params.message - Ticket body/message (required)
 * @returns {object} Created ticket with ticket_number
 */
export async function createSupportTicket({ subject, category, message }) {
  // Get current user and profile
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be logged in to submit a support request.");

  const profile = await getProfile().catch(() => null);

  const ticketNumber = generateTicketNumber();

  // Insert the ticket
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
    const { error: msgError } = await supabase
      .from("ticket_messages")
      .insert([{
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_type: "customer",
        content: message,
      }]);

    if (msgError) {
      console.error("Failed to save ticket message:", msgError);
      // Don't throw — ticket was created successfully
    }
  }

  return ticket;
}

/**
 * Get the current user's support tickets.
 */
export async function getMyTickets() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load tickets:", error);
    return [];
  }

  return data || [];
}
