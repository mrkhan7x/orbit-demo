import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Flag, Tag, AlignLeft } from "lucide-react";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import type { Priority } from "@/types";
import { cn } from "@/utils/cn";
import { format, addDays } from "date-fns";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "#f87171" },
  { value: "high",     label: "High",     color: "#fb923c" },
  { value: "medium",   label: "Medium",   color: "#fbbf24" },
  { value: "low",      label: "Low",      color: "#60a5fa" },
];

const CATEGORIES = [
  "Finances", "Self-Development", "Business", "Automation",
  "Health", "Personal", "Work", "Study",
];

export function TaskModal({ open, onClose }: TaskModalProps) {
  const createTask = useTaskStore((s) => s.createTask);
  const { projects } = useProjectStore();
  const [title, setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate]   = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle(""); setDescription(""); setPriority("medium");
    setDueDate(format(new Date(), "yyyy-MM-dd")); setCategory(""); setProjectId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        category: category || undefined,
        project_id: projectId || undefined,
        assigned_to: "Romeo",
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">New Task</h2>
                <button type="button" onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all">
                  <X size={15} />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Title */}
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task name…"
                  className="w-full text-base font-medium bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none border-b border-white/8 pb-2"
                />

                {/* Description */}
                <div className="flex gap-2">
                  <AlignLeft size={14} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add description…"
                    rows={2}
                    className="flex-1 text-sm bg-transparent text-[var(--text-secondary)] placeholder-[var(--text-muted)] outline-none resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Flag size={13} className="text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">Priority</span>
                  </div>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value} type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium border transition-all",
                          priority === p.value ? "opacity-100" : "opacity-40 hover:opacity-70"
                        )}
                        style={{
                          background: priority === p.value ? `${p.color}20` : "transparent",
                          borderColor: priority === p.value ? p.color : "rgba(255,255,255,0.1)",
                          color: p.color,
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due Date + Category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar size={13} className="text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-muted)]">Due Date</span>
                    </div>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/8 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                      style={{ colorScheme: "dark" }}
                    />
                    <div className="flex gap-1 mt-1.5">
                      {[
                        { label: "Today", date: format(new Date(), "yyyy-MM-dd") },
                        { label: "Tomorrow", date: format(addDays(new Date(), 1), "yyyy-MM-dd") },
                        { label: "+1 Week", date: format(addDays(new Date(), 7), "yyyy-MM-dd") },
                        { label: "None", date: "" },
                      ].map((opt) => (
                        <button
                          key={opt.label} type="button"
                          onClick={() => setDueDate(opt.date)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                            dueDate === opt.date ? "bg-[var(--accent)] text-white" : "bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Tag size={13} className="text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-muted)]">Category</span>
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/8 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">None</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Project */}
                {projects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Tag size={13} className="text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-muted)]">Project</span>
                    </div>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/8 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">No project</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={!title.trim() || submitting}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
                    style={{ background: "var(--accent)" }}
                  >
                    {submitting ? "Creating…" : "Create Task"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
