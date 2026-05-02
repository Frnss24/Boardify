import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { id, email, role, name } = await req.json();

    if (!id || !email) {
      return NextResponse.json(
        { error: 'id dan email diperlukan' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local. Sinkronisasi users tidak bisa dijalankan tanpa key itu.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const { error } = await supabase
      .from('users')
      .upsert({
        id,
        email,
        role: role || 'user',
        name: name || email.split('@')[0],
        password_hash: 'managed-by-supabase-auth',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync user error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
