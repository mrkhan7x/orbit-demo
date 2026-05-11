import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "@/types";

// ─────────────────────────────────────────────────────────
// GLOBAL STORE — App-wide state (theme, sidebar, user prefs)
// Each module has its OWN store. This only holds truly global state.
// ─────────────────────────────────────────────────────────

interface GlobalState {
  // Theme
  theme: Theme;
  accentColor: string;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // DB initialized flag
  dbReady: boolean;
  setDbReady: (ready: boolean) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      // Theme defaults
      theme: "dark",
      accentColor: "#7c6fff",
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },
      setAccentColor: (color) => {
        set({ accentColor: color });
        document.documentElement.style.setProperty("--accent", color);
      },

      // Sidebar defaults
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // DB
      dbReady: false,
      setDbReady: (ready) => set({ dbReady: ready }),
    }),
    {
      name: "orbit-global",
      // Only persist these keys — not transient state
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
