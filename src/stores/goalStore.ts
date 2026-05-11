import { create } from "zustand";
import { Goal, getGoals, createGoal, updateGoal, deleteGoal } from "@/services/goalService";
import { runAsyncAction, AsyncState, initialAsyncState } from "@/lib/asyncWrapper";

interface GoalState extends AsyncState {
  goals: Goal[];
  loadGoals: () => Promise<void>;
  addGoal: (data: Partial<Goal>) => Promise<void>;
  editGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  ...initialAsyncState,
  goals: [],

  loadGoals: async () => {
    await runAsyncAction("Goals", "Load Goals", set, async () => {
      const goals = await getGoals();
      set({ goals });
    });
  },

  addGoal: async (data: Partial<Goal>) => {
    await runAsyncAction("Goals", "Add Goal", set, async () => {
      const newGoal = await createGoal(data);
      set((s) => ({ goals: [...s.goals, newGoal] }));
    });
  },

  editGoal: async (id: string, data: Partial<Goal>) => {
    const prev = get().goals;
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
    }));

    await runAsyncAction(
      "Goals",
      "Edit Goal",
      set,
      async () => {
        await updateGoal(id, data);
      },
      () => set({ goals: prev })
    );
  },

  removeGoal: async (id: string) => {
    const prev = get().goals;
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));

    await runAsyncAction(
      "Goals",
      "Delete Goal",
      set,
      async () => {
        await deleteGoal(id);
      },
      () => set({ goals: prev })
    );
  },
}));
