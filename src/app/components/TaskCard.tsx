import { useState } from "react";
import { useDrag } from "react-dnd";
import { MoreHorizontal, MessageSquare, Paperclip, Calendar } from "lucide-react";
import { motion } from "motion/react";

export type Priority = "High" | "Medium" | "Low";
export type Category = "Design" | "Development" | "Marketing" | "Research" | "QA" | "DevOps";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  assignees: string[];
  comments: number;
  attachments: number;
  dueDate: string;
  progress?: number;
}

const priorityConfig: Record<Priority, { color: string; bg: string; dot: string }> = {
  High: { color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  Medium: { color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  Low: { color: "#10b981", bg: "#f0fdf4", dot: "#10b981" },
};

const categoryConfig: Record<Category, { color: string; bg: string }> = {
  Design: { color: "#8b5cf6", bg: "#f5f3ff" },
  Development: { color: "#3b82f6", bg: "#eff6ff" },
  Marketing: { color: "#ec4899", bg: "#fdf2f8" },
  Research: { color: "#14b8a6", bg: "#f0fdfa" },
  QA: { color: "#f97316", bg: "#fff7ed" },
  DevOps: { color: "#6366f1", bg: "#eef2ff" },
};

const avatarColors = [
  "linear-gradient(135deg, #818cf8, #6366f1)",
  "linear-gradient(135deg, #34d399, #10b981)",
  "linear-gradient(135deg, #fb923c, #f97316)",
  "linear-gradient(135deg, #f472b6, #ec4899)",
  "linear-gradient(135deg, #60a5fa, #3b82f6)",
];

interface TaskCardProps {
  task: Task;
  index: number;
  column?: import("./KanbanColumn").ColumnType;
}

export function TaskCard({ task, index, column }: TaskCardProps) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "TASK",
    item: { id: task.id, from: column },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [task.id, column]);

  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const priority = priorityConfig[task.priority];
  const category = categoryConfig[task.category];

  return (
    <motion.div
      ref={dragRef as any}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      className="relative bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200"
      style={{
        opacity: isDragging ? 0.4 : 1,
        boxShadow: hovered
          ? "0 8px 24px rgba(0,0,0,0.09), 0 2px 8px rgba(99,102,241,0.08)"
          : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        border: hovered ? "1px solid rgba(99,102,241,0.12)" : "1px solid rgba(0,0,0,0.05)",
      }}
    >
      {/* Top row: category + priority + menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ color: category.color, background: category.bg, fontWeight: 500 }}
          >
            {task.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
            style={{ color: priority.color, background: priority.bg, fontWeight: 500 }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: priority.dot }} />
            {task.priority}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
            style={{
              background: hovered ? "#f5f6fa" : "transparent",
              opacity: hovered ? 1 : 0,
            }}
          >
            <MoreHorizontal size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div
          className="absolute right-4 top-10 bg-white rounded-xl py-1 z-20 min-w-[140px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          {["Edit Task", "Move To Doing", "Move To Done", "Delete"].map((item) => (
            <button
              key={item}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              style={{ color: item === "Delete" ? "#ef4444" : "#374151" }}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-gray-900 mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600, lineHeight: "1.4" }}>
        {task.title}
      </h4>

      {/* Description */}
      <p className="text-gray-400 mb-4 line-clamp-2" style={{ fontSize: "0.75rem", lineHeight: "1.5" }}>
        {task.description}
      </p>

      {/* Progress bar (if exists) */}
      {task.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-medium text-gray-600">{task.progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${task.progress}%`,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {/* Assignee avatars */}
        <div className="flex items-center -space-x-2">
          {task.assignees.map((assignee, i) => (
            <div
              key={assignee}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white ring-2 ring-white"
              style={{ background: avatarColors[i % avatarColors.length], fontSize: "0.6rem", fontWeight: 600 }}
              title={assignee}
            >
              {assignee[0]}
            </div>
          ))}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={11} />
              {task.dueDate}
            </span>
          )}
          {task.comments > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare size={11} />
              {task.comments}
            </span>
          )}
          {task.attachments > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Paperclip size={11} />
              {task.attachments}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
