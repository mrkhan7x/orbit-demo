import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useGlobalStore } from "@/stores/globalStore";
import { initializeDatabase, wipeDatabase } from "@/database/db";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useHabitStore } from "@/stores/habitStore";
import { useGoalStore } from "@/stores/goalStore";
import { useNoteStore } from "@/stores/noteStore";
import { Spinner } from "@/components/ui/Progress";
import { ToastContainer } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

import { DashboardPage }  from "@/modules/dashboard/DashboardPage";
import { TasksPage }      from "@/modules/tasks/TasksPage";
import { ProjectsPage }   from "@/modules/projects/ProjectsPage";
import { HabitsPage }     from "@/modules/habits/HabitsPage";
import { GoalsPage }      from "@/modules/goals/GoalsPage";
import { NotesPage }      from "@/modules/notes/NotesPage";
import { CalendarPage }   from "@/modules/calendar/CalendarPage";
import { DatabasesPage }  from "@/modules/database/DatabasesPage";
import { AnalyticsPage }  from "@/modules/analytics/AnalyticsPage";
import { SettingsPage }   from "@/modules/settings/SettingsPage";
import { CommandPalette } from "@/components/CommandPalette";

export default function App() {
  const { theme, accentColor } = useGlobalStore();
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const loadHabits = useHabitStore((s) => s.loadHabits);
  const loadGoals = useGoalStore((s) => s.loadGoals);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Apply persisted theme + accent on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [theme, accentColor]);

  // Initialize SQLite database on startup
  useEffect(() => {
    async function boot() {
      try {
        await initializeDatabase();
        await Promise.all([
          loadTasks(), 
          loadProjects(),
          loadHabits(),
          loadGoals(),
          loadNotes(),
        ]);
        setDbReady(true);
      } catch (e) {
        console.error("[Orbit] DB init failed:", e);
        setDbError(String(e));
      }
    }
    boot();
  }, [loadTasks, loadProjects, loadHabits, loadGoals, loadNotes]);

  // Loading screen while DB initializes
  if (!dbReady && !dbError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center"
        style={{ background: "var(--bg-app)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))" }}>
            <span className="text-white text-lg font-bold">O</span>
          </div>
          <Spinner size="md" />
          <p className="text-xs text-[var(--text-muted)]">Loading Orbit…</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center"
        style={{ background: "var(--bg-app)" }}>
        <div className="card p-8 max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))" }}>
            <span className="text-white text-2xl font-bold">O</span>
          </div>
          <p className="text-base font-semibold text-red-400">Failed to start Orbit</p>
          <p className="text-sm text-[var(--text-muted)]">
            Orbit could not initialize its local database. Please try closing and reopening the app.
            If the problem persists, contact support.
          </p>
          <p className="text-xs text-[var(--text-muted)] font-mono bg-black/20 rounded-lg p-3 text-left break-all">
            {dbError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="flex h-screen w-screen overflow-hidden select-none">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <TopBar />
            <Routes>
              <Route path="/"           element={<DashboardPage />} />
              <Route path="/tasks"      element={<TasksPage />} />
              <Route path="/projects"   element={<ProjectsPage />} />
              <Route path="/habits"     element={<HabitsPage />} />
              <Route path="/goals"      element={<GoalsPage />} />
              <Route path="/notes"      element={<NotesPage />} />
              <Route path="/calendar"   element={<CalendarPage />} />
              <Route path="/databases"  element={<DatabasesPage />} />
              <Route path="/analytics"  element={<AnalyticsPage />} />
              <Route path="/settings"   element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
        <ToastContainer />
        <CommandPalette />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
