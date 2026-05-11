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

-- Policy: Admins can view all reports (identify admins by checking a role, or use service role bypass)
DROP POLICY IF EXISTS "admins_can_view_all_reports" ON public.reports;
CREATE POLICY "admins_can_view_all_reports"
  ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update reports (add decision_note and change status)
DROP POLICY IF EXISTS "admins_can_update_reports" ON public.reports;
CREATE POLICY "admins_can_update_reports"
  ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
