/**
 * ============================================================
 * Feldrix Customer Success Centre — Email Service
 * Version 1.0
 *
 * Provider-agnostic email service.
 * Uses mock data for v1.0 — prepared for future integration with:
 *   - Microsoft 365 (Graph API)
 *   - Google Workspace (Gmail API)
 *   - IMAP/SMTP
 *   - Exchange Online
 *
 * Changing providers should not require UI changes.
 * ============================================================
 */

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_EMAILS = [
  {
    id: "em-001",
    from_address: "jan.vandermerwe@gmail.com",
    from_name: "Jan van der Merwe",
    to_address: "support@feldrix.com",
    subject: "Cannot add more than 50 animals",
    body_text: "Hi Feldrix Support,\n\nI'm on the Pro plan but getting an error when I try to add my 51st animal. The system says I've reached my limit. Can you please look into this?\n\nThanks,\nJan\n\nFarm: Bosveld Boerdery\nProvince: Limpopo",
    body_html: null,
    folder: "inbox",
    is_read: false,
    is_starred: true,
    priority: "high",
    has_attachments: false,
    received_at: "2026-08-06T08:15:00Z",
    customer_id: "usr-001",
  },
  {
    id: "em-002",
    from_address: "maria.botha@outlook.com",
    from_name: "Maria Botha",
    to_address: "support@feldrix.com",
    subject: "Weather not showing for my area",
    body_text: "Good day,\n\nI changed my weather location to Ceres but it still shows Johannesburg weather. I've tried logging out and back in but it doesn't help.\n\nRegards,\nMaria Botha\nCeres Valley Wines",
    body_html: null,
    folder: "inbox",
    is_read: false,
    is_starred: false,
    priority: "normal",
    has_attachments: false,
    received_at: "2026-08-06T07:42:00Z",
    customer_id: "usr-002",
  },
  {
    id: "em-003",
    from_address: "pieter.du.plessis@farmmail.co.za",
    from_name: "Pieter du Plessis",
    to_address: "support@feldrix.com",
    subject: "Invoice for July not received",
    body_text: "Hi there,\n\nI haven't received my invoice for July yet. My accountant needs it for the VAT submission. Can you please send it?\n\nPieter du Plessis\nDu Plessis Dairy\nFree State",
    body_html: null,
    folder: "inbox",
    is_read: true,
    is_starred: false,
    priority: "normal",
    has_attachments: false,
    received_at: "2026-08-05T16:30:00Z",
    customer_id: "usr-003",
  },
  {
    id: "em-004",
    from_address: "thandi.nkosi@icloud.com",
    from_name: "Thandi Nkosi",
    to_address: "support@feldrix.com",
    subject: "App crashes when opening Reports",
    body_text: "Hello Feldrix team,\n\nEvery time I try to open the Reports page, I get a white screen. This has been happening since yesterday. I'm using Chrome on my laptop.\n\nPlease help, I need to generate my monthly report.\n\nThandi Nkosi\nNkosi Poultry Farm\nKwaZulu-Natal",
    body_html: null,
    folder: "inbox",
    is_read: false,
    is_starred: true,
    priority: "urgent",
    has_attachments: true,
    received_at: "2026-08-06T09:05:00Z",
    customer_id: "usr-004",
  },
  {
    id: "em-005",
    from_address: "henk.joubert@vodamail.co.za",
    from_name: "Henk Joubert",
    to_address: "support@feldrix.com",
    subject: "How do I upgrade to Pro?",
    body_text: "Hi,\n\nI'm currently on the Starter plan. How do I upgrade to Pro? I can't find the upgrade button anywhere.\n\nThanks\nHenk",
    body_html: null,
    folder: "inbox",
    is_read: true,
    is_starred: false,
    priority: "low",
    has_attachments: false,
    received_at: "2026-08-05T11:20:00Z",
    customer_id: "usr-005",
  },
  {
    id: "em-006",
    from_address: "support@feldrix.com",
    from_name: "Feldrix Support",
    to_address: "henk.joubert@vodamail.co.za",
    subject: "Re: How do I upgrade to Pro?",
    body_text: "Hi Henk,\n\nThanks for reaching out! You can upgrade by going to Account > Subscription and clicking 'Upgrade to Pro'.\n\nLet me know if you need anything else.\n\nBest regards,\nFeldrix Support Team",
    body_html: null,
    folder: "sent",
    is_read: true,
    is_starred: false,
    priority: "normal",
    has_attachments: false,
    received_at: "2026-08-05T11:45:00Z",
    customer_id: "usr-005",
  },
  {
    id: "em-007",
    from_address: "willem.pretorius@telkomsa.net",
    from_name: "Willem Pretorius",
    to_address: "support@feldrix.com",
    subject: "Breeding records disappeared",
    body_text: "My breeding records from last month are all gone. I had about 12 entries and now the page is empty. Did something happen to the database?\n\nThis is very concerning as I need those records for my stud book.\n\nWillem Pretorius\nPretorius Brahman Stud",
    body_html: null,
    folder: "inbox",
    is_read: false,
    is_starred: true,
    priority: "urgent",
    has_attachments: false,
    received_at: "2026-08-06T06:30:00Z",
    customer_id: "usr-006",
  },
  {
    id: "em-008",
    from_address: "annemarie.venter@gmail.com",
    from_name: "Annemarie Venter",
    to_address: "support@feldrix.com",
    subject: "Thank you for the quick fix!",
    body_text: "Hi team,\n\nJust wanted to say thank you for fixing the planner issue so quickly. Everything is working perfectly now.\n\nKeep up the great work!\n\nAnnemarie",
    body_html: null,
    folder: "archive",
    is_read: true,
    is_starred: false,
    priority: "normal",
    has_attachments: false,
    received_at: "2026-08-04T14:10:00Z",
    customer_id: "usr-007",
  },
];

// ─── Public API ─────────────────────────────────────────────

/**
 * Get emails by folder with optional filters.
 */
export async function getEmails({ folder = "inbox", search = "", unreadOnly = false } = {}) {
  let filtered = MOCK_EMAILS.filter((e) => e.folder === folder);

  if (unreadOnly) {
    filtered = filtered.filter((e) => !e.is_read);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.from_name?.toLowerCase().includes(q) ||
        e.from_address.toLowerCase().includes(q) ||
        e.body_text?.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));

  return filtered;
}

/**
 * Get a single email by ID.
 */
export async function getEmailById(id) {
  return MOCK_EMAILS.find((e) => e.id === id) || null;
}

/**
 * Get email folder counts.
 */
export async function getEmailCounts() {
  return {
    inbox: MOCK_EMAILS.filter((e) => e.folder === "inbox").length,
    unread: MOCK_EMAILS.filter((e) => e.folder === "inbox" && !e.is_read).length,
    sent: MOCK_EMAILS.filter((e) => e.folder === "sent").length,
    archive: MOCK_EMAILS.filter((e) => e.folder === "archive").length,
    trash: MOCK_EMAILS.filter((e) => e.folder === "trash").length,
  };
}

/**
 * Mark email as read/unread.
 */
export async function markEmailRead(id, isRead = true) {
  const email = MOCK_EMAILS.find((e) => e.id === id);
  if (email) email.is_read = isRead;
  return email;
}

/**
 * Move email to folder.
 */
export async function moveEmail(id, folder) {
  const email = MOCK_EMAILS.find((e) => e.id === id);
  if (email) email.folder = folder;
  return email;
}

/**
 * Star/unstar email.
 */
export async function toggleStarEmail(id) {
  const email = MOCK_EMAILS.find((e) => e.id === id);
  if (email) email.is_starred = !email.is_starred;
  return email;
}
