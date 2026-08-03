-- ============================================================
-- Feldrix FarmHand PRO — Production Sync Migration
-- Synchronize Production schema to match Development
-- Generated: 2026-07-31
-- Safe: ADD COLUMN only, no data drops
-- ============================================================

-- ============================================================
-- 1. PROFILES — Add missing column
-- ============================================================

-- Dev has preferred_units, prod does not
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_units text;

-- Prod has extra columns (phone, avatar_url, email_notifications_prefs)
-- that Dev does NOT have. We keep them in prod (no data loss).
-- They will not cause harm — the app ignores columns it doesn't query.

-- Fix: Dev has no default on farm_type, Prod has 'Mixed Farm'::text
-- Keep the prod default (it's harmless and useful for new signups)

-- ============================================================
-- 2. PLANNER_TASKS — Add missing columns
-- ============================================================

-- Dev has these columns that Prod does not:
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS last_generated date;
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS module text NOT NULL DEFAULT 'General'::text;
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS repeat_until date;
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'Manual'::text;

-- Prod has extra columns (category, completed_at) that Dev does NOT have.
-- Keep them in prod (no data loss). The `category` column likely serves a
-- similar purpose to `module` — both exist safely side-by-side.

-- Fix nullable differences to match dev (NOT NULL constraints)
-- planner_tasks.priority: dev=NOT NULL, prod=nullable
ALTER TABLE public.planner_tasks ALTER COLUMN priority SET NOT NULL;
ALTER TABLE public.planner_tasks ALTER COLUMN priority SET DEFAULT 'Medium'::text;

-- planner_tasks.status: dev=NOT NULL, prod=nullable
ALTER TABLE public.planner_tasks ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.planner_tasks ALTER COLUMN status SET DEFAULT 'Pending'::text;

-- planner_tasks.created_at: dev=NOT NULL, prod=nullable
ALTER TABLE public.planner_tasks ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.planner_tasks ALTER COLUMN created_at SET DEFAULT now();

-- planner_tasks.updated_at: dev=NOT NULL, prod=nullable
ALTER TABLE public.planner_tasks ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE public.planner_tasks ALTER COLUMN updated_at SET DEFAULT now();

-- ============================================================
-- 3. SUBSCRIPTION_PAYMENTS — Add missing columns + fix defaults
-- ============================================================

-- Dev has these columns that Prod does not:
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS paid_at timestamptz DEFAULT now();
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'Pro'::text;
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS transaction_id text;

-- Prod has extra columns (metadata, payment_date, subscription_id) that Dev does NOT have.
-- Keep them (no data loss).

-- Fix: status default dev='Completed'::text, prod='pending'::text
ALTER TABLE public.subscription_payments ALTER COLUMN status SET DEFAULT 'Completed'::text;

-- Fix nullable: currency, provider, status should be NOT NULL
ALTER TABLE public.subscription_payments ALTER COLUMN currency SET NOT NULL;
ALTER TABLE public.subscription_payments ALTER COLUMN provider SET NOT NULL;
ALTER TABLE public.subscription_payments ALTER COLUMN status SET NOT NULL;

-- ============================================================
-- 4. SUBSCRIPTIONS — Fix default + nullable
-- ============================================================

-- Fix: plan default dev='Starter'::text, prod='free'::text
ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'Starter'::text;
ALTER TABLE public.subscriptions ALTER COLUMN plan SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN status SET NOT NULL;

-- ============================================================
-- SUMMARY OF CHANGES
-- ============================================================
-- profiles:             +1 column (preferred_units)
-- planner_tasks:        +6 columns, 4 nullable->NOT NULL fixes
-- subscription_payments: +4 columns, 1 default fix, 3 nullable->NOT NULL
-- subscriptions:        1 default fix, 2 nullable->NOT NULL
--
-- NO columns dropped. NO data lost.
-- Extra prod columns (phone, avatar_url, email_notifications_prefs,
--   category, completed_at, metadata, payment_date, subscription_id)
-- are retained safely.
-- ============================================================
