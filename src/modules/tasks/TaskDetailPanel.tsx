import { useState, useEffect } from "react";
import { X, Calendar, Flag, Tag, AlignLeft, FolderOpen, Clock, Trash2, CheckCircle2, Plus, ListTodo, Repeat } from "lucide-react";
import type { Task, Priority, Status } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/utils/cn";
import { format } from "date-fns";

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "not_started", label: "To Do",       color: "#f87171" },
  { value: "in_progress", label: "Doing",       color: "#7c6fff" },
  { value: "pending",     label: "Pending",     color: "#fbbf24" },
  { value: "completed",   label: "Done",        color: "#4ade80" },
  { value: "delayed",     label: "Delayed",     color: "#f87171" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "#f87171" },
  { value: "high",     label: "High",     color: "#fb923c" },
  { value: "medium",   label: "Medium",   color: "#fbbf24" },
  { value: "low",      label: "Low",      color: "#60a5fa" },
];

const CATEGORIES = [
  "Finances", "Self-Development", "Business", "Automation",
  "Health", "Personal", "Work", "Study",
];

const RECURRENCE_OPTIONS = [
  { value: "", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const { tasks, updateTask, deleteTask, createTask, toggleTask } = useTaskStore();
  const { projects } = useProjectStore();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setNotes(task.notes || "");
  }, [task.id, task.title, task.description, task.notes]);

  const saveTitle = () => {
    if (title.trim() && title !== task.title) updateTask(task.id, { title: title.trim() });
  };
  const saveDescription = () => {
    if (description !== (task.description || "")) updateTask(task.id, { description });
  };
  const saveNotes = () => {
    if (notes !== (task.notes || "")) updateTask(task.id, { notes });
  };

  // Sub-tasks: tasks where parent_id === this task's id
  const subTasks = tasks.filter(t => t.parent_id === task.id);
  const subDone = subTasks.filter(t => t.status === "completed").length;
  const subProgress = subTasks.length > 0 ? Math.round((subDone / subTasks.length) * 100) : 0;

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await createTask({
      title: newSubtask.trim(),
      parent_id: task.id,
      project_id: task.project_id,
      priority: "medium",
    });
    setNewSubtask("");
  };

  const statusInfo = STATUS_OPTIONS.find(s => s.value === task.status);

  return (
    <div className="w-[400px] shrink-0 h-full overflow-y-auto border-l border-white/5 bg-[var(--bg-card)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[var(--bg-card)] border-b border-white/5">
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5">
          <X size={16} />
        </button>
        <button onClick={async () => { await deleteTask(task.id); onClose(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10" title="Delete task">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Title */}
        <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle}
          className="w-full text-xl font-bold bg-transparent text-[var(--text-primary)] outline-none" placeholder="Task name..." />

        {/* Properties Grid */}
        <div className="space-y-0 border border-white/5 rounded-xl overflow-hidden">
          {/* Status */}
          <PropertyRow icon={CheckCircle2} label="Status">
            <select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as Status })}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer w-full" style={{ color: statusInfo?.color }}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </PropertyRow>

          {/* Project */}
          <PropertyRow icon={FolderOpen} label="Project">
            <select value={task.project_id || ""} onChange={(e) => updateTask(task.id, { project_id: e.target.value || undefined })}
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full">
              <option value="">Empty</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
            </select>
          </PropertyRow>

          {/* Due Date */}
          <PropertyRow icon={Calendar} label="Due">
            <input type="date" value={task.due_date || ""} onChange={(e) => updateTask(task.id, { due_date: e.target.value || undefined })}
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full" style={{ colorScheme: "dark" }} />
          </PropertyRow>

          {/* Priority */}
          <PropertyRow icon={Flag} label="Priority">
            <select value={task.priority} onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full">
              {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </PropertyRow>

          {/* Category */}
          <PropertyRow icon={Tag} label="Category">
            <select value={task.category || ""} onChange={(e) => updateTask(task.id, { category: e.target.value || undefined })}
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full">
              <option value="">Empty</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </PropertyRow>

          {/* Recurrence */}
          <PropertyRow icon={Repeat} label="Recurrence">
            <select value={task.recurrence || ""} onChange={(e) => updateTask(task.id, { recurrence: e.target.value || undefined })}
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full">
              {RECURRENCE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </PropertyRow>

          {/* Created */}
          <PropertyRow icon={Clock} label="Created" isLast>
            <span className="text-xs text-[var(--text-muted)]">
              {task.created_at ? format(new Date(task.created_at), "MMMM d, yyyy") : "—"}
            </span>
          </PropertyRow>
        </div>

        {/* Sub-tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ListTodo size={13} className="text-[var(--text-muted)]" />
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Sub-tasks</span>
            </div>
            {subTasks.length > 0 && (
              <span className="text-[10px] font-bold text-[var(--accent)]">{subDone}/{subTasks.length} · {subProgress}%</span>
            )}
          </div>

          {subTasks.length > 0 && (
            <div className="mb-2 h-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${subProgress}%` }} />
            </div>
          )}

          <div className="space-y-1 mb-2">
            {subTasks.map(st => (
              <div key={st.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                <button onClick={() => toggleTask(st.id)}
                  className={cn("w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all",
                    st.status === "completed" ? "bg-green-500 border-green-500" : "border-white/20 hover:border-[var(--accent)]")}>
                  {st.status === "completed" && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2.5">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={cn("text-sm flex-1 truncate", st.status === "completed" ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
                  {st.title}
                </span>
                <button onClick={() => deleteTask(st.id)}
                  className="text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Add sub-task input */}
          <div className="flex items-center gap-2">
            <Plus size={12} className="text-[var(--text-muted)] shrink-0" />
            <input
              value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
              placeholder="Add sub-task..."
              className="flex-1 text-xs bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none py-1.5"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlignLeft size={13} className="text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Description</span>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={saveDescription}
            placeholder="Add a description..." rows={3}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-white/5 rounded-lg p-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none focus:border-[var(--accent)] transition-colors" />
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlignLeft size={13} className="text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Notes</span>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes}
            placeholder="Add notes, comments..." rows={4}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-white/5 rounded-lg p-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none focus:border-[var(--accent)] transition-colors" />
        </div>

        {/* Metadata */}
        <div className="text-[10px] text-[var(--text-muted)] space-y-1 pt-4 border-t border-white/5">
          <p>ID: {task.id}</p>
          {task.updated_at && <p>Last edited: {format(new Date(task.updated_at), "MMM d, yyyy h:mm a")}</p>}
        </div>
      </div>
    </div>
  );
}

function PropertyRow({ icon: Icon, label, children, isLast }: { icon: React.ElementType; label: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <div className={cn("flex items-center", !isLast && "border-b border-white/5")}>
      <div className="w-32 px-3 py-2.5 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-white/[0.02] shrink-0">
        <Icon size={12} /> {label}
      </div>
      <div className="flex-1 px-3 py-1.5">{children}</div>
    </div>
  );
}
