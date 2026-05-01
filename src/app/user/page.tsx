"use client";

import { useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion } from "motion/react"; 
import { Filter, SlidersHorizontal, LayoutGrid, List, LogOut } from "lucide-react"; 
import { NavBar } from "../components/NavBar";
import { KanbanColumn, ColumnType } from "../components/KanbanColumn";
import { NewTaskModal } from "../components/NewTaskModal";
import { Task } from "../components/TaskCard";

// impor buat fungsi Logout
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// Data dummy 
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

export default function UserDashboard() {
  const router = useRouter(); // <-- Siapin router buat pindah halaman
  const [tasks, setTasks] = useState<Record<ColumnType, Task[]>>(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultColumn, setDefaultColumn] = useState<ColumnType>("todo");
  const [viewMode] = useState<"grid" | "list">("grid");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // fungsi logout user
  const handleLogout = async () => {
    // Hapus cookie demo auth
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

  const completed = tasks.done.length;
  const inProgress = tasks.doing.length;
  const pending = tasks.todo.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #f5f6fa 0%, #eef0f8 50%, #f0eef8 100%)" }}>
      {/* Nav */}
      <NavBar onNewTask={() => openModal("todo")} />

      {/* Board header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600" style={{ fontWeight: 600 }}>Active Board</span>
            </div>
            <h1 className="text-gray-900" style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
              Q2 Product Sprint
            </h1>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.8rem" }}>
              {totalTasks} total tasks · {completed} completed · {inProgress} in progress · {pending} pending
            </p>
          </div>

          {/* Toolbar & Logout */}
          <div className="flex items-center gap-2">
            {/* Stats pills */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              {[
                { label: "Pending", count: pending, color: "#6366f1", bg: "#eef2ff" },
                { label: "Active", count: inProgress, color: "#f59e0b", bg: "#fffbeb" },
                { label: "Done", count: completed, color: "#10b981", bg: "#f0fdf4" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                  style={{ background: stat.bg, color: stat.color, fontWeight: 600 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: stat.color }} />
                  {stat.count} {stat.label}
                </div>
              ))}
            </div>

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

            {/* TOMBOL LOGOUT MERAH */}
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

      {/* Kanban board */}
      <div className="flex-1 px-6 pb-8">
        <DndProvider backend={HTML5Backend}>
          <div className="flex gap-4 h-full" style={{ alignItems: "flex-start" }}>
            {(["todo", "doing", "done"] as ColumnType[]).map((col) => (
              <KanbanColumn
                key={col}
                type={col}
                tasks={tasks[col]}
                onAddTask={openModal}
                onMoveTask={handleMoveTask}
              />
            ))}
          </div>
        </DndProvider>
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        open={modalOpen}
        defaultColumn={defaultColumn}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTask}
      />
    </div>
  );
}