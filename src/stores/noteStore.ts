import { create } from "zustand";
import { Note, getNotes, createNote, updateNote, deleteNote } from "@/services/noteService";
import { runAsyncAction, AsyncState, initialAsyncState } from "@/lib/asyncWrapper";

interface NoteState extends AsyncState {
  notes: Note[];
  activeCategory: Note["category"];
  setActiveCategory: (cat: Note["category"]) => void;
  loadNotes: () => Promise<void>;
  addNote: (data: Partial<Note>) => Promise<void>;
  editNote: (id: string, data: Partial<Note>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  ...initialAsyncState,
  notes: [],
  activeCategory: "all",

  setActiveCategory: (cat) => set({ activeCategory: cat }),

  loadNotes: async () => {
    await runAsyncAction("Notes", "Load Notes", set, async () => {
      const notes = await getNotes();
      set({ notes });
    });
  },

  addNote: async (data: Partial<Note>) => {
    await runAsyncAction("Notes", "Add Note", set, async () => {
      const cat = data.category || (get().activeCategory === "all" ? "notes" : get().activeCategory);
      const newNote = await createNote({ ...data, category: cat });
      set((s) => ({ notes: [newNote, ...s.notes] }));
    });
  },

  editNote: async (id: string, data: Partial<Note>) => {
    const prev = get().notes;
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));

    await runAsyncAction(
      "Notes",
      "Edit Note",
      set,
      async () => {
        await updateNote(id, data);
      },
      () => set({ notes: prev })
    );
  },

  removeNote: async (id: string) => {
    const prev = get().notes;
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));

    await runAsyncAction(
      "Notes",
      "Delete Note",
      set,
      async () => {
        await deleteNote(id);
      },
      () => set({ notes: prev })
    );
  },
}));
