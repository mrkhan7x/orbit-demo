import { useEffect, useState } from "react";
import { Plus, Search, Sun, CalendarDays, CalendarRange, Inbox,
         Clock, CheckCircle2, AlertCircle, ListFilter, X, Repeat,
         FolderOpen, LayoutList } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { TaskRow } from "./TaskRow";
import { TaskModal } from "./TaskModal";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { Spinner } from "@/components/ui/Progress";
import { cn } from "@/utils/cn";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { WeekCalendar, MonthCalendar } from "./TaskCalendarViews";

// ─── View tab definition ─────────────────────────────────
type ViewId = "today" | "inbox" | "week" | "month" | "scheduled" | "no_due" | "recurring" | "active_projects" | "all" | "completed" | "overdue";

const VIEWS: { id: ViewId; label: string; icon: React.ElementType }[] = [
  { id: "today",           label: "Today",           icon: Sun },
  { id: "inbox",           label: "Inbox",           icon: Inbox },
  { id: "week",            label: "Week",            icon: CalendarDays },
  { id: "month",           label: "Month",           icon: CalendarRange },
  { id: "scheduled",       label: "Scheduled",       icon: CalendarDays },
  { id: "no_due",          label: "No Due",          icon: Clock },
  { id: "recurring",       label: "Recurring",       icon: Repeat },
  { id: "active_projects", label: "Active Projects", icon: FolderOpen },
  { id: "all",             label: "All",             icon: LayoutList },
  { id: "completed",       label: "Done",            icon: CheckCircle2 },
];

// ─── Group tasks by date for list display ─────────────────
function groupByDate(tasks: ReturnType<typeof useTaskStore.getState>["tasks"]) {
  const groups: Record<string, typeof tasks> = {};
  const noDate: typeof tasks = [];

  for (const t of tasks) {
    if (!t.due_date) { noDate.push(t); continue; }
    const dateKey = t.due_date.split("T")[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
  }

  const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  if (noDate.length) sorted.push(["no-date", noDate]);
  return sorted;
}

function formatGroupLabel(dateKey: string): string {
  if (dateKey === "no-date") return "No Date";
  const d = new Date(dateKey + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function TasksPage() {
  const {
    tasks, loading, filters, setFilters,
    createModalOpen, setCreateModal,
    selectedTaskId, setSelectedTask,
    getFilteredTasks, getStats,
  } = useTaskStore();
  const { projects } = useProjectStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const stats = getStats();

  // Apply view-level filtering
  const today = new Date().toISOString().split("T")[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const baseFiltered = getFilteredTasks();
  
  const filteredTasks = baseFiltered.filter((t) => {
    // Hide sub-tasks from the main list — they show inside their parent's detail panel
    if (t.parent_id) return false;
    const v = filters.view;
    if (v === "inbox") return !t.project_id;
    if (v === "week") return t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd;
    if (v === "month") return t.due_date && t.due_date >= monthStart && t.due_date <= monthEnd;
    if (v === "recurring") return !!t.recurrence;
    if (v === "active_projects") return !!t.project_id;
    return true;
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // DnD sensors — require 8px drag distance to avoid accidental drags
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredTasks.findIndex(t => t.id === active.id);
    const newIndex = filteredTasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    // Reorder is visual-only for now (position field already in DB for future persistence)
  }

  // Keyboard shortcut: N = new task
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)) {
        setCreateModal(true);
      }
      if (e.key === "Escape") {
        setSelectedTask(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCreateModal, setSelectedTask]);

  // Find project name for a task
  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const p = projects.find(pr => pr.id === projectId);
    return p ? { name: p.name, icon: p.icon } : null;
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <div className={cn("flex flex-col flex-1 min-w-0 overflow-hidden", selectedTask && "border-r border-white/5")}>
        {/* ── Page Header ─────────────────────────────── */}
        <div className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Tasks</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {stats.total} total · {stats.completed} done {stats.overdue > 0 && (
                  <span>· <span className="text-red-400">{stats.overdue} overdue</span></span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
              >
                <Search size={15} />
              </button>
              <button
                onClick={() => setCreateModal(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                <Plus size={14} />
                New Task
                <kbd className="ml-1 px-1 py-0.5 rounded text-[9px] bg-white/20 font-mono">N</kbd>
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
              <Search size={13} className="text-[var(--text-muted)] shrink-0" />
              <input
                autoFocus
                value={filters.search ?? ""}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Search tasks…"
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
              />
              <button onClick={() => { setFilters({ search: "" }); setSearchOpen(false); }}>
                <X size={13} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
              </button>
            </div>
          )}

          {/* ── View Tabs ── */}
          <div className="flex items-center gap-1 overflow-x-auto pb-3 scrollbar-hide">
            {VIEWS.map(({ id, label, icon: Icon }) => {
              const isActive = filters.view === id;
              const badgeCount =
                id === "overdue" ? stats.overdue :
                id === "today"   ? stats.dueToday : undefined;
              return (
                <button
                  key={id}
                  onClick={() => setFilters({ view: id })}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
                    isActive
                      ? "bg-[var(--bg-card)] text-[var(--text-primary)] border border-white/10"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
                  )}
                >
                  <Icon size={12} />
                  {label}
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span className={cn(
                      "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                      id === "overdue" ? "bg-red-500/20 text-red-400" : "bg-[var(--accent-muted)] text-[var(--accent)]"
                    )}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Task List ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="md" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle2 size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {filters.view === "today" ? "Nothing due today" :
                 filters.view === "overdue" ? "No overdue tasks 🎉" :
                 filters.view === "completed" ? "No completed tasks yet" :
                 filters.view === "inbox" ? "Inbox is empty" :
                 "No tasks"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Press <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-[10px]">N</kbd> to create one
              </p>
            </div>
          ) : filters.view === "week" ? (
              <WeekCalendar
                tasks={filteredTasks}
                onSelectTask={(id) => setSelectedTask(id)}
                selectedTaskId={selectedTaskId}
                onNewTask={() => setCreateModal(true)}
              />
            ) : filters.view === "month" ? (
              <MonthCalendar
                tasks={filteredTasks}
                onSelectTask={(id) => setSelectedTask(id)}
                selectedTaskId={selectedTaskId}
                onNewTask={() => setCreateModal(true)}
              />
            ) : filters.view === "scheduled" || filters.view === "all" ? (
              <div className="space-y-6 pt-2">
                {groupByDate(filteredTasks).map(([dateKey, dateTasks]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-1 px-4">
                      <CalendarRange size={12} className="text-[var(--text-muted)]" />
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        {formatGroupLabel(dateKey)}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] opacity-50">{dateTasks.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {dateTasks.map((task, i) => (
                        <TaskRow
                          key={task.id} task={task} index={i}
                          projectInfo={getProjectName(task.project_id)}
                          onSelect={() => setSelectedTask(task.id)}
                          isSelected={selectedTaskId === task.id}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Plus size={12} />
                      New task
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-0.5 pt-2">
                    {filteredTasks.map((task, i) => (
                      <TaskRow
                        key={task.id} task={task} index={i}
                        projectInfo={getProjectName(task.project_id)}
                        onSelect={() => setSelectedTask(task.id)}
                        isSelected={selectedTaskId === task.id}
                      />
                    ))}
                    <button
                      onClick={() => setCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Plus size={12} />
                      New task
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            )
          }
        </div>

        {/* ── Create Task Modal ─────────────────────── */}
        <TaskModal open={createModalOpen} onClose={() => setCreateModal(false)} />
      </div>

      {/* ── Task Detail Side Panel ─────────────────── */}
      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
