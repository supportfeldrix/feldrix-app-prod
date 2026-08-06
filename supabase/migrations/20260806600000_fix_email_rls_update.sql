-- ============================================================
-- Fix: Allow authenticated users to UPDATE imported_emails
-- Required for Mark as Read, Move to Folder, Star/Unstar
-- ============================================================

CREATE POLICY "Authenticated users update imported emails" ON public.imported_emails
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
