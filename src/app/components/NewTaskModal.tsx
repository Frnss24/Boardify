import { useState } from "react";
import { X, Flag, Tag, User, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Priority, Category, Task } from "./TaskCard";
import { ColumnType } from "./KanbanColumn";

interface NewTaskModalProps {
  open: boolean;
  defaultColumn?: ColumnType;
  onClose: () => void;
  onAdd: (task: Task, column: ColumnType) => void;
}

const priorities: Priority[] = ["High", "Medium", "Low"];
const categories: Category[] = ["Design", "Development", "Marketing", "Research", "QA", "DevOps"];
const columns: { value: ColumnType; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
];

const priorityColors: Record<Priority, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
};

const categoryColors: Record<Category, string> = {
  Design: "#8b5cf6",
  Development: "#3b82f6",
  Marketing: "#ec4899",
  Research: "#14b8a6",
  QA: "#f97316",
  DevOps: "#6366f1",
};

export function NewTaskModal({ open, defaultColumn = "todo", onClose, onAdd }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [category, setCategory] = useState<Category>("Development");
  const [column, setColumn] = useState<ColumnType>(defaultColumn);
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "No description provided.",
      priority,
      category,
      assignees: ["JS"],
      comments: 0,
      attachments: 0,
      dueDate: dueDate || "Apr 30",
    };
    onAdd(newTask, column);
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setCategory("Development");
    setDueDate("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(15,15,30,0.3)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.16), 0 8px 24px rgba(99,102,241,0.12)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 700 }}>Create New Task</h2>
                  <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.78rem" }}>Fill in the details below to add a task</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="h-px bg-gray-100 mx-6" />

              {/* Form */}
              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Task Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Design new landing page..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "#f8f9fc",
                      border: title ? "1.5px solid #6366f1" : "1.5px solid transparent",
                      color: "#1f2937",
                      boxShadow: title ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a short description..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{
                      background: "#f8f9fc",
                      border: "1.5px solid transparent",
                      color: "#1f2937",
                    }}
                  />
                </div>

                {/* Row: Priority + Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      <Flag size={11} /> Priority
                    </label>
                    <div className="flex flex-col gap-1">
                      {priorities.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
                          style={{
                            background: priority === p ? `${priorityColors[p]}15` : "#f8f9fc",
                            border: priority === p ? `1.5px solid ${priorityColors[p]}40` : "1.5px solid transparent",
                            color: priority === p ? priorityColors[p] : "#6b7280",
                            fontWeight: priority === p ? 600 : 400,
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: priorityColors[p] }} />
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      <Tag size={11} /> Category
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCategory(c)}
                          className="px-2 py-1 rounded-lg text-xs transition-all"
                          style={{
                            background: category === c ? `${categoryColors[c]}15` : "#f8f9fc",
                            border: category === c ? `1.5px solid ${categoryColors[c]}40` : "1.5px solid transparent",
                            color: category === c ? categoryColors[c] : "#6b7280",
                            fontWeight: category === c ? 600 : 400,
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row: Column + Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      <User size={11} /> Column
                    </label>
                    <select
                      value={column}
                      onChange={(e) => setColumn(e.target.value as ColumnType)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "#f8f9fc", border: "1.5px solid transparent", color: "#374151" }}
                    >
                      {columns.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      <Calendar size={11} /> Due Date
                    </label>
                    <input
                      type="text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="e.g. May 15"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "#f8f9fc", border: "1.5px solid transparent", color: "#374151" }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: title.trim() ? "0 2px 8px rgba(99,102,241,0.35)" : "none",
                  }}
                >
                  Create Task
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
