import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { status, decision_note } = await req.json();

    const normalizedStatus = String(status || '').toLowerCase();
    if (!['open', 'in_review', 'resolved'].includes(normalizedStatus)) {
      return NextResponse.json(
        { error: 'Status harus open, in_review, atau resolved' },
        { status: 400 }
      );
    }

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

    const { error } = await supabase
      .from('reports')
      .update({
        status: normalizedStatus,
        decision_note: decision_note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error.message, error.details);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update report error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
