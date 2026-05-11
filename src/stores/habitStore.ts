import { create } from "zustand";
import { Habit, HabitLog, getHabits, createHabit, updateHabit, deleteHabit, getHabitLogs, toggleHabitLog } from "@/services/habitService";
import { runAsyncAction, AsyncState, initialAsyncState } from "@/lib/asyncWrapper";

interface HabitState extends AsyncState {
  habits: Habit[];
  logs: HabitLog[];
  loadHabits: () => Promise<void>;
  loadLogs: (startDate: string, endDate: string) => Promise<void>;
  addHabit: (data: Partial<Habit>) => Promise<void>;
  editHabit: (id: string, data: Partial<Habit>) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleLog: (habitId: string, date: string, completed: boolean) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  ...initialAsyncState,
  habits: [],
  logs: [],

  loadHabits: async () => {
    await runAsyncAction("Habits", "Load Habits", set, async () => {
      const habits = await getHabits();
      set({ habits });
    });
  },

  loadLogs: async (startDate: string, endDate: string) => {
    await runAsyncAction("Habits", "Load Logs", set, async () => {
      const logs = await getHabitLogs(startDate, endDate);
      set({ logs });
    });
  },

  addHabit: async (data: Partial<Habit>) => {
    await runAsyncAction("Habits", "Add Habit", set, async () => {
      const newHabit = await createHabit(data);
      set((s) => ({ habits: [...s.habits, newHabit] }));
    });
  },

  editHabit: async (id: string, data: Partial<Habit>) => {
    const prev = get().habits;
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...data } : h)),
    }));

    await runAsyncAction(
      "Habits",
      "Edit Habit",
      set,
      async () => {
        await updateHabit(id, data);
      },
      () => set({ habits: prev })
    );
  },

  removeHabit: async (id: string) => {
    const prev = get().habits;
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));

    await runAsyncAction(
      "Habits",
      "Delete Habit",
      set,
      async () => {
        await deleteHabit(id);
      },
      () => set({ habits: prev })
    );
  },

  toggleLog: async (habitId: string, date: string, completed: boolean) => {
    const prevLogs = get().logs;
    const existingIndex = prevLogs.findIndex(l => l.habit_id === habitId && l.date === date);
    
    // Optimistic UI
    if (existingIndex >= 0) {
      const newLogs = [...prevLogs];
      newLogs[existingIndex] = { ...newLogs[existingIndex], completed: completed ? 1 : 0 };
      set({ logs: newLogs });
    } else {
      set({ logs: [...prevLogs, { id: 'temp', habit_id: habitId, date, completed: completed ? 1 : 0 }] });
    }

    await runAsyncAction(
      "Habits",
      "Toggle Habit Log",
      set,
      async () => {
        const updatedLog = await toggleHabitLog(habitId, date, completed);
        set((s) => {
          // Replace temp log with real log from DB
          const currentLogs = s.logs.filter(l => !(l.habit_id === habitId && l.date === date));
          return { logs: [...currentLogs, updatedLog] };
        });
      },
      () => set({ logs: prevLogs }) // Rollback on error
    );
  },
}));
