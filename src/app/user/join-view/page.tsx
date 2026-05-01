"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface TaskJoinRow {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  board_id: string;
  board_name: string;
  assignee_id: string;
  assignee_name: string;
}

export default function JoinViewPage() {
  const [tasks, setTasks] = useState<TaskJoinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Query dengan JOIN: tasks → boards + users
        const { data, error: err } = await supabase
          .from("tasks")
          .select(
            `
            id,
            title,
            description,
            status,
            due_date,
            board_id,
            assignee_id,
            boards(id, name),
            users(id, name)
          `
          )
          .order("due_date", { ascending: true });

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        // Transform data supaya sesuai interface
        const transformed = data?.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          due_date: row.due_date || "-",
          board_id: row.boards?.id || "-",
          board_name: row.boards?.name || "No Board",
          assignee_id: row.users?.id || "-",
          assignee_name: row.users?.name || "Unassigned",
        })) || [];

        setTasks(transformed);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "linear-gradient(135deg, #f5f6fa 0%, #eef0f8 50%, #f0eef8 100%)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Task Join View</h1>
          <p className="text-gray-500 mt-2">Query JOIN dari tabel tasks → boards + users</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">Task</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">Board</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">Assignee</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate">{task.description || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700" style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                          {task.board_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{task.assignee_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-2 py-1 rounded-lg text-white text-xs font-semibold"
                          style={{
                            background:
                              task.status === "done"
                                ? "#10b981"
                                : task.status === "doing"
                                  ? "#f59e0b"
                                  : "#6366f1",
                          }}
                        >
                          {task.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{task.due_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Total tasks: <span className="font-semibold text-gray-700">{tasks.length}</span></p>
        </div>
      </div>
    </div>
  );
}
