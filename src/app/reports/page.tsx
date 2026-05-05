"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface TaskReportRow {
  task_id: string;
  task_title: string;
  task_description: string;
  task_status: string;
  priority: string;
  due_date: string;
  board_id: string;
  board_name: string;
  assignee_id: string;
  assignee_name: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Pastikan user terautentikasi
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (!userId) {
          setError("Not authenticated. Please sign in to view reports.");
          setLoading(false);
          return;
        }

        // Ambil data dari VIEW Supabase (LEFT JOIN: tasks, boards, users)
        const { data, error: err } = await supabase
          .from("task_join_view")
          .select("*")
          .is("deleted_at", null)
          .order("due_date", { ascending: true });

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        // Transform field sesuai dengan view columns
        const transformed =
          data?.map((row: any) => ({
            task_id: row.task_id,
            task_title: row.task_title,
            task_description: row.task_description,
            task_status: row.task_status,
            priority: row.priority || "Medium",
            due_date: row.due_date || "-",
            board_id: row.board_id || "-",
            board_name: row.board_name || "No Board",
            assignee_id: row.assignee_id || "-",
            assignee_name: row.assignee_name || "Unassigned",
            board_owner_id: row.board_owner_id || row.owner_id || null,
          })) || [];

        // Cek peran user — jika admin, tampilkan semua; bukan admin -> filter
        let isAdmin = false;
        try {
          const { data: userRec } = await supabase
            .from("users")
            .select("role")
            .eq("id", userId)
            .single();
          if (userRec && (userRec as any).role === "admin") isAdmin = true;
        } catch (e) {
          // gagal ambil role -> asumsikan non-admin
        }

        const visible = isAdmin
          ? transformed
          : transformed.filter(
              (t: any) =>
                t.assignee_id === userId || t.board_owner_id === userId
            );

        setTasks(visible);
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

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("done")) return "bg-green-100 text-green-800";
    if (s.includes("doing") || s.includes("progress"))
      return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const p = (priority || "Medium").toLowerCase();
    if (p.includes("high")) return "bg-red-100 text-red-800";
    if (p.includes("low")) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800"; // Medium
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "rgba(250,250,250,0.5)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-200 rounded-lg transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Task Reports</h1>
          <p className="text-gray-500 text-sm">
            View all tasks across boards ({tasks.length} total)
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Priority</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Board</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Assignee</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Due Date</th>
              <th className="px-6 py-3 font-semibold text-gray-700">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.task_id}
                  className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {task.task_title}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        task.task_status
                      )}`}
                    >
                      {task.task_status || "unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {task.board_name}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {task.assignee_name}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{task.due_date}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {task.task_description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {
              tasks.filter((t) =>
                (t.task_status || "").toLowerCase().includes("doing")
              ).length
            }
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {
              tasks.filter((t) =>
                (t.task_status || "").toLowerCase().includes("done")
              ).length
            }
          </p>
        </div>
      </div>
    </div>
  );
}
