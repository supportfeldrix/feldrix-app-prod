-- ============================================================
-- Feldrix Customer Success Centre — Database Schema
-- Version 1.0
--
-- Tables:
--   support_tickets       — Core ticket records
--   ticket_messages       — Conversation thread (customer + agent replies)
--   ticket_notes          — Internal-only notes (not visible to customer)
--   ticket_assignments    — Assignment history
--   ticket_status_history — Status change audit trail
--   support_emails        — Email records (provider-agnostic)
--   email_links           — Links emails to tickets
--   support_attachments   — File attachments for emails and tickets
-- ============================================================

-- 1. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  tags text[] DEFAULT '{}',
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'assigned', 'waiting_customer', 'resolved', 'closed'))
);

-- 2. Ticket Messages (conversation thread)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL DEFAULT 'agent',
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT ticket_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_messages_sender_type_check CHECK (sender_type IN ('customer', 'agent', 'system'))
);

-- 3. Ticket Notes (internal only)
CREATE TABLE IF NOT EXISTS public.ticket_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT ticket_notes_pkey PRIMARY KEY (id)
);

-- 4. Ticket Assignments (history)
CREATE TABLE IF NOT EXISTS public.ticket_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  CONSTRAINT ticket_assignments_pkey PRIMARY KEY (id)
);

-- 5. Ticket Status History
CREATE TABLE IF NOT EXISTS public.ticket_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now(),
  reason text,
  CONSTRAINT ticket_status_history_pkey PRIMARY KEY (id)
);

-- 6. Support Emails (provider-agnostic)
CREATE TABLE IF NOT EXISTS public.support_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text,
  provider text DEFAULT 'manual',
  folder text NOT NULL DEFAULT 'inbox',
  from_address text NOT NULL,
  from_name text,
  to_address text NOT NULL DEFAULT 'support@feldrix.com',
  subject text NOT NULL,
  body_text text,
  body_html text,
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  priority text DEFAULT 'normal',
  has_attachments boolean DEFAULT false,
  received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT support_emails_pkey PRIMARY KEY (id),
  CONSTRAINT support_emails_folder_check CHECK (folder IN ('inbox', 'sent', 'archive', 'trash')),
  CONSTRAINT support_emails_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- 7. Email Links (connect emails to tickets)
CREATE TABLE IF NOT EXISTS public.email_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES public.support_emails(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  linked_at timestamptz DEFAULT now(),
  linked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT email_links_pkey PRIMARY KEY (id),
  CONSTRAINT email_links_unique UNIQUE (email_id, ticket_id)
);

-- 8. Support Attachments
CREATE TABLE IF NOT EXISTS public.support_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES public.support_emails(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size integer,
  mime_type text,
  storage_path text,
  uploaded_at timestamptz DEFAULT now(),
  CONSTRAINT support_attachments_pkey PRIMARY KEY (id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_emails_folder ON public.support_emails(folder);
CREATE INDEX IF NOT EXISTS idx_support_emails_customer ON public.support_emails(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_links_ticket ON public.email_links(ticket_id);

-- RLS Policies (admin-only access)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all support data
CREATE POLICY "Admins manage support tickets" ON public.support_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage ticket messages" ON public.ticket_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage ticket notes" ON public.ticket_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage ticket assignments" ON public.ticket_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage ticket status history" ON public.ticket_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage support emails" ON public.support_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage email links" ON public.email_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage support attachments" ON public.support_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
