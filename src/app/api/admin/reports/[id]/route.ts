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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('reports')
      .update({
        status: normalizedStatus,
        decision_note: decision_note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
