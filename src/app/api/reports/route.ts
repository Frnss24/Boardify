import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { reporter_id, reporter_email, title, message } = await req.json();

    if (!reporter_id || !reporter_email || !title || !message) {
      return NextResponse.json(
        { error: 'reporter_id, reporter_email, title, dan message wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          reporter_id,
          reporter_email,
          title,
          message,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reportId: data?.id }, { status: 201 });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
