import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reporterId = url.searchParams.get('reporter_id');

    if (!reporterId) {
      return NextResponse.json(
        { error: 'reporter_id parameter wajib diisi' },
        { status: 400 }
      );
    }

    // Check if service role key exists, otherwise use anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
      return NextResponse.json({ error: 'Configuration error: missing supabase URL' }, { status: 500 });
    }

    const key = serviceRoleKey || anonKey;
    if (!key) {
      console.error('Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set');
      return NextResponse.json({ error: 'Configuration error: missing API key' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, key);

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', reporterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error.message, error.details);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reports: reports || [] }, { status: 200 });
  } catch (error) {
    console.error('Fetch user reports error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
