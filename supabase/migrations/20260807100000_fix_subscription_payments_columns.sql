-- ============================================================
-- Fix: Add missing columns to subscription_payments table
-- Required by the payfast-itn Edge Function
-- ============================================================

ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS subscription_plan text;

-- Unique index on transaction_id for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_payments_txn ON public.subscription_payments(transaction_id) WHERE transaction_id IS NOT NULL;
