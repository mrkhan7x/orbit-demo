import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, FolderOpen, Rocket } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useTaskStore } from "@/stores/taskStore";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { cn } from "@/utils/cn";
import type { Project } from "@/services/projectService";

type ProjectView = "active" | "planned" | "on_hold" | "completed" | "all";

const VIEW_TABS: { id: ProjectView; label: string }[] = [
  { id: "active",    label: "Active" },
  { id: "planned",   label: "Planned" },
  { id: "on_hold",   label: "On Hold" },
  { id: "completed", label: "Completed" },
  { id: "all",       label: "All" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: "Doing",     color: "#4ade80" },
  planned:   { label: "Planned",   color: "#60a5fa" },
  on_hold:   { label: "On Hold",   color: "#fbbf24" },
  completed: { label: "Done",      color: "#a78bfa" },
};

export function ProjectsPage() {
  const { projects, loadProjects } = useProjectStore();
  const { tasks } = useTaskStore();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ProjectView>("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Auto-select project from URL query param
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && projects.length > 0) {
      setSelectedProjectId(idParam);
      // Switch to the view that contains this project
      const proj = projects.find(p => p.id === idParam);
      if (proj) setView(proj.status as ProjectView);
    }
  }, [searchParams, projects]);

  // Filter projects by view
  const filteredProjects = view === "all" ? projects : projects.filter(p => p.status === view);

  // Group by status for "all" view
  const statusOrder: Project["status"][] = ["active", "planned", "on_hold", "completed"];
  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = filteredProjects.filter(p => p.status === status);
    return acc;
  }, {} as Record<string, Project[]>);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // Get task counts for a project
  const getProjectTaskStats = (projectId: string) => {
    const pTasks = tasks.filter(t => t.project_id === projectId);
    return {
      total: pTasks.length,
      active: pTasks.filter(t => t.status !== "completed").length,
      completed: pTasks.filter(t => t.status === "completed").length,
    };
  };

  const renderProjectCard = (project: Project) => {
    const stats = getProjectTaskStats(project.id);
    const statusConf = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
      <button
        key={project.id}
        onClick={() => setSelectedProjectId(project.id)}
        className={cn(
          "w-full text-left p-4 rounded-xl border transition-all hover:-translate-y-0.5 group",
          selectedProjectId === project.id
            ? "bg-[var(--accent-muted)] border-[var(--accent)]/30"
            : "bg-[var(--bg-card)] border-white/5 hover:border-white/10"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.icon}</span>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {project.name}
              </p>
              {project.description && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: `${statusConf.color}20`, color: statusConf.color }}
          >
            {statusConf.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span>{stats.active} Active</span>
            <span className="opacity-30">·</span>
            <span>{stats.total} Total Tasks</span>
          </div>
          {stats.total > 0 && (
            <span className="text-xs font-semibold text-[var(--text-primary)]">{progress}%</span>
          )}
        </div>

        {stats.total > 0 && (
          <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: statusConf.color }}
            />
          </div>
        )}

        {stats.total === 0 && (
          <p className="text-[10px] text-[var(--text-muted)] mt-2 opacity-60">No Tasks Created</p>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <div className={cn("flex flex-col flex-1 min-w-0 overflow-hidden", selectedProject && "border-r border-white/5")}>
        {/* Header */}
        <div className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent-muted)]">
                <Rocket size={20} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Projects</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {projects.length} projects · {projects.filter(p => p.status === "active").length} active
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={14} />
              New Project
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-3 scrollbar-hide">
            {VIEW_TABS.map(({ id, label }) => {
              const isActive = view === id;
              const count = id === "all" ? projects.length : projects.filter(p => p.status === id).length;
              return (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
                    isActive
                      ? "bg-[var(--bg-card)] text-[var(--text-primary)] border border-white/10"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
                  )}
                >
                  {label}
                  {count > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {view === "all" ? "No projects yet" : `No ${view.replace("_", " ")} projects`}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Click "New Project" to create one
              </p>
            </div>
          ) : view === "all" ? (
            // Grouped view
            <div className="space-y-6 pt-2">
              {statusOrder.filter(s => grouped[s]?.length > 0).map(status => (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: STATUS_CONFIG[status]?.color }} />
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {STATUS_CONFIG[status]?.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] opacity-50">{grouped[status].length}</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {grouped[status].map(renderProjectCard)}
                  </div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-2 py-2 mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Plus size={12} /> New page
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Flat view
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredProjects.map(renderProjectCard)}
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-2 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                <Plus size={12} /> New page
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          onClose={() => setSelectedProjectId(null)}
        />
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultStatus={view !== "all" ? view as any : "planned"}
      />
    </div>
  );
}
