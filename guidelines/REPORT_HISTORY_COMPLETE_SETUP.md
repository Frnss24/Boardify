# Report History Feature - Complete Setup & Debugging Guide

## Overview
Fitur yang memungkinkan users mengirim reports/complaints ke admin, dan admin dapat memberikan feedback. Users kemudian dapat melihat status dan feedback di tab "History".

## Architecture

```
User Flow:
User submits report 
  → POST /api/reports 
  → Stored in reports table with status='open'
  
User views history 
  → GET /api/reports/user?reporter_id={userId}
  → ReportHistory component shows all reports + admin feedback

Admin Flow:
Admin visits /admin/page.tsx
  → GET /api/admin/overview
  → Reports section shows all reports from all users
  
Admin updates report
  → PATCH /api/admin/reports/[id]
  → Updates status (open/in_review/resolved) & decision_note
  
User refreshes history tab
  → Sees updated status & admin feedback
```

## Prerequisites

### 1. Users Table - Role Column
Make sure `public.users` table has a `role` column:

```sql
-- Check if role column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- If not, add it
ALTER TABLE public.users 
ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
```

### 2. Environment Variables
Verify `.env.local` has these keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (optional - APIs fallback to ANON_KEY if missing)
```

## Setup Instructions

### Step 1: Enable RLS on Reports Table
Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own reports
DROP POLICY IF EXISTS "users_can_create_own_reports" ON public.reports;
CREATE POLICY "users_can_create_own_reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
DROP POLICY IF EXISTS "users_can_view_own_reports" ON public.reports;
CREATE POLICY "users_can_view_own_reports"
  ON public.reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
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

-- Admins can update reports
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
```

### Step 2: Set Admin Users
```sql
-- Make someone an admin (replace email)
UPDATE public.users SET role = 'admin' 
WHERE email = 'your_admin_email@example.com';

-- Verify
SELECT id, email, role FROM public.users 
WHERE role = 'admin';
```

### Step 3: Submit Test Report
1. Login as regular user (not admin)
2. Click "Report" button in navbar
3. Fill title & message
4. Click "Send Report"
5. Should see: "Report berhasil dikirim ke admin. Cek di halaman History untuk melihat status."

### Step 4: Check User History Tab
1. Still logged in as that user
2. Click "History" tab in navbar
3. Should see the report you just submitted with status="open"

### Step 5: Admin View & Respond
1. Logout, then login as ADMIN user
2. Go to `/admin` page
3. Scroll to "Reports & Moderation" section
4. Should see reports from all users
5. Change status dropdown (open → in_review → resolved)
6. Type feedback in "Decision Note" field
7. Click "Save" button
8. Status and note should update

### Step 6: User Sees Response
1. Logout, login as original user again
2. Go to History tab
3. Click on the report to expand it
4. Should now show:
   - Updated status (in_review or resolved)
   - Admin feedback in "Admin Response" box

## Troubleshooting

### ❌ Admin page shows "No reports submitted yet"

**Check 1: Verify reports exist in database**
```sql
SELECT id, title, status, reporter_email, created_at 
FROM public.reports 
ORDER BY created_at DESC 
LIMIT 5;
```
If this returns empty, you need to submit a report first.

**Check 2: Verify user is actually admin**
```sql
SELECT id, email, role FROM public.users 
WHERE email = 'logged_in_user_email@example.com';
```
Should show `role = 'admin'`. If it shows NULL or 'user', you need to run Step 2 again.

**Check 3: Check API response**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh `/admin` page
4. Find request to `/api/admin/overview`
5. Click it
6. In Response tab, check if `reports` array has data
7. If Response tab shows error, check the error message

**Check 4: Verify RLS policies are enabled**
```sql
SELECT schemaname, tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reports' 
ORDER BY policyname;
```
Should show 4 policies. If empty, RLS policies didn't get applied.

**Check 5: Check Supabase logs**
- Go to Supabase dashboard
- Project → Logs → Edge Functions or Auth
- Look for any error messages from /api calls

### ❌ "Server error" when submitting report

**Possible causes:**
1. **Environment variables not set** 
   - Check `.env.local` has SUPABASE keys
   - Restart dev server after changing .env

2. **Reports table doesn't exist**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'reports'
   );
   ```

3. **Check API response error**
   - F12 → Network tab
   - Submit report
   - Find POST to `/api/reports`
   - Check Response for detailed error message

### ❌ "Server error" when updating report (admin)

1. Check RLS policy for UPDATE is enabled:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'reports' AND policyname LIKE '%update%';
   ```

2. Verify status value is valid: must be exactly: `'open'` or `'in_review'` or `'resolved'`

3. F12 → Network → Find PATCH request to `/api/admin/reports/[id]`
   - Check Response for detailed error

### ❌ User History tab shows "Error"

**Check ReportHistory component**
1. F12 → Console tab
2. Look for error from `/api/reports/user` request
3. Most common: `reporter_id` parameter not being passed

**Verify userId is set**
```javascript
// In browser console, check if userId exists
localStorage.getItem('supabase.auth.token') // should have user data
```

## Error Messages Reference

| Error | Cause | Fix |
|-------|-------|-----|
| "Configuration error: missing supabase URL" | NEXT_PUBLIC_SUPABASE_URL not set | Add to .env.local |
| "Configuration error: missing API key" | Both SERVICE_ROLE_KEY and ANON_KEY missing | Add NEXT_PUBLIC_SUPABASE_ANON_KEY |
| "Database error: ..." | RLS policy issue or invalid data | Check RLS policies in Supabase |
| "Status harus open, in_review, atau resolved" | Invalid status sent to API | Use only: open, in_review, or resolved |
| "Server error" (generic) | Catch-all error | Check browser console & server logs |

## Files & Endpoints

### Frontend Components
- `src/app/components/ReportHistory.tsx` - User history view
- `src/app/user/page.tsx` - History tab in main navbar

### Backend APIs
- `POST /api/reports` - Submit new report
- `GET /api/reports/user?reporter_id={id}` - Get user's reports
- `GET /api/admin/overview` - Get admin dashboard (including reports)
- `PATCH /api/admin/reports/{id}` - Update report status & feedback

### Database
- Table: `public.reports`
  - Columns: id, reporter_id, reporter_email, title, message, status, decision_note, created_at, updated_at

## Testing Checklist

- [ ] User can submit report (see success message)
- [ ] Report appears in History tab
- [ ] Admin can see report in `/admin` page
- [ ] Admin can change status dropdown
- [ ] Admin can add feedback text
- [ ] Admin can click Save
- [ ] User sees updated status in History tab
- [ ] User sees admin feedback in expanded report

## Quick Debug Commands

```bash
# Watch Supabase realtime logs
# (From Supabase dashboard → Logs section)

# Restart Next.js dev server after .env changes
npm run dev

# Check if port 3000 is already in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

## FAQ

**Q: Why doesn't admin see reports even though users submitted them?**
A: Most common cause is the user isn't actually marked as admin. Run:
```sql
UPDATE public.users SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1);
```

**Q: Can users see reports from other users?**
A: No - RLS policies restrict users to only see their own. Admins see all.

**Q: What if service role key is not set?**
A: APIs will fallback to using the ANON_KEY. This still works but might have different RLS behavior. Service role key is recommended for admin endpoints.

**Q: How do I delete a report?**
A: Currently not implemented in UI. Can delete directly in Supabase:
```sql
DELETE FROM public.reports WHERE id = 'report-id-uuid';
```

**Q: Can users edit their submitted reports?**
A: Currently no - reports are immutable after submission.
