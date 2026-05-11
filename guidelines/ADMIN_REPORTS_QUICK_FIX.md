# Admin Reports Panel - Quick Debugging

Kalau admin panel gaada data reports, ikuti checklist ini:

## 🔍 Checklist (Urutan penting!)

### 1️⃣ Verify Admin Role (MOST IMPORTANT)
Buka Supabase → SQL Editor, jalankan:
```sql
SELECT id, email, role FROM public.users WHERE email = 'YOUR_ADMIN_EMAIL_HERE';
```

❌ Kalau result kosong = user belum ada
❌ Kalau role = NULL atau 'user' = belum di-set admin
✅ Kalau role = 'admin' = sudah benar

**Jika belum admin, jalankan:**
```sql
UPDATE public.users SET role = 'admin' 
WHERE email = 'YOUR_ADMIN_EMAIL_HERE';
```

### 2️⃣ Check Reports Ada Data
```sql
SELECT COUNT(*) as total, 
       COUNT(DISTINCT reporter_id) as unique_reporters,
       COUNT(*) FILTER (WHERE status = 'open') as open_count,
       COUNT(*) FILTER (WHERE status = 'in_review') as in_review_count,
       COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count
FROM public.reports;
```

❌ Kalau total = 0 = belum ada report (submit dulu dari user)
✅ Kalau ada angka = reports sudah ada di database

### 3️⃣ Check RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'reports';
```

❌ Kalau result kosong = RLS policies belum di-apply
✅ Kalau ada 4 policies (users_can_create, users_can_view, admins_can_view, admins_can_update) = benar

**Jika belum ada, copy-paste SQL dari `guidelines/rls-policies-reports.sql` ke SQL Editor.**

### 4️⃣ Check Browser Network
1. Buka admin page `/admin`
2. Buka F12 (DevTools)
3. Tab "Network"
4. Refresh halaman
5. Cari request ke `/api/admin/overview`
6. Click request tersebut
7. Tab "Response" - lihat response JSON

Lihat apakah `reports` array ada isi:
```json
{
  "reports": [
    { "id": "...", "title": "...", ... },
    { "id": "...", "title": "...", ... }
  ]
}
```

❌ Kalau `reports: []` = kosong
❌ Kalau ada error di Response = API error
✅ Kalau ada data = seharusnya tampil di admin panel

### 5️⃣ Check Browser Console
1. F12 → Tab "Console"
2. Lihat ada error merah atau biru

Common errors:
- "failed to load admin overview" = API error (lihat step 4)
- `undefined is not an object` = component error

### 6️⃣ Verify Environment Variables
Cek `.env.local` punya:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Kalau baru di-edit, restart dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## 🚀 Quick Test Sequence

**Jika semua above okeh, lakukan ini untuk test end-to-end:**

1. **Login sebagai regular user** (not admin)
2. **Submit report:**
   - Klik "Report" button
   - Isi title & message
   - Klik Send
   - Should see: "Report berhasil dikirim..."

3. **Cek report ada di database:**
   ```sql
   SELECT * FROM public.reports 
   ORDER BY created_at DESC LIMIT 1;
   ```

4. **Logout, login sebagai admin**

5. **Refresh admin page** - laporan dari user seharusnya muncul

6. **Update status:**
   - Dropdown: ubah dari "open" → "in_review"
   - Text: isi decision note
   - Click Save

7. **Logout, login sebagai user lagi**

8. **Go to History tab** - should see updated status & feedback

## 📋 Step-by-Step SQL Setup

Kalau masih blank, run these SQL commands satu per satu di Supabase SQL Editor:

```sql
-- Step 1: Add role column ke users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Set your email as admin
UPDATE public.users SET role = 'admin' 
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 3: Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
DROP POLICY IF EXISTS "users_can_create_own_reports" ON public.reports;
CREATE POLICY "users_can_create_own_reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "users_can_view_own_reports" ON public.reports;
CREATE POLICY "users_can_view_own_reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "admins_can_view_all_reports" ON public.reports;
CREATE POLICY "admins_can_view_all_reports"
  ON public.reports FOR SELECT
  USING (
    COALESCE(
      (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin',
      false
    )
  );

DROP POLICY IF EXISTS "admins_can_update_reports" ON public.reports;
CREATE POLICY "admins_can_update_reports"
  ON public.reports FOR UPDATE
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

-- Step 5: Verify everything
SELECT 'Users with admin role:' as check_1;
SELECT email, role FROM public.users WHERE role = 'admin';

SELECT 'RLS Policies:' as check_2;
SELECT policyname FROM pg_policies WHERE tablename = 'reports';

SELECT 'Reports in database:' as check_3;
SELECT COUNT(*) as total_reports FROM public.reports;
```

## 🎯 Most Common Fixes

| Problem | Fix |
|---------|-----|
| Admin panel blank | Check `role` column: `SELECT * FROM public.users WHERE email='your_email'` - should show `role='admin'` |
| No RLS policies | Run: `SELECT policyname FROM pg_policies WHERE tablename='reports'` - should return 4 rows |
| Reports not appearing | Submit new report from user account first |
| API error on /api/admin/overview | Check .env.local has NEXT_PUBLIC_SUPABASE_ANON_KEY |
| Can't click Save button | Make sure status dropdown changed & admin actually has role='admin' |

## 📞 Still Stuck?

Kalo still gaada hasil, provide these info:

1. Output dari:
   ```sql
   SELECT email, role FROM public.users WHERE email = 'your_admin_email@example.com';
   ```

2. Output dari:
   ```sql
   SELECT COUNT(*) FROM public.reports;
   ```

3. Screenshot dari browser F12 → Network → `/api/admin/overview` Response

4. Error message dari F12 → Console (if any)
