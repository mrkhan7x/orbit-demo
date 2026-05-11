import { create } from "zustand";
import type { Project } from "@/services/projectService";
import * as projectService from "@/services/projectService";

interface ProjectState {
  projects: Project[];
  loading: boolean;
  activeProjectId: string | null;

  loadProjects: () => Promise<void>;
  createProject: (data: Parameters<typeof projectService.createProject>[0]) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;
  getByStatus: (status: Project["status"]) => Project[];
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  activeProjectId: null,

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await projectService.getProjects();
      set({ projects, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    const project = await projectService.createProject(data);
    set((s) => ({ projects: [...s.projects, project] }));
  },

  updateProject: async (id, data) => {
    await projectService.updateProject(id, data);
    set((s) => ({
      projects: s.projects.map((p) => p.id === id ? { ...p, ...data } : p),
    }));
  },

  deleteProject: async (id) => {
    await projectService.deleteProject(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  getByStatus: (status) => get().projects.filter((p) => p.status === status),
}));
