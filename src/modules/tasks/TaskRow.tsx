import { useState } from "react";
import { Trash2, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

interface TaskRowProps {
  task: Task;
  index: number;
  projectInfo?: { name: string; icon: string } | null;
  onSelect?: () => void;
  isSelected?: boolean;
}

const PRIORITY_DOT: Record<string, string> = {
  critical: "#f87171",
  high:     "#fb923c",
  medium:   "#fbbf24",
  low:      "#60a5fa",
};

export function TaskRow({ task, index, projectInfo, onSelect, isSelected }: TaskRowProps) {
  const { toggleTask, deleteTask } = useTaskStore();
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : deleting ? 0 : 1,
  };

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    await toggleTask(task.id);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await deleteTask(task.id);
  }

  const isCompleted = task.status === "completed";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors duration-150 cursor-pointer",
        isSelected ? "bg-[var(--accent-muted)] border border-[var(--accent)]/30" :
        hovered ? "bg-white/5" : "bg-transparent",
        isCompleted && "opacity-50",
        isDragging && "shadow-lg ring-2 ring-[var(--accent)]/30 rounded-xl"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes} {...listeners}
        className={cn(
          "w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing shrink-0 transition-opacity",
          hovered ? "opacity-60" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} />
      </button>

      {/* Priority dot */}
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_DOT[task.priority] }} />

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all",
          isCompleted ? "bg-green-500 border-green-500" : "border-white/20 hover:border-[var(--accent)]"
        )}
      >
        {isCompleted && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Title */}
      <span className={cn(
        "flex-1 text-sm text-[var(--text-primary)] truncate",
        isCompleted && "line-through text-[var(--text-muted)]"
      )}>
        {task.title}
      </span>

      {/* Meta */}
      <div className={cn(
        "flex items-center gap-2 transition-opacity shrink-0",
        hovered ? "opacity-100" : task.due_date || task.category || projectInfo ? "opacity-60" : "opacity-0"
      )}>
        {projectInfo && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--accent-muted)] text-[10px] font-medium text-[var(--accent)]">
            {projectInfo.icon} {projectInfo.name}
          </span>
        )}
        {task.category && <Badge label={task.category} className="text-[10px]" />}
        <Badge type="priority" priority={task.priority} />
        {task.due_date && (
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
            {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className={cn(
          "w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0",
          hovered ? "opacity-100" : "opacity-0"
        )}
        title="Delete task"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
