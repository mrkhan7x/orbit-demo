import { useState } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { useHabitStore } from "@/stores/habitStore";
import { useProjectStore } from "@/stores/projectStore";
import { ChevronLeft, ChevronRight, Plus, Flame, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Task } from "@/types";
import { format, isToday as isTodayFn } from "date-fns";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#f87171", high: "#fb923c", medium: "#fbbf24", low: "#60a5fa",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "#f87171", in_progress: "#7c6fff", pending: "#fbbf24",
  completed: "#4ade80", delayed: "#f97316", on_hold: "#a78bfa",
};

export function CalendarPage() {
  const { tasks, toggleTask, setCreateModal, createModalOpen } = useTaskStore();
  const { habits, logs } = useHabitStore();
  const { projects } = useProjectStore();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }
  function goToday() { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = format(today, "yyyy-MM-dd");

  // Map tasks by date
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    if (!t.due_date) return acc;
    const key = t.due_date.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  // Habit completion per date
  const getHabitCompletion = (dateStr: string) => {
    if (habits.length === 0) return null;
    const done = logs.filter(l => l.date === dateStr && l.completed === 1).length;
    return { done, total: habits.length };
  };

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : [];
  const selectedHabits = selectedDate ? getHabitCompletion(selectedDate) : null;

  function formatDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <div className="flex-1 flex flex-col p-6 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Calendar</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{MONTH_NAMES[currentMonth]} {currentYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-all">
              Today
            </button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-1 shrink-0">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--text-muted)]">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px flex-1 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[90px] bg-[var(--bg-card)]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateStr(currentYear, currentMonth, day);
            const dayTasks = tasksByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const habitInfo = getHabitCompletion(dateStr);
            const completedTasks = dayTasks.filter(t => t.status === "completed").length;
            const hasOverdue = dayTasks.some(t => t.is_overdue);

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={cn(
                  "min-h-[90px] p-1.5 cursor-pointer transition-all border-b border-r border-transparent",
                  isSelected ? "bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]/30" : "bg-[var(--bg-card)] hover:bg-white/[0.03]",
                )}
              >
                {/* Day number + indicators */}
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                    isToday ? "bg-[var(--accent)] text-white" :
                    isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                  )}>
                    {day}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasOverdue && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Overdue" />}
                    {habitInfo && habitInfo.done > 0 && (
                      <span className={cn(
                        "text-[8px] font-bold px-1 rounded",
                        habitInfo.done === habitInfo.total ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                      )}>
                        {habitInfo.done}/{habitInfo.total}
                      </span>
                    )}
                  </div>
                </div>
                {/* Task pills */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id}
                      className={cn("flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate", t.status === "completed" && "opacity-40 line-through")}
                      style={{ background: `${PRIORITY_COLORS[t.priority]}12`, color: PRIORITY_COLORS[t.priority] }}
                    >
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[t.priority] }} />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[9px] text-[var(--text-muted)] px-1">+{dayTasks.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      {selectedDate && (
        <div className="w-80 shrink-0 flex flex-col overflow-y-auto border-l border-white/5 bg-[var(--bg-card)]">
          <div className="p-4 border-b border-white/5">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}
              {selectedHabits && ` · ${selectedHabits.done}/${selectedHabits.total} habits`}
            </p>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Tasks */}
            <div>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tasks</p>
              {selectedTasks.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-3">No tasks this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedTasks.map((t) => {
                    const proj = projects.find(p => p.id === t.project_id);
                    const isCompleted = t.status === "completed";
                    return (
                      <div key={t.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-white/5 group">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }}
                            className={cn(
                              "w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center mt-0.5 transition-all",
                              isCompleted ? "bg-green-500 border-green-500" : "border-white/20 hover:border-[var(--accent)]"
                            )}
                          >
                            {isCompleted && (
                              <svg viewBox="0 0 10 8" className="w-2.5 h-2.5">
                                <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", isCompleted ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
                              {t.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[t.priority] }} />
                              <span className="text-[10px] capitalize" style={{ color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                              <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status] }}>
                                {t.status === "not_started" ? "To Do" : t.status === "in_progress" ? "Doing" : t.status === "completed" ? "Done" : t.status}
                              </span>
                              {proj && (
                                <span className="text-[10px] text-[var(--accent)]">{proj.icon} {proj.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Habits for this day */}
            {habits.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Habits</p>
                <div className="space-y-1.5">
                  {habits.map(h => {
                    const log = logs.find(l => l.habit_id === h.id && l.date === selectedDate);
                    const done = log?.completed === 1;
                    return (
                      <div key={h.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{h.icon || "✨"}</span>
                          <span className={cn("text-xs font-medium", done ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]")}>
                            {h.name}
                          </span>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded flex items-center justify-center",
                          done ? "bg-[var(--accent)] text-white" : "border border-white/20"
                        )}>
                          {done && <CheckCircle2 size={10} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
