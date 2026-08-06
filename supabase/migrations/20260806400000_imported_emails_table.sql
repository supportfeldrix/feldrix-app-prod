-- ============================================================
-- Imported Emails Table
-- Stores emails fetched from IMAP via the email-sync Edge Function.
-- Uses message_id (Message-ID header) for deduplication.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.imported_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id text UNIQUE,
  subject text,
  sender_name text,
  sender_email text NOT NULL,
  recipient text DEFAULT 'support@feldrix.com',
  cc text,
  received_at timestamptz,
  preview text,
  body_text text,
  body_html text,
  is_read boolean DEFAULT false,
  has_attachments boolean DEFAULT false,
  attachment_count integer DEFAULT 0,
  message_size integer DEFAULT 0,
  folder text DEFAULT 'inbox',
  sync_status text DEFAULT 'imported',
  imported_at timestamptz DEFAULT now(),
  raw_headers text,
  CONSTRAINT imported_emails_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_imported_emails_received ON public.imported_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_imported_emails_sender ON public.imported_emails(sender_email);
CREATE INDEX IF NOT EXISTS idx_imported_emails_message_id ON public.imported_emails(message_id);

-- RLS — admin-only access (authenticated users can read)
ALTER TABLE public.imported_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read imported emails" ON public.imported_emails
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages imported emails" ON public.imported_emails
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sync log table for diagnostics
CREATE TABLE IF NOT EXISTS public.email_sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  emails_imported integer DEFAULT 0,
  duplicates_skipped integer DEFAULT 0,
  status text DEFAULT 'running',
  error_message text,
  CONSTRAINT email_sync_log_pkey PRIMARY KEY (id)
);

ALTER TABLE public.email_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read sync log" ON public.email_sync_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages sync log" ON public.email_sync_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
