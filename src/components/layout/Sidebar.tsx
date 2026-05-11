import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, Flame, Target, FileText,
  Calendar, Database, BarChart2, Settings, ChevronLeft,
  FolderOpen, Plus, ChevronDown, Orbit
} from "lucide-react";
import { useGlobalStore } from "@/stores/globalStore";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { ProjectModal } from "@/components/modals/ProjectModal";

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard, path: "/" },
  { id: "tasks",      label: "Tasks",      icon: CheckSquare,     path: "/tasks" },
  { id: "projects",   label: "Projects",   icon: FolderOpen,      path: "/projects" },
  { id: "habits",     label: "Habits",     icon: Flame,           path: "/habits" },
  { id: "goals",      label: "Goals",      icon: Target,          path: "/goals" },
  { id: "notes",      label: "Notes",      icon: FileText,        path: "/notes" },
  { id: "calendar",   label: "Calendar",   icon: Calendar,        path: "/calendar" },
  { id: "databases",  label: "Databases",  icon: Database,        path: "/databases" },
  { id: "analytics",  label: "Analytics",  icon: BarChart2,       path: "/analytics" },
];

const STATUS_LABELS: Record<string, string> = {
  active:    "Doing",
  planned:   "Planned",
  on_hold:   "On Hold",
  completed: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "#4ade80",
  planned:   "#60a5fa",
  on_hold:   "#fbbf24",
  completed: "#a0a0c0",
};

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useGlobalStore();
  const { projects } = useProjectStore();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const navigate = useNavigate();

  // Group projects by status
  const grouped = projects.reduce<Record<string, typeof projects>>((acc, p) => {
    if (!acc[p.status]) acc[p.status] = [];
    acc[p.status].push(p);
    return acc;
  }, {});

  const statusOrder = ["active", "planned", "on_hold", "completed"];

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full shrink-0 overflow-hidden"
      style={{ background: "var(--bg-panel)", borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))" }}
            onClick={() => navigate("/")}
          >
            <Orbit size={14} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
                className="font-semibold text-sm tracking-wide text-[var(--text-primary)]"
              >
                Orbit
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="py-3 px-2 space-y-0.5 shrink-0">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id} to={path} end={path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 h-9 px-2 rounded-lg transition-all duration-150 group relative",
                isActive
                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div layoutId="nav-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
                <Icon size={16} className="shrink-0 ml-1" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }} className="text-sm font-medium truncate">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Projects Panel — always visible when sidebar expanded */}
      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Projects Header */}
          <button
            onClick={() => setProjectsExpanded((v) => !v)}
            className="flex items-center justify-between w-full px-2 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FolderOpen size={12} />
              <span>Projects</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsProjectModalOpen(true); }}
                className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10 transition-all"
                title="New project"
              >
                <Plus size={10} />
              </button>
              <motion.div animate={{ rotate: projectsExpanded ? 0 : -90 }} transition={{ duration: 0.15 }}>
                <ChevronDown size={11} />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {projectsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {statusOrder.filter(s => grouped[s]?.length).map((status) => (
                  <div key={status} className="mb-3">
                    {/* Status group label */}
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] opacity-60">{grouped[status].length}</span>
                    </div>
                    {/* Project items */}
                    {grouped[status].map((project) => (
                      <button
                        key={project.id}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all text-left"
                        onClick={() => navigate(`/projects?id=${project.id}`)}
                        title={project.name}
                      >
                        <span className="text-sm shrink-0">{project.icon}</span>
                        <span className="truncate">{project.name}</span>
                        {(project.task_count ?? 0) > 0 && (
                          <span className="ml-auto text-[10px] text-[var(--text-muted)] shrink-0">
                            {project.task_count}
                          </span>
                        )}
                      </button>
                    ))}
                    {/* Add new page */}
                    <button 
                      onClick={() => setIsProjectModalOpen(true)}
                      className="flex items-center gap-2 px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors w-full"
                    >
                      <Plus size={10} />
                      New page
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Settings at bottom */}
      <div className="px-2 py-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <NavLink to="/settings"
          className={({ isActive }) =>
            cn("flex items-center gap-3 h-9 px-2 rounded-lg transition-all duration-150 group relative",
              isActive ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]")
          }
        >
          <Settings size={16} className="shrink-0 ml-1" />
          {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
        </NavLink>

        {/* Collapse Toggle */}
        <button onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all mt-1"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={15} />
          </motion.div>
        </button>
      </div>

      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
      />
    </motion.aside>
  );
}
