-- ============================================================
-- SECURITY HARDENING
--
-- 1. Profiles: a user can no longer change their own role / suspension.
--    Only a full 'admin' may change role, suspended, suspended_at, and only
--    a full admin may edit other users' profiles (was: any admin role,
--    including 'readonly').
-- 2. Support / email tables: were readable and writable by EVERY logged-in
--    user (USING (true)). Now staff-only ('admin', 'support'). Farmers keep
--    their existing policies for their own tickets and messages.
-- 3. Login tracking: profiles.last_login is filled from Supabase Auth's
--    last_sign_in_at on every sign-in, so the admin activity numbers work.
--
-- SQL editor / service role (auth.uid() IS NULL) is not restricted, so
-- you can still change roles from the Supabase dashboard.
-- ============================================================

-- ─── Role helpers (SECURITY DEFINER: no RLS recursion on profiles) ───
CREATE OR REPLACE FUNCTION public.is_full_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_support_staff()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'));
$$;

-- ─── 1. Profiles: protect privileged columns ────────────────
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Service role / SQL editor / auth triggers have no auth.uid(): allowed.
  IF auth.uid() IS NULL OR public.is_full_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Self-created profiles always start as a normal, active farmer.
    NEW.role := 'farmer';
    NEW.suspended := false;
    NEW.suspended_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.suspended IS DISTINCT FROM OLD.suspended
     OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at THEN
    RAISE EXCEPTION 'Only an administrator can change role or suspension.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Editing OTHER users' profiles: full admins only (support/finance/readonly
-- can still READ all profiles via "Admin roles can view all profiles").
DROP POLICY IF EXISTS "Admin roles can update all profiles" ON public.profiles;
CREATE POLICY "Admin roles can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_full_admin())
  WITH CHECK (public.is_full_admin());

-- ─── 2. Support / email tables: staff only ──────────────────
DO $$
DECLARE
  t text;
  p text;
BEGIN
  FOR t, p IN SELECT * FROM (VALUES
    ('support_tickets',       'Admins manage support tickets'),
    ('ticket_messages',       'Admins manage ticket messages'),
    ('ticket_notes',          'Admins manage ticket notes'),
    ('ticket_assignments',    'Admins manage ticket assignments'),
    ('ticket_status_history', 'Admins manage ticket status history'),
    ('support_emails',        'Admins manage support emails'),
    ('email_links',           'Admins manage email links'),
    ('support_attachments',   'Admins manage support attachments')
  ) AS v(tbl, pol)
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_support_staff()) WITH CHECK (public.is_support_staff())',
        p, t);
    END IF;
  END LOOP;
END $$;

-- imported_emails: was readable/updatable by any logged-in user.
DROP POLICY IF EXISTS "Authenticated users read imported emails" ON public.imported_emails;
DROP POLICY IF EXISTS "Authenticated users update imported emails" ON public.imported_emails;
CREATE POLICY "Staff read imported emails" ON public.imported_emails
  FOR SELECT TO authenticated USING (public.is_support_staff());
CREATE POLICY "Staff update imported emails" ON public.imported_emails
  FOR UPDATE TO authenticated USING (public.is_support_staff()) WITH CHECK (public.is_support_staff());

-- sent_emails: was readable/insertable/updatable by any logged-in user.
DROP POLICY IF EXISTS "Authenticated users read sent emails" ON public.sent_emails;
DROP POLICY IF EXISTS "Authenticated users insert sent emails" ON public.sent_emails;
DROP POLICY IF EXISTS "Authenticated users update sent emails" ON public.sent_emails;
CREATE POLICY "Staff read sent emails" ON public.sent_emails
  FOR SELECT TO authenticated USING (public.is_support_staff());
CREATE POLICY "Staff insert sent emails" ON public.sent_emails
  FOR INSERT TO authenticated WITH CHECK (public.is_support_staff());
CREATE POLICY "Staff update sent emails" ON public.sent_emails
  FOR UPDATE TO authenticated USING (public.is_support_staff()) WITH CHECK (public.is_support_staff());

-- email_sync_log: diagnostics, staff only.
DROP POLICY IF EXISTS "Authenticated users read sync log" ON public.email_sync_log;
CREATE POLICY "Staff read sync log" ON public.email_sync_log
  FOR SELECT TO authenticated USING (public.is_support_staff());

-- ─── 3. Login tracking: profiles.last_login from Supabase Auth ───
CREATE OR REPLACE FUNCTION public.sync_profile_last_login()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.profiles SET last_login = NEW.last_sign_in_at WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_last_login ON auth.users;
CREATE TRIGGER trg_sync_profile_last_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_last_login();

-- Backfill from existing sign-ins.
UPDATE public.profiles p
   SET last_login = u.last_sign_in_at
  FROM auth.users u
 WHERE u.id = p.id
   AND u.last_sign_in_at IS NOT NULL
   AND (p.last_login IS NULL OR p.last_login < u.last_sign_in_at);
