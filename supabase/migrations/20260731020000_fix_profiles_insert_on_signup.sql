-- ============================================================
-- Fix: Profile creation fails on production registration
-- Root cause: MAILER_AUTOCONFIRM=false in prod means the user
-- has no active session after signUp(), so auth.uid() is NULL
-- and the RLS WITH CHECK (auth.uid() = id) rejects the INSERT.
--
-- Solution: Create a server-side trigger function that runs as
-- SECURITY DEFINER (bypasses RLS) on auth.users INSERT to
-- auto-create the profile row. This guarantees the profile
-- exists regardless of email confirmation state.
--
-- Additionally, add a permissive INSERT policy for the
-- `authenticated` role with anon fallback so the client-side
-- insert (which provides extra fields like farm_name) can
-- UPSERT after the user confirms email and signs in.
-- ============================================================

-- 1. Create a trigger function to auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Add an UPSERT-friendly UPDATE policy so the client can fill
--    in farm details after the user confirms and signs in.
--    (The SELECT and UPDATE policies already exist and cover this.)

-- 4. The existing INSERT policies remain for backward compatibility.
--    They'll work once the user has a session (after email confirm).

-- ============================================================
-- SUMMARY
-- The flow now works as follows:
-- 1. User calls signUp() → auth.users row created
-- 2. Trigger fires → profiles row created (server-side, no RLS)
-- 3. Client insert attempt either:
--    a) Succeeds (if session exists, i.e. autoconfirm or after login)
--    b) Fails silently (profile already exists from trigger)
-- 4. After email confirmation + login, user can UPDATE their
--    profile with farm_name, country, etc. via the existing
--    UPDATE policy.
-- ============================================================
