import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, role, name } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' && name.trim() ? name.trim() : normalizedEmail.split('@')[0];

    if (!normalizedEmail || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role diperlukan' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Role harus admin atau user' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local. Tambahkan key service role lalu restart dev server.',
        },
        { status: 500 }
      );
    }

    // Gunakan service role key untuk create user
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // Buat user di auth.users
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: normalizedName,
        role,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Gagal membuat user' },
        { status: 400 }
      );
    }

    // Insert ke tabel users
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: normalizedEmail,
        role,
        name: normalizedName,
        password_hash: 'managed-by-supabase-auth',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (userError) {
      console.error('User record creation error:', userError);
      await supabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
