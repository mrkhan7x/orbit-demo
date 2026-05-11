import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, LayoutDashboard, CheckSquare, FolderOpen, Flame, Target,
  FileText, Calendar, BarChart2, Settings, Plus, Moon, Sun,
  Database, Command, ArrowRight, Download
} from "lucide-react";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useGoalStore } from "@/stores/goalStore";
import { useGlobalStore } from "@/stores/globalStore";
import { cn } from "@/utils/cn";

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ElementType;
  category: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { theme, setTheme, commandPaletteOpen: open, setCommandPaletteOpen: setOpen } = useGlobalStore();
  const { tasks, setCreateModal, setSelectedTask } = useTaskStore();
  const { projects } = useProjectStore();
  const { notes } = useNoteStore();
  const { goals } = useGoalStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) { setQuery(""); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const close = () => setOpen(false);

  // Export all data as JSON
  const exportData = () => {
    const data = { tasks, projects, notes, goals, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orbit-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    close();
  };

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];

    // Actions
    items.push(
      { id: "act-new-task", label: "Create New Task", icon: Plus, category: "Actions", shortcut: "N", action: () => { navigate("/tasks"); setCreateModal(true); close(); } },
      { id: "act-toggle-theme", label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`, icon: theme === "dark" ? Sun : Moon, category: "Actions", action: () => { setTheme(theme === "dark" ? "light" : "dark"); close(); } },
      { id: "act-export", label: "Export All Data (JSON)", icon: Download, category: "Actions", action: exportData },
    );

    // Navigation
    const navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { id: "tasks", label: "Tasks", icon: CheckSquare, path: "/tasks" },
      { id: "projects", label: "Projects", icon: FolderOpen, path: "/projects" },
      { id: "habits", label: "Habits", icon: Flame, path: "/habits" },
      { id: "goals", label: "Goals", icon: Target, path: "/goals" },
      { id: "notes", label: "Notes", icon: FileText, path: "/notes" },
      { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
      { id: "analytics", label: "Analytics", icon: BarChart2, path: "/analytics" },
      { id: "databases", label: "Databases", icon: Database, path: "/databases" },
      { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
    ];
    for (const n of navItems) {
      items.push({ id: `nav-${n.id}`, label: `Go to ${n.label}`, icon: n.icon, category: "Navigation", action: () => { navigate(n.path); close(); } });
    }

    // Search Results — only when there's a query
    if (query.trim().length >= 2) {
      const q = query.toLowerCase();

      // Search tasks
      const matchedTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      ).slice(0, 5);
      for (const t of matchedTasks) {
        const proj = projects.find(p => p.id === t.project_id);
        items.push({
          id: `task-${t.id}`, label: t.title,
          subtitle: [t.priority, proj?.name, t.due_date].filter(Boolean).join(" · "),
          icon: CheckSquare, category: "Tasks",
          action: () => { navigate("/tasks"); setSelectedTask(t.id); close(); },
        });
      }

      // Search notes
      const matchedNotes = notes.filter(n =>
        n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
      ).slice(0, 3);
      for (const n of matchedNotes) {
        items.push({
          id: `note-${n.id}`, label: n.title, subtitle: n.category,
          icon: FileText, category: "Notes",
          action: () => { navigate("/notes"); close(); },
        });
      }

      // Search goals
      const matchedGoals = goals.filter(g =>
        g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
      ).slice(0, 3);
      for (const g of matchedGoals) {
        items.push({
          id: `goal-${g.id}`, label: g.title, subtitle: `${g.progress}% complete`,
          icon: Target, category: "Goals",
          action: () => { navigate("/goals"); close(); },
        });
      }

      // Search projects
      const matchedProjects = projects.filter(p =>
        p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      ).slice(0, 3);
      for (const p of matchedProjects) {
        items.push({
          id: `proj-${p.id}`, label: `${p.icon} ${p.name}`, subtitle: p.status,
          icon: FolderOpen, category: "Projects",
          action: () => { navigate(`/projects?id=${p.id}`); close(); },
        });
      }
    } else {
      // When no query, show projects
      for (const p of projects) {
        items.push({
          id: `proj-${p.id}`, label: `${p.icon} ${p.name}`,
          icon: FolderOpen, category: "Projects",
          action: () => { navigate(`/projects?id=${p.id}`); close(); },
        });
      }
    }

    return items;
  }, [navigate, theme, setTheme, setCreateModal, setSelectedTask, projects, tasks, notes, goals, query]);

  // Filter commands by query (for non-search items)
  const filtered = query.trim()
    ? commands.filter(c =>
        c.category === "Tasks" || c.category === "Notes" || c.category === "Goals" || c.category === "Projects" ||
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && filtered[selectedIndex]) { e.preventDefault(); filtered[selectedIndex].action(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selectedIndex]);

  useEffect(() => { setSelectedIndex(0); }, [query]);
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.querySelector(`[data-index="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={close} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-lg"
          >
            <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <Search size={16} className="text-[var(--text-muted)] shrink-0" />
                <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, notes, projects or type a command..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none" />
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-[var(--text-muted)]">ESC</kbd>
              </div>

              <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[var(--text-muted)]">No results for "{query}"</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{category}</p>
                      {items.map((item) => {
                        flatIndex++;
                        const idx = flatIndex;
                        const isActive = idx === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <button key={item.id} data-index={idx} onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={cn("flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                              isActive ? "bg-[var(--accent-muted)]" : "hover:bg-white/5")}>
                            <Icon size={14} className={isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                            <div className="flex-1 min-w-0">
                              <span className={cn("text-sm block truncate", isActive ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]")}>
                                {item.label}
                              </span>
                              {item.subtitle && (
                                <span className="text-[10px] text-[var(--text-muted)] block truncate">{item.subtitle}</span>
                              )}
                            </div>
                            {item.shortcut && <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-[var(--text-muted)]">{item.shortcut}</kbd>}
                            {isActive && <ArrowRight size={12} className="text-[var(--accent)] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">↑↓</kbd> Navigate</span>
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">↵</kbd> Select</span>
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">ESC</kbd> Close</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                  <Command size={10} /> Orbit
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
