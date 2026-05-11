import { create } from "zustand";
import type { Task, Priority, Status } from "@/types";
import * as taskService from "@/services/taskService";

// ─────────────────────────────────────────────────────────
// TASK STORE — Zustand state connected to SQLite.
// Components never call taskService directly.
// Components call store actions → store calls service → SQLite.
// ─────────────────────────────────────────────────────────

interface TaskFilters {
  status?: Status | "all";
  priority?: Priority | "all";
  search?: string;
  projectId?: string;
  view: "all" | "today" | "inbox" | "week" | "month" | "scheduled" | "no_due" | "recurring" | "active_projects" | "completed" | "overdue";
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
  selectedTaskId: string | null;
  createModalOpen: boolean;

  // Actions
  loadTasks: () => Promise<void>;
  createTask: (data: Parameters<typeof taskService.createTask>[0]) => Promise<Task>;
  updateTask: (id: string, data: Parameters<typeof taskService.updateTask>[1]) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  searchTasks: (query: string) => Promise<void>;

  // UI actions
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSelectedTask: (id: string | null) => void;
  setCreateModal: (open: boolean) => void;

  // Computed helpers
  getFilteredTasks: () => Task[];
  getStats: () => { total: number; completed: number; overdue: number; dueToday: number };
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  filters: { view: "all", status: "all", priority: "all", search: "" },
  selectedTaskId: null,
  createModalOpen: false,

  /** Load all tasks from SQLite into store */
  loadTasks: async () => {
    set({ loading: true, error: null });
    try {
      // Process recurring tasks first (auto-spawn new instances)
      await taskService.processRecurringTasks();
      const tasks = await taskService.getTasks();
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  /** Create task → persist → add to store optimistically */
  createTask: async (data) => {
    const task = await taskService.createTask(data);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  /** Update task → persist → update in store */
  updateTask: async (id, data) => {
    await taskService.updateTask(id, data);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t
      ),
    }));
  },

  /** Toggle completed ↔ not_started */
  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    // Optimistic update
    const newStatus: Status =
      task.status === "completed" ? "not_started" : "completed";
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : undefined }
          : t
      ),
    }));
    // Persist
    await taskService.toggleTask(id, task.status);
  },

  /** Delete task → remove from store */
  deleteTask: async (id) => {
    await taskService.deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  /** Search — replaces full task list with results */
  searchTasks: async (query) => {
    if (!query.trim()) {
      get().loadTasks();
      return;
    }
    const tasks = await taskService.searchTasks(query);
    set({ tasks });
  },

  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),

  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setCreateModal: (open) => set({ createModalOpen: open }),

  /** Apply filters to task list — computed, no extra SQL */
  getFilteredTasks: () => {
    const { tasks, filters } = get();
    const today = new Date().toISOString().split("T")[0];

    return tasks.filter((t) => {
      // View filter
      if (filters.view === "today") {
        if (!t.due_date || !t.due_date.startsWith(today)) return false;
      }
      if (filters.view === "scheduled") {
        if (!t.due_date) return false;
      }
      if (filters.view === "no_due") {
        if (t.due_date) return false;
      }
      if (filters.view === "completed") {
        if (t.status !== "completed") return false;
      }
      if (filters.view === "overdue") {
        if (!t.is_overdue) return false;
      }

      // Status filter
      if (filters.status && filters.status !== "all") {
        if (t.status !== filters.status) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== "all") {
        if (t.priority !== filters.priority) return false;
      }

      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.description?.toLowerCase().includes(q)
        )
          return false;
      }

      return true;
    });
  },

  /** Dashboard stats */
  getStats: () => {
    const { tasks } = get();
    const today = new Date().toISOString().split("T")[0];
    return {
      total:     tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      overdue:   tasks.filter((t) => t.is_overdue).length,
      dueToday:  tasks.filter(
        (t) => t.due_date?.startsWith(today) && t.status !== "completed"
      ).length,
    };
  },
}));
