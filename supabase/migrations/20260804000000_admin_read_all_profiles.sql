-- ============================================================
-- Fix: Admin portal cannot see other users' profiles
--
-- Root cause: The only SELECT policy on profiles is:
--   "Users view own profile" → USING (auth.uid() = id)
--
-- This means admin-role users can only see their own row.
--
-- Solution: Use a SECURITY DEFINER function to check the
-- current user's role WITHOUT triggering RLS recursion.
-- Then reference that function in the policy.
-- ============================================================

-- 1. Helper function — bypasses RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'support', 'finance', 'readonly')
  );
$$;

-- 2. Admin roles can SELECT all profiles
DROP POLICY IF EXISTS "Admin roles can view all profiles" ON public.profiles;
CREATE POLICY "Admin roles can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ( public.is_admin_role() );

-- 3. Admin and support roles can UPDATE any profile (suspend, role change, etc.)
DROP POLICY IF EXISTS "Admin roles can update all profiles" ON public.profiles;
CREATE POLICY "Admin roles can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ( public.is_admin_role() )
  WITH CHECK ( public.is_admin_role() );

-- ============================================================
-- HOW TO APPLY
--
-- Run in Supabase Dashboard → SQL Editor.
--
-- After applying, verify:
--   1. Login to Admin portal → should load (no more 500/404)
--   2. Users tab should show ALL registered users
--   3. AI Dashboard metrics should reflect real totals
-- ============================================================
