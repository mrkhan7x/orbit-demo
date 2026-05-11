import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Settings, Moon, Sun, Palette, User, AlertTriangle, Keyboard, Database, Info, Save, Upload, Download } from "lucide-react";
import { useGlobalStore } from "@/stores/globalStore";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useHabitStore } from "@/stores/habitStore";
import { useGoalStore } from "@/stores/goalStore";
import { useNoteStore } from "@/stores/noteStore";
import { wipeDatabase } from "@/database/db";
import { importTasksFromCSV } from "@/services/taskService";

const ACCENT_COLORS = [
  { label: "Purple",  value: "#7c6fff" },
  { label: "Blue",    value: "#60a5fa" },
  { label: "Teal",    value: "#2dd4bf" },
  { label: "Green",   value: "#4ade80" },
  { label: "Orange",  value: "#fb923c" },
  { label: "Pink",    value: "#f472b6" },
  { label: "Red",     value: "#f87171" },
  { label: "Indigo",  value: "#818cf8" },
];

const SHORTCUTS = [
  { keys: "Ctrl + K", action: "Open Command Palette" },
  { keys: "N",        action: "New Task (on Tasks page)" },
  { keys: "Esc",      action: "Close panel / modal" },
  { keys: "↑ ↓",      action: "Navigate lists" },
  { keys: "Enter",    action: "Select / confirm" },
];

export function SettingsPage() {
  const { theme, setTheme, accentColor, setAccentColor } = useGlobalStore();
  const tasks = useTaskStore(s => s.tasks);
  const projects = useProjectStore(s => s.projects);
  const habits = useHabitStore(s => s.habits);
  const goals = useGoalStore(s => s.goals);
  const notes = useNoteStore(s => s.notes);

  const [userName, setUserName] = useState("Romeo");
  const [userEmail, setUserEmail] = useState("romeo@orbit.app");
  const [editing, setEditing] = useState(false);

  const handleWipeData = async () => {
    const confirm = window.confirm("WARNING: This will permanently delete ALL your data. You cannot undo this. Are you sure?");
    if (!confirm) return;
    const confirm2 = window.prompt("Type 'DELETE' to confirm:");
    if (confirm2 !== "DELETE") { alert("Cancelled."); return; }
    try {
      await wipeDatabase();
      alert("Database wiped. Restarting...");
      window.location.reload();
    } catch (e) {
      alert("Failed: " + e);
    }
  };

  return (
    <PageShell>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings & Account</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your Orbit workspace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">

        {/* Left Column */}
        <div className="space-y-6">
          {/* Account */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Account</p>
            </div>

            <div className="flex items-center gap-4 mb-5 p-4 rounded-lg bg-[var(--bg-secondary)] border border-white/5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: accentColor }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              {editing ? (
                <div className="flex-1 space-y-2">
                  <input
                    value={userName} onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-white/10 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    placeholder="Your name"
                  />
                  <input
                    value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-white/10 text-xs text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                    placeholder="Your email"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">{userName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{userEmail}</p>
                </div>
              )}
              <button
                onClick={() => setEditing(!editing)}
                className="px-3 py-1.5 rounded bg-[var(--bg-hover)] text-xs text-[var(--text-primary)] hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                {editing ? <><Save size={12} /> Save</> : "Edit"}
              </button>
            </div>

            <div className="space-y-2">
              <label className="w-full text-left p-3 rounded-lg bg-[var(--bg-app)] border border-white/5 text-sm text-[var(--text-secondary)] hover:border-white/10 transition-colors flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2"><Upload size={14} /> Import Tasks from CSV (Notion)</span>
                <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  const count = await importTasksFromCSV(text);
                  alert(`Imported ${count} tasks successfully!`);
                  window.location.reload();
                }} />
              </label>
              <button
                onClick={() => {
                  const data = { tasks, projects, habits, goals, notes, exportedAt: new Date().toISOString() };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = `orbit-backup-${new Date().toISOString().split("T")[0]}.json`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                className="w-full text-left p-3 rounded-lg bg-[var(--bg-app)] border border-white/5 text-sm text-[var(--text-secondary)] hover:border-white/10 transition-colors flex items-center gap-2"
              >
                <Download size={14} /> Export All Data (JSON)
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={16} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Appearance</p>
            </div>

            <div className="mb-5">
              <p className="text-xs text-[var(--text-muted)] mb-2">Theme</p>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t} onClick={() => setTheme(t)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-all flex-1 justify-center"
                    style={{
                      background: theme === t ? "var(--accent-muted)" : "transparent",
                      borderColor: theme === t ? accentColor : "rgba(255,255,255,0.1)",
                      color: theme === t ? accentColor : "var(--text-muted)",
                    }}
                  >
                    {t === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                    {t === "dark" ? "Dark" : "Light"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Accent Color</p>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.value} onClick={() => setAccentColor(c.value)} title={c.label}
                    className="w-8 h-8 rounded-full transition-all border-2 hover:scale-110"
                    style={{
                      background: c.value,
                      borderColor: accentColor === c.value ? "white" : "transparent",
                      transform: accentColor === c.value ? "scale(1.2)" : "scale(1)",
                      boxShadow: accentColor === c.value ? `0 0 12px ${c.value}40` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Keyboard size={16} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</p>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-xs text-[var(--text-secondary)]">{s.action}</span>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-[var(--text-muted)]">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Data Stats */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={16} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Your Data</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Tasks", count: tasks.length, color: "#60a5fa" },
                { label: "Projects", count: projects.length, color: "#4ade80" },
                { label: "Habits", count: habits.length, color: "#f472b6" },
                { label: "Goals", count: goals.length, color: "#fbbf24" },
                { label: "Notes", count: notes.length, color: "#a78bfa" },
              ].map(d => (
                <div key={d.label} className="p-3 rounded-lg bg-[var(--bg-secondary)] text-center">
                  <p className="text-2xl font-black" style={{ color: d.color }}>{d.count}</p>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mt-1">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">About Orbit</p>
            </div>
            <div className="space-y-1 text-xs text-[var(--text-muted)]">
              <p>Version: <span className="text-[var(--text-primary)] font-semibold">1.0.0</span></p>
              <p>Stack: Tauri · React · TypeScript · Tailwind · Zustand</p>
              <p>Database: SQLite (local, offline-first)</p>
              <p>Charts: Recharts</p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card p-5 border border-red-500/20 bg-red-500/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-500" />
              <p className="text-sm font-semibold text-red-400">Danger Zone</p>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
              Permanently delete all data. This action cannot be undone.
            </p>
            <button
              onClick={handleWipeData}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              Wipe All Data
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
