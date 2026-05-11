import { useState, useEffect } from "react";
import { X, Calendar, Flag, Tag, Trash2, CheckCircle2, FolderOpen, Target, Plus } from "lucide-react";
import type { Project } from "@/services/projectService";
import { useProjectStore } from "@/stores/projectStore";
import { useTaskStore } from "@/stores/taskStore";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { ProgressBar } from "@/components/ui/Progress";

const STATUS_OPTIONS: { value: Project["status"]; label: string; color: string }[] = [
  { value: "active",    label: "Doing",     color: "#4ade80" },
  { value: "planned",   label: "Planned",   color: "#60a5fa" },
  { value: "on_hold",   label: "On Hold",   color: "#fbbf24" },
  { value: "completed", label: "Done",      color: "#a78bfa" },
];

interface ProjectDetailPanelProps {
  project: Project;
  onClose: () => void;
}

export function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const { updateProject, deleteProject } = useProjectStore();
  const { tasks, createTask, toggleTask } = useTaskStore();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || "");
  }, [project.id, project.name, project.description]);

  const saveName = () => {
    if (name.trim() && name !== project.name) updateProject(project.id, { name: name.trim() });
  };
  const saveDescription = () => {
    if (description !== (project.description || "")) updateProject(project.id, { description });
  };

  // Project tasks
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const todoTasks = projectTasks.filter(t => t.status !== "completed");
  const doneTasks = projectTasks.filter(t => t.status === "completed");
  const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

  const statusInfo = STATUS_OPTIONS.find(s => s.value === project.status);

  // Quick add task to this project
  const handleAddTask = async () => {
    const title = prompt("New task name:");
    if (!title?.trim()) return;
    await createTask({ title: title.trim(), project_id: project.id });
  };

  return (
    <div className="w-[420px] shrink-0 h-full overflow-y-auto border-l border-white/5 bg-[var(--bg-card)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[var(--bg-card)] border-b border-white/5">
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
        >
          <X size={16} />
        </button>
        <button
          onClick={async () => { if (confirm("Delete this project?")) { await deleteProject(project.id); onClose(); } }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Icon + Name */}
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-1">{project.icon}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            className="flex-1 text-xl font-bold bg-transparent text-[var(--text-primary)] outline-none"
            placeholder="Project name..."
          />
        </div>

        {/* Properties Grid */}
        <div className="space-y-0 border border-white/5 rounded-xl overflow-hidden">
          {/* Status */}
          <div className="flex items-center border-b border-white/5">
            <div className="w-36 px-3 py-2.5 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-white/[0.02] shrink-0">
              <CheckCircle2 size={12} /> Status
            </div>
            <div className="flex-1 px-3 py-1.5">
              <select
                value={project.status}
                onChange={(e) => updateProject(project.id, { status: e.target.value as Project["status"] })}
                className="bg-transparent text-xs font-medium outline-none cursor-pointer w-full"
                style={{ color: statusInfo?.color }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Deadline */}
          <div className="flex items-center border-b border-white/5">
            <div className="w-36 px-3 py-2.5 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-white/[0.02] shrink-0">
              <Calendar size={12} /> Target Deadline
            </div>
            <div className="flex-1 px-3 py-1.5">
              <input
                type="date"
                value={project.deadline || ""}
                onChange={(e) => updateProject(project.id, { deadline: e.target.value || undefined })}
                className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center border-b border-white/5">
            <div className="w-36 px-3 py-2.5 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-white/[0.02] shrink-0">
              <Target size={12} /> Progress
            </div>
            <div className="flex-1 px-3 py-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">{progress}%</span>
              <div className="flex-1">
                <ProgressBar value={progress} size="sm" color="accent" />
              </div>
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center border-b border-white/5">
            <div className="w-36 px-3 py-2.5 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-white/[0.02] shrink-0">
              <Tag size={12} /> Color
            </div>
            <div className="flex-1 px-3 py-1.5 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: project.color }} />
              <span className="text-xs text-[var(--text-muted)]">{project.color}</span>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-center">
            <div className="w-36 px-3 py-2.5 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-white/[0.02] shrink-0">
              <Calendar size={12} /> Created
            </div>
            <div className="flex-1 px-3 py-1.5 text-xs text-[var(--text-muted)]">
              {format(new Date(project.created_at), "MMMM d, yyyy")}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Description</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            placeholder="Add project details..."
            rows={3}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-white/5 rounded-lg p-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Tasks Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[var(--text-primary)]">Tasks</p>
            <button
              onClick={handleAddTask}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
            >
              <Plus size={12} /> New
            </button>
          </div>

          {projectTasks.length === 0 ? (
            <div className="text-center py-6 text-xs text-[var(--text-muted)]">
              No Tasks Created
            </div>
          ) : (
            <div className="space-y-4">
              {/* To Do */}
              {todoTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">To Do</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{todoTasks.length}</span>
                  </div>
                  <div className="space-y-1">
                    {todoTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="w-4 h-4 rounded border-2 border-white/20 hover:border-[var(--accent)] shrink-0 transition-colors"
                        />
                        <span className="text-sm text-[var(--text-primary)] truncate flex-1">{task.title}</span>
                        {task.due_date && (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {format(new Date(task.due_date + "T00:00:00"), "MMM d")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddTask}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Plus size={10} /> New task
                  </button>
                </div>
              )}

              {/* Done */}
              {doneTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Done</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{doneTasks.length}</span>
                  </div>
                  <div className="space-y-1">
                    {doneTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors opacity-50">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="w-4 h-4 rounded bg-green-500 border-2 border-green-500 flex items-center justify-center shrink-0"
                        >
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className="text-sm text-[var(--text-muted)] line-through truncate flex-1">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
