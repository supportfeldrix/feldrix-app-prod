/**
 * ============================================================
 * Feldrix Customer Success Centre — Ticket Service
 * Version 1.1
 *
 * Manages support tickets, messages, notes, assignments.
 * Reads from BOTH mock data and Supabase (farmer-created tickets).
 * ============================================================
 */

import { supabase } from "../../supabaseClient";

// ─── Supabase Integration ───────────────────────────────────

/**
 * Fetch real tickets from Supabase (created by farmers).
 */
async function fetchSupabaseTickets() {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];

    return (data || []).map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      customer_id: t.customer_id,
      customer_name: t.customer_name || "Unknown",
      customer_email: t.customer_email || "",
      farm_name: t.farm_name || "",
      subject: t.subject,
      priority: t.priority || "medium",
      status: t.status || "open",
      assigned_to: t.assigned_to || null,
      created_at: t.created_at,
      updated_at: t.updated_at || t.created_at,
      resolved_at: t.resolved_at || null,
      closed_at: t.closed_at || null,
      tags: t.tags || [],
      source: t.source || "farmer_app",
      category: t.category || null,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch real messages for a ticket from Supabase.
 */
async function fetchSupabaseMessages(ticketId) {
  try {
    const { data, error } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) return null;

    return (data || []).map((m) => ({
      id: m.id,
      sender_type: m.sender_type,
      sender_name: m.sender_type === "customer" ? "Customer" : "Support Agent",
      content: m.content,
      created_at: m.created_at,
    }));
  } catch {
    return null;
  }
}

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_TICKETS = [
  {
    id: "tkt-001",
    ticket_number: "FDX-1001",
    customer_id: "usr-004",
    customer_name: "Thandi Nkosi",
    customer_email: "thandi.nkosi@icloud.com",
    farm_name: "Nkosi Poultry Farm",
    subject: "Reports page crashes with white screen",
    priority: "urgent",
    status: "assigned",
    assigned_to: "Admin",
    created_at: "2026-08-06T09:10:00Z",
    updated_at: "2026-08-06T10:30:00Z",
    tags: ["bug", "reports"],
  },
  {
    id: "tkt-002",
    ticket_number: "FDX-1002",
    customer_id: "usr-001",
    customer_name: "Jan van der Merwe",
    customer_email: "jan.vandermerwe@gmail.com",
    farm_name: "Bosveld Boerdery",
    subject: "Animal limit reached on Pro plan",
    priority: "high",
    status: "open",
    assigned_to: null,
    created_at: "2026-08-06T08:20:00Z",
    updated_at: "2026-08-06T08:20:00Z",
    tags: ["billing", "limits"],
  },
  {
    id: "tkt-003",
    ticket_number: "FDX-1003",
    customer_id: "usr-006",
    customer_name: "Willem Pretorius",
    customer_email: "willem.pretorius@telkomsa.net",
    farm_name: "Pretorius Brahman Stud",
    subject: "Breeding records missing after update",
    priority: "urgent",
    status: "open",
    assigned_to: null,
    created_at: "2026-08-06T06:35:00Z",
    updated_at: "2026-08-06T06:35:00Z",
    tags: ["data-loss", "breeding"],
  },
  {
    id: "tkt-004",
    ticket_number: "FDX-1004",
    customer_id: "usr-002",
    customer_name: "Maria Botha",
    customer_email: "maria.botha@outlook.com",
    farm_name: "Ceres Valley Wines",
    subject: "Weather location not updating",
    priority: "medium",
    status: "waiting_customer",
    assigned_to: "Admin",
    created_at: "2026-08-05T14:00:00Z",
    updated_at: "2026-08-06T07:50:00Z",
    tags: ["weather", "settings"],
  },
  {
    id: "tkt-005",
    ticket_number: "FDX-1005",
    customer_id: "usr-003",
    customer_name: "Pieter du Plessis",
    customer_email: "pieter.du.plessis@farmmail.co.za",
    farm_name: "Du Plessis Dairy",
    subject: "Invoice request for July",
    priority: "low",
    status: "resolved",
    assigned_to: "Admin",
    created_at: "2026-08-05T16:35:00Z",
    updated_at: "2026-08-06T09:00:00Z",
    resolved_at: "2026-08-06T09:00:00Z",
    tags: ["billing", "invoice"],
  },
  {
    id: "tkt-006",
    ticket_number: "FDX-1006",
    customer_id: "usr-005",
    customer_name: "Henk Joubert",
    customer_email: "henk.joubert@vodamail.co.za",
    farm_name: "Joubert Mixed Farm",
    subject: "How to upgrade subscription",
    priority: "low",
    status: "closed",
    assigned_to: "Admin",
    created_at: "2026-08-05T11:25:00Z",
    updated_at: "2026-08-05T11:50:00Z",
    closed_at: "2026-08-05T11:50:00Z",
    tags: ["billing", "upgrade"],
  },
];

const MOCK_MESSAGES = {
  "tkt-001": [
    { id: "msg-001", sender_type: "customer", sender_name: "Thandi Nkosi", content: "Every time I try to open the Reports page, I get a white screen. This has been happening since yesterday. I'm using Chrome on my laptop. Please help, I need to generate my monthly report.", created_at: "2026-08-06T09:10:00Z" },
    { id: "msg-002", sender_type: "agent", sender_name: "Admin", content: "Hi Thandi, thank you for reporting this. I can see the issue in our logs — it appears to be related to a recent update. I'm investigating now and will have a fix ready shortly. In the meantime, could you try clearing your browser cache?", created_at: "2026-08-06T10:30:00Z" },
  ],
  "tkt-002": [
    { id: "msg-003", sender_type: "customer", sender_name: "Jan van der Merwe", content: "I'm on the Pro plan but getting an error when I try to add my 51st animal. The system says I've reached my limit. Can you please look into this?", created_at: "2026-08-06T08:20:00Z" },
  ],
  "tkt-003": [
    { id: "msg-004", sender_type: "customer", sender_name: "Willem Pretorius", content: "My breeding records from last month are all gone. I had about 12 entries and now the page is empty. This is very concerning as I need those records for my stud book.", created_at: "2026-08-06T06:35:00Z" },
  ],
  "tkt-004": [
    { id: "msg-005", sender_type: "customer", sender_name: "Maria Botha", content: "I changed my weather location to Ceres but it still shows Johannesburg weather. I've tried logging out and back in but it doesn't help.", created_at: "2026-08-05T14:00:00Z" },
    { id: "msg-006", sender_type: "agent", sender_name: "Admin", content: "Hi Maria, thanks for letting us know. We've released an update that fixes the weather location feature. Could you please try selecting Ceres from the dropdown in Account > Farm Information and let me know if it works now?", created_at: "2026-08-06T07:50:00Z" },
  ],
  "tkt-005": [
    { id: "msg-007", sender_type: "customer", sender_name: "Pieter du Plessis", content: "I haven't received my invoice for July yet. My accountant needs it for the VAT submission.", created_at: "2026-08-05T16:35:00Z" },
    { id: "msg-008", sender_type: "agent", sender_name: "Admin", content: "Hi Pieter, I've generated and sent your July invoice to pieter.du.plessis@farmmail.co.za. Please check your inbox. Let me know if you need anything else.", created_at: "2026-08-06T09:00:00Z" },
  ],
  "tkt-006": [
    { id: "msg-009", sender_type: "customer", sender_name: "Henk Joubert", content: "How do I upgrade to Pro? I can't find the upgrade button anywhere.", created_at: "2026-08-05T11:25:00Z" },
    { id: "msg-010", sender_type: "agent", sender_name: "Admin", content: "Hi Henk! You can upgrade by going to Account > Subscription and clicking 'Upgrade to Pro'. Let me know if you need anything else.", created_at: "2026-08-05T11:45:00Z" },
    { id: "msg-011", sender_type: "customer", sender_name: "Henk Joubert", content: "Found it, thanks! All sorted.", created_at: "2026-08-05T11:50:00Z" },
  ],
};

const MOCK_NOTES = {
  "tkt-001": [
    { id: "note-001", author: "Admin", content: "Checked error logs — seems related to the recharts library update. Need to verify the data shape.", created_at: "2026-08-06T10:15:00Z" },
  ],
  "tkt-003": [
    { id: "note-002", author: "Admin", content: "URGENT: Check Supabase audit logs for any DELETE operations on breeding_records table between Aug 5-6. Possible RLS policy issue.", created_at: "2026-08-06T07:00:00Z" },
  ],
};

// ─── Public API ─────────────────────────────────────────────

/**
 * Get tickets with optional status filter.
 * Merges mock tickets with real Supabase tickets (farmer-created).
 */
export async function getTickets({ status = null, search = "" } = {}) {
  // Fetch real tickets from Supabase
  const realTickets = await fetchSupabaseTickets();

  // Merge: real tickets first, then mock data
  let allTickets = [...realTickets, ...MOCK_TICKETS];

  // Deduplicate by ticket_number (real takes precedence)
  const seen = new Set();
  allTickets = allTickets.filter((t) => {
    if (seen.has(t.ticket_number)) return false;
    seen.add(t.ticket_number);
    return true;
  });

  let filtered = allTickets;

  if (status && status !== "all") {
    filtered = filtered.filter((t) => t.status === status);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.customer_name.toLowerCase().includes(q) ||
        t.customer_email.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return filtered;
}

/**
 * Get ticket by ID.
 */
export async function getTicketById(id) {
  return MOCK_TICKETS.find((t) => t.id === id) || null;
}

/**
 * Get ticket messages (conversation thread).
 * Checks Supabase first, falls back to mock data.
 */
export async function getTicketMessages(ticketId) {
  // Try Supabase first (for real farmer-created tickets)
  const realMessages = await fetchSupabaseMessages(ticketId);
  if (realMessages && realMessages.length > 0) return realMessages;

  // Fall back to mock data
  return MOCK_MESSAGES[ticketId] || [];
}

/**
 * Get ticket internal notes.
 */
export async function getTicketNotes(ticketId) {
  return MOCK_NOTES[ticketId] || [];
}

/**
 * Get ticket counts by status.
 */
export async function getTicketCounts() {
  return {
    open: MOCK_TICKETS.filter((t) => t.status === "open").length,
    assigned: MOCK_TICKETS.filter((t) => t.status === "assigned").length,
    waiting_customer: MOCK_TICKETS.filter((t) => t.status === "waiting_customer").length,
    resolved: MOCK_TICKETS.filter((t) => t.status === "resolved").length,
    closed: MOCK_TICKETS.filter((t) => t.status === "closed").length,
    total: MOCK_TICKETS.length,
  };
}

/**
 * Add a reply to a ticket.
 */
export async function addTicketReply(ticketId, content) {
  if (!MOCK_MESSAGES[ticketId]) MOCK_MESSAGES[ticketId] = [];
  const msg = {
    id: `msg-${Date.now()}`,
    sender_type: "agent",
    sender_name: "Admin",
    content,
    created_at: new Date().toISOString(),
  };
  MOCK_MESSAGES[ticketId].push(msg);
  return msg;
}

/**
 * Add an internal note to a ticket.
 */
export async function addTicketNote(ticketId, content) {
  if (!MOCK_NOTES[ticketId]) MOCK_NOTES[ticketId] = [];
  const note = {
    id: `note-${Date.now()}`,
    author: "Admin",
    content,
    created_at: new Date().toISOString(),
  };
  MOCK_NOTES[ticketId].push(note);
  return note;
}

/**
 * Update ticket status.
 */
export async function updateTicketStatus(ticketId, newStatus) {
  const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
  if (ticket) {
    ticket.status = newStatus;
    ticket.updated_at = new Date().toISOString();
    if (newStatus === "resolved") ticket.resolved_at = new Date().toISOString();
    if (newStatus === "closed") ticket.closed_at = new Date().toISOString();
  }
  return ticket;
}

/**
 * Update ticket priority.
 */
export async function updateTicketPriority(ticketId, priority) {
  const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
  if (ticket) {
    ticket.priority = priority;
    ticket.updated_at = new Date().toISOString();
  }
  return ticket;
}

/**
 * Assign ticket to a user.
 */
export async function assignTicket(ticketId, assignee) {
  const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
  if (ticket) {
    ticket.assigned_to = assignee;
    ticket.status = "assigned";
    ticket.updated_at = new Date().toISOString();
  }
  return ticket;
}

/**
 * Create a new ticket (e.g. from Convert to Ticket or admin-created).
 */
export async function createTicket({ customer_name, customer_email, subject, content, priority = "medium", email_id = null, source = "email" }) {
  const ticket = {
    id: `tkt-${Date.now()}`,
    ticket_number: `FDX-${1000 + MOCK_TICKETS.length + 1}`,
    customer_id: null,
    customer_name,
    customer_email,
    farm_name: "",
    subject,
    priority,
    status: "open",
    assigned_to: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: email_id ? ["from-email"] : [],
    source,
    category: null,
  };

  MOCK_TICKETS.unshift(ticket);

  if (content) {
    MOCK_MESSAGES[ticket.id] = [{
      id: `msg-${Date.now()}`,
      sender_type: "customer",
      sender_name: customer_name,
      content,
      created_at: new Date().toISOString(),
    }];
  }

  return ticket;
}
