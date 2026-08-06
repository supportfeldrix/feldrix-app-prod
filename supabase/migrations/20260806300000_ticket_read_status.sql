-- ============================================================
-- Add read tracking for two-way conversation
-- Tracks unread message counts for both farmer and support.
-- ============================================================

-- Track last-read timestamp per user per ticket
CREATE TABLE IF NOT EXISTS public.ticket_read_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz DEFAULT now(),
  CONSTRAINT ticket_read_status_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_read_status_unique UNIQUE (ticket_id, user_id)
);

ALTER TABLE public.ticket_read_status ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users manage own read status" ON public.ticket_read_status
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow farmers to read messages on their own tickets
CREATE POLICY "Users read messages on own tickets" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.customer_id = auth.uid()
    )
  );

-- Allow farmers to update their own ticket (for updated_at timestamp)
CREATE POLICY "Users update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Index for read status lookups
CREATE INDEX IF NOT EXISTS idx_ticket_read_status_user ON public.ticket_read_status(user_id);
