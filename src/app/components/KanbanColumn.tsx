import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useDrop } from "react-dnd";
import { useCallback } from "react";
import { TaskCard, Task } from "./TaskCard";

export type ColumnType = "todo" | "doing" | "done";

interface ColumnConfig {
  label: string;
  accent: string;
  bg: string;
  dotColor: string;
  countBg: string;
  countColor: string;
  headerBg: string;
}

const columnConfigs: Record<ColumnType, ColumnConfig> = {
  todo: {
    label: "To Do",
    accent: "#6366f1",
    bg: "#eef2ff",
    dotColor: "#6366f1",
    countBg: "#eef2ff",
    countColor: "#6366f1",
    headerBg: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
  },
  doing: {
    label: "Doing",
    accent: "#f59e0b",
    bg: "#fffbeb",
    dotColor: "#f59e0b",
    countBg: "#fffbeb",
    countColor: "#d97706",
    headerBg: "linear-gradient(135deg, #fffbeb, #fef3c7)",
  },
  done: {
    label: "Done",
    accent: "#10b981",
    bg: "#f0fdf4",
    dotColor: "#10b981",
    countBg: "#f0fdf4",
    countColor: "#059669",
    headerBg: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
  },
};

interface KanbanColumnProps {
  type: ColumnType;
  tasks: Task[];
  onAddTask: (column: ColumnType) => void;
  onMoveTask?: (taskId: string, from: ColumnType, to: ColumnType) => void;
  onDeleteTask?: (id: string) => void;
  onDeleteTaskPermanently?: (id: string) => void;
  onEditTask?: (task: Task) => void;
}

export function KanbanColumn({ type, tasks, onAddTask, onMoveTask, onDeleteTask, onDeleteTaskPermanently, onEditTask }: KanbanColumnProps) {
  const config = columnConfigs[type];

  const handleDrop = useCallback((item: any) => {
    const fromColumn = item.from as ColumnType | undefined;
    if (item.id && typeof item.id === "string" && onMoveTask && fromColumn) {
      onMoveTask(item.id, fromColumn, type);
    }
  }, [type, onMoveTask]);

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: "TASK",
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: handleDrop,
  }), [handleDrop]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: type === "todo" ? 0 : type === "doing" ? 0.08 : 0.16 }}
      className="flex flex-col rounded-2xl min-w-[300px] flex-1"
      style={{
        background: isOver ? "#f0f0ff" : "#f8f9fc",
        border: isOver ? "1px solid #6366f1" : "1px solid rgba(0,0,0,0.05)",
        transition: "background 0.2s, border 0.2s",
      }}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 rounded-t-2xl"
        style={{ background: config.headerBg }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: config.dotColor }} />
          <h3 className="text-gray-700" style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {config.label}
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: config.countBg, color: config.countColor, fontWeight: 600, border: `1px solid ${config.accent}22` }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(type)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
          style={{ background: "white", color: config.accent, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: `${config.accent}18` }} />

      {/* Cards scroll area */}
      <div
        ref={dropRef as any}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-3"
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            column={type}
            onDelete={onDeleteTask}
            onDeletePermanently={onDeleteTaskPermanently}
            onEdit={onEditTask}
            onMove={(id, to) => onMoveTask?.(id, type, to)}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: config.bg }}>
              <Plus size={18} style={{ color: config.accent }} />
            </div>
            <p className="text-gray-400 text-sm">No tasks yet</p>
            <button
              onClick={() => onAddTask(type)}
              className="mt-2 text-xs underline underline-offset-2 transition-colors hover:opacity-70"
              style={{ color: config.accent }}
            >
              Add a task
            </button>
          </div>
        )}

        {tasks.length > 0 && (
          <button
            onClick={() => onAddTask(type)}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 hover:opacity-80"
            style={{ color: config.accent, background: config.bg, border: `1.5px dashed ${config.accent}44` }}
          >
            <Plus size={15} />
            Add task
          </button>
        )}
      </div>
    </motion.div>
  );
}