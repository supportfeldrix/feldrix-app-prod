-- ============================================================
-- Add source and category fields to support_tickets
-- Source: tracks where the ticket originated (farmer_app, email, admin)
-- Category: ticket classification (technical_issue, billing, etc.)
-- ============================================================

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS source text DEFAULT 'farmer_app';
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS farm_name text;

-- Allow farmers to create their own support tickets
CREATE POLICY "Users create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Allow farmers to read their own tickets
CREATE POLICY "Users view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- Allow farmers to insert messages on their own tickets
CREATE POLICY "Users add messages to own tickets" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.customer_id = auth.uid()
    )
  );
