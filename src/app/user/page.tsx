"use client";

import { useState, useCallback, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion } from "motion/react"; 
import { Filter, SlidersHorizontal, LayoutGrid, List, LogOut, CalendarClock, History } from "lucide-react"; 
import { NavBar, UserView } from "../components/NavBar";
import { KanbanColumn, ColumnType } from "../components/KanbanColumn";
import { NewTaskModal } from "../components/NewTaskModal";
import { Task } from "../components/TaskCard";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const initialTasks: Record<ColumnType, Task[]> = {
  todo: [
    {
      id: "t1",
      title: "Design new landing page",
      description: "Create a modern and conversion-focused landing page for the Q3 product launch.",
      priority: "High",
      category: "Design",
      assignees: ["Jamie", "Sara"],
      comments: 5,
      attachments: 3,
      dueDate: "May 2",
    },
    {
      id: "t2",
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions to automate testing and deployment workflows.",
      priority: "Medium",
      category: "DevOps",
      assignees: ["Alex"],
      comments: 2,
      attachments: 1,
      dueDate: "May 5",
      progress: 20,
    },
    {
      id: "t3",
      title: "Write API documentation",
      description: "Document all REST endpoints with request/response examples using OpenAPI spec.",
      priority: "Low",
      category: "Development",
      assignees: ["Jamie"],
      comments: 0,
      attachments: 0,
      dueDate: "May 10",
    },
    {
      id: "t4",
      title: "User onboarding flow",
      description: "Design and implement a step-by-step onboarding experience for new users.",
      priority: "High",
      category: "Design",
      assignees: ["Sara", "Mia"],
      comments: 8,
      attachments: 4,
      dueDate: "Apr 28",
    },
  ],
  doing: [
    {
      id: "d1",
      title: "Implement auth system",
      description: "Integrate OAuth 2.0 with Google and GitHub providers using NextAuth.",
      priority: "High",
      category: "Development",
      assignees: ["Alex", "Jamie"],
      comments: 12,
      attachments: 2,
      dueDate: "Apr 26",
      progress: 65,
    },
    {
      id: "d2",
      title: "Dashboard analytics",
      description: "Build real-time analytics charts with Recharts showing key product metrics.",
      priority: "Medium",
      category: "Development",
      assignees: ["Mia"],
      comments: 4,
      attachments: 1,
      dueDate: "Apr 29",
      progress: 40,
    },
    {
      id: "d3",
      title: "Mobile responsive fixes",
      description: "Address layout issues on smaller screens across the main app views.",
      priority: "Low",
      category: "QA",
      assignees: ["Sara"],
      comments: 6,
      attachments: 0,
      dueDate: "Apr 27",
      progress: 80,
    },
  ],
  done: [
    {
      id: "dn1",
      title: "Database schema design",
      description: "Defined normalized PostgreSQL schema for users, teams, and projects tables.",
      priority: "Medium",
      category: "Development",
      assignees: ["Alex"],
      comments: 7,
      attachments: 2,
      dueDate: "Apr 18",
      progress: 100,
    },
    {
      id: "dn2",
      title: "Project setup & config",
      description: "Initialized the monorepo with Vite, Tailwind, and all shared packages.",
      priority: "Low",
      category: "DevOps",
      assignees: ["Jamie"],
      comments: 3,
      attachments: 1,
      dueDate: "Apr 15",
      progress: 100,
    },
    {
      id: "dn3",
      title: "Wireframe approval",
      description: "Presented and received sign-off on all key screens from stakeholders.",
      priority: "High",
      category: "Design",
      assignees: ["Sara", "Mia"],
      comments: 14,
      attachments: 8,
      dueDate: "Apr 20",
      progress: 100,
    },
  ],
};

const totalTasks = Object.values(initialTasks).reduce((acc, col) => acc + col.length, 0);

const monthMap: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDueDate(label: string): Date {
  const [monthName, dayText] = label.split(" ");
  const month = monthMap[monthName] ?? 0;
  const day = Number(dayText) || 1;
  return new Date(new Date().getFullYear(), month, day);
}

function diffInDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function UserDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Record<ColumnType, Task[]>>(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultColumn, setDefaultColumn] = useState<ColumnType>("todo");
  const [activeView, setActiveView] = useState<UserView>("board");
  const [viewMode] = useState<"grid" | "list">("grid");

  // ── SEARCH STATE (fitur tugasmu) ──────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  const filterTasks = (list: Task[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
    );
  };

  const filteredTasks = {
    todo:  filterTasks(tasks.todo),
    doing: filterTasks(tasks.doing),
    done:  filterTasks(tasks.done),
  };
  // ─────────────────────────────────────────────────────────────

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    document.cookie = 'boardify_demo_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const openModal = useCallback((column: ColumnType = "todo") => {
    setDefaultColumn(column);
    setModalOpen(true);
  }, []);

  const handleAddTask = (task: Task, column: ColumnType) => {
    setTasks((prev) => ({
      ...prev,
      [column]: [task, ...prev[column]],
    }));
  };

  const handleMoveTask = useCallback((taskId: string, from: ColumnType, to: ColumnType) => {
    if (from === to) return;
    setTasks((prev) => {
      const fromList = prev[from].filter((t) => t.id !== taskId);
      const moved = prev[from].find((t) => t.id === taskId);
      if (!moved) return prev;
      return {
        ...prev,
        [from]: fromList,
        [to]: [moved, ...prev[to]],
      };
    });
  }, []);

  const completed  = tasks.done.length;
  const inProgress = tasks.doing.length;
  const pending    = tasks.todo.length;

  const timelineRows = useMemo(() => {
    const rows = (["todo", "doing", "done"] as ColumnType[])
      .flatMap((column) =>
        tasks[column].map((task) => ({
          ...task,
          status: column,
          due: parseDueDate(task.dueDate),
        }))
      )
      .sort((a, b) => a.due.getTime() - b.due.getTime());

    const anchor = rows.length > 0 ? new Date(rows[0].due) : new Date();
    anchor.setDate(anchor.getDate() - 2);

    return rows.map((row) => {
      const start  = Math.max(0, diffInDays(anchor, row.due) - 2);
      const length = row.status === "done" ? 3 : row.status === "doing" ? 5 : 4;
      return { ...row, start, length };
    });
  }, [tasks]);

  const reportRows = useMemo(() => {
    const statusLabel: Record<ColumnType, string> = {
      todo: "To Do",
      doing: "Doing",
      done: "Done",
    };

    return (["todo", "doing", "done"] as ColumnType[])
      .flatMap((column) =>
        tasks[column].map((task) => ({
          id: task.id,
          title: task.title,
          assignees: task.assignees.join(", "),
          priority: task.priority,
          category: task.category,
          dueDate: task.dueDate,
          status: statusLabel[column],
        }))
      )
      .sort((a, b) => parseDueDate(a.dueDate).getTime() - parseDueDate(b.dueDate).getTime());
  }, [tasks]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #f5f6fa 0%, #eef0f8 50%, #f0eef8 100%)" }}>
      {/* Nav — kirim searchQuery & onSearchChange */}
      <NavBar
        onNewTask={() => openModal("todo")}
        activeView={activeView}
        onViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Board header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600" style={{ fontWeight: 600 }}>
                {activeView === "board" ? "Active Board" : activeView === "timeline" ? "Gantt Timeline" : "Task Reports"}
              </span>
            </div>
            <h1 className="text-gray-900" style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
              {activeView === "board" ? "Q2 Product Sprint" : activeView === "timeline" ? "Sprint Timeline" : "Task History Reports"}
            </h1>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.8rem" }}>
              {activeView === "board"
                ? `${totalTasks} total tasks · ${completed} completed · ${inProgress} in progress · ${pending} pending`
                : activeView === "timeline"
                ? `Visual timeline for ${totalTasks} tasks across all statuses`
                : `Unified history from To Do, Doing, and Done (${totalTasks} tasks)`}
            </p>
          </div>

          {/* Toolbar & Logout */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-white transition-colors" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.7)" }}>
              <Filter size={14} />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-white transition-colors" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.7)" }}>
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Sort</span>
            </button>
            <div className="flex items-center rounded-xl overflow-hidden mr-2" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.7)" }}>
              <button className="flex items-center px-3 py-2 transition-colors" style={{ background: viewMode === "grid" ? "white" : "transparent", color: viewMode === "grid" ? "#6366f1" : "#9ca3af" }}>
                <LayoutGrid size={15} />
              </button>
              <button className="flex items-center px-3 py-2 transition-colors" style={{ background: viewMode === "list" ? "white" : "transparent", color: viewMode === "list" ? "#6366f1" : "#9ca3af" }}>
                <List size={15} />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-red-600 font-bold hover:bg-red-50 transition-colors"
              style={{ border: "1px solid rgba(239, 68, 68, 0.2)", background: "white" }}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completed / (pending + inProgress + completed)) * 100}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)" }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap" style={{ fontWeight: 500 }}>
            {Math.round((completed / (pending + inProgress + completed)) * 100)}% complete
          </span>
        </div>
      </div>

      {/* Board view — pakai filteredTasks supaya search bekerja */}
      {activeView === "board" && (
        <div className="flex-1 px-6 pb-8">
          <DndProvider backend={HTML5Backend}>
            <div className="flex gap-4 h-full" style={{ alignItems: "flex-start" }}>
              {(["todo", "doing", "done"] as ColumnType[]).map((col) => (
                <KanbanColumn
                  key={col}
                  type={col}
                  tasks={filteredTasks[col]}
                  onAddTask={openModal}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={(id) => {
                    setTasks((prev) => ({
                      todo: prev.todo.filter((t) => t.id !== id),
                      doing: prev.doing.filter((t) => t.id !== id),
                      done: prev.done.filter((t) => t.id !== id),
                    }));
                  }}
                  onEditTask={(task) => {
                    console.log("Edit task:", task);
                  }}
                />
              ))}
            </div>
          </DndProvider>
        </div>
      )}

      {/* Timeline view — tidak berubah sama sekali */}
      {activeView === "timeline" && (
        <div className="flex-1 px-6 pb-8">
          <div className="rounded-2xl bg-white border border-gray-100 p-5" style={{ boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)" }}>
            <div className="flex items-center gap-2 mb-4 text-gray-700" style={{ fontWeight: 600 }}>
              <CalendarClock size={18} />
              Gantt Timeline
            </div>
            <div className="space-y-3">
              {timelineRows.map((item) => (
                <div key={`${item.status}-${item.id}`} className="grid grid-cols-[210px_1fr] gap-3 items-center">
                  <div className="pr-2">
                    <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 600 }}>{item.title}</p>
                    <p className="text-xs text-gray-400">{item.status.toUpperCase()} • due {item.dueDate}</p>
                  </div>
                  <div className="h-8 rounded-lg relative overflow-hidden" style={{ background: "linear-gradient(90deg, #f8fafc, #f1f5f9)" }}>
                    <div
                      className="absolute top-1 bottom-1 rounded-md flex items-center px-2 text-[11px] text-white"
                      style={{
                        left: `${item.start * 3.1}%`,
                        width: `${item.length * 3.1}%`,
                        minWidth: "68px",
                        background:
                          item.status === "done"
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : item.status === "doing"
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : "linear-gradient(135deg, #6366f1, #4f46e5)",
                      }}
                    >
                      {item.priority}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reports view — tidak berubah sama sekali */}
      {activeView === "reports" && (
        <div className="flex-1 px-6 pb-8">
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden" style={{ boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)" }}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 text-gray-800" style={{ fontWeight: 700 }}>
              <History size={18} />
              All Task History
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-3">Task</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Assignees</th>
                    <th className="px-5 py-3">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/70">
                      <td className="px-5 py-3 text-sm text-gray-800" style={{ fontWeight: 600 }}>{row.title}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{row.status}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{row.priority}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{row.category}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{row.assignees}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{row.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <NewTaskModal
        open={modalOpen}
        defaultColumn={defaultColumn}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTask}
      />
    </div>
  );
}