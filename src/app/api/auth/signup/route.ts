import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
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

    // Gunakan service role key untuk create user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buat user di auth.users
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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
      .insert({
        id: data.user.id,
        email,
        role,
        name: email.split('@')[0],
        created_at: new Date().toISOString(),
      });

    if (userError) {
      console.error('User record creation error:', userError);
      // User udah di auth, jadi jangan return error
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
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
