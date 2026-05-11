import { cn } from "@/utils/cn";
import type { Priority, Status } from "@/types";

// ─── Priority Badge ───────────────────────────────────────
const priorityConfig: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  high:     { label: "High",     color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  medium:   { label: "Medium",   color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  low:      { label: "Low",      color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
};

// ─── Status Badge ─────────────────────────────────────────
const statusConfig: Record<Status, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "bg-white/5 text-[var(--text-muted)] border-white/10" },
  pending:     { label: "Pending",     color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  in_progress: { label: "In Progress", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  on_hold:     { label: "On Hold",     color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  delayed:     { label: "Delayed",     color: "bg-red-500/15 text-red-400 border-red-500/20" },
  completed:   { label: "Completed",   color: "bg-green-500/15 text-green-400 border-green-500/20" },
};

interface BadgeProps {
  type?: "priority" | "status" | "custom";
  priority?: Priority;
  status?: Status;
  label?: string;
  color?: string;
  className?: string;
}

export function Badge({ type = "custom", priority, status, label, color, className }: BadgeProps) {
  let cfg = { label: label ?? "", color: color ?? "bg-white/5 text-[var(--text-secondary)] border-white/10" };

  if (type === "priority" && priority) cfg = priorityConfig[priority];
  if (type === "status" && status) cfg = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border",
        cfg.color,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── Days Left Badge (replaces Excel formula column) ──────
interface DaysLeftBadgeProps {
  daysLeft?: number;
  isCompleted?: boolean;
  className?: string;
}

export function DaysLeftBadge({ daysLeft, isCompleted, className }: DaysLeftBadgeProps) {
  if (isCompleted) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-green-400", className)}>
        ✓ Done
      </span>
    );
  }
  if (daysLeft === undefined) return null;

  if (daysLeft < 0) {
    return (
      <span className={cn("inline-flex items-center text-xs font-medium text-red-400", className)}>
        {Math.abs(daysLeft)}d overdue
      </span>
    );
  }
  if (daysLeft === 0) {
    return <span className={cn("text-xs font-medium text-yellow-400", className)}>Due today</span>;
  }
  if (daysLeft <= 7) {
    return <span className={cn("text-xs font-medium text-yellow-400", className)}>{daysLeft}d left</span>;
  }
  return (
    <span className={cn("text-xs text-[var(--text-muted)]", className)}>{daysLeft}d left</span>
  );
}
