-- ============================================================
-- Sent Emails Table
-- Stores outgoing emails sent via the email-send Edge Function.
-- Maintains complete audit history and threading headers.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sent_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id text,
  in_reply_to text,
  references_header text,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending',
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  original_email_id uuid REFERENCES public.imported_emails(id) ON DELETE SET NULL,
  sender_email text DEFAULT 'support@feldrix.com',
  sender_name text DEFAULT 'Feldrix Support',
  smtp_response text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sent_emails_pkey PRIMARY KEY (id),
  CONSTRAINT sent_emails_status_check CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sent_emails_recipient ON public.sent_emails(recipient);
CREATE INDEX IF NOT EXISTS idx_sent_emails_original ON public.sent_emails(original_email_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON public.sent_emails(sent_at DESC);

-- RLS
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read sent emails" ON public.sent_emails
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages sent emails" ON public.sent_emails
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to insert (for optimistic UI insert before Edge Function confirms)
CREATE POLICY "Authenticated users insert sent emails" ON public.sent_emails
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users update sent emails" ON public.sent_emails
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
