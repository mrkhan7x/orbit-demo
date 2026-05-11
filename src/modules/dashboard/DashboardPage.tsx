import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useHabitStore } from "@/stores/habitStore";
import { useGoalStore } from "@/stores/goalStore";
import { CheckSquare, Flame, Target, FolderOpen, Check, Rocket, TrendingUp, Clock } from "lucide-react";
import { format, subDays, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ProgressBar } from "@/components/ui/Progress";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: "#4ade80",
  planned: "#60a5fa",
  on_hold: "#fbbf24",
  completed: "#a78bfa",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { tasks, getStats, loadTasks } = useTaskStore();
  const { projects, loadProjects } = useProjectStore();
  const { habits, logs, loadHabits, loadLogs } = useHabitStore();
  const { goals, loadGoals } = useGoalStore();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadTasks();
    loadProjects();
    loadHabits();
    loadGoals();
    
    // Load logs for the current month so today's completion status is accurate
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
    loadLogs(start, end);
  }, [loadTasks, loadProjects, loadHabits, loadGoals, loadLogs]);

  const stats = getStats();

  // Project stats
  const activeProjects = projects.filter(p => p.status === "active");
  const plannedProjects = projects.filter(p => p.status === "planned");
  const completedProjects = projects.filter(p => p.status === "completed");

  // Velocity Chart Data (Last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, "MMM dd");
    const completedThatDay = tasks.filter(t => 
      t.status === "completed" && t.updated_at && isSameDay(new Date(t.updated_at), d)
    ).length;
    return { name: dateStr, completed: completedThatDay };
  });

  // Habit stats for today
  const habitsCompletedToday = logs.filter(l => l.date === todayStr && l.completed === 1).length;

  // Overall completion rate
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider mb-1">{getGreeting()}</p>
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">Command Center</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-white/5 text-xs">
            <span className="text-[var(--text-muted)]">Completion: </span>
            <span className="font-bold text-[var(--accent)]">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Tasks Done" value={stats.completed} sub={`${stats.total} total · ${stats.overdue} overdue`} icon={CheckSquare} color="var(--accent)" onClick={() => navigate("/tasks")} />
        <MetricCard label="Active Projects" value={activeProjects.length} sub={`${plannedProjects.length} planned · ${completedProjects.length} done`} icon={FolderOpen} color="#4ade80" onClick={() => navigate("/projects")} />
        <MetricCard label="Habits Today" value={`${habitsCompletedToday}/${habits.length}`} sub={habits.length > 0 ? `${Math.round((habitsCompletedToday / habits.length) * 100)}% consistency` : "No habits set"} icon={Flame} color="#f472b6" onClick={() => navigate("/habits")} />
        <MetricCard label="Goals" value={goals.filter(g => g.status === "completed").length} sub={`${goals.length} total · ${goals.filter(g => g.progress > 0 && g.progress < 100).length} in progress`} icon={Target} color="#fbbf24" onClick={() => navigate("/goals")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Velocity Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">7-Day Velocity</h3>
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <TrendingUp size={12} />
                <span>{chartData.reduce((a, b) => a + b.completed, 0)} tasks this week</span>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Pipeline */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Project Pipeline</h3>
              <button onClick={() => navigate("/projects")} className="text-xs text-[var(--accent)] hover:underline">View All</button>
            </div>
            {projects.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {projects.map(project => {
                  const pTasks = tasks.filter(t => t.project_id === project.id);
                  const pDone = pTasks.filter(t => t.status === "completed").length;
                  const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                  const statusColor = PROJECT_STATUS_COLORS[project.status] || "#7c6fff";

                  return (
                    <div key={project.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-transparent hover:border-white/10 transition-colors cursor-pointer" onClick={() => navigate(`/projects?id=${project.id}`)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{project.icon}</span>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: `${statusColor}20`, color: statusColor }}>
                            {project.status === "active" ? "Doing" : project.status === "planned" ? "Planned" : project.status === "on_hold" ? "On Hold" : "Done"}
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">{pct}%</span>
                        </div>
                      </div>
                      <ProgressBar value={pct} size="sm" color="accent" />
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{pDone}/{pTasks.length} tasks completed</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Upcoming Deadlines</h3>
              <button onClick={() => navigate("/tasks")} className="text-xs text-[var(--accent)] hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.due_date && t.status !== "completed").sort((a, b) => (a.due_date || "").localeCompare(b.due_date || "")).slice(0, 5).map(task => {
                const proj = projects.find(p => p.id === task.project_id);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)] border border-transparent hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'critical' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-400' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {proj && (
                        <span className="text-[10px] text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5 rounded">{proj.icon} {proj.name}</span>
                      )}
                      <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-1 rounded whitespace-nowrap">
                        {format(new Date(task.due_date! + "T00:00:00"), "MMM dd")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {tasks.filter(t => t.due_date && t.status !== "completed").length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today's Habits */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Today's Habits</h3>
              <button onClick={() => navigate("/habits")} className="text-xs text-[var(--accent)] hover:underline">Tracker</button>
            </div>
            <div className="space-y-2">
              {habits.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">No habits set. Build your routine!</p>
              ) : habits.map(habit => {
                const isCompleted = logs.find(l => l.habit_id === habit.id && l.date === todayStr)?.completed === 1;
                return (
                  <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] group">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{habit.icon || "✨"}</span>
                      <span className={`text-sm font-medium ${isCompleted ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                        {habit.name}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isCompleted ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "bg-transparent border-white/20 text-transparent"
                    }`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals Progress */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Goals</h3>
              <button onClick={() => navigate("/goals")} className="text-xs text-[var(--accent)] hover:underline">View All</button>
            </div>
            {goals.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">No goals defined</p>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 5).map(goal => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">{goal.title}</span>
                      <span className={`font-semibold ${goal.status === "completed" ? "text-[var(--success)]" : "text-[var(--text-primary)]"}`}>
                        {goal.progress}%
                      </span>
                    </div>
                    <ProgressBar value={goal.progress} size="sm" color={goal.status === "completed" ? "auto" : "accent"} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)] flex items-center gap-2"><Clock size={12} /> Due Today</span>
                <span className="font-bold text-[var(--text-primary)]">{stats.dueToday}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)] flex items-center gap-2"><Rocket size={12} /> Projects Active</span>
                <span className="font-bold text-[#4ade80]">{activeProjects.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)] flex items-center gap-2"><Target size={12} /> Projects Completed</span>
                <span className="font-bold text-[#a78bfa]">{completedProjects.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)] flex items-center gap-2"><FolderOpen size={12} /> Planned</span>
                <span className="font-bold text-[#60a5fa]">{plannedProjects.length}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}

function MetricCard({ label, value, sub, icon: Icon, color, onClick }: any) {
  return (
    <div className="card p-4 cursor-pointer hover:border-white/10 hover:-translate-y-0.5 transition-all" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">{sub}</p>
    </div>
  );
}
