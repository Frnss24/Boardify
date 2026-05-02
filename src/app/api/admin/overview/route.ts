import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [tasksResult, usersResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, assignee_id, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (tasksResult.error) {
      return NextResponse.json({ error: tasksResult.error.message }, { status: 500 });
    }

    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      tasks: tasksResult.data ?? [],
      users: usersResult.data ?? [],
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
