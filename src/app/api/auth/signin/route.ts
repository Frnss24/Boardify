import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password diperlukan' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message || 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Ambil role dari users table
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: user?.role || 'user',
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
