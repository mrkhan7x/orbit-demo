import { PageShell } from "@/components/layout/PageShell";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useGoalStore } from "@/stores/goalStore";
import { useHabitStore } from "@/stores/habitStore";
import { format, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  RadialBarChart, RadialBar,
} from "recharts";

const TASK_STATUS_COLORS: Record<string, { label: string; color: string }> = {
  not_started: { label: "To Do",       color: "#f87171" },
  in_progress: { label: "In Progress", color: "#7c6fff" },
  pending:     { label: "Pending",     color: "#fbbf24" },
  completed:   { label: "Done",        color: "#4ade80" },
  delayed:     { label: "Delayed",     color: "#f97316" },
  on_hold:     { label: "On Hold",     color: "#a78bfa" },
};

const PRIORITY_COLORS: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "#f87171" },
  high:     { label: "High",     color: "#fb923c" },
  medium:   { label: "Medium",   color: "#fbbf24" },
  low:      { label: "Low",      color: "#60a5fa" },
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Doing", planned: "Planned", on_hold: "On Hold", completed: "Done"
};

export function AnalyticsPage() {
  const { tasks, getStats } = useTaskStore();
  const { projects } = useProjectStore();
  const { goals } = useGoalStore();
  const { habits, logs } = useHabitStore();
  const stats = getStats();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // === Task Status Distribution ===
  const statusData = Object.entries(
    tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([key, val]) => ({
    name: TASK_STATUS_COLORS[key]?.label || key,
    value: val,
    fill: TASK_STATUS_COLORS[key]?.color || "#888",
  }));

  // === Task Priority Distribution ===
  const priorityData = Object.entries(
    tasks.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([key, val]) => ({
    name: PRIORITY_COLORS[key]?.label || key,
    value: val,
    fill: PRIORITY_COLORS[key]?.color || "#888",
  }));

  // === 14-Day Task Completion Trend ===
  const trendData = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    const created = tasks.filter(t => isSameDay(new Date(t.created_at), d)).length;
    const completed = tasks.filter(t => t.status === "completed" && t.updated_at && isSameDay(new Date(t.updated_at), d)).length;
    return { name: format(d, "MM/dd"), created, completed };
  });

  // === Project Pipeline ===
  const projectPipelineData = ["active", "planned", "on_hold", "completed"].map(status => ({
    name: PROJECT_STATUS_LABELS[status] || status,
    count: projects.filter(p => p.status === status).length,
    fill: status === "active" ? "#4ade80" : status === "planned" ? "#60a5fa" : status === "on_hold" ? "#fbbf24" : "#a78bfa",
  }));

  // === Goal Progress Overview ===
  const avgGoalProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;
  const goalRadialData = [{ name: "Goals", value: avgGoalProgress, fill: "var(--accent)" }];

  // === Habit Weekly Heatmap ===
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  const habitWeekData = weekDays.map(d => {
    const ds = format(d, "yyyy-MM-dd");
    const total = habits.length;
    const done = logs.filter(l => l.date === ds && l.completed === 1).length;
    return { name: format(d, "EEE"), done, total, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
  });

  // === Category Breakdown ===
  const categoryData = Object.entries(
    tasks.reduce((acc, t) => { const cat = t.category || "Uncategorized"; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([key, val]) => ({ name: key, count: val })).sort((a, b) => b.count - a.count);

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">Deep dive into your productivity data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <SummaryCard label="Total Tasks" value={stats.total} color="var(--accent)" />
        <SummaryCard label="Completed" value={stats.completed} color="#4ade80" />
        <SummaryCard label="Overdue" value={stats.overdue} color="#f87171" />
        <SummaryCard label="Projects" value={projects.length} color="#a78bfa" />
        <SummaryCard label="Goal Progress" value={`${avgGoalProgress}%`} color="#fbbf24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Task Status Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Task Status Distribution</h3>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={(val) => <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-[var(--text-muted)] text-center py-8">No task data yet</p>}
        </div>

        {/* Priority Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Priority Distribution</h3>
          {priorityData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                    {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-[var(--text-muted)] text-center py-8">No task data yet</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 14-Day Trend */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">14-Day Completion Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} /><stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="created" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#gradCreated)" name="Created" />
                <Area type="monotone" dataKey="completed" stroke="#4ade80" strokeWidth={2} fillOpacity={1} fill="url(#gradCompleted)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Pipeline */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Project Pipeline</h3>
          {projects.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectPipelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {projectPipelineData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-[var(--text-muted)] text-center py-8">No projects yet</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Radial */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 self-start">Goal Completion</h3>
          {goals.length > 0 ? (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="60%" outerRadius="100%" data={goalRadialData} startAngle={180} endAngle={0} cx="50%" cy="80%">
                    <RadialBar cornerRadius={10} dataKey="value" background={{ fill: 'rgba(255,255,255,0.05)' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-4">
                <p className="text-3xl font-black text-[var(--accent)]">{avgGoalProgress}%</p>
                <p className="text-xs text-[var(--text-muted)]">Average goal progress</p>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-8">No goals defined</p>
          )}
        </div>

        {/* Habit Weekly Consistency */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Habit Consistency (This Week)</h3>
          {habits.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitWeekData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, habits.length]} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="done" fill="#f472b6" radius={[6, 6, 0, 0]} barSize={24} name="Habits Done" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-[var(--text-muted)] text-center py-8">No habits set</p>}
        </div>

        {/* Category Breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Category Breakdown</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-2.5">
              {categoryData.map(cat => {
                const pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-primary)] font-medium">{cat.name}</span>
                      <span className="text-[var(--text-muted)]">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-[var(--text-muted)] text-center py-8">No task data yet</p>}
        </div>
      </div>
    </PageShell>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}
