# Report History Feature - Setup Guide

## Problem yang Diperbaiki
Server error saat menambah reports baru dan melihat history disebabkan oleh:
1. Missing RLS (Row Level Security) policies pada table reports
2. Incomplete error handling dan logging
3. Environment variables configuration

## Setup Steps

### 1. **Enable RLS Policies (PENTING!)**
Jalankan SQL dari file `guidelines/rls-policies-reports.sql` di Supabase:

```sql
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

-- Policy: Admins can view all reports
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

-- Policy: Admins can update reports
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
```

### 2. **Verify Environment Variables**
Pastikan di `.env.local` sudah ada:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, API akan fallback ke anon key)
```

### 3. **Check Users Table Role Column**
Pastikan table `users` memiliki kolom `role` dengan default value 'user':
```sql
ALTER TABLE public.users ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
```

### 4. **Set Admin Role for Admin Users**
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Testing

### Submit Report:
1. Login sebagai regular user
2. Klik tombol "Report" di navbar
3. Isi judul dan detail report
4. Klik "Send Report"
5. Pesan success seharusnya muncul

### View Report History:
1. Login sebagai user yang sama
2. Klik tab "History" di navbar
3. Lihat daftar report yang sudah disubmit

### Admin Response:
1. Login sebagai admin user
2. Di admin panel, tambah feedback ke report
3. Update status menjadi "in_review" atau "resolved"
4. User akan melihat update di History tab

## Error Messages

Jika ada error, cek console log (browser F12) dan server log untuk:
- "Configuration error: missing supabase URL" → Set NEXT_PUBLIC_SUPABASE_URL
- "Configuration error: missing API key" → Set API keys
- "Database error: ..." → Ada masalah dengan RLS policies atau data
- "Network error" → Problem dengan koneksi internet

## Files Modified
- `/api/reports/route.ts` - POST endpoint with better error handling
- `/api/reports/user/route.ts` - GET endpoint with better error handling
- `components/ReportHistory.tsx` - Improved error messages
- `app/user/page.tsx` - Better try-catch handling in handleSubmitReport
- `guidelines/rls-policies-reports.sql` - New RLS policies file
