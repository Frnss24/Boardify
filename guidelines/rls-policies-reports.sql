-- Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own reports
DROP POLICY IF EXISTS "users_can_create_own_reports" ON public.reports;
CREATE POLICY "users_can_create_own_reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own reports
DROP POLICY IF EXISTS "users_can_view_own_reports" ON public.reports;
CREATE POLICY "users_can_view_own_reports"
  ON public.reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Policy: Admins can view all reports (using role column from users table)
-- Note: This will fail silently if role column doesn't exist yet - that's okay
-- Service role key from backend bypasses RLS anyway
DROP POLICY IF EXISTS "admins_can_view_all_reports" ON public.reports;
CREATE POLICY "admins_can_view_all_reports"
  ON public.reports
  FOR SELECT
  USING (
    COALESCE(
      (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin',
      false
    )
  );

-- Policy: Admins can update reports (add decision_note and change status)
DROP POLICY IF EXISTS "admins_can_update_reports" ON public.reports;
CREATE POLICY "admins_can_update_reports"
  ON public.reports
  FOR UPDATE
  USING (
    COALESCE(
      (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin',
      false
    )
  )
  WITH CHECK (
    COALESCE(
      (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin',
      false
    )
  );

