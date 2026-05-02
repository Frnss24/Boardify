"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  todo: [],
  doing: [],
  done: [],
};

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
  const [boardId, setBoardId] = useState<string | null>(null);
  const [boardName, setBoardName] = useState("My Board");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const totalTasks = useMemo(
    () => Object.values(tasks).reduce((acc, col) => acc + col.length, 0),
    [tasks]
  );

  const normalizeStatus = (status: string | null | undefined): ColumnType => {
    const normalized = (status || "").toLowerCase();
    if (normalized.includes("doing") || normalized.includes("progress")) return "doing";
    if (normalized.includes("done")) return "done";
    return "todo";
  };

  const formatDueDate = (dateValue: string | null): string => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "";
    const month = parsed.toLocaleString("en-US", { month: "short" });
    return `${month} ${parsed.getDate()}`;
  };

  const parseDueDateInput = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    let parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      const [monthName, dayText] = trimmed.split(" ");
      const monthIndex = monthMap[monthName];
      const dayValue = Number(dayText);
      if (monthIndex === undefined || Number.isNaN(dayValue)) return null;
      parsed = new Date(new Date().getFullYear(), monthIndex, dayValue);
    }

    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
  };

  const mapDbTaskToUi = (row: any): { column: ColumnType; task: Task } => {
    const column = normalizeStatus(row.status);
    const task: Task = {
      id: row.id,
      title: row.title || "Untitled",
      description: row.description || "No description provided.",
      priority: "Medium",
      category: "Development",
      assignees: row.assignee_id ? ["ME"] : ["--"],
      comments: 0,
      attachments: 0,
      dueDate: formatDueDate(row.due_date),
    };
    return { column, task };
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const sessionUser = session?.user;

        if (!sessionUser) {
          setLoadError("Session tidak ditemukan. Silakan login ulang.");
          setIsLoading(false);
          return;
        }

        setUserId(sessionUser.id);

        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('*')
          .eq('owner_id', sessionUser.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(1);

        if (boardsError) {
          throw new Error(boardsError.message || 'Gagal mengambil board');
        }

        let activeBoard = boardsData?.[0] ?? null;

        if (!activeBoard) {
          const { data: createdBoard, error: createBoardError } = await supabase
            .from('boards')
            .insert([
              {
                name: 'My Board',
                description: 'Personal task board',
                owner_id: sessionUser.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (createBoardError || !createdBoard) {
            throw new Error(createBoardError?.message || 'Gagal membuat board');
          }

          activeBoard = createdBoard;
        }

        if (!isMounted) return;

        setBoardId(activeBoard.id);
        setBoardName(activeBoard.name || 'My Board');

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('board_id', activeBoard.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (tasksError) {
          throw new Error(tasksError.message || 'Gagal mengambil task');
        }

        const nextTasks: Record<ColumnType, Task[]> = {
          todo: [],
          doing: [],
          done: [],
        };

        (tasksData || []).forEach((row: any) => {
          const mapped = mapDbTaskToUi(row);
          nextTasks[mapped.column].push(mapped.task);
        });

        setTasks(nextTasks);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memuat data';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const openModal = useCallback((column: ColumnType = "todo") => {
    setDefaultColumn(column);
    setModalOpen(true);
  }, []);

  const handleAddTask = async (task: Task, column: ColumnType) => {
    if (!boardId) return;

    const { data: createdTask, error: createError } = await supabase
      .from('tasks')
      .insert([
        {
          board_id: boardId,
          assignee_id: userId,
          title: task.title,
          description: task.description,
          status: column,
          due_date: parseDueDateInput(task.dueDate),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError || !createdTask) {
      console.error('Failed to create task:', createError?.message || 'Unknown error');
      return;
    }

    const mapped = mapDbTaskToUi(createdTask);
    setTasks((prev) => ({
      ...prev,
      [mapped.column]: [mapped.task, ...prev[mapped.column]],
    }));
  };

  const handleMoveTask = useCallback(async (taskId: string, from: ColumnType, to: ColumnType) => {
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

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: to, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (updateError) {
      console.error('Failed to update task status:', updateError.message);
    }
  }, []);

  const completed  = tasks.done.length;
  const inProgress = tasks.doing.length;
  const pending    = tasks.todo.length;
  const totalCount = completed + inProgress + pending;

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
              {activeView === "board" ? boardName : activeView === "timeline" ? "Sprint Timeline" : "Task History Reports"}
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
              animate={{ width: totalCount ? `${(completed / totalCount) * 100}%` : "0%" }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)" }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap" style={{ fontWeight: 500 }}>
            {totalCount ? Math.round((completed / totalCount) * 100) : 0}% complete
          </span>
        </div>
      </div>

      {/* Board view — pakai filteredTasks supaya search bekerja */}
      {activeView === "board" && (
        <div className="flex-1 px-6 pb-8">
          <DndProvider backend={HTML5Backend}>
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading tasks...</div>
            ) : loadError ? (
              <div className="text-sm text-red-500">{loadError}</div>
            ) : (
            <div className="flex gap-4 h-full" style={{ alignItems: "flex-start" }}>
              {(["todo", "doing", "done"] as ColumnType[]).map((col) => (
                <KanbanColumn
                  key={col}
                  type={col}
                  tasks={filteredTasks[col]}
                  onAddTask={openModal}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={(id) => {
                    void (async () => {
                      const { error: deleteError } = await supabase
                        .from('tasks')
                        .update({ deleted_at: new Date().toISOString() })
                        .eq('id', id);

                      if (deleteError) {
                        console.error('Failed to delete task:', deleteError.message);
                        return;
                      }

                      setTasks((prev) => ({
                        todo: prev.todo.filter((t) => t.id !== id),
                        doing: prev.doing.filter((t) => t.id !== id),
                        done: prev.done.filter((t) => t.id !== id),
                      }));
                    })();
                  }}
                  onDeleteTaskPermanently={(id) => {
                    void (async () => {
                      const { error: deleteError } = await supabase
                        .from('tasks')
                        .delete()
                        .eq('id', id);

                      if (deleteError) {
                        console.error('Failed to permanently delete task:', deleteError.message);
                        return;
                      }

                      setTasks((prev) => ({
                        todo: prev.todo.filter((t) => t.id !== id),
                        doing: prev.doing.filter((t) => t.id !== id),
                        done: prev.done.filter((t) => t.id !== id),
                      }));
                    })();
                  }}
                  onEditTask={(task) => {
                    console.log("Edit task:", task);
                  }}
                />
              ))}
            </div>
            )}
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