import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const toDateKey = (value: string) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      const yyyy = parsed.getUTCFullYear();
      const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const lastDays = (days: number) => {
      const keys: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        keys.push(`${yyyy}-${mm}-${dd}`);
      }
      return keys;
    };

    const startOfWeek = (date: Date) => {
      const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      const day = d.getUTCDay();
      const diff = (day + 6) % 7;
      d.setUTCDate(d.getUTCDate() - diff);
      return d;
    };

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [tasksResult, usersResult, boardsResult, reportsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, assignee_id, created_at, updated_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('boards')
        .select('id, owner_id, created_at, updated_at')
        .is('deleted_at', null),
      supabase
        .from('reports')
        .select('id, title, message, status, decision_note, created_at, reporter_email')
        .order('created_at', { ascending: false }),
    ]);

    if (tasksResult.error) {
      return NextResponse.json({ error: tasksResult.error.message }, { status: 500 });
    }

    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
    }

    if (boardsResult.error) {
      return NextResponse.json({ error: boardsResult.error.message }, { status: 500 });
    }

    if (reportsResult.error) {
      return NextResponse.json({ error: reportsResult.error.message }, { status: 500 });
    }

    const tasks = tasksResult.data ?? [];
    const users = usersResult.data ?? [];
    const boards = boardsResult.data ?? [];
    const reports = reportsResult.data ?? [];

    const dailyActiveUsers = new Set(
      tasks
        .filter((task) => {
          const activityTime = task.updated_at || task.created_at;
          return activityTime ? new Date(activityTime) >= oneDayAgo : false;
        })
        .map((task) => task.assignee_id)
        .filter(Boolean)
    ).size;

    const weeklyActiveUsers = new Set(
      tasks
        .filter((task) => {
          const activityTime = task.updated_at || task.created_at;
          return activityTime ? new Date(activityTime) >= sevenDaysAgo : false;
        })
        .map((task) => task.assignee_id)
        .filter(Boolean)
    ).size;

    const activeWorkspaces = new Set(boards.map((board) => board.id)).size;

    const taskKeys = lastDays(7);
    const createdCount = Object.fromEntries(taskKeys.map((key) => [key, 0]));
    const completedCount = Object.fromEntries(taskKeys.map((key) => [key, 0]));

    for (const task of tasks) {
      if (task.created_at) {
        const createdKey = toDateKey(task.created_at);
        if (createdKey && createdKey in createdCount) {
          createdCount[createdKey] += 1;
        }
      }

      const status = String(task.status || '').toLowerCase();
      if (status.includes('done')) {
        const completedAt = task.updated_at || task.created_at;
        const doneKey = completedAt ? toDateKey(completedAt) : null;
        if (doneKey && doneKey in completedCount) {
          completedCount[doneKey] += 1;
        }
      }
    }

    const taskTrends = taskKeys.map((key) => ({
      date: key,
      created: createdCount[key],
      completed: completedCount[key],
    }));

    const signupByWeek: Record<string, number> = {};
    for (const user of users) {
      if (!user.created_at) continue;
      const createdAt = new Date(user.created_at);
      if (Number.isNaN(createdAt.getTime())) continue;
      const weekStart = startOfWeek(createdAt).toISOString().slice(0, 10);
      signupByWeek[weekStart] = (signupByWeek[weekStart] || 0) + 1;
    }

    const signupTrend = Object.entries(signupByWeek)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([weekStart, signups]) => ({ weekStart, signups }));

    const retainedUserIds = new Set(
      tasks
        .filter((task) => {
          const activityTime = task.updated_at || task.created_at;
          return activityTime ? new Date(activityTime) >= thirtyDaysAgo : false;
        })
        .map((task) => task.assignee_id)
        .filter(Boolean)
    );

    const retentionRate30d = users.length
      ? Number(((retainedUserIds.size / users.length) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      tasks: tasks.slice(0, 6),
      users,
      reports: reports.slice(0, 20),
      metrics: {
        dailyActiveUsers,
        weeklyActiveUsers,
        activeWorkspaces,
      },
      taskTrends,
      growth: {
        signupTrend,
        retentionRate30d,
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
