import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { type SharePermission, verifyShareCode } from '@/lib/share';

type JoinShareBody = {
  shareCode?: string;
  permission?: SharePermission;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JoinShareBody;
    const { shareCode, permission } = body;

    if (!verifyShareCode(shareCode) || !permission) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id, members')
      .eq('share_code', shareCode)
      .maybeSingle();

    if (boardError || !boardData) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const members = Array.isArray(boardData.members) ? boardData.members : [];
    const existingIndex = members.findIndex((member: any) => member.user_id === user.id);
    const nextMember = {
      user_id: user.id,
      permission,
      joined_at: new Date().toISOString(),
    };

    const nextMembers = existingIndex >= 0
      ? members.map((member: any, index: number) => (index === existingIndex ? nextMember : member))
      : [...members, nextMember];

    const { error: updateError } = await supabase
      .from('boards')
      .update({ members: nextMembers })
      .eq('id', boardData.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, boardId: boardData.id });
  } catch (error) {
    console.error('Share join error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
