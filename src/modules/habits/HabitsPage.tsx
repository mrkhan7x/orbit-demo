import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useHabitStore } from "@/stores/habitStore";
import { Check, Plus, Trash2, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isBefore } from "date-fns";

export function HabitsPage() {
  const { habits, logs, loadHabits, loadLogs, addHabit, toggleLog, removeHabit } = useHabitStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => { loadHabits(); }, [loadHabits]);

  useEffect(() => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    loadLogs(start, end);
  }, [currentMonth, loadLogs]);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Group habits by category
  const groupedHabits = habits.reduce<Record<string, typeof habits>>((acc, h) => {
    const cat = h.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(h);
    return acc;
  }, {});

  // Compute stats for a habit
  const getHabitStats = (habitId: string) => {
    const habitLogs = logs.filter(l => l.habit_id === habitId && l.completed === 1);
    const completedCount = habitLogs.length;
    const totalDays = monthDays.filter(d => isBefore(d, new Date()) || isToday(d)).length;
    const rate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

    // Current streak
    let streak = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    for (let i = monthDays.length - 1; i >= 0; i--) {
      const ds = format(monthDays[i], "yyyy-MM-dd");
      if (ds > today) continue;
      if (habitLogs.find(l => l.date === ds)) streak++;
      else break;
    }
    return { completedCount, rate, streak };
  };

  const handleAddHabit = (category: string) => {
    const name = prompt("Enter habit name:");
    if (!name?.trim()) return;
    const icon = prompt("Emoji icon (e.g. 🏋️):", "✨") || "✨";
    addHabit({ name: name.trim(), icon, category: category === "General" ? undefined : category, frequency: "daily" });
  };

  const handleAddNewCategory = () => {
    const category = prompt("Enter new section name (e.g., Morning Routine):");
    if (!category?.trim()) return;
    const name = prompt(`Enter first habit for "${category}":`);
    if (!name?.trim()) return;
    const icon = prompt("Emoji icon (e.g. 🏋️):", "✨") || "✨";
    addHabit({ name: name.trim(), icon, category: category.trim(), frequency: "daily" });
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Habit Tracker</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {habits.length} habits · {format(currentMonth, "MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-0.5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-[var(--text-primary)] w-28 text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="h-8 px-3 rounded-lg text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleAddNewCategory}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-all"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={14} /> New Section
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="card overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row: Habit Name | Day 1 | Day 2 | ... | Day 31 | Stats */}
          <div className="flex border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-10">
            <div className="w-56 p-2.5 font-semibold text-[10px] text-[var(--text-muted)] uppercase tracking-wider border-r border-[var(--border)] flex-shrink-0 sticky left-0 bg-[var(--bg-secondary)] z-20">
              Habits
            </div>
            <div className="flex">
              {monthDays.map((day) => {
                const isCurrentDay = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`w-9 flex flex-col items-center justify-center py-1.5 border-r border-[var(--border)] shrink-0 ${
                      isCurrentDay ? "bg-[var(--accent-muted)]" : ""
                    }`}
                  >
                    <span className="text-[8px] font-bold uppercase text-[var(--text-muted)]">{format(day, "EEEEE")}</span>
                    <span className={`text-[10px] font-bold mt-0.5 ${isCurrentDay ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Stats columns */}
            <div className="w-14 flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)] uppercase border-r border-[var(--border)] shrink-0">
              Done
            </div>
            <div className="w-14 flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)] uppercase border-r border-[var(--border)] shrink-0">
              Rate
            </div>
            <div className="w-14 flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">
              🔥
            </div>
          </div>

          {/* Content */}
          {Object.keys(groupedHabits).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Flame size={32} className="text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">No habits created yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Click "New Section" to start tracking</p>
            </div>
          ) : (
            <div>
              {Object.entries(groupedHabits).map(([category, catHabits]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="flex border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
                    <div className="w-56 p-2 pl-3 font-bold text-xs text-[var(--text-primary)] flex items-center justify-between border-r border-[var(--border)] flex-shrink-0 sticky left-0 bg-[var(--bg-app)] z-10 group">
                      <span className="uppercase tracking-wider text-[10px]">📂 {category}</span>
                      <button
                        onClick={() => handleAddHabit(category)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex">
                      {monthDays.map((day) => (
                        <div key={day.toISOString()} className={`w-9 border-r border-[var(--border)] shrink-0 ${isToday(day) ? "bg-[var(--accent-muted)]" : ""}`} />
                      ))}
                    </div>
                    <div className="w-14 border-r border-[var(--border)] shrink-0" />
                    <div className="w-14 border-r border-[var(--border)] shrink-0" />
                    <div className="w-14 shrink-0" />
                  </div>

                  {/* Habit Rows */}
                  {catHabits.map((habit) => {
                    const stats = getHabitStats(habit.id);
                    return (
                      <div key={habit.id} className="flex border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] transition-colors group/row">
                        <div className="w-56 p-2 pl-5 flex items-center justify-between border-r border-[var(--border)] flex-shrink-0 sticky left-0 bg-[var(--bg-app)] group-hover/row:bg-[rgba(255,255,255,0.02)] z-10">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-sm shrink-0">{habit.icon || "✨"}</span>
                            <span className="text-xs text-[var(--text-secondary)] truncate font-medium">{habit.name}</span>
                          </div>
                          <button
                            onClick={() => { if (confirm(`Delete "${habit.name}"?`)) removeHabit(habit.id); }}
                            className="text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        <div className="flex">
                          {monthDays.map((day) => {
                            const dateStr = format(day, "yyyy-MM-dd");
                            const log = logs.find(l => l.habit_id === habit.id && l.date === dateStr);
                            const isCompleted = log ? log.completed === 1 : false;
                            const isFuture = !isBefore(day, new Date()) && !isToday(day);
                            const isCurrent = isToday(day);

                            return (
                              <div
                                key={dateStr}
                                className={`w-9 h-9 flex items-center justify-center border-r border-[var(--border)] shrink-0 ${
                                  isCurrent ? "bg-[var(--accent-muted)]" : ""
                                }`}
                              >
                                <button
                                  onClick={() => !isFuture && toggleLog(habit.id, dateStr, !isCompleted)}
                                  disabled={isFuture}
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                    isCompleted
                                      ? "bg-[var(--accent)] text-white shadow-sm"
                                      : isFuture
                                        ? "bg-transparent border border-white/5 cursor-not-allowed"
                                        : "bg-transparent border border-white/10 text-transparent hover:border-[var(--accent)]/50"
                                  }`}
                                >
                                  {isCompleted && <Check size={10} strokeWidth={3} />}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Stats */}
                        <div className="w-14 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] border-r border-[var(--border)] shrink-0">
                          {stats.completedCount}
                        </div>
                        <div className="w-14 flex items-center justify-center shrink-0 border-r border-[var(--border)]">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            stats.rate >= 80 ? "bg-green-500/20 text-green-400" :
                            stats.rate >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                            stats.rate > 0 ? "bg-red-500/20 text-red-400" :
                            "text-[var(--text-muted)]"
                          }`}>
                            {stats.rate}%
                          </span>
                        </div>
                        <div className="w-14 flex items-center justify-center text-xs font-bold shrink-0">
                          {stats.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-orange-400">
                              <Flame size={10} /> {stats.streak}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
