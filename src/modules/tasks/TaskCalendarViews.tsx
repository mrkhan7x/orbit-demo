import { Plus } from "lucide-react";
import {
  startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameDay,
  startOfMonth, endOfMonth, getDay
} from "date-fns";
import type { Task } from "@/types";
import { cn } from "@/utils/cn";
import { useTaskStore } from "@/stores/taskStore";

const PRIORITY_DOT: Record<string, string> = {
  critical: "#f87171", high: "#fb923c", medium: "#fbbf24", low: "#60a5fa",
};
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Week Calendar ──────────────────────────────────────────
export function WeekCalendar({ tasks, onSelectTask, selectedTaskId, onNewTask }: {
  tasks: Task[];
  onSelectTask: (id: string) => void;
  selectedTaskId: string | null;
  onNewTask: () => void;
}) {
  const { toggleTask } = useTaskStore();
  const now = new Date();
  const weekDays = eachDayOfInterval({
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });

  const tasksByDate = (date: Date) =>
    tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date + "T00:00:00"), date));

  return (
    <div className="pt-2">
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        {/* Header */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className={cn(
            "text-center py-2 bg-[var(--bg-card)]",
            isToday(day) && "bg-[var(--accent-muted)]"
          )}>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{format(day, "EEE")}</p>
            <p className={cn("text-lg font-bold mt-0.5",
              isToday(day) ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
            )}>
              {format(day, "d")}
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">{format(day, "MMM")}</p>
          </div>
        ))}

        {/* Task cells */}
        {weekDays.map(day => {
          const dayTasks = tasksByDate(day);
          return (
            <div key={`c-${day.toISOString()}`} className={cn(
              "min-h-[200px] p-1.5 bg-[var(--bg-card)] flex flex-col gap-1",
              isToday(day) && "bg-[var(--accent-muted)]"
            )}>
              {dayTasks.map(task => {
                const isDone = task.status === "completed";
                return (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition-all group border",
                      selectedTaskId === task.id
                        ? "border-[var(--accent)]/50 bg-[var(--accent-muted)]"
                        : "border-transparent hover:bg-white/5",
                      isDone && "opacity-40"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_DOT[task.priority] }} />
                      <span className={cn("truncate font-medium", isDone && "line-through text-[var(--text-muted)]")}>
                        {task.title}
                      </span>
                    </div>
                  </button>
                );
              })}
              <button onClick={onNewTask} className="flex items-center gap-1 px-2 py-1 text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mt-auto">
                <Plus size={8} /> Add
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month Calendar ─────────────────────────────────────────
export function MonthCalendar({ tasks, onSelectTask, selectedTaskId, onNewTask }: {
  tasks: Task[];
  onSelectTask: (id: string) => void;
  selectedTaskId: string | null;
  onNewTask: () => void;
}) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd2 = endOfMonth(now);
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd2 });
  const firstDayOfWeek = getDay(monthStart); // 0 = Sun

  const tasksByDate = (date: Date) =>
    tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date + "T00:00:00"), date));

  return (
    <div className="pt-2">
      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[var(--text-muted)] py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        {/* Empty leading cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="min-h-[80px] bg-[var(--bg-card)]" />
        ))}

        {allDays.map(day => {
          const dayTasks = tasksByDate(day);
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className={cn(
              "min-h-[80px] p-1 bg-[var(--bg-card)]",
              today && "bg-[var(--accent-muted)]"
            )}>
              <div className="flex items-center justify-between mb-0.5 px-0.5">
                <span className={cn(
                  "w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold",
                  today ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)]"
                )}>
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[8px] font-bold text-[var(--text-muted)]">{dayTasks.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={cn(
                      "w-full text-left px-1 py-0.5 rounded text-[8px] truncate flex items-center gap-1",
                      selectedTaskId === task.id ? "bg-[var(--accent-muted)]" : "hover:bg-white/5",
                      task.status === "completed" && "opacity-40 line-through"
                    )}
                    style={{ color: PRIORITY_DOT[task.priority] }}
                  >
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ background: PRIORITY_DOT[task.priority] }} />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[7px] text-[var(--text-muted)] px-1">+{dayTasks.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
